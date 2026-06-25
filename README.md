# Bus Crowd Classification & Routing Recommendation System

An intelligent transit monitoring and decision-support web application that analyzes bus CCTV footage in real-time, classifies crowd density using YOLOv8, and recommends alternative options to passengers based on proximity, ETA, and bus occupancy.

## 🚀 Key Features

* **AI-Powered Video Analytics**: Process surveillance camera feeds using YOLOv8 to count passengers and classify crowd density (Low, Medium, High).
* **Smart Route Recommendation**: Suggest the best alternative bus routes for passengers dynamically based on real-time occupancy and travel times.
* **Interactive Dashboard**: Sleek, modern frontend built with Vite, React, and Tailwind CSS to display active buses, ETA, capacity, and current crowd levels.
* **Geographical Mapping**: Interactive visualization of bus positions and routes using React Leaflet maps.
* **Evaluation Dashboard**: Built-in evaluation interface displaying system accuracy, classification reports, ROC curves, and confusion matrices for YOLOv8 performance validation.
* **Persistent Database**: Integrates with MongoDB to persist bus metadata, real-time passenger counts, and analysis logs.

---

## 📂 Project Structure

```text
.
├── backend/                  # Flask API Server
│   ├── app.py                # Main Flask entrypoint & routes
│   ├── config.py             # Configuration loader (.env binding)
│   ├── db.py                 # MongoDB client & collection helpers
│   ├── decision_engine.py    # Multi-criteria recommendation engine
│   ├── evaluation.py         # YOLO performance evaluation & metrics
│   ├── maps_service.py       # Distance matrix API integration
│   ├── seed_data.py          # Initial bus datasets & route seeds
│   ├── yolo_service.py       # YOLOv8 object detection & processing wrapper
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # React Frontend
│   ├── public/               # Public assets
│   ├── src/
│   │   ├── components/       # UI Components (BusCard, MapPanel, RecommendationPanel, etc.)
│   │   ├── lib/              # Client API connection & Axios configuration
│   │   ├── pages/            # View Pages (Dashboard, Evaluation, Login)
│   │   ├── App.jsx           # Main routing & application layout
│   │   ├── index.css         # Tailwind directives & styles
│   │   └── main.jsx          # React DOM mounting
│   ├── postcss.config.cjs    # PostCSS configuration
│   ├── tailwind.config.cjs   # Tailwind CSS configuration
│   ├── vite.config.js        # Vite building environment configuration
│   └── package.json          # Node dependencies & npm scripts
│
└── README.md
```

---

## 🛠️ Setup Instructions

### Prerequisites
* **Python**: `3.9` or higher
* **Node.js**: `18.x` or higher
* **MongoDB**: A running local or remote instance (default port: `27017`)

---

### 1. Backend Setup

1. Navigate to the backend directory and create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Create your configuration environment file:
   ```bash
   copy .env.example .env
   ```
   *Edit `.env` to specify your `MONGODB_URI`, `DB_NAME`, and optionally a `GOOGLE_MAPS_API_KEY` for routing services.*

4. Launch the backend application:
   ```bash
   python app.py
   ```
   *The Flask API server will start on [http://localhost:5000](http://localhost:5000).*

5. Seed the initial database (populate bus records):
   *Send a POST request to [http://localhost:5000/api/buses/seed](http://localhost:5000/api/buses/seed) to populate MongoDB with default bus route data.*

---

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install development and production dependencies:
   ```bash
   npm install
   ```

3. Create the frontend environment configuration:
   ```bash
   copy .env.example .env
   ```
   *Verify that the API URL points to the backend server (e.g., `VITE_API_URL=http://localhost:5000`).*

4. Run the development server:
   ```bash
   npm run dev
   ```
   *The frontend dashboard will run locally on [http://localhost:5173](http://localhost:5173).*

---

## 📊 Technical Stack

* **AI / ML Model**: YOLOv8 Nano (Ultralytics) for person detection, coupled with custom temporal tracking.
* **Backend Framework**: Flask, OpenCV (for frame parsing), PyMongo (MongoDB wrapper), Scikit-Learn (for evaluating classifier metrics).
* **Frontend Library**: React (Vite-optimized), Axios (HTTP Client), Tailwind CSS (Aesthetic layout), Chart.js (Interactive evaluation visuals), React Leaflet (OpenStreetMap visualization).
* **Database**: MongoDB (NoSQL) for storing dynamic transit telemetry.
