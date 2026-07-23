# backend/ai/predict.py
import os
import cv2
import json
import numpy as np

# Suppress TensorFlow GPU warnings on CPU
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

from face_detector import detect_face
from recommender import generate_routine

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models/finetuned_best.h5")

# 5 condition labels from your model
CONDITION_LABELS = [
    "Acne",
    "Dry Skin",
    "Oily Skin",
    "Dark Spots",
    "Wrinkles"
]

_GLOBAL_MODEL = None

def get_model():
    global _GLOBAL_MODEL
    if _GLOBAL_MODEL is None:
        print("Lazy Loading Facial Condition AI Model (This may take a moment)...")
        from tensorflow.keras.models import load_model
        _GLOBAL_MODEL = load_model(MODEL_PATH)
        print("Model loaded successfully!")
    return _GLOBAL_MODEL

def analyze_skin_and_recommend(image_path, previous_scores=None, threshold=0.4):
    # Step 1: Detect and crop face using MediaPipe/OpenCV
    face = detect_face(image_path)
    if face is None:
        return {"status": "error", "message": "No face detected in photo"}

    # Step 2: Resize & Normalize for TensorFlow (224x224x3)
    face_rgb = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
    face_resized = cv2.resize(face_rgb, (224, 224))
    input_data = np.expand_dims(face_resized / 255.0, axis=0)

    # Step 3: Run AI Prediction (Outputs 5 Sigmoid scores between 0.0 and 1.0)
    model = get_model()
    sigmoid_scores = model.predict(input_data, verbose=0)[0]

    # Step 4: Map scores to condition names
    current_scores = {}
    for idx, score in enumerate(sigmoid_scores):
        label = CONDITION_LABELS[idx]
        current_scores[label] = round(float(score) * 100, 1)

    # Step 5: Generate Day & Night Routine + Brand Recommendations
    recommendation = generate_routine(current_scores, previous_scores)

    return {
        "status": "success",
        "scores": current_scores,
        "recommendation": recommendation
    }

if __name__ == "__main__":
    # Path to test image
    test_img = os.path.join(os.path.dirname(__file__), "test_images/front.jpg")
    
    print(f"\nAnalyzing test image: {test_img}...")
    results = analyze_skin_and_recommend(test_img)
    
    print("\n================ FINAL JSON OUTPUT FOR REACT ================")
    print(json.dumps(results, indent=2))
    print("=============================================================\n")