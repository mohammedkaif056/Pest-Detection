"""
Simplified startup script with better error handling and progress indicators.
"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("🚀 Starting Pest Detection ML Service...")
print("=" * 60)

# Check environment
print("\n1️⃣  Checking environment...")
print(f"   Python: {sys.version}")
print(f"   Working Directory: {os.getcwd()}")

# Import FastAPI
print("\n2️⃣  Loading FastAPI...")
try:
    from fastapi import FastAPI
    import uvicorn
    print("   ✅ FastAPI loaded")
except Exception as e:
    print(f"   ❌ Failed to load FastAPI: {e}")
    sys.exit(1)

# Import PyTorch (this can take time on first load)
print("\n3️⃣  Loading PyTorch (this may take 30-60 seconds on first run)...")
try:
    import torch
    print(f"   ✅ PyTorch {torch.__version__} loaded")
    print(f"   Device: {'CUDA' if torch.cuda.is_available() else 'CPU'}")
except Exception as e:
    print(f"   ❌ Failed to load PyTorch: {e}")
    sys.exit(1)

# Import application
print("\n4️⃣  Loading application modules...")
try:
    from main import app
    print("   ✅ Application loaded")
except Exception as e:
    print(f"   ❌ Failed to load application: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Start server
print("\n5️⃣  Starting server...")
print("=" * 60)
print(f"\n🌐 Server will be available at:")
print(f"   • Health Check: http://localhost:8001/health")
print(f"   • API Docs:     http://localhost:8001/docs")
print(f"   • OpenAPI:      http://localhost:8001/openapi.json")
print("\n💡 Press Ctrl+C to stop the server")
print("=" * 60)

try:
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
except KeyboardInterrupt:
    print("\n\n⏸️  Server stopped by user")
except Exception as e:
    print(f"\n\n❌ Server error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
