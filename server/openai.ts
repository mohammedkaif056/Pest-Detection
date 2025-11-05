import OpenAI from "openai";

// This is using OpenAI's API integration
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
      model: "gpt-5",
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
  riskLevel: string
): Promise<TreatmentRecommendation> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
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
