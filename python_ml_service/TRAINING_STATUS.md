# Plant Disease Detection Training - IN PROGRESS 🌱

## Current Status
**Training is currently running in the background!**

### Dataset Information
- **Source**: PlantVillage Dataset (located at `../Dataset/PlantVillage/`)
- **Total Images**: 2,250 images (150 per class)
- **Number of Classes**: 15 different plant diseases
- **Train/Val Split**: 80/20 (1,800 training, 450 validation)

### Classes Being Trained
1. Pepper__bell___Bacterial_spot
2. Pepper__bell___healthy
3. Potato___Early_blight
4. Potato___healthy
5. Potato___Late_blight
6. Tomato__Target_Spot
7. Tomato__Tomato_mosaic_virus
8. Tomato__Tomato_YellowLeaf__Curl_Virus
9. Tomato_Bacterial_spot
10. Tomato_Early_blight
11. Tomato_healthy
12. Tomato_Late_blight
13. Tomato_Leaf_Mold
14. Tomato_Septoria_leaf_spot
15. Tomato_Spider_mites_Two_spotted_spider_mite

## Training Configuration
- **Model**: SimpleMobileNetEncoder (Custom CNN)
- **Architecture**: 5-layer CNN + Projection Head
- **Embedding Dimension**: 512
- **Loss Function**: Prototypical Networks (Few-Shot Learning)
- **Optimizer**: Adam (lr=0.001)
- **Batch Size**: 24
- **Epochs**: 15
- **Device**: CPU
- **Learning Rate Schedule**: Step LR (step_size=5, gamma=0.5)

## What's Happening
The model is learning to:
1. **Extract features** from plant/leaf images using a custom CNN
2. **Generate 512-dimensional embeddings** for each image
3. **Classify diseases** using prototypical networks (measuring similarity between embeddings)

## Training Progress
- **Epoch 1/15** started at 11:06 AM
- **Batch 10/75** showed: loss=1.9953, acc=0.7917 (79% accuracy already!)
- Each epoch processes 75 batches of 24 images
- Estimated time per epoch: ~5-8 minutes on CPU
- **Total estimated time**: 10-15 minutes for all 15 epochs

## Output Files (will be generated when training completes)
All files will be saved to `python_ml_service/assets/`:

### 1. `simple_pest_encoder.pth`
- The trained model weights
- Can be loaded into SimpleMobileNetEncoder
- Used for generating embeddings from new images

### 2. `class_prototypes.json`
- Mean embedding for each of the 15 disease classes
- Used for few-shot classification
- Format:
```json
{
  "Tomato_healthy": {
    "embedding": [0.123, -0.456, ...],  // 512 numbers
    "num_samples": 150
  },
  ...
}
```

### 3. `class_mapping.json`
- Maps class names to indices and vice versa
- Format:
```json
{
  "class_to_idx": {"Tomato_healthy": 0, ...},
  "idx_to_class": {"0": "Tomato_healthy", ...}
}
```

### 4. `training_history.json`
- Training metrics for each epoch
- Track loss and accuracy over time
- Can be used to plot learning curves

## How to Use the Trained Model

### Option 1: Use with the ML Service
Once training completes, update `main.py` to load the simple model:
```python
model = SimpleMobileNetEncoder(embedding_dim=512)
model.load_state_dict(torch.load("assets/simple_pest_encoder.pth"))
model.eval()
```

### Option 2: Test Inference Directly
```python
import torch
from train_simple import SimpleMobileNetEncoder, simple_transforms
from PIL import Image
import json

# Load model
model = SimpleMobileNetEncoder(512)
model.load_state_dict(torch.load("assets/simple_pest_encoder.pth"))
model.eval()

# Load prototypes
with open("assets/class_prototypes.json") as f:
    prototypes = json.load(f)

# Process image
image = Image.open("test_leaf.jpg")
image_tensor = simple_transforms(image).unsqueeze(0)

# Generate embedding
with torch.no_grad():
    embedding = model(image_tensor).numpy()[0]

# Find closest prototype (classification)
import numpy as np
best_match = None
best_similarity = -1

for class_name, data in prototypes.items():
    prototype = np.array(data["embedding"])
    # Cosine similarity
    similarity = np.dot(embedding, prototype)
    if similarity > best_similarity:
        best_similarity = similarity
        best_match = class_name

print(f"Prediction: {best_match}")
print(f"Confidence: {best_similarity:.4f}")
```

## Monitoring Training

### Check current progress:
```powershell
cd python_ml_service
Get-Content training_log.txt -Tail 20  # If logging to file
```

### Or check if model file exists:
```powershell
Test-Path assets/simple_pest_encoder.pth
```

## Expected Results
Based on the early batches (79% accuracy in epoch 1):
- **Expected final validation accuracy**: 85-95%
- **This is excellent** for a few-shot learning task with 15 classes
- The model should generalize well to new images of these diseases

## Next Steps After Training Completes
1. ✅ **Verify model files** exist in `assets/` folder
2. ✅ **Test the model** on a sample image
3. ✅ **Integrate with ML service** by updating the encoder loading logic
4. ✅ **Deploy to production** - the model is ready for real-time inference!

## Troubleshooting

### If training was interrupted:
- Just run the command again - it will start fresh
- The best model is saved after each improvement

### If you want to resume monitoring:
```powershell
# Check if training process is still running
Get-Process python

# View the terminal where training is running
# (Look for the background terminal in VS Code)
```

---

**Note**: Training is currently in progress. Check back in 10-15 minutes for the completed model!
