"""
Simple test script to verify the ML service is working correctly.
Run this after starting the service with: poetry run python main.py
"""

import requests
import base64
import sys
from pathlib import Path

# Configuration
ML_SERVICE_URL = "http://localhost:8001"
API_BASE = f"{ML_SERVICE_URL}/api/v1"


def test_health_check():
    """Test the health check endpoint."""
    print("\n🔍 Testing health check...")
    try:
        response = requests.get(f"{ML_SERVICE_URL}/health", timeout=5)
        response.raise_for_status()
        data = response.json()
        print(f"✅ Health check passed: {data}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False


def test_generate_embedding():
    """Test embedding generation with a dummy image."""
    print("\n🔍 Testing embedding generation...")
    
    try:
        # Create a simple test image (1x1 white pixel)
        from PIL import Image
        import io
        
        # Create test image
        img = Image.new('RGB', (224, 224), color='white')
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='JPEG')
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        # Send request
        response = requests.post(
            f"{API_BASE}/generate-embedding",
            json={"image_base64": f"data:image/jpeg;base64,{img_base64}"},
            timeout=30
        )
        response.raise_for_status()
        
        data = response.json()
        embedding = data["embedding"]
        
        # Validate
        assert isinstance(embedding, list), "Embedding should be a list"
        assert len(embedding) == 512, f"Expected 512-dim embedding, got {len(embedding)}"
        assert all(isinstance(x, (int, float)) for x in embedding), "All values should be numbers"
        
        print(f"✅ Embedding generation passed: {len(embedding)} dimensions")
        print(f"   Sample values: {embedding[:5]}...")
        return embedding
        
    except Exception as e:
        print(f"❌ Embedding generation failed: {e}")
        return None


def test_classify_embedding(query_embedding):
    """Test embedding classification."""
    print("\n🔍 Testing embedding classification...")
    
    if query_embedding is None:
        print("⚠️  Skipping classification test (no query embedding)")
        return False
    
    try:
        # Create dummy prototypes
        import random
        random.seed(42)
        
        prototypes = [
            {
                "pest_name": "Asiatic Red Mite",
                "embedding": [random.uniform(-1, 1) for _ in range(512)]
            },
            {
                "pest_name": "Boll Weevil",
                "embedding": [random.uniform(-1, 1) for _ in range(512)]
            },
            {
                "pest_name": "Cotton Aphid",
                "embedding": query_embedding  # Make this one similar
            }
        ]
        
        # Send request
        response = requests.post(
            f"{API_BASE}/classify-embedding",
            json={
                "query_embedding": query_embedding,
                "prototypes": prototypes
            },
            timeout=10
        )
        response.raise_for_status()
        
        data = response.json()
        
        # Validate
        assert "pest_name" in data, "Response should contain pest_name"
        assert "confidence" in data, "Response should contain confidence"
        assert "risk_level" in data, "Response should contain risk_level"
        assert 0 <= data["confidence"] <= 1, "Confidence should be between 0 and 1"
        assert data["risk_level"] in ["low", "medium", "high", "critical"], "Invalid risk level"
        
        print(f"✅ Classification passed:")
        print(f"   Pest: {data['pest_name']}")
        print(f"   Confidence: {data['confidence']:.4f}")
        print(f"   Risk Level: {data['risk_level']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Classification failed: {e}")
        return False


def test_api_docs():
    """Test that API documentation is accessible."""
    print("\n🔍 Testing API documentation...")
    
    try:
        response = requests.get(f"{ML_SERVICE_URL}/docs", timeout=5)
        assert response.status_code == 200, "Docs should be accessible"
        print(f"✅ API docs accessible at: {ML_SERVICE_URL}/docs")
        return True
    except Exception as e:
        print(f"❌ API docs test failed: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("🧪 Python ML Service Test Suite")
    print("=" * 60)
    
    print(f"\n📡 Testing service at: {ML_SERVICE_URL}")
    print("⚠️  Make sure the service is running: poetry run python main.py\n")
    
    # Run tests
    results = []
    
    # Test 1: Health check
    results.append(("Health Check", test_health_check()))
    
    # Test 2: API docs
    results.append(("API Documentation", test_api_docs()))
    
    # Test 3: Embedding generation
    embedding = test_generate_embedding()
    results.append(("Embedding Generation", embedding is not None))
    
    # Test 4: Classification
    results.append(("Embedding Classification", test_classify_embedding(embedding)))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status:10} {test_name}")
    
    total_tests = len(results)
    passed_tests = sum(1 for _, passed in results if passed)
    
    print(f"\n📈 Results: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("\n🎉 All tests passed! ML service is working correctly.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")
        return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⏸️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 Unexpected error: {e}")
        sys.exit(1)
