"""
Pydantic Data Models
====================
Type-safe request and response schemas for API endpoints.

All models include comprehensive validation and documentation.
"""

from typing import List
from pydantic import BaseModel, Field, validator


class ImageInput(BaseModel):
    """
    Request model for image embedding generation.
    
    Attributes:
        image_base64: Base64-encoded image string (with or without data URI prefix)
    """
    image_base64: str = Field(
        ...,
        description="Base64-encoded image (JPEG, PNG, WebP)",
        min_length=100,
        examples=["data:image/jpeg;base64,/9j/4AAQSkZJRg..."]
    )
    
    @validator('image_base64')
    def validate_base64(cls, v: str) -> str:
        """Validate that the string appears to be valid base64."""
        if not v or len(v.strip()) < 100:
            raise ValueError("Image data appears to be too short")
        return v.strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
            }
        }


class EmbeddingResponse(BaseModel):
    """
    Response model containing image embedding.
    
    Attributes:
        embedding: Fixed-size feature vector (512 dimensions)
    """
    embedding: List[float] = Field(
        ...,
        description="512-dimensional feature vector",
        min_items=512,
        max_items=512
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "embedding": [0.123, -0.456, 0.789, "... (512 values total)"]
            }
        }


class Prototype(BaseModel):
    """
    Prototype representation for few-shot learning.
    
    Attributes:
        pest_name: Name of the pest species
        embedding: Pre-computed embedding vector for this prototype
    """
    pest_name: str = Field(
        ...,
        description="Pest species name",
        min_length=1,
        max_length=200,
        examples=["Asiatic Red Mite", "Boll Weevil"]
    )
    embedding: List[float] = Field(
        ...,
        description="512-dimensional prototype embedding",
        min_items=512,
        max_items=512
    )
    
    @validator('embedding')
    def validate_embedding_dimension(cls, v: List[float]) -> List[float]:
        """Ensure embedding has correct dimensionality."""
        if len(v) != 512:
            raise ValueError(f"Embedding must be 512-dimensional, got {len(v)}")
        return v


class ClassificationInput(BaseModel):
    """
    Request model for embedding classification.
    
    Attributes:
        query_embedding: Embedding vector to classify
        prototypes: List of known prototype embeddings to compare against
    """
    query_embedding: List[float] = Field(
        ...,
        description="Query embedding to classify",
        min_items=512,
        max_items=512
    )
    prototypes: List[Prototype] = Field(
        ...,
        description="List of prototype embeddings for comparison",
        min_items=1,
        max_items=1000
    )
    
    @validator('query_embedding')
    def validate_query_dimension(cls, v: List[float]) -> List[float]:
        """Ensure query embedding has correct dimensionality."""
        if len(v) != 512:
            raise ValueError(f"Query embedding must be 512-dimensional, got {len(v)}")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "query_embedding": [0.123, -0.456, "... (512 values)"],
                "prototypes": [
                    {
                        "pest_name": "Asiatic Red Mite",
                        "embedding": [0.987, -0.654, "... (512 values)"]
                    },
                    {
                        "pest_name": "Boll Weevil",
                        "embedding": [0.456, 0.123, "... (512 values)"]
                    }
                ]
            }
        }


class ClassificationResponse(BaseModel):
    """
    Response model containing classification result.
    
    Attributes:
        pest_name: Predicted pest species name
        confidence: Similarity score (0-1, higher is better)
        risk_level: Assessed risk level based on confidence
    """
    pest_name: str = Field(
        ...,
        description="Predicted pest species",
        examples=["Asiatic Red Mite"]
    )
    confidence: float = Field(
        ...,
        description="Classification confidence score (0-1)",
        ge=0.0,
        le=1.0,
        examples=[0.92]
    )
    risk_level: str = Field(
        ...,
        description="Risk assessment based on confidence",
        pattern="^(low|medium|high|critical)$",
        examples=["high"]
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "pest_name": "Asiatic Red Mite",
                "confidence": 0.92,
                "risk_level": "high"
            }
        }


class ErrorResponse(BaseModel):
    """
    Standard error response model.
    
    Attributes:
        error: Error type/category
        detail: Detailed error message
    """
    error: str = Field(..., description="Error type")
    detail: str = Field(..., description="Error details")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "ValidationError",
                "detail": "Invalid image format"
            }
        }
