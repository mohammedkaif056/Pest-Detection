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
 * Fallback detection using Google Gemini (when ML service is unavailable)
 */
export async function detectWithGemini(
  imageBase64: string,
  geminiApiKey: string
): Promise<DetectionResult> {
  try {
    // Extract base64 data if it includes data URL prefix
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1]
      : imageBase64;
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
    const response = await axios.post(
      apiUrl,
      {
        contents: [
          {
            parts: [
              {
                text: "Analyze this plant image and identify any diseases. Respond with ONLY valid JSON in this format: {\"disease_name\": \"string\", \"confidence\": number between 0-1, \"severity\": \"None/Low/Medium/High\"}",
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const content = response.data.candidates[0].content.parts[0].text;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Gemini response");
    }
    
    const result = JSON.parse(jsonMatch[0]);
    return {
      disease_name: result.disease_name || "Unknown",
      confidence: result.confidence || 0.5,
      severity: result.severity || "Unknown",
    };
  } catch (error: any) {
    console.error("Gemini detection failed:", error);
    throw new Error("Both ML service and Gemini fallback failed");
  }
}

/**
 * Detect with automatic fallback to Gemini if ML service fails
 */
export async function detectWithFallback(
  imageBase64: string,
  geminiApiKey?: string
): Promise<DetectionResult & { source: "ml" | "gemini" }> {
  try {
    // Try ML service first
    const result = await detectPlantDisease(imageBase64);
    return { ...result, source: "ml" };
  } catch (mlError) {
    console.warn("ML service failed, trying Gemini fallback...");

    if (geminiApiKey) {
      const result = await detectWithGemini(imageBase64, geminiApiKey);
      return { ...result, source: "gemini" };
    }

    throw new Error("ML service unavailable and no Gemini API key provided");
  }
}
