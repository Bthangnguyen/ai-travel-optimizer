from __future__ import annotations

import json
import os
from typing import Optional

from .config import Settings
from .models import PlanResponse

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


class DatabaseUnavailableException(Exception):
    pass


class RerouteCooldownException(Exception):
    pass


class TripStateStore:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._redis = self._build_redis_client(settings)

    def _build_redis_client(self, settings: Settings):
        if not REDIS_AVAILABLE:
            return None
        
        # Redis Connection Pool Pattern cho Production, không ping sớm để hỗ trợ load balancing & auto-reconnect
        redis_url = os.getenv("REDIS_URL", settings.redis_url) or "redis://redis:6379/0"
        pool = redis.ConnectionPool.from_url(redis_url, decode_responses=True)
        return redis.Redis(connection_pool=pool)

    def save_trip_state(self, trip: PlanResponse) -> None:
        if self._redis is None:
            raise DatabaseUnavailableException("Redis service không được cấp phép tại máy chủ.")
            
        try:
            self._redis.set(f"trip:{trip.trip_id}", trip.model_dump_json(), ex=60 * 60 * 12)
        except redis.exceptions.ConnectionError as e:
            raise DatabaseUnavailableException("Sập kết nối tới Redis State Store.") from e

    def get_trip(self, trip_id: str) -> PlanResponse | None:
        if self._redis is None:
            raise DatabaseUnavailableException("Redis service không được cấp phép tại máy chủ.")
            
        try:
            raw = self._redis.get(f"trip:{trip_id}")
            if raw is None:
                return None
            return PlanResponse.model_validate(json.loads(raw))
        except redis.exceptions.ConnectionError as e:
            raise DatabaseUnavailableException("Sập kết nối tới Redis State Store.") from e

    def check_reroute_cooldown(self, trip_id: str) -> None:
        if self._redis is None:
            raise DatabaseUnavailableException("Redis service không được cấp phép tại máy chủ.")
            
        try:
            # SET NX EX sẽ giới hạn nếu đã có yêu cầu Re-route trong vòng 180s (3 Phút)
            success = self._redis.set(
                f"reroute:{trip_id}", "locked", nx=True, ex=180
            )
            if success is not True:
                raise RerouteCooldownException("User đang spam Reroute.")
        except redis.exceptions.ConnectionError as e:
            raise DatabaseUnavailableException("Sập kết nối tới Redis State Store.") from e
