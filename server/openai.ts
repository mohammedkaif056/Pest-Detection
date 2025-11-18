import OpenAI from "openai";

// Using OpenRouter with OpenAI SDK
// OpenRouter provides access to multiple AI models including GPT-5
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_KEY?.startsWith('sk-or-') 
    ? 'https://openrouter.ai/api/v1' 
    : undefined
});

interface PestAnalysisResult {
  pestName: string;
  confidence: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  similarSpecies: Array<{ name: string; confidence: number }>;
  treatments: Array<{ name: string; type: string; effectiveness: string }>;
}

export async function analyzePestImage(base64Image: string): Promise<PestAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert agricultural entomologist specializing in pest identification. 
          Analyze pest images and provide detailed identification with confidence scores.
          Respond with JSON in this exact format:
          {
            "pestName": "Common name of the pest",
            "confidence": 0.95,
            "riskLevel": "high",
            "similarSpecies": [
              {"name": "Similar pest 1", "confidence": 0.75},
              {"name": "Similar pest 2", "confidence": 0.68}
            ],
            "treatments": [
              {"name": "Treatment name", "type": "chemical|biological|cultural|mechanical", "effectiveness": "high|medium|low"}
            ]
          }`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify this agricultural pest. Provide the pest name, confidence level (0-1), risk level (low/medium/high/critical), 2-3 similar species with confidence scores, and 2-3 treatment recommendations.",
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      pestName: result.pestName || "Unknown Pest",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.85)),
      riskLevel: result.riskLevel || "medium",
      similarSpecies: result.similarSpecies || [],
      treatments: result.treatments || [],
    };
  } catch (error) {
    console.error("OpenAI pest analysis error:", error);
    throw new Error("Failed to analyze pest image");
  }
}

interface TreatmentRecommendation {
  pestName: string;
  riskLevel: string;
  recommendations: Array<{
    name: string;
    type: string;
    activeIngredient?: string;
    applicationMethod: string;
    effectiveness: string;
    ecoFriendly: boolean;
    cost: string;
    description: string;
  }>;
}

export async function getTreatmentRecommendations(
  pestName: string,
  cropType: string
): Promise<TreatmentRecommendations> {
  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an agricultural pest management expert. Provide comprehensive treatment recommendations for identified pests.
          Respond with JSON in this exact format:
          {
            "pestName": "Pest name",
            "riskLevel": "high",
            "recommendations": [
              {
                "name": "Treatment name",
                "type": "chemical|biological|cultural|mechanical",
                "activeIngredient": "Chemical name or null",
                "applicationMethod": "How to apply",
                "effectiveness": "high|medium|low",
                "ecoFriendly": true|false,
                "cost": "low|medium|high",
                "description": "Detailed description"
              }
            ]
          }`,
        },
        {
          role: "user",
          content: `Provide 3-5 treatment recommendations for ${pestName} (risk level: ${riskLevel}). Include chemical, biological, and cultural control methods. Prioritize eco-friendly and sustainable approaches.`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as TreatmentRecommendation;
  } catch (error) {
    console.error("OpenAI treatment recommendations error:", error);
    throw new Error("Failed to get treatment recommendations");
  }
}

export async function generateEmbedding(base64Image: string): Promise<number[]> {
  // Simulate embedding generation for few-shot learning
  // In a real implementation, this would use a vision model to extract features
  // For MVP, we'll create a simple simulated embedding based on image hash
  const hash = Buffer.from(base64Image.substring(0, 100)).toString("base64");
  const embedding: number[] = [];
  
  for (let i = 0; i < 512; i++) {
    const charCode = hash.charCodeAt(i % hash.length);
    embedding.push((charCode / 255) * 2 - 1); // Normalize to [-1, 1]
  }
  
  return embedding;
}

export async function classifyWithPrototypes(
  queryEmbedding: number[],
  prototypes: Array<{ pestName: string; embedding: number[] }>
): Promise<{ pestName: string; confidence: number }> {
  // Calculate cosine similarity between query and each prototype
  const similarities = prototypes.map((prototype) => {
    const similarity = cosineSimilarity(queryEmbedding, prototype.embedding);
    return {
      pestName: prototype.pestName,
      confidence: (similarity + 1) / 2, // Convert from [-1, 1] to [0, 1]
    };
  });

  // Return the best match
  similarities.sort((a, b) => b.confidence - a.confidence);
  return similarities[0] || { pestName: "Unknown", confidence: 0 };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

interface DiseaseInformation {
  plant: string;
  pathogenType: string;
  pathogenName: string;
  symptoms: string[];
  treatmentDetails: {
    immediate_actions: string[];
    chemical_control: string[];
    organic_control: string[];
    cultural_practices: string[];
  };
  prevention: string[];
  prognosis: string;
  spreadRisk: string;
}

export async function generateDiseaseInfo(
  diseaseName: string,
  confidence: number
): Promise<DiseaseInformation> {
  try {
    const confidenceNote = confidence < 0.7 
      ? "Note: This is an AI prediction based on image analysis (not from trained model). Confidence is lower than usual."
      : "";

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert plant pathologist. Provide comprehensive disease information in JSON format.
          Respond with this exact structure:
          {
            "plant": "Plant name (e.g., Tomato, Potato, Pepper)",
            "pathogenType": "Fungus|Bacteria|Virus|Pest|Nutrient Deficiency",
            "pathogenName": "Scientific name of pathogen",
            "symptoms": ["symptom 1", "symptom 2", ...],
            "treatmentDetails": {
              "immediate_actions": ["action 1", "action 2", ...],
              "chemical_control": ["treatment 1", "treatment 2", ...],
              "organic_control": ["organic option 1", "organic option 2", ...],
              "cultural_practices": ["practice 1", "practice 2", ...]
            },
            "prevention": ["prevention method 1", "prevention method 2", ...],
            "prognosis": "Expected outcome with treatment",
            "spreadRisk": "Low|Moderate|High - How it spreads"
          }`,
        },
        {
          role: "user",
          content: `Provide detailed information about this plant disease: "${diseaseName}". 
          Include at least 5-7 symptoms, 3-4 immediate actions, 3-5 chemical controls, 3-5 organic controls, 
          3-4 cultural practices, and 4-6 prevention methods. ${confidenceNote}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 3000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      plant: result.plant || "Unknown Plant",
      pathogenType: result.pathogenType || "Unknown",
      pathogenName: result.pathogenName || "Not identified",
      symptoms: result.symptoms || ["Information not available for this disease"],
      treatmentDetails: {
        immediate_actions: result.treatmentDetails?.immediate_actions || ["Consult a plant pathologist"],
        chemical_control: result.treatmentDetails?.chemical_control || ["No specific recommendations available"],
        organic_control: result.treatmentDetails?.organic_control || ["Consider organic alternatives"],
        cultural_practices: result.treatmentDetails?.cultural_practices || ["Improve general plant care"],
      },
      prevention: result.prevention || ["Practice good sanitation"],
      prognosis: result.prognosis || (confidence < 0.7 
        ? "Uncertain - AI prediction with lower confidence. Verify with expert."
        : "Consult disease information database"),
      spreadRisk: result.spreadRisk || "Unknown spread risk",
    };
  } catch (error) {
    console.error("OpenAI disease info generation error:", error);
    // Return fallback data
    return {
      plant: "Unknown Plant",
      pathogenType: "Unknown",
      pathogenName: "Not identified",
      symptoms: ["Information not available for this disease"],
      treatmentDetails: {
        immediate_actions: ["Isolate affected plants", "Monitor plant health"],
        chemical_control: ["Consult local agricultural extension"],
        organic_control: ["Use general-purpose organic fungicides"],
        cultural_practices: ["Improve air circulation", "Avoid overhead watering"],
      },
      prevention: ["Practice crop rotation", "Use disease-resistant varieties"],
      prognosis: "Consult a plant pathologist for accurate diagnosis",
      spreadRisk: "Unknown - Take precautionary measures",
    };
  }
}

interface SpeciesSearchResult {
  name: string;
  scientificName: string;
  category: string;
  description: string;
  riskLevel: string;
  commonCrops: string[];
  taxonomy?: {
    kingdom: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
  };
}

export async function searchSpeciesWithAI(
  query: string
): Promise<SpeciesSearchResult[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert entomologist and plant pathologist. Search for plant pests and diseases based on user queries.
          Respond with JSON array in this exact format:
          [
            {
              "name": "Common name",
              "scientificName": "Scientific name",
              "category": "insect|mite|larvae|fungus|bacteria|virus|nematode",
              "description": "Detailed description (50-100 words)",
              "riskLevel": "low|medium|high|critical",
              "commonCrops": ["crop1", "crop2", "crop3"],
              "taxonomy": {
                "kingdom": "Kingdom name",
                "phylum": "Phylum name",
                "class": "Class name",
                "order": "Order name",
                "family": "Family name"
              }
            }
          ]
          Provide 3-5 relevant results for the search query.`,
        },
        {
          role: "user",
          content: `Search for plant pests and diseases related to: "${query}". Include both the exact matches and similar/related species that farmers should be aware of.`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 3000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // The response might be wrapped in a results key
    const results = result.results || result.species || (Array.isArray(result) ? result : []);
    
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("OpenAI species search error:", error);
    return [];
  }
}
