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
 * Detect with ML service - no fallback, just throw error if it fails
 */
export async function detectWithMLService(
  imageBase64: string
): Promise<DetectionResult & { source: "ml" }> {
  console.log("[ML-DETECT] Attempting ML service detection...");
  console.log("[ML-DETECT] ML_SERVICE_URL:", ML_SERVICE_URL);
  
  try {
    const result = await detectPlantDisease(imageBase64);
    console.log("[ML-DETECT] ✅ ML service successful");
    return { ...result, source: "ml" };
  } catch (error: any) {
    console.error("[ML-DETECT] ❌ ML service failed:", error.message);
    throw error;
  }
}
