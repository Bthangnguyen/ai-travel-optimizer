# Walkthrough: Stateless Backend Migration & Redis Cache Cooldown

Bám sát quy tắc vận hành và bảo mật khắc nghiệt của module `state_store.py`, toàn bộ code cũ sử dụng RAM dict/list chạy ảo giác đã bị dập tắt hoàn toàn. 

## 1. Kết Nối Redis Phi Trạng Thái
- Toàn bộ backend FastAPI nay đã là **Stateless System**. Cấu trúc được áp dụng pattern `ConnectionPool` lazy-load của `redis-py`. 
- Nếu Container Backend bị tắt nóng và bật lại, hoặc scale up bằng k8s / Docker Swarm, mọi API `/reroute` tiếp theo vẫn hoạt động mượt mà vì dữ liệu trip json đang nằm vững chắc trên Container Redis.

## 2. Pydantic Strict Constraints
- Cả hai model `PlanRequest` và `RerouteRequest` đã được gài các expression Regex Pattern `^([01]\d|2[0-3]):[0-5]\d$` nhằm lọc Data Rác ngay tại cổng Guard của Controller. 
- Giới hạn min/max số lượng ứng cử viên (`max_candidates`) được enforce từ `contracts`. 

## 3. Hệ Thống Phanh Hãm (Rate Limit) Bằng Redis
- Thay vì để lọt các tín hiệu bấm nút spam `/reroute`, API nay chốt chặn bằng `check_reroute_cooldown()`. Nó chạy 1 lệnh cực nhẹ `SET EX NX` với Time To Live = 180s.
- Nếu client bấm vào nút định tuyến lại trước khi hết 3 Phút, một ngoại lệ custom sẽ được đẩy lên `main.py` để bắn thẳng về mã HTTP `429 Too Many Requests`.

## 4. Graceful Degradation (Kháng Lỗi Cập Bến)
- [!IMPORTANT]
- Thay vì 1 web app văng `500 Server Error` vô trách nhiệm khi database chết, giờ đây mọi hành vi tác động vào bộ nhớ (lưu lịch trình, kiểm tra trip, rate limit) đã được bao bọc trong Try/Catch Exception tới Middleware FastApi. 
- Mọi exception gốc từ thư viện cơ học `redis.exceptions.ConnectionError` đã bị che đậy và chuẩn hóa thành lỗi `HTTP 503 (Service Unavailable)`. Hệ thống sẽ luôn báo máy chủ bận và bảo vệ hệ thần kinh nội tại của hệ thống.
