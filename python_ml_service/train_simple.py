"""
Simplified PlantVillage Training Script (No TorchVision)
=========================================================
Fast-loading training script using only PyTorch and PIL.
"""

import os
import sys
import logging
from pathlib import Path
import json

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import numpy as np

# Add parent directory
sys.path.insert(0, str(Path(__file__).parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger(__name__)


def simple_transforms(image, is_train=True):
    """Simple image transforms using PIL only."""
    # Resize
    image = image.resize((224, 224), Image.BILINEAR)
    
    # Convert to numpy
    img_array = np.array(image).astype(np.float32) / 255.0
    
    # Normalize (ImageNet stats)
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    img_array = (img_array - mean) / std
    
    # To tensor [C, H, W] - ensure float32
    img_tensor = torch.from_numpy(img_array.transpose(2, 0, 1)).float()
    
    return img_tensor


class SimplePlantVillageDataset(Dataset):
    """Lightweight dataset loader."""
    
    def __init__(self, root_dir, is_train=True, limit_per_class=None):
        self.root_dir = Path(root_dir)
        self.is_train = is_train
        self.samples = []
        self.class_to_idx = {}
        self.idx_to_class = {}
        
        # Load dataset
        class_dirs = sorted([d for d in self.root_dir.iterdir() if d.is_dir()])
        
        for idx, class_dir in enumerate(class_dirs):
            class_name = class_dir.name
            self.class_to_idx[class_name] = idx
            self.idx_to_class[idx] = class_name
            
            # Get images
            image_files = list(class_dir.glob("*.jpg")) + list(class_dir.glob("*.JPG")) + \
                         list(class_dir.glob("*.jpeg")) + list(class_dir.glob("*.png"))
            
            if limit_per_class:
                image_files = image_files[:limit_per_class]
            
            for img_path in image_files:
                self.samples.append((str(img_path), idx))
            
            logger.info(f"{class_name}: {len(image_files)} images")
        
        logger.info(f"Total: {len(self.samples)} images, {len(class_dirs)} classes")
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        
        try:
            image = Image.open(img_path).convert('RGB')
            image = simple_transforms(image, self.is_train)
            return image, label
        except:
            # Return blank on error
            blank = torch.zeros(3, 224, 224)
            return blank, label


class SimpleMobileNetEncoder(nn.Module):
    """Simplified encoder using only PyTorch (no timm)."""
    
    def __init__(self, embedding_dim=512):
        super().__init__()
        
        # Simple CNN backbone
        self.features = nn.Sequential(
            # Block 1
            nn.Conv2d(3, 32, 3, stride=2, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            
            # Block 2
            nn.Conv2d(32, 64, 3, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            
            # Block 3
            nn.Conv2d(64, 128, 3, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            
            # Block 4
            nn.Conv2d(128, 256, 3, stride=2, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            
            # Block 5
            nn.Conv2d(256, 512, 3, stride=2, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(inplace=True),
            
            # Global average pooling
            nn.AdaptiveAvgPool2d(1)
        )
        
        # Projection head
        self.projection = nn.Sequential(
            nn.Flatten(),
            nn.Linear(512, 1024),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(1024, embedding_dim)
        )
    
    def forward(self, x):
        x = self.features(x)
        x = self.projection(x)
        # L2 normalize
        x = nn.functional.normalize(x, p=2, dim=1)
        return x


class PrototypicalLoss(nn.Module):
    """Prototypical loss for few-shot learning."""
    
    def forward(self, embeddings, labels):
        unique_labels = torch.unique(labels)
        
        # Compute prototypes
        prototypes = []
        for label in unique_labels:
            mask = (labels == label)
            prototype = embeddings[mask].mean(dim=0)
            prototypes.append(prototype)
        
        prototypes = torch.stack(prototypes)
        
        # Distances
        distances = -torch.cdist(embeddings, prototypes)
        
        # Map labels
        label_to_idx = {label.item(): idx for idx, label in enumerate(unique_labels)}
        local_labels = torch.tensor([label_to_idx[l.item()] for l in labels], 
                                    device=embeddings.device)
        
        # Loss
        loss = nn.functional.cross_entropy(distances, local_labels)
        accuracy = (distances.argmax(dim=1) == local_labels).float().mean()
        
        return loss, accuracy


def train():
    """Main training function."""
    logger.info("=" * 70)
    logger.info("🌱 PlantVillage Disease Detection Training (Simplified)")
    logger.info("=" * 70)
    
    # Config
    data_dir = "../Dataset/PlantVillage"
    output_dir = Path("assets")
    output_dir.mkdir(exist_ok=True)
    
    epochs = 15
    batch_size = 24
    lr = 0.001
    limit_per_class = 150  # Faster training
    
    # Device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Device: {device}")
    
    # Load dataset
    logger.info(f"\nLoading from: {data_dir}")
    dataset = SimplePlantVillageDataset(data_dir, is_train=True, limit_per_class=limit_per_class)
    
    # Split
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    logger.info(f"Train: {len(train_dataset)}, Val: {len(val_dataset)}")
    
    # Dataloaders
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    # Model
    logger.info("\nInitializing model...")
    model = SimpleMobileNetEncoder(embedding_dim=512).to(device)
    criterion = PrototypicalLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.5)
    
    # Training loop
    logger.info(f"\n{'=' * 70}")
    logger.info("Training started!")
    logger.info(f"{'=' * 70}\n")
    
    best_val_acc = 0.0
    history = []
    
    for epoch in range(1, epochs + 1):
        logger.info(f"\n📊 Epoch {epoch}/{epochs}")
        logger.info("-" * 50)
        
        # Train
        model.train()
        train_loss, train_acc = 0, 0
        num_batches = 0
        
        for i, (images, labels) in enumerate(train_loader):
            images, labels = images.to(device), labels.to(device)
            
            embeddings = model(images)
            loss, acc = criterion(embeddings, labels)
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            train_acc += acc.item()
            num_batches += 1
            
            if (i + 1) % 10 == 0:
                logger.info(f"  Batch {i+1}/{len(train_loader)}: loss={loss.item():.4f}, acc={acc.item():.4f}")
        
        train_loss /= num_batches
        train_acc /= num_batches
        
        # Validate
        model.eval()
        val_loss, val_acc = 0, 0
        num_val_batches = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                embeddings = model(images)
                loss, acc = criterion(embeddings, labels)
                val_loss += loss.item()
                val_acc += acc.item()
                num_val_batches += 1
        
        val_loss /= num_val_batches
        val_acc /= num_val_batches
        
        scheduler.step()
        
        logger.info(f"\n✅ Results:")
        logger.info(f"  Train: loss={train_loss:.4f}, acc={train_acc:.4f}")
        logger.info(f"  Val:   loss={val_loss:.4f}, acc={val_acc:.4f}")
        
        history.append({
            "epoch": epoch,
            "train_loss": train_loss,
            "train_acc": train_acc,
            "val_loss": val_loss,
            "val_acc": val_acc
        })
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), output_dir / "simple_pest_encoder.pth")
            logger.info(f"  💾 Saved best model (val_acc: {val_acc:.4f})")
    
    # Generate prototypes
    logger.info(f"\n{'=' * 70}")
    logger.info("Generating class prototypes...")
    logger.info(f"{'=' * 70}")
    
    model.eval()
    class_embeddings = {i: [] for i in range(len(dataset.class_to_idx))}
    
    full_loader = DataLoader(dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    with torch.no_grad():
        for images, labels in full_loader:
            images = images.to(device)
            embeddings = model(images).cpu().numpy()
            
            for emb, label in zip(embeddings, labels):
                class_embeddings[label.item()].append(emb)
    
    prototypes = {}
    for class_idx, embeddings_list in class_embeddings.items():
        if embeddings_list:
            prototype = np.mean(embeddings_list, axis=0).tolist()
            class_name = dataset.idx_to_class[class_idx]
            prototypes[class_name] = {
                "embedding": prototype,
                "num_samples": len(embeddings_list)
            }
    
    # Save everything
    with open(output_dir / "class_prototypes.json", 'w') as f:
        json.dump(prototypes, f, indent=2)
    
    with open(output_dir / "training_history.json", 'w') as f:
        json.dump(history, f, indent=2)
    
    with open(output_dir / "class_mapping.json", 'w') as f:
        json.dump({
            "class_to_idx": dataset.class_to_idx,
            "idx_to_class": dataset.idx_to_class
        }, f, indent=2)
    
    logger.info(f"\n{'=' * 70}")
    logger.info("🎉 Training completed!")
    logger.info(f"Best validation accuracy: {best_val_acc:.4f}")
    logger.info(f"Model saved to: {output_dir / 'simple_pest_encoder.pth'}")
    logger.info(f"Prototypes: {len(prototypes)} classes")
    logger.info(f"{'=' * 70}\n")


if __name__ == "__main__":
    try:
        train()
    except KeyboardInterrupt:
        logger.info("\n\n⏸️  Training interrupted by user")
    except Exception as e:
        logger.error(f"\n\n❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
