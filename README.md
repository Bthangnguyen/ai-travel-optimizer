# AI-Driven Dynamic Itinerary Optimizer

Monorepo MVP for a local-tour itinerary planner focused on Hue. The repository follows the four-layer architecture from the planning documents:

1. Mobile app triggers planning and reroute events.
2. FastAPI parses free-form prompts into structured constraints.
3. A filtering layer narrows POIs before optimization.
4. A routing engine uses OSRM travel times and an OR-Tools-compatible solver interface with safe fallbacks.

## Workspace Layout

- `backend/`: FastAPI service, parser, routing core, tests.
- `contracts/`: shared JSON contracts for `/plan` and `/reroute`.
- `data/`: sample Hue POIs used for local development.
- `mobile/`: Expo / React Native skeleton for timeline, map card, and reroute triggers.
- `scripts/`: helper scripts for seeding PostGIS-compatible SQL.
- `docker-compose.yml`: local infra for API, PostGIS, Redis, and OSRM.

## Local Run

### Backend

```powershell
python -m pip install --target .deps -r backend\requirements.txt
.\scripts\run-backend.ps1
```

Open [http://localhost:8000/docs](http://localhost:8000/docs).

### Tests

```powershell
$env:PYTHONPATH="."
python -m unittest discover -s backend/tests -t .
```

### Mobile

```powershell
cd mobile
npm install
cd ..
.\scripts\run-mobile-web.ps1
```

### Full Local Dev

```powershell
.\scripts\run-local.ps1
```

This starts the backend in a separate PowerShell process, then opens Expo web against `http://127.0.0.1:8000`.

Set `EXPO_PUBLIC_API_URL` to your backend, for example:

- Android emulator: `http://10.0.2.2:8000`
- iOS simulator / web: `http://localhost:8000`

### Docker Infra

```powershell
docker compose up --build
```

The API is wired to use local fallbacks when OSRM or Redis is unavailable, so development can start before the full infra is live.

### One-command Smoke Test

```powershell
.\scripts\smoke-test-local.ps1
```

This exports the Expo web app, starts the backend with OR-Tools if available in `.deps`, serves the static web bundle, hits `/health` and `/plan`, then prints a small verification report.

## Notes

- The backend prefers OR-Tools when installed. If `ortools` is absent, it automatically falls back to deterministic greedy routing instead of failing the request.
- Redis is optional for local development. In-memory trip state is used when the `redis` package or server is not available.
- OSRM data files are not committed. Place a preprocessed Vietnam graph under `osrm-data/` or keep using the geometric matrix fallback during app development.
