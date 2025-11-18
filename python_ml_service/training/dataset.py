"""
IP102 Dataset Loader
====================
PyTorch dataset for loading and preprocessing the IP102 pest dataset.

IP102 is a large-scale benchmark dataset for insect pest recognition,
containing 75,222 images of 102 pest categories.

Dataset structure:
/IP102/
  /images/
    /1/   # Class 1 images
    /2/   # Class 2 images
    ...
    /102/ # Class 102 images
  /train.txt  # Training split
  /val.txt    # Validation split
  /test.txt   # Test split
"""

import logging
from pathlib import Path
from typing import Tuple, List, Optional

import torch
from torch.utils.data import Dataset
from PIL import Image
from torchvision import transforms

logger = logging.getLogger(__name__)


class IP102Dataset(Dataset):
    """
    IP102 Pest Recognition Dataset.
    
    Loads images and labels from the IP102 dataset for training/validation.
    """
    
    def __init__(
        self,
        root_dir: str,
        split: str = "train",
        transform: Optional[transforms.Compose] = None,
        image_size: int = 224
    ):
        """
        Initialize IP102 dataset.
        
        Args:
            root_dir: Path to IP102 dataset root directory
            split: Dataset split ('train', 'val', or 'test')
            transform: Optional torchvision transforms
            image_size: Target image size for resizing
        """
        self.root_dir = Path(root_dir)
        self.split = split
        self.image_size = image_size
        
        # Load image paths and labels from split file
        split_file = self.root_dir / f"{split}.txt"
        if not split_file.exists():
            raise FileNotFoundError(f"Split file not found: {split_file}")
        
        self.samples = []
        with open(split_file, 'r') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 2:
                    img_path = self.root_dir / "images" / parts[0]
                    label = int(parts[1]) - 1  # Convert to 0-indexed
                    self.samples.append((img_path, label))
        
        logger.info(f"Loaded {len(self.samples)} samples from {split} split")
        
        # Default transforms if none provided
        if transform is None:
            self.transform = transforms.Compose([
                transforms.Resize((image_size, image_size)),
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.RandomRotation(15),
                transforms.ColorJitter(brightness=0.2, contrast=0.2),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])
        else:
            self.transform = transform
    
    def __len__(self) -> int:
        """Return dataset size."""
        return len(self.samples)
    
    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        """
        Get a sample from the dataset.
        
        Args:
            idx: Sample index
            
        Returns:
            Tuple[torch.Tensor, int]: (image_tensor, label)
        """
        img_path, label = self.samples[idx]
        
        # Load image
        try:
            image = Image.open(img_path).convert('RGB')
        except Exception as e:
            logger.error(f"Failed to load image {img_path}: {e}")
            # Return a blank image if loading fails
            image = Image.new('RGB', (self.image_size, self.image_size))
        
        # Apply transforms
        if self.transform:
            image = self.transform(image)
        
        return image, label


class EpisodicBatchSampler:
    """
    Sampler for episodic training in few-shot learning.
    
    Samples N classes (ways) and K samples per class (shots) to create
    episodes for prototypical network training.
    """
    
    def __init__(
        self,
        labels: List[int],
        num_classes: int,
        num_support: int,
        num_query: int,
        num_episodes: int
    ):
        """
        Initialize episodic batch sampler.
        
        Args:
            labels: List of all labels in dataset
            num_classes: Number of classes per episode (N-way)
            num_support: Support samples per class (K-shot)
            num_query: Query samples per class
            num_episodes: Total number of episodes
        """
        self.labels = labels
        self.num_classes = num_classes
        self.num_support = num_support
        self.num_query = num_query
        self.num_episodes = num_episodes
        
        # Group indices by class
        self.class_indices = {}
        for idx, label in enumerate(labels):
            if label not in self.class_indices:
                self.class_indices[label] = []
            self.class_indices[label].append(idx)
        
        # Ensure all classes have enough samples
        min_samples = num_support + num_query
        self.valid_classes = [
            cls for cls, indices in self.class_indices.items()
            if len(indices) >= min_samples
        ]
        
        logger.info(f"Episodic sampler: {len(self.valid_classes)} valid classes")
    
    def __iter__(self):
        """
        Generate episodes.
        
        Yields:
            List[int]: Batch of sample indices for one episode
        """
        for _ in range(self.num_episodes):
            # Sample N classes for this episode
            episode_classes = torch.randperm(len(self.valid_classes))[:self.num_classes]
            episode_classes = [self.valid_classes[i] for i in episode_classes]
            
            batch = []
            for cls in episode_classes:
                # Sample K support + Q query samples
                cls_indices = self.class_indices[cls]
                sampled = torch.randperm(len(cls_indices))[:(self.num_support + self.num_query)]
                batch.extend([cls_indices[i] for i in sampled])
            
            yield batch
    
    def __len__(self) -> int:
        """Return number of episodes."""
        return self.num_episodes


def get_ip102_dataloaders(
    root_dir: str,
    batch_size: int = 32,
    num_workers: int = 4,
    image_size: int = 224
) -> Tuple[torch.utils.data.DataLoader, torch.utils.data.DataLoader]:
    """
    Create train and validation dataloaders for IP102.
    
    Args:
        root_dir: Path to IP102 dataset
        batch_size: Batch size
        num_workers: Number of data loading workers
        image_size: Target image size
        
    Returns:
        Tuple of (train_loader, val_loader)
    """
    # Training dataset with augmentation
    train_dataset = IP102Dataset(
        root_dir=root_dir,
        split="train",
        image_size=image_size
    )
    
    # Validation dataset without augmentation
    val_transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    
    val_dataset = IP102Dataset(
        root_dir=root_dir,
        split="val",
        transform=val_transform,
        image_size=image_size
    )
    
    # Create dataloaders
    train_loader = torch.utils.data.DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True
    )
    
    val_loader = torch.utils.data.DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )
    
    return train_loader, val_loader
