import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

export interface DetectionResult {
  disease_name: string;
  confidence: number;
  severity: string;
  plant?: string;
  pathogen_type?: string | null;
  pathogen_name?: string | null;
  symptoms?: string[];
  treatment?: {
    immediate_actions?: string[];
    chemical_control?: string[];
    organic_control?: string[];
    cultural_practices?: string[];
    maintenance?: string[];
  };
  prevention?: string[];
  prognosis?: string;
  spread_risk?: string;
  embedding?: number[];
}

export interface MLServiceHealth {
  status: string;
  model_loaded: boolean;
  num_classes: number;
}

/**
 * Check if the ML service is healthy and ready
 */
export async function checkMLServiceHealth(): Promise<MLServiceHealth> {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    console.error("ML Service health check failed:", error);
    throw new Error("ML Service is not available");
  }
}

/**
 * Detect plant disease from base64-encoded image
 */
export async function detectPlantDisease(
  imageBase64: string
): Promise<DetectionResult> {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/v1/detect`,
      {
        image_base64: imageBase64,
      },
      {
        timeout: 30000, // 30 seconds for inference
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("ML detection failed:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || "Disease detection failed"
    );
  }
}

/**
 * Get list of all detectable disease classes
 */
export async function getAvailableClasses(): Promise<string[]> {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/api/v1/classes`, {
      timeout: 5000,
    });
    return response.data.classes || [];
  } catch (error) {
    console.error("Failed to fetch classes:", error);
    return [];
  }
}

/**
 * Fallback detection using Groq Llama Vision (when ML service is unavailable)
 */
export async function detectWithGroq(
  imageBase64: string,
  groqApiKey: string
): Promise<DetectionResult> {
  try {
    // Extract base64 data if it includes data URL prefix
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1]
      : imageBase64;
    
    const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    
    const response = await axios.post(
      apiUrl,
      {
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this plant image and identify any diseases. Respond with ONLY valid JSON in this format: {\"disease_name\": \"string\", \"confidence\": number between 0-1, \"severity\": \"None/Low/Medium/High\"}",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      },
      {
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Groq response");
    }
    
    const result = JSON.parse(jsonMatch[0]);
    return {
      disease_name: result.disease_name || "Unknown",
      confidence: result.confidence || 0.5,
      severity: result.severity || "Unknown",
    };
  } catch (error: any) {
    console.error("Groq detection failed:", error);
    throw new Error("Both ML service and Groq fallback failed");
  }
}

/**
 * Detect with automatic fallback to Groq if ML service fails
 */
export async function detectWithFallback(
  imageBase64: string,
  groqApiKey?: string
): Promise<DetectionResult & { source: "ml" | "groq" }> {
  try {
    // Try ML service first
    const result = await detectPlantDisease(imageBase64);
    return { ...result, source: "ml" };
  } catch (mlError) {
    console.warn("ML service failed, trying Groq fallback...");

    if (groqApiKey) {
      const result = await detectWithGroq(imageBase64, groqApiKey);
      return { ...result, source: "groq" };
    }

    throw new Error("ML service unavailable and no Groq API key provided");
  }
}
