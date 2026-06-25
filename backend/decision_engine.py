from __future__ import annotations

from typing import Dict, List, Tuple


def density_value(status: str) -> float:
    status = (status or "").strip().lower()
    # Map Empty / Moderate / Crowded / Jam-packed to [0, 1]
    if status == "empty":
        return 0.0
    if status == "moderate":
        return 0.33
    if status == "crowded":
        return 0.66
    if status in ("jam-packed", "jampacked", "jam packed"):
        return 1.0
    return 0.5


def capacity_utilization(people: int, capacity: int) -> float:
    if capacity <= 0:
        return 1.0
    return min(max(people, 0) / capacity, 1.5)


def arrival_time_score(minutes: int, max_minutes: int = 30) -> float:
    if minutes <= 0:
        return 0.0
    return min(minutes / max_minutes, 1.0)


def compute_bus_score(bus: Dict) -> float:
    """
    score =
      0.5 * crowd_density +
      0.3 * arrival_time +
      0.2 * capacity_utilization

    Lower score is better (less crowded, earlier arrival, less utilization).
    """
    crowd_density = density_value(bus.get("crowd_status"))
    arrival_time = arrival_time_score(int(bus.get("arrival_time", 0)))
    utilization = capacity_utilization(
        int(bus.get("people_detected", 0)),
        int(bus.get("capacity", 0)),
    )
    return 0.5 * crowd_density + 0.3 * arrival_time + 0.2 * utilization


def rank_buses(buses: List[Dict]) -> List[Tuple[float, Dict]]:
    scored = [(compute_bus_score(b), b) for b in buses]
    scored.sort(key=lambda x: x[0])
    return scored


def recommend_best_bus(buses: List[Dict]) -> Tuple[Dict, List[Tuple[float, Dict]]]:
    ranked = rank_buses(buses)
    if not ranked:
        raise ValueError("No buses available to recommend")
    return ranked[0][1], ranked

