"""
Inference Engine
================
Core ML inference logic for embedding generation and classification.

This module provides stateless functions that operate on the shared
encoder model stored in FastAPI's application state.
"""

import logging
from typing import Tuple, List

import numpy as np
import torch

from ml.encoder import PestEncoder
from ml.utils import (
    decode_base64_image,
    preprocess_image,
    compute_cosine_similarity,
    determine_risk_level
)

logger = logging.getLogger(__name__)


def generate_embedding(
    encoder: PestEncoder,
    image_base64: str
) -> np.ndarray:
    """
    Generate embedding vector from base64-encoded image.
    
    This function:
    1. Decodes base64 image
    2. Preprocesses image (resize, normalize)
    3. Passes through encoder network
    4. Returns normalized embedding
    
    Args:
        encoder: PestEncoder model instance
        image_base64: Base64-encoded image string
        
    Returns:
        np.ndarray: 512-dimensional embedding vector
        
    Raises:
        ValueError: If image processing fails
    """
    try:
        # Decode base64 to PIL Image
        image = decode_base64_image(image_base64)
        logger.info(f"Image decoded: {image.size}, mode: {image.mode}")
        
        # Preprocess image for model
        image_tensor = preprocess_image(image)
        logger.debug(f"Image preprocessed: {image_tensor.shape}")
        
        # Generate embedding
        with torch.no_grad():
            embedding_tensor = encoder.embed(image_tensor)
        
        # Convert to numpy and squeeze batch dimension
        embedding = embedding_tensor.cpu().numpy().squeeze()
        
        logger.info(f"Embedding generated: shape={embedding.shape}, "
                   f"norm={np.linalg.norm(embedding):.4f}")
        
        return embedding
        
    except ValueError as e:
        logger.error(f"Image processing error: {e}")
        raise
    except Exception as e:
        logger.error(f"Embedding generation error: {e}", exc_info=True)
        raise RuntimeError(f"Failed to generate embedding: {e}")


def classify_embedding(
    query_embedding: np.ndarray,
    prototypes: List[Tuple[str, np.ndarray]]
) -> Tuple[str, float, str]:
    """
    Classify query embedding using prototypical networks.
    
    Classification is performed via cosine similarity between the query
    embedding and all prototype embeddings. The prototype with highest
    similarity is selected as the prediction.
    
    Args:
        query_embedding: Query embedding to classify (512,)
        prototypes: List of (pest_name, embedding) tuples
        
    Returns:
        Tuple[str, float, str]: (predicted_pest_name, confidence, risk_level)
        
    Raises:
        ValueError: If no prototypes provided or embeddings invalid
    """
    if not prototypes:
        raise ValueError("No prototypes provided for classification")
    
    if len(query_embedding) != 512:
        raise ValueError(f"Query embedding must be 512-dimensional, got {len(query_embedding)}")
    
    logger.info(f"Classifying against {len(prototypes)} prototypes")
    
    try:
        # Extract pest names and embeddings
        pest_names = [name for name, _ in prototypes]
        prototype_embeddings = np.array([emb for _, emb in prototypes])
        
        # Validate prototype embeddings
        if prototype_embeddings.shape[1] != 512:
            raise ValueError(
                f"Prototype embeddings must be 512-dimensional, "
                f"got {prototype_embeddings.shape[1]}"
            )
        
        # Compute cosine similarities
        similarities = compute_cosine_similarity(query_embedding, prototype_embeddings)
        
        # Find best match
        best_idx = int(np.argmax(similarities))
        best_similarity = float(similarities[best_idx])
        predicted_pest = pest_names[best_idx]
        
        # Convert similarity to confidence (similarity is already in [-1, 1])
        # Shift to [0, 1] range for confidence
        confidence = (best_similarity + 1.0) / 2.0
        
        # Determine risk level
        risk_level = determine_risk_level(confidence)
        
        logger.info(
            f"Classification result: {predicted_pest} "
            f"(confidence={confidence:.4f}, risk={risk_level})"
        )
        
        # Log top 3 matches for debugging
        top_3_indices = np.argsort(similarities)[-3:][::-1]
        for idx in top_3_indices:
            logger.debug(
                f"  {pest_names[idx]}: similarity={similarities[idx]:.4f}"
            )
        
        return predicted_pest, confidence, risk_level
        
    except Exception as e:
        logger.error(f"Classification error: {e}", exc_info=True)
        raise RuntimeError(f"Failed to classify embedding: {e}")


def batch_generate_embeddings(
    encoder: PestEncoder,
    images_base64: List[str]
) -> np.ndarray:
    """
    Generate embeddings for multiple images in batch.
    
    This is more efficient than processing images one at a time
    when multiple images need embedding generation.
    
    Args:
        encoder: PestEncoder model instance
        images_base64: List of base64-encoded image strings
        
    Returns:
        np.ndarray: Batch of embeddings (N, 512)
        
    Raises:
        ValueError: If any image processing fails
    """
    if not images_base64:
        raise ValueError("No images provided")
    
    logger.info(f"Generating embeddings for {len(images_base64)} images")
    
    try:
        # Decode and preprocess all images
        image_tensors = []
        for img_b64 in images_base64:
            image = decode_base64_image(img_b64)
            image_tensor = preprocess_image(image)
            image_tensors.append(image_tensor)
        
        # Stack into batch
        batch_tensor = torch.cat(image_tensors, dim=0)
        logger.debug(f"Batch tensor shape: {batch_tensor.shape}")
        
        # Generate embeddings
        with torch.no_grad():
            embeddings_tensor = encoder.embed(batch_tensor)
        
        # Convert to numpy
        embeddings = embeddings_tensor.cpu().numpy()
        
        logger.info(f"Batch embeddings generated: shape={embeddings.shape}")
        
        return embeddings
        
    except Exception as e:
        logger.error(f"Batch embedding generation error: {e}", exc_info=True)
        raise RuntimeError(f"Failed to generate batch embeddings: {e}")
