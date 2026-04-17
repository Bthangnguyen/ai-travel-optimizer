from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable
from urllib import error, parse, request

from .models import Coordinates
from .utils import travel_minutes_from_coords


@dataclass(slots=True)
class MatrixResult:
    durations: list[list[int]]
    source: str


class OSRMClient:
    def __init__(self, base_url: str) -> None:
        self._base_url = base_url.rstrip("/")

    def get_duration_matrix(self, points: Iterable[Coordinates]) -> MatrixResult:
        materialized = list(points)
        if len(materialized) <= 1:
            return MatrixResult(durations=[[0]], source="single-point")

        try:
            return MatrixResult(
                durations=self._fetch_osrm_matrix(materialized),
                source="osrm",
            )
        except (error.URLError, TimeoutError, ValueError, KeyError, json.JSONDecodeError):
            return MatrixResult(
                durations=self._build_geometric_matrix(materialized),
                source="geometric-fallback",
            )

    def _fetch_osrm_matrix(self, points: list[Coordinates]) -> list[list[int]]:
        coordinates = ";".join(f"{point.lon},{point.lat}" for point in points)
        encoded = parse.quote(coordinates, safe=";,")
        url = f"{self._base_url}/table/v1/driving/{encoded}?annotations=duration"

        with request.urlopen(url, timeout=1.5) as response:
            payload = json.loads(response.read().decode("utf-8"))

        durations = payload["durations"]
        return [
            [0 if seconds is None else max(0, round(seconds / 60)) for seconds in row]
            for row in durations
        ]

    def _build_geometric_matrix(self, points: list[Coordinates]) -> list[list[int]]:
        matrix: list[list[int]] = []
        for origin in points:
            row: list[int] = []
            for destination in points:
                row.append(
                    travel_minutes_from_coords(
                        origin.lat,
                        origin.lon,
                        destination.lat,
                        destination.lon,
                    )
                )
            matrix.append(row)
        return matrix

