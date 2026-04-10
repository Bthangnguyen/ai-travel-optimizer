from __future__ import annotations

import json
import time

from .config import Settings
from .models import PlanResponse

try:
    import redis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


class TripStateStore:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._memory_trips: dict[str, PlanResponse] = {}
        self._memory_reroute_at: dict[str, float] = {}
        self._redis = self._build_redis_client(settings)

    def _build_redis_client(self, settings: Settings):
        if not settings.redis_url or not REDIS_AVAILABLE:
            return None
        try:
            client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
            client.ping()
            return client
        except Exception:
            return None

    def save_trip(self, trip: PlanResponse) -> None:
        self._memory_trips[trip.trip_id] = trip
        if self._redis is not None:
            self._redis.set(f"trip:{trip.trip_id}", trip.model_dump_json(), ex=60 * 60 * 12)

    def get_trip(self, trip_id: str) -> PlanResponse | None:
        if trip_id in self._memory_trips:
            return self._memory_trips[trip_id]
        if self._redis is None:
            return None
        raw = self._redis.get(f"trip:{trip_id}")
        if raw is None:
            return None
        trip = PlanResponse.model_validate(json.loads(raw))
        self._memory_trips[trip_id] = trip
        return trip

    def allow_reroute(self, trip_id: str) -> tuple[bool, int]:
        now = time.time()
        if self._redis is not None:
            key = f"reroute:{trip_id}"
            previous = self._redis.get(key)
            if previous is not None:
                remaining = max(0, self._settings.reroute_cooldown_seconds - int(now - float(previous)))
                return False, remaining
            self._redis.set(key, str(now), ex=self._settings.reroute_cooldown_seconds)
            return True, 0

        previous = self._memory_reroute_at.get(trip_id)
        if previous is not None:
            remaining = max(0, self._settings.reroute_cooldown_seconds - int(now - previous))
            if remaining > 0:
                return False, remaining

        self._memory_reroute_at[trip_id] = now
        return True, 0

