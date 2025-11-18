"""
Test detection with a real plant image
"""
import base64
import requests
import json
from pathlib import Path

# Pick a sample image
image_path = Path("Dataset/Tomato__Target_Spot/1fb2795b-4c60-405e-873b-e3dd3fe6563e___Com.G_TgS_FL 0043.JPG")

# Read and encode image
with open(image_path, "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode()

# Add data URI prefix for backend
data_uri = f"data:image/jpeg;base64,{image_base64}"

print(f"Testing detection with: {image_path.name}")
print(f"Image size: {len(image_base64)} bytes (base64)")
print(f"Data URI length: {len(data_uri)}")
print()

# Test backend API
print("Testing Backend API (http://localhost:5000/api/detect)...")
try:
    response = requests.post(
        "http://localhost:5000/api/detect",
        json={"image": data_uri},
        timeout=30
    )
    print(f"Status: {response.status_code}")
    if response.ok:
        result = response.json()
        print("SUCCESS!")
        print(json.dumps(result, indent=2))
    else:
        print(f"ERROR: {response.text}")
except Exception as e:
    print(f"ERROR: {e}")

