"""
API Router
==========
FastAPI endpoint definitions for ML service.

Provides RESTful API for embedding generation and classification.
"""

import logging
from typing import List

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import JSONResponse

from models.schemas import (
    ImageInput,
    EmbeddingResponse,
    ClassificationInput,
    ClassificationResponse,
    ErrorResponse
)
from ml.inference import generate_embedding, classify_embedding

logger = logging.getLogger(__name__)

# Create API router
api_router = APIRouter(tags=["ML Operations"])


@api_router.post(
    "/generate-embedding",
    response_model=EmbeddingResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate embedding from image",
    description="Convert a base64-encoded image into a 512-dimensional feature vector",
    responses={
        200: {
            "description": "Successfully generated embedding",
            "model": EmbeddingResponse
        },
        400: {
            "description": "Invalid input",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    }
)
async def generate_embedding_endpoint(
    request: Request,
    input_data: ImageInput
) -> EmbeddingResponse:
    """
    Generate 512-dimensional embedding from pest image.
    
    **Workflow:**
    1. Decode base64 image
    2. Preprocess (resize to 224x224, normalize)
    3. Pass through encoder network
    4. Return L2-normalized embedding
    
    **Use Case:**
    Called by Node.js backend when user uploads/captures a pest image.
    The embedding is then stored in PostgreSQL for future classification.
    
    **Args:**
    - **image_base64**: Base64-encoded image (JPEG, PNG, WebP)
    
    **Returns:**
    - **embedding**: 512-dimensional feature vector
    
    **Example:**
    ```python
    import requests
    import base64
    
    # Read and encode image
    with open("pest.jpg", "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()
    
    # Send request
    response = requests.post(
        "http://localhost:8001/api/v1/generate-embedding",
        json={"image_base64": f"data:image/jpeg;base64,{img_b64}"}
    )
    
    embedding = response.json()["embedding"]
    ```
    """
    try:
        # Get encoder from app state
        encoder = request.app.state.encoder
        
        logger.info("Processing embedding generation request")
        
        # Generate embedding
        embedding = generate_embedding(encoder, input_data.image_base64)
        
        # Convert numpy array to list for JSON serialization
        embedding_list = embedding.tolist()
        
        logger.info(f"Successfully generated embedding (dim={len(embedding_list)})")
        
        return EmbeddingResponse(embedding=embedding_list)
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate embedding"
        )


@api_router.post(
    "/classify-embedding",
    response_model=ClassificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Classify embedding using prototypes",
    description="Classify query embedding by comparing against known prototype embeddings",
    responses={
        200: {
            "description": "Successfully classified embedding",
            "model": ClassificationResponse
        },
        400: {
            "description": "Invalid input",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    }
)
async def classify_embedding_endpoint(
    input_data: ClassificationInput
) -> ClassificationResponse:
    """
    Classify pest embedding using prototypical networks (few-shot learning).
    
    **Workflow:**
    1. Receive query embedding and prototype embeddings
    2. Compute cosine similarity between query and each prototype
    3. Select prototype with highest similarity
    4. Return prediction with confidence and risk level
    
    **Use Case:**
    Called by Node.js backend after retrieving prototype embeddings from PostgreSQL.
    The backend provides both the query embedding (from generate-embedding) and
    all known prototype embeddings for comparison.
    
    **Args:**
    - **query_embedding**: 512-dimensional embedding to classify
    - **prototypes**: List of known pest prototypes with embeddings
    
    **Returns:**
    - **pest_name**: Predicted pest species
    - **confidence**: Similarity score (0-1)
    - **risk_level**: Risk assessment (low/medium/high/critical)
    
    **Example:**
    ```python
    import requests
    
    # Assume we already have query_embedding from /generate-embedding
    # and prototypes from PostgreSQL database
    
    response = requests.post(
        "http://localhost:8001/api/v1/classify-embedding",
        json={
            "query_embedding": query_embedding,  # 512 floats
            "prototypes": [
                {
                    "pest_name": "Asiatic Red Mite",
                    "embedding": [0.123, -0.456, ...]  # 512 floats
                },
                {
                    "pest_name": "Boll Weevil",
                    "embedding": [0.987, 0.654, ...]  # 512 floats
                }
            ]
        }
    )
    
    result = response.json()
    print(f"Detected: {result['pest_name']} ({result['confidence']:.2%})")
    ```
    """
    try:
        logger.info(
            f"Processing classification request "
            f"({len(input_data.prototypes)} prototypes)"
        )
        
        # Convert prototypes to list of tuples for inference
        prototypes = [
            (p.pest_name, p.embedding)
            for p in input_data.prototypes
        ]
        
        # Classify embedding
        pest_name, confidence, risk_level = classify_embedding(
            query_embedding=input_data.query_embedding,
            prototypes=prototypes
        )
        
        logger.info(
            f"Classification successful: {pest_name} "
            f"(confidence={confidence:.4f}, risk={risk_level})"
        )
        
        return ClassificationResponse(
            pest_name=pest_name,
            confidence=confidence,
            risk_level=risk_level
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to classify embedding"
        )


# Optional: Batch embedding generation endpoint
@api_router.post(
    "/batch-generate-embeddings",
    response_model=List[EmbeddingResponse],
    status_code=status.HTTP_200_OK,
    summary="Generate embeddings for multiple images",
    description="Batch processing for generating embeddings from multiple images",
    include_in_schema=True
)
async def batch_generate_embeddings_endpoint(
    request: Request,
    images: List[ImageInput]
) -> List[EmbeddingResponse]:
    """
    Generate embeddings for multiple images in a single request.
    
    More efficient than calling /generate-embedding multiple times
    when processing multiple images (e.g., creating prototypes).
    
    **Args:**
    - **images**: List of base64-encoded images
    
    **Returns:**
    - List of embedding responses
    """
    try:
        encoder = request.app.state.encoder
        
        logger.info(f"Processing batch embedding request ({len(images)} images)")
        
        embeddings = []
        for img_input in images:
            embedding = generate_embedding(encoder, img_input.image_base64)
            embeddings.append(EmbeddingResponse(embedding=embedding.tolist()))
        
        logger.info(f"Successfully generated {len(embeddings)} embeddings")
        
        return embeddings
        
    except Exception as e:
        logger.error(f"Batch processing error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process batch embeddings"
        )
