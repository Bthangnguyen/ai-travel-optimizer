from __future__ import annotations

from backend.app.config import Settings
from backend.app.models import ConstraintBundle, Origin, PlanDiagnostics, PlanResponse
from backend.app.state_store import DatabaseUnavailableException, TripStateStore


def build_trip(trip_id: str = "trip_state_1") -> PlanResponse:
    return PlanResponse(
        trip_id=trip_id,
        prompt_snapshot="test",
        city="hue",
        weather="clear",
        engine_used="test",
        fallback_level=0,
        constraints=ConstraintBundle(),
        origin=Origin(name="Hue", lat=16.46, lon=107.59),
        itinerary=[],
        discarded_pois=[],
        diagnostics=PlanDiagnostics(),
    )


def test_redis_required_mode_fails_without_redis() -> None:
    settings = Settings(redis_url="", state_store_mode="redis_required", app_env="integration")
    store = TripStateStore(settings)
    assert not store.ping()

    try:
        store.save_trip_state(build_trip())
        raise AssertionError("Expected DatabaseUnavailableException")
    except DatabaseUnavailableException:
        pass


def test_hybrid_mode_allows_memory_fallback() -> None:
    settings = Settings(redis_url="", state_store_mode="hybrid", app_env="dev")
    store = TripStateStore(settings)
    trip = build_trip("trip_state_2")

    store.save_trip_state(trip, device_token="token_2")
    loaded = store.get_trip("trip_state_2")
    assert loaded is not None
    assert loaded.trip_id == "trip_state_2"
    assert store.verify_trip_token("trip_state_2", "token_2")
