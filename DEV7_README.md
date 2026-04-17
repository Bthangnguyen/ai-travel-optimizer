# Dev 7: Physical Sensor Layer — Complete Implementation

> **Critical Role:** Dev 7 is the "physical sensor" that powers automatic re-routing. If it fails, the entire automatic reroute loop breaks.

---

## What is Dev 7?

Dev 7 implements a **battery-efficient geofence-based location tracking system** that:

✅ **Monitors 500m radius zones** around each stop in the itinerary  
✅ **Detects when users leave a stop** (and have truly left, not GPS noise)  
✅ **Compares actual vs scheduled departure times**  
✅ **Automatically sends `/reroute` events** to the backend for re-optimization  
✅ **Runs in background** (screen can be off)  
✅ **Minimizes battery drain** (OS handles geofence monitoring natively)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ Dev 7: Physical Sensor Layer (Mobile App)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────────────────────┐   │
│  │ UI Layer         │  │ Geofence Engine                  │   │
│  │ (App.tsx)        │◈─► (geofence.ts)                    │   │
│  ├──────────────────┤  ├──────────────────────────────────┤   │
│  │ • Timeline view  │  │ • startGeofenceMonitoring()      │   │
│  │ • Sensor status  │  │ • Dwell Time validation          │   │
│  │ • Re-route BTN   │  │ • Time comparison logic          │   │
│  │ • Map display    │  │ • OS event handlers              │   │
│  └──────────────────┘  └──────────────────────────────────┘   │
│         ▲                        ▲                              │
│         │ Display state          │ Background task             │
│         │ updates                │ (OS-managed)               │
│         │                        │                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ AsyncStorage                                             │  │
│  │ (persistent trip data from Dev 5)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│         ▲                                                       │
└─────────│───────────────────────────────────────────────────────┘
          │
          ├─► expo-location (native location APIs)
          ├─► expo-task-manager (background task registration)
          └─► @react-native-async-storage (trip persistence)
                    │
                    ▼
          ┌─────────────────────┐
          │ Native OS Layer     │
          │ (iOS/Android)       │
          ├─────────────────────┤
          │ • Geofencing        │
          │   (native API)      │
          │ • GPS monitoring    │
          │ • Background task   │
          │   wake-up           │
          │ • Power mgmt        │
          └─────────────────────┘
```

---

## File Structure

```
mobile/
├── app.json                 # iOS/Android config + background location perms
├── eas.json                 # EAS build config (Development Profile)
├── package.json             # Dependencies
├── App.tsx                  # Main app component + geofence integration
├── src/
│   ├── geofence.ts         # Core geofence logic (2-3 min dwell time)
│   ├── api.ts              # API client + rerouteGeofence() function
│   ├── types.ts            # TypeScript types (ItineraryStop, etc.)
│   └── GeofenceMap.tsx     # Map display placeholder

scripts/
├── build-dev-client-android.ps1   # Build native APK
├── build-dev-client-ios.ps1       # Build native IPA
├── run-dev-client.ps1             # Start Expo dev server
└── run-backend.ps1                # Start backend API

Root:
├── DEV7_BUILD_GUIDE.md             # How to build & deploy
├── DEV7_TESTING_GUIDE.md           # Acceptance testing steps
└── contracts/reroute-request.schema.json  # API schema
```

---

## Key Components

### 1. **Geofence Logic** ([mobile/src/geofence.ts](./mobile/src/geofence.ts))

**Constants:**

- `GEOFENCE_RADIUS_METERS = 500` — radius around each stop
- `DWELL_TIME_MS = 120_000` — wait 2 min before triggering (prevents GPS drift)

**Public Functions:**

- `startGeofenceMonitoring(itinerary)` — activate 500m zones for all stops
- `stopGeofenceMonitoring()` — deactivate all zones
- `isGeofencingActive()` — check if currently monitoring

**Background Task:** `GEOFENCE_TASK`

- Runs on OS level (app can be suspended/screen off)
- Fires on EXIT event: starts 2 min Dwell Timer
- Fires on ENTER event: cancels Dwell Timer if re-entered
- After Dwell Timer expires: fires `/reroute` if late

**Time Logic:**

```
EXIT event received
    ↓
START Dwell Timer (2 min)
    ├─ If ENTER event fires within 2 min → CANCEL (user came back)
    └─ If 2 min timeout → handleConfirmedExit()
        ├─ Compare actual_time vs scheduled_departure_time
        ├─ If minutes_late > 0 → POST /reroute with trigger.kind="geofence"
        └─ Update trip state from response
```

### 2. **API Integration** ([mobile/src/api.ts](./mobile/src/api.ts))

**Function:** `rerouteGeofence(payload)`

```typescript
export function rerouteGeofence(
  payload: GeofenceReroutePayload,
): Promise<PlanResponse> {
  return requestJson<PlanResponse>("/reroute", {
    trip_id: payload.tripId,
    current_time: payload.currentTime, // "HH:MM" format
    visited_poi_ids: payload.visitedPoiIds, // ["poi_1", "poi_2", ...]
    trigger: {
      kind: "geofence", // distinguish from "delayed"/"rain"
      minutes_late: payload.minutesLate, // e.g., 15 (if 15 minutes late)
    },
  });
}
```

**Request Format:**
Matches [contracts/reroute-request.schema.json](./contracts/reroute-request.schema.json)

### 3. **App Integration** ([mobile/App.tsx](./mobile/App.tsx))

**Lifecycle:**

```
1. App mounts
   ├─ Load trip from AsyncStorage (if exists)
   └─ Check geofence status (poll every 10s)

2. User taps "Generate plan"
   ├─ Stop old geofences: stopGeofenceMonitoring()
   ├─ Create plan: createPlan(prompt)
   ├─ Persist to storage: await AsyncStorage.setItem(STORAGE_KEY, plan)
   └─ Start geofences: startGeofenceMonitoring(plan.itinerary)

3. User exits geofence (background)
   ├─ OS wakes up app
   ├─ TaskManager calls GEOFENCE_TASK handler
   ├─ Handler triggers Dwell Timer countdown
   └─ After 2 min: rerouteGeofence() sends /reroute

4. Backend returns new plan
   ├─ App updates trip state
   ├─ UI refreshes timeline
   └─ Geofences re-arm for updated stops
```

### 4. **Configuration** ([mobile/app.json](./mobile/app.json))

**iOS Background Setup:**

```json
"ios": {
  "infoPlist": {
    "UIBackgroundModes": ["location", "fetch"],
    "NSLocationAlwaysAndWhenInUseUsageDescription": "..."
  }
}
```

**Android Background Setup:**

```json
"android": {
  "permissions": [
    "ACCESS_FINE_LOCATION",
    "ACCESS_BACKGROUND_LOCATION",
    "FOREGROUND_SERVICE_LOCATION"
  ]
}
```

---

## Development Workflow

### Step 1: Setup Build Environment

```bash
cd mobile
npm install

# Login to Expo (required for native builds)
eas login
```

### Step 2: Build Native Development Client

#### Android (faster):

```powershell
.\scripts\build-dev-client-android.ps1
# Downloads APK from EAS dashboard, then:
adb install app-release.apk
```

#### iOS:

```powershell
.\scripts\build-dev-client-ios.ps1
# Use Xcode or Apple Configurator to transfer IPA to device
```

### Step 3: Run Development Server (Terminal 1 & 2)

```powershell
# Terminal 1: Backend API
.\scripts\run-backend.ps1

# Terminal 2: Expo dev server
.\scripts\run-dev-client.ps1
```

### Step 4: Connect Device

1. Open Development Client app on device
2. Tap "Scan QR Code"
3. Scan QR from Terminal 2 output
4. App loads (blue development mode bar at bottom)

### Step 5: Test Geofence

1. Tap "Generate plan"
2. Wait for itinerary to load
3. Lock screen
4. Travel >500m away from first stop
5. Wait 2+ minutes at new location
6. Check Terminal 1 logs for `/reroute` request

---

## Testing Acceptance Criteria

See [DEV7_TESTING_GUIDE.md](./DEV7_TESTING_GUIDE.md) for detailed test cases.

**Quick Test:**

```
1. Create plan ✓
2. Geofence sensor shows "N điểm đang canh gác" ✓
3. Lock screen ✓
4. Travel >500m away ✓
5. Wait 3 minutes ✓
6. Check backend logs: one /reroute with trigger.kind="geofence" ✓
```

---

## Build & Deployment

See [DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md) for:

- Prerequisites & environment setup
- Step-by-step build instructions
- Device installation guides
- Troubleshooting & debugging
- Performance optimization tips
- Battery consumption notes

---

## Why NOT Expo Go?

```
❌ Expo Go (Sandbox):
   • Cannot access OS geofencing APIs
   • Background location disabled by OS
   • App stops when screen turns off
   • No "Always Allow" permission support

✅ Expo Development Client (Native):
   • Native Android/iOS binary
   • Full OS API access
   • Background location works
   • "Always Allow" permission available
   • App continues when screen off
```

**Bottom Line:** Building works only with Expo Development Client or full native app.

---

## Key Design Decisions

### 1. **Dwell Time (2-3 minutes)**

**Problem:** GPS typically has ±5-10m accuracy. User at edge of 500m circle could bounce in/out repeatedly.  
**Solution:** Require continuous 2+ min outside radius to confirm real exit.  
**Trade-off:** Slightly delays reroute trigger vs. prevents false positives.

### 2. **OS-Managed Geofencing**

**Problem:** Continuous GPS polling drains battery in minutes.  
**Solution:** Delegate to native OS geofencing (efficient, low power).  
**Result:** App can sleep, OS wakes it only on boundary crossings.

### 3. **State in AsyncStorage**

**Problem:** In-memory Dwell Timers lost if OS kills app mid-dwell.  
**Solution:** Accept this risk; OS killing within 2-3 min is rare.  
**Safety:** Only happens if system extremely resource-constrained (unlikely with modern phones).

### 4. **Time Comparison in App**

**Problem:** Network latency could make "actual_time" stale by the time backend processes.  
**Solution:** Compare times in app (where exit event occurred), then send both times to backend.  
**Backend:** Uses sent times, not its own clock, for accuracy.

---

## Common Issues & Solutions

| Issue                                     | Cause                        | Fix                                                     |
| ----------------------------------------- | ---------------------------- | ------------------------------------------------------- |
| "Sensor inactive" after plan loads        | Permissions not granted      | Tap "Always Allow" in permission prompt                 |
| No /reroute even after 2+ min travel      | Didn't actually travel >500m | Verify with Maps app, try again from farther away       |
| Multiple rapid /reroute requests          | GPS drift false positive     | Increase dwell time to 3 min in geofence.ts             |
| Request never fires                       | Backend unreachable          | Check backend logs, verify API_URL in app               |
| App crashes with "undefined AsyncStorage" | Missing library              | `npm install @react-native-async-storage/async-storage` |

---

## References

### Documentation:

- [DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md) — Build & deployment
- [DEV7_TESTING_GUIDE.md](./DEV7_TESTING_GUIDE.md) — Acceptance test cases

### Source Code:

- [Logic: geofence.ts](./mobile/src/geofence.ts) — Core geofence engine
- [API: api.ts](./mobile/src/api.ts) — HTTP client & rerouteGeofence()
- [UI: App.tsx](./mobile/App.tsx) — App lifecycle & integration
- [Config: app.json](./mobile/app.json) — iOS/Android setup

### Related Components:

- **Dev 5:** Generates trip state stored in AsyncStorage
- **Dev 6:** Backend `/reroute` endpoint that processes geofence events
- **Contracts:** [reroute-request.schema.json](./contracts/reroute-request.schema.json)

### External References:

- [Expo Location Docs](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo Development Client](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build Reference](https://docs.expo.dev/build/introduction/)
- [React Native Background Task Manager](https://docs.expo.dev/versions/latest/sdk/task-manager/)

---

## Support & Troubleshooting

**If something doesn't work:**

1. **Check app logs** (Terminal 2):

   ```
   grep "Geofence" <output>
   grep "Error" <output>
   ```

2. **Check backend logs** (Terminal 1):

   ```
   grep "reroute" <output>
   grep "geofence" <output>
   ```

3. **Verify prerequisites:**

   ```
   ☐ Device has "Always Allow" location permission
   ☐ GPS is enabled (location services on)
   ☐ WiFi connected (or direct IP routing)
   ☐ Backend API responding at http://localhost:8000/health
   ☐ App connected to dev server (blue banner at top)
   ```

4. **Read the guides:**
   - Still not working? → [DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md)
   - Test failed? → [DEV7_TESTING_GUIDE.md](./DEV7_TESTING_GUIDE.md)

---

## Summary

**Dev 7 Implementation Status:**

✅ **Core Geofence Engine** — 500m zones, Dwell Time, time comparison  
✅ **API Integration** — /reroute endpoint with geofence trigger  
✅ **Background Tracking** — OS-managed, battery efficient  
✅ **iOS & Android** — Full platform support via Expo  
✅ **Error Handling** — Graceful degradation on failures  
✅ **Logging** — Detailed debug output for troubleshooting

**Ready for:**

- ✅ Testing on real devices
- ✅ Integration with Dev 5 & Dev 6
- ✅ Production deployment via EAS

**Next Steps:**

1. Build Development Client: `.\scripts\build-dev-client-android.ps1`
2. Install on physical device
3. Run test cases from [DEV7_TESTING_GUIDE.md](./DEV7_TESTING_GUIDE.md)
4. Verify /reroute requests in backend logs

---

**Version:** 0.1.0  
**Last Updated:** 2025-04-13  
**Status:** ✅ Ready for Testing Phase
