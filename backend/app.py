from datetime import datetime, timezone
import os
import time

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

from config import RESULTS_FOLDER, UPLOAD_FOLDER
from db import buses_collection
from decision_engine import recommend_best_bus
from maps_service import directions_url, distance_matrix_eta_minutes
from seed_data import seed_buses
from yolo_service import analyze_video, classify_density

app = Flask(__name__)
CORS(app)

# Minimal file validation for video uploads
ALLOWED_VIDEO_EXTENSIONS = {"mp4", "avi", "mov", "mkv"}


def _allowed_video(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Server is running'})

@app.route("/api/buses/seed", methods=["POST"])
def api_seed_buses():
    n = seed_buses(overwrite=True)
    return jsonify({"inserted": n}), 201


@app.route("/api/buses", methods=["GET"])
def api_list_buses():
    docs = list(buses_collection().find({}, {"_id": 0}))
    return jsonify({"buses": docs}), 200


@app.route("/api/buses/<bus_id>/upload", methods=["POST"])
def api_upload_bus_video(bus_id: str):
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    if not _allowed_video(file.filename):
        return jsonify({"error": "Invalid file type (video required)"}), 400

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    filename = secure_filename(file.filename)
    stored = f"{bus_id}_{int(time.time())}_{filename}"
    video_path = os.path.join(UPLOAD_FOLDER, stored)
    file.save(video_path)

    try:
        metrics = analyze_video(video_path)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(video_path):
            os.remove(video_path)

    col = buses_collection()
    existing = col.find_one({"bus_id": bus_id})
    if not existing:
        return jsonify({"error": f"Unknown bus_id '{bus_id}'. Seed buses first."}), 404

    # Store summary in bus doc
    people_detected = int(metrics["max_count"])
    crowd_status = str(metrics["crowd_status"])
    confidence_score = round(min(1.0, 0.6 + (people_detected / max(int(existing.get("capacity", 1)), 1)) * 0.4), 3)

    col.update_one(
        {"bus_id": bus_id},
        {
            "$set": {
                "people_detected": people_detected,
                "crowd_status": crowd_status,
                "confidence_score": confidence_score,
                "video_metrics": metrics,
                "last_updated": _now_iso(),
            }
        },
    )

    bus = col.find_one({"bus_id": bus_id}, {"_id": 0})
    return jsonify({"bus": bus}), 200


@app.route("/api/recommendation", methods=["POST"])
def api_recommendation():
    data = request.get_json(force=True, silent=True) or {}
    user_lat = data.get("user_lat")
    user_lng = data.get("user_lng")
    if user_lat is None or user_lng is None:
        return jsonify({"error": "user_lat and user_lng required"}), 400

    all_buses = list(buses_collection().find({}, {"_id": 0}))
    if not all_buses:
        return jsonify({"error": "No buses in database. Seed first."}), 404

    # update arrival_time using Google Distance Matrix (mock fallback if no key)
    for b in all_buses:
        loc = b.get("location") or {}
        bus_lat = loc.get("lat")
        bus_lng = loc.get("lng")
        if bus_lat is None or bus_lng is None:
            continue
        eta_min, eta_text = distance_matrix_eta_minutes(user_lat, user_lng, bus_lat, bus_lng)
        b["arrival_time"] = int(eta_min)
        b["eta_text"] = eta_text
        b["directions_url"] = directions_url(user_lat, user_lng, bus_lat, bus_lng)

    recommended, ranked = recommend_best_bus(all_buses)
    reasons = [
        f"Lower crowd density: {recommended.get('crowd_status')}",
        f"Arriving in {recommended.get('arrival_time')} minutes",
        f"Available capacity: {max(int(recommended.get('capacity', 0)) - int(recommended.get('people_detected', 0)), 0)}",
    ]

    return jsonify(
        {
            "recommended_bus": recommended,
            "reason": reasons,
            "ranked": [{"score": round(score, 4), "bus": bus} for score, bus in ranked],
            "all_buses": all_buses,
        }
    ), 200

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

