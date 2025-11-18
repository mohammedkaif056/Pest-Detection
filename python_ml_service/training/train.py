"""
Prototypical Network Training Script
=====================================
Fine-tune the pest encoder on IP102 dataset using prototypical networks
for few-shot learning.

Prototypical Networks (Snell et al., 2017) learn embeddings where 
examples from the same class cluster around a prototype representation.

Training procedure:
1. Sample N classes (ways) and K examples per class (shots)
2. Compute prototype for each class (mean of support embeddings)
3. Classify query examples by distance to prototypes
4. Optimize to minimize classification loss
"""

import argparse
import logging
from pathlib import Path
from typing import Tuple

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torch.utils.tensorboard import SummaryWriter
from tqdm import tqdm

from ml.encoder import PestEncoder
from training.dataset import IP102Dataset, EpisodicBatchSampler
from core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class PrototypicalLoss(nn.Module):
    """
    Loss function for prototypical networks.
    
    Computes negative log-probability of query samples belonging to
    the correct class based on distances to class prototypes.
    """
    
    def __init__(self):
        super(PrototypicalLoss, self).__init__()
    
    def forward(
        self,
        embeddings: torch.Tensor,
        labels: torch.Tensor,
        num_support: int
    ) -> Tuple[torch.Tensor, float]:
        """
        Compute prototypical loss.
        
        Args:
            embeddings: All embeddings (support + query) [N*K, D]
            labels: All labels [N*K]
            num_support: Number of support samples per class
            
        Returns:
            Tuple of (loss, accuracy)
        """
        # Split into support and query
        num_classes = len(torch.unique(labels))
        num_query = (len(embeddings) // num_classes) - num_support
        
        support_idx = []
        query_idx = []
        
        for i, label in enumerate(torch.unique(labels)):
            class_mask = labels == label
            class_indices = torch.where(class_mask)[0]
            
            support_idx.extend(class_indices[:num_support].tolist())
            query_idx.extend(class_indices[num_support:].tolist())
        
        support_embeddings = embeddings[support_idx]
        support_labels = labels[support_idx]
        query_embeddings = embeddings[query_idx]
        query_labels = labels[query_idx]
        
        # Compute prototypes (mean of support embeddings per class)
        prototypes = []
        for label in torch.unique(support_labels):
            class_mask = support_labels == label
            class_embeddings = support_embeddings[class_mask]
            prototype = class_embeddings.mean(dim=0)
            prototypes.append(prototype)
        
        prototypes = torch.stack(prototypes)
        
        # Compute distances from queries to prototypes (negative euclidean)
        distances = torch.cdist(query_embeddings, prototypes)
        log_probs = -torch.nn.functional.log_softmax(-distances, dim=1)
        
        # Compute loss
        loss = log_probs[range(len(query_labels)), query_labels].mean()
        
        # Compute accuracy
        predictions = torch.argmin(distances, dim=1)
        accuracy = (predictions == query_labels).float().mean().item()
        
        return loss, accuracy


def train_epoch(
    model: PestEncoder,
    dataloader: DataLoader,
    optimizer: optim.Optimizer,
    criterion: PrototypicalLoss,
    device: str,
    num_support: int
) -> Tuple[float, float]:
    """
    Train for one epoch.
    
    Args:
        model: PestEncoder model
        dataloader: Training dataloader
        optimizer: Optimizer
        criterion: Loss function
        device: Device to train on
        num_support: Number of support samples per class
        
    Returns:
        Tuple of (average_loss, average_accuracy)
    """
    model.train()
    total_loss = 0.0
    total_acc = 0.0
    num_batches = 0
    
    pbar = tqdm(dataloader, desc="Training")
    for images, labels in pbar:
        images = images.to(device)
        labels = labels.to(device)
        
        # Zero gradients
        optimizer.zero_grad()
        
        # Forward pass
        embeddings = model(images)
        
        # Compute loss
        loss, accuracy = criterion(embeddings, labels, num_support)
        
        # Backward pass
        loss.backward()
        optimizer.step()
        
        # Accumulate metrics
        total_loss += loss.item()
        total_acc += accuracy
        num_batches += 1
        
        # Update progress bar
        pbar.set_postfix({
            'loss': f'{loss.item():.4f}',
            'acc': f'{accuracy:.4f}'
        })
    
    avg_loss = total_loss / num_batches
    avg_acc = total_acc / num_batches
    
    return avg_loss, avg_acc


def validate(
    model: PestEncoder,
    dataloader: DataLoader,
    criterion: PrototypicalLoss,
    device: str,
    num_support: int
) -> Tuple[float, float]:
    """
    Validate the model.
    
    Args:
        model: PestEncoder model
        dataloader: Validation dataloader
        criterion: Loss function
        device: Device to validate on
        num_support: Number of support samples per class
        
    Returns:
        Tuple of (average_loss, average_accuracy)
    """
    model.eval()
    total_loss = 0.0
    total_acc = 0.0
    num_batches = 0
    
    with torch.no_grad():
        pbar = tqdm(dataloader, desc="Validating")
        for images, labels in pbar:
            images = images.to(device)
            labels = labels.to(device)
            
            # Forward pass
            embeddings = model(images)
            
            # Compute loss
            loss, accuracy = criterion(embeddings, labels, num_support)
            
            # Accumulate metrics
            total_loss += loss.item()
            total_acc += accuracy
            num_batches += 1
            
            # Update progress bar
            pbar.set_postfix({
                'loss': f'{loss.item():.4f}',
                'acc': f'{accuracy:.4f}'
            })
    
    avg_loss = total_loss / num_batches
    avg_acc = total_acc / num_batches
    
    return avg_loss, avg_acc


def main():
    """Main training function."""
    parser = argparse.ArgumentParser(description="Train Pest Encoder with Prototypical Networks")
    parser.add_argument(
        "--data-dir",
        type=str,
        required=True,
        help="Path to IP102 dataset directory"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="./assets",
        help="Directory to save trained model"
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=50,
        help="Number of training epochs"
    )
    parser.add_argument(
        "--lr",
        type=float,
        default=0.001,
        help="Learning rate"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Batch size"
    )
    parser.add_argument(
        "--num-support",
        type=int,
        default=5,
        help="Number of support samples per class (K-shot)"
    )
    parser.add_argument(
        "--num-query",
        type=int,
        default=10,
        help="Number of query samples per class"
    )
    parser.add_argument(
        "--num-ways",
        type=int,
        default=10,
        help="Number of classes per episode (N-way)"
    )
    
    args = parser.parse_args()
    
    # Setup
    device = settings.DEVICE
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Training on device: {device}")
    logger.info(f"Dataset: {args.data_dir}")
    logger.info(f"Output: {output_dir}")
    logger.info(f"Config: {args.num_ways}-way {args.num_support}-shot")
    
    # Initialize model
    logger.info("Initializing model...")
    model = PestEncoder(
        model_name=settings.MODEL_NAME,
        embedding_dim=settings.EMBEDDING_DIM,
        device=device
    )
    
    # Create datasets
    logger.info("Loading datasets...")
    train_dataset = IP102Dataset(
        root_dir=args.data_dir,
        split="train",
        image_size=settings.IMAGE_SIZE
    )
    
    val_dataset = IP102Dataset(
        root_dir=args.data_dir,
        split="val",
        image_size=settings.IMAGE_SIZE
    )
    
    # Create episodic samplers
    train_labels = [label for _, label in train_dataset.samples]
    val_labels = [label for _, label in val_dataset.samples]
    
    train_sampler = EpisodicBatchSampler(
        labels=train_labels,
        num_classes=args.num_ways,
        num_support=args.num_support,
        num_query=args.num_query,
        num_episodes=1000  # Episodes per epoch
    )
    
    val_sampler = EpisodicBatchSampler(
        labels=val_labels,
        num_classes=args.num_ways,
        num_support=args.num_support,
        num_query=args.num_query,
        num_episodes=200  # Episodes for validation
    )
    
    # Create dataloaders
    train_loader = DataLoader(
        train_dataset,
        batch_sampler=train_sampler,
        num_workers=4,
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_sampler=val_sampler,
        num_workers=4,
        pin_memory=True
    )
    
    # Setup training
    criterion = PrototypicalLoss()
    optimizer = optim.Adam(model.get_trainable_parameters(), lr=args.lr)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=20, gamma=0.5)
    
    # Tensorboard
    writer = SummaryWriter(log_dir=output_dir / "logs")
    
    # Training loop
    best_val_acc = 0.0
    
    for epoch in range(args.epochs):
        logger.info(f"\nEpoch {epoch + 1}/{args.epochs}")
        logger.info(f"Learning rate: {scheduler.get_last_lr()[0]:.6f}")
        
        # Train
        train_loss, train_acc = train_epoch(
            model, train_loader, optimizer, criterion, device, args.num_support
        )
        
        # Validate
        val_loss, val_acc = validate(
            model, val_loader, criterion, device, args.num_support
        )
        
        # Log metrics
        logger.info(
            f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f}"
        )
        logger.info(
            f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}"
        )
        
        writer.add_scalar("Loss/train", train_loss, epoch)
        writer.add_scalar("Loss/val", val_loss, epoch)
        writer.add_scalar("Accuracy/train", train_acc, epoch)
        writer.add_scalar("Accuracy/val", val_acc, epoch)
        writer.add_scalar("LR", scheduler.get_last_lr()[0], epoch)
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            model_path = output_dir / "pest_encoder.pth"
            model.save_weights(model_path)
            logger.info(f"✅ Saved best model (val_acc={val_acc:.4f})")
        
        # Step scheduler
        scheduler.step()
    
    writer.close()
    logger.info(f"\n🎉 Training complete! Best validation accuracy: {best_val_acc:.4f}")
    logger.info(f"Model saved to: {output_dir / 'pest_encoder.pth'}")


if __name__ == "__main__":
    main()
