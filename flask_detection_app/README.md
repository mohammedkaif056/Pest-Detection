# Plant Disease Detection - Flask Web App

A simple, single-page web interface for plant disease detection using your trained ML model.

## Features

✅ **Single-page application** - No page reloads  
✅ **Drag & drop upload** - Easy image upload  
✅ **Real-time results** - AJAX-based detection  
✅ **Beautiful UI** - Bootstrap 5 with modern design  
✅ **Complete disease info** - Symptoms, treatment, prevention  
✅ **Mobile responsive** - Works on all devices  

## Setup

### 1. Install Dependencies

```powershell
cd C:\Users\mdkai\Desktop\AllergyConnectAI\flask_detection_app
pip install -r requirements.txt
```

### 2. Start ML Service (Required!)

The Flask app needs the ML service running on port 8001:

```powershell
cd C:\Users\mdkai\Desktop\AllergyConnectAI\python_ml_service
$env:Path += ";C:\Users\mdkai\AppData\Roaming\Python\Scripts"
poetry run python serve.py
```

Keep this window open!

### 3. Start Flask App

In a NEW terminal:

```powershell
cd C:\Users\mdkai\Desktop\AllergyConnectAI\flask_detection_app
python app.py
```

### 4. Open in Browser

```
http://localhost:5001
```

## How to Use

1. **Upload Image**
   - Click the upload area or drag & drop an image
   - Supports JPG, PNG (max 50MB)

2. **Run Detection**
   - Click "Run Detection" button
   - Wait for analysis (2-5 seconds)

3. **View Results**
   - Disease name with confidence %
   - Plant and pathogen information
   - Detailed symptoms
   - Treatment recommendations
   - Prevention methods

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │─────▶│  Flask App   │─────▶│ ML Service  │
│ (Port 5001) │◀─────│ (Port 5001)  │◀─────│ (Port 8001) │
└─────────────┘      └──────────────┘      └─────────────┘
    Upload              AJAX/Fetch           Your Model
    Display             JSON API             Detection
```

## File Structure

```
flask_detection_app/
├── app.py                 # Flask backend
├── templates/
│   └── index.html        # Frontend UI
├── requirements.txt      # Python dependencies
└── README.md            # This file
```

## API Endpoint

**POST /detect**

Request:
- Content-Type: multipart/form-data
- Body: file (image)

Response (JSON):
```json
{
  "success": true,
  "disease_name": "Bacterial Spot on Bell Pepper",
  "confidence": 97.69,
  "plant": "Bell Pepper",
  "pathogen_type": "Bacteria",
  "pathogen_name": "Xanthomonas campestris pv. vesicatoria",
  "severity": "High",
  "symptoms": [...],
  "treatment": {...},
  "prevention": [...],
  "prognosis": "...",
  "spread_risk": "..."
}
```

## Troubleshooting

### "Cannot connect to ML service"
- Make sure ML service is running on port 8001
- Check: `Get-NetTCPConnection -LocalPort 8001 -State Listen`

### "No file uploaded"
- Ensure you selected an image file
- Check file size (max 50MB)

### Detection takes too long
- First detection may take 10-15 seconds (model loading)
- Subsequent detections: 2-5 seconds

## Customization

### Change Port
In `app.py`, line 114:
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Change 5001 to your port
```

### Modify UI Colors
In `templates/index.html`, CSS section (lines 9-78)

### Add More Features
- Video upload support
- Batch processing
- Export results as PDF
- Detection history

## Production Deployment

For production use:

1. Set `debug=False` in app.py
2. Use a WSGI server (gunicorn, waitress)
3. Add authentication
4. Enable HTTPS
5. Add rate limiting

Example with Waitress:
```powershell
pip install waitress
```

Then create `run_production.py`:
```python
from waitress import serve
from app import app

serve(app, host='0.0.0.0', port=5001)
```

---

**Created:** November 12, 2025  
**ML Model:** 15-class multi-plant detection  
**Accuracy:** 92%+
