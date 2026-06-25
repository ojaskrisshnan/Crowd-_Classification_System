import os

from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "bus_crowd_db")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
MODEL_PATH = os.getenv("MODEL_PATH", "yolov8n.pt")

UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
RESULTS_FOLDER = os.getenv("RESULTS_FOLDER", "results")

# Crowd density thresholds (project requirement)
LOW_MAX = 20
MEDIUM_MAX = 40

# Crowded vs non-crowded threshold used for ROC-style binary metrics
CROWDED_MIN = 21

