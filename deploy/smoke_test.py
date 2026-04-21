"""Smoke test the public beta backend endpoints.

Usage:

    python deploy/smoke_test.py \
        --base-url https://api.example.com \
        --api-key "$INTERNAL_API_KEY"

Or with bearer JWT (when AUTH_MODE=bearer_jwt/hybrid):

    python deploy/smoke_test.py \
        --base-url https://api.example.com \
        --auth-mode bearer_jwt \
        --device-token beta-smoke-1

It does not require any third-party packages; uses only stdlib so it can run
from a freshly provisioned VPS without pip installs.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from typing import Any


def _request(
    url: str,
    *,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    body: dict[str, Any] | None = None,
    timeout: float = 10.0,
) -> tuple[int, dict[str, Any] | str]:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    if body is not None:
        req.add_header("Content-Type", "application/json")
    for key, value in (headers or {}).items():
        req.add_header(key, value)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            try:
                return resp.status, json.loads(raw)
            except json.JSONDecodeError:
                return resp.status, raw
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            return exc.code, json.loads(raw)
        except json.JSONDecodeError:
            return exc.code, raw


def _acquire_bearer_token(base_url: str, device_token: str) -> str:
    status, payload = _request(
        f"{base_url}/auth/token",
        method="POST",
        body={"device_token": device_token},
    )
    if status != 200 or not isinstance(payload, dict):
        raise SystemExit(f"Failed to acquire auth token: {status} {payload}")
    token = payload.get("token")
    if not isinstance(token, str):
        raise SystemExit(f"Auth token response missing token: {payload}")
    return token


def main() -> int:
    parser = argparse.ArgumentParser(description="Public beta smoke test")
    parser.add_argument("--base-url", required=True, help="https://api.example.com")
    parser.add_argument("--auth-mode", choices=["internal_key", "bearer_jwt"], default="internal_key")
    parser.add_argument("--api-key", default="")
    parser.add_argument("--api-key-header", default="X-API-Key")
    parser.add_argument("--device-token", default="beta-smoke-1")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    auth_headers: dict[str, str] = {}

    if args.auth_mode == "bearer_jwt":
        token = _acquire_bearer_token(base_url, args.device_token)
        auth_headers["Authorization"] = f"Bearer {token}"
    elif args.api_key:
        auth_headers[args.api_key_header] = args.api_key

    checks: list[tuple[str, bool]] = []

    status, payload = _request(f"{base_url}/health")
    ok = status == 200 and isinstance(payload, dict) and payload.get("status") == "ok"
    print(f"[health]   status={status} ok={ok} payload={payload}")
    checks.append(("health", ok))

    plan_body = {
        "prompt": "Plan a Hue trip from 08:00, budget 1500000, culture + food",
        "device_token": args.device_token,
    }
    status, payload = _request(
        f"{base_url}/plan",
        method="POST",
        headers=auth_headers,
        body=plan_body,
        timeout=30.0,
    )
    plan_ok = status == 200 and isinstance(payload, dict) and payload.get("trip_id")
    trip_id = payload.get("trip_id") if isinstance(payload, dict) else None
    print(f"[plan]     status={status} ok={plan_ok} trip_id={trip_id}")
    checks.append(("plan", bool(plan_ok)))

    if plan_ok:
        time.sleep(0.2)
        reroute_body = {
            "trip_id": trip_id,
            "device_token": args.device_token,
            "trigger": {"kind": "delayed", "minutes_late": 20},
        }
        status, payload = _request(
            f"{base_url}/reroute",
            method="POST",
            headers=auth_headers,
            body=reroute_body,
            timeout=30.0,
        )
        reroute_ok = status in (200, 202)
        print(f"[reroute]  status={status} ok={reroute_ok} payload_keys={list(payload) if isinstance(payload, dict) else type(payload).__name__}")
        checks.append(("reroute", reroute_ok))
    else:
        checks.append(("reroute", False))

    traffic_url = (
        f"{base_url}/traffic/check-leg?origin_lat=16.4637&origin_lon=107.5909"
        "&dest_lat=16.45&dest_lon=107.57&osrm_expected_minutes=15"
    )
    status, payload = _request(traffic_url, headers=auth_headers)
    traffic_ok = status == 200
    print(f"[traffic]  status={status} ok={traffic_ok} payload={payload if not isinstance(payload, dict) else {k: payload[k] for k in list(payload)[:3]}}")
    checks.append(("traffic", traffic_ok))

    print("\nSummary:")
    all_ok = True
    for name, ok in checks:
        mark = "PASS" if ok else "FAIL"
        print(f"  {mark} {name}")
        all_ok = all_ok and ok
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
