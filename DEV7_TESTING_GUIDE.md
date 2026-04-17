# Dev 7: Acceptance Testing & Validation Guide

## Acceptance Criteria (From Requirements)

Testing **MUST** be done on real physical devices, not emulators/simulators.

### Success Definition:

✅ **Exactly 1 POST /reroute request** appears in backend logs  
✅ Request contains `trigger.kind: "geofence"`  
✅ Request sent during background operation (screen off)  
✅ No spurious repeated requests (GPS drift handled)

---

## Test Environment Setup

### Hardware Required:

- ✅ Physical Android or iOS device
- ✅ Computer running backend API
- ✅ Both on same WiFi network (or direct IP routing)

### Software Readiness Checklist:

```
Device:
  ☐ Development Client APK/IPA installed
  ☐ Background location permission set to "Always Allow"
  ☐ WiFi enabled
  ☐ GPS enabled (location services on)
  ☐ Screen timeout set to max (won't auto-lock during test)

Computer:
  ☐ Backend API running (./scripts/run-backend.ps1)
  ☐ Expo dev server running (./scripts/run-dev-client.ps1)
  ☐ App connected to dev server (QR code scanned)
  ☐ Mobile app shows "Trip brief" card (plan loaded)
  ☐ Geofence sensor shows "Geofence sensor · X điểm đang canh gác"
```

---

## Test Case 1: Basic Geofence Activation

**Objective:** Verify geofence regions are created and OS is monitoring

### Setup:

1. Open Dev Client app
2. Enter prompt: `"Plan a Hue day trip from 08:00 with culture, budget 1200000, 5 stops"`
3. Tap "Generate plan"
4. Wait for plan to load

### Expected Output:

- Timeline appears with 5 stops
- Geofence sensor card shows: `"Geofence sensor · 5 điểm đang canh gác"` with green dot
- Status: `"OS đang theo dõi vị trí · Bán kính 500m · Màn hình có thể tắt"`

### Acceptance:

✅ Shows 5 geofence regions active  
✅ Green status indicator visible

**Record:**

```
Test Case 1 Result: PASS / FAIL (circle one)
Date/Time: ___________________
Device: (Android/iOS) ___________________
```

---

## Test Case 2: Background Tracking (Screen Off)

**Objective:** Verify app continues geofencing with screen locked

### Setup:

1. Complete Test Case 1 successfully
2. Open phone's Maps app
3. Note your current GPS coordinates
4. Return to Dev Client app

### Procedure:

1. Note the first stop location (from timeline)
2. Lock screen (power button)
3. Wait 5 seconds
4. **DO NOT TOUCH DEVICE** for next 10 seconds
5. Unlock screen
6. Check: Geofence sensor still says "5 điểm đang canh gác"?

### Expected Output:

- Geofence sensor still shows "5 điểm đang canh gác" (still active)
- Sensor status: "OS đang theo dõi vị trí"

### Acceptance:

✅ Sensor remains active with screen locked  
✅ App did not crash or lose connection

**Record:**

```
Test Case 2 Result: PASS / FAIL (circle one)
Date/Time: ___________________
Device: (Android/iOS) ___________________
Notes: _________________________________
```

---

## Test Case 3: Exit Event Detection (Main Geofence Test)

**Objective:** Verify app detects when user leaves a geofence zone

### Prerequisites:

- ✅ You are within 500m of the first stop location
- ✅ Dev Client running with plan loaded
- ✅ Geofence sensor showing "5 điểm đang canh gác"

### Procedure:

#### Phase 1: Establish Baseline (5 min)

```
1. LOCK SCREEN
   └─ Press power button → screen off
   └─ Keep in your hand or pocket
   └─ DO NOT unlock for next 5 minutes

2. TRAVEL AWAY
   └─ Walk or drive away from first stop location
   └─ Ensure you travel AT LEAST 500+ meters
   └─ Recommended: drive for 2+ minutes or walk 10+ minutes
   └─ Check GPS in Maps app: should show >500m distance

3. REACH NEW LOCATION
   └─ Stop at a location clearly >500m from starting point
   └─ Turn off vehicle if driving
   └─ Stand still

4. DWELL TIME (2-3 MINUTES)
   └─ Wait at this location for AT LEAST 2 minutes 30 seconds
   └─ DO NOT move closer to original location
   └─ DO NOT move farther away (could exit another geofence)
   └─ Screen stays OFF during entire dwell period
```

#### Phase 2: Capture Reroute Event

```
5. CHECK BACKEND LOGS (Terminal 1)
   └─ Look for line like:
      [INFO] POST /reroute
      [DEBUG] trigger.kind: geofence
      [DEBUG] minutes_late: X
   └─ Record the timestamp and request details
```

#### Phase 3: Verify App State

```
6. UNLOCK DEVICE (AFTER dwell time complete)
   └─ Wait at least 3 minutes total, then unlock
   └─ Check if itinerary updated (plan should show changes)
   └─ Geofence sensor might show reactivated regions
```

### Expected Output:

**Backend logs (Terminal 1):**

```
[INFO] POST /reroute received
[DEBUG] {
  "trip_id": "...",
  "trigger": {
    "kind": "geofence",
    "minutes_late": X
  },
  "current_time": "HH:MM",
  "visited_poi_ids": ["poi_1", "poi_2"],
  ...
}
[INFO] Reroute processed, new timeline generated
```

**App logs (Terminal 2):**

```
[Geofence] EXIT confirmed tại [Stop Name]
[Geofence] Dự kiến rời: HH:MM, Thực tế: HH:MM, Trễ: X phút
[Geofence] Trễ X phút → Bắn POST /reroute
[Geofence] Re-route thành công.
```

### Acceptance:

✅ Exactly **1** POST /reroute appears in backend logs  
✅ `trigger.kind: "geofence"` present  
✅ `minutes_late >= 0` (or actual value)  
✅ Event fired ONLY after 2+ minutes dwell time  
✅ No additional requests after the first one

**Record:**

```
Test Case 3 Result: PASS / FAIL (circle one)
Date/Time: ___________________
Device: (Android/iOS) ___________________
Starting Location: ___________________
Ending Location: ___________________
Distance Traveled: _______ meters
Dwell Time: _______ minutes
Backend Request Time: ___________________
minutes_late value: ___________________
Notes: _________________________________
```

---

## Test Case 4: GPS Drift Rejection (Dwell Time Validation)

**Objective:** Verify false GPS drifts don't trigger reroute

### Setup:

1. Plan loaded, geofence active
2. You are within 500m of first stop

### Procedure:

```
1. SIMULATE GPS DRIFT
   └─ Walk 600m away from first stop (EXIT geofence)
   └─ Immediately walk back 300m towards original location
   └─ Position: now within 300m (ENTERED geofence)
   └─ This simulates GPS drift: out→in→out again

2. RAPID MOVEMENT
   └─ Walk 600m away again, but do it in <30 seconds
   └─ Continue moving away
   └─ Screen OFF throughout

3. MONITOR BACKEND LOGS
   └─ Check Terminal 1 for any POST /reroute
   └─ Expected: NONE or only 1 if you wait full 2+ min
```

### Expected Output:

- **NO** extra/repeated /reroute requests in backend logs
- Only 1 request if you stayed >500m for full 2+ minutes
- Rapid GPS bounces should be filtered out

### Acceptance:

✅ No spurious multiple requests from GPS noise  
✅ Dwell Time prevents false triggers

**Record:**

```
Test Case 4 Result: PASS / FAIL (circle one)
Date/Time: ___________________
Device: (Android/iOS) ___________________
GPS Drift Simulations: _____ times
Backend Requests Received: _____ (should be 0-1)
Notes: _________________________________
```

---

## Test Case 5: Time Comparison Logic

**Objective:** Verify app correctly compares actual-vs-scheduled departure times

### Objective:\*\* Test different timing scenarios

### Scenario A: Departing ON TIME (or early)

```
Setup:
  ☐ Create plan with departure time = current time + 5 minutes
  ☐ Plan loads, wait 6 minutes
  ☐ Leave the geofence >500m

Expected:
  ☐ Backend log shows minutes_late = 0 or negative
  ☐ /reroute request sent (but backend may not re-route if not late)
  ☐ minutes_late <= 0 in request
```

### Scenario B: Departing LATE

```
Setup:
  ☐ Create plan with early departure time (e.g., 09:00)
  ☐ Current time is now 09:15
  ☐ Leave the geofence >500m

Expected:
  ☐ Backend log shows minutes_late = 15
  ☐ /reroute request with trigger.kind = "geofence"
  ☐ mentions "Trễ 15 phút" in app logs
```

### Acceptance:

✅ Time calculations correct (±2 minutes acceptable tolerance)  
✅ minutes_late value matches actual vs scheduled delta

**Record:**

```
Test Case 5A - On Time Result: PASS / FAIL
Scheduled Time: ___________________
Actual Time: ___________________
minutes_late in request: ___________________

Test Case 5B - Late Result: PASS / FAIL
Scheduled Time: ___________________
Actual Time: ___________________
Expected minutes_late: ___________________
Actual minutes_late in request: ___________________
```

---

## Test Case 6: Multi-Stop Geofence

**Objective:** Verify all geofences work (not just first stop)

### Setup:

1. Create plan with 5 stops
2. Verify: Geofence sensor shows "5 điểm đang canh gác"
3. Travel to 2nd or 3rd stop location

### Procedure:

```
1. Approach 2nd stop (within 500m)
   └─ App should recognize you entered 2nd geofence

2. Leave 2nd stop (exit >500m)
   └─ Wait 2+ minutes outside

3. Check Backend Logs
   └─ Should see /reroute WITH:
      "visited_poi_ids": ["poi_1", "poi_2"]
      └─ indicating you visited poi_1 AND poi_2
```

### Acceptance:

✅ Geofence for 2nd+ stops also triggers correctly  
✅ visited_poi_ids includes all stops traversed

**Record:**

```
Test Case 6 Result: PASS / FAIL
Date/Time: ___________________
Stop Tested: _____ (1st? 2nd? 3rd?)
visited_poi_ids in request: ___________________
```

---

## Test Case 7: Connection Recovery

**Objective:** Verify app recovers if backend becomes unreachable mid-trip

### Setup:

1. Plan loaded, geofence active
2. Backend running normally

### Procedure:

```
1. VERIFY CONNECTED
   ☐ Backend shows "✓ Backend connected"
   ☐ Health check succeeds

2. STOP BACKEND TEMPORARILY
   ☐ Kill Terminal 1 (backend process)
   └─ Simulates network outage

3. EXIT GEOFENCE (while backend is down)
   ☐ Travel >500m away
   ☐ Wait 2+ minutes
   ☐ Check app logs for error handling

4. RESTART BACKEND
   ☐ Start backend again: .\scripts\run-backend.ps1
   ☐ Wait for "Backend reachable" in UI

5. RETRY
   ☐ Exit geofence again (travel >500m away, 2+ min)
   ☐ This time backend should be reachable
```

### Acceptance:

✅ App logs error gracefully (doesn't crash)  
✅ After recovery, geofence events work again

**Record:**

```
Test Case 7 Result: PASS / FAIL
Date/Time: ___________________
Backend Down Duration: ___________________
Error Handling: (app crashed / logged error / recovered)
Recovery Successful: Yes / No
```

---

## Summary Checklist

| Test Case | Objective            | Result    | Evidence                         |
| --------- | -------------------- | --------- | -------------------------------- |
| 1         | Geofence activation  | PASS/FAIL | Sensor shows N regions active    |
| 2         | Background tracking  | PASS/FAIL | Sensor active with screen off    |
| 3         | EXIT event detection | PASS/FAIL | 1 /reroute in backend logs       |
| 4         | GPS drift rejection  | PASS/FAIL | No spurious requests             |
| 5         | Timing logic         | PASS/FAIL | minutes_late accurate            |
| 6         | Multi-stop geofence  | PASS/FAIL | Multiple stops trigger correctly |
| 7         | Connection recovery  | PASS/FAIL | App survives backend outage      |

### Final Acceptance:

```
All test cases passed: YES / NO

If NO:
  - Failed Test Case(s): _____________________
  - Root Cause: _________________________________
  - Fix Applied: _________________________________
  - Date Retested: _____________________

Sign Off:
  Tester Name: _____________________
  Date: _____________________
  Device: (Android/iOS) ___________________
  OS Version: _____________________
```

---

## Failure Diagnostics

### If Test Case 3 Fails: No /reroute received

1. **Check Geofence Activation:**

   ```bash
   # Check app logs (Terminal 2)
   grep "Bắt đầu Dwell Timer" (should appear within 30s of EXIT event)
   ```

2. **Verify Distance Traveled:**

   ```bash
   # Open Maps app on device
   # Check current location is >500m from starting location
   # GPS accuracy icon should show green (strong signal)
   ```

3. **Check Dwell Time:**

   ```
   Total time at new location must be >= 2 min 30 sec
   Example: Exit at 14:00, wait until 14:03 minimum
   ```

4. **Verify Backend Reachable:**

   ```bash
   # In Terminal 1, check last 20 lines:
   tail -20 backend.log | grep "POST /reroute"

   # Or test connectivity:
   curl http://localhost:8000/health
   ```

5. **Check Device Permissions:**
   ```
   Settings → Apps → AI Itinerary → Permissions
   Location: "Always Allow" ← must be this exact setting
   ```

---

## References

- **Geofence Implementation:** [mobile/src/geofence.ts](../mobile/src/geofence.ts)
- **API Schema:** [contracts/reroute-request.schema.json](../contracts/reroute-request.schema.json)
- **Build Guide:** [DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md)

---

**Acceptance Testing for Dev 7 (Physical Sensor Layer)**  
_Last Updated: 2025-04-13_
