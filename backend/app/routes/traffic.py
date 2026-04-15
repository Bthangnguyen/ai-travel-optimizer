from fastapi import APIRouter, HTTPException
import httpx
import os

router = APIRouter(prefix="/traffic", tags=["Live Traffic"])

@router.get("/check-leg")
async def check_leg_traffic(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    osrm_expected_minutes: int,
):
    gmaps_api_key = os.getenv("GMAPS_API_KEY")
    if not gmaps_api_key:
        return {"status": "OK", "delay_minutes": 0, "reroute": False}

    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": f"{origin_lat},{origin_lon}",
        "destination": f"{dest_lat},{dest_lon}",
        "departure_time": "now",
        "key": gmaps_api_key,
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()

    if not data.get("routes"):
        raise HTTPException(status_code=400, detail="Cannot find route on Live Map")

    leg = data["routes"][0]["legs"][0]
    live_duration_seconds = leg.get("duration_in_traffic", leg["duration"])["value"]
    live_duration_minutes = live_duration_seconds // 60

    delay_minutes = live_duration_minutes - osrm_expected_minutes
    if delay_minutes >= 30:
        return {
            "status": "HEAVY_TRAFFIC",
            "delay_minutes": delay_minutes,
            "reroute": True,
            "message": "Heavy traffic detected. Consider rerouting for a faster itinerary.",
        }

    return {
        "status": "OK",
        "delay_minutes": delay_minutes,
        "reroute": False,
    }
