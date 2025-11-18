#!/usr/bin/env pwsh
# Startup script for AllergyConnectAI with ML service

Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host "🌱 AllergyConnectAI - Plant Disease Detection System" -ForegroundColor Green
Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""

# Check if Poetry is in PATH
$env:Path += ";C:\Users\mdkai\AppData\Roaming\Python\Scripts"

# Function to check if a process is running on a port
function Test-Port {
    param($Port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return $connection -ne $null
    } catch {
        return $false
    }
}

Write-Host "📋 Pre-flight checks..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
Write-Host "  Checking Node.js..." -NoNewline
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host " ✅ $nodeVersion" -ForegroundColor Green
} else {
    Write-Host " ❌ Not found" -ForegroundColor Red
    exit 1
}

# Check Python
Write-Host "  Checking Python..." -NoNewline
$pythonVersion = python --version 2>$null
if ($pythonVersion) {
    Write-Host " ✅ $pythonVersion" -ForegroundColor Green
} else {
    Write-Host " ❌ Not found" -ForegroundColor Red
    exit 1
}

# Check Poetry
Write-Host "  Checking Poetry..." -NoNewline
$poetryVersion = poetry --version 2>$null
if ($poetryVersion) {
    Write-Host " ✅ $poetryVersion" -ForegroundColor Green
} else {
    Write-Host " ❌ Not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Please install Poetry first:" -ForegroundColor Yellow
    Write-Host "  (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -"
    exit 1
}

# Check ML model
Write-Host "  Checking ML model..." -NoNewline
$modelPath = "python_ml_service\assets\simple_pest_encoder.pth"
if (Test-Path $modelPath) {
    $modelSize = (Get-Item $modelPath).Length / 1MB
    Write-Host (" ✅ Found ({0:N1} MB)" -f $modelSize) -ForegroundColor Green
} else {
    Write-Host " ⚠️  Not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Model not trained yet. You can:" -ForegroundColor Yellow
    Write-Host "  1. Train now: cd python_ml_service; poetry run python train_simple.py"
    Write-Host "  2. Continue anyway (will use OpenAI fallback)"
    Write-Host ""
    $response = Read-Host "  Continue without ML model? (y/n)"
    if ($response -ne "y") {
        exit 0
    }
}

# Check prototypes
Write-Host "  Checking prototypes..." -NoNewline
$prototypesPath = "python_ml_service\assets\class_prototypes.json"
if (Test-Path $prototypesPath) {
    Write-Host " ✅ Found" -ForegroundColor Green
} else {
    Write-Host " ⚠️  Not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""

# Check ports
if (Test-Port 5000) {
    Write-Host "⚠️  Port 5000 is already in use" -ForegroundColor Yellow
    Write-Host "   Please stop the process using port 5000 first"
    exit 1
}

if (Test-Port 8001) {
    Write-Host "⚠️  Port 8001 is already in use" -ForegroundColor Yellow
    Write-Host "   Please stop the process using port 8001 first"
    exit 1
}

# Start ML service
Write-Host "🚀 Starting ML Service (port 8001)..." -ForegroundColor Cyan

$mlJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\mdkai\Desktop\AllergyConnectAI\python_ml_service"
    $env:Path += ";C:\Users\mdkai\AppData\Roaming\Python\Scripts"
    poetry run python serve.py
}

Write-Host "   Job ID: $($mlJob.Id)" -ForegroundColor Gray

# Wait for ML service to start
Write-Host "   Waiting for ML service to be ready..." -NoNewline
Start-Sleep -Seconds 5

for ($i = 0; $i -lt 10; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8001/health" -Method Get -ErrorAction Stop
        Write-Host " ✅" -ForegroundColor Green
        Write-Host "   ML service is ready! ($($response.num_classes) classes loaded)" -ForegroundColor Green
        break
    } catch {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
}

Write-Host ""

# Start Node.js backend
Write-Host "🚀 Starting Node.js Backend (port 5000)..." -ForegroundColor Cyan

$nodeJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\mdkai\Desktop\AllergyConnectAI"
    npm run dev
}

Write-Host "   Job ID: $($nodeJob.Id)" -ForegroundColor Gray

# Wait a bit for Node to start
Write-Host "   Waiting for backend to be ready..." -NoNewline
Start-Sleep -Seconds 8
Write-Host " ✅" -ForegroundColor Green

Write-Host ""
Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ All services are running!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Yellow
Write-Host "   • Frontend:    http://localhost:5000" -ForegroundColor White
Write-Host "   • API:         http://localhost:5000/api" -ForegroundColor White
Write-Host "   • ML Service:  http://localhost:8001" -ForegroundColor White
Write-Host "   • ML Docs:     http://localhost:8001/docs" -ForegroundColor White
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Yellow
Write-Host "   • ML Service:  Job $($mlJob.Id)" -ForegroundColor White
Write-Host "   • Node Backend: Job $($nodeJob.Id)" -ForegroundColor White
Write-Host ""
Write-Host "📝 Commands:" -ForegroundColor Yellow
Write-Host "   • View logs:    Receive-Job -Id <job-id> -Keep" -ForegroundColor White
Write-Host "   • Stop ML:      Stop-Job -Id $($mlJob.Id); Remove-Job -Id $($mlJob.Id)" -ForegroundColor White
Write-Host "   • Stop Node:    Stop-Job -Id $($nodeJob.Id); Remove-Job -Id $($nodeJob.Id)" -ForegroundColor White
Write-Host "   • Stop all:     Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor White
Write-Host ""
Write-Host "💡 Press Ctrl+C to stop monitoring" -ForegroundColor Cyan
Write-Host "   (Services will continue running in background)" -ForegroundColor Gray
Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""

# Monitor jobs
try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        $mlStatus = Get-Job -Id $mlJob.Id
        $nodeStatus = Get-Job -Id $nodeJob.Id
        
        if ($mlStatus.State -eq "Failed" -or $mlStatus.State -eq "Stopped") {
            Write-Host ""
            Write-Host "❌ ML Service stopped unexpectedly" -ForegroundColor Red
            Receive-Job -Id $mlJob.Id
            break
        }
        
        if ($nodeStatus.State -eq "Failed" -or $nodeStatus.State -eq "Stopped") {
            Write-Host ""
            Write-Host "❌ Node backend stopped unexpectedly" -ForegroundColor Red
            Receive-Job -Id $nodeJob.Id
            break
        }
    }
} catch {
    Write-Host ""
    Write-Host "Monitoring stopped" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "ℹ️  Services are still running. To stop them:" -ForegroundColor Cyan
Write-Host "   Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor White
Write-Host ""
