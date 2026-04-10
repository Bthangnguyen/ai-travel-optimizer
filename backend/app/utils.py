from __future__ import annotations

import math
import re
import unicodedata


TIME_RE = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")


def strip_accents(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(char for char in normalized if not unicodedata.combining(char))


def parse_hhmm(value: str) -> int:
    match = TIME_RE.match(value)
    if not match:
        raise ValueError(f"Invalid time value: {value}")
    hour = int(match.group(1))
    minute = int(match.group(2))
    return hour * 60 + minute


def minutes_to_hhmm(total_minutes: int) -> str:
    normalized = max(0, total_minutes)
    hours = (normalized // 60) % 24
    minutes = normalized % 60
    return f"{hours:02d}:{minutes:02d}"


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return 2 * radius_km * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def travel_minutes_from_coords(
    lat1: float, lon1: float, lat2: float, lon2: float, avg_speed_kmh: float = 25.0
) -> int:
    distance_km = haversine_km(lat1, lon1, lat2, lon2)
    if distance_km == 0:
        return 0
    minutes = math.ceil((distance_km / avg_speed_kmh) * 60)
    return max(1, minutes)

