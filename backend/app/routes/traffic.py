"""Live traffic leg assessment (Mapbox or Google). Results are cached briefly to reduce quota."""
from __future__ import annotations

import os
import time
from dataclasses import dataclass

import httpx
from fastapi import APIRouter, HTTPException

from ..config import settings

router = APIRouter(prefix="/traffic", tags=["Live Traffic"])


@dataclass(slots=True)
class LegTrafficAssessment:
    status: str
    delay_minutes: int
    reroute: bool


_traffic_cache: dict[tuple, tuple[float, LegTrafficAssessment]] = {}


def _traffic_cache_key(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    osrm_expected_minutes: int,
    reroute_threshold_minutes: int,
) -> tuple:
    return (
        round(origin_lat, 4),
        round(origin_lon, 4),
        round(dest_lat, 4),
        round(dest_lon, 4),
        osrm_expected_minutes,
        reroute_threshold_minutes,
    )


async def assess_leg_traffic(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    osrm_expected_minutes: int,
    reroute_threshold_minutes: int = 30,
) -> LegTrafficAssessment:
    mapbox_token = os.getenv("MAPBOX_ACCESS_TOKEN")
    gmaps_api_key = os.getenv("GMAPS_API_KEY")
    if not mapbox_token and not gmaps_api_key:
        return LegTrafficAssessment(status="OK", delay_minutes=0, reroute=False)

    ttl = max(0.0, settings.traffic_cache_ttl_seconds)
    key = _traffic_cache_key(
        origin_lat,
        origin_lon,
        dest_lat,
        dest_lon,
        osrm_expected_minutes,
        reroute_threshold_minutes,
    )
    now = time.time()
    cached = _traffic_cache.get(key)
    if cached is not None and now < cached[0]:
        return cached[1]

    live_duration_minutes: int
    if mapbox_token:
        coordinates = f"{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
        url = f"https://api.mapbox.com/directions/v5/mapbox/driving-traffic/{coordinates}"
        params = {
            "access_token": mapbox_token,
            "annotations": "duration",
            "overview": "full",
            "geometries": "geojson",
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=2.5)
                response.raise_for_status()
                data = response.json()
            except httpx.HTTPError as exc:
                raise HTTPException(status_code=503, detail=f"Mapbox API error: {exc}") from exc

        if not data.get("routes"):
            raise HTTPException(status_code=400, detail="Mapbox could not find a viable route.")

        live_duration_seconds = data["routes"][0]["legs"][0]["duration"]
        live_duration_minutes = round(live_duration_seconds / 60)
    else:
        url = "https://maps.googleapis.com/maps/api/directions/json"
        params = {
            "origin": f"{origin_lat},{origin_lon}",
            "destination": f"{dest_lat},{dest_lon}",
            "departure_time": "now",
            "key": gmaps_api_key,
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=2.5)
            data = response.json()

        if not data.get("routes"):
            raise HTTPException(status_code=400, detail="Google Maps could not find a viable route.")

        leg = data["routes"][0]["legs"][0]
        live_duration_seconds = leg.get("duration_in_traffic", leg["duration"])["value"]
        live_duration_minutes = live_duration_seconds // 60

    delay_minutes = max(0, live_duration_minutes - osrm_expected_minutes)
    reroute = delay_minutes >= reroute_threshold_minutes
    result = LegTrafficAssessment(
        status="HEAVY_TRAFFIC" if reroute else "OK",
        delay_minutes=delay_minutes,
        reroute=reroute,
    )
    if ttl > 0:
        _traffic_cache[key] = (now + ttl, result)
    return result


@router.get("/check-leg")
async def check_leg_traffic(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    osrm_expected_minutes: int,
):
    assessment = await assess_leg_traffic(
        origin_lat=origin_lat,
        origin_lon=origin_lon,
        dest_lat=dest_lat,
        dest_lon=dest_lon,
        osrm_expected_minutes=osrm_expected_minutes,
        reroute_threshold_minutes=30,
    )
    if assessment.reroute:
        return {
            "status": assessment.status,
            "delay_minutes": assessment.delay_minutes,
            "reroute": True,
            "message": "Heavy traffic detected. Consider rerouting for a faster itinerary.",
        }

    return {
        "status": assessment.status,
        "delay_minutes": assessment.delay_minutes,
        "reroute": False,
    }
