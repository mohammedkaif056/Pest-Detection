"""
Multi-Plant Disease Detection Training Script
==============================================
Train on ALL available plant diseases: Tomato, Pepper, and Potato.

Dataset structure:
Dataset/
    ├── Pepper__bell___Bacterial_spot/
    ├── Pepper__bell___healthy/
    ├── Potato___Early_blight/
    ├── Potato___healthy/
    ├── Potato___Late_blight/
    ├── Tomato_Bacterial_spot/
    ├── Tomato_Early_blight/
    ├── Tomato_healthy/
    └── ... (13 tomato classes total)

This will train a universal plant disease detector supporting 18 classes.
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class MultiPlantDataset(Dataset):
    """
    Dataset loader for multiple plant disease datasets.
    
    Loads from all top-level directories in Dataset/ folder,
    excluding the PlantVillage subfolder (old structure).
    """
    
    def __init__(self, root_dir: str, transform=None, limit_per_class: int = None):
        """
        Args:
            root_dir: Path to Dataset directory
            transform: Image transformations
            limit_per_class: Optional limit on images per class
        """
        self.root_dir = Path(root_dir)
        self.transform = transform
        self.limit_per_class = limit_per_class
        
        self.samples = []
        self.class_to_idx = {}
        self.idx_to_class = {}
        
        self._load_dataset()
    
    def _load_dataset(self):
        """Load all images from disease directories."""
        logger.info(f"Loading multi-plant dataset from: {self.root_dir}")
        
        # Get all class directories (excluding PlantVillage)
        all_dirs = sorted([d for d in self.root_dir.iterdir() if d.is_dir()])
        class_dirs = [d for d in all_dirs if d.name != "PlantVillage"]
        
        if not class_dirs:
            raise ValueError(f"No class directories found in {self.root_dir}")
        
        # Create class mappings
        for idx, class_dir in enumerate(class_dirs):
            class_name = class_dir.name
            self.class_to_idx[class_name] = idx
            self.idx_to_class[idx] = class_name
        
        logger.info(f"\n{'=' * 70}")
        logger.info(f"Found {len(class_dirs)} disease classes:")
        logger.info(f"{'=' * 70}")
        
        # Group by plant type
        pepper_classes = []
        potato_classes = []
        tomato_classes = []
        
        for class_name in sorted(self.class_to_idx.keys()):
            if "Pepper" in class_name or "pepper" in class_name:
                pepper_classes.append(class_name)
            elif "Potato" in class_name or "potato" in class_name:
                potato_classes.append(class_name)
            else:
                tomato_classes.append(class_name)
        
        if pepper_classes:
            logger.info("\n🌶️  PEPPER DISEASES:")
            for cn in pepper_classes:
                logger.info(f"   - {cn}")
        
        if potato_classes:
            logger.info("\n🥔 POTATO DISEASES:")
            for cn in potato_classes:
                logger.info(f"   - {cn}")
        
        if tomato_classes:
            logger.info("\n🍅 TOMATO DISEASES:")
            for cn in tomato_classes:
                logger.info(f"   - {cn}")
        
        logger.info(f"\n{'=' * 70}\n")
        
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
            
            logger.info(f"{class_name}: {len(image_files)} images")
        
        logger.info(f"\n{'=' * 70}")
        logger.info(f"Total samples: {len(self.samples)}")
        logger.info(f"{'=' * 70}\n")
    
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
    """Prototypical Networks loss for few-shot learning."""
    
    def __init__(self):
        super().__init__()
    
    def forward(self, embeddings, labels):
        """
        Args:
            embeddings: [batch_size, embedding_dim]
            labels: [batch_size]
        
        Returns:
            loss: scalar
            accuracy: scalar
        """
        unique_labels = torch.unique(labels)
        n_classes = len(unique_labels)
        
        # Compute prototypes (mean embedding per class)
        prototypes = torch.stack([
            embeddings[labels == label].mean(dim=0)
            for label in unique_labels
        ])
        
        # Compute distances to all prototypes
        dists = torch.cdist(embeddings, prototypes)
        
        # Convert to log probabilities
        log_p_y = torch.nn.functional.log_softmax(-dists, dim=1)
        
        # Get target indices
        target_indices = torch.zeros(len(labels), dtype=torch.long, device=labels.device)
        for i, label in enumerate(unique_labels):
            target_indices[labels == label] = i
        
        # Compute loss
        loss = torch.nn.functional.nll_loss(log_p_y, target_indices)
        
        # Compute accuracy
        _, predicted = torch.max(log_p_y, 1)
        accuracy = (predicted == target_indices).float().mean()
        
        return loss, accuracy


def generate_prototypes(model, dataloader, idx_to_class, device):
    """Generate class prototypes from full dataset."""
    model.eval()
    
    # Collect embeddings per class
    class_embeddings = {}
    
    with torch.no_grad():
        for images, labels in tqdm(dataloader, desc="Generating prototypes"):
            images = images.to(device)
            embeddings = model(images)
            
            for emb, label in zip(embeddings, labels):
                label_idx = label.item()
                if label_idx not in class_embeddings:
                    class_embeddings[label_idx] = []
                class_embeddings[label_idx].append(emb.cpu().numpy())
    
    # Compute mean prototype per class
    prototypes = {}
    for label_idx, embeddings in class_embeddings.items():
        class_name = idx_to_class[label_idx]
        prototype = np.mean(embeddings, axis=0)
        prototypes[class_name] = prototype.tolist()
    
    return prototypes


def train_one_epoch(model, dataloader, criterion, optimizer, device, epoch):
    """Train for one epoch."""
    model.train()
    total_loss = 0
    total_acc = 0
    num_batches = 0
    
    pbar = tqdm(dataloader, desc=f"Epoch {epoch}")
    
    for images, labels in pbar:
        images = images.to(device)
        labels = labels.to(device)
        
        # Forward pass
        embeddings = model(images)
        loss, acc = criterion(embeddings, labels)
        
        # Backward pass
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        # Update metrics
        total_loss += loss.item()
        total_acc += acc.item()
        num_batches += 1
        
        pbar.set_postfix({
            'loss': f'{loss.item():.4f}',
            'acc': f'{acc.item():.4f}'
        })
    
    avg_loss = total_loss / num_batches
    avg_acc = total_acc / num_batches
    
    return avg_loss, avg_acc


def validate(model, dataloader, criterion, device):
    """Validate model."""
    model.eval()
    total_loss = 0
    total_acc = 0
    num_batches = 0
    
    with torch.no_grad():
        for images, labels in tqdm(dataloader, desc="Validating"):
            images = images.to(device)
            labels = labels.to(device)
            
            embeddings = model(images)
            loss, acc = criterion(embeddings, labels)
            
            total_loss += loss.item()
            total_acc += acc.item()
            num_batches += 1
    
    avg_loss = total_loss / num_batches
    avg_acc = total_acc / num_batches
    
    return avg_loss, avg_acc


def main():
    parser = argparse.ArgumentParser(description="Train multi-plant disease detector")
    parser.add_argument("--data-dir", type=str, default="../Dataset",
                       help="Path to Dataset directory")
    parser.add_argument("--output-dir", type=str, default="./assets",
                       help="Output directory for model and prototypes")
    parser.add_argument("--epochs", type=int, default=20,
                       help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32,
                       help="Batch size")
    parser.add_argument("--lr", type=float, default=0.001,
                       help="Learning rate")
    parser.add_argument("--limit-per-class", type=int, default=None,
                       help="Limit images per class (for faster training)")
    
    args = parser.parse_args()
    
    # Setup
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Transforms
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
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
    full_dataset = MultiPlantDataset(
        root_dir=args.data_dir,
        transform=train_transform,
        limit_per_class=args.limit_per_class
    )
    
    # Split into train/val
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(
        full_dataset, [train_size, val_size]
    )
    
    # Set validation transform
    val_dataset.dataset.transform = val_transform
    
    # Create dataloaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=0
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=0
    )
    
    logger.info(f"Train samples: {len(train_dataset)}")
    logger.info(f"Validation samples: {len(val_dataset)}")
    
    # Create model
    model = PestEncoder().to(device)
    criterion = PrototypicalLoss()
    optimizer = optim.Adam(model.parameters(), lr=args.lr)
    
    # Training loop
    best_val_acc = 0
    training_history = []
    
    logger.info(f"\n{'=' * 70}")
    logger.info("Starting training...")
    logger.info(f"{'=' * 70}\n")
    
    for epoch in range(1, args.epochs + 1):
        # Train
        train_loss, train_acc = train_one_epoch(
            model, train_loader, criterion, optimizer, device, epoch
        )
        
        # Validate
        val_loss, val_acc = validate(model, val_loader, criterion, device)
        
        logger.info(
            f"Epoch {epoch}/{args.epochs} - "
            f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f} | "
            f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}"
        )
        
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
    logger.info("Generating class prototypes...")
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
    
    logger.info(f"✅ Saved {len(prototypes)} class prototypes")
    
    # Save training history
    history_path = output_dir / "training_history.json"
    with open(history_path, 'w') as f:
        json.dump(training_history, f, indent=2)
    
    # Save class mapping
    class_mapping_path = output_dir / "class_mapping.json"
    with open(class_mapping_path, 'w') as f:
        json.dump({
            "class_to_idx": full_dataset.class_to_idx,
            "idx_to_class": full_dataset.idx_to_class
        }, f, indent=2)
    
    logger.info(f"✅ Training complete! Model saved to: {model_path}")


if __name__ == "__main__":
    main()
