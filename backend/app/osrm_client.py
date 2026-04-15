from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable
from urllib import error, parse, request

from .models import Coordinates

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
        except (error.URLError, TimeoutError) as e:
            # Lỗi mạng hoặc Timeout: Báo cáo thẳng tay để UI biết Server đang có vấn đề
            raise RuntimeError(f"LỖI HẠ TẦNG: Không thể kết nối đến máy chủ OSRM. Chi tiết: {e}")
        except (ValueError, KeyError, json.JSONDecodeError) as e:
            # Lỗi parse dữ liệu từ OSRM
            raise ValueError(f"LỖI DỮ LIỆU: Máy chủ OSRM trả về dữ liệu không hợp lệ. Chi tiết: {e}")

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