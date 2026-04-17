from __future__ import annotations

import json
import time
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
        self._memory_trips: dict[str, PlanResponse] = {}
        self._memory_device_tokens: dict[str, str] = {}
        self._memory_reroute_at: dict[str, float] = {}
        self._redis = self._build_redis_client(settings)

    def _build_redis_client(self, settings: Settings):
        if not settings.redis_url or not REDIS_AVAILABLE:
            return None
        try:
            pool = redis.ConnectionPool.from_url(settings.redis_url, decode_responses=True)
            return redis.Redis(connection_pool=pool)
        except Exception:
            return None

    def ping(self) -> bool:
        if self._redis is None:
            return True
        try:
            return self._redis.ping()
        except redis.exceptions.ConnectionError:
            return False

    def save_trip_state(self, trip: PlanResponse, device_token: str | None = None) -> None:
        self._memory_trips[trip.trip_id] = trip
        if device_token is not None:
            self._memory_device_tokens[trip.trip_id] = device_token

        if self._redis is None:
            return

        try:
            self._redis.set(f"trip:{trip.trip_id}", trip.model_dump_json(), ex=60 * 60 * 12)
            if device_token is not None:
                self._redis.set(f"trip_token:{trip.trip_id}", device_token, ex=60 * 60 * 12)
        except redis.exceptions.ConnectionError as e:
            raise DatabaseUnavailableException("Redis State Store unavailable.") from e

    def save_trip(self, trip: PlanResponse, device_token: str | None = None) -> None:
        self.save_trip_state(trip, device_token=device_token)

    def get_trip(self, trip_id: str) -> PlanResponse | None:
        if trip_id in self._memory_trips:
            return self._memory_trips[trip_id]
        if self._redis is None:
            return None
        try:
            raw = self._redis.get(f"trip:{trip_id}")
            if raw is None:
                return None
            trip = PlanResponse.model_validate(json.loads(raw))
            self._memory_trips[trip_id] = trip
            return trip
        except redis.exceptions.ConnectionError as e:
            raise DatabaseUnavailableException("Redis State Store unavailable.") from e

    def get_device_token(self, trip_id: str) -> Optional[str]:
        if trip_id in self._memory_device_tokens:
            return self._memory_device_tokens[trip_id]
        if self._redis is None:
            return None
        try:
            token = self._redis.get(f"trip_token:{trip_id}")
            if token is None:
                return None
            self._memory_device_tokens[trip_id] = token
            return token
        except redis.exceptions.ConnectionError as e:
            raise DatabaseUnavailableException("Redis State Store unavailable.") from e

    def verify_trip_token(self, trip_id: str, device_token: str) -> bool:
        stored = self.get_device_token(trip_id)
        return stored == device_token

    def check_reroute_cooldown(self, trip_id: str) -> None:
        now = time.time()
        if self._redis is not None:
            try:
                key = f"reroute:{trip_id}"
                # Lock once within cooldown window.
                locked = self._redis.set(
                    key,
                    "locked",
                    nx=True,
                    ex=self._settings.reroute_cooldown_seconds,
                )
                if locked is not True:
                    raise RerouteCooldownException("Quá nhiều yêu cầu (Rate Limit). Vui lòng thử lại sau.")
            except redis.exceptions.ConnectionError as e:
                raise DatabaseUnavailableException("Redis State Store unavailable.") from e
            return

        # Memory-based fallback
        key = f"reroute:{trip_id}"
        last_seen = self._memory_reroute_at.get(key)
        if last_seen is None:
            self._memory_reroute_at[key] = now
            return

        elapsed = now - last_seen
        if elapsed > self._settings.reroute_cooldown_seconds:
            self._memory_reroute_at[key] = now
            return

        # Any reroute call within cooldown window is rejected.
        if elapsed <= self._settings.reroute_cooldown_seconds:
            raise RerouteCooldownException("Quá nhiều yêu cầu (Rate Limit). Vui lòng thử lại sau.")

