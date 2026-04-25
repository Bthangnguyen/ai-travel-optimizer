from __future__ import annotations

import asyncio

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .auth import (
    AuthenticatedClient,
    assert_device_token_matches_auth,
    create_device_jwt,
    require_auth,
)
from .config import settings
from .models import Origin, PlanRequest, PlanResponse, RerouteRequest
from .firebase_client import FCMClient
from .planner import TripPlanner
from .routes.traffic import assess_leg_traffic, router as traffic_router
from .state_store import (
    DatabaseUnavailableException,
    RerouteCooldownException,
    TripStateStore,
)
from .rate_limit import RateLimitMiddleware
from .utils import minutes_to_hhmm, parse_hhmm


planner = TripPlanner(settings)
state_store = TripStateStore(settings)
fcm_client = FCMClient(settings)

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Dynamic itinerary optimizer with structured parsing and reroute fallbacks.",
)

app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(traffic_router, dependencies=[Depends(require_auth)])


class AuthTokenRequest(BaseModel):
    device_token: str = Field(..., min_length=1, max_length=256)


class AuthTokenResponse(BaseModel):
    token: str
    token_type: str = "Bearer"
    expires_in: int


@app.post("/auth/token", response_model=AuthTokenResponse)
def issue_auth_token(payload: AuthTokenRequest) -> AuthTokenResponse:
    """Issue a short-lived bearer token bound to a mobile device token.

    Available only when ``AUTH_MODE`` is ``bearer_jwt`` or ``hybrid``. This
    endpoint itself is intentionally un-gated so freshly installed clients can
    obtain their first token; the backend relies on the signing secret for
    integrity and on rate limiting / abuse detection on the edge (Nginx).
    """
    if settings.auth_mode not in {"bearer_jwt", "hybrid"}:
        raise HTTPException(status_code=400, detail="Bearer auth is disabled.")
    if not settings.jwt_signing_secret:
        raise HTTPException(status_code=503, detail="Server auth not configured.")
    try:
        token = create_device_jwt(payload.device_token)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return AuthTokenResponse(
        token=token,
        expires_in=settings.jwt_expires_in_seconds,
    )


@app.get("/health")
def health() -> dict[str, str]:
    if not state_store.ping():
        raise HTTPException(status_code=503, detail="Database is down")
    return {"status": "ok"}


@app.post("/plan", response_model=PlanResponse)
async def plan_route(
    payload: PlanRequest,
    auth: AuthenticatedClient = Depends(require_auth),
) -> PlanResponse:
    assert_device_token_matches_auth(auth, payload.device_token)
    try:
        trip = await asyncio.to_thread(planner.plan, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - endpoint guardrail.
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compute plan: {exc.__class__.__name__}",
        ) from exc

    try:
        state_store.save_trip_state(trip, device_token=payload.device_token)
    except DatabaseUnavailableException as exc:
        raise HTTPException(status_code=503, detail="Hệ thống lưu trạng thái đang bảo trì, vui lòng thử lại sau") from exc
    return trip


@app.post("/reroute", response_model=PlanResponse)
async def reroute_trip(
    payload: RerouteRequest,
    auth: AuthenticatedClient = Depends(require_auth),
) -> PlanResponse:
    assert_device_token_matches_auth(auth, payload.device_token)
    if not state_store.verify_trip_token(payload.trip_id, payload.device_token):
        raise HTTPException(status_code=401, detail="Invalid device token for this trip_id.")

    try:
        state_store.check_reroute_cooldown(payload.trip_id)
    except RerouteCooldownException as exc:
        raise HTTPException(
            status_code=429,
            detail="Quá nhiều yêu cầu (Rate Limit). Vui lòng đợi 3 phút trước khi gọi lại Reroute.",
        ) from exc
    except DatabaseUnavailableException as exc:
        raise HTTPException(status_code=503, detail="Hệ thống lưu trạng thái đang bảo trì, vui lòng thử lại sau") from exc

    try:
        previous_trip = state_store.get_trip(payload.trip_id)
    except DatabaseUnavailableException as exc:
        raise HTTPException(status_code=503, detail="Hệ thống lưu trạng thái đang bảo trì, vui lòng thử lại sau") from exc

    if previous_trip is None and payload.prompt is None:
        raise HTTPException(
            status_code=404,
            detail="Unknown trip_id. Provide prompt again to compute a new route.",
        )

    source_prompt = payload.prompt or previous_trip.prompt_snapshot
    source_city = previous_trip.city if previous_trip is not None else settings.default_city
    source_weather = payload.weather or (
        "rain" if payload.trigger.kind == "rain" else (previous_trip.weather if previous_trip else "clear")
    )
    source_origin = (
        Origin(name="Live location", lat=payload.current_location.lat, lon=payload.current_location.lon)
        if payload.current_location is not None
        else None
    ) or (
        previous_trip.origin
        if previous_trip is not None
        else PlanRequest(prompt=source_prompt).origin
    )

    base_time = parse_hhmm(
        payload.current_time or (previous_trip.constraints.hard_start if previous_trip else "08:00")
    )
    delay_minutes = int(payload.trigger.minutes_late or 0)
    if payload.trigger.kind == "delayed":
        base_time += delay_minutes
    elif payload.trigger.kind == "geofence" and previous_trip is not None and payload.current_time:
        # Server-side delay source of truth for geofence triggers.
        expected_departure = previous_trip.constraints.hard_start
        if payload.visited_poi_ids:
            scheduled_stop = next(
                (stop for stop in previous_trip.itinerary if stop.poi_id == payload.visited_poi_ids[-1]),
                None,
            )
            if scheduled_stop is not None:
                expected_departure = scheduled_stop.departure_time
        derived_delay = max(0, parse_hhmm(payload.current_time) - parse_hhmm(expected_departure))
        delay_minutes = max(delay_minutes, derived_delay)
        base_time = max(base_time, parse_hhmm(expected_departure) + delay_minutes)

    exclude_ids = set(payload.visited_poi_ids)
    if (
        previous_trip is not None
        and previous_trip.itinerary
        and payload.trigger.kind in {"delayed", "geofence"}
    ):
        next_stop = previous_trip.itinerary[0]
        try:
            traffic_assessment = await assess_leg_traffic(
                origin_lat=source_origin.lat,
                origin_lon=source_origin.lon,
                dest_lat=next_stop.lat,
                dest_lon=next_stop.lon,
                osrm_expected_minutes=max(1, next_stop.travel_minutes),
                reroute_threshold_minutes=settings.reroute_delay_threshold_minutes,
            )
            delay_minutes = max(delay_minutes, traffic_assessment.delay_minutes)
            if not traffic_assessment.reroute and delay_minutes < settings.reroute_delay_threshold_minutes:
                unchanged_trip = previous_trip.model_copy(deep=True)
                unchanged_trip.diagnostics.notes.append(
                    f"Reroute skipped: live delay {traffic_assessment.delay_minutes}m below threshold "
                    f"{settings.reroute_delay_threshold_minutes}m."
                )
                return unchanged_trip
        except HTTPException:
            # Preserve reroute reliability if traffic provider is unavailable.
            pass

    request_payload = PlanRequest(
        prompt=source_prompt,
        city=source_city,
        weather=source_weather,
        current_time=minutes_to_hhmm(base_time),
        origin=source_origin,
        exclude_poi_ids=sorted(exclude_ids),
        device_token=payload.device_token,
    )
    extra_notes = [f"Reroute trigger: {payload.trigger.kind}"]
    if delay_minutes:
        extra_notes.append(f"Delay injected: {delay_minutes} minutes.")

    try:
        trip = await asyncio.to_thread(
            planner.plan,
            request_payload,
            payload.trip_id,
            extra_notes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        state_store.save_trip_state(trip, device_token=payload.device_token)
    except DatabaseUnavailableException as exc:
        raise HTTPException(status_code=503, detail="Hệ thống lưu trạng thái đang bảo trì, vui lòng thử lại sau") from exc

    if fcm_client.enabled and payload.device_token:
        try:
            fcm_client.send_reroute_update(payload.device_token, trip, delay_minutes)
        except Exception as exc:
            trip.diagnostics.notes.append(f"FCM delivery failed: {exc}")

    return trip

