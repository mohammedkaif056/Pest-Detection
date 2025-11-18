"""
Application Configuration
=========================
Centralized configuration management using Pydantic Settings.

All configuration values can be overridden via environment variables.
Example: MODEL_PATH can be set via MODEL_PATH environment variable.
"""

import os
from pathlib import Path
from typing import List

import torch
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    
    Attributes are automatically loaded from environment variables
    matching the attribute name (case-insensitive).
    """
    
    # Application Settings
    APP_NAME: str = "Pest Detection ML Service"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    
    # CORS Settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # ML Model Settings
    MODEL_NAME: str = "mobilenetv3_large_100"  # Timm model name
    EMBEDDING_DIM: int = 512  # Fixed embedding dimension
    MODEL_PATH: Path = Path(__file__).parent.parent / "assets" / "pest_encoder.pth"
    
    # Device Configuration (auto-detect GPU)
    DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"
    
    # Image Processing Settings
    IMAGE_SIZE: int = 224  # Input size for MobileNetV3
    MEAN: List[float] = [0.485, 0.456, 0.406]  # ImageNet normalization
    STD: List[float] = [0.229, 0.224, 0.225]
    
    # Inference Settings
    BATCH_SIZE: int = 32  # Maximum batch size for inference
    MAX_IMAGE_SIZE_MB: int = 10  # Maximum allowed image size
    
    # AI Vision API Settings
    GROQ_API_KEY: str = ""  # Groq API key for AI vision (Llama 3.2 Vision)
    GEMINI_API_KEY: str = ""  # Legacy: Google Gemini API key (deprecated)
    
    # Training Settings (used in train.py)
    LEARNING_RATE: float = 0.001
    NUM_EPOCHS: int = 50
    SUPPORT_SIZE: int = 5  # Number of support samples per class
    QUERY_SIZE: int = 10  # Number of query samples per class
    NUM_CLASSES: int = 102  # IP102 dataset has 102 classes
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


# Create assets directory if it doesn't exist
settings.MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
