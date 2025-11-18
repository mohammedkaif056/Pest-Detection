import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

interface PestAnalysisResult {
  pestName: string;
  confidence: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  similarSpecies: Array<{ name: string; confidence: number }>;
  treatments: Array<{ name: string; type: string; effectiveness: string }>;
}

export async function analyzePestImage(base64Image: string): Promise<PestAnalysisResult> {
  try {
    const base64Data = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1]
      : base64Image;

    const response = await axios.post(GEMINI_API_URL, {
      contents: [{
        parts: [
          {
            text: `You are an expert agricultural entomologist specializing in pest identification. 
            Analyze pest images and provide detailed identification with confidence scores.
            Respond with JSON in this exact format:
            {
              "pestName": "Common name of the pest",
              "confidence": 0.95,
              "riskLevel": "low|medium|high|critical",
              "similarSpecies": [{"name": "Species name", "confidence": 0.85}],
              "treatments": [{"name": "Treatment name", "type": "chemical|biological|cultural", "effectiveness": "high|medium|low"}]
            }`
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000
      }
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000
    });

    const content = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse JSON from Gemini response");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error("Gemini pest analysis failed:", error.response?.data || error.message);
    throw new Error("Failed to analyze pest image with Gemini");
  }
}

export async function getTreatmentRecommendations(diseaseName: string): Promise<any> {
  try {
    const response = await axios.post(GEMINI_API_URL, {
      contents: [{
        parts: [{
          text: `Provide comprehensive treatment recommendations for ${diseaseName}.
          Include organic and chemical options, application timing, and prevention strategies.
          Respond with JSON:
          {
            "disease": "${diseaseName}",
            "organicTreatments": [{"name": "string", "application": "string", "effectiveness": "string"}],
            "chemicalTreatments": [{"name": "string", "activeIngredient": "string", "application": "string"}],
            "culturalPractices": ["string"],
            "preventionTips": ["string"]
          }`
        }]
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2000
      }
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 20000
    });

    const content = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse JSON from Gemini response");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error("Gemini treatment recommendations failed:", error.response?.data || error.message);
    throw new Error("Failed to get treatment recommendations");
  }
}

export async function generateDiseaseInfo(diseaseName: string, confidence: number): Promise<any> {
  try {
    const response = await axios.post(GEMINI_API_URL, {
      contents: [{
        parts: [{
          text: `Provide detailed information about ${diseaseName} plant disease.
          Respond with JSON:
          {
            "plant": "Plant name",
            "disease_name": "${diseaseName}",
            "pathogen_type": "Fungus|Bacteria|Virus|Pest|Nutrient Deficiency",
            "pathogen_name": "Scientific name",
            "confidence": ${confidence},
            "severity": "Low|Moderate|High|Critical",
            "symptoms": ["symptom1", "symptom2", "symptom3"],
            "risk_level": "low|medium|high|critical",
            "treatments": [{"name": "string", "type": "organic|chemical", "effectiveness": "high|medium|low"}],
            "prevention": ["prevention tip 1", "prevention tip 2"]
          }`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500
      }
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 20000
    });

    const content = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse JSON from Gemini response");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error("Gemini disease info generation failed:", error.response?.data || error.message);
    throw new Error("Failed to generate disease information");
  }
}

export async function searchSpeciesWithAI(query: string): Promise<any[]> {
  try {
    const response = await axios.post(GEMINI_API_URL, {
      contents: [{
        parts: [{
          text: `Search for plant species or diseases matching: "${query}".
          Provide top 5 most relevant results with detailed information.
          Respond with JSON array:
          [
            {
              "name": "Species/Disease name",
              "scientificName": "Scientific name",
              "commonName": "Common name",
              "description": "Brief description",
              "riskLevel": "low|medium|high|critical",
              "affectedPlants": ["plant1", "plant2"],
              "symptoms": ["symptom1", "symptom2"]
            }
          ]`
        }]
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 3000
      }
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 20000
    });

    const content = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Could not parse JSON array from Gemini response");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error("Gemini species search failed:", error.response?.data || error.message);
    return [];
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // Gemini doesn't provide embeddings API like OpenAI
  // For now, return a simple hash-based embedding
  // In production, you might want to use a dedicated embedding service
  console.warn("Gemini doesn't support embeddings - using fallback");
  
  // Simple hash-based embedding (not ideal but works as fallback)
  const embedding = new Array(1536).fill(0);
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    embedding[i % 1536] += charCode;
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}
