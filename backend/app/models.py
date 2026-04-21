from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

from .utils import parse_hhmm


class Coordinates(BaseModel):
    lat: float
    lon: float


class Origin(Coordinates):
    name: str = "Hue City Center"


class ConstraintBundle(BaseModel):
    budget_max: int = 1_500_000
    soft_tags: list[str] = Field(default_factory=list)
    hard_start: str = "08:00"
    hard_end: str = "21:00"
    max_stops: int = 6
    avoid_outdoor_in_rain: bool = True
    source: str = "heuristic-structured-parser"
    notes: list[str] = Field(default_factory=list)

    @field_validator("budget_max")
    @classmethod
    def validate_budget(cls, value: int) -> int:
        if value < 0:
            raise ValueError("Budget must be non-negative.")
        return value

    @field_validator("hard_start", "hard_end")
    @classmethod
    def validate_time(cls, value: str) -> str:
        parse_hhmm(value)
        return value

    @field_validator("max_stops")
    @classmethod
    def validate_stops(cls, value: int) -> int:
        if value < 1 or value > 10:
            raise ValueError("max_stops must be between 1 and 10.")
        return value


class ConstraintOverride(BaseModel):
    budget_max: int | None = None
    soft_tags: list[str] | None = None
    hard_start: str | None = None
    hard_end: str | None = None
    max_stops: int | None = None
    avoid_outdoor_in_rain: bool | None = None


class PlanRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=4000)
    city: str = "hue"
    weather: Literal["clear", "rain"] = "clear"
    current_time: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    device_token: str | None = None
    max_candidates: int = Field(default=18, ge=4, le=50)
    origin: Origin = Field(
        default_factory=lambda: Origin(name="Hue City Center", lat=16.4637, lon=107.5909)
    )
    exclude_poi_ids: list[str] = Field(default_factory=list)
    constraint_override: ConstraintOverride | None = None

    @field_validator("current_time")
    @classmethod
    def validate_current_time(cls, value: str | None) -> str | None:
        if value is not None:
            parse_hhmm(value)
        return value


class POI(BaseModel):
    poi_id: str
    city: str = "hue"
    name: str
    lat: float
    lon: float
    tags: list[str]
    visit_minutes: int
    ticket_price: int
    opens_at: str
    closes_at: str
    outdoor: bool = False
    priority: int = 5
    description: str = ""


class ItineraryStop(Coordinates):
    poi_id: str
    name: str
    arrival_time: str
    departure_time: str
    travel_minutes: int
    visit_minutes: int
    ticket_price: int
    outdoor: bool
    tags: list[str]


class DiscardedPOI(BaseModel):
    poi_id: str
    name: str
    reason: str


class PlanDiagnostics(BaseModel):
    parsed_tags: list[str] = Field(default_factory=list)
    candidate_count: int = 0
    matrix_source: str = "geometric-fallback"
    notes: list[str] = Field(default_factory=list)


class PlanResponse(BaseModel):
    trip_id: str
    prompt_snapshot: str
    city: str
    weather: Literal["clear", "rain"]
    engine_used: str
    fallback_level: int
    constraints: ConstraintBundle
    origin: Origin
    itinerary: list[ItineraryStop]
    discarded_pois: list[DiscardedPOI]
    diagnostics: PlanDiagnostics


class RerouteTrigger(BaseModel):
    kind: Literal["delayed", "rain", "geofence"]
    minutes_late: int = 0

    @field_validator("minutes_late")
    @classmethod
    def validate_minutes_late(cls, value: int) -> int:
        if value < 0:
            raise ValueError("minutes_late must be non-negative.")
        return value


class RerouteRequest(BaseModel):
    trip_id: str
    trigger: RerouteTrigger
    device_token: str = Field(min_length=1)
    prompt: str | None = None
    weather: Literal["clear", "rain"] | None = None
    current_time: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    current_location: Coordinates | None = None
    visited_poi_ids: list[str] = Field(default_factory=list)

    @field_validator("current_time")
    @classmethod
    def validate_current_time(cls, value: str | None) -> str | None:
        if value is not None:
            parse_hhmm(value)
        return value

