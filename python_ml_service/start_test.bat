@echo off
cd /d "%~dp0"
echo ================================================================
echo Python ML Service - Starting Test Version
echo ================================================================
echo.
echo Loading Poetry environment...
set PATH=%PATH%;C:\Users\mdkai\AppData\Roaming\Python\Scripts

poetry run uvicorn test_minimal:app --host 0.0.0.0 --port 8001

pause
