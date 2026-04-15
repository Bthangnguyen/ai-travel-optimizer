# Dev 7: Mobile Geofence Sensor — Build & Deployment Guide

## Overview

Dev 7 is the **physical sensor layer** of the AI Travel Optimizer. It enables:

- ✅ Background location tracking (screen off)
- ✅ Geofence-based event detection (500m radius)
- ✅ Dwell Time validation (2-3 min to prevent GPS drift false positives)
- ✅ Automatic `/reroute` API calls when user leaves a stop late

**Critical Requirement:** This component **ONLY works** on a native Expo Development Build or full native app. Expo Go (the sandbox) does NOT support background location tracking.

---

## Part 1: WHY Custom Development Build?

### ❌ Expo Go (Sandbox) — DOES NOT WORK

- Mobile browser sandbox
- Cannot access OS background task APIs
- Geofencing is blocked by the OS at runtime
- Background location tracking is impossible
- App stops when screen turns off

### ✅ Expo Development Client (Native Build) — WORKS

- Native Android/iOS app
- Full access to OS geofencing APIs
- Background location tracking supported
- App continues running when screen off
- "Always Allow" location permission available
- ~30-50 MB APK / 100-150 MB IPA

---

## Part 2: Prerequisites

Before building, ensure you have:

### On Your Computer:

```bash
# Node.js 18+
node --version

# npm or yarn
npm --version

# EAS CLI (global)
npm install -g eas-cli

# Expo CLI (optional but recommended)
npm install -g expo-cli
```

### Expo Account:

```bash
# Login to Expo (required for building)
eas login
```

### Device Registration (iOS only):

To build for iOS, register your test device with Apple Developer:

1. Get your device UDID:
   - macOS: `ioreg -l -S | grep 'IOSerialNumber'`
   - Or use Xcode device list
2. Add to Apple Developer account
3. EAS will prompt for credentials during build

### Android Device:

- No pre-registration needed
- Can sideload APK directly

---

## Part 3: Building Development Client

### Option A: Android (Faster, Simpler)

```powershell
# From project root
.\scripts\build-dev-client-android.ps1
```

**What happens:**

1. EAS compiles native Android Development Client
2. Generates APK (~35-50 MB)
3. Build takes ~3-5 minutes on EAS servers
4. APK appears in your EAS dashboard

**Install on device:**

```bash
# Download APK from EAS dashboard, then:
adb install app-release.apk

# Or manually: tap APK file on Android device
```

### Option B: iOS (Complex, Requires Apple Developer Account)

```powershell
# From project root
.\scripts\build-dev-client-ios.ps1
```

**What happens:**

1. EAS compiles native iOS Development Client
2. Generates Ad Hoc IPA (~100-150 MB)
3. Build takes ~5-10 minutes
4. IPA appears in your EAS dashboard

**Install on device:**

```bash
# Option 1: Use EAS to install directly
eas build:run --platform ios

# Option 2: Manual via Xcode
# Download IPA from dashboard → drag into Xcode Devices

# Option 3: Use Apple Configurator 2
# Download IPA → drag into Configurator
```

---

## Part 4: Running Dev Client with Backend

### Terminal 1: Start Backend API

```powershell
.\scripts\run-backend.ps1 -Port 8000
```

Verify: http://localhost:8000/docs should load

### Terminal 2: Start Expo Dev Server

```powershell
# From project root
.\scripts\run-dev-client.ps1

# Or with explicit backend URL:
.\scripts\run-dev-client.ps1 -BackendUrl "http://192.168.1.10:8000"
```

**Output:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Starting Expo Development Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Expo Go URL: exp://192.168.1.100:19000
  Web URL: http://localhost:19000

  Scan QR code with Development Client app →
```

### Terminal 3: On Mobile Device

1. **Open Development Client app** (the APK/IPA you installed)
2. **Tap "Scan QR Code"** on home screen
3. **Scan QR** from Terminal 2 output
4. App connects and starts downloading JavaScript bundle
5. Wait for "Successfully compiled bundle"
6. App loads and shows "AI itinerary control room"

---

## Part 5: Testing Geofence (Manual Walkthrough)

### Prerequisites:

- ✅ Development Client installed on device
- ✅ Backend API running
- ✅ Device connected via Expo dev server
- ✅ Device on same WiFi as backend

### Test Flow:

```
1. OPEN APP
   └─ You should see: GeofenceSensor status = "Chưa kích hoạt"

2. CREATE PLAN
   └─ Tap "Generate plan"
   └─ Enter prompt: "Plan a Hue day trip..."
   └─ NOTE: If plan creation fails, check backend at Terminal 1

3. MONITOR GEOFENCE STATUS
   └─ After plan loads, sensor status changes to:
      "Geofence sensor · 3 điểm đang canh gác"
   └─ Green dot appears (sensor active)
   └─ Indicates: 3 geofence zones now monitored by OS

4. LOCK SCREEN
   └─ Press power button to turn screen off
   └─ CRITICAL: Keep it OFF — this tests background tracking
   └─ App will continue running in background (you won't see it)

5. TRAVEL AWAY
   └─ Walk/drive away from first stop location
   └─ Must travel >500m away
   └─ Continue until >500m distance is maintained

6. WAIT AT NEW LOCATION
   └─ Stay at location >500m away for 2-3 minutes
   └─ This is Dwell Time — confirms you truly left, not GPS noise
   └─ Do NOT get closer than 500m during this period

7. CHECK BACKEND LOG
   └─ In Terminal 1, look for:
      [INFO] POST /reroute called with geofence trigger
      [DEBUG] trip_id=..., minutes_late=...
   └─ Indicates: Backend received reroute event successfully

8. UNLOCK DEVICE
   └─ After 2-3 min dwell time, unlock phone
   └─ You should see new itinerary (may have changed based on reroute response)
```

### Success Criteria:

✅ Backend log shows exactly **1 POST /reroute** request
✅ Request contains `trigger.kind: "geofence"`
✅ `minutes_late > 0` if you left after scheduled departure time
✅ App stayed running with screen off
✅ No spurious repeated requests (GPS drift was filtered)

### Failure Scenarios:

| Issue                      | Cause                                      | Fix                                           |
| -------------------------- | ------------------------------------------ | --------------------------------------------- |
| Sensor stays "inactive"    | Permissions not granted                    | Re-run app, tap "Always Allow" when prompted  |
| Multiple /reroute requests | GPS drift false positive                   | Dwell Time logic may need tuning (try 3+ min) |
| No /reroute at all         | Backend unreachable OR didn't travel >500m | Check backend log, verify distance traveled   |
| Request before 2-3 min     | Dwell Time not working                     | Check Dwell Time flag in app logs             |

---

## Part 6: Debugging

### Enable Verbose Logging

**In App.tsx**, before exporting:

```typescript
// Uncomment to debug geofence events
LogBox.ignoreLogs(["Non-serializable values"]);
```

**In Terminal 2**, the Expo dev server shows live logs:

```
[Geofence] Bắt đầu Dwell Timer 120000s cho Chùa Thiên Mụ
[Geofence] EXIT confirmed tại Chùa Thiên Mụ...
[Geofence] Trễ 15 phút → Bắn POST /reroute
[Geofence] Re-route thành công.
```

### Check Device Logs

**Android:**

```bash
adb logcat | grep Geofence
adb logcat | grep "Geofence Task"
```

**iOS (via Terminal):**

```bash
# Xcode device logs or use:
xcrun simctl spawn booted log stream --predicate 'eventMessage contains "Geofence"'
```

### Backend API Verification

```bash
# Check if backend is listening
curl http://localhost:8000/health

# Check POST /reroute endpoint accepted request
curl -X POST http://localhost:8000/reroute \
  -H "Content-Type: application/json" \
  -d '{
    "trip_id": "test",
    "visited_poi_ids": [],
    "trigger": {"kind": "geofence", "minutes_late": 5}
  }'
```

---

## Part 7: Common Issues & Solutions

### Issue: "Cần quyền 'Luôn cho phép'"

**Cause:** Background location permission not granted
**Fix:**

1. Open phone Settings
2. Find "AI Itinerary Optimizer" or app name
3. Tap Permissions → Location → Select "Always Allow"
4. Close app, re-open, try again

---

### Issue: Sensor shows "inactive" after creating plan

**Cause:**

- Permissions denied in system prompt
- Backend API unreachable
- Geofence setup threw error
  **Fix:**

1. Check app error message (scroll down in UI)
2. Verify backend at http://localhost:8000/docs
3. Check Terminal 1 for error logs
4. Retry permission grant in Settings

---

### Issue: No /reroute request received, but traveled >500m

**Cause:**

- Dwell Time not satisfied (didn't wait 2-3 min at new location)
- Didn't actually travel >500m (check GPS on maps)
- App/OS killed geofencing task
- Backend unreachable
  **Fix:**

1. Wait at new location for full 3+ minutes
2. Check phone's built-in Maps app → verify you're truly 500m+ away
3. Check app logs in Terminal 2 for "Dwell Timer" messages
4. Check backend logs for connection errors

---

### Issue: Multiple /reroute requests (5-10 rapid ones)

**Cause:** GPS drift triggering false exit-reenter cycles
**Fix:**

1. Increase Dwell Time from 120s to 180s in `geofence.ts`:
   ```typescript
   const DWELL_TIME_MS = 3 * 60 * 1000; // 3 min instead of 2
   ```
2. Rebuild dev client: `.\scripts\build-dev-client-android.ps1`
3. Test again with longer dwell period

---

## Part 8: Performance & Battery Optimization

### Geofence Efficiency:

- OS monitors geofences at lowest power cost
- GPS only activates when geofence boundary detected
- No continuous GPS polling (would drain battery in minutes)
- Typical consumption: ~1-5% per hour with geofences active

### Dev Client Overhead:

- Background task overhead: minimal
- Dwell Time timers: only active when EXIT event received
- AsyncStorage reads: only on geofence events

### Recommendations:

- ✅ Keep geofencing enabled during active trip
- ✅ Disable geofencing when trip ends: call `stopGeofenceMonitoring()`
- ✅ Use 2-3 min Dwell Time (balance between GPS drift vs rapid reroute)
- ✅ Monitor /reroute frequency in backend logs

---

## Part 9: Deployment Checklist

Before releasing to production:

- [ ] Development Client built and installed on device
- [ ] Geofence sensor activation tested (sensor shows "active")
- [ ] Background location tracking tested (screen off, app continues)
- [ ] /reroute endpoint receives geofence events
- [ ] Dwell Time filtering validates correctly (no spam requests)
- [ ] GPS drift handling works (no false triggers)
- [ ] Backend logs show expected request format
- [ ] Device location permission set to "Always Allow"
- [ ] Tested on actual device (not emulator)
- [ ] Tested on both iOS and Android
- [ ] Backend API reachable from device's network

---

## Troubleshooting Summary

```
Error Flow:
├─ Sensor inactive? → Check location permissions
├─ Plan fails? → Check backend health (Terminal 1)
├─ /reroute never received? → Check dwell time, distance traveled
├─ Multiple requests? → Increase dwell time to 3 min
├─ App crash? → Check Terminal 2 for JS errors
└─ Device can't reach backend? → Check WiFi, firewall, API_URL
```

---

## References

- **Expo Location APIs:** https://docs.expo.dev/versions/latest/sdk/location/
- **Expo Development Client:** https://docs.expo.dev/develop/development-builds/introduction/
- **EAS Build Documentation:** https://docs.expo.dev/build/introduction/
- **React Native Background Tasks:** https://docs.expo.dev/versions/latest/sdk/task-manager/
- **GPS Accuracy & Drift:** https://en.wikipedia.org/wiki/Dilution_of_precision

---

**Made for Dev 7 (Physical Sensor Layer)**  
_Part of AI Travel Optimizer v0.1.0_
