import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzePestImage, getTreatmentRecommendations, generateEmbedding } from "./openai";
import { insertDetectionSchema, insertPrototypeSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // POST /api/detect - Analyze pest image
  app.post("/api/detect", async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image || typeof image !== "string") {
        return res.status(400).json({ error: "Image is required" });
      }

      // Analyze image with OpenAI Vision
      const analysis = await analyzePestImage(image);

      // Validate with drizzle-zod schema
      const detectionData = insertDetectionSchema.safeParse({
        imageUrl: image,
        pestName: analysis.pestName,
        confidence: analysis.confidence,
        riskLevel: analysis.riskLevel,
        similarSpecies: analysis.similarSpecies,
        treatments: analysis.treatments,
      });

      if (!detectionData.success) {
        const validationError = fromZodError(detectionData.error);
        return res.status(400).json({ error: validationError.message });
      }

      // Store detection record
      const detection = await storage.createDetection(detectionData.data);

      return res.json(detection);
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

      // Check if prototype already exists
      const existing = await storage.getPrototypeByPestName(pestName);
      if (existing) {
        return res.status(400).json({ error: "Pest species already learned" });
      }

      // Generate embeddings for all images
      const embeddings = await Promise.all(
        images.map((img: string) => generateEmbedding(img))
      );

      // Compute mean embedding (prototype)
      const prototypeEmbedding = embeddings[0].map((_, i) => {
        const sum = embeddings.reduce((acc, emb) => acc + emb[i], 0);
        return sum / embeddings.length;
      });

      // Validate with drizzle-zod schema
      const prototypeData = insertPrototypeSchema.safeParse({
        pestName,
        embedding: prototypeEmbedding,
        supportImages: images,
        accuracy: 0.92, // Simulated accuracy
        sampleCount: images.length,
      });

      if (!prototypeData.success) {
        const validationError = fromZodError(prototypeData.error);
        return res.status(400).json({ error: validationError.message });
      }

      // Create prototype
      const prototype = await storage.createPrototype(prototypeData.data);

      return res.json(prototype);
    } catch (error) {
      console.error("Learn error:", error);
      return res.status(500).json({ error: "Failed to learn pest species" });
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
