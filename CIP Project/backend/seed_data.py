from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Dict

from db import buses_collection


DEFAULT_BUSES: List[Dict] = [
    {
        "bus_id": "21G",
        "route": "Central Station → Tech Park",
        "capacity": 60,
        "arrival_time": 4,
        "location": {"lat": 12.9716, "lng": 77.5946},
    },
    {
        "bus_id": "15B",
        "route": "Market → University",
        "capacity": 50,
        "arrival_time": 7,
        "location": {"lat": 12.98, "lng": 77.6},
    },
    {
        "bus_id": "42C",
        "route": "Airport → City Center",
        "capacity": 70,
        "arrival_time": 10,
        "location": {"lat": 12.96, "lng": 77.58},
    },
    {
        "bus_id": "10A",
        "route": "North Hub → Downtown",
        "capacity": 55,
        "arrival_time": 13,
        "location": {"lat": 12.95, "lng": 77.59},
    },
    {
        "bus_id": "7D",
        "route": "South Loop",
        "capacity": 45,
        "arrival_time": 16,
        "location": {"lat": 12.965, "lng": 77.61},
    },
    {
        "bus_id": "99X",
        "route": "Ring Road Express",
        "capacity": 80,
        "arrival_time": 20,
        "location": {"lat": 12.975, "lng": 77.585},
    },
]


def seed_buses(overwrite: bool = True) -> int:
    col = buses_collection()
    if overwrite:
        col.delete_many({})

    now = datetime.now(timezone.utc).isoformat()
    docs = []
    for b in DEFAULT_BUSES:
        docs.append(
            {
                **b,
                "people_detected": 0,
                "crowd_status": "Low",
                "confidence_score": 0.0,
                "video_metrics": {},
                "last_updated": now,
            }
        )

    if docs:
        col.insert_many(docs)
    return len(docs)

