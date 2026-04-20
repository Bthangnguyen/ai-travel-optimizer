from __future__ import annotations

import argparse
import statistics
import time
from dataclasses import dataclass

from fastapi.testclient import TestClient

from backend.app.main import app


@dataclass(slots=True)
class BenchmarkResult:
    iterations: int
    success_count: int
    avg_ms: float
    p50_ms: float
    p95_ms: float
    p99_ms: float
    min_ms: float
    max_ms: float


def percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    if len(values) == 1:
        return values[0]
    ordered = sorted(values)
    idx = (len(ordered) - 1) * pct
    lo = int(idx)
    hi = min(lo + 1, len(ordered) - 1)
    frac = idx - lo
    return ordered[lo] + (ordered[hi] - ordered[lo]) * frac


def run_benchmark(iterations: int) -> BenchmarkResult:
    timings_ms: list[float] = []
    success_count = 0

    payload = {
        "prompt": "Tôi muốn đi dạo nhẹ nhàng ở Huế, thích văn hóa và ăn uống, ngân sách 1.2tr.",
        "city": "hue",
        "weather": "clear",
    }

    with TestClient(app) as client:
        for _ in range(iterations):
            started = time.perf_counter()
            response = client.post("/plan", json=payload)
            elapsed_ms = (time.perf_counter() - started) * 1000.0
            timings_ms.append(elapsed_ms)
            if response.status_code == 200:
                success_count += 1

    return BenchmarkResult(
        iterations=iterations,
        success_count=success_count,
        avg_ms=statistics.fmean(timings_ms),
        p50_ms=percentile(timings_ms, 0.50),
        p95_ms=percentile(timings_ms, 0.95),
        p99_ms=percentile(timings_ms, 0.99),
        min_ms=min(timings_ms),
        max_ms=max(timings_ms),
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark /plan latency.")
    parser.add_argument("--iterations", type=int, default=20, help="Number of benchmark iterations.")
    args = parser.parse_args()

    result = run_benchmark(max(1, args.iterations))
    print("PLAN_ENDPOINT_BENCHMARK")
    print(f"iterations={result.iterations}")
    print(f"success_count={result.success_count}")
    print(f"avg_ms={result.avg_ms:.2f}")
    print(f"p50_ms={result.p50_ms:.2f}")
    print(f"p95_ms={result.p95_ms:.2f}")
    print(f"p99_ms={result.p99_ms:.2f}")
    print(f"min_ms={result.min_ms:.2f}")
    print(f"max_ms={result.max_ms:.2f}")


if __name__ == "__main__":
    main()
