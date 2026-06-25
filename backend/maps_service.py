from __future__ import annotations

import math
import random
from typing import Tuple


def distance_matrix_eta_minutes(
    user_lat: float,
    user_lng: float,
    bus_lat: float,
    bus_lng: float,
) -> Tuple[int, str]:
    """
    Purely mock ETA based on great-circle distance (no external APIs).
    Tuned for Chennai / Anna University scale.
    """

    def haversine(lat1, lon1, lat2, lon2):
        r = 6371.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dl = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dl / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return r * c

    dist_km = haversine(user_lat, user_lng, bus_lat, bus_lng)
    # Assume city traffic ~18 km/h, clamp to reasonable range
    minutes = max(2, int((dist_km / 18.0) * 60))
    return minutes, f"{minutes} mins (mock based on OSM-style distance)"


def directions_url(user_lat: float, user_lng: float, bus_lat: float, bus_lng: float) -> str:
    """
    Returns an OpenStreetMap directions URL (no API key required).
    """
    return (
        "https://www.openstreetmap.org/directions"
        f"?engine=fossgis_osrm_car&route={user_lat}%2C{user_lng}%3B{bus_lat}%2C{bus_lng}"
    )

