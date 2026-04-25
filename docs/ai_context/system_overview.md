# Tổng Quan Hệ Thống: AI-Driven Dynamic Itinerary Optimizer

## Mục tiêu sản phẩm
Xây dựng ứng dụng di động cho phép người dùng nhập yêu cầu du lịch bằng ngôn ngữ tự nhiên (tiếng Việt / tiếng Anh), hệ thống sẽ tự động tạo lịch trình tối ưu và **tái lập lịch trình theo thời gian thực** khi có sự cố (trễ giờ, thời tiết xấu).

Địa bàn hiện tại: **Thành phố Huế, Việt Nam**.

---

## Kiến trúc tổng thể (4 lớp)

```
[Mobile App - Expo/RN]
        │  HTTP (JSON)
        ▼
[FastAPI - main.py]          ← Tầng 1: HTTP Gateway
        │
        ▼
[TripPlanner - planner.py]   ← Tầng 2: Orchestrator
   ├── PromptConstraintParser (parser.py)   ← Parse ngôn ngữ tự nhiên
   ├── POIRepository (repository.py)        ← Đọc & lọc dữ liệu POI
   ├── OSRMClient (osrm_client.py)          ← Tính ma trận di chuyển
   └── RoutingSolver (routing_solver.py)    ← Tầng 3 & 4: Tối ưu lộ trình
```

---

## Luồng xử lý chính: POST /plan

```
1. Client gửi PlanRequest { prompt, city, weather, origin, ... }
2. FastAPI → TripPlanner.plan()
3. Parser phân tích prompt → ConstraintBundle { budget_max, soft_tags, hard_start, hard_end, max_stops }
4. Repository đọc danh sách POI từ data/sample_pois.json, lọc theo city
5. Planner lọc & chấm điểm candidates (max 18 POI):
   - Loại bỏ: đã thăm, vượt ngân sách, ngoài trời khi mưa
   - Chấm điểm: tag match × 20 + priority × 3 + indoor bonus + affordability bonus
6. OSRMClient tính ma trận thời gian di chuyển (fallback: Haversine nếu OSRM offline)
7. RoutingSolver tối ưu lịch trình → trả về danh sách stops có giờ đến/đi
8. Trả về PlanResponse cho client
```

## Luồng xử lý: POST /reroute

```
1. Client gửi RerouteRequest { trip_id, trigger, visited_poi_ids, current_time }
2. Kiểm tra reroute cooldown (mặc định 180 giây, lưu trong Redis / in-memory)
3. Tải trip cũ từ TripStateStore
4. Điều chỉnh thời gian nếu trigger = "delayed" (cộng thêm minutes_late)
5. Chạy lại toàn bộ luồng /plan với:
   - exclude_poi_ids = visited_poi_ids
   - weather = "rain" nếu trigger = "rain"
   - current_time = thời gian hiện tại đã điều chỉnh
6. Trả về PlanResponse mới
```

---

## Các dịch vụ hạ tầng và trạng thái fallback

| Dịch vụ     | Khi có                         | Khi không có (fallback)                      |
|-------------|-------------------------------|----------------------------------------------|
| OSRM        | Ma trận thời gian chính xác   | Haversine (tính từ tọa độ GPS, ~30 km/h)     |
| OR-Tools    | Giải TSPTW tối ưu             | Greedy heuristic → Sequential fallback       |
| Redis       | Lưu trip state giữa sessions  | In-memory dict (mất khi restart server)      |
| PostGIS     | Query không gian cho POI      | Đọc từ file JSON tĩnh `data/sample_pois.json`|

**Quy tắc vàng:** Mọi tính năng PHẢI chạy được khi tất cả dịch vụ ngoài đều offline.

---

## Cấu trúc thư mục

```
ai-travel-optimizer/
├── .cursorrules              ← Luật cho AI (ĐỌC ĐẦU TIÊN)
├── backend/
│   ├── app/
│   │   ├── main.py           ← HTTP endpoints ONLY
│   │   ├── planner.py        ← Orchestrator
│   │   ├── parser.py         ← NLP → Constraints
│   │   ├── routing_solver.py ← OR-Tools / Greedy / Sequential
│   │   ├── osrm_client.py    ← Travel time matrix
│   │   ├── repository.py     ← POI data access
│   │   ├── state_store.py    ← Trip state (Redis / in-memory)
│   │   ├── models.py         ← Pydantic data models (SOURCE OF TRUTH)
│   │   ├── config.py         ← App settings từ env vars
│   │   └── utils.py          ← Helpers (parse_hhmm, strip_accents, ...)
│   ├── tests/                ← Unit & integration tests
│   └── requirements.txt
├── mobile/
│   ├── App.tsx               ← Main screen (dashboard)
│   └── src/
│       ├── api.ts            ← API calls ONLY
│       └── types.ts          ← TypeScript types (SOURCE OF TRUTH)
├── contracts/                ← JSON Schema cho API contracts
├── data/
│   └── sample_pois.json      ← POI data cho Huế (format chuẩn)
├── docs/
│   └── ai_context/           ← Tài liệu ngữ cảnh cho AI (thư mục này)
└── docker-compose.yml        ← Local infra
```
