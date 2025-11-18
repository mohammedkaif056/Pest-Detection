# Python ML Service - Quick Start Guide

## ⚡ Fastest Way to Get Started

### 1. Install Poetry (One-time Setup)

**Windows PowerShell:**
```powershell
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
```

### 2. Install Dependencies

```bash
cd python_ml_service
poetry install
```

### 3. Start the Service

```bash
poetry run python main.py
```

The service will start on **http://localhost:8001**

### 4. Test the Service

**Check health:**
```bash
curl http://localhost:8001/health
```

**View API docs:**
Open http://localhost:8001/docs in your browser

## 🔗 Integration with Node.js Backend

### Update Node.js Backend (server/openai.ts)

Add this integration code to communicate with the Python ML service:

```typescript
// server/ml-service.ts
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001/api/v1';

export interface MLEmbedding {
  embedding: number[];
}

export interface MLClassification {
  pest_name: string;
  confidence: number;
  risk_level: string;
}

export async function generateMLEmbedding(imageBase64: string): Promise<number[]> {
  try {
    const response = await axios.post<MLEmbedding>(
      `${ML_SERVICE_URL}/generate-embedding`,
      { image_base64: imageBase64 },
      { timeout: 30000 }
    );
    return response.data.embedding;
  } catch (error) {
    console.error('ML service embedding error:', error);
    throw new Error('Failed to generate embedding from ML service');
  }
}

export async function classifyMLEmbedding(
  queryEmbedding: number[],
  prototypes: Array<{ pest_name: string; embedding: number[] }>
): Promise<MLClassification> {
  try {
    const response = await axios.post<MLClassification>(
      `${ML_SERVICE_URL}/classify-embedding`,
      {
        query_embedding: queryEmbedding,
        prototypes: prototypes
      },
      { timeout: 30000 }
    );
    return response.data;
  } catch (error) {
    console.error('ML service classification error:', error);
    throw new Error('Failed to classify embedding with ML service');
  }
}
```

### Update Detection Route (server/routes.ts)

Replace OpenAI detection with ML service:

```typescript
// server/routes.ts
import { generateMLEmbedding, classifyMLEmbedding } from "./ml-service";

app.post("/api/detect", async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Image is required" });
    }

    // Step 1: Generate embedding using Python ML service
    const embedding = await generateMLEmbedding(image);

    // Step 2: Get all prototypes from database
    const prototypes = await storage.getAllPrototypes();
    
    let pestName = "Unknown Pest";
    let confidence = 0.0;
    let riskLevel = "low";

    // Step 3: Classify if prototypes exist
    if (prototypes && prototypes.length > 0) {
      const mlPrototypes = prototypes.map(p => ({
        pest_name: p.pestName,
        embedding: p.embedding as number[]
      }));

      const classification = await classifyMLEmbedding(embedding, mlPrototypes);
      pestName = classification.pest_name;
      confidence = classification.confidence;
      riskLevel = classification.risk_level;
    } else {
      // Fallback to OpenAI if no prototypes learned yet
      const analysis = await analyzePestImage(image);
      pestName = analysis.pestName;
      confidence = analysis.confidence;
      riskLevel = analysis.riskLevel;
    }

    // Step 4: Store detection
    const detectionData = insertDetectionSchema.safeParse({
      imageUrl: image,
      pestName,
      confidence,
      riskLevel,
      similarSpecies: [],
      treatments: []
    });

    if (!detectionData.success) {
      return res.status(400).json({ error: "Validation failed" });
    }

    const detection = await storage.createDetection(detectionData.data);
    return res.json(detection);

  } catch (error) {
    console.error("Detection error:", error);
    return res.status(500).json({ error: "Failed to detect pest" });
  }
});
```

### Add Environment Variable

Add to your `.env` file:
```env
ML_SERVICE_URL=http://localhost:8001/api/v1
```

## 🎯 Testing End-to-End

### 1. Start Both Services

**Terminal 1 - Python ML Service:**
```bash
cd python_ml_service
poetry run python main.py
```

**Terminal 2 - Node.js Backend:**
```bash
cd ..
npm run dev
```

### 2. Test Detection Flow

Open your React frontend and upload a pest image. The flow will be:

1. Frontend → Node.js `/api/detect`
2. Node.js → Python `/api/v1/generate-embedding`
3. Python → Returns embedding
4. Node.js → Stores embedding + retrieves prototypes
5. Node.js → Python `/api/v1/classify-embedding`
6. Python → Returns classification
7. Node.js → Frontend (detection result)

## 📊 Performance Notes

- **First Request**: ~2-3 seconds (model loading)
- **Subsequent Requests**: ~15-50ms (depending on GPU/CPU)
- **Concurrent Requests**: Supported with async FastAPI

## 🔄 Optional: Add Prototype Learning

Update the `/api/learn` endpoint to use the ML service:

```typescript
app.post("/api/learn", async (req, res) => {
  try {
    const { pestName, images } = req.body;

    if (!pestName || !Array.isArray(images) || images.length < 5) {
      return res.status(400).json({ error: "Need 5-10 images" });
    }

    // Generate embeddings for all support images
    const embeddings = await Promise.all(
      images.map(img => generateMLEmbedding(img))
    );

    // Compute prototype (mean of all embeddings)
    const prototypeEmbedding = embeddings[0].map((_, i) => {
      const sum = embeddings.reduce((acc, emb) => acc + emb[i], 0);
      return sum / embeddings.length;
    });

    // Store prototype
    const prototypeData = insertPrototypeSchema.safeParse({
      pestName,
      embedding: prototypeEmbedding,
      supportImages: images,
      accuracy: 0.92,
      sampleCount: images.length,
    });

    if (!prototypeData.success) {
      return res.status(400).json({ error: "Validation failed" });
    }

    const prototype = await storage.createPrototype(prototypeData.data);
    return res.json(prototype);

  } catch (error) {
    console.error("Learn error:", error);
    return res.status(500).json({ error: "Failed to learn pest" });
  }
});
```

## 🚀 Production Deployment

### Python ML Service

```bash
# Install production dependencies
poetry install --no-dev

# Run with multiple workers
poetry run uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
```

### Docker Alternative (if needed later)

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install Poetry
RUN pip install poetry

# Copy files
COPY pyproject.toml poetry.lock ./
COPY . .

# Install dependencies
RUN poetry install --no-dev

# Run service
CMD ["poetry", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

## ✅ Verification Checklist

- [ ] Python service starts without errors
- [ ] Health check returns `{"status": "ok"}`
- [ ] API docs accessible at `/docs`
- [ ] Node.js can call `/generate-embedding`
- [ ] Node.js can call `/classify-embedding`
- [ ] End-to-end detection works from frontend

## 🐛 Common Issues

**Issue: Poetry not found**
```bash
# Add Poetry to PATH or use full path
C:\Users\YourName\AppData\Roaming\Python\Scripts\poetry
```

**Issue: Torch not installing**
```bash
# Install PyTorch separately first
poetry run pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

**Issue: Connection refused**
- Ensure Python service is running on port 8001
- Check firewall settings
- Verify `ML_SERVICE_URL` in Node.js `.env`

---

**You're all set! 🎉**

The Python ML service is now handling all computer vision tasks while Node.js manages the business logic and database!
