# Dev 7 Documentation Index

**Navigation Guide for Dev 7: Physical Sensor Layer**

---

## 🚀 START HERE

### For New Team Members (First Time):

1. **[QUICKSTART.md](./QUICKSTART.md)** ⭐ **START HERE** (10 min read)
   - TL;DR quick start
   - Prerequisites
   - Key commands
2. **[DEV7_README.md](./DEV7_README.md)** (30 min read)
   - Architecture overview
   - What is Dev 7?
   - Why not Expo Go?
   - Design decisions

3. **[DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md)** (45 min read)
   - Step-by-step build instructions
   - Device installation
   - Debug & troubleshooting
   - Performance tips

4. **[DEV7_TESTING_GUIDE.md](./DEV7_TESTING_GUIDE.md)** (60 min read)
   - 7 acceptance test cases
   - Detailed test procedures
   - Success/failure criteria
   - Diagnostics

---

## 📋 By Use Case

### I want to...

#### ...understand what Dev 7 does

→ Read: [DEV7_README.md](./DEV7_README.md#what-is-dev-7)

#### ...build the app

→ Follow: [DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md#part-3-building-development-client)

#### ...run dev server

→ Follow: [DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md#part-4-running-dev-client-with-backend)

#### ...test the geofencing

→ Follow: [DEV7_TESTING_GUIDE.md](./DEV7_TESTING_GUIDE.md#test-case-3-exit-event-detection-main-geofence-test)

#### ...debug a problem

→ Check: [DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md#part-6-debugging)

#### ...understand the code

→ Read: [DEV7_README.md](./DEV7_README.md#key-components)

#### ...get a quick start

→ Follow: [QUICKSTART.md](./QUICKSTART.md)

#### ...understand acceptance criteria

→ Read: [DEV7_TESTING_GUIDE.md](./DEV7_TESTING_GUIDE.md#acceptance-criteria-from-requirements)

---

## 📂 Documentation Files

| File                               | Purpose                         | Read Time |
| ---------------------------------- | ------------------------------- | --------- |
| **QUICKSTART.md**                  | 10-minute start guide           | 5 min     |
| **DEV7_README.md**                 | Architecture & overview         | 30 min    |
| **DEV7_BUILD_GUIDE.md**            | Build & deployment instructions | 45 min    |
| **DEV7_TESTING_GUIDE.md**          | Acceptance test procedures      | 60 min    |
| **DEV7_IMPLEMENTATION_SUMMARY.md** | What was built & why            | 20 min    |

---

## 🔧 Source Code Files

| File                     | Purpose             | Lines | Key Functions                                                                    |
| ------------------------ | ------------------- | ----- | -------------------------------------------------------------------------------- |
| `mobile/src/geofence.ts` | Geofence engine     | 350+  | `startGeofenceMonitoring()`, `stopGeofenceMonitoring()`, `GEOFENCE_TASK` handler |
| `mobile/src/api.ts`      | API client          | 150+  | `rerouteGeofence()`                                                              |
| `mobile/App.tsx`         | UI integration      | 500+  | Geofence lifecycle, sensor display                                               |
| `mobile/app.json`        | iOS/Android config  | 50+   | Background location setup                                                        |
| `mobile/eas.json`        | Build configuration | 30+   | Development build profile                                                        |

---

## 🛠️ Build & Deployment Scripts

| Script                                 | Purpose           | Platform | Time      |
| -------------------------------------- | ----------------- | -------- | --------- |
| `scripts/build-dev-client-android.ps1` | Build Android APK | Android  | ~5 min    |
| `scripts/build-dev-client-ios.ps1`     | Build iOS IPA     | iOS      | ~10 min   |
| `scripts/run-dev-client.ps1`           | Start dev server  | Both     | Immediate |
| `scripts/run-backend.ps1`              | Start backend API | Backend  | Immediate |

---

## 📊 Quick Reference

### Commands

```powershell
# Build Android
.\scripts\build-dev-client-android.ps1

# Build iOS
.\scripts\build-dev-client-ios.ps1

# Run dev server
.\scripts\run-dev-client.ps1

# Run backend
.\scripts\run-backend.ps1

# Full local environment
.\scripts\run-local.ps1
```

### Key Constants (geofence.ts)

```typescript
GEOFENCE_RADIUS_METERS = 500; // Zone radius
DWELL_TIME_MS = 120_000; // 2 minutes
GEOFENCE_TASK = "GEOFENCE_TRAVEL_MONITOR";
STORAGE_KEY_TRIP = "current_trip";
```

### API Endpoint

```
POST /reroute
Content-Type: application/json
Body: {
  "trip_id": "...",
  "trigger": {
    "kind": "geofence",
    "minutes_late": X
  },
  "current_time": "HH:MM",
  "visited_poi_ids": ["..."]
}
```

---

## 🧪 Test Cases

| #   | Name                | Time   | Key Action                | Success Criteria                    |
| --- | ------------------- | ------ | ------------------------- | ----------------------------------- |
| 1   | Geofence Activation | 5 min  | Create plan               | Sensor shows "X điểm đang canh gác" |
| 2   | Background Tracking | 10 min | Lock screen               | Sensor still active                 |
| 3   | EXIT Detection      | 15 min | Travel >500m, wait 2+ min | Exactly 1 /reroute in logs          |
| 4   | GPS Drift Rejection | 10 min | Rapid GPS bounces         | No spurious requests                |
| 5   | Time Comparison     | 10 min | Test on-time & late       | minutes_late accurate               |
| 6   | Multi-Stop          | 15 min | Travel to 2nd stop        | Geofence for other stops work       |
| 7   | Recovery            | 15 min | Backend outage            | App recovers gracefully             |

---

## ❓ Troubleshooting

### Issue: Sensor shows "inactive"

→ Check: [DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md#issue-sensor-shows-inactive-after-creating-plan)

### Issue: No /reroute received

→ Check: [DEV7_TESTING_GUIDE.md](./DEV7_TESTING_GUIDE.md#if-test-case-3-fails-no-reroute-received)

### Issue: Multiple /reroute requests

→ Check: [DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md#issue-multiple-reroute-requests-5-10-rapid-ones)

### Issue: Permission errors

→ Check: [DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md#issue-cần-quyền-luôn-cho-phép)

### Issue: Backend unreachable

→ Check: [DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md#issue-sensor-shows-inactive-after-creating-plan)

---

## 📈 What's Included

✅ **Core Implementation**

- Geofence engine with Dwell Time validation
- API client for /reroute endpoint
- App lifecycle integration
- Background task handling

✅ **Build System**

- EAS configuration for Android & iOS
- Native build scripts (APK/IPA)
- Dev server startup script

✅ **Documentation**

- 5 markdown guides (100+ pages)
- Architecture diagrams (text-based)
- 7 test cases with procedures
- Troubleshooting guides

✅ **Configuration**

- iOS background location setup
- Android permissions configured
- Build profiles ready to use
- API schema validation

---

## 🎯 Success Path

```
1. Read QUICKSTART.md (5 min)
   ↓
2. Build: .\scripts\build-dev-client-android.ps1 (5 min)
   ↓
3. Install APK on device (2 min)
   ↓
4. Start backend: .\scripts\run-backend.ps1 (1 min)
   ↓
5. Start dev server: .\scripts\run-dev-client.ps1 (1 min)
   ↓
6. Follow Test Case 3 from DEV7_TESTING_GUIDE.md (15 min)
   ↓
7. Check backend logs for /reroute request ✅
```

**Total Time:** ~30 minutes from zero to working system

---

## 🔗 Related Components

- **Dev 5:** Generates trip state (written to AsyncStorage)
- **Dev 6:** Backend `/reroute` endpoint that processes geofence events
- **Contracts:** [reroute-request.schema.json](./contracts/reroute-request.schema.json)

---

## 📞 Getting Help

| Question                   | Answer Location                                                    |
| -------------------------- | ------------------------------------------------------------------ |
| How do I build?            | [DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md)                       |
| How do I test?             | [DEV7_TESTING_GUIDE.md](./DEV7_TESTING_GUIDE.md)                   |
| What's the architecture?   | [DEV7_README.md](./DEV7_README.md#architecture-overview)           |
| Why do we need dwell time? | [DEV7_README.md](./DEV7_README.md#key-design-decisions)            |
| How do I debug?            | [DEV7_BUILD_GUIDE.md](./DEV7_BUILD_GUIDE.md#part-6-debugging)      |
| What was built?            | [DEV7_IMPLEMENTATION_SUMMARY.md](./DEV7_IMPLEMENTATION_SUMMARY.md) |
| Quick start?               | [QUICKSTART.md](./QUICKSTART.md)                                   |

---

## 📋 Checklist: Before You Start

- [ ] Node.js 18+ installed
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Logged into Expo (`eas login`)
- [ ] Physical device (Android or iOS)
- [ ] Device on same WiFi as computer
- [ ] GPU/Location services enabled on device
- [ ] Read QUICKSTART.md

---

## 📚 Reading Order (Recommended)

### For Developers:

1. QUICKSTART.md
2. DEV7_README.md (Architecture section)
3. [mobile/src/geofence.ts](./mobile/src/geofence.ts) (read code)
4. DEV7_BUILD_GUIDE.md (as needed)

### For QA/Testers:

1. QUICKSTART.md
2. DEV7_TESTING_GUIDE.md (all 7 test cases)
3. DEV7_BUILD_GUIDE.md (troubleshooting)

### For Product Managers:

1. DEV7_README.md
2. DEV7_IMPLEMENTATION_SUMMARY.md
3. QUICKSTART.md

### For DevOps/Build Engineering:

1. DEV7_BUILD_GUIDE.md
2. [mobile/eas.json](./mobile/eas.json) (review config)
3. [scripts/](./scripts/) (review build scripts)

---

## ✅ Implementation Status

| Component       | Status      |
| --------------- | ----------- |
| Core Logic      | ✅ Complete |
| API Integration | ✅ Complete |
| App Integration | ✅ Complete |
| Build Config    | ✅ Complete |
| Build Scripts   | ✅ Complete |
| Documentation   | ✅ Complete |
| Test Guide      | ✅ Complete |

**Overall Status:** ✅ **READY FOR TESTING**

---

**Last Updated:** April 13, 2025  
**Version:** 1.0.0  
**Status:** Production Ready
