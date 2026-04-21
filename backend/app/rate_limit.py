"""Optional in-process sliding-window rate limits (per client IP).

Enable with ``RATE_LIMIT_ENABLED=true``. For multi-instance production,
also configure limits at the reverse proxy (e.g. Nginx).
"""
from __future__ import annotations

import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from .config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):  # type: ignore[no-untyped-def]
        super().__init__(app)
        self._hits: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):  # type: ignore[no-untyped-def]
        if not settings.rate_limit_enabled:
            return await call_next(request)
        path = request.url.path
        limit = self._limit_for_path(path)
        if limit is None:
            return await call_next(request)
        now = time.monotonic()
        window_sec = 60.0
        client = request.client.host if request.client else "unknown"
        key = f"{client}:{path}"
        bucket = self._hits[key]
        cutoff = now - window_sec
        while bucket and bucket[0] < cutoff:
            bucket.pop(0)
        if len(bucket) >= limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Try again later."},
            )
        bucket.append(now)
        return await call_next(request)

    def _limit_for_path(self, path: str) -> int | None:
        if path == "/auth/token":
            return settings.rate_limit_auth_token_per_minute
        if path == "/plan":
            return settings.rate_limit_plan_per_minute
        if path == "/reroute":
            return settings.rate_limit_reroute_per_minute
        if path.startswith("/traffic"):
            return settings.rate_limit_traffic_per_minute
        return None
