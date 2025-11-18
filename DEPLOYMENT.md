# Deployment Guide - Plant Disease Detection App

## Overview
Your app has **two parts** that need separate deployment:
1. **Frontend + Backend (Node.js)** → Deploy to **Vercel**
2. **ML Service (Python/FastAPI)** → Deploy to **Railway** or **Render**

---

## Part 1: Deploy ML Service (Python) to Railway

### Step 1: Prepare ML Service
```bash
cd python_ml_service
```

### Step 2: Create `requirements.txt`
Create a file with these dependencies:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
torch==2.1.0
torchvision==0.16.0
Pillow==10.1.0
python-multipart==0.0.6
pydantic==2.5.0
pydantic-settings==2.1.0
python-dotenv==1.0.0
httpx==0.25.2
```

### Step 3: Create `Procfile`
```
web: uvicorn serve:app --host 0.0.0.0 --port $PORT
```

### Step 4: Create `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn serve:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 5: Deploy to Railway
1. Go to https://railway.app
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select `mohammedkaif056/Pest-Detection`
5. Set **Root Directory**: `python_ml_service`
6. Add Environment Variables:
   - `GEMINI_API_KEY` = `AIzaSyBhvLIgqaYu30AZPDuMHgmKEUvzcx_MwjY`
   - `PORT` = `8000` (Railway auto-sets this)
7. Click **Deploy**
8. Copy the Railway URL (e.g., `https://your-app.railway.app`)

---

## Part 2: Deploy Frontend + Backend to Vercel

### Step 1: Build the Project
```bash
npm run build
```

### Step 2: Create `vercel.json` (if not exists)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ]
}
```

### Step 3: Deploy to Vercel
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click **"Add New Project"**
4. Import `mohammedkaif056/Pest-Detection`
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add Environment Variables:
   - `GEMINI_API_KEY` = `AIzaSyBhvLIgqaYu30AZPDuMHgmKEUvzcx_MwjY`
   - `ML_SERVICE_URL` = `https://your-app.railway.app` (from Railway)
7. Click **Deploy**

### Step 4: Update ML Service URL in Code
After Railway deployment, update the ML service URL in your backend:

Edit `server/routes.ts`:
```typescript
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'https://your-app.railway.app';
```

Commit and push:
```bash
git add server/routes.ts
git commit -m "Update ML service URL for production"
git push origin main
```

Vercel will auto-redeploy.

---

## Alternative: Deploy ML Service to Render

If Railway doesn't work, use Render:

### Step 1: Go to Render
1. Visit https://render.com
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect `mohammedkaif056/Pest-Detection`
3. Configure:
   - **Name**: `plant-disease-ml`
   - **Root Directory**: `python_ml_service`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn serve:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variable:
   - `GEMINI_API_KEY` = `AIzaSyBhvLIgqaYu30AZPDuMHgmKEUvzcx_MwjY`
5. Click **"Create Web Service"**
6. Copy the Render URL (e.g., `https://plant-disease-ml.onrender.com`)

---

## Testing Deployment

### Test ML Service
```bash
curl https://your-ml-service.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "model_loaded": true,
  "num_classes": 19
}
```

### Test Full App
1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Upload a plant image
3. Check detection works

---

## Troubleshooting

### ML Service Issues
- **500 Error**: Check Railway logs for missing dependencies
- **Model not loading**: Ensure PyTorch is in `requirements.txt`
- **Timeout**: Increase Railway memory (upgrade plan if needed)

### Vercel Issues
- **API not working**: Check `ML_SERVICE_URL` environment variable
- **Build fails**: Run `npm run build` locally first
- **CORS errors**: ML service needs CORS enabled (already in `serve.py`)

### Environment Variables
Make sure both platforms have:
- **Railway**: `GEMINI_API_KEY`
- **Vercel**: `GEMINI_API_KEY`, `ML_SERVICE_URL`

---

## Post-Deployment Checklist

- [ ] ML service health check returns `200 OK`
- [ ] Frontend loads at Vercel URL
- [ ] Image upload works
- [ ] Detection returns results
- [ ] AI verification triggers on low confidence
- [ ] History page shows detections
- [ ] Learn page displays disease info

---

## Costs

- **Vercel**: Free tier (100GB bandwidth/month)
- **Railway**: $5/month (500 hours) or Free trial
- **Render**: Free tier (sleeps after 15min inactivity)
- **Gemini API**: Free tier (60 requests/minute)

---

## Custom Domain (Optional)

### Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as shown

### Railway
1. Go to Settings → Domains
2. Add custom domain
3. Update CNAME record

---

## Monitoring

### Railway Dashboard
- View logs: Click on deployment → Logs
- Monitor CPU/Memory: Metrics tab
- View requests: Observability tab

### Vercel Dashboard
- Analytics: View traffic stats
- Logs: Functions → View logs
- Performance: Speed Insights

---

## Quick Deploy Commands

```bash
# 1. Create Railway files
cd python_ml_service
echo "web: uvicorn serve:app --host 0.0.0.0 --port \$PORT" > Procfile

# 2. Build frontend
cd ..
npm run build

# 3. Push to GitHub
git add .
git commit -m "Prepare for deployment"
git push origin main

# 4. Deploy on Railway (via dashboard)
# 5. Deploy on Vercel (via dashboard)
```

---

## Support

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs

**Need help?** Check the logs on Railway/Vercel dashboard first.
