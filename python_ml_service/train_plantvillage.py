"""
PlantVillage Dataset Training Script
=====================================
Train the pest/disease detection model on your custom PlantVillage dataset.

This script will:
1. Load images from ../Dataset/PlantVillage/
2. Train a MobileNetV3 encoder with prototypical networks
3. Save the trained model to assets/pest_encoder.pth
4. Generate class prototypes for few-shot classification
"""

import os
import sys
import logging
import argparse
from pathlib import Path
from datetime import datetime

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import numpy as np
from tqdm import tqdm
import json

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from ml.encoder import PestEncoder
from ml.utils import get_image_transforms

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class PlantVillageDataset(Dataset):
    """
    Dataset loader for PlantVillage plant disease images.
    
    Expected structure:
    Dataset/PlantVillage/
        ├── Tomato_healthy/
        │   ├── image1.jpg
        │   ├── image2.jpg
        ├── Tomato_Late_blight/
        │   ├── image1.jpg
        └── ...
    """
    
    def __init__(self, root_dir: str, transform=None, limit_per_class: int = None):
        """
        Args:
            root_dir: Path to PlantVillage directory
            transform: Image transformations
            limit_per_class: Optional limit on images per class (for faster training)
        """
        self.root_dir = Path(root_dir)
        self.transform = transform
        self.limit_per_class = limit_per_class
        
        self.samples = []
        self.class_to_idx = {}
        self.idx_to_class = {}
        
        self._load_dataset()
    
    def _load_dataset(self):
        """Load all images and create class mappings."""
        logger.info(f"Loading dataset from: {self.root_dir}")
        
        # Get all class directories
        class_dirs = sorted([d for d in self.root_dir.iterdir() if d.is_dir()])
        
        if not class_dirs:
            raise ValueError(f"No class directories found in {self.root_dir}")
        
        # Create class mappings
        for idx, class_dir in enumerate(class_dirs):
            class_name = class_dir.name
            self.class_to_idx[class_name] = idx
            self.idx_to_class[idx] = class_name
        
        logger.info(f"Found {len(class_dirs)} classes:")
        for class_name in sorted(self.class_to_idx.keys()):
            logger.info(f"  - {class_name}")
        
        # Load image paths
        for class_dir in class_dirs:
            class_name = class_dir.name
            class_idx = self.class_to_idx[class_name]
            
            # Get all image files
            image_files = []
            for ext in ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']:
                image_files.extend(list(class_dir.glob(ext)))
            
            # Limit images per class if specified
            if self.limit_per_class and len(image_files) > self.limit_per_class:
                image_files = image_files[:self.limit_per_class]
            
            # Add to samples
            for img_path in image_files:
                self.samples.append((str(img_path), class_idx))
            
            logger.info(f"  {class_name}: {len(image_files)} images")
        
        logger.info(f"Total samples: {len(self.samples)}")
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        
        try:
            image = Image.open(img_path).convert('RGB')
            
            if self.transform:
                image = self.transform(image)
            
            return image, label
        except Exception as e:
            logger.error(f"Error loading image {img_path}: {e}")
            # Return a blank image on error
            blank_image = Image.new('RGB', (224, 224), color='white')
            if self.transform:
                blank_image = self.transform(blank_image)
            return blank_image, label


class PrototypicalLoss(nn.Module):
    """
    Prototypical Networks loss for few-shot learning.
    Computes class prototypes and classifies using Euclidean distance.
    """
    
    def __init__(self):
        super().__init__()
    
    def forward(self, embeddings, labels):
        """
        Args:
            embeddings: [batch_size, embedding_dim] - Feature vectors
            labels: [batch_size] - Class labels
            
        Returns:
            loss: Scalar loss value
            accuracy: Classification accuracy
        """
        # Get unique classes in batch
        unique_labels = torch.unique(labels)
        
        # Compute prototype for each class (mean of embeddings)
        prototypes = []
        for label in unique_labels:
            mask = (labels == label)
            class_embeddings = embeddings[mask]
            prototype = class_embeddings.mean(dim=0)
            prototypes.append(prototype)
        
        prototypes = torch.stack(prototypes)  # [num_classes, embedding_dim]
        
        # Compute distances from each sample to each prototype
        # Using negative Euclidean distance (closer = higher score)
        distances = -torch.cdist(embeddings, prototypes)  # [batch_size, num_classes]
        
        # Map global labels to local indices for this batch
        label_to_idx = {label.item(): idx for idx, label in enumerate(unique_labels)}
        local_labels = torch.tensor([label_to_idx[l.item()] for l in labels], 
                                    device=embeddings.device)
        
        # Cross-entropy loss
        loss = nn.functional.cross_entropy(distances, local_labels)
        
        # Calculate accuracy
        predictions = distances.argmax(dim=1)
        accuracy = (predictions == local_labels).float().mean()
        
        return loss, accuracy


def train_epoch(model, dataloader, criterion, optimizer, device, epoch):
    """Train for one epoch."""
    model.train()
    total_loss = 0.0
    total_accuracy = 0.0
    num_batches = 0
    
    pbar = tqdm(dataloader, desc=f"Epoch {epoch}")
    
    for images, labels in pbar:
        images = images.to(device)
        labels = labels.to(device)
        
        # Forward pass
        embeddings = model.embed(images)
        
        # Compute loss
        loss, accuracy = criterion(embeddings, labels)
        
        # Backward pass
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        # Track metrics
        total_loss += loss.item()
        total_accuracy += accuracy.item()
        num_batches += 1
        
        # Update progress bar
        pbar.set_postfix({
            'loss': f'{loss.item():.4f}',
            'acc': f'{accuracy.item():.4f}'
        })
    
    avg_loss = total_loss / num_batches
    avg_accuracy = total_accuracy / num_batches
    
    return avg_loss, avg_accuracy


def validate(model, dataloader, criterion, device):
    """Validate the model."""
    model.eval()
    total_loss = 0.0
    total_accuracy = 0.0
    num_batches = 0
    
    with torch.no_grad():
        for images, labels in tqdm(dataloader, desc="Validating"):
            images = images.to(device)
            labels = labels.to(device)
            
            embeddings = model.embed(images)
            loss, accuracy = criterion(embeddings, labels)
            
            total_loss += loss.item()
            total_accuracy += accuracy.item()
            num_batches += 1
    
    avg_loss = total_loss / num_batches
    avg_accuracy = total_accuracy / num_batches
    
    return avg_loss, avg_accuracy


def generate_prototypes(model, dataloader, class_names, device):
    """
    Generate prototype embeddings for each class.
    These will be used for few-shot classification.
    """
    logger.info("Generating class prototypes...")
    
    model.eval()
    class_embeddings = {i: [] for i in range(len(class_names))}
    
    with torch.no_grad():
        for images, labels in tqdm(dataloader, desc="Computing prototypes"):
            images = images.to(device)
            embeddings = model.embed(images).cpu().numpy()
            
            for emb, label in zip(embeddings, labels):
                class_embeddings[label.item()].append(emb)
    
    # Compute mean prototype for each class
    prototypes = {}
    for class_idx, embeddings_list in class_embeddings.items():
        if embeddings_list:
            prototype = np.mean(embeddings_list, axis=0).tolist()
            class_name = class_names[class_idx]
            prototypes[class_name] = {
                "embedding": prototype,
                "num_samples": len(embeddings_list)
            }
    
    return prototypes


def main():
    parser = argparse.ArgumentParser(description="Train PlantVillage disease detection model")
    parser.add_argument("--data-dir", type=str, 
                       default="../Dataset/PlantVillage",
                       help="Path to PlantVillage dataset directory")
    parser.add_argument("--output-dir", type=str, 
                       default="./assets",
                       help="Directory to save model and prototypes")
    parser.add_argument("--epochs", type=int, default=20,
                       help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32,
                       help="Batch size for training")
    parser.add_argument("--lr", type=float, default=0.001,
                       help="Learning rate")
    parser.add_argument("--limit-per-class", type=int, default=None,
                       help="Limit images per class (for faster testing)")
    parser.add_argument("--device", type=str, default="auto",
                       help="Device to use (cuda/cpu/auto)")
    
    args = parser.parse_args()
    
    # Setup
    logger.info("=" * 70)
    logger.info("🌱 PlantVillage Disease Detection Training")
    logger.info("=" * 70)
    
    # Device
    if args.device == "auto":
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    else:
        device = torch.device(args.device)
    logger.info(f"Using device: {device}")
    
    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Data transforms
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                           std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                           std=[0.229, 0.224, 0.225])
    ])
    
    # Load dataset
    logger.info(f"\nLoading dataset from: {args.data_dir}")
    full_dataset = PlantVillageDataset(
        root_dir=args.data_dir,
        transform=train_transform,
        limit_per_class=args.limit_per_class
    )
    
    # Split into train/val (80/20)
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(
        full_dataset, [train_size, val_size]
    )
    
    # Update validation dataset transform
    val_dataset.dataset.transform = val_transform
    
    logger.info(f"Train samples: {len(train_dataset)}")
    logger.info(f"Validation samples: {len(val_dataset)}")
    
    # Create dataloaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=0,  # Set to 0 for Windows compatibility
        pin_memory=True if device.type == "cuda" else False
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=0,
        pin_memory=True if device.type == "cuda" else False
    )
    
    # Create model
    logger.info("\nInitializing model...")
    model = PestEncoder(
        model_name="mobilenetv3_large_100",
        embedding_dim=512,
        device=str(device)
    )
    model = model.to(device)
    
    # Loss and optimizer
    criterion = PrototypicalLoss()
    optimizer = optim.Adam(model.get_trainable_parameters(), lr=args.lr)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.1)
    
    # Training loop
    logger.info(f"\n{'=' * 70}")
    logger.info("Starting training...")
    logger.info(f"{'=' * 70}\n")
    
    best_val_acc = 0.0
    training_history = []
    
    for epoch in range(1, args.epochs + 1):
        logger.info(f"\nEpoch {epoch}/{args.epochs}")
        logger.info("-" * 50)
        
        # Train
        train_loss, train_acc = train_epoch(
            model, train_loader, criterion, optimizer, device, epoch
        )
        
        # Validate
        val_loss, val_acc = validate(model, val_loader, criterion, device)
        
        # Step scheduler
        scheduler.step()
        
        # Log metrics
        logger.info(f"\nResults:")
        logger.info(f"  Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.4f}")
        logger.info(f"  Val Loss:   {val_loss:.4f} | Val Acc:   {val_acc:.4f}")
        
        # Save history
        training_history.append({
            "epoch": epoch,
            "train_loss": train_loss,
            "train_acc": train_acc,
            "val_loss": val_loss,
            "val_acc": val_acc
        })
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            model_path = output_dir / "pest_encoder.pth"
            model.save_weights(str(model_path))
            logger.info(f"  ✅ Saved best model (val_acc: {val_acc:.4f})")
    
    # Final results
    logger.info(f"\n{'=' * 70}")
    logger.info("Training completed!")
    logger.info(f"Best validation accuracy: {best_val_acc:.4f}")
    logger.info(f"{'=' * 70}\n")
    
    # Generate prototypes
    logger.info("Generating class prototypes for few-shot learning...")
    full_dataset.transform = val_transform
    full_loader = DataLoader(
        full_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=0
    )
    
    prototypes = generate_prototypes(
        model, full_loader, full_dataset.idx_to_class, device
    )
    
    # Save prototypes
    prototypes_path = output_dir / "class_prototypes.json"
    with open(prototypes_path, 'w') as f:
        json.dump(prototypes, f, indent=2)
    
    logger.info(f"✅ Saved {len(prototypes)} class prototypes to: {prototypes_path}")
    
    # Save training history
    history_path = output_dir / "training_history.json"
    with open(history_path, 'w') as f:
        json.dump(training_history, f, indent=2)
    
    logger.info(f"✅ Saved training history to: {history_path}")
    
    # Save class mapping
    class_mapping_path = output_dir / "class_mapping.json"
    with open(class_mapping_path, 'w') as f:
        json.dump({
            "class_to_idx": full_dataset.class_to_idx,
            "idx_to_class": full_dataset.idx_to_class
        }, f, indent=2)
    
    logger.info(f"✅ Saved class mapping to: {class_mapping_path}")
    
    logger.info(f"\n{'=' * 70}")
    logger.info("🎉 All done! Your model is ready to use.")
    logger.info(f"{'=' * 70}")


if __name__ == "__main__":
    main()
