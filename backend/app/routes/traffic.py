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
    osrm_expected_minutes: int
):
    """
    Sniper API: Gọi Google Maps JIT để lấy duration_in_traffic.
    Nếu kẹt xe làm trễ hơn 30 phút so với OSRM, báo tín hiệu REROUTE.
    """
    gmaps_api_key = os.getenv("GMAPS_API_KEY")
    if not gmaps_api_key:
        # Nếu không có key, tin tưởng hoàn toàn vào OSRM (Dev/Fallback)
        return {"status": "OK", "delay_minutes": 0, "reroute": False}

    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": f"{origin_lat},{origin_lon}",
        "destination": f"{dest_lat},{dest_lon}",
        "departure_time": "now",
        "key": gmaps_api_key
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()

    if not data.get("routes"):
        raise HTTPException(status_code=400, detail="Cannot find route on Live Map")

    leg = data["routes"][0]["legs"][0]
    
    # Lấy thời gian thực tế (nếu có traffic data), không thì lấy thời gian tĩnh của Gmaps
    live_duration_seconds = leg.get("duration_in_traffic", leg["duration"])["value"]
    live_duration_minutes = live_duration_seconds // 60
    
    delay_minutes = live_duration_minutes - osrm_expected_minutes

    if delay_minutes >= 30:
        return {
            "status": "HEAVY_TRAFFIC",
            "delay_minutes": delay_minutes,
            "reroute": True,
            "message": "Kẹt xe nghiêm trọng phát hiện ở chặng tiếp theo. Yêu cầu tính toán lại lộ trình."
        }

    return {
        "status": "OK",
        "delay_minutes": delay_minutes,
        "reroute": False
    }