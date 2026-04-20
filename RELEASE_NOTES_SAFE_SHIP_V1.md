# AI Itinerary Optimizer - Safe Ship v1

## Release scope

This release prioritizes stability for production rollout.

Included:

- Plan creation flow (`/plan`)
- Manual reroute flow (`/reroute`) from in-app controls
- Map and timeline rendering
- Structured parser with safe fallback handling

Temporarily disabled (feature-flagged):

- Geofence auto-reroute background flow
- Push-triggered auto-reroute apply flow

## Why these features are disabled

Background automation and push-based reroute require additional field validation on real devices before broad rollout.
Disabling them reduces crash and runtime risk while keeping core trip functionality available.

## Mobile release flags

Current safe flags in mobile env:

- `EXPO_PUBLIC_ENABLE_GEOFENCE=false`
- `EXPO_PUBLIC_ENABLE_FCM=false`

Reference: `mobile/RELEASE_FLAGS.md`

## Verification summary

- Mobile type check: `npx tsc --noEmit` passed.
- Backend automated tests: `python -m pytest backend/tests` passed (`84 passed`).

## Rollout recommendation

- Start with internal users / limited beta.
- Observe crash-free sessions and API error rates for 24-48 hours.
- If stable, increase rollout gradually.

