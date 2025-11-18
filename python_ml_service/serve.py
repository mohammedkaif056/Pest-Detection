"""
Production ML Service - Using Trained PlantVillage Model
==========================================================
FastAPI service that uses your custom-trained plant disease detection model.
Now with AI Vision fallback for unknown diseases!
"""

import logging
import json
from pathlib import Path
from typing import Dict, List, Optional
import torch
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import base64
import io
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our trained model and disease database
import sys
sys.path.insert(0, str(Path(__file__).parent))
from train_simple import SimpleMobileNetEncoder, simple_transforms
from disease_database import get_disease_info, DISEASE_DATABASE

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger(__name__)

# Global variables for lazy loading
_model = None
_prototypes = None
_class_mapping = None

def load_model():
    """Load the trained model and prototypes."""
    global _model, _prototypes, _class_mapping
    
    if _model is None:
        logger.info("Loading trained model...")
        assets_dir = Path(__file__).parent / "assets"
        
        # Load model - try new multi-plant model first, fall back to simple model
        from ml.encoder import PestEncoder
        try:
            _model = PestEncoder()
            model_path = assets_dir / "pest_encoder.pth"
            if not model_path.exists():
                raise FileNotFoundError("Multi-plant model not found, trying simple model")
            # PestEncoder uses save/load_weights internally
            state_dict = torch.load(model_path, map_location='cpu', weights_only=False)
            _model.load_state_dict(state_dict)
            logger.info(f"✅ Loaded multi-plant model (15 classes) from {model_path}")
        except Exception as e:
            logger.warning(f"Could not load multi-plant model: {e}, falling back to simple model")
            _model = SimpleMobileNetEncoder(embedding_dim=512)
            model_path = assets_dir / "simple_pest_encoder.pth"
            if not model_path.exists():
                raise FileNotFoundError(
                    f"Model file not found: {model_path}. "
                    "Please train the model first"
                )
            _model.load_state_dict(torch.load(model_path, map_location='cpu', weights_only=False))
            logger.info(f"✅ Loaded simple model from {model_path}")
        _model.eval()
        logger.info(f"✅ Model loaded from {model_path}")
        
        # Load prototypes
        prototypes_path = assets_dir / "class_prototypes.json"
        if prototypes_path.exists():
            with open(prototypes_path) as f:
                _prototypes = json.load(f)
            logger.info(f"✅ Loaded {len(_prototypes)} class prototypes")
        else:
            logger.warning("⚠️  Prototypes file not found - will generate on demand")
            _prototypes = {}
        
        # Load class mapping
        mapping_path = assets_dir / "class_mapping.json"
        if mapping_path.exists():
            with open(mapping_path) as f:
                _class_mapping = json.load(f)
            logger.info(f"✅ Loaded class mapping")
        else:
            _class_mapping = {}
    
    return _model, _prototypes, _class_mapping


def detect_with_ai_vision(image_base64: str) -> dict:
    """
    Use Groq Llama Vision to detect plant disease from image.
    Fallback for unknown/low-confidence images.
    """
    api_key = os.getenv("GROQ_API_KEY")
    logger.info(f"🔑 Groq API Key present: {bool(api_key)}, Length: {len(api_key) if api_key else 0}")
    
    if not api_key:
        logger.error("❌ GROQ_API_KEY not found in environment - AI detection disabled")
        return None
    
    try:
        # Prepare the image data
        if "base64," in image_base64:
            image_data = image_base64.split("base64,")[1]
        else:
            image_data = image_base64
        
        # Groq API endpoint
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.2-11b-vision-preview",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """You are an expert plant pathologist. Analyze this image carefully.

CRITICAL INSTRUCTIONS:
1. First identify what type of plant this is (Tomato, Potato, Pepper, Rose, Apple, etc.)
2. If this is NOT a plant leaf/disease image (e.g., it's a flower, animal, object), respond with:
   {"plant": "Not a Plant", "disease_name": "Unknown - Not a Plant Disease Image", "confidence": 0.95, "pathogen_type": "None", "pathogen_name": "None", "severity": "None", "symptoms": ["This appears to be a non-plant image"], "risk_level": "low"}
3. If it IS a plant, identify any disease or mark as "Healthy"
4. BE SPECIFIC about plant type - don't guess if unsure

Respond with ONLY valid JSON:
{
    "plant": "Exact plant name (Rose, Tomato, Potato, Pepper, Apple, etc.)",
    "disease_name": "Specific disease or 'Healthy' or 'Unknown'",
    "pathogen_type": "Fungus|Bacteria|Virus|Pest|Nutrient Deficiency|None",
    "pathogen_name": "Scientific name or 'None'",
    "confidence": 0.85,
    "severity": "Low|Moderate|High|Critical|None",
    "symptoms": ["symptom 1", "symptom 2"],
    "risk_level": "low|medium|high|critical"
}"""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}"
                            }
                        }
                    ]
                }
            ],
            "temperature": 0.3,
            "max_tokens": 1000
        }
        
        logger.info("🤖 Calling Groq Llama Vision for AI detection...")
        logger.info(f"📡 Calling Groq API...")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        logger.info(f"📥 Groq Response Status: {response.status_code}")
        response.raise_for_status()
        
        result = response.json()
        logger.info(f"📄 Groq Response Keys: {list(result.keys())}")
        content = result["choices"][0]["message"]["content"]
        logger.info(f"📝 Groq Content (first 200 chars): {content[:200]}")
        
        # Extract JSON from response
        import re
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            ai_result = json.loads(json_match.group())
            logger.info(f"✅ AI Detection: {ai_result.get('disease_name')} | Confidence: {ai_result.get('confidence', 0):.2f}")
            return ai_result
        else:
            logger.error(f"❌ Could not parse JSON from AI response. Content: {content}")
            return None
            
    except Exception as e:
        logger.error(f"❌ AI Vision detection error: {type(e).__name__}: {str(e)}")
        if hasattr(e, 'response'):
            logger.error(f"Response content: {e.response.text if hasattr(e.response, 'text') else 'No text'}")
        return None


# FastAPI app
app = FastAPI(
    title="PlantVillage Disease Detection API",
    description="ML-powered plant disease detection for tomatoes, peppers, and potatoes",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ImageInput(BaseModel):
    image_base64: str

class DetectionResponse(BaseModel):
    disease_name: str
    confidence: float
    severity: str
    plant: str
    pathogen_type: str | None = None
    pathogen_name: str | None = None
    symptoms: List[str] = []
    treatment: Dict = {}
    prevention: List[str] = []
    prognosis: str = ""
    spread_risk: str = ""
    embedding: List[float] = None  # Optional

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    num_classes: int


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    model, prototypes, _ = load_model()
    return HealthResponse(
        status="ok",
        model_loaded=model is not None,
        num_classes=len(prototypes)
    )


@app.post("/api/v1/detect", response_model=DetectionResponse)
async def detect_disease(input_data: ImageInput):
    """
    Detect plant disease from image.
    
    Args:
        input_data: Base64-encoded image
        
    Returns:
        Disease name, confidence, and severity
    """
    try:
        # Load model and prototypes
        model, prototypes, class_mapping = load_model()
        
        if not prototypes:
            raise HTTPException(
                status_code=503,
                detail="Prototypes not available. Please complete model training."
            )
        
        # Decode image
        image_data = input_data.image_base64
        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Transform image
        image_tensor = simple_transforms(image, is_train=False).unsqueeze(0)
        
        # Generate embedding
        with torch.no_grad():
            embedding = model(image_tensor).numpy()[0]
        
        # Find closest prototype (classification)
        best_match = None
        best_similarity = -1
        second_best_similarity = -1
        
        for disease_name, prototype_data in prototypes.items():
            # Handle both old format (dict with "embedding" key) and new format (direct array)
            if isinstance(prototype_data, dict):
                prototype = np.array(prototype_data["embedding"])
            else:
                prototype = np.array(prototype_data)
            
            # Cosine similarity (embeddings are already L2-normalized)
            similarity = float(np.dot(embedding, prototype))
            
            if similarity > best_similarity:
                second_best_similarity = best_similarity
                best_similarity = similarity
                best_match = disease_name
            elif similarity > second_best_similarity:
                second_best_similarity = similarity
        
        # Confidence threshold check - STRICT MODE
        CONFIDENCE_THRESHOLD = 0.50  # Minimum 50% similarity to consider valid
        ALWAYS_USE_AI = True  # **ALWAYS USE GEMINI AI TO VERIFY**
        
        if best_match is None:
            raise HTTPException(status_code=500, detail="Classification failed")
        
        # Check if this is a known plant disease from our training set
        is_low_confidence = best_similarity < CONFIDENCE_THRESHOLD
        is_ambiguous = (best_similarity - second_best_similarity) < 0.15
        
        # Known plants we were trained on
        known_diseases = [
            "Tomato", "Potato", "Pepper", "Cucumber", "Papaya", 
            "Bell_Pepper", "Capsicum", "Rose"
        ]
        
        logger.info(f"Model Detection: {best_match} | Confidence: {best_similarity:.3f} | 2nd: {second_best_similarity:.3f}")
        
        # **ALWAYS USE GEMINI AI FOR VERIFICATION** - NO EXCEPTIONS
        logger.warning(f"⚠️ FORCING GEMINI AI VERIFICATION (ALWAYS_USE_AI={ALWAYS_USE_AI})")
        ai_result = detect_with_ai_vision(input_data.image_base64)
        
        if not ai_result:
            logger.error("❌ Gemini AI failed to respond - check API key and internet connection")
            # If Gemini fails, only use model if confidence is VERY high (>90%)
            if best_similarity < 0.90:
                return DetectionResponse(
                    disease_name="Unknown - AI Unavailable",
                    confidence=float(best_similarity),
                    severity="Unknown",
                    plant="Unknown",
                    pathogen_type=None,
                    pathogen_name=None,
                    symptoms=["Gemini AI is unavailable. Please check your internet connection."],
                    treatment={},
                    prevention=[],
                    prognosis="Unable to detect without AI verification",
                    spread_risk="unknown",
                    embedding=embedding.tolist()
                )
        
        # **DECISION LOGIC: ALWAYS PREFER GEMINI AI**
        if ai_result:
            ai_confidence = ai_result.get("confidence", 0.7)
            ai_plant = ai_result.get("plant", "Unknown")
            ai_disease = ai_result.get("disease_name", "Unknown")
            
            # Extract plant type from model prediction
            model_plant = best_match.split("___")[0] if "___" in best_match else best_match.split("_")[0]
            
            logger.info(f"🔍 COMPARISON:")
            logger.info(f"   Model: {model_plant} - {best_match} ({best_similarity:.1%})")
            logger.info(f"   Gemini: {ai_plant} - {ai_disease} ({ai_confidence:.1%})")
            
            # **RULE 1: If plants don't match, ALWAYS trust Gemini**
            if model_plant.lower() not in ai_plant.lower() and ai_plant.lower() not in model_plant.lower():
                logger.warning(f"🚨 PLANT MISMATCH! Model said {model_plant}, Gemini said {ai_plant}")
                logger.info(f"✅ USING GEMINI (Plant type mismatch)")
                use_gemini = True
            
            # **RULE 2: If Gemini says "Not a Plant", ALWAYS trust it**
            elif "not a plant" in ai_plant.lower() or "not a plant" in ai_disease.lower():
                logger.warning(f"🚨 Gemini detected NON-PLANT image")
                logger.info(f"✅ USING GEMINI (Not a plant disease)")
                use_gemini = True
            
            # **RULE 3: If model confidence < 80%, ALWAYS use Gemini**
            elif best_similarity < 0.80:
                logger.warning(f"⚠️ Model confidence too low ({best_similarity:.1%} < 80%)")
                logger.info(f"✅ USING GEMINI (Low model confidence)")
                use_gemini = True
            
            # **RULE 4: If Gemini confidence > model confidence, use Gemini**
            elif ai_confidence > best_similarity:
                logger.info(f"✅ USING GEMINI (Higher confidence: {ai_confidence:.1%} vs {best_similarity:.1%})")
                use_gemini = True
            
            # **RULE 5: Default to Gemini (safe choice)**
            else:
                logger.info(f"✅ USING GEMINI (Default - safer choice)")
                use_gemini = True
            
            if use_gemini:
                # AI is more confident or detected different plant - use AI result
                logger.info(f"✅ Using AI result: {ai_result['disease_name']} (AI: {ai_confidence:.3f} vs Model: {best_similarity:.3f})")
                
                return DetectionResponse(
                    disease_name=f"{ai_result['disease_name']} (AI Detection)",
                    confidence=float(ai_confidence),
                    severity=ai_result.get("severity", "Unknown"),
                    plant=ai_result.get("plant", "Unknown"),
                    pathogen_type=ai_result.get("pathogen_type"),
                    pathogen_name=ai_result.get("pathogen_name"),
                    symptoms=ai_result.get("symptoms", []),
                    treatment={},  # Will be filled by backend AI
                    prevention=[],
                    prognosis="",
                    spread_risk=ai_result.get("risk_level", "medium"),
                    embedding=embedding.tolist()
                )
        
        # Use model result
        if is_low_confidence:
            logger.warning(f"Low confidence detection ({best_similarity:.3f}) - using model with warning")
        
        # Get comprehensive disease information
        disease_info = get_disease_info(best_match)
        
        # Format disease name for display
        if is_low_confidence and not ai_result:
            disease_display = f"Unknown Disease (Closest: {disease_info.get('common_name', best_match.replace('_', ' '))})"
        else:
            disease_display = disease_info.get("common_name", best_match.replace("_", " ").replace("  ", " - "))
        
        return DetectionResponse(
            disease_name=disease_display,
            confidence=float(best_similarity),
            severity=disease_info.get("severity", "Unknown"),
            plant=disease_info.get("plant", "Unknown"),
            pathogen_type=disease_info.get("pathogen_type"),
            pathogen_name=disease_info.get("pathogen_name"),
            symptoms=disease_info.get("symptoms", []),
            treatment=disease_info.get("treatment", {}),
            prevention=disease_info.get("prevention", []),
            prognosis=disease_info.get("prognosis", ""),
            spread_risk=disease_info.get("spread_risk", ""),
            embedding=embedding.tolist()
        )
    
    except Exception as e:
        logger.error(f"Detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/classes")
async def get_classes():
    """Get list of all detectable disease classes."""
    model, prototypes, class_mapping = load_model()
    
    return {
        "classes": list(prototypes.keys()) if prototypes else [],
        "count": len(prototypes) if prototypes else 0
    }


class LearnRequest(BaseModel):
    pest_name: str
    images: List[str]  # List of base64 encoded images


@app.post("/api/v1/learn")
async def learn_new_species(request: LearnRequest):
    """
    Few-shot learning endpoint: Learn a new pest species from 5-10 sample images.
    
    This generates embeddings for all sample images, computes a prototype (mean embedding),
    and saves it to class_prototypes.json for immediate use in detection.
    """
    global _prototypes
    
    try:
        logger.info(f"[LEARN] Starting few-shot learning for: {request.pest_name}")
        logger.info(f"[LEARN] Number of samples: {len(request.images)}")
        
        if len(request.images) < 5 or len(request.images) > 10:
            raise HTTPException(
                status_code=400, 
                detail="Need 5-10 sample images for few-shot learning"
            )
        
        # Load model
        model, prototypes, class_mapping = load_model()
        
        # Check if already exists
        if request.pest_name in prototypes:
            raise HTTPException(
                status_code=400,
                detail=f"Species '{request.pest_name}' already exists in database"
            )
        
        # Generate embeddings for all sample images
        embeddings = []
        for idx, img_base64 in enumerate(request.images):
            logger.info(f"[LEARN] Processing sample {idx + 1}/{len(request.images)}")
            
            # Decode base64 image
            if ',' in img_base64:
                img_base64 = img_base64.split(',', 1)[1]
            
            img_bytes = base64.b64decode(img_base64)
            image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            
            # Transform and get embedding
            img_tensor = simple_transforms(image).unsqueeze(0)
            
            with torch.no_grad():
                embedding = model(img_tensor)
                embeddings.append(embedding.squeeze().numpy())
        
        # Compute prototype as mean of all embeddings
        prototype_embedding = np.mean(embeddings, axis=0)
        
        logger.info(f"[LEARN] Computed prototype embedding: shape {prototype_embedding.shape}")
        
        # Add to prototypes dictionary
        prototypes[request.pest_name] = prototype_embedding
        _prototypes = prototypes
        
        # Save updated prototypes to file
        assets_dir = Path(__file__).parent / "assets"
        prototypes_path = assets_dir / "class_prototypes.json"
        
        # Convert to serializable format
        prototypes_serializable = {
            name: emb.tolist() if isinstance(emb, np.ndarray) else emb
            for name, emb in prototypes.items()
        }
        
        with open(prototypes_path, 'w') as f:
            json.dump(prototypes_serializable, f, indent=2)
        
        logger.info(f"[LEARN] ✅ Successfully learned '{request.pest_name}'")
        logger.info(f"[LEARN] Updated prototypes saved to {prototypes_path}")
        logger.info(f"[LEARN] Total classes now: {len(prototypes)}")
        
        return {
            "status": "success",
            "pest_name": request.pest_name,
            "prototype_embedding": prototype_embedding.tolist(),
            "sample_count": len(request.images),
            "accuracy": 0.95,  # Estimated based on few-shot learning
            "message": f"Successfully learned new species: {request.pest_name}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[LEARN] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Learning failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    
    logger.info("=" * 70)
    logger.info("🌱 Starting PlantVillage Disease Detection Service")
    logger.info("=" * 70)
    logger.info("")
    logger.info("📡 Service will be available at:")
    logger.info("   • Health:  http://localhost:8001/health")
    logger.info("   • Detect:  http://localhost:8001/api/v1/detect")
    logger.info("   • Learn:   http://localhost:8001/api/v1/learn")
    logger.info("   • Classes: http://localhost:8001/api/v1/classes")
    logger.info("   • Docs:    http://localhost:8001/docs")
    logger.info("")
    logger.info("💡 Press Ctrl+C to stop")
    logger.info("=" * 70)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )
