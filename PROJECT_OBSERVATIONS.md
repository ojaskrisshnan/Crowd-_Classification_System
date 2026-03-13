# Crowd Density Classification System - Project Observations
## 50% Completion Report

---

## 1. Project Overview

This document outlines the implementation progress of a **Crowd Density Classification System** that processes video input to detect, count, and classify crowd density levels. The system follows a modular pipeline architecture where each stage processes data sequentially and produces intermediate outputs for visualization.

**Technology Stack:**
- **Backend**: Python, Flask, OpenCV, YOLOv8 (Ultralytics)
- **Frontend**: React.js, Axios
- **AI Model**: YOLOv8 Nano (pre-trained on COCO dataset)

---

## 2. System Architecture & Workflow

The system follows a sequential pipeline architecture as shown in the block diagram:

```
Video Input → Frame Extraction → Person Detection → Person Counting → Crowd Density Classification → Output Visualization
```

Each stage processes data and produces outputs that are visualized in the frontend interface.

---

## 3. Implementation Details by Stage

### Stage 1: Video Input

**Description:** Initialize video capture using OpenCV to receive continuous video stream.

**Implementation:**

The system accepts both image and video inputs through a Flask API endpoint. The video input is handled using OpenCV's `VideoCapture` class.

**Code Snippet:**

```python
# backend/app.py (Lines 103-105)
cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    return None, "Failed to open video"
```

**Key Features:**
- Supports multiple video formats: `.mp4`, `.avi`, `.mov`, `.mkv`
- Validates video file before processing
- Extracts video properties (FPS, width, height) for proper processing

**Frontend Implementation:**

```javascript
// frontend/src/App.js (Lines 76-84)
<input
  type="file"
  id="file-input"
  accept="image/*,video/*"
  onChange={handleFileChange}
  className="file-input"
/>
```

**Output:** Continuous video stream ready for frame-by-frame processing.

---

### Stage 2: Frame Extraction

**Description:** Extract frames sequentially from the video stream, maintaining fixed frame rate and preparing frames for analysis.

**Implementation:**

The system reads frames from the video stream sequentially using OpenCV's `read()` method. For visualization purposes, sample frames are captured at regular intervals to showcase the extraction process.

**Code Snippet:**

```python
# backend/app.py (Lines 152-161)
while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    frame_start = time.time()

    # Keep copies of some raw frames for the frame extraction stage
    if len(raw_sample_frames) < 6 and frame_count % max(1, int(cap.get(cv2.CAP_PROP_FPS)) or 1) == 0:
        raw_sample_frames.append(frame.copy())
```

**Key Features:**
- Sequential frame extraction maintaining video FPS
- Captures up to 6 sample frames at 1-second intervals for visualization
- Preserves original frame data before any processing
- Handles both video and image inputs (for images, the original image is saved)

**Image Processing:**

```python
# backend/app.py (Lines 54-57)
# Save original image to visualize frame extraction stage
original_filename = f"original_{int(time.time())}.jpg"
original_path = os.path.join(RESULTS_FOLDER, original_filename)
cv2.imwrite(original_path, image)
```

**Frontend Visualization:**

```javascript
// frontend/src/App.js (Lines 145-168)
<div className="pipeline-card">
  <div className="pipeline-title">Stage 1: Frame Extraction</div>
  {result.file_type === 'video' ? (
    Array.isArray(result.raw_sample_frames) && result.raw_sample_frames.length > 0 ? (
      <div className="pipeline-gallery">
        {result.raw_sample_frames.map((frameName, idx) => (
          <img
            key={idx}
            src={`${API_URL}/result/${frameName}`}
            alt={`Raw frame ${idx + 1}`}
            className="pipeline-image small"
          />
        ))}
      </div>
    ) : (
      <p className="pipeline-text">
        Raw frames are extracted from the input video for analysis.
      </p>
    )
  ) : (
    <img
      src={`${API_URL}/result/${result.original_image || result.result_image}`}
      alt="Original frame"
      className="pipeline-image"
    />
  )}
</div>
```

**Output:** 
- Extracted frames (individual images from video)
- Sample raw frames saved as `sample_raw_<timestamp>_<index>.jpg` for visualization

---

### Stage 3: Person Detection

**Description:** Apply YOLO object detection to identify persons in each frame, filter out non-person classes, and generate bounding boxes around detected individuals.

**Implementation:**

The system uses YOLOv8 Nano model (pre-trained on COCO dataset) to detect objects. It filters results to only include the "person" class (class ID 0) and draws bounding boxes around each detected person.

**Code Snippet:**

```python
# backend/app.py (Lines 163-180)
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
```

**Key Features:**
- Uses YOLOv8 Nano for fast inference
- Filters detection results to person class only (class ID 0)
- Draws green bounding boxes around detected persons
- Displays confidence scores for each detection
- Captures sample frames with detection boxes for visualization

**Model Loading:**

```python
# backend/app.py (Lines 24-27)
# Load YOLO model (will download automatically if not present)
print("Loading YOLO model...")
model = YOLO('yolov8n.pt')  # Using nano version for faster inference
print("YOLO model loaded successfully!")
```

**Sample Frame Capture:**

```python
# backend/app.py (Lines 182-184)
# Capture some frames after detection boxes are drawn
if len(detection_sample_frames) < 6 and frame_count % max(1, int(cap.get(cv2.CAP_PROP_FPS)) or 1) == 0:
    detection_sample_frames.append(frame.copy())
```

**Frontend Visualization:**

```javascript
// frontend/src/App.js (Lines 171-197)
<div className="pipeline-card">
  <div className="pipeline-title">Stage 2: Person Detection</div>
  {result.file_type === 'video' ? (
    Array.isArray(result.detection_sample_frames) && result.detection_sample_frames.length > 0 ? (
      <div className="pipeline-gallery">
        {result.detection_sample_frames.map((frameName, idx) => (
          <img
            key={idx}
            src={`${API_URL}/result/${frameName}`}
            alt={`Detection frame ${idx + 1}`}
            className="pipeline-image small"
          />
        ))}
      </div>
    ) : (
      <p className="pipeline-text">
        YOLO detects persons in each frame and draws bounding boxes.
      </p>
    )
  ) : (
    <img
      src={`${API_URL}/result/${result.result_image}`}
      alt="Detection result"
      className="pipeline-image"
    />
  )}
</div>
```

**Output:**
- Frames with detected persons (bounding boxes drawn)
- Sample detection frames saved as `sample_detection_<timestamp>_<index>.jpg`
- Bounding box coordinates and confidence scores

---

### Stage 4: Person Counting

**Description:** Count the number of bounding boxes (each representing a detected person), update count dynamically for each frame, and store count for classification.

**Implementation:**

The system counts bounding boxes by iterating through YOLO detection results and incrementing a counter for each person detected. For videos, it tracks maximum count, average count, and maintains count per frame.

**Code Snippet:**

```python
# backend/app.py (Lines 166-194)
person_count = 0

for result in results:
    boxes = result.boxes
    for box in boxes:
        if int(box.cls) == 0:  # Person class
            person_count += 1
            # ... bounding box drawing code ...

# Add count overlay for final video output
cv2.putText(frame, f"Count: {person_count}", (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
cv2.putText(frame, f"Level: {classify_crowd_density(person_count)}", (10, 60),
            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

out.write(frame)

max_count = max(max_count, person_count)
total_count += person_count
frame_count += 1
```

**Key Features:**
- Counts bounding boxes (one per detected person)
- Tracks maximum count across all frames (for videos)
- Calculates average count across frames
- Updates count dynamically for each frame
- Displays count overlay on output video

**Statistics Calculation:**

```python
# backend/app.py (Lines 224-229)
total_processing_time = time.time() - start_time
avg_frame_time = np.mean(frame_times) if frame_times else 0

return {
    'max_count': max_count,
    'avg_count': round(total_count / frame_count, 2) if frame_count > 0 else 0,
    # ... other fields ...
}
```

**Frontend Visualization:**

```javascript
// frontend/src/App.js (Lines 199-222)
<div className="pipeline-card">
  <div className="pipeline-title">Stage 3: Person Counting</div>
  <div className="pipeline-count">
    <div>People Count:</div>
    <div className="pipeline-count-value">
      {result.file_type === 'video' ? result.max_count : result.count}
    </div>
  </div>
  {result.file_type === 'video' ? (
    <video
      src={`${API_URL}/result/${result.result_video}`}
      controls
      className="result-video"
    >
      Your browser does not support the video tag.
    </video>
  ) : (
    <img
      src={`${API_URL}/result/${result.result_image}`}
      alt="Final annotated image"
      className="pipeline-image"
    />
  )}
</div>
```

**Output:**
- Person count per frame
- Maximum count (for videos)
- Average count (for videos)
- Annotated video/image with count overlay

---

### Stage 5: Crowd Density Classification

**Description:** Classify crowd density level based on the person count using predefined thresholds.

**Implementation:**

The system uses a simple threshold-based classification system with four density levels: Empty, Moderate, Crowded, and Jam-packed.

**Code Snippet:**

```python
# backend/app.py (Lines 32-43)
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
```

**Classification Thresholds:**
- **Empty**: 0-5 people
- **Moderate**: 6-15 people
- **Crowded**: 16-30 people
- **Jam-packed**: 30+ people

**Integration:**

```python
# backend/app.py (Lines 189-190)
cv2.putText(frame, f"Level: {classify_crowd_density(person_count)}", (10, 60),
            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
```

**Frontend Display:**

```javascript
// frontend/src/App.js (Lines 117-125)
<div className="stat-card">
  <div className="stat-label">Crowd Level</div>
  <div
    className="stat-value"
    style={{ color: getCrowdLevelColor(result.crowd_level) }}
  >
    {result.crowd_level}
  </div>
</div>
```

**Color Coding:**

```javascript
// frontend/src/App.js (Lines 51-64)
const getCrowdLevelColor = (level) => {
  switch (level) {
    case 'Empty':
      return '#4CAF50';      // Green
    case 'Moderate':
      return '#FFC107';      // Yellow
    case 'Crowded':
      return '#FF9800';      // Orange
    case 'Jam-packed':
      return '#F44336';      // Red
    default:
      return '#666';
  }
};
```

**Output:**
- Crowd density level classification
- Color-coded visualization in frontend

---

### Stage 6: Output Visualization

**Description:** Display the final annotated video/image with bounding boxes, person count, and crowd density level overlay.

**Implementation:**

The system saves the processed video/image with all annotations and serves it through the Flask API. The frontend displays the results in a user-friendly interface with stage-wise visualization.

**Video Output Generation:**

```python
# backend/app.py (Lines 118-140)
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
```

**API Endpoint for Serving Results:**

```python
# backend/app.py (Lines 283-293)
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
```

**Frontend Statistics Display:**

```javascript
// frontend/src/App.js (Lines 106-138)
<div className="stats-grid">
  <div className="stat-card">
    <div className="stat-label">People Count</div>
    <div className="stat-value">
      {result.file_type === 'video' ? result.max_count : result.count}
    </div>
    {result.file_type === 'video' && (
      <div className="stat-subtext">Max: {result.max_count} | Avg: {result.avg_count}</div>
    )}
  </div>

  <div className="stat-card">
    <div className="stat-label">Crowd Level</div>
    <div
      className="stat-value"
      style={{ color: getCrowdLevelColor(result.crowd_level) }}
    >
      {result.crowd_level}
    </div>
  </div>

  <div className="stat-card">
    <div className="stat-label">Processing Time</div>
    <div className="stat-value">
      {result.file_type === 'video' 
        ? `${result.total_processing_time}s` 
        : `${result.processing_time}s`}
    </div>
    {result.file_type === 'video' && (
      <div className="stat-subtext">Avg per frame: {result.avg_frame_time}s</div>
    )}
  </div>
</div>
```

**Output:**
- Annotated video with bounding boxes, count, and density level
- Annotated image with same information
- Statistics dashboard showing count, level, and processing time
- Stage-wise visualization gallery

---

## 4. API Endpoints

### POST `/api/upload`
Uploads an image or video file for processing.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (image or video file)

**Response:**
```json
{
  "file_type": "video",
  "max_count": 25,
  "avg_count": 22.5,
  "crowd_level": "Crowded",
  "total_processing_time": 12.345,
  "avg_frame_time": 0.123,
  "total_frames": 100,
  "result_video": "result_1234567890.mp4",
  "raw_sample_frames": ["sample_raw_1234567890_0.jpg", ...],
  "detection_sample_frames": ["sample_detection_1234567890_0.jpg", ...]
}
```

### GET `/api/result/<filename>`
Serves processed result images or videos.

**Response:** Binary file (image/jpeg or video/mp4)

### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

## 5. Frontend Architecture

### Component Structure

The frontend is built as a single-page React application with the following key components:

1. **File Upload Section**: Handles file selection and upload
2. **Statistics Dashboard**: Displays count, crowd level, and processing time
3. **Pipeline Visualization**: Shows stage-wise outputs
   - Stage 1: Frame Extraction (gallery of raw frames)
   - Stage 2: Person Detection (gallery of detection frames)
   - Stage 3: Person Counting (final annotated video/image)

### Styling

The UI uses a **black and simple** design theme:
- Black background (`#000`)
- Dark gray containers (`#111`, `#151515`)
- Light text (`#f5f5f5`)
- Minimal shadows and borders
- Large, scrollable layout for better visibility

**Key CSS Classes:**
- `.pipeline-section`: Container for all pipeline stages
- `.pipeline-card`: Individual stage container
- `.pipeline-gallery`: Grid layout for multiple frames
- `.pipeline-image`: Styled images with proper sizing

---

## 6. Data Flow

```
User Upload → Flask API → File Validation → 
  ↓
Video/Image Processing:
  ├─ Frame Extraction → Save sample frames
  ├─ YOLO Detection → Draw bounding boxes → Save detection frames
  ├─ Person Counting → Calculate statistics
  └─ Density Classification → Determine level
  ↓
Save Results → Return JSON Response →
  ↓
Frontend Display:
  ├─ Statistics Cards
  └─ Pipeline Visualization (3 stages)
```

---

## 7. Key Features Implemented

✅ **Video Input Handling**
- Support for multiple video formats
- Proper video property extraction

✅ **Frame Extraction**
- Sequential frame reading
- Sample frame capture for visualization
- Original image preservation for images

✅ **Person Detection**
- YOLOv8 integration
- Person class filtering
- Bounding box generation
- Confidence score display

✅ **Person Counting**
- Dynamic count per frame
- Maximum and average count calculation
- Count overlay on output

✅ **Crowd Density Classification**
- Threshold-based classification
- Four density levels
- Color-coded visualization

✅ **Output Visualization**
- Annotated video/image generation
- Stage-wise output display
- Statistics dashboard
- Gallery view for multiple frames

✅ **Web Interface**
- Modern React frontend
- Stage-wise workflow visualization
- Responsive design
- Error handling

---

## 8. Technical Highlights

1. **Efficient Processing**: Uses YOLOv8 Nano for fast inference while maintaining accuracy
2. **Visualization**: Captures and displays intermediate outputs at each stage
3. **Codec Compatibility**: Tries multiple video codecs for maximum compatibility
4. **Performance Metrics**: Tracks processing time per frame and total time
5. **Error Handling**: Validates inputs and handles edge cases gracefully
6. **Modular Design**: Each stage is clearly separated and can be modified independently

---

## 9. Current Limitations & Future Work

**Current Limitations:**
- Fixed classification thresholds (could be made configurable)
- Limited to person detection (COCO dataset class 0)
- Sample frames captured at fixed intervals

**Future Enhancements (Remaining 50%):**
- Real-time video streaming support
- Advanced density estimation algorithms
- Multi-class object detection
- Database integration for historical data
- User authentication and session management
- Export functionality for reports
- Advanced analytics and trends

---

## 10. Conclusion

The project has successfully implemented **50% of the planned features**, covering all core stages of the crowd density classification pipeline:

1. ✅ Video Input
2. ✅ Frame Extraction
3. ✅ Person Detection
4. ✅ Person Counting
5. ✅ Crowd Density Classification
6. ✅ Output Visualization

The system demonstrates a complete workflow from video input to annotated output, with intermediate stage visualization that helps users understand how the system processes data at each step. The modular architecture allows for easy extension and modification of individual components.

---

**Document Generated:** February 13, 2026  
**Project Status:** 50% Complete  
**Next Milestone:** Real-time processing and advanced analytics
