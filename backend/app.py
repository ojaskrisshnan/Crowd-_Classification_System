from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import cv2
import numpy as np
from ultralytics import YOLO
import os
import time
import tempfile
from werkzeug.utils import secure_filename
import json

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
RESULTS_FOLDER = 'results'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'mp4', 'avi', 'mov', 'mkv'}

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

# Load YOLO model (will download automatically if not present)
print("Loading YOLO model...")
model = YOLO('yolov8n.pt')  # Using nano version for faster inference
print("YOLO model loaded successfully!")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def classify_crowd_density(count):
    """Classify crowd density based on count"""
    if count == 0:
        return "Empty"
    elif count <= 5:
        return "Empty"
    elif count <= 15:
        return "Moderate"
    elif count <= 30:
        return "Crowded"
    else:
        return "Jam-packed"

def detect_people_in_image(image_path):
    """Detect people in a single image"""
    start_time = time.time()
    
    # Read image
    image = cv2.imread(image_path)
    if image is None:
        return None, "Failed to read image"
    
    # Save original image to visualize frame extraction stage
    original_filename = f"original_{int(time.time())}.jpg"
    original_path = os.path.join(RESULTS_FOLDER, original_filename)
    cv2.imwrite(original_path, image)

    # Run YOLO inference
    results = model(image)
    
    # Filter for person class (class 0 in COCO dataset)
    person_count = 0
    annotated_image = image.copy()
    
    for result in results:
        boxes = result.boxes
        for box in boxes:
            # Check if detected object is a person (class 0)
            if int(box.cls) == 0:  # 0 is person class in COCO
                person_count += 1
                # Get bounding box coordinates
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0].cpu().numpy())
                
                # Draw bounding box
                cv2.rectangle(annotated_image, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                # Add label
                label = f"Person {person_count} ({confidence:.2f})"
                cv2.putText(annotated_image, label, (int(x1), int(y1) - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    processing_time = time.time() - start_time
    
    # Save annotated image
    result_filename = f"result_{int(time.time())}.jpg"
    result_path = os.path.join(RESULTS_FOLDER, result_filename)
    cv2.imwrite(result_path, annotated_image)
    
    return {
        'count': person_count,
        'crowd_level': classify_crowd_density(person_count),
        'processing_time': round(processing_time, 3),
        'result_image': result_filename,
        'original_image': original_filename
    }, None

def detect_people_in_video(video_path):
    """Detect people in video"""
    start_time = time.time()
    
    # Open video
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None, "Failed to open video"
    
    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0  # Default FPS if not available
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    if width <= 0 or height <= 0:
        cap.release()
        return None, "Invalid video dimensions"
    
    # Create video writer for output - use H.264 codec for web compatibility
    result_filename = f"result_{int(time.time())}.mp4"
    result_path = os.path.join(RESULTS_FOLDER, result_filename)
    
    # Try different codecs for compatibility
    fourcc = None
    codecs_to_try = ['avc1', 'H264', 'mp4v', 'XVID']
    
    for codec in codecs_to_try:
        try:
            fourcc = cv2.VideoWriter_fourcc(*codec)
            out = cv2.VideoWriter(result_path, fourcc, fps, (width, height))
            if out.isOpened():
                break
            else:
                out.release()
                fourcc = None
        except:
            fourcc = None
    
    if fourcc is None:
        cap.release()
        return None, "Failed to initialize video writer"
    
    frame_times = []
    max_count = 0
    total_count = 0
    frame_count = 0

    # To visualize pipeline stages for the frontend (multiple samples)
    raw_sample_frames = []
    detection_sample_frames = []
    sample_counts = []
    sample_frame_times = []
    sample_frame_numbers = []
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_start = time.time()

            sample_every_n_frames = max(1, int(cap.get(cv2.CAP_PROP_FPS)) or 1)
            is_sample = len(raw_sample_frames) < 6 and (frame_count % sample_every_n_frames == 0)

            # Keep copies of some raw frames for the frame extraction stage
            if is_sample:
                raw_sample_frames.append(frame.copy())
            
            # Run YOLO inference on frame
            results = model(frame)
            
            person_count = 0
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    if int(box.cls) == 0:  # Person class
                        person_count += 1
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0].cpu().numpy())
                        
                        # Draw bounding box
                        cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                        label = f"Person ({confidence:.2f})"
                        cv2.putText(frame, label, (int(x1), int(y1) - 10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            # Capture some frames after detection boxes are drawn
            if is_sample:
                detection_sample_frames.append(frame.copy())

            # Add count overlay for final video output
            cv2.putText(frame, f"Count: {person_count}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(frame, f"Level: {classify_crowd_density(person_count)}", (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            out.write(frame)
            
            max_count = max(max_count, person_count)
            total_count += person_count
            frame_elapsed = time.time() - frame_start
            if is_sample:
                sample_counts.append(person_count)
                sample_frame_times.append(frame_elapsed)
                sample_frame_numbers.append(frame_count)
            frame_count += 1
            frame_times.append(frame_elapsed)
    finally:
        cap.release()
        out.release()

    # Save sample frames for visualization if available
    raw_sample_filenames = []
    detection_sample_filenames = []

    timestamp = int(time.time())

    for idx, frame in enumerate(raw_sample_frames):
        filename = f"sample_raw_{timestamp}_{idx}.jpg"
        path = os.path.join(RESULTS_FOLDER, filename)
        cv2.imwrite(path, frame)
        raw_sample_filenames.append(filename)

    for idx, frame in enumerate(detection_sample_frames):
        filename = f"sample_detection_{timestamp}_{idx}.jpg"
        path = os.path.join(RESULTS_FOLDER, filename)
        cv2.imwrite(path, frame)
        detection_sample_filenames.append(filename)
    
    # Verify video was created
    if not os.path.exists(result_path) or os.path.getsize(result_path) == 0:
        return None, "Failed to create output video"
    
    total_processing_time = time.time() - start_time
    avg_frame_time = np.mean(frame_times) if frame_times else 0
    
    return {
        'max_count': max_count,
        'avg_count': round(total_count / frame_count, 2) if frame_count > 0 else 0,
        'crowd_level': classify_crowd_density(max_count),
        'total_processing_time': round(total_processing_time, 3),
        'avg_frame_time': round(avg_frame_time, 3),
        'total_frames': frame_count,
        'result_video': result_filename,
        'raw_sample_frames': raw_sample_filenames,
        'detection_sample_frames': detection_sample_filenames,
        'sample_counts': sample_counts,
        'sample_frame_times': [round(x, 4) for x in sample_frame_times],
        'sample_frame_numbers': sample_frame_numbers
    }, None

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Server is running'})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    # Save uploaded file
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    # Determine if image or video
    file_ext = filename.rsplit('.', 1)[1].lower()
    is_video = file_ext in ['mp4', 'avi', 'mov', 'mkv']
    
    try:
        if is_video:
            result, error = detect_people_in_video(filepath)
        else:
            result, error = detect_people_in_image(filepath)
        
        if error:
            return jsonify({'error': error}), 500
        
        result['file_type'] = 'video' if is_video else 'image'
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up uploaded file
        if os.path.exists(filepath):
            os.remove(filepath)

@app.route('/api/result/<filename>', methods=['GET'])
def get_result(filename):
    """Serve result images/videos"""
    filepath = os.path.join(RESULTS_FOLDER, filename)
    if os.path.exists(filepath):
        # Set proper MIME type for videos
        if filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
            return send_file(filepath, mimetype='video/mp4')
        else:
            return send_file(filepath, mimetype='image/jpeg')
    return jsonify({'error': 'File not found'}), 404

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000)

