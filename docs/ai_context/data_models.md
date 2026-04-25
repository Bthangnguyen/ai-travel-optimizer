# Data Models & API Contracts

> **Nguồn chân lý (Source of Truth):**
> - Backend (Python): `backend/app/models.py`
> - Mobile (TypeScript): `mobile/src/types.ts`
> - API Schema: `contracts/`
>
> Mọi thay đổi cấu trúc dữ liệu PHẢI cập nhật đồng bộ TẤT CẢ 3 nơi trên.

---

## Core Models

### POI (Point of Interest)
Đây là đơn vị dữ liệu cơ bản của hệ thống. Mọi tính năng đều xoay quanh model này.

```python
# backend/app/models.py
class POI(BaseModel):
    poi_id: str          # ID duy nhất, ví dụ: "hue_hoangthanh"
    city: str            # Thành phố, mặc định "hue"
    name: str            # Tên địa điểm tiếng Việt
    lat: float           # Vĩ độ (latitude)
    lon: float           # Kinh độ (longitude)
    tags: list[str]      # Nhãn phân loại: ["culture", "history", "food", "nature", "spiritual", "relax"]
    visit_minutes: int   # Thời gian tham quan (phút)
    ticket_price: int    # Giá vé (VND), 0 nếu miễn phí
    opens_at: str        # Giờ mở cửa, format "HH:MM" (ví dụ: "07:30")
    closes_at: str       # Giờ đóng cửa, format "HH:MM"
    outdoor: bool        # True nếu là địa điểm ngoài trời
    priority: int        # Độ ưu tiên 1-10 (10 = quan trọng nhất)
    description: str     # Mô tả ngắn, có thể để trống ""
```

> **Quan trọng cho Task 3 (Data Scraper):** Dữ liệu cào về PHẢI được format đúng theo model này trước khi lưu vào `data/sample_pois.json`. Đặc biệt chú ý `opens_at`/`closes_at` phải là string "HH:MM".

---

### ConstraintBundle
Kết quả parse từ prompt của người dùng.

```python
class ConstraintBundle(BaseModel):
    budget_max: int = 1_500_000    # Ngân sách tối đa (VND)
    soft_tags: list[str] = []      # Tags mong muốn từ prompt
    hard_start: str = "08:00"      # Giờ bắt đầu (bắt buộc)
    hard_end: str = "21:00"        # Giờ kết thúc (bắt buộc)
    max_stops: int = 6             # Số điểm tối đa (1-10)
    avoid_outdoor_in_rain: bool = True
    source: str = "heuristic-structured-parser"
    notes: list[str] = []          # Ghi chú tự động từ parser
```

---

## API Endpoints

### POST /plan
**Mục đích:** Tạo lịch trình mới từ prompt.

**Request:**
```json
{
  "prompt": "Đi thăm Huế 1 ngày, thích văn hóa và ăn uống, ngân sách 500k",
  "city": "hue",
  "weather": "clear",
  "current_time": "08:00",
  "max_candidates": 18,
  "origin": {
    "name": "Hue City Center",
    "lat": 16.4637,
    "lon": 107.5909
  },
  "exclude_poi_ids": [],
  "constraint_override": null
}
```

**Response (PlanResponse):**
```json
{
  "trip_id": "a1b2c3d4e5f6",
  "prompt_snapshot": "Đi thăm Huế 1 ngày...",
  "city": "hue",
  "weather": "clear",
  "engine_used": "ortools",
  "fallback_level": 0,
  "constraints": { "budget_max": 500000, "soft_tags": ["culture", "food"], ... },
  "origin": { "name": "Hue City Center", "lat": 16.4637, "lon": 107.5909 },
  "itinerary": [
    {
      "poi_id": "hue_hoangthanh",
      "name": "Hoàng Thành Huế",
      "lat": 16.4698,
      "lon": 107.5796,
      "arrival_time": "08:15",
      "departure_time": "10:15",
      "travel_minutes": 15,
      "visit_minutes": 120,
      "ticket_price": 200000,
      "outdoor": true,
      "tags": ["culture", "history"]
    }
  ],
  "discarded_pois": [
    { "poi_id": "...", "name": "...", "reason": "Single-stop cost exceeds the trip budget." }
  ],
  "diagnostics": {
    "parsed_tags": ["culture", "food"],
    "candidate_count": 12,
    "matrix_source": "osrm",
    "notes": ["OR-Tools is not installed; greedy fallback was used."]
  }
}
```

**`fallback_level` legend:**
- `0` = OR-Tools (tối ưu nhất)
- `1` = Greedy heuristic
- `2` = Sequential (đơn giản nhất)

---

### POST /reroute
**Mục đích:** Tái lập lịch trình khi có sự cố.

**Request (xem `contracts/reroute-request.schema.json`):**
```json
{
  "trip_id": "a1b2c3d4e5f6",
  "trigger": {
    "kind": "delayed",
    "minutes_late": 30
  },
  "current_time": "09:30",
  "visited_poi_ids": ["hue_hoangthanh"],
  "weather": null,
  "prompt": null
}
```

**Trigger kinds:**
- `"delayed"`: Người dùng bị trễ `minutes_late` phút → hệ thống cộng thêm vào thời gian hiện tại.
- `"rain"`: Trời mưa → hệ thống loại toàn bộ POI `outdoor = true`.
- `"geofence"`: Người dùng đã đến vị trí POI (chưa triển khai đầy đủ).

**Response:** Giống hệt `PlanResponse` của `/plan`.

---

### GET /health
```json
{ "status": "ok" }
```

---

## Quy tắc đặt tên field
| Python (snake_case) | TypeScript (giữ nguyên snake_case) | Ghi chú |
|---|---|---|
| `trip_id` | `trip_id` | API dùng snake_case, KHÔNG chuyển sang camelCase |
| `poi_id` | `poi_id` | |
| `arrival_time` | `arrival_time` | Format "HH:MM" |
| `ticket_price` | `ticket_price` | Đơn vị: VND (số nguyên) |
| `visit_minutes` | `visit_minutes` | Đơn vị: phút |
| `travel_minutes` | `travel_minutes` | Đơn vị: phút |
