from __future__ import annotations

from dataclasses import dataclass, field

from .models import ConstraintBundle, POI
from .utils import parse_hhmm

try:
    from ortools.constraint_solver import pywrapcp, routing_enums_pb2

    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False


@dataclass(slots=True)
class SolverStop:
    poi: POI
    arrival_minutes: int
    departure_minutes: int
    travel_minutes: int


@dataclass(slots=True)
class SolverDiscard:
    poi: POI
    reason: str


@dataclass(slots=True)
class SolverResult:
    engine_used: str
    fallback_level: int
    scheduled: list[SolverStop] = field(default_factory=list)
    discarded: list[SolverDiscard] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)


class RoutingSolver:
    def solve(
        self,
        pois: list[POI],
        matrix: list[list[int]],
        constraints: ConstraintBundle,
        weather: str,
        start_time: int,
    ) -> SolverResult:
        if not pois:
            return SolverResult(
                engine_used="no-op",
                fallback_level=2,
                notes=["No candidate POIs survived filtering."],
            )

        if ORTOOLS_AVAILABLE:
            try:
                return self._solve_with_ortools(pois, matrix, constraints, weather, start_time)
            except Exception as exc:
                result = self._solve_greedy(pois, matrix, constraints, weather, start_time)
                result.notes.append(f"OR-Tools failed, switched to greedy fallback: {exc}")
                result.fallback_level = 1
                return result

        result = self._solve_greedy(pois, matrix, constraints, weather, start_time)
        result.notes.append("OR-Tools is not installed; greedy fallback was used.")
        return result

    def _solve_with_ortools(
        self,
        pois: list[POI],
        matrix: list[list[int]],
        constraints: ConstraintBundle,
        weather: str,
        start_time: int,
    ) -> SolverResult:
        manager = pywrapcp.RoutingIndexManager(len(matrix), 1, 0)
        routing = pywrapcp.RoutingModel(manager)
        day_end = parse_hhmm(constraints.hard_end)
        max_stops = min(constraints.max_stops, len(pois))

        def transit_callback(from_index: int, to_index: int) -> int:
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            service_time = 0
            if from_node > 0:
                service_time = pois[from_node - 1].visit_minutes
            return matrix[from_node][to_node] + service_time

        transit_callback_index = routing.RegisterTransitCallback(transit_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        routing.AddDimension(
            transit_callback_index,
            12 * 60,
            day_end,
            False,
            "Time",
        )
        time_dimension = routing.GetDimensionOrDie("Time")

        for node in range(1, len(matrix)):
            poi = pois[node - 1]
            index = manager.NodeToIndex(node)
            open_at = parse_hhmm(poi.opens_at)
            close_at = parse_hhmm(poi.closes_at)
            time_dimension.CumulVar(index).SetRange(open_at, close_at)
            penalty = 5000 + poi.priority * 200
            if weather == "rain" and poi.outdoor:
                penalty = 1
            routing.AddDisjunction([index], penalty)

        start_index = routing.Start(0)
        time_dimension.CumulVar(start_index).SetRange(start_time, start_time)

        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.FromMilliseconds(2000)

        solution = routing.SolveWithParameters(search_parameters)
        if solution is None:
            result = self._solve_greedy(pois, matrix, constraints, weather, start_time)
            result.notes.append("OR-Tools returned no solution; greedy fallback was used.")
            result.fallback_level = 1
            return result

        scheduled: list[SolverStop] = []
        kept_nodes: set[int] = set()
        index = routing.Start(0)
        previous_node = 0
        stop_count = 0
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            if node != 0 and stop_count < max_stops:
                poi = pois[node - 1]
                arrival = solution.Value(time_dimension.CumulVar(index))
                travel = matrix[previous_node][node]
                departure = max(arrival, parse_hhmm(poi.opens_at)) + poi.visit_minutes
                scheduled.append(
                    SolverStop(
                        poi=poi,
                        arrival_minutes=arrival,
                        departure_minutes=departure,
                        travel_minutes=travel,
                    )
                )
                kept_nodes.add(node - 1)
                stop_count += 1
            previous_node = node
            index = solution.Value(routing.NextVar(index))

        discarded = [
            SolverDiscard(poi=poi, reason="Dropped by disjunction or time pressure.")
            for idx, poi in enumerate(pois)
            if idx not in kept_nodes
        ]

        return SolverResult(
            engine_used="ortools",
            fallback_level=0,
            scheduled=scheduled,
            discarded=discarded,
        )

    def _solve_greedy(
        self,
        pois: list[POI],
        matrix: list[list[int]],
        constraints: ConstraintBundle,
        weather: str,
        start_time: int,
    ) -> SolverResult:
        current_node = 0
        current_time = start_time
        budget_left = constraints.budget_max
        remaining = list(range(len(pois)))
        scheduled: list[SolverStop] = []
        discarded: list[SolverDiscard] = []
        day_end = parse_hhmm(constraints.hard_end)

        while remaining and len(scheduled) < constraints.max_stops:
            best_idx: int | None = None
            best_score: tuple[int, int, int] | None = None
            best_stop: SolverStop | None = None

            for idx in remaining:
                poi = pois[idx]
                if poi.ticket_price > budget_left:
                    continue

                travel_minutes = matrix[current_node][idx + 1]
                open_at = parse_hhmm(poi.opens_at)
                close_at = parse_hhmm(poi.closes_at)
                arrival = current_time + travel_minutes
                service_start = max(arrival, open_at)
                departure = service_start + poi.visit_minutes

                if departure > close_at or departure > day_end:
                    continue

                wait_minutes = service_start - arrival
                weather_penalty = 999 if weather == "rain" and poi.outdoor else 0
                score = (
                    travel_minutes + wait_minutes + weather_penalty,
                    poi.ticket_price,
                    -poi.priority,
                )

                if best_score is None or score < best_score:
                    best_idx = idx
                    best_score = score
                    best_stop = SolverStop(
                        poi=poi,
                        arrival_minutes=service_start,
                        departure_minutes=departure,
                        travel_minutes=travel_minutes,
                    )

            if best_idx is None or best_stop is None:
                break

            scheduled.append(best_stop)
            budget_left -= best_stop.poi.ticket_price
            current_time = best_stop.departure_minutes
            current_node = best_idx + 1
            remaining.remove(best_idx)

        for idx in remaining:
            poi = pois[idx]
            discarded.append(
                SolverDiscard(
                    poi=poi,
                    reason="Removed by greedy fallback due to budget or time windows.",
                )
            )

        if scheduled:
            return SolverResult(
                engine_used="greedy",
                fallback_level=1,
                scheduled=scheduled,
                discarded=discarded,
            )

        sequential = self._solve_sequential(pois, matrix, constraints, start_time)
        sequential.notes.append("Greedy solver could not place any POI; sequential fallback used.")
        return sequential

    def _solve_sequential(
        self,
        pois: list[POI],
        matrix: list[list[int]],
        constraints: ConstraintBundle,
        start_time: int,
    ) -> SolverResult:
        ordered = sorted(
            enumerate(pois),
            key=lambda item: (parse_hhmm(item[1].opens_at), -item[1].priority),
        )
        current_node = 0
        current_time = start_time
        day_end = parse_hhmm(constraints.hard_end)
        scheduled: list[SolverStop] = []
        discarded: list[SolverDiscard] = []
        budget_left = constraints.budget_max

        for idx, poi in ordered:
            if len(scheduled) >= constraints.max_stops:
                discarded.append(SolverDiscard(poi=poi, reason="Sequential stop limit reached."))
                continue
            if poi.ticket_price > budget_left:
                discarded.append(SolverDiscard(poi=poi, reason="Sequential budget guard."))
                continue

            travel = matrix[current_node][idx + 1]
            arrival = max(current_time + travel, parse_hhmm(poi.opens_at))
            departure = arrival + poi.visit_minutes
            if departure > parse_hhmm(poi.closes_at) or departure > day_end:
                discarded.append(SolverDiscard(poi=poi, reason="Sequential time-window guard."))
                continue

            scheduled.append(
                SolverStop(
                    poi=poi,
                    arrival_minutes=arrival,
                    departure_minutes=departure,
                    travel_minutes=travel,
                )
            )
            budget_left -= poi.ticket_price
            current_time = departure
            current_node = idx + 1

        return SolverResult(
            engine_used="sequential",
            fallback_level=2,
            scheduled=scheduled,
            discarded=discarded,
        )

