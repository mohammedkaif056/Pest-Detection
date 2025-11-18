# Quick Start Guide - AllergyConnectAI

## Current Status
✅ **Multi-plant detection model ready** (Peppers, Potatoes, Tomatoes)  
✅ **15 disease classes** with 92% accuracy  
✅ **Disease database complete** with symptoms, treatments, prevention

---

## Start the Application (2 Steps)

### Step 1: Start ML Service
```powershell
cd C:\Users\mdkai\Desktop\AllergyConnectAI\python_ml_service
C:\Users\mdkai\Anaconda3\python.exe C:\Users\mdkai\Desktop\AllergyConnectAI\python_ml_service\start.py
```
**Keep this window open!** (Port 8001)

### Step 2: Start Backend (NEW terminal window)
```powershell
cd C:\Users\mdkai\Desktop\AllergyConnectAI
npm run dev
```
**Keep this window open!** (Port 5000)

### Step 3: Access Application
Open browser: **http://localhost:5000**

---

## One-Command Startup (Both Services)

Copy and paste this into PowerShell:

```powershell
# Start ML Service in background window
cd C:\Users\mdkai\Desktop\AllergyConnectAI\python_ml_service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\mdkai\Desktop\AllergyConnectAI\python_ml_service'; `$env:Path += ';C:\Users\mdkai\AppData\Roaming\Python\Scripts'; Write-Host '✅ ML Service Starting...' -ForegroundColor Green; poetry run python serve.py" -WindowStyle Normal

# Wait for ML service to load
Start-Sleep -Seconds 8

# Start Backend in background window
cd C:\Users\mdkai\Desktop\AllergyConnectAI
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\mdkai\Desktop\AllergyConnectAI'; Write-Host '✅ Backend Starting...' -ForegroundColor Green; npm run dev" -WindowStyle Normal

# Wait and verify
Start-Sleep -Seconds 5
$ports = Get-NetTCPConnection -LocalPort 5000,8001 -State Listen -ErrorAction SilentlyContinue
if ($ports.Count -eq 2) {
    Write-Host "`n✅ BOTH SERVICES RUNNING!" -ForegroundColor Green
    Write-Host "🌐 Open: http://localhost:5000" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  Some services may not have started" -ForegroundColor Yellow
    Write-Host "Check the opened windows for errors" -ForegroundColor Yellow
}
```

---

## Training Better Model (Optional - Tomorrow)

The current model has 92% accuracy but sometimes confuses similar diseases.

### To Train Better Model (60-90 minutes):
```powershell
cd C:\Users\mdkai\Desktop\AllergyConnectAI\python_ml_service
$env:Path += ";C:\Users\mdkai\AppData\Roaming\Python\Scripts"
poetry run python train_all_plants.py --epochs 25 --batch-size 32 --lr 0.0005
```

**What this does:**
- Uses all 41,276 images
- Trains for 25 epochs
- Expected accuracy: 95-98%
- Better distinction between similar diseases (potato early/late blight, etc.)

**After training completes:**
1. Stop ML service (close the window)
2. Restart ML service - it will automatically use the new model
3. Test with your images - accuracy should be much better

---

## Current Model Capabilities

### 🌶️ Pepper (2 classes)
- Bacterial Spot ✅
- Healthy ✅

### 🥔 Potato (3 classes)  
- Early Blight ⚠️ (sometimes confused with Late Blight)
- Late Blight ⚠️ (sometimes confused with Early Blight)
- Healthy ✅

### 🍅 Tomato (10 classes)
- Bacterial Spot ✅
- Early Blight ✅
- Late Blight ✅
- Leaf Mold ✅
- Septoria Leaf Spot ✅
- Spider Mites ✅
- Target Spot ✅
- Mosaic Virus ✅
- Yellow Leaf Curl Virus ✅
- Healthy ✅

---

## Troubleshooting

### Services won't start
```powershell
# Kill all existing processes
Get-Process -Name python,node -ErrorAction SilentlyContinue | Stop-Process -Force

# Then restart using Step 1 & 2 above
```

### "Payload too large" error
Already fixed! Backend now accepts up to 50MB images.

### Wrong detection
- Current model: 92% accuracy (quick training)
- For better accuracy: Run full training (see above)
- Similar diseases (like potato early/late blight) need more training to distinguish

### ML Service not responding
```powershell
# Check if running
Get-NetTCPConnection -LocalPort 8001 -State Listen

# If not running, restart ML service (Step 1)
```

---

## File Locations

- **Model:** `python_ml_service/assets/pest_encoder.pth`
- **Prototypes:** `python_ml_service/assets/class_prototypes.json`
- **Disease Database:** `python_ml_service/disease_database.py`
- **Training Script:** `python_ml_service/train_all_plants.py`

---

## Next Steps for Better Accuracy

1. **Run full training overnight** (while you sleep)
2. **Collect more images** of problematic classes (especially Potato___healthy - only 304 images)
3. **Add data augmentation** during training for better generalization
4. **Increase training epochs** to 30-40 for even better accuracy

---

**Last Updated:** November 18, 2025  
**Model Version:** Multi-plant v1.0 (92% accuracy)  
**Status:** Ready for use, training pending for higher accuracy  
**AI API:** Groq Llama 3.2 Vision (configured in .env)   