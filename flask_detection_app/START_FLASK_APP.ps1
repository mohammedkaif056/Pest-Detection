# Flask Detection App - Quick Start
# Run this script to start both ML service and Flask web app

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   🌿 Plant Disease Detection - Flask Web App" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Kill any existing processes
Write-Host "🧹 Cleaning up old processes..." -ForegroundColor Cyan
Get-Process -Name python,node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start ML Service
Write-Host "1️⃣  Starting ML Service (Port 8001)..." -ForegroundColor Cyan
$mlPath = "C:\Users\mdkai\Desktop\AllergyConnectAI\python_ml_service"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$mlPath'; `$env:Path += ';C:\Users\mdkai\AppData\Roaming\Python\Scripts'; Write-Host '✅ ML Service Running' -ForegroundColor Green; poetry run python serve.py" -WindowStyle Normal

Start-Sleep -Seconds 10

# Start Flask App
Write-Host "2️⃣  Starting Flask Web App (Port 5001)..." -ForegroundColor Cyan
$flaskPath = "C:\Users\mdkai\Desktop\AllergyConnectAI\flask_detection_app"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$flaskPath'; Write-Host '✅ Flask App Running' -ForegroundColor Green; python app.py" -WindowStyle Normal

Start-Sleep -Seconds 5

# Verify services
Write-Host ""
Write-Host "🔍 Verifying services..." -ForegroundColor Cyan
$mlService = Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue
$flaskService = Get-NetTCPConnection -LocalPort 5001 -State Listen -ErrorAction SilentlyContinue

Write-Host ""
if ($mlService) {
    Write-Host "✅ ML Service: Running on port 8001" -ForegroundColor Green
} else {
    Write-Host "❌ ML Service: Not running" -ForegroundColor Red
}

if ($flaskService) {
    Write-Host "✅ Flask App: Running on port 5001" -ForegroundColor Green
} else {
    Write-Host "❌ Flask App: Not running" -ForegroundColor Red
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Green
if ($mlService -and $flaskService) {
    Write-Host "🎉 SUCCESS! All services are running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Open in your browser:" -ForegroundColor Yellow
    Write-Host "   http://localhost:5001" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Keep both PowerShell windows open!" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Some services failed to start" -ForegroundColor Yellow
    Write-Host "Check the PowerShell windows for error messages" -ForegroundColor Yellow
}
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
