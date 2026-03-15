# Bus Crowd Classification System

A web application for estimating bus crowd density using YOLO object detection.

## Features

- Upload images or videos of bus CCTV footage
- Detect and count people using YOLOv8
- Classify crowd density levels:
  - Empty (0-5 people)
  - Moderate (6-15 people)
  - Crowded (16-30 people)
  - Jam-packed (30+ people)
- Display annotated results with bounding boxes
- Real-time processing time measurement

## Project Structure

```
.
├── backend/          # Flask API server
│   ├── app.py       # Main Flask application
│   └── requirements.txt
├── frontend/        # React frontend
│   ├── src/
│   └── public/
└── README.md
```

## Setup Instructions

### Backend Setup

1. Create virtual environment:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run server:
```bash
python app.py
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run development server:
```bash
npm start
```

## Usage

1. Start the backend server (runs on http://localhost:5000)
2. Start the frontend server (runs on http://localhost:3000)
3. Open the web app in your browser
4. Upload an image or video file
5. View the detection results with crowd count and density level

## Technology Stack

- **Backend**: Python, Flask, OpenCV, YOLOv8 (Ultralytics)
- **Frontend**: React, Axios
- **AI Model**: YOLOv8 Nano (pre-trained on COCO dataset)

