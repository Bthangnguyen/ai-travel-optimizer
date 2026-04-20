# Public Beta Runbook

This runbook operationalizes the four phases in
`.cursor/plans/public_beta_rollout_74337f63.plan.md`. Every item ends with a
concrete action a release owner can execute. The regression gates at the
bottom have already been verified (`92/92` backend, `73/73` parser
robustness) at the time this runbook was written.

## 0. Artifacts produced by this rollout

| Area | Artifact | Location |
| --- | --- | --- |
| Deploy | Prod compose stack + Nginx + Certbot | `deploy/docker-compose.prod.yml`, `deploy/nginx/app.conf` |
| Deploy | Step-by-step server guide | `deploy/README.md` |
| Deploy | Production env template | `.env.production.example` |
| Deploy | Public endpoint smoke test (stdlib only) | `deploy/smoke_test.py` |
| Backend | Auth module (HS256 JWT + hybrid fallback) | `backend/app/auth.py` |
| Backend | `POST /auth/token` endpoint | `backend/app/main.py` |
| Backend | Test coverage for JWT / hybrid / bearer | `backend/tests/test_auth.py` |
| Mobile | Pluggable device-token provider + bearer flow | `mobile/src/api.ts` |
| Mobile | EAS env split (dev / preview / production) | `mobile/eas.json` |
| Mobile | Safe .env template (no secret defaults in public) | `mobile/.env.example` |
| Release | Extended Go/No-Go checklist (sections F and G) | `GO_NO_GO_CHECKLIST_SAFE_SHIP.md` |

## 1. Phase 1 - Public backend with HTTPS

Before inviting external testers, the backend must be reachable on a public
HTTPS domain.

1. Provision a VPS and point DNS (for example `api.<domain>`) to it.
2. On the server:

   ```bash
   git clone <repo> /opt/ai-travel-optimizer
   cd /opt/ai-travel-optimizer
   cp .env.production.example .env.production
   # Replace all change-me-* values. Pick a long JWT_SIGNING_SECRET.
   vim .env.production
   mkdir -p secrets
   cp /path/to/firebase-service-account.json secrets/
   ```

3. Issue the TLS certificate once with Certbot standalone (see
   `deploy/README.md`), then bring up the stack:

   ```bash
   docker compose -f deploy/docker-compose.prod.yml --env-file .env.production up -d --build
   ```

4. Smoke test from your laptop (Windows PowerShell or any stdlib-only Python):

   ```bash
   python deploy/smoke_test.py \
     --base-url https://api.<domain> \
     --auth-mode bearer_jwt \
     --device-token beta-smoke-1
   ```

   Expected output ends with `PASS health`, `PASS plan`, `PASS reroute`,
   `PASS traffic`.

## 2. Phase 2 - Replace static key auth with JWT

Already implemented. To enable in production:

1. Set `AUTH_MODE=bearer_jwt` and a strong `JWT_SIGNING_SECRET` in
   `.env.production` on the server.
2. Restart: `docker compose -f deploy/docker-compose.prod.yml up -d`.
3. Confirm that a request without `Authorization` returns 401:

   ```bash
   curl -i -X POST https://api.<domain>/plan -d '{}'
   # HTTP/1.1 401 Unauthorized
   ```

4. Confirm that `POST /auth/token` issues a JWT and that JWT is accepted on
   `/plan` (the smoke test already does this).

Rollback: set `AUTH_MODE=hybrid` to temporarily accept X-API-Key again while
investigating.

## 3. Phase 3 - Split mobile envs

`mobile/eas.json` now carries per-profile env blocks:

- `development` and `development-device`: LAN API, X-API-Key, all feature
  flags on.
- `preview`: `https://api-staging.<domain>`, `AUTH_MODE=bearer_jwt`. Use for
  closed beta Android APKs.
- `production`: `https://api.<domain>`, `AUTH_MODE=bearer_jwt`. Use for Play
  Store app bundle and TestFlight submissions.

Before building the external beta APK:

1. Replace the placeholder domains (`api.example.com`,
   `api-staging.example.com`) in `mobile/eas.json` with your real domains.
2. Build:

   ```bash
   cd mobile
   eas build --profile preview --platform android
   ```

3. Distribute the APK via EAS internal distribution link or upload to Google
   Play Closed Testing.

## 4. Phase 4 - Run closed beta and collect results

Use `GO_NO_GO_CHECKLIST_SAFE_SHIP.md`, specifically the new sections:

- **F. Public beta extension** - environment and stack preconditions.
- **F1-F4** - targeted UX cases: auth lifecycle, flaky network, FCM in three
  app states, geofence with screen off.
- **G. Regression gates** - run both backend suites before declaring Go.

Suggested test matrix (fill in during the beta and attach to the sign-off):

| Tester | Device / OS | F1 | F2 | F3 | F4 | Notes |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

Minimum bar for Go:

- At least 3 testers outside the core team.
- Every F* row has all sub-cases marked Pass or an accepted workaround.
- No crash or data-loss bug reported during the beta window.

## 5. Already-verified regression gates

Run these before any build for the beta:

```bash
python -m pytest backend/tests/ -q
python -m pytest backend/tests/test_parser.py backend/tests/test_parser_robust_cases.py -q
cd mobile && npx tsc --noEmit
```

At the time of writing:

- Backend suite: 92 passed.
- Parser robustness suite: 73 passed.
- Mobile `tsc --noEmit`: clean.

## 6. What remains out-of-scope here

- Actual cloud deployment and domain provisioning (user action).
- Issuing real Let's Encrypt certificates (user action - instructions in
  `deploy/README.md`).
- Submitting to Google Play Closed Testing / TestFlight (user action).
- Onboarding real external testers and compiling their feedback (user action).

These four items are deliberately left manual because they require access to
credentials, billing, and testers outside this repository.
