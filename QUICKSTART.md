#!/usr/bin/env -S cat

# Dev 7: Quick Start Guide

## TL;DR — Get Running in 10 Minutes

### Prerequisites:

```bash
# 1. Node.js 18+ installed
node --version

# 2. EAS CLI installed
npm install -g eas-cli

# 3. Logged into Expo
eas login
```

### Step 1: Build Development Client (5 min)

```powershell
# Android (recommended for faster builds):
.\scripts\build-dev-client-android.ps1

# iOS (requires Apple Developer account):
.\scripts\build-dev-client-ios.ps1
```

Downloaded APK/IPA from EAS dashboard → Install on device

### Step 2: Start Services (3 terminals)

**Terminal 1 — Backend API:**

```powershell
.\scripts\run-backend.ps1
# Should show: "Uvicorn running on http://127.0.0.1:8000"
```

**Terminal 2 — Expo Dev Server:**

```powershell
.\scripts\run-dev-client.ps1
# Should show: QR code for scanning
```

**On Device — Open Development Client App:**

1. Tap "Scan QR Code"
2. Scan QR from Terminal 2
3. Wait for "Successfully compiled bundle"

### Step 3: Test Geofence (2 min)

```
1. Tap "Generate plan" → Enter: "Plan a Hue day trip..."
2. Wait for timeline → Green dot on sensor card
3. Lock screen (press power button)
4. Travel >500m away from first stop
5. Wait 2+ minutes at new location
6. Check Terminal 1 — should log: POST /reroute with trigger.kind="geofence"
```

✅ **Success** if you see one `/reroute` request in backend logs

---

## Folder Structure

```
Scripts:
  scripts/build-dev-client-android.ps1   ← Android build
  scripts/build-dev-client-ios.ps1       ← iOS build
  scripts/run-dev-client.ps1             ← Dev server
  scripts/run-backend.ps1                ← Backend API

Mobile App:
  mobile/app.json                        ← iOS/Android config
  mobile/eas.json                        ← Build config
  mobile/app.tsx                         ← UI + geofence integration
  mobile/src/geofence.ts                 ← Geofence engine
  mobile/src/api.ts                      ← HTTP client

Documentation:
  DEV7_README.md         ← Architecture & overview (START HERE!)
  DEV7_BUILD_GUIDE.md    ← Detailed build instructions
  DEV7_TESTING_GUIDE.md  ← Acceptance test cases
```

---

## Common Commands

```powershell
# Build Android Development Client
.\scripts\build-dev-client-android.ps1

# Build iOS Development Client
.\scripts\build-dev-client-ios.ps1

# Start Expo dev server
.\scripts\run-dev-client.ps1

# Start backend API
.\scripts\run-backend.ps1

# Run everything locally (backend + dev server)
.\scripts\run-local.ps1

# Run backend tests
$env:PYTHONPATH="."; python -m unittest discover -s backend/tests

# Check backend health
curl http://localhost:8000/health
```

---

## Troubleshooting

### "Cần quyền 'Luôn cho phép'"

→ Go to phone Settings → App → Permissions → Location → Always Allow

### "API unreachable"

→ Check Terminal 1 running? Test: `curl http://localhost:8000/health`

### "No /reroute request"

→ Check you traveled >500m → check you waited 2+ min → check backend logs

### "Multiple /reroute requests"

→ GPS drift causing false positives → increase dwell time to 3 min in geofence.ts

---

## Documentation

| File                                             | Purpose                                                   |
| ------------------------------------------------ | --------------------------------------------------------- |
| [DEV7_README.md](./DEV7_README.md)               | **Start here** — Overview, architecture, design decisions |
| [DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md)     | Step-by-step build & deployment instructions              |
| [DEV7_TESTING_GUIDE.md](./DEV7_TESTING_GUIDE.md) | 7 acceptance test cases with detailed steps               |

---

## What is Dev 7?

**The "Physical Sensor" Layer** that enables automatic re-routing:

1. **Monitor** geofence zones (500m radius) around each stop
2. **Detect** when user leaves a stop (account for GPS drift)
3. **Compare** actual vs scheduled departure times
4. **Trigger** `/reroute` endpoint on backend automatically
5. **Run in background** with screen off (battery efficient)

---

## Key Features

✅ Battery-efficient geofencing (OS-managed, not continuous GPS polling)  
✅ 2-minute dwell time (prevents GPS drift false positives)  
✅ Automatic `/reroute` trigger when late departure detected  
✅ Background operation (screen can be off)  
✅ Works on real Android & iOS devices

---

## Why Native Build Required?

**Expo Go (Sandbox):** ❌ Cannot access geofencing APIs, background location blocked

**Expo Development Client (Native):** ✅ Full OS geofencing support, background location works

---

## Next Steps

1. **Read:** [DEV7_README.md](./DEV7_README.md) for architecture overview
2. **Build:** Run `.\scripts\build-dev-client-android.ps1` (or iOS)
3. **Install:** Transfer APK/IPA to physical device
4. **Run:** Start backend + dev server
5. **Test:** Follow [DEV7_TESTING_GUIDE.md](./DEV7_TESTING_GUIDE.md)

---

**Status:** ✅ Ready to Build  
**Last Updated:** 2025-04-13  
**Questions?** See [DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md#troubleshooting-summary)
