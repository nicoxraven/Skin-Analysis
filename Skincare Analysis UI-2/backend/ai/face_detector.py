# ai/face_detector.py
import os
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Locate the downloaded .tflite model file
MODEL_FILE_PATH = os.path.join(os.path.dirname(__file__), 'blaze_face_short_range.tflite')

# Initialize MediaPipe Face Detector
base_options = python.BaseOptions(model_asset_path=MODEL_FILE_PATH)
options = vision.FaceDetectorOptions(base_options=base_options)
detector = vision.FaceDetector.create_from_options(options)

def detect_face(image_path):
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Could not read image at {image_path}")
        return None

    # Load image for MediaPipe Tasks API
    mp_image = mp.Image.create_from_file(image_path)
    
    # Perform face detection
    detection_result = detector.detect(mp_image)

    if not detection_result.detections:
        print("No face detected in the image.")
        return None

    # Get bounding box of the first detected face
    bbox = detection_result.detections[0].bounding_box
    
    h, w, _ = image.shape

    # Ensure bounds stay within image dimensions
    x = max(0, bbox.origin_x)
    y = max(0, bbox.origin_y)
    width = min(w - x, bbox.width)
    height = min(h - y, bbox.height)

    # Crop face region
    face = image[y:y+height, x:x+width]

    if face.size == 0:
        return None

    return face