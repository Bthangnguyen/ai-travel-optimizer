from __future__ import annotations

from uuid import uuid4

from .config import Settings
from .models import (
    ConstraintBundle,
    ConstraintOverride,
    DiscardedPOI,
    ItineraryStop,
    PlanDiagnostics,
    PlanRequest,
    PlanResponse,
    POI,
)
from .osrm_client import OSRMClient
from .parser import PromptConstraintParser
from .repository import POIRepository
from .routing_solver import RoutingSolver
from .utils import minutes_to_hhmm, parse_hhmm


class TripPlanner:
    def __init__(self, settings: Settings) -> None:
        self._parser = PromptConstraintParser()
        self._repository = POIRepository(settings)
        self._osrm = OSRMClient(settings.osrm_base_url)
        self._solver = RoutingSolver()

    def plan(
        self,
        payload: PlanRequest,
        trip_id: str | None = None,
        extra_notes: list[str] | None = None,
    ) -> PlanResponse:
        constraints = self._merge_constraints(
            self._parser.parse(payload.prompt),
            payload.constraint_override,
        )
        current_time = parse_hhmm(payload.current_time or constraints.hard_start)
        candidates, filtered = self._filter_candidates(payload, constraints)
        matrix_result = self._osrm.get_duration_matrix([payload.origin, *candidates])
        solver_result = self._solver.solve(
            pois=candidates,
            matrix=matrix_result.durations,
            constraints=constraints,
            weather=payload.weather,
            start_time=current_time,
        )

        itinerary = [
            ItineraryStop(
                poi_id=stop.poi.poi_id,
                name=stop.poi.name,
                lat=stop.poi.lat,
                lon=stop.poi.lon,
                arrival_time=minutes_to_hhmm(stop.arrival_minutes),
                departure_time=minutes_to_hhmm(stop.departure_minutes),
                travel_minutes=stop.travel_minutes,
                visit_minutes=stop.poi.visit_minutes,
                ticket_price=stop.poi.ticket_price,
                outdoor=stop.poi.outdoor,
                tags=stop.poi.tags,
            )
            for stop in solver_result.scheduled
        ]

        discarded = filtered + [
            DiscardedPOI(
                poi_id=item.poi.poi_id,
                name=item.poi.name,
                reason=item.reason,
            )
            for item in solver_result.discarded
        ]

        notes = list(constraints.notes)
        notes.extend(solver_result.notes)
        if extra_notes:
            notes.extend(extra_notes)

        diagnostics = PlanDiagnostics(
            parsed_tags=constraints.soft_tags,
            candidate_count=len(candidates),
            matrix_source=matrix_result.source,
            notes=notes,
        )

        return PlanResponse(
            trip_id=trip_id or uuid4().hex,
            prompt_snapshot=payload.prompt,
            city=payload.city,
            weather=payload.weather,
            engine_used=solver_result.engine_used,
            fallback_level=solver_result.fallback_level,
            constraints=constraints,
            origin=payload.origin,
            itinerary=itinerary,
            discarded_pois=discarded,
            diagnostics=diagnostics,
        )

    def _merge_constraints(
        self,
        base: ConstraintBundle,
        override: ConstraintOverride | None,
    ) -> ConstraintBundle:
        if override is None:
            return base

        updated = base.model_dump()
        for key, value in override.model_dump(exclude_none=True).items():
            updated[key] = value
        return ConstraintBundle.model_validate(updated)

    def _filter_candidates(
        self,
        payload: PlanRequest,
        constraints: ConstraintBundle,
    ) -> tuple[list[POI], list[DiscardedPOI]]:
        pois = self._repository.list_pois(
            payload.city,
            origin_lat=payload.origin.lat,
            origin_lon=payload.origin.lon,
        )
        filtered: list[DiscardedPOI] = []
        scored: list[tuple[int, POI]] = []
        requested_tags = set(constraints.soft_tags)

        for poi in pois:
            if poi.poi_id in payload.exclude_poi_ids:
                filtered.append(
                    DiscardedPOI(
                        poi_id=poi.poi_id,
                        name=poi.name,
                        reason="Already visited or explicitly excluded.",
                    )
                )
                continue

            if poi.ticket_price > constraints.budget_max:
                filtered.append(
                    DiscardedPOI(
                        poi_id=poi.poi_id,
                        name=poi.name,
                        reason="Single-stop cost exceeds the trip budget.",
                    )
                )
                continue

            if payload.weather == "rain" and constraints.avoid_outdoor_in_rain and poi.outdoor:
                filtered.append(
                    DiscardedPOI(
                        poi_id=poi.poi_id,
                        name=poi.name,
                        reason="Removed because rain mode avoids outdoor POIs.",
                    )
                )
                continue

            tag_score = len(requested_tags.intersection(poi.tags)) * 20
            indoor_bonus = 8 if not poi.outdoor else 0
            affordability_bonus = max(0, 500_000 - poi.ticket_price) // 20_000
            score = tag_score + poi.priority * 3 + indoor_bonus + affordability_bonus
            scored.append((score, poi))

        scored.sort(key=lambda item: item[0], reverse=True)
        candidates = [poi for _, poi in scored[: payload.max_candidates]]
        overflow = scored[payload.max_candidates :]
        filtered.extend(
            DiscardedPOI(
                poi_id=poi.poi_id,
                name=poi.name,
                reason="Trimmed during candidate reduction before optimization.",
            )
            for _, poi in overflow
        )
        return candidates, filtered

