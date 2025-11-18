"""
Flask Web Interface for Plant Disease Detection
================================================
Single-page application with AJAX for real-time detection results
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import base64
import requests
import io
from PIL import Image
import os

app = Flask(__name__)
CORS(app)

# Configure upload settings
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ML Service URL (your existing FastAPI service)
ML_SERVICE_URL = "http://localhost:8001/api/v1/detect"


@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')


@app.route('/detect', methods=['POST'])
def detect():
    """
    Handle image upload and run detection
    Returns JSON with detection results
    """
    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read and validate image
        try:
            image = Image.open(file.stream).convert('RGB')
        except Exception as e:
            return jsonify({'error': f'Invalid image file: {str(e)}'}), 400
        
        # Convert image to base64
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        img_data_url = f"data:image/jpeg;base64,{img_base64}"
        
        # Send to ML service
        try:
            response = requests.post(
                ML_SERVICE_URL,
                json={'image_base64': img_data_url},
                timeout=30
            )
            
            if response.status_code == 200:
                ml_result = response.json()
                
                # Format response for frontend
                result = {
                    'success': True,
                    'disease_name': ml_result.get('disease_name', 'Unknown'),
                    'confidence': round(ml_result.get('confidence', 0) * 100, 2),
                    'plant': ml_result.get('plant', 'Unknown'),
                    'pathogen_type': ml_result.get('pathogen_type', ''),
                    'pathogen_name': ml_result.get('pathogen_name', ''),
                    'severity': ml_result.get('severity', 'Unknown'),
                    'symptoms': ml_result.get('symptoms', []),
                    'treatment': ml_result.get('treatment', {}),
                    'prevention': ml_result.get('prevention', []),
                    'prognosis': ml_result.get('prognosis', ''),
                    'spread_risk': ml_result.get('spread_risk', ''),
                    'original_image': img_data_url
                }
                
                return jsonify(result), 200
            else:
                return jsonify({
                    'error': f'ML service error: {response.status_code}',
                    'details': response.text
                }), 500
                
        except requests.exceptions.ConnectionError:
            return jsonify({
                'error': 'Cannot connect to ML service',
                'details': 'Make sure the ML service is running on port 8001'
            }), 503
            
        except Exception as e:
            return jsonify({
                'error': 'ML service request failed',
                'details': str(e)
            }), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'ml_service': ML_SERVICE_URL
    })


if __name__ == '__main__':
    print("=" * 70)
    print("🌱 Plant Disease Detection Web App")
    print("=" * 70)
    print()
    print("📡 Server starting on: http://localhost:5001")
    print("🔬 ML Service: http://localhost:8001")
    print()
    print("⚠️  Make sure ML service is running before uploading images!")
    print("   Start it with: cd python_ml_service && poetry run python serve.py")
    print()
    print("=" * 70)
    
    app.run(debug=True, host='0.0.0.0', port=5001)
