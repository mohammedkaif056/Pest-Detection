import axios from "axios";

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || "csk-e2kt93mwxkk69jt5pnmr8wnwymfxdredr3h4xf2e68th9rh8";
const CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions";

interface DiseaseInfo {
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
}

/**
 * Generate comprehensive disease information using Cerebras Qwen 3 235B
 * This is a text-only model, so it cannot analyze images directly
 * Use this for generating detailed disease info based on disease name
 */
export async function generateDiseaseInfoWithCerebras(
  diseaseName: string,
  confidence: number = 0.85
): Promise<DiseaseInfo> {
  try {
    const prompt = `You are an expert plant pathologist. Provide comprehensive information about the plant disease: "${diseaseName}".

Respond with ONLY valid JSON in this exact format:
{
  "disease_name": "${diseaseName}",
  "confidence": ${confidence},
  "severity": "None/Low/Medium/High/Critical",
  "plant": "Common plant name affected",
  "pathogen_type": "Fungal/Bacterial/Viral/Nutritional/Pest/null",
  "pathogen_name": "Scientific name of pathogen or null",
  "symptoms": ["symptom 1", "symptom 2", "symptom 3"],
  "treatment": {
    "immediate_actions": ["action 1", "action 2"],
    "chemical_control": ["treatment 1", "treatment 2"],
    "organic_control": ["organic method 1", "organic method 2"],
    "cultural_practices": ["practice 1", "practice 2"],
    "maintenance": ["maintenance task 1", "maintenance task 2"]
  },
  "prevention": ["prevention tip 1", "prevention tip 2"],
  "prognosis": "Expected outcome with/without treatment",
  "spread_risk": "How quickly the disease spreads"
}

Provide accurate, detailed information. If unsure, use null for pathogen fields.`;

    const response = await axios.post(
      CEREBRAS_API_URL,
      {
        model: "qwen-3-235b-a22b-instruct-2507",
        messages: [
          {
            role: "system",
            content: "You are an expert plant pathologist providing detailed disease information in JSON format only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1200,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${CEREBRAS_API_KEY}`
        },
        timeout: 8000
      }
    );

    const content = response.data.choices[0].message.content;
    console.log("[CEREBRAS] Raw response:", content);

    // Parse JSON response
    const diseaseInfo = JSON.parse(content);

    return {
      disease_name: diseaseInfo.disease_name || diseaseName,
      confidence: diseaseInfo.confidence || confidence,
      severity: diseaseInfo.severity || "Medium",
      plant: diseaseInfo.plant,
      pathogen_type: diseaseInfo.pathogen_type,
      pathogen_name: diseaseInfo.pathogen_name,
      symptoms: diseaseInfo.symptoms || [],
      treatment: diseaseInfo.treatment || {},
      prevention: diseaseInfo.prevention || [],
      prognosis: diseaseInfo.prognosis || "",
      spread_risk: diseaseInfo.spread_risk || ""
    };
  } catch (error: any) {
    console.error("[CEREBRAS] Error:", error.response?.data || error.message);
    throw new Error(`Cerebras API error: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Test function to verify Cerebras API connectivity
 */
export async function testCerebrasConnection(): Promise<boolean> {
  try {
    console.log("[CEREBRAS-TEST] Testing API connection...");
    
    const response = await axios.post(
      CEREBRAS_API_URL,
      {
        model: "qwen-3-235b-a22b-instruct-2507",
        messages: [
          {
            role: "user",
            content: "Say 'API connection successful' in JSON format: {\"status\": \"success\", \"message\": \"your message\"}"
          }
        ],
        temperature: 0.1,
        max_tokens: 50,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${CEREBRAS_API_KEY}`
        },
        timeout: 10000
      }
    );

    const result = JSON.parse(response.data.choices[0].message.content);
    console.log("[CEREBRAS-TEST] ✅ Connection successful:", result);
    return true;
  } catch (error: any) {
    console.error("[CEREBRAS-TEST] ❌ Connection failed:", error.response?.data || error.message);
    return false;
  }
}
