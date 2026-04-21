# Stable Release Flags

Use these environment variables to control runtime automation features.

- `EXPO_PUBLIC_ENABLE_GEOFENCE=true`
  - Enables automatic geofence monitoring and background reroute trigger.
- `EXPO_PUBLIC_ENABLE_FCM=true`
  - Enables foreground push listener and automatic reroute apply from notifications.

To temporarily disable either feature for troubleshooting, set the value to `false`.

Core user flows remain available:

- Create plan (`/plan`)
- Manual reroute (`/reroute` from UI buttons)
- Timeline/map rendering and diagnostics
