# 🌱 Plant Disease Detection System - PestEdge-FSL

## 📋 Project Overview

An AI-powered plant disease detection system using **Few-Shot Learning** with **Prototypical Networks**. Detects diseases in tomatoes, peppers, and potatoes with high accuracy, and allows learning new diseases with just 5-10 sample images.

### Key Features

- ✅ **Real-time Disease Detection** - Upload images or use camera
- ✅ **15 Pre-trained Disease Classes** - Peppers, Potatoes, Tomatoes
- ✅ **Few-Shot Learning** - Learn new diseases with 5-10 images (no retraining!)
- ✅ **Comprehensive Reports** - Symptoms, treatments, prevention methods
- ✅ **PDF Export** - Download professional detection reports
- ✅ **Detection History** - Track all past detections
- ✅ **Responsive UI** - Modern React interface with dark mode

---

## 🛠️ Technology Stack

### Backend
- **Express.js** - REST API server (Node.js)
- **PostgreSQL** - Database (detection history, learned species)
- **Drizzle ORM** - Type-safe database queries

### ML Service
- **FastAPI** - Python ML API
- **PyTorch** - Deep learning framework
- **MobileNetV3** - Lightweight CNN backbone
- **Prototypical Networks** - Few-shot learning

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **TanStack Query** - Data fetching

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.10+ ([Download](https://www.python.org/))
- **Poetry** (Python package manager)
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/))
- **Git** ([Download](https://git-scm.com/))

---

## 🚀 Installation Guide

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd AllergyConnectAI
```

### Step 2: Install Python Dependencies (ML Service)

```bash
# Navigate to ML service directory
cd python_ml_service

# Install Poetry (if not installed)
pip install poetry

# Install dependencies
poetry install

# Verify installation
poetry run python --version
```

**Dependencies installed:**
- PyTorch 2.5.1+cpu
- FastAPI 0.115.14
- Uvicorn (ASGI server)
- Pillow (image processing)
- timm (pre-trained models)

### Step 3: Install Node.js Dependencies (Backend + Frontend)

```bash
# Return to project root
cd ..

# Install all Node.js packages
npm install

# If you encounter peer dependency issues:
npm install --legacy-peer-deps
```

**Dependencies installed:**
- Express.js (backend)
- React + Vite (frontend)
- Drizzle ORM (database)
- TanStack Query (state management)
- Tailwind CSS (styling)
- jsPDF (PDF generation)
- And more...

### Step 4: Setup Database

1. **Create PostgreSQL Database:**

```sql
CREATE DATABASE pest_detection;
```

2. **Configure Database Connection:**

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/pest_detection
```

Replace `username` and `password` with your PostgreSQL credentials.

3. **Run Database Migrations:**

```bash
npm run db:push
```

This creates all necessary tables (detections, prototypes, species, treatments).

---

## 🎯 Running the Application

### Option 1: Quick Start (Automated)

**Windows PowerShell:**

```powershell
# One-command startup
.\START_ALL_SERVICES.ps1
```

This script:
- Starts ML service (port 8001)
- Starts backend + frontend (port 5000)
- Verifies both services are running
- Opens browser automatically

### Option 2: Manual Start

**Terminal 1 - ML Service:**

```bash
cd python_ml_service
poetry run python serve.py
```

Expected output:
```
🌱 Starting PlantVillage Disease Detection Service
📡 Service will be available at:
   • Health:  http://localhost:8001/health
   • Detect:  http://localhost:8001/api/v1/detect
   • Learn:   http://localhost:8001/api/v1/learn
   ✅ Loaded 16 class prototypes
```

**Terminal 2 - Backend + Frontend:**

```bash
npm run dev
```

Expected output:
```
> rest-express@1.0.0 dev
> tsx server/index.ts

VITE v5.4.11  ready in 823 ms
➜  Local:   http://localhost:5173/
serving on port 5000
```

**Access the application:**
- Main App: http://localhost:5000
- ML Service API Docs: http://localhost:8001/docs

---

## 📂 Project Structure

```
AllergyConnectAI/
├── client/                      # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/              # Main pages (Home, Detect, Learn, etc.)
│   │   ├── lib/                # Utilities
│   │   └── hooks/              # React hooks
│   └── index.html
│
├── server/                      # Backend (Express.js)
│   ├── index.ts                # Main server file
│   ├── routes.ts               # API endpoints
│   ├── storage.ts              # Database operations
│   └── openai.ts               # ML service integration
│
├── python_ml_service/          # ML Service (FastAPI + PyTorch)
│   ├── serve.py                # FastAPI server
│   ├── train_all_plants.py    # Training script (15 classes)
│   ├── ml/
│   │   └── encoder.py          # PestEncoder model
│   ├── assets/
│   │   ├── pest_encoder.pth    # Trained model weights
│   │   └── class_prototypes.json  # Few-shot prototypes
│   └── disease_database.py     # Disease information
│
├── shared/                      # Shared TypeScript types
│   └── schema.ts               # Database schema
│
├── Dataset/                     # Training images (41,276 images)
│   ├── Pepper__bell___Bacterial_spot/
│   ├── Potato___Early_blight/
│   ├── Tomato_Leaf_Mold/
│   └── ... (15 disease folders)
│
├── flask_detection_app/        # Alternative Flask web UI
│   ├── app.py                  # Flask backend
│   └── templates/
│       └── index.html          # Standalone web interface
│
└── package.json                # Node.js dependencies
```

---

## 🎓 How to Use

### 1. Detect Disease

1. Go to **Detect** page
2. Upload an image or take a photo
3. Click **"Detect Pest"**
4. View results:
   - Disease name
   - Confidence %
   - Symptoms
   - Treatment options
   - Prevention methods
5. Click **"Download PDF"** to export report

### 2. Learn New Disease (Few-Shot Learning)

1. Go to **Learn New** page
2. Enter disease name (e.g., "Aphids on Tomato")
3. Upload 5-10 sample images
4. Click **"Learn Species"**
5. Wait 10-30 seconds for training
6. New disease is immediately available for detection!

**Note:** Learned species are saved permanently in `class_prototypes.json` and persist across restarts.

### 3. View Detection History

1. Go to **History** page
2. View all past detections
3. Filter by date or disease type
4. Click on any detection to see full details

### 4. Browse Disease Database

1. Go to **Species** page
2. Browse all known diseases
3. Click on any disease for detailed information

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/pest_detection

# ML Service
ML_SERVICE_URL=http://localhost:8001

# Server
PORT=5000
NODE_ENV=development
```

### Model Configuration

Edit `python_ml_service/serve.py`:

```python
# Change model architecture
_model = PestEncoder(embedding_dim=512)  # Default: 512

# Change confidence threshold
MIN_CONFIDENCE = 0.5  # Default: 0.5 (50%)
```

---

## 📊 Training a New Model

If you want to retrain from scratch:

```bash
cd python_ml_service

# Train on all 15 disease classes (25 epochs)
poetry run python train_all_plants.py

# Expected time: 60-90 minutes
# Output: pest_encoder.pth and class_prototypes.json
```

**Training Details:**
- Dataset: 41,276 images (15 classes)
- Epochs: 25
- Batch Size: 32
- Learning Rate: 0.0005
- Architecture: MobileNetV3-Large + Prototypical Networks
- Final Accuracy: ~80-85%

---

## 🧪 Testing

### Test ML Service

```bash
# Check health
curl http://localhost:8001/health

# Test detection (using test image)
curl -X POST http://localhost:8001/api/v1/detect \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "..."}'
```

### Test Backend API

```bash
# Test detection endpoint
curl -X POST http://localhost:5000/api/detect \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,..."}'
```

### Run Unit Tests

```bash
# Frontend tests
npm run test

# Backend tests
npm run test:server
```

---

## 🐛 Troubleshooting

### Port Already in Use

```powershell
# Check what's using ports 5000 and 8001
Get-NetTCPConnection -LocalPort 5000,8001

# Kill all Node and Python processes
Get-Process -Name node,python | Stop-Process -Force
```

### ML Service Won't Start

1. Check Python version: `python --version` (must be 3.10+)
2. Verify Poetry: `poetry --version`
3. Reinstall dependencies: `poetry install --no-cache`
4. Check model file exists: `python_ml_service/assets/pest_encoder.pth`

### Database Connection Error

1. Verify PostgreSQL is running
2. Check `.env` file has correct DATABASE_URL
3. Test connection: `psql -U username -d pest_detection`
4. Run migrations: `npm run db:push`

### Frontend Not Loading

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard reload (Ctrl+Shift+R)
3. Check browser console (F12) for errors
4. Verify backend is running on port 5000

### Detection Shows "N/A%"

1. Ensure ML service is running (port 8001)
2. Check ML service logs for errors
3. Verify image is valid (JPEG/PNG, <50MB)
4. Test with sample images from `Dataset/` folder

---

## 📱 Alternative: Flask Web App

For a simpler standalone interface:

```bash
cd flask_detection_app

# Install dependencies
pip install -r requirements.txt

# Start Flask app
python app.py
```

Access at: http://localhost:5001

---

## 🔐 Security Notes

⚠️ **Before deploying to production:**

1. Change database credentials
2. Add authentication (JWT tokens)
3. Enable HTTPS
4. Set up CORS properly
5. Add rate limiting
6. Validate all inputs
7. Set `NODE_ENV=production`

---

## 📈 Performance

- **Detection Speed:** 2-5 seconds per image
- **Model Size:** ~14 MB
- **Memory Usage:** ~500 MB (ML service)
- **Supported Image Formats:** JPEG, PNG, WebP
- **Max Image Size:** 50 MB
- **Concurrent Users:** Up to 100 (with proper scaling)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 📞 Support

For issues or questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review closed issues on GitHub
3. Open a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, Python version)

---

## 🎉 Success Checklist

- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] Poetry installed
- [ ] PostgreSQL running
- [ ] Dependencies installed (`poetry install` + `npm install`)
- [ ] Database created and migrated
- [ ] ML service starts (port 8001)
- [ ] Backend starts (port 5000)
- [ ] Browser opens http://localhost:5000
- [ ] Can detect disease from uploaded image
- [ ] Can learn new disease (5-10 images)
- [ ] Can download PDF report
- [ ] Can view detection history

---

## 🚀 Quick Reference

**Start All Services:**
```powershell
.\START_ALL_SERVICES.ps1
```

**Stop All Services:**
```powershell
Get-Process -Name node,python | Stop-Process -Force
```

**View ML Service Logs:**
```bash
cd python_ml_service
poetry run python serve.py
```

**Rebuild Frontend:**
```bash
npm run build
```

**Reset Database:**
```bash
npm run db:push
```

---

**Made with ❤️ using PyTorch, FastAPI, React, and Few-Shot Learning**
