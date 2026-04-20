# Integration Testing README

This guide describes how to validate the integrated branch:
`integration/all-branches-2026-04-16`.

It focuses on:
- DEV2 infra setup (OSRM + compose)
- DEV3 parser gateway (structured output + fallback)
- DEV4 routing solver behavior
- DEV5 state store / reroute cooldown
- DEV6 live traffic route API
- DEV7 mobile geofence + reroute flow

## 1) Prerequisites

- Python 3.10+ (tested with Python 3.13)
- Node.js 18+
- Docker Desktop (for OSRM and optional Redis)
- Git

Optional but recommended:
- Gemini/OpenAI key for real provider parser evaluation

## 2) Setup

### 2.1 Backend dependencies

From repo root:

```powershell
python -m pip install -r backend/requirements.txt
```

### 2.2 Mobile dependencies

```powershell
cd mobile
npm install
cd ..
```

### 2.3 Environment file

Create `.env` from `.env.example` and fill keys if needed:

```powershell
copy .env.example .env
```

Required only for real LLM provider checks:
- `LLM_PROVIDER=gemini` + `GEMINI_API_KEY=...`
or
- `LLM_PROVIDER=openai` + `OPENAI_API_KEY=...`

## 3) Run automated tests

### 3.1 Full backend suite

```powershell
python -m pytest backend/tests/ -q
```

Expected:
- all tests pass (current baseline on this branch: `79 passed`)

### 3.2 Parser robust suite only

```powershell
python -m pytest backend/tests/test_parser.py backend/tests/test_parser_robust_cases.py -q
```

This validates:
- strict structured parsing
- fallback path on provider failure
- weather extraction (`avoid_outdoor_in_rain`)
- stop count extraction (`max_stops`)

### 3.3 Traffic route API tests

```powershell
python -m pytest backend/tests/test_traffic.py -q
```

## 4) Manual API testing

Start backend:

```powershell
python -m uvicorn backend.app.main:app --reload --port 8000
```

### 4.1 Health check

```powershell
curl http://127.0.0.1:8000/health
```

### 4.2 Create plan

```powershell
curl -X POST http://127.0.0.1:8000/plan ^
  -H "Content-Type: application/json" ^
  -d "{\"prompt\":\"Plan a Hue day trip, budget 1500000, start 08:00\",\"device_token\":\"dev-token-1\"}"
```

Verify response includes:
- `constraints`
- `itinerary`
- `diagnostics`

### 4.3 Reroute cooldown

Call reroute twice quickly with the same `trip_id`.  
Expected second call: HTTP `429`.

### 4.4 Traffic endpoint

```powershell
curl "http://127.0.0.1:8000/traffic/check-leg?origin_lat=16.4637&origin_lon=107.5909&dest_lat=16.45&dest_lon=107.57&osrm_expected_minutes=15"
```

Expected:
- JSON with `status`, `delay_minutes`, `reroute`

## 5) Real provider parser evaluation

If API key is configured:

```powershell
python -m backend.scripts.run_real_provider_parser_eval --count 25
```

Expected output now includes:
- `budget_max`
- `soft_tags`
- `hard_start`
- `avoid_outdoor_in_rain`
- `max_stops`
- `time_windows`

If key is missing, script exits with a clear runtime error.

## 6) Mobile sanity test (DEV7)

```powershell
cd mobile
npm run start
```

Checklist:
- create a plan from UI
- geofence sensor card updates status
- trigger reroute by "I'm delayed" and "It's raining"
- timeline + map card render without crash

## 7) Troubleshooting

- `ModuleNotFoundError` (Python): reinstall backend requirements.
- OSRM timeout: ensure OSRM is running or rely on geometric fallback path.
- Provider eval blocked: set `OPENAI_API_KEY` or `GEMINI_API_KEY`.
- Mobile build issues: run `npm install` again and clear Metro cache.

