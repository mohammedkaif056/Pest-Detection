import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    console.log("[GEMINI] Starting fallback detection using SDK...");
    
    // Extract base64 data if it includes data URL prefix
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1]
      : imageBase64;
    
    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 300,
      }
    });
    
    console.log("[GEMINI] Sending image for analysis...");
    
    const prompt = "You are a plant disease detection expert. Analyze this plant image and identify any visible diseases or health issues. Respond with ONLY a valid JSON object in this exact format: {\"disease_name\":\"Disease Name\",\"confidence\":0.85,\"severity\":\"High\"}. The severity must be one of: None, Low, Medium, High, Critical. If the plant appears healthy, use disease_name=\"Healthy Plant\" and severity=\"None\".";
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    console.log("[GEMINI] Raw response:", text);
    
    // Extract JSON from response
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.includes('```')) {
      const match = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      jsonText = match ? match[1] : jsonText;
    }
    
    // Extract JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.error("[GEMINI] Could not extract JSON from:", text);
      // Return a default response
      return {
        disease_name: "Unknown Disease (Analysis Incomplete)",
        confidence: 0.3,
        severity: "Medium",
        plant: "Unknown",
        pathogen_type: null,
        pathogen_name: null,
        symptoms: ["Unable to analyze image properly - please try again with a clearer photo"],
        treatment: {
          immediate_actions: ["Retake photo with better lighting", "Consult agricultural expert"],
          chemical_control: [],
          organic_control: [],
          cultural_practices: [],
          maintenance: []
        },
        prevention: ["Regular monitoring"],
        prognosis: "Unable to assess",
        spread_risk: "Unknown"
      };
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    console.log("[GEMINI] Parsed result:", parsed);
    
    return {
      disease_name: parsed.disease_name || "Unknown Disease",
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      severity: parsed.severity || "Medium",
      plant: "Unknown (Gemini analysis)",
      pathogen_type: null,
      pathogen_name: null,
      symptoms: [`Visual analysis: ${parsed.disease_name || 'Unknown condition'}`],
      treatment: {
        immediate_actions: ["Consult local agricultural extension service for accurate diagnosis"],
        chemical_control: ["Professional diagnosis recommended before treatment"],
        organic_control: [],
        cultural_practices: [],
        maintenance: []
      },
      prevention: ["Regular plant health monitoring", "Proper watering and nutrition"],
      prognosis: "AI-based preliminary assessment - professional verification recommended",
      spread_risk: "Unknown - requires expert evaluation"
    };
    
  } catch (error: any) {
    console.error("[GEMINI] Detection failed:", error.message);
    if (error.response?.data) {
      console.error("[GEMINI] Error details:", JSON.stringify(error.response.data, null, 2));
    }
    throw new Error("Gemini detection failed: " + error.message);
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
