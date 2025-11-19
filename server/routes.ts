import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzePestImage, getTreatmentRecommendations, generateEmbedding, searchSpeciesWithAI } from "./gemini";
import { generateDiseaseInfoWithCerebras } from "./cerebras";
import { detectWithFallback, checkMLServiceHealth } from "./ml-service";
import { insertDetectionSchema, insertPrototypeSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // GET /api/ml-health - Check ML service status
  app.get("/api/ml-health", async (_req, res) => {
    try {
      const health = await checkMLServiceHealth();
      return res.json(health);
    } catch (error) {
      return res.status(503).json({
        status: "unavailable",
        model_loaded: false,
        num_classes: 0,
        error: "ML service is not running"
      });
    }
  });

  // POST /api/detect - Analyze pest image (now using ML service with OpenAI fallback)
  app.post("/api/detect", async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image || typeof image !== "string") {
        return res.status(400).json({ error: "Image is required" });
      }

      console.log("Received image, length:", image.length);
      console.log("Image starts with:", image.substring(0, 50));

      // Try ML service first, fallback to Gemini
      const result = await detectWithFallback(image, process.env.GEMINI_API_KEY);
      console.log("Detection result from ML:", result);

      // Check if disease info is missing or incomplete (from Learn New or unknown disease)
      const needsAIGeneration = 
        !result.symptoms || 
        result.symptoms.length === 0 || 
        result.symptoms[0] === "Information not available for this disease" ||
        result.confidence < 0.6; // Only use AI for very low confidence (< 60%)

      let aiGeneratedInfo = null;
      
      if (needsAIGeneration) {
        console.log(`[CEREBRAS-AI] Generating disease info for: ${result.disease_name} (confidence: ${result.confidence})`);
        try {
          const cerebrasInfo = await generateDiseaseInfoWithCerebras(result.disease_name, result.confidence);
          aiGeneratedInfo = {
            plant: cerebrasInfo.plant,
            pathogenType: cerebrasInfo.pathogen_type,
            pathogenName: cerebrasInfo.pathogen_name,
            symptoms: cerebrasInfo.symptoms,
            treatmentDetails: cerebrasInfo.treatment,
            prevention: cerebrasInfo.prevention,
            prognosis: cerebrasInfo.prognosis,
            spreadRisk: cerebrasInfo.spread_risk
          };
          console.log("[CEREBRAS-AI] Successfully generated disease info using Qwen 3 235B");
        } catch (error) {
          console.error("[CEREBRAS-AI] Failed to generate disease info:", error);
          // Continue with ML result even if Cerebras fails
        }
      } else {
        console.log(`[DETECTION] Skipping AI generation (confidence: ${result.confidence >= 0.6 ? 'good' : 'low'})`);
      }

      // Convert to our schema format
      const analysis = {
        pestName: result.disease_name,
        confidence: result.confidence,
        riskLevel: result.severity.toLowerCase().includes("critical") ? "critical" :
                   result.severity.toLowerCase().includes("high") ? "high" :
                   result.severity.toLowerCase().includes("medium") ? "medium" : 
                   result.severity.toLowerCase().includes("none") ? "low" : "medium",
        similarSpecies: [],
        treatments: result.severity.toLowerCase().includes("healthy") || result.severity.toLowerCase().includes("none") ? 
          ["No treatment needed - plant is healthy!"] : 
          ["Consult disease information below for treatment recommendations"],
        source: result.source, // Track if ML or OpenAI was used
        // Extended disease information - use AI if available, otherwise use ML result
        plant: aiGeneratedInfo?.plant || result.plant,
        pathogenType: aiGeneratedInfo?.pathogenType || result.pathogen_type,
        pathogenName: aiGeneratedInfo?.pathogenName || result.pathogen_name,
        symptoms: aiGeneratedInfo?.symptoms || result.symptoms,
        treatmentDetails: aiGeneratedInfo?.treatmentDetails || result.treatment,
        prevention: aiGeneratedInfo?.prevention || result.prevention,
        prognosis: aiGeneratedInfo?.prognosis || result.prognosis,
        spreadRisk: aiGeneratedInfo?.spreadRisk || result.spread_risk,
        aiGenerated: !!aiGeneratedInfo
      };

      // Validate with drizzle-zod schema
      const detectionData = insertDetectionSchema.safeParse({
        imageUrl: image,
        pestName: analysis.pestName,
        confidence: analysis.confidence,
        riskLevel: analysis.riskLevel,
        similarSpecies: analysis.similarSpecies,
        treatments: analysis.treatments,
        plant: analysis.plant,
        pathogenType: analysis.pathogenType,
        pathogenName: analysis.pathogenName,
        symptoms: analysis.symptoms,
        treatmentDetails: analysis.treatmentDetails,
        prevention: analysis.prevention,
        prognosis: analysis.prognosis,
        spreadRisk: analysis.spreadRisk
      });

      if (!detectionData.success) {
        const validationError = fromZodError(detectionData.error);
        return res.status(400).json({ error: validationError.message });
      }

      // Store detection record
      const detection = await storage.createDetection(detectionData.data);
      console.log("Stored detection:", JSON.stringify(detection, null, 2));

      // Build final response with all fields
      const response = {
        ...detection,
        plant: detection.plant || analysis.plant,
        pathogenType: detection.pathogenType || analysis.pathogenType,
        pathogenName: detection.pathogenName || analysis.pathogenName,
        symptoms: detection.symptoms || analysis.symptoms,
        treatmentDetails: detection.treatmentDetails || analysis.treatmentDetails,
        prevention: detection.prevention || analysis.prevention,
        prognosis: detection.prognosis || analysis.prognosis,
        spreadRisk: detection.spreadRisk || analysis.spreadRisk,
        ml_service_used: result.source === "ml",
        ai_generated: analysis.aiGenerated
      };
      
      console.log("Final response:", JSON.stringify(response, null, 2));
      return res.json(response);
    } catch (error) {
      console.error("Detection error:", error);
      return res.status(500).json({ error: "Failed to detect pest" });
    }
  });

  // GET /api/detections - Get all detections
  app.get("/api/detections", async (_req, res) => {
    try {
      const detections = await storage.getAllDetections();
      return res.json(detections);
    } catch (error) {
      console.error("Get detections error:", error);
      return res.status(500).json({ error: "Failed to fetch detections" });
    }
  });

  // GET /api/species - Get all species
  app.get("/api/species", async (_req, res) => {
    try {
      const species = await storage.getAllSpecies();
      return res.json(species);
    } catch (error) {
      console.error("Get species error:", error);
      return res.status(500).json({ error: "Failed to fetch species" });
    }
  });

  // GET /api/species/:id - Get species by ID
  app.get("/api/species/:id", async (req, res) => {
    try {
      const species = await storage.getSpecies(req.params.id);
      if (!species) {
        return res.status(404).json({ error: "Species not found" });
      }
      return res.json(species);
    } catch (error) {
      console.error("Get species error:", error);
      return res.status(500).json({ error: "Failed to fetch species" });
    }
  });

  // POST /api/species/search - AI-powered species search
  app.post("/api/species/search", async (req, res) => {
    try {
      const { query } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Search query is required" });
      }

      console.log(`[SPECIES-SEARCH] Searching for: "${query}"`);

      // First, try searching the database
      const dbResults = await storage.searchSpecies(query);
      
      if (dbResults.length > 0) {
        console.log(`[SPECIES-SEARCH] Found ${dbResults.length} results in database`);
        return res.json({
          query,
          results: dbResults,
          source: "database"
        });
      }

      // If no database results and OpenAI key available, use AI search
      if (process.env.GEMINI_API_KEY) {
        console.log(`[SPECIES-SEARCH] No database results, using AI for: "${query}"`);
        const aiResults = await searchSpeciesWithAI(query);
        
        console.log(`[SPECIES-SEARCH] AI generated ${aiResults.length} results`);

        // Convert AI results to Species format
        const formattedResults = aiResults.map((ai) => ({
          id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: ai.name,
          scientificName: ai.scientificName,
          category: ai.category,
          description: ai.description,
          riskLevel: ai.riskLevel,
          commonCrops: ai.commonCrops,
          taxonomy: ai.taxonomy,
          imageUrl: null,
        }));

        return res.json({
          query,
          results: formattedResults,
          source: "ai"
        });
      }

      // No results from database and no OpenAI key
      console.log(`[SPECIES-SEARCH] No results found for: "${query}"`);
      return res.json({
        query,
        results: [],
        source: "database"
      });
    } catch (error) {
      console.error("Species search error:", error);
      return res.status(500).json({ error: "Failed to search species" });
    }
  });

  // POST /api/learn - Learn new pest species via visual prompts
  app.post("/api/learn", async (req, res) => {
    try {
      const { pestName, images } = req.body;

      if (!pestName || typeof pestName !== "string") {
        return res.status(400).json({ error: "Pest name is required" });
      }

      if (!Array.isArray(images) || images.length < 5 || images.length > 10) {
        return res.status(400).json({ error: "5-10 sample images required" });
      }

      console.log(`[LEARN] Starting few-shot learning for: ${pestName}`);
      console.log(`[LEARN] Number of sample images: ${images.length}`);

      // Check if prototype already exists
      const existing = await storage.getPrototypeByPestName(pestName);
      if (existing) {
        return res.status(400).json({ error: "Pest species already learned" });
      }

      // Call ML service to train with new samples
      const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';
      
      console.log(`[LEARN] Calling ML service at ${ML_SERVICE_URL}/api/v1/learn`);
      
      const mlResponse = await fetch(`${ML_SERVICE_URL}/api/v1/learn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pest_name: pestName,
          images: images, // Array of base64 images
        }),
      });

      if (!mlResponse.ok) {
        const errorText = await mlResponse.text();
        console.error(`[LEARN] ML service error: ${errorText}`);
        throw new Error(`ML service error: ${errorText}`);
      }

      const mlResult = await mlResponse.json();
      console.log(`[LEARN] ML service response:`, mlResult);

      // Generate disease information using Cerebras Qwen 3 235B
      console.log(`[LEARN] Generating disease info using Cerebras AI for: ${pestName}`);
      let diseaseInfo = null;
      try {
        const cerebrasInfo = await generateDiseaseInfoWithCerebras(pestName, 0.85); // Use 0.85 as confidence for learned species
        diseaseInfo = {
          plant: cerebrasInfo.plant,
          pathogenType: cerebrasInfo.pathogen_type,
          pathogenName: cerebrasInfo.pathogen_name,
          symptoms: cerebrasInfo.symptoms,
          treatmentDetails: cerebrasInfo.treatment,
          prevention: cerebrasInfo.prevention,
          prognosis: cerebrasInfo.prognosis,
          spreadRisk: cerebrasInfo.spread_risk
        };
        console.log(`[LEARN] Cerebras AI-generated disease info successfully`);
      } catch (error) {
        console.error(`[LEARN] Failed to generate disease info:`, error);
      }

      // Use the prototype embedding from ML service
      const prototypeEmbedding = mlResult.prototype_embedding || mlResult.embedding;

      // Validate with drizzle-zod schema
      const prototypeData = insertPrototypeSchema.safeParse({
        pestName,
        embedding: prototypeEmbedding,
        supportImages: images,
        accuracy: mlResult.accuracy || 0.92,
        sampleCount: images.length,
      });

      if (!prototypeData.success) {
        const validationError = fromZodError(prototypeData.error);
        return res.status(400).json({ error: validationError.message });
      }

      // Create prototype in database
      const prototype = await storage.createPrototype(prototypeData.data);

      console.log(`[LEARN] Successfully learned new species: ${pestName}`);
      
      // Return prototype with AI-generated disease info
      return res.json({
        ...prototype,
        diseaseInfo: diseaseInfo // Include the AI-generated info in response
      });
    } catch (error) {
      console.error("Learn error:", error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to learn pest species" 
      });
    }
  });

  // GET /api/prototypes - Get all learned prototypes
  app.get("/api/prototypes", async (_req, res) => {
    try {
      const prototypes = await storage.getAllPrototypes();
      return res.json(prototypes);
    } catch (error) {
      console.error("Get prototypes error:", error);
      return res.status(500).json({ error: "Failed to fetch prototypes" });
    }
  });

  // POST /api/treatments/recommend - Get AI treatment recommendations
  app.post("/api/treatments/recommend", async (req, res) => {
    try {
      const { pestName, riskLevel } = req.body;

      if (!pestName || !riskLevel) {
        return res.status(400).json({ error: "Pest name and risk level required" });
      }

      const recommendations = await getTreatmentRecommendations(pestName, riskLevel);
      return res.json(recommendations);
    } catch (error) {
      console.error("Treatment recommendations error:", error);
      return res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
