from __future__ import annotations

import argparse
import statistics
import time

from backend.app.config import settings
from backend.app.models import Coordinates
from backend.app.osrm_client import OSRMClient


def percentile(values: list[float], ratio: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    idx = int(round((len(ordered) - 1) * ratio))
    return ordered[idx]


def sample_points(size: int) -> list[Coordinates]:
    base_lat = 16.4637
    base_lon = 107.5909
    return [
        Coordinates(lat=base_lat + (idx * 0.003), lon=base_lon + (idx * 0.0025))
        for idx in range(size)
    ]


def run(iterations: int, matrix_size: int) -> None:
    client = OSRMClient(settings.osrm_base_url)
    points = sample_points(max(2, matrix_size))
    durations: list[float] = []
    source_counts: dict[str, int] = {}

    for _ in range(max(1, iterations)):
        started = time.perf_counter()
        result = client.get_duration_matrix(points)
        elapsed_ms = (time.perf_counter() - started) * 1000.0
        durations.append(elapsed_ms)
        source_counts[result.source] = source_counts.get(result.source, 0) + 1

    print("OSRM_MATRIX_BENCHMARK")
    print(f"iterations={len(durations)}")
    print(f"matrix_size={len(points)}")
    print(f"avg_ms={statistics.fmean(durations):.2f}")
    print(f"p50_ms={percentile(durations, 0.50):.2f}")
    print(f"p95_ms={percentile(durations, 0.95):.2f}")
    print(f"p99_ms={percentile(durations, 0.99):.2f}")
    print(f"max_ms={max(durations):.2f}")
    print(f"sources={source_counts}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark OSRM matrix lookup latency.")
    parser.add_argument("--iterations", type=int, default=30)
    parser.add_argument("--matrix-size", type=int, default=12)
    args = parser.parse_args()
    run(args.iterations, args.matrix_size)


if __name__ == "__main__":
    main()
