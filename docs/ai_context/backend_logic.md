# Backend Logic: Parser, Planner & Routing Solver

> Tài liệu này giải thích chi tiết các thuật toán cốt lõi của backend.
> Đọc kỹ trước khi chỉnh sửa bất kỳ file nào trong `backend/app/`.

---

## 1. Prompt Parser (`parser.py`)

Chuyển đổi chuỗi ngôn ngữ tự nhiên → `ConstraintBundle`. Parser hoạt động hoàn toàn bằng regex + heuristic, **không dùng LLM/AI**.

### Tag Recognition
```python
TAG_KEYWORDS = {
    "culture":  ["culture", "van hoa", "heritage", "royal", "lang tomb", "museum"],
    "history":  ["history", "historic", "lich su", "citadel", "imperial"],
    "food":     ["food", "am thuc", "eat", "bun bo", "coffee", "cafe"],
    "nature":   ["nature", "scenery", "song huong", "river", "garden", "park"],
    "spiritual":["pagoda", "temple", "spiritual", "tam linh", "chua"],
    "relax":    ["relax", "chill", "spa", "slow", "thu gian"],
}
```
- Input được chuẩn hóa về lowercase + bỏ dấu tiếng Việt qua `strip_accents()`.
- Từ khóa tiếng Việt không dấu được nhận diện (vd: "van hoa" → tag "culture").

### Budget Parsing (theo độ ưu tiên)
1. **Context match:** Tìm từ khóa ngân sách trước số tiền (vd: "budget 500k", "tối đa 1.2 triệu").
2. **Monetary unit match:** Tìm số có đơn vị tiền tệ (vd: "200 tr", "500000 vnd").
3. **Raw large number:** Tìm số >= 5 chữ số không có đơn vị (vd: "150000").
4. **Default:** `1_500_000 VND` nếu không tìm thấy.

Đơn vị được chuẩn hóa: `trieu/tr/m` → × 1,000,000 | `k/nghin` → × 1,000.

### Time & End-time
- Giờ bắt đầu: Regex `HH:MM`, mặc định `"08:00"`.
- Giờ kết thúc: Dựa vào từ khóa:
  - "ca ngay" / "full day" → `"20:30"`
  - "buoi toi" / "evening" → `"23:00"`
  - Mặc định → `"21:00"`

---

## 2. Candidate Filtering & Scoring (`planner.py`)

### Hard Filters (loại bỏ hoàn toàn)
1. POI nằm trong `exclude_poi_ids` → đã thăm hoặc bị loại trừ.
2. `poi.ticket_price > constraints.budget_max` → vượt ngân sách.
3. `weather == "rain" AND poi.outdoor == True` → ngoài trời khi mưa.

### Scoring Formula
```python
tag_score          = len(matching_tags) × 20
indoor_bonus       = 8 nếu indoor (outdoor = False)
affordability_bonus = max(0, 500_000 - ticket_price) // 20_000
total_score        = tag_score + poi.priority × 3 + indoor_bonus + affordability_bonus
```

Chọn top `max_candidates` (mặc định 18) POI có điểm cao nhất để đưa vào solver.

---

## 3. Routing Solver (`routing_solver.py`)

### Kiến trúc 3 lớp (KHÔNG ĐƯỢC PHÁ VỠ)

```
Lớp 1: OR-Tools TSPTW  →  Lớp 2: Greedy Heuristic  →  Lớp 3: Sequential
         (tối ưu nhất)           (nhanh, đủ tốt)            (đơn giản nhất)
```

- `fallback_level = 0`: OR-Tools thành công.
- `fallback_level = 1`: Greedy được dùng (OR-Tools không cài hoặc thất bại).
- `fallback_level = 2`: Sequential được dùng (Greedy không đặt được POI nào).

### Lớp 1: OR-Tools Solver
**Bài toán:** TSPTW (Traveling Salesman Problem with Time Windows).
- **Node 0:** Điểm xuất phát (origin), không phải POI.
- **Node 1..N:** Các POI ứng viên (tương ứng `pois[0..N-1]`).
- **Transit callback:** `matrix[from][to] + visit_minutes[from]` (bao gồm thời gian tham quan tại điểm rời đi).
- **Time window:** Mỗi POI có cửa sổ thời gian `[opens_at, closes_at]`.
- **Disjunction penalty:** POI bị bỏ qua sẽ mất điểm `5000 + priority × 200`. POI outdoor khi mưa có penalty = 1 (gần như bắt buộc bỏ).
- **Search:** PATH_CHEAPEST_ARC + GUIDED_LOCAL_SEARCH, timeout 2000ms.

### Lớp 2: Greedy Heuristic
Tại mỗi bước, chọn POI tiếp theo có **điểm thấp nhất** trong scoring tuple:
```python
score = (travel_minutes + wait_minutes + weather_penalty, ticket_price, -priority)
```
- `weather_penalty = 999` nếu POI outdoor và trời mưa (tránh nhưng không cấm).
- Điều kiện đặt được: POI phải có thể kết thúc trước `closes_at` và `hard_end`.

### Lớp 3: Sequential Fallback
- Sắp xếp POI theo `opens_at` (tăng dần) rồi `-priority` (giảm dần).
- Lần lượt đặt theo thứ tự, bỏ qua POI không khớp thời gian hoặc vượt ngân sách.

---

## 4. OSRM Client (`osrm_client.py`)

### Chế độ online
Gọi OSRM Table API: `GET /table/v1/driving/{coords}`.
Trả về ma trận thời gian di chuyển (giây), được chuyển sang phút.

### Chế độ offline (Haversine fallback)
```python
distance_km = haversine(lat1, lon1, lat2, lon2)
time_minutes = (distance_km / 30) × 60  # giả định 30 km/h
```

`matrix_source` trong response sẽ là `"osrm"` hoặc `"geometric-fallback"`.

---

## 5. State Store (`state_store.py`)

Lưu trip state sau mỗi lần plan/reroute để phục vụ reroute tiếp theo.

| Mode      | Kích hoạt khi              | TTL     |
|-----------|---------------------------|---------|
| Redis     | `REDIS_URL` env var có giá trị | 24 giờ  |
| In-memory | Redis không khả dụng      | Session (mất khi restart) |

**Reroute cooldown:** Mặc định 180 giây (cấu hình qua `REROUTE_COOLDOWN_SECONDS` env var).
