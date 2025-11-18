"""
Image Processing Utilities
===========================
Utilities for decoding, validating, and preprocessing images.
"""

import base64
import io
import re
from typing import Tuple

import numpy as np
import torch
from PIL import Image
from torchvision import transforms

from core.config import settings


def decode_base64_image(base64_string: str) -> Image.Image:
    """
    Decode base64-encoded image string to PIL Image.
    
    Handles both raw base64 and data URI formats:
    - data:image/jpeg;base64,/9j/4AAQ...
    - /9j/4AAQ... (raw base64)
    
    Args:
        base64_string: Base64-encoded image string
        
    Returns:
        PIL.Image.Image: Decoded image in RGB format
        
    Raises:
        ValueError: If decoding fails or image is invalid
    """
    try:
        # Remove data URI prefix if present
        if base64_string.startswith('data:image'):
            # Extract base64 data after 'base64,'
            match = re.search(r'base64,(.+)', base64_string)
            if match:
                base64_string = match.group(1)
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_string)
        
        # Check file size
        size_mb = len(image_bytes) / (1024 * 1024)
        if size_mb > settings.MAX_IMAGE_SIZE_MB:
            raise ValueError(
                f"Image size ({size_mb:.2f} MB) exceeds maximum allowed "
                f"size ({settings.MAX_IMAGE_SIZE_MB} MB)"
            )
        
        # Open image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB (handle RGBA, grayscale, etc.)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        return image
        
    except base64.binascii.Error as e:
        raise ValueError(f"Invalid base64 encoding: {e}")
    except Exception as e:
        raise ValueError(f"Failed to decode image: {e}")


def preprocess_image(image: Image.Image) -> torch.Tensor:
    """
    Preprocess PIL Image for model inference.
    
    Applies standard ImageNet preprocessing:
    1. Resize to 224x224
    2. Convert to tensor
    3. Normalize with ImageNet mean/std
    
    Args:
        image: PIL Image in RGB format
        
    Returns:
        torch.Tensor: Preprocessed image tensor (1, 3, 224, 224)
    """
    transform = transforms.Compose([
        transforms.Resize((settings.IMAGE_SIZE, settings.IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=settings.MEAN, std=settings.STD)
    ])
    
    # Apply transformations and add batch dimension
    image_tensor = transform(image).unsqueeze(0)
    
    return image_tensor


def validate_image_tensor(tensor: torch.Tensor) -> None:
    """
    Validate image tensor shape and values.
    
    Args:
        tensor: Image tensor to validate
        
    Raises:
        ValueError: If tensor is invalid
    """
    if tensor.dim() != 4:
        raise ValueError(f"Expected 4D tensor (B, C, H, W), got {tensor.dim()}D")
    
    batch_size, channels, height, width = tensor.shape
    
    if channels != 3:
        raise ValueError(f"Expected 3 channels (RGB), got {channels}")
    
    if height != settings.IMAGE_SIZE or width != settings.IMAGE_SIZE:
        raise ValueError(
            f"Expected size ({settings.IMAGE_SIZE}, {settings.IMAGE_SIZE}), "
            f"got ({height}, {width})"
        )


def normalize_embedding(embedding: np.ndarray) -> np.ndarray:
    """
    L2-normalize embedding vector for cosine similarity computation.
    
    Args:
        embedding: Raw embedding vector
        
    Returns:
        np.ndarray: L2-normalized embedding
    """
    norm = np.linalg.norm(embedding)
    if norm == 0:
        return embedding
    return embedding / norm


def compute_cosine_similarity(query: np.ndarray, prototypes: np.ndarray) -> np.ndarray:
    """
    Compute cosine similarity between query and multiple prototypes.
    
    Args:
        query: Query embedding (D,)
        prototypes: Prototype embeddings (N, D)
        
    Returns:
        np.ndarray: Similarity scores (N,)
    """
    # Normalize vectors
    query_norm = normalize_embedding(query)
    prototypes_norm = np.array([normalize_embedding(p) for p in prototypes])
    
    # Compute dot product (cosine similarity for normalized vectors)
    similarities = np.dot(prototypes_norm, query_norm)
    
    return similarities


def determine_risk_level(confidence: float) -> str:
    """
    Determine risk level based on classification confidence.
    
    Risk levels:
    - critical: confidence >= 0.95 (very high certainty)
    - high: confidence >= 0.80 (high certainty)
    - medium: confidence >= 0.60 (moderate certainty)
    - low: confidence < 0.60 (low certainty)
    
    Args:
        confidence: Classification confidence score (0-1)
        
    Returns:
        str: Risk level string
    """
    if confidence >= 0.95:
        return "critical"
    elif confidence >= 0.80:
        return "high"
    elif confidence >= 0.60:
        return "medium"
    else:
        return "low"
