from __future__ import annotations

import os
import time
from typing import Dict, List, Tuple

import cv2
import numpy as np
from ultralytics import YOLO

from config import LOW_MAX, MEDIUM_MAX, MODEL_PATH, RESULTS_FOLDER


_model = None


def get_model() -> YOLO:
    global _model
    if _model is None:
        _model = YOLO(MODEL_PATH)
    return _model


def classify_density(count: int) -> str:
    """
    Maps person count to four crowd levels:
    - 0            → Empty
    - 1–LOW_MAX    → Moderate
    - LOW_MAX+1–MEDIUM_MAX → Crowded
    - > MEDIUM_MAX → Jam-packed
    """
    if count == 0:
        return "Empty"
    if count <= LOW_MAX:
        return "Moderate"
    if count <= MEDIUM_MAX:
        return "Crowded"
    return "Jam-packed"


def analyze_video(video_path: str, max_samples: int = 6) -> Dict:
    """
    Analyzes a bus video:
    - extracts frames
    - runs YOLOv8 person detection
    - counts people
    - returns density classification
    Also returns sampled frames + time series for dashboard graphs.
    """
    os.makedirs(RESULTS_FOLDER, exist_ok=True)
    model = get_model()

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError("Failed to open video")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps <= 0:
        fps = 30.0

    frame_times: List[float] = []
    max_count = 0
    total_count = 0
    frame_count = 0

    raw_sample_frames: List[np.ndarray] = []
    detection_sample_frames: List[np.ndarray] = []
    sample_counts: List[int] = []
    sample_frame_times: List[float] = []
    sample_frame_numbers: List[int] = []

    sample_every_n_frames = max(1, int(fps))

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_start = time.time()
            is_sample = len(raw_sample_frames) < max_samples and (frame_count % sample_every_n_frames == 0)

            if is_sample:
                raw_sample_frames.append(frame.copy())

            results = model(frame)

            person_count = 0
            for r in results:
                for box in r.boxes:
                    if int(box.cls) == 0:
                        person_count += 1
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        conf = float(box.conf[0].cpu().numpy())
                        cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                        cv2.putText(
                            frame,
                            f"Person ({conf:.2f})",
                            (int(x1), max(0, int(y1) - 10)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5,
                            (0, 255, 0),
                            2,
                        )

            if is_sample:
                detection_sample_frames.append(frame.copy())

            max_count = max(max_count, person_count)
            total_count += person_count

            elapsed = time.time() - frame_start
            frame_times.append(elapsed)
            if is_sample:
                sample_counts.append(person_count)
                sample_frame_times.append(elapsed)
                sample_frame_numbers.append(frame_count)

            frame_count += 1
    finally:
        cap.release()

    if frame_count == 0:
        raise RuntimeError("Video contained no frames")

    timestamp = int(time.time())
    raw_sample_filenames: List[str] = []
    detection_sample_filenames: List[str] = []

    for idx, img in enumerate(raw_sample_frames):
        fn = f"bus_raw_{timestamp}_{idx}.jpg"
        cv2.imwrite(os.path.join(RESULTS_FOLDER, fn), img)
        raw_sample_filenames.append(fn)

    for idx, img in enumerate(detection_sample_frames):
        fn = f"bus_det_{timestamp}_{idx}.jpg"
        cv2.imwrite(os.path.join(RESULTS_FOLDER, fn), img)
        detection_sample_filenames.append(fn)

    avg_frame_time = float(np.mean(frame_times)) if frame_times else 0.0
    avg_count = total_count / frame_count

    return {
        "max_count": int(max_count),
        "avg_count": round(avg_count, 2),
        "crowd_status": classify_density(int(max_count)),
        "total_frames": int(frame_count),
        "avg_frame_time": round(avg_frame_time, 3),
        "raw_sample_frames": raw_sample_filenames,
        "detection_sample_frames": detection_sample_filenames,
        "sample_counts": sample_counts,
        "sample_frame_times": [round(x, 4) for x in sample_frame_times],
        "sample_frame_numbers": sample_frame_numbers,
    }

