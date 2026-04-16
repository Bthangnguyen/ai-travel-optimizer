from fastapi import APIRouter, HTTPException
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

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
    Sniper API: Gọi Mapbox để kiểm tra độ trễ giao thông thực tế.
    """
    mapbox_token = os.getenv("MAPBOX_ACCESS_TOKEN")
    if not mapbox_token:
        # Nếu chưa cấu hình Mapbox, ngầm định là đường thông thoáng
        return {"status": "OK", "delay_minutes": 0, "reroute": False}

    # Đảo trục tọa độ theo đúng chuẩn Mapbox (Lon,Lat)
    coordinates = f"{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
    
    url = f"https://api.mapbox.com/directions/v5/mapbox/driving-traffic/{coordinates}"
    params = {
        "access_token": mapbox_token,
        "annotations": "duration", # Chỉ lấy duration để tăng tốc độ phản hồi
        "overview": "full",
        "geometries": "geojson"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=2.5)
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=503, detail=f"Lỗi kết nối Mapbox API: {str(e)}")

    if not data.get("routes"):
        raise HTTPException(status_code=400, detail="Mapbox không tìm thấy tuyến đường khả thi.")

    # Lấy thời gian thực tế
    live_duration_seconds = data["routes"][0]["legs"][0]["duration"]
    live_duration_minutes = round(live_duration_seconds / 60)
    
    # Tính độ trễ so với OSRM
    delay_minutes = live_duration_minutes - osrm_expected_minutes

    # Quyết định có kích hoạt tính toán lại VRP hay không (Trễ >= 30p)
    if delay_minutes >= 30:
        return {
            "status": "HEAVY_TRAFFIC",
            "delay_minutes": delay_minutes,
            "reroute": True,
            "message": f"Mapbox phát hiện trễ {delay_minutes} phút. Yêu cầu tính toán lại lộ trình."
        }

    return {
        "status": "OK",
        "delay_minutes": delay_minutes,
        "reroute": False
    }