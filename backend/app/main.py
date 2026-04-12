from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .models import PlanRequest, PlanResponse, RerouteRequest
from .planner import TripPlanner
from .state_store import (
    TripStateStore,
    DatabaseUnavailableException,
    RerouteCooldownException
)
from .utils import minutes_to_hhmm, parse_hhmm


planner = TripPlanner(settings)
state_store = TripStateStore(settings)

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Dynamic itinerary optimizer with structured parsing and reroute fallbacks.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/plan", response_model=PlanResponse)
def plan_trip(payload: PlanRequest) -> PlanResponse:
    try:
        trip = planner.plan(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        state_store.save_trip_state(trip)
    except DatabaseUnavailableException as exc:
        raise HTTPException(status_code=503, detail="Service Unavailable. Không thể lưu trạng chuyến đi.") from exc

    return trip


@app.post("/reroute", response_model=PlanResponse)
def reroute_trip(payload: RerouteRequest) -> PlanResponse:
    try:
        state_store.check_reroute_cooldown(payload.trip_id)
    except RerouteCooldownException as e:
        raise HTTPException(
            status_code=429,
            detail="Quá nhiều yêu cầu (Rate Limit). Vui lòng đợi 3 phút trước khi gọi lại Reroute."
        ) from e
    except DatabaseUnavailableException as e:
        raise HTTPException(status_code=503, detail="Service Unavailable. Không thể kiểm tra Cooldown.") from e

    try:
        previous_trip = state_store.get_trip(payload.trip_id)
    except DatabaseUnavailableException as e:
        raise HTTPException(status_code=503, detail="Service Unavailable. Không thể đọc lịch trình cũ từ bộ nhớ.") from e
        
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
    source_origin = payload.origin or (
        previous_trip.origin
        if previous_trip is not None
        else PlanRequest(prompt=source_prompt).origin
    )

    base_time = parse_hhmm(
        payload.current_time or (previous_trip.constraints.hard_start if previous_trip else "08:00")
    )
    if payload.trigger.kind == "delayed":
        base_time += payload.trigger.minutes_late

    exclude_ids = set(payload.visited_poi_ids)

    request_payload = PlanRequest(
        prompt=source_prompt,
        city=source_city,
        weather=source_weather,
        current_time=minutes_to_hhmm(base_time),
        origin=source_origin,
        exclude_poi_ids=sorted(exclude_ids),
    )
    extra_notes = [f"Reroute trigger: {payload.trigger.kind}"]
    if payload.trigger.kind == "delayed" and payload.trigger.minutes_late:
        extra_notes.append(f"Delay injected: {payload.trigger.minutes_late} minutes.")

    try:
        trip = planner.plan(request_payload, trip_id=payload.trip_id, extra_notes=extra_notes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        state_store.save_trip_state(trip)
    except DatabaseUnavailableException as e:
        raise HTTPException(status_code=503, detail="Service Unavailable. Không thể lưu lịch trình điều hướng mới.") from e

    return trip

