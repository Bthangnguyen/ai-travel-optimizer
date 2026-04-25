from __future__ import annotations

import json
import logging

import redis
import redis.exceptions

from .config import Settings
from .models import PlanResponse

logger = logging.getLogger(__name__)

_TRIP_TTL_SECONDS: int = 60 * 60 * 12       # 12 giờ – hạn sống dữ liệu chuyến đi
_REROUTE_COOLDOWN_SECONDS: int = 180         # 3 phút – chống spam reroute


class DatabaseUnavailableException(Exception):
    """Raised when Redis is unreachable; maps to HTTP 503."""


class RerouteCooldownException(Exception):
    """Raised when the reroute cooldown key is still active; maps to HTTP 429."""


class TripStateStore:
    """Stateless Redis-backed store for trip data.

    All state lives exclusively in Redis. No in-memory dictionaries are used so
    that the backend can be safely scaled horizontally.
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._redis: redis.Redis = self._build_redis_client(settings)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_redis_client(self, settings: Settings) -> redis.Redis:
        """Build a Redis client using a connection pool for performance."""
        pool = redis.ConnectionPool.from_url(
            settings.redis_url,
            decode_responses=True,
            max_connections=20,
        )
        return redis.Redis(connection_pool=pool)

    def _handle_connection_error(self, exc: Exception) -> None:
        """Log the error and raise DatabaseUnavailableException (→ HTTP 503)."""
        logger.error("Redis connection failed: %s", exc, exc_info=True)
        raise DatabaseUnavailableException(
            "Redis State Store không khả dụng. Vui lòng thử lại sau."
        ) from exc

    # ------------------------------------------------------------------
    # Health check
    # ------------------------------------------------------------------

    def ping(self) -> bool:
        """Return True if Redis is reachable."""
        try:
            return bool(self._redis.ping())
        except redis.exceptions.ConnectionError as exc:
            logger.warning("Redis ping failed: %s", exc)
            return False

    # ------------------------------------------------------------------
    # Trip persistence
    # ------------------------------------------------------------------

    def save_trip_state(self, trip: PlanResponse, device_token: str | None = None) -> None:
        """Persist the full trip payload and (optionally) bind it to a device token.

        Raises:
            DatabaseUnavailableException: Redis is unreachable.
        """
        try:
            self._redis.set(
                f"trip:{trip.trip_id}",
                trip.model_dump_json(),
                ex=_TRIP_TTL_SECONDS,
            )
            if device_token is not None:
                self._redis.set(
                    f"trip_token:{trip.trip_id}",
                    device_token,
                    ex=_TRIP_TTL_SECONDS,
                )
        except redis.exceptions.ConnectionError as exc:
            self._handle_connection_error(exc)

    # Alias kept for backward compatibility with any internal callers.
    def save_trip(self, trip: PlanResponse, device_token: str | None = None) -> None:
        self.save_trip_state(trip, device_token=device_token)

    def get_trip(self, trip_id: str) -> PlanResponse | None:
        """Retrieve a previously saved trip by ID.

        Returns:
            PlanResponse if found, None if the key has expired or never existed.

        Raises:
            DatabaseUnavailableException: Redis is unreachable.
        """
        try:
            raw: str | None = self._redis.get(f"trip:{trip_id}")
            if raw is None:
                return None
            return PlanResponse.model_validate(json.loads(raw))
        except redis.exceptions.ConnectionError as exc:
            self._handle_connection_error(exc)

    # ------------------------------------------------------------------
    # Device-token binding
    # ------------------------------------------------------------------

    def get_device_token(self, trip_id: str) -> str | None:
        """Return the device token bound to this trip_id, or None.

        Raises:
            DatabaseUnavailableException: Redis is unreachable.
        """
        try:
            return self._redis.get(f"trip_token:{trip_id}")
        except redis.exceptions.ConnectionError as exc:
            self._handle_connection_error(exc)

    def verify_trip_token(self, trip_id: str, device_token: str) -> bool:
        """Return True if *device_token* matches the stored token for *trip_id*."""
        stored: str | None = self.get_device_token(trip_id)
        return stored == device_token

    # ------------------------------------------------------------------
    # Reroute cooldown (anti-spam)
    # ------------------------------------------------------------------

    def check_reroute_cooldown(self, trip_id: str) -> None:
        """Enforce a 180-second cooldown between reroute calls for the same trip.

        Uses Redis SET NX + EX to atomically acquire a lock. If the lock already
        exists the request is rejected to protect backend resources.

        Raises:
            RerouteCooldownException: Cooldown is still active → HTTP 429.
            DatabaseUnavailableException: Redis is unreachable → HTTP 503.
        """
        key: str = f"reroute_lock:{trip_id}"
        try:
            acquired: bool | None = self._redis.set(
                key,
                "locked",
                nx=True,                      # Set only if Not eXists
                ex=_REROUTE_COOLDOWN_SECONDS,  # Auto-expire after 180 s
            )
        except redis.exceptions.ConnectionError as exc:
            self._handle_connection_error(exc)

        if acquired is not True:
            raise RerouteCooldownException(
                "Quá nhiều yêu cầu (Rate Limit). "
                "Vui lòng đợi 3 phút trước khi gọi lại Reroute."
            )
