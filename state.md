# Project State

_Last updated: 2026-04-21_

## Current status of the project

The repository is a full-stack AI travel optimizer for Hue with a mobile app (`mobile/`) and FastAPI backend (`backend/`), plus deployment and local Docker orchestration. Core building blocks are present: route solving, OSRM travel matrix integration, POI filtering/repository access, trip state management, authentication modes, and request/response contracts.

The main project risk is integration drift in the backend entry flow: `backend/app/main.py` calls parser/planner methods that are not currently implemented in `backend/app/parser.py` and `backend/app/planner.py`. This likely blocks a clean end-to-end startup path for `/plan` and `/reroute` unless code is reconciled.

## What has been completed

- Backend service skeleton and API routes are in place (`backend/app/main.py`, traffic route module, auth endpoints).
- Route generation logic is implemented with OR-Tools and fallback heuristics (`backend/app/routing_solver.py`).
- OSRM matrix client exists with fallback behavior (`backend/app/osrm_client.py`).
- Constraint parsing exists in a synchronous parser flow (`backend/app/parser.py`).
- Planner flow exists for parsed constraints (`backend/app/planner.py`).
- POI source support includes JSON and PostGIS repository paths (`backend/app/repository.py`).
- State storage includes memory and Redis-backed behavior (`backend/app/state_store.py`).
- Mobile app has map + prompt + plan/reroute integration (`mobile/App.tsx`, `mobile/src/api.ts`).
- Deployment artifacts and local compose setup are present (`docker-compose.yml`, `deploy/`).
- Multiple backend tests exist under `backend/tests/` (API/auth/routing/state/traffic/repository coverage).

## What has not been completed (or is currently inconsistent)

- Backend integration mismatch:
  - `main.py` expects async/structured parser + planner methods (`parse_structured_async`, `plan_with_structured_input`).
  - Current parser/planner modules expose different interfaces (`parse`, `plan`) and do not match those calls.
- Benchmark/eval scripts reference the same async parser path and may not run until interfaces are aligned.
- Documentation and test instructions are inconsistent (`unittest` vs `pytest`), and some referenced test files are missing.
- JSON contract schema appears narrower than backend request model fields (potential contract drift).
- No CI workflow found in-repo (`.github/workflows` absent), so quality checks are not enforced automatically.
- Local compose depends on external OSRM data artifacts; setup is not fully self-contained until graph data is prepared.

## Next directions (suggestions)

### P0 (do first)

1. Reconcile parser/planner APIs with `main.py`:
   - Either implement the async structured methods expected by `main.py`,
   - Or refactor `main.py` and related scripts to the currently implemented sync flow.
2. Run a strict backend smoke check after reconciliation:
   - Import app successfully,
   - Call `/health`, `/plan`, `/reroute` with representative payloads,
   - Confirm fallback behavior when optional services are disabled.
3. Update/add tests for the chosen parser/planner path and cover regression around plan/reroute entry points.

### P1 (stabilize release quality)

4. Unify test strategy and docs (`pytest` or `unittest`), then make docs match reality.
5. Align `contracts/*.schema.json` with actual request/response models.
6. Add CI to run tests and basic linting on every push/PR.

### P2 (improve operability)

7. Improve OSRM bootstrap docs/scripts so local bring-up is reproducible.
8. Validate and document production-safe defaults (FCM/geofence flags, auth mode, CORS, rate limits).
9. Add a short “known gaps and roadmap” section to the README to reduce onboarding confusion.

## Recommended immediate execution plan

1. Fix backend interface mismatch (`main.py` <-> parser/planner).
2. Run backend tests and smoke scripts.
3. Resolve docs/test drift and add CI.
4. Re-validate mobile -> backend plan/reroute flow against the reconciled API.
