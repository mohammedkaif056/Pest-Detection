"""
Minimal ML Service - Test Version
==================================
This version starts immediately without loading any ML libraries.
Use this to verify the service infrastructure works before loading heavy ML models.
"""

import logging
from typing import Dict, List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Pest Detection ML Service (Test)",
    description="Minimal version for testing - no ML dependencies loaded",
    version="1.0.0-test",
    docs_url="/docs",
    redoc_url="/redoc"
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

class EmbeddingResponse(BaseModel):
    embedding: List[float]
    model_name: str = "mobilenetv3_large_100"
    embedding_dim: int = 512

class PrototypeInput(BaseModel):
    pest_name: str
    embedding: List[float]

class ClassificationInput(BaseModel):
    query_embedding: List[float]
    prototypes: List[PrototypeInput]

class ClassificationResponse(BaseModel):
    pest_name: str
    confidence: float
    risk_level: str


@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "pest-detection-ml-test",
        "version": "1.0.0-test",
        "note": "This is the test version - ML model not loaded"
    }


@app.post("/api/v1/generate-embedding", response_model=EmbeddingResponse)
async def generate_embedding(input_data: ImageInput) -> EmbeddingResponse:
    """
    Generate a random embedding (test version).
    In production, this would run the actual ML model.
    """
    logger.info("Generating test embedding (random values)")
    
    # Generate random 512-dim embedding
    random_embedding = [random.uniform(-1.0, 1.0) for _ in range(512)]
    
    return EmbeddingResponse(
        embedding=random_embedding,
        model_name="mobilenetv3_large_100-test",
        embedding_dim=512
    )


@app.post("/api/v1/classify-embedding", response_model=ClassificationResponse)
async def classify_embedding(input_data: ClassificationInput) -> ClassificationResponse:
    """
    Classify embedding against prototypes (test version).
    In production, this would use cosine similarity with real embeddings.
    """
    logger.info(f"Classifying against {len(input_data.prototypes)} prototypes (test)")
    
    # Randomly select a prototype
    selected = random.choice(input_data.prototypes)
    confidence = random.uniform(0.7, 0.95)
    
    # Determine risk level
    if confidence > 0.9:
        risk_level = "critical"
    elif confidence > 0.8:
        risk_level = "high"
    elif confidence > 0.7:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    return ClassificationResponse(
        pest_name=selected.pest_name,
        confidence=confidence,
        risk_level=risk_level
    )


@app.post("/api/v1/batch-generate-embeddings", response_model=List[EmbeddingResponse])
async def batch_generate_embeddings(inputs: List[ImageInput]) -> List[EmbeddingResponse]:
    """
    Generate embeddings for multiple images (test version).
    """
    logger.info(f"Batch generating {len(inputs)} test embeddings")
    
    results = []
    for _ in inputs:
        random_embedding = [random.uniform(-1.0, 1.0) for _ in range(512)]
        results.append(EmbeddingResponse(
            embedding=random_embedding,
            model_name="mobilenetv3_large_100-test",
            embedding_dim=512
        ))
    
    return results


if __name__ == "__main__":
    import uvicorn
    
    print("=" * 70)
    print("TEST SERVICE - Starting (No ML dependencies loaded)")
    print("This version uses random embeddings for testing API infrastructure")
    print("=" * 70)
    print("")
    print("Service will be available at:")
    print("  - Health: http://localhost:8001/health")
    print("  - Docs:   http://localhost:8001/docs")
    print("")
    print("=" * 70)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )
