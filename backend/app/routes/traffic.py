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
    mapbox_token = os.getenv("MAPBOX_ACCESS_TOKEN")
    gmaps_api_key = os.getenv("GMAPS_API_KEY")
    if not mapbox_token and not gmaps_api_key:
        return {"status": "OK", "delay_minutes": 0, "reroute": False}

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
