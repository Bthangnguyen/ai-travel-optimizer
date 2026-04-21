# Go / No-Go Checklist (Safe Ship)

Use this checklist immediately before publishing.

## A. Build and install

- [ ] Latest iOS build completes successfully in EAS.
- [ ] App installs on target test device.
- [ ] App launches without red screen or startup crash.

## B. Core functional smoke test

- [ ] Backend health check in app reports connected.
- [ ] User can generate a plan successfully.
- [ ] User can run manual reroute ("I'm delayed" and "It's raining").
- [ ] Map and timeline render correctly after plan/reroute.

## C. Stability controls (must stay ON for safe ship)

- [ ] `EXPO_PUBLIC_ENABLE_GEOFENCE=false`
- [ ] `EXPO_PUBLIC_ENABLE_FCM=false`
- [ ] App UI indicates background automation is disabled for stable release.

## D. Backend quality gates

- [ ] `python -m pytest backend/tests` passes.
- [ ] No blocking backend runtime error in logs during smoke run.
- [ ] `/health` endpoint is stable and reachable from target network.

## E. Operational readiness

- [ ] Rollback plan exists (previous stable build ready).
- [ ] Monitoring is available (at minimum app crash visibility + backend error logs).
- [ ] Team knows this release excludes automated geofence/push reroute behavior.

## F. Public beta extension (required for external testers)

These items are specific to the public beta rollout defined in
`.cursor/plans/public_beta_rollout_74337f63.plan.md`. They replace the
"stability controls" in section C when shipping to testers outside the team.

- [ ] Backend reachable on public HTTPS domain (`https://api.<domain>/health` returns 200).
- [ ] `AUTH_MODE` on backend is `bearer_jwt` (no static X-API-Key accepted in prod).
- [ ] `EXPO_PUBLIC_AUTH_MODE=bearer_jwt` in the `preview`/`production` EAS profile.
- [ ] Mobile build used for beta is the EAS `preview` profile (points to staging API).
- [ ] `.env.production` on server has secrets filled (no placeholder `change-me-*`).
- [ ] Firebase service account JSON is mounted and FCM smoke send succeeds.
- [ ] `deploy/smoke_test.py` runs green against the public domain before inviting testers.

### F1. Auth token lifecycle

- [ ] First launch: app requests a bearer token from `/auth/token`, network tab shows 200.
- [ ] Forced token expiry: after changing `JWT_EXPIRES_IN_SECONDS=60` on staging and waiting, next API call re-fetches a new token transparently.
- [ ] Backend rejects stale token (tampered signature) with 401 and the app recovers by fetching a new one.

### F2. Flaky network

- [ ] Toggle airplane mode off mid-request: plan call either succeeds on retry or surfaces a user-visible error (no silent hang > 10s).
- [ ] With latency injected (e.g., chucker/charles 5s delay), timeline still renders; no duplicate plans stored.
- [ ] Health check on app shows "error" when backend blocked, auto-recovers when network returns.

### F3. Push reroute - foreground / background / quit

- [ ] Foreground: sending FCM reroute updates the current trip and shows in-app notice without navigation.
- [ ] Background (app minimized): reroute payload applied on next foreground; no crash on tap.
- [ ] Quit (force-swiped): `index.js` background handler updates AsyncStorage for the matching `trip_id`; reopen shows new plan.
- [ ] Reroute for a different `trip_id` is ignored (no overwrite of active trip).

### F4. Geofence with screen off

- [ ] With screen off and location permission "Always", exiting a scheduled POI triggers `rerouteGeofence` within 60s.
- [ ] Battery saver mode: geofence still reports exit within 2 minutes (document if longer).
- [ ] Geofence disabled (`EXPO_PUBLIC_ENABLE_GEOFENCE=false`) does not break manual reroute buttons.

## G. Regression gates for public beta

- [ ] `python -m pytest backend/tests/ -q` passes.
- [ ] `python -m pytest backend/tests/test_parser.py backend/tests/test_parser_robust_cases.py -q` passes.
- [ ] Parser robustness report updated in `DEV3_PROVIDER_EVAL.md` or equivalent.

## Decision

- Go: all items checked (including section F for public beta).
- No-Go: any unchecked item in sections A-D, or in F-G when shipping publicly.

## Sign-off

- Release owner:
- Date/time:
- Decision:
- Notes:

