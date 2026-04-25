# 🚀 Hướng Dẫn Chạy Hệ Thống AI Travel Optimizer

Tài liệu này mô tả **thứ tự bắt buộc** để khởi động hệ thống và build ứng dụng Android thành công.

---

## 📋 Mục Lục

1. [Phân tích lỗi EAS Build hôm qua](#1-phân-tích-lỗi-eas-build)
2. [Yêu cầu tiên quyết](#2-yêu-cầu-tiên-quyết)
3. [Bước 0 – Chuẩn bị file môi trường `.env`](#3-bước-0--chuẩn-bị-env)
4. [Bước 1 – Khởi động Redis](#4-bước-1--khởi-động-redis)
5. [Bước 2 – Khởi động Backend (FastAPI)](#5-bước-2--khởi-động-backend)
6. [Bước 3 – Kiểm tra Backend hoạt động](#6-bước-3--kiểm-tra-backend)
7. [Bước 4 – Build Mobile App (EAS)](#7-bước-4--build-mobile-app)
8. [Xử lý lỗi thường gặp](#8-xử-lý-lỗi-thường-gặp)

---

## 1. Phân Tích Lỗi EAS Build

### ❌ Lỗi xảy ra hôm qua (Apr 24, 2026)

```
Error: [android.dangerous]: withAndroidDangerousBaseMod:
Path to google-services.json is not defined.
Please specify the `expo.android.googleServicesFile` field in app.json.
```

**Nguyên nhân gốc (Root Cause):**

| # | Nguyên nhân | File liên quan |
|---|---|---|
| 1 | `app.json` phần `android` **thiếu** field `googleServicesFile` | `mobile/app.json` |
| 2 | `google-services.json` bị **gitignore** nên EAS cloud không đọc được | `.gitignore` |

**Chuỗi lỗi:**
```
EAS Cloud Server
  → Pull code từ Git
  → Không có mobile/google-services.json (bị gitignore)
  → app.json android section không có googleServicesFile
  → @react-native-firebase/app plugin không biết tìm file ở đâu
  → CRASH: npx expo prebuild exited with non-zero code: 1
```

**✅ Đã sửa:**
- Thêm `"googleServicesFile": "./google-services.json"` vào `android` section trong `app.json`
- Xóa `mobile/google-services.json` khỏi `.gitignore` (file hiện tại là dummy data, an toàn để commit)

---

## 2. Yêu Cầu Tiên Quyết

Đảm bảo các tool sau đã được cài đặt:

| Tool | Lệnh kiểm tra | Ghi chú |
|---|---|---|
| Python 3.11+ | `python --version` | Cần cho backend |
| Node.js 18+ | `node --version` | Cần cho mobile |
| Docker Desktop | `docker --version` | Cần để chạy Redis |
| EAS CLI | `eas --version` | `npm install -g eas-cli` |

---

## 3. Bước 0 – Chuẩn Bị `.env`

> ⚠️ **PHẢI làm trước tất cả các bước khác!**

```powershell
# Từ thư mục gốc ai-travel-optimizer/
Copy-Item .env.example .env
```

Sau đó mở `.env` và điền các giá trị bắt buộc:

```env
# Bắt buộc phải có (backend sẽ crash nếu thiếu)
REDIS_URL=redis://localhost:6379/0

# Tùy chọn – dùng cho chế độ dev với key tĩnh
AUTH_MODE=internal_key
INTERNAL_API_KEY=demo-internal-key
INTERNAL_API_KEY_HEADER=X-API-Key
```

---

## 4. Bước 1 – Khởi Động Redis

> ⚠️ **Redis PHẢI chạy TRƯỚC khi khởi động backend!**
> Backend mới của chúng ta đã bỏ RAM fallback → nếu không có Redis thì backend trả lỗi 503 ngay.

### Cách A – Dùng Docker (Khuyến nghị)

```powershell
# Chạy từ thư mục gốc ai-travel-optimizer/
docker run -d --name itinerary-redis -p 6379:6379 redis:7-alpine
```

Kiểm tra Redis đang chạy:
```powershell
docker logs itinerary-redis
# Phải thấy: Ready to accept connections
```

### Cách B – Dùng Docker Compose (chạy toàn bộ stack)

```powershell
# Chạy từ thư mục gốc ai-travel-optimizer/
docker-compose up redis -d
```

### Cách C – Redis for Windows (nếu đã cài local)

```powershell
redis-server
```

---

## 5. Bước 2 – Khởi Động Backend

```powershell
# Từ thư mục gốc ai-travel-optimizer/
# Kích hoạt virtual environment trước (nếu có)
.venv\Scripts\Activate.ps1

# Chạy backend
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

**Kết quả mong đợi:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

> ⚠️ Nếu thấy lỗi `redis.exceptions.ConnectionError` → Redis chưa chạy. Quay lại Bước 1.

---

## 6. Bước 3 – Kiểm Tra Backend

```powershell
# Gọi health check (cần Redis đang chạy)
Invoke-WebRequest -Uri http://localhost:8000/health -Method GET | Select-Object -ExpandProperty Content
```

**Kết quả thành công:**
```json
{"status": "ok"}
```

**Nếu trả về lỗi 503:**
```json
{"detail": "Database is down"}
```
→ Redis chưa chạy hoặc `REDIS_URL` trong `.env` sai.

---

## 7. Bước 4 – Build Mobile App (EAS)

### 7.1 Trước khi build – Commit các thay đổi

EAS Build đọc code từ **Git**, không đọc local. Phải commit trước:

```powershell
# Từ thư mục gốc ai-travel-optimizer/
git add mobile/app.json mobile/google-services.json .gitignore backend/app/main.py backend/app/state_store.py backend/app/models.py
git commit -m "fix: resolve EAS prebuild crash and integration drift"
git push
```

### 7.2 Chạy EAS Build

```powershell
# Di chuyển vào thư mục mobile
cd mobile

# Build Android APK (profile preview)
eas build -p android --profile preview
```

### 7.3 Giải thích các profile build

| Profile | Dùng cho | Đặc điểm |
|---|---|---|
| `development` | Dev local (emulator) | APK, API URL = `10.0.2.2:8000` |
| `development-device` | Dev local (thiết bị thật) | APK, API URL = IP LAN |
| `preview` | Test nội bộ / demo | APK, API URL = staging server |
| `production` | Phát hành Google Play | AAB, API URL = production server |

> 📌 **Lưu ý:** Profile `preview` đang trỏ tới `https://api-staging.example.com` (placeholder).
> Bạn cần cập nhật `EXPO_PUBLIC_API_URL` trong `eas.json` profile `preview` thành URL thật của server.

---

## 8. Xử Lý Lỗi Thường Gặp

### ❌ Lỗi: `google-services.json is not defined`

```
Error: [android.dangerous]: withAndroidDangerousBaseMod:
Path to google-services.json is not defined.
```

**Nguyên nhân:** `app.json` thiếu `googleServicesFile` hoặc file bị gitignore.
**Giải pháp:** Đã được sửa trong phiên này. Đảm bảo đã commit và push.

---

### ❌ Lỗi: `AttributeError: 'PromptConstraintParser' object has no attribute 'parse_structured_async'`

**Nguyên nhân:** `main.py` gọi hàm không tồn tại.
**Giải pháp:** Đã được sửa – `main.py` giờ dùng `planner.plan()` trực tiếp.

---

### ❌ Lỗi: Backend trả 503 khi gọi `/plan` hoặc `/reroute`

```json
{"detail": "Hệ thống lưu trạng thái đang bảo trì, vui lòng thử lại sau"}
```

**Nguyên nhân:** Redis không chạy hoặc `REDIS_URL` không đúng trong `.env`.
**Giải pháp:**
1. Kiểm tra Redis: `docker ps | grep redis`
2. Kiểm tra `REDIS_URL` trong `.env` = `redis://localhost:6379/0`

---

### ❌ Lỗi: `TypeError: PromptConstraintParser() takes no arguments`

**Nguyên nhân:** `intent_parser = PromptConstraintParser(max_retries=...)` trong `main.py` cũ.
**Giải pháp:** Đã xóa – `main.py` không còn khởi tạo `intent_parser` nữa.

---

### ❌ EAS Build: `eas: command not found`

```powershell
npm install -g eas-cli
eas login
```

---

### ❌ EAS Build lỗi git dirty / uncommitted changes

```
CommandError: Please commit your changes or stash them before building.
```

**Giải pháp:**
```powershell
git add -A
git commit -m "chore: pre-build cleanup"
git push
```

---

## 📊 Sơ Đồ Thứ Tự Khởi Động

```
[Tạo .env]
     ↓
[Docker: redis:7-alpine] ← PHẢI chạy TRƯỚC
     ↓
[uvicorn backend.app.main:app --reload]
     ↓
[Kiểm tra: GET /health → {"status":"ok"}]
     ↓
[git commit + git push] ← EAS đọc từ git
     ↓
[cd mobile && eas build -p android --profile preview]
     ↓
[Tải APK từ EAS Dashboard / email]
```

---
