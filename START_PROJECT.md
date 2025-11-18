# 🚀 Quick Start Guide - Plant Disease Detection System

## Step 1: Start ML Service (Python)

Open PowerShell and run:

```powershell
cd C:\Users\mdkai\Desktop\AllergyConnectAI\python_ml_service
$env:Path += ";C:\Users\mdkai\AppData\Roaming\Python\Scripts"
poetry run python serve.py
```

**Expected Output:**
```
🌱 Starting PlantVillage Disease Detection Service
📡 Service will be available at:
   • Health:  http://localhost:8001/health
   • Detect:  http://localhost:8001/api/v1/detect
INFO: Uvicorn running on http://0.0.0.0:8001
```

✅ **Leave this window open** - ML Service must keep running

---

## Step 2: Start Backend + Frontend (Node.js)

Open a **NEW** PowerShell window and run:

```powershell
cd C:\Users\mdkai\Desktop\AllergyConnectAI
npm run dev
```

**Expected Output:**
```
> rest-express@1.0.0 dev
> tsx server/index.ts

serving on port 5000
```

✅ **Leave this window open** - Backend must keep running

---

## Step 3: Open the Application

Open your browser and go to:

```
http://localhost:5000
```

---

## Step 4: Test Detection

1. Click on **"Detect"** in the navigation
2. Click **"Take Photo"** or **"Upload Image"**
3. Select a plant leaf image (tomato works best)
4. Click **"Detect Pest"**

You should see:
- ✅ Disease name (e.g., "Leaf Mold on Tomato")
- ✅ Confidence percentage (e.g., "85.6%")
- ✅ Plant type
- ✅ Pathogen information
- ✅ Symptoms (6+ items)
- ✅ Treatment details
- ✅ Prevention methods

---

## 🔧 Troubleshooting

### Services Not Starting?

**Check if ports are already in use:**
```powershell
Get-NetTCPConnection -LocalPort 5000,8001 -State Listen
```

**Stop all services:**
```powershell
Get-Process -Name node,python | Stop-Process -Force
```

Then restart from Step 1.

---

### Still Showing "N/A%" or Empty Results?

**Option 1 - Clear Browser Cache:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Press `Ctrl + F5` to hard refresh

**Option 2 - Use Diagnostic Page:**

Open this file in your browser:
```
C:\Users\mdkai\Desktop\AllergyConnectAI\test_detection.html
```

This shows exactly what the API returns.

---

## 📊 System Status

**Model:**
- Architecture: SimpleMobileNetEncoder + Prototypical Networks
- Training Accuracy: 81.73%
- Dataset: PlantVillage (15 disease classes)
- Diseases Detected: 15 tomato diseases

**Services:**
- ML Service: FastAPI on port 8001
- Backend: Express.js on port 5000
- Frontend: React + Vite (served by backend)

---

## 🎯 One-Command Restart

If you need to restart everything:

```powershell
# Stop all
Get-Process -Name node,python -ErrorAction SilentlyContinue | Stop-Process -Force

# Start ML Service (in new window)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\mdkai\Desktop\AllergyConnectAI\python_ml_service; `$env:Path += ';C:\Users\mdkai\AppData\Roaming\Python\Scripts'; poetry run python serve.py"

# Wait for ML service to start
Start-Sleep -Seconds 10

# Start Backend (in new window)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\mdkai\Desktop\AllergyConnectAI; npm run dev"

# Wait for backend to start
Start-Sleep -Seconds 8

# Check status
Get-NetTCPConnection -LocalPort 5000,8001 -State Listen | Select-Object LocalPort, State
```

Then open: http://localhost:5000

---

## 📁 Test Images Location

Sample images are in:
```
C:\Users\mdkai\Desktop\AllergyConnectAI\Dataset\
```

Folders:
- `Tomato_Leaf_Mold/`
- `Tomato__Target_Spot/`
- `Tomato_Late_blight/`
- And 12 more disease types...

---

## ✅ Success Checklist

- [ ] ML Service running (port 8001)
- [ ] Backend running (port 5000)
- [ ] Browser opens http://localhost:5000
- [ ] Can navigate to Detect page
- [ ] Can upload image
- [ ] Detection shows confidence % (not N/A%)
- [ ] Symptoms tab shows list
- [ ] Treatment tab shows details
- [ ] Prevention tab shows methods

---

## 🆘 Need Help?

1. Check both PowerShell windows for errors
2. Verify both ports 5000 and 8001 are listening
3. Try the diagnostic page (test_detection.html)
4. Open browser console (F12) and check for errors
