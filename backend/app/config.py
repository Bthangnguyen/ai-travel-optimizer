from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(slots=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "AI Dynamic Itinerary Optimizer")
    default_city: str = os.getenv("DEFAULT_CITY", "hue")
    default_origin_name: str = os.getenv("DEFAULT_ORIGIN_NAME", "Hue City Center")
    default_origin_lat: float = float(os.getenv("DEFAULT_ORIGIN_LAT", "16.4637"))
    default_origin_lon: float = float(os.getenv("DEFAULT_ORIGIN_LON", "107.5909"))
    osrm_base_url: str = os.getenv("OSRM_BASE_URL", "http://localhost:5000")
    data_path: Path = Path(
        os.getenv(
            "DATA_PATH",
            str(Path(__file__).resolve().parents[2] / "data" / "sample_pois.json"),
        )
    )
    redis_url: str = os.getenv("REDIS_URL", "")
    reroute_cooldown_seconds: int = int(os.getenv("REROUTE_COOLDOWN_SECONDS", "30"))
    reroute_delay_threshold_minutes: int = int(os.getenv("REROUTE_DELAY_THRESHOLD_MINUTES", "15"))
    firebase_service_account_path: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "")


settings = Settings()

