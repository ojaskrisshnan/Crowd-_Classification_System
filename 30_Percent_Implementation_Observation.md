# 30% Implementation - Observation Notebook Entry

## Project: Bus Crowd Estimation System using YOLO-based Object Detection

### Implementation Overview

At the 30% milestone, we have successfully implemented the core modules of our crowd counting and density classification system. The implementation follows the modular architecture design and integrates all six primary modules as specified in our system design. The project demonstrates a functional end-to-end pipeline from video input to annotated output visualization.

---

## Implemented Modules

### 1. Video Input Module
**Status:** ✅ **Completed**

**Implementation Details:**
- Developed a Flask-based REST API backend (`backend/app.py`) that accepts video and image uploads
- Supports multiple video formats: MP4, AVI, MOV, MKV
- Supports image formats: PNG, JPG, JPEG
- Implemented secure file handling using `werkzeug.utils.secure_filename`
- Created dedicated upload directory structure (`uploads/` folder)
- Video validation includes format checking and dimension verification
- Handles both pre-recorded video footage and live image inputs

**Technical Implementation:**
- File upload endpoint: `/api/upload` (POST method)
- Automatic file type detection (image vs. video)
- Error handling for invalid files and corrupted media

---

### 2. Frame Extraction Module
**Status:** ✅ **Completed**

**Implementation Details:**
- Integrated OpenCV (`cv2`) for video frame extraction
- Sequential frame reading from video streams
- Maintains original video properties (FPS, resolution, codec)
- Frame-by-frame processing pipeline implemented in `detect_people_in_video()` function
- Automatic FPS detection with fallback to 30 FPS default
- Frame validation to ensure proper dimensions before processing

**Technical Implementation:**
- Uses `cv2.VideoCapture()` for video stream initialization
- Frame extraction loop: `cap.read()` for sequential frame access
- Preserves video metadata (width, height, FPS) for output video generation

---

### 3. Person Detection Module
**Status:** ✅ **Completed**

**Implementation Details:**
- Integrated YOLOv8 Nano model (Ultralytics) for object detection
- Pre-trained model on COCO dataset (automatically downloads `yolov8n.pt` if not present)
- Single-stage object detection applied to each frame
- Person class filtering (class ID: 0 in COCO dataset)
- Bounding box coordinate extraction (x1, y1, x2, y2 format)
- Confidence score extraction for each detection
- Model loaded once at application startup for efficiency

**Technical Implementation:**
- YOLO model initialization: `YOLO('yolov8n.pt')`
- Inference: `model(frame)` for each frame
- Detection filtering: `if int(box.cls) == 0` for person class only
- Bounding box coordinates: `box.xyxy[0].cpu().numpy()`

**Team Contribution:** This module aligns with **Sindhulakshmi E's** responsibility for "YOLO-based model implementation" as specified in the team roles.

---

### 4. Person Counting Module
**Status:** ✅ **Completed**

**Implementation Details:**
- Dynamic person counting per frame
- Counts bounding boxes corresponding to detected persons
- Tracks maximum count across all frames (for video processing)
- Calculates average count across frames
- Real-time count updates during video processing
- Separate counting logic for images (single frame) and videos (multiple frames)

**Technical Implementation:**
- Counter increment: `person_count += 1` for each detected person
- Video statistics: `max_count`, `total_count`, `avg_count` calculation
- Frame-by-frame count tracking and aggregation

**Team Contribution:** This module aligns with **Sindhulakshmi E's** responsibility for "Crowd counting and density classification" as specified in the team roles.

---

### 5. Crowd Density Classification Module
**Status:** ✅ **Completed**

**Implementation Details:**
- Implemented threshold-based classification system
- Four density categories defined:
  - **Empty**: 0-5 people
  - **Moderate**: 6-15 people
  - **Crowded**: 16-30 people
  - **Jam-packed**: 30+ people
- Classification function: `classify_crowd_density(count)`
- Applied to each frame's person count
- Returns density level label for visualization

**Technical Implementation:**
```python
def classify_crowd_density(count):
    if count == 0 or count <= 5:
        return "Empty"
    elif count <= 15:
        return "Moderate"
    elif count <= 30:
        return "Crowded"
    else:
        return "Jam-packed"
```

**Team Contribution:** This module aligns with **Sindhulakshmi E's** responsibility for "Crowd counting and density classification" as specified in the team roles.

---

### 6. Output Visualization Module
**Status:** ✅ **Completed**

**Implementation Details:**
- Bounding box visualization using OpenCV drawing functions
- Green bounding boxes (`(0, 255, 0)` color) around detected persons
- Confidence score labels on each bounding box
- Person count overlay on video frames
- Crowd density level overlay on video frames
- Annotated output saved to `results/` directory
- Video output generation with original FPS and resolution
- Multiple codec support (H.264, AVC1, MP4V, XVID) for compatibility

**Technical Implementation:**
- Bounding box drawing: `cv2.rectangle()` with coordinates
- Text overlay: `cv2.putText()` for count and density labels
- Video writer: `cv2.VideoWriter()` for output video generation
- Result serving: `/api/result/<filename>` endpoint for frontend access

**Team Contribution:** This module aligns with **Ojaskrisshnan S's** responsibility for "Video annotation, and output generation" as specified in the team roles.

---

## System Architecture Integration

**Status:** ✅ **Completed**

The system follows a modular architecture where:
1. **Video Input Module** receives media files and passes them to processing
2. **Frame Extraction Module** extracts frames and feeds them sequentially
3. **Person Detection Module** processes each frame and returns detections
4. **Person Counting Module** aggregates counts from detections
5. **Crowd Density Classification Module** categorizes the counts
6. **Output Visualization Module** renders all information on output media

**Team Contribution:** This architecture aligns with **Ojaskrisshnan S's** responsibility for "System architecture design" as specified in the team roles.

---

## Frontend Integration

**Status:** ✅ **Completed**

- React-based web application for user interface
- File upload component with drag-and-drop support
- Real-time processing status display
- Result visualization with annotated images/videos
- Crowd level display with color-coded indicators
- Processing time metrics display

---

## Technology Stack Implemented

- **Backend Framework:** Flask (Python)
- **Computer Vision:** OpenCV (cv2)
- **Object Detection:** YOLOv8 Nano (Ultralytics)
- **Frontend:** React.js
- **API Communication:** Axios
- **File Handling:** Werkzeug

---

## Dataset and Preprocessing

**Status:** ✅ **In Progress**

- Video preprocessing infrastructure implemented
- Frame extraction capability ready for dataset management
- Support for multiple video formats for dataset collection

**Team Contribution:** This aligns with **Kirupa V's** responsibility for "Dataset collection, Video preprocessing, Frame extraction and dataset management" as specified in the team roles.

---

## Performance Metrics

**Status:** ✅ **Implemented (Basic)**

- Processing time measurement per frame
- Total processing time calculation
- Average frame processing time
- Frame count tracking

**Note:** Full performance evaluation and result analysis will be conducted in later phases, aligning with **Shiyamala Devi J's** responsibility for "Performance evaluation, Result analysis" as specified in the team roles.

---

## Key Achievements at 30% Milestone

1. ✅ Complete end-to-end pipeline from input to output
2. ✅ All six core modules functional and integrated
3. ✅ YOLOv8 model successfully integrated and working
4. ✅ Real-time person detection and counting operational
5. ✅ Crowd density classification system implemented
6. ✅ Annotated output generation working for both images and videos
7. ✅ Web-based user interface for easy interaction
8. ✅ RESTful API architecture for modular backend

---

## Current Limitations and Future Enhancements

**For Next Milestones:**
- Performance optimization for real-time processing
- Enhanced accuracy through model fine-tuning
- Multi-camera support for live surveillance feeds
- Database integration for result storage and analysis
- Advanced tracking algorithms (DeepSORT/ByteTrack) for unique person counting
- Alert system for jam-packed conditions
- Historical data analysis and reporting

---

## Conclusion

The 30% implementation milestone demonstrates a fully functional crowd counting and density classification system. All core modules are operational, and the system successfully processes both images and videos to detect, count, and classify crowd density levels. The modular architecture allows for easy extension and enhancement in subsequent development phases.

**Team Coordination:** The implementation reflects effective collaboration across team members, with each member contributing to their assigned responsibilities as outlined in the project roles.

---

*Observation Date: [Current Date]*  
*Project Phase: 30% Implementation Milestone*  
*Status: Core Modules Completed and Functional*
