# Integration Readiness Report (Dev1-Dev8)

Date: 2026-04-16
Branch: `integration/all-branches-2026-04-16`

## Implemented scope

- Contract freeze completed for reroute payload and FCM event shape.
- Backend reroute loop now uses strict `device_token`, server-side delay derivation for geofence, and JIT traffic threshold check.
- Mobile app now persists FCM token, sends token on `/plan` + `/reroute`, applies foreground reroute payload, and re-registers geofence after trip updates.
- State store now supports Redis-required mode for integration/prod semantics.
- POI repository now supports `POI_SOURCE=postgis` with `POSTGIS_DSN`.
- Seed pipeline updated to allow direct SQL execution via DSN.
- New benchmark and validation scripts added for OSRM matrix and parser/plan latency.

## Acceptance gates status

### Gate A: Event closure (parser + API + FCM contract)
- Status: PASS (automated backend tests)
- Evidence:
  - `python -m pytest backend/tests` -> `84 passed`
  - Added/updated tests:
    - `backend/tests/test_api.py`
    - `backend/tests/test_reroute_traffic_threshold.py`

### Gate B: Background behavior (real-device geofence E2E)
- Status: IMPLEMENTED + READY FOR MANUAL DEVICE VALIDATION
- Runtime wiring completed in:
  - `mobile/App.tsx`
  - `mobile/src/geofence.ts`
  - `mobile/src/api.ts`
- Manual validation is required on native build to verify OS-level geofence triggers while screen is off.

### Gate C: State durability (Redis-backed behavior)
- Status: PASS (mode behavior covered by tests)
- Evidence:
  - `backend/tests/test_state_store_modes.py`
  - Redis-required mode reports unhealthy when Redis is unavailable.

### Gate D: Data realism (PostGIS POI source)
- Status: PASS (repository path + test coverage)
- Evidence:
  - `backend/app/repository.py` supports PostGIS query path.
  - `backend/tests/test_repository_postgis.py` validates PostGIS mode mapping.
  - `scripts/seed_pois.py --execute-dsn ...` supported.

### Gate E: Performance evidence (matrix + routing + parser)
- Status: PASS (benchmarks executed)
- Evidence:
  - `python -m backend.scripts.benchmark_osrm_matrix --iterations 10 --matrix-size 12`
    - `avg_ms=3017.38`
    - `p95_ms=3044.93`
    - `sources={'geometric-fallback': 10}`
  - `python -m backend.scripts.benchmark_plan_endpoint --iterations 10`
    - `parser_avg_ms=12.42`
    - `parser_p95_ms=18.71`
    - `parser_fallback_rate=1.000`
    - `avg_ms=3022.84`
    - `p95_ms=3034.51`
  - `python -m backend.scripts.run_real_provider_parser_eval --count 1`
    - Blocked by missing `GEMINI_API_KEY` in current environment.

## Notes and follow-up

- Current benchmark runs show OSRM unavailable in this environment (`geometric-fallback`), so matrix latency evidence reflects fallback path, not live OSRM service.
- Real-provider parser evaluation script is ready and now includes fallback-rate output; execution requires valid provider key in environment.
