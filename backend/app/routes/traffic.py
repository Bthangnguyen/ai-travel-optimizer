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
    Sniper API: Gọi Mapbox để lấy live duration_in_traffic.
    Đã đảo ngược hệ tọa độ thành Longitude,Latitude theo chuẩn Mapbox.
    """
    mapbox_token = os.getenv("MAPBOX_ACCESS_TOKEN")
    if not mapbox_token:
        return {"status": "OK", "delay_minutes": 0, "reroute": False}

    # [CRITICAL GAP FIXED] Mapbox dùng (Lon,Lat) phân cách bởi dấu chấm phẩy ;
    coordinates = f"{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
    
    # Sử dụng profile driving-traffic để tính cả kẹt xe
    url = f"https://api.mapbox.com/directions/v5/mapbox/driving-traffic/{coordinates}"
    params = {
        "access_token": mapbox_token,
        "geometries": "geojson" # Lấy text cho nhẹ
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()

    if data.get("code") != "Ok" or not data.get("routes"):
        raise HTTPException(status_code=400, detail="Cannot find route on Mapbox")

    # Mapbox trả về duration tính bằng giây, đã bao gồm kẹt xe (nếu dùng profile driving-traffic)
    live_duration_seconds = data["routes"][0]["duration"]
    live_duration_minutes = live_duration_seconds // 60
    
    delay_minutes = live_duration_minutes - osrm_expected_minutes

    if delay_minutes >= 30:
        return {
            "status": "HEAVY_TRAFFIC",
            "delay_minutes": delay_minutes,
            "reroute": True,
            "message": "Mapbox phát hiện kẹt xe. Yêu cầu tính toán lại lộ trình."
        }

    return {
        "status": "OK",
        "delay_minutes": delay_minutes,
        "reroute": False
    }