"""Generate prototypes from existing trained model"""
import torch
import json
import numpy as np
from pathlib import Path
from train_simple import SimpleMobileNetEncoder, SimplePlantVillageDataset, simple_transforms

print("Loading model...")
model = SimpleMobileNetEncoder(512)
model.load_state_dict(torch.load("assets/simple_pest_encoder.pth", map_location='cpu'))
model.eval()
print("✅ Model loaded")

print("\nLoading dataset...")
dataset = SimplePlantVillageDataset("../Dataset/PlantVillage", is_train=False, limit_per_class=None)
print(f"✅ Loaded {len(dataset)} images, {len(dataset.class_to_idx)} classes")

from torch.utils.data import DataLoader

loader = DataLoader(dataset, batch_size=32, shuffle=False, num_workers=0)

print("\nGenerating embeddings...")
class_embeddings = {i: [] for i in range(len(dataset.class_to_idx))}

with torch.no_grad():
    for i, (images, labels) in enumerate(loader):
        embeddings = model(images).cpu().numpy()
        for emb, label in zip(embeddings, labels):
            class_embeddings[label.item()].append(emb)
        if (i+1) % 10 == 0:
            print(f"  Processed {(i+1)*32} images...")

print("\n✅ Computing prototypes...")
prototypes = {}
for class_idx, embeddings_list in class_embeddings.items():
    if embeddings_list:
        prototype = np.mean(embeddings_list, axis=0).tolist()
        class_name = dataset.idx_to_class[class_idx]
        prototypes[class_name] = {
            "embedding": prototype,
            "num_samples": len(embeddings_list)
        }
        print(f"  {class_name}: {len(embeddings_list)} samples")

# Save prototypes
Path("assets").mkdir(exist_ok=True)
with open("assets/class_prototypes.json", 'w') as f:
    json.dump(prototypes, f, indent=2)

print(f"\n✅ Saved {len(prototypes)} prototypes to assets/class_prototypes.json")

# Save class mapping
with open("assets/class_mapping.json", 'w') as f:
    json.dump({
        "class_to_idx": dataset.class_to_idx,
        "idx_to_class": dataset.idx_to_class
    }, f, indent=2)

print("✅ Saved class mapping to assets/class_mapping.json")
print("\n🎉 Done! Your model is ready to use.")
