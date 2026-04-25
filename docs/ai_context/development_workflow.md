# Quy Trình Phát Triển & Hướng Dẫn Sử Dụng AI

> Tài liệu này hướng dẫn cách làm việc hiệu quả với AI Coding Assistants trong dự án này.

---

## 1. Checklist Trước Khi Code (Dành Cho AI)

Trước khi sinh code mới, AI PHẢI trả lời được các câu hỏi sau:
- [ ] Tôi đang làm việc ở lớp nào trong kiến trúc 4 lớp?
- [ ] Data model liên quan nằm ở đâu trong `models.py`?
- [ ] Tính năng này có phụ thuộc vào dịch vụ ngoài không? Nếu có, đã có fallback chưa?
- [ ] Type/Model có cần cập nhật đồng bộ giữa `models.py` và `types.ts` không?

---

## 2. Prompt Template Hiệu Quả Cho AI

### Khi thêm tính năng mới (Backend)
```
Đọc các file sau trước:
- .cursorrules (luật dự án)
- docs/ai_context/system_overview.md (kiến trúc)
- docs/ai_context/backend_logic.md (logic chi tiết)
- backend/app/models.py (data models)

Yêu cầu: [Mô tả tính năng cụ thể]

Lưu ý bắt buộc:
- Không phá vỡ kiến trúc 4 lớp
- Thêm fallback nếu dùng dịch vụ ngoài
- Cập nhật models.py nếu thay đổi data structure
```

### Khi thêm tính năng mới (Mobile)
```
Đọc các file sau trước:
- .cursorrules (luật dự án)
- mobile/src/types.ts (TypeScript types)
- mobile/src/api.ts (cách gọi API)
- docs/ai_context/data_models.md (API contracts)

Yêu cầu: [Mô tả component/màn hình cần tạo]

Lưu ý bắt buộc:
- Gọi API qua api.ts, không fetch trực tiếp
- Dùng types từ types.ts
- Quản lý state bằng useState/AsyncStorage
```

### Khi viết Data Scraper (Task 3)
```
Đọc file sau trước:
- docs/ai_context/data_models.md (phần POI model)
- data/sample_pois.json (xem ví dụ format thực tế)

Yêu cầu: Viết scraper thu thập POI từ [nguồn]

Output bắt buộc phải là JSON array với mỗi item khớp với POI model:
- poi_id: string (slug từ tên địa điểm)
- city: "hue" hoặc "hcm"
- name: string (tiếng Việt)
- lat, lon: float (tọa độ GPS chính xác)
- tags: array từ ["culture", "history", "food", "nature", "spiritual", "relax"]
- visit_minutes: int (ước tính phút)
- ticket_price: int (VND, 0 nếu miễn phí)
- opens_at, closes_at: string "HH:MM"
- outdoor: boolean
- priority: int 1-10
```

---

## 3. Quy Trình Git

### Đặt tên nhánh
```
feature/[task-description]    # Tính năng mới
fix/[bug-description]         # Sửa lỗi
docs/[doc-description]        # Cập nhật tài liệu
```

### Commit message
```
feat: thêm tính năng lọc POI theo rating người dùng
fix: sửa lỗi parser không nhận ngân sách dạng "1tr5"
docs: cập nhật hướng dẫn deploy backend
```

### Quy tắc khi thay đổi Data Models
1. Cập nhật `backend/app/models.py` trước.
2. Cập nhật `mobile/src/types.ts` đồng bộ.
3. Cập nhật `contracts/` nếu thay đổi ảnh hưởng đến API schema.
4. Cập nhật `docs/ai_context/data_models.md`.
5. Thông báo team qua PR description.

---

## 4. Liên Quan Giữa Các Tasks

```
Task 2 (AI Context) ─────────────────────────────────────────────────────────────────┐
         │                                                                            │
         │ Cung cấp ngữ cảnh & luật                                                  │
         ▼                                                                            │
Task 3 (Data Scraping) ──────────────────────────────────► Task 1 (App & Testing)   │
   Thu thập POI Huế & HCM            Dữ liệu POI            Test với data thực      │
   Format theo POI model ◄────────── từ data_models.md       Chạy edge cases        │
         │                                                            │               │
         │ data/sample_pois.json                                      │               │
         ▼                                                            ▼               │
   Backend đọc POI mới         ◄──────────── Task 4 (UI) ◄──────────┘               │
                                        Xây dựng giao diện           │               │
                                        Dùng types từ types.ts ◄─────┘               │
                                        Gọi API qua api.ts  ◄────────────────────────┘
```

### Dependency cụ thể:
- **Task 3 cần từ Task 2:** Format POI model chính xác (đọc `data_models.md`).
- **Task 4 cần từ Task 2:** API contract rõ ràng (đọc `data_models.md`), AI không guess field names.
- **Task 1 cần từ Task 2:** Biết được các edge case như fallback scenarios để viết test.

---

## 5. Cấu Hình Môi Trường

### Backend Environment Variables
```env
APP_NAME=AI Dynamic Itinerary Optimizer
DEFAULT_CITY=hue
OSRM_BASE_URL=http://localhost:5000      # Bỏ qua nếu không có OSRM
REDIS_URL=redis://localhost:6379         # Bỏ qua nếu không có Redis
DATA_PATH=data/sample_pois.json          # Đường dẫn đến file POI
REROUTE_COOLDOWN_SECONDS=180
```

### Mobile Environment Variables
```env
EXPO_PUBLIC_API_URL=http://localhost:8000   # URL backend
# Android emulator: http://10.0.2.2:8000
# iOS / Web: http://127.0.0.1:8000
```

---

## 6. Chạy Nhanh (Quick Start)

```powershell
# Backend only
$env:PYTHONPATH="."
uvicorn backend.app.main:app --reload --port 8000

# Test backend
python -m unittest discover -s backend/tests -t .

# Mobile
cd mobile && npm install && cd ..
npx expo start --web
```
