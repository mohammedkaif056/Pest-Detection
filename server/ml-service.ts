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
      timeout: 3000,
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
        timeout: 15000, // 15 seconds for inference
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
    console.log("[GEMINI] Starting fallback detection...");
    
    // Extract base64 data if it includes data URL prefix
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1]
      : imageBase64;
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
    
    console.log("[GEMINI] Calling API:", apiUrl.replace(geminiApiKey, 'KEY_HIDDEN'));
    
    const response = await axios.post(
      apiUrl,
      {
        contents: [
          {
            parts: [
              {
                text: "You are a plant disease expert. Analyze this plant image and identify any diseases. Respond with ONLY a valid JSON object with these exact fields: disease_name (string), confidence (number 0-1), severity (string: None/Low/Medium/High/Critical). Example: {\"disease_name\":\"Tomato Late Blight\",\"confidence\":0.85,\"severity\":\"High\"}"
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 200,
          topP: 0.8,
          topK: 10
        }
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );

    console.log("[GEMINI] Response received, status:", response.status);
    
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("[GEMINI] Invalid response structure:", JSON.stringify(response.data));
      throw new Error("Invalid Gemini API response structure");
    }

    const content = response.data.candidates[0].content.parts[0].text;
    console.log("[GEMINI] Raw content:", content);
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = content.trim();
    if (jsonText.includes('```')) {
      const match = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      jsonText = match ? match[1] : jsonText;
    }
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[GEMINI] Could not extract JSON from:", content);
      throw new Error("Could not parse JSON from Gemini response");
    }
    
    const result = JSON.parse(jsonMatch[0]);
    console.log("[GEMINI] Parsed result:", result);
    
    return {
      disease_name: result.disease_name || "Unknown Disease",
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
      severity: result.severity || "Medium",
      plant: "Unknown",
      pathogen_type: null,
      pathogen_name: null,
      symptoms: ["Gemini visual analysis - detailed information not available"],
      treatment: {
        immediate_actions: ["Consult agricultural expert for accurate diagnosis"],
        chemical_control: [],
        organic_control: [],
        cultural_practices: [],
        maintenance: []
      },
      prevention: ["Regular monitoring and inspection"],
      prognosis: "AI-based preliminary assessment",
      spread_risk: "Unknown - professional assessment recommended"
    };
  } catch (error: any) {
    console.error("[GEMINI] Detection failed:", error.response?.status, error.response?.data || error.message);
    if (error.response?.data) {
      console.error("[GEMINI] Full error response:", JSON.stringify(error.response.data, null, 2));
    }
    throw new Error("Gemini detection failed: " + (error.response?.data?.error?.message || error.message));
  }
}

/**
 * Detect with automatic fallback to Gemini if ML service fails
 */
export async function detectWithFallback(
  imageBase64: string,
  geminiApiKey?: string
): Promise<DetectionResult & { source: "ml" | "gemini" }> {
  console.log("[ML-DETECT] Attempting ML service detection...");
  console.log("[ML-DETECT] ML_SERVICE_URL:", ML_SERVICE_URL);
  
  try {
    // Try ML service first
    const result = await detectPlantDisease(imageBase64);
    console.log("[ML-DETECT] ✅ ML service successful");
    return { ...result, source: "ml" };
  } catch (mlError: any) {
    console.warn("[ML-DETECT] ⚠️ ML service failed:", mlError.message);
    console.warn("[ML-DETECT] Trying Gemini fallback...");

    if (geminiApiKey) {
      try {
        const result = await detectWithGemini(imageBase64, geminiApiKey);
        console.log("[ML-DETECT] ✅ Gemini fallback successful");
        return { ...result, source: "gemini" };
      } catch (geminiError: any) {
        console.error("[ML-DETECT] ❌ Gemini also failed:", geminiError.message);
        throw new Error("Both ML service and Gemini fallback failed: " + geminiError.message);
      }
    }

    throw new Error("ML service unavailable and no Gemini API key provided");
  }
}
