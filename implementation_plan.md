# Dev 5: State Management & API Glue Implementation Plan

Mục tiêu cốt lõi của Dev 5 là xoá bỏ hoàn toàn state lưu trên RAM (Stateless server), đảm bảo tính ổn định và bảo mật cao thông qua Redis, bổ sung rate limit để tránh spam reroute, và tuân thủ chặt chẽ Pydantic Strict Mode cho Request/Response Schema. 

## User Review Required

> [!CAUTION]
> Chuyển đổi mã nguồn hoàn toàn sang Redis đồng nghĩa Local Development cũng **BẮT BUỘC** phải có Redis chạy ngầm (hoặc chạy qua `docker-compose`). Nếu không có Redis, hệ thống sẽ trả về lỗi 503 (Graceful Degradation) và không thể thử nghiệm. Bạn cần xác nhận đã cấu hình sẵn Redis ở cổng 6379 tại Local.

## Proposed Changes

### 1. Module Liên Kết: `backend/app/state_store.py`

*   **Xoá toàn bộ dict(RAM):** `_memory_trips` và `_memory_reroute_at` bị xóa trắng. 
*   **Redis Connection Pool:** Thiết lập `ConnectionPool` lấy `REDIS_URL` từ `os.getenv("REDIS_URL")`, fallback về `redis://redis:6379/0`.
*   **Graceful Degradation (Xử lý lỗi Redis sập):** Toàn bộ hàm thao tác Redis đều được bọc trong `try...except redis.exceptions.ConnectionError`. Nếu sập, raise Custom Exception: `DatabaseUnavailableException`.
*   **Hàm `save_trip_state`:** Thay thế `save_trip` hiện tại. Lưu trữ đối tượng `trip` dưới dạng JSON bằng hàm `_redis.set()`.
*   **Hàm `check_reroute_cooldown`:** Thiết lập rate limit 180 giây (3 phút) dùng toán tử `SET EX NX`. Cấu trúc: `self._redis.set(f"reroute:{trip_id}", "locked", nx=True, ex=180)`. Nếu return `False` hoặc `None`, chứng tỏ user spam và sẽ bắn ra lỗi `RerouteCooldownException`.

### 2. Module Ràng Buộc: `backend/app/models.py`

*   **Áp dụng Pydantic Strict Mode:** Cập nhật các properties dựa chính xác theo định nghĩa ở `contracts/*.schema.json`.
    *   `PlanRequest.prompt`: Bổ sung ràng buộc `min_length=1`.
    *   Thêm quy tắc validate cho `current_time` đối với `PlanRequest` và `RerouteRequest` theo Regex `^([01]\d|2[0-3]):[0-5]\d$`.
    *   Các trường mặc định cập nhật chuẩn xác.

### 3. API Glue / Endpoints: `backend/app/main.py`

*   **Error Handling (Catch Exception):**
    *   Bắt lỗi `DatabaseUnavailableException` -> Trả về `HTTPException(status_code=503, detail="Hệ thống quá tải (Service Unavailable).")`.
    *   Bắt lỗi `RerouteCooldownException` -> Trả về `HTTPException(status_code=429, detail="Quá nhiều yêu cầu. Vui lòng đợi trong vòng 3 phút.")` (Hệ thống Phanh).
*   **Refactor logic API `/plan` và `/reroute`:**
    *   Thay `state_store.save_trip` thành `state_store.save_trip_state`.
    *   Thay `state_store.allow_reroute` thành `state_store.check_reroute_cooldown` trước khi tiến hành tính toán lại.

## Open Questions

> [!WARNING]
> Việc vá GAP #2 về hiện tượng trượt định vị GPS (Geofencing Drift) có liên quan đến việc Dev 7 / Dev 6 truyền tọa độ, tôi đang quy ước Dev 5 chỉ cung cấp "bức tường lửa" là rate-limit 3 phút theo đúng Document. Bạn có muốn điều chỉnh thông số này thành 5 phút không hay để y nguyên như Rule là 180s? 
> 
> Vui lòng phản hồi 'Đồng ý' để tôi khởi chạy bước Code Execution!

## Verification Plan

### Automated/Manual Tests
- Tạo request tới POST `/plan`, bắt buộc service trả về 1 chuyến đi JSON.
- Nhanh chóng tạo request tới POST `/reroute` với `trip_id` vừa nhận -> Kỳ vọng bị từ chối với `429 Too Many Requests`.
- Can thiệp tay tắt module Redis -> Chạy endpoint -> Kỳ vọng báo lỗi `503 Service Unavailable`.
