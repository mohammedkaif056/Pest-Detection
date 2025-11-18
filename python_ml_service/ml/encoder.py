"""
Pest Encoder Model
==================
Deep learning model for generating pest image embeddings.

Uses pre-trained MobileNetV3 from Timm library with custom projection head
for fixed 512-dimensional embeddings optimized for few-shot learning.
"""

import logging
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
import timm

from core.config import settings

logger = logging.getLogger(__name__)


class PestEncoder(nn.Module):
    """
    Neural network encoder for pest image embeddings.
    
    Architecture:
    - Backbone: Pre-trained MobileNetV3-Large (Timm)
    - Projection Head: FC layer to fixed 512-dim embedding
    - Output: L2-normalized embedding vector
    
    The model can be used with or without fine-tuning weights.
    """
    
    def __init__(
        self,
        model_name: str = "mobilenetv3_large_100",
        model_path: Optional[Path] = None,
        embedding_dim: int = 512,
        device: str = "cpu"
    ):
        """
        Initialize the pest encoder model.
        
        Args:
            model_name: Timm model name (default: mobilenetv3_large_100)
            model_path: Path to fine-tuned model weights (optional)
            embedding_dim: Output embedding dimension (default: 512)
            device: Device to load model on ('cpu' or 'cuda')
        """
        super(PestEncoder, self).__init__()
        
        self.model_name = model_name
        self.embedding_dim = embedding_dim
        self.device = device
        
        logger.info(f"Initializing {model_name} encoder...")
        
        # Load pre-trained backbone from Timm
        self.backbone = timm.create_model(
            model_name,
            pretrained=True,
            num_classes=0,  # Remove classification head
            global_pool='avg'  # Global average pooling
        )
        
        # Get backbone output dimension
        with torch.no_grad():
            dummy_input = torch.randn(1, 3, 224, 224)
            backbone_dim = self.backbone(dummy_input).shape[1]
        
        logger.info(f"Backbone output dimension: {backbone_dim}")
        
        # Projection head to fixed embedding dimension
        self.projection = nn.Sequential(
            nn.Linear(backbone_dim, 1024),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(1024, embedding_dim)
        )
        
        # Move model to device
        self.to(device)
        
        # Load fine-tuned weights if available
        if model_path and Path(model_path).exists():
            logger.info(f"Loading fine-tuned weights from {model_path}")
            try:
                state_dict = torch.load(model_path, map_location=device)
                self.load_state_dict(state_dict)
                logger.info("✅ Fine-tuned weights loaded successfully")
            except Exception as e:
                logger.warning(f"⚠️ Could not load weights from {model_path}: {e}")
                logger.warning("Using pre-trained ImageNet weights only")
        else:
            logger.info("No fine-tuned weights found, using pre-trained ImageNet weights")
        
        # Set to evaluation mode
        self.eval()
        
        logger.info(f"Model initialized on device: {device}")
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass to generate embeddings.
        
        Args:
            x: Input image tensor (B, 3, 224, 224)
            
        Returns:
            torch.Tensor: L2-normalized embeddings (B, embedding_dim)
        """
        # Extract features from backbone
        features = self.backbone(x)
        
        # Project to embedding space
        embeddings = self.projection(features)
        
        # L2 normalization for cosine similarity
        embeddings = nn.functional.normalize(embeddings, p=2, dim=1)
        
        return embeddings
    
    @torch.no_grad()
    def embed(self, image_tensor: torch.Tensor) -> torch.Tensor:
        """
        Generate embedding for a single image or batch.
        
        Args:
            image_tensor: Preprocessed image tensor (B, 3, 224, 224)
            
        Returns:
            torch.Tensor: Embedding vector(s) (B, embedding_dim)
        """
        # Move to model device
        image_tensor = image_tensor.to(self.device)
        
        # Generate embedding
        embedding = self.forward(image_tensor)
        
        return embedding
    
    def get_embedding_dim(self) -> int:
        """Get the embedding dimension."""
        return self.embedding_dim
    
    def save_weights(self, path: Path) -> None:
        """
        Save model weights to disk.
        
        Args:
            path: Path to save weights
        """
        torch.save(self.state_dict(), path)
        logger.info(f"Model weights saved to {path}")
    
    def get_trainable_parameters(self):
        """
        Get trainable parameters for optimization.
        
        Returns:
            Iterator of trainable parameters
        """
        return self.parameters()
