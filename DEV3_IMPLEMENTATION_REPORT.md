# BÁO CÁO TRIỂN KHAI DEV3 (LLM OPS GATEWAY)

## 1) Mục tiêu theo DEV3
Mục tiêu của Dev3 là xây dựng lớp “Gateway ép kiểu” giữa ngôn ngữ tự nhiên và hệ thống tối ưu lộ trình:
- Bắt buộc đầu ra luôn là cấu trúc JSON hợp lệ theo schema.
- Không để downstream (`parse -> filter -> matrix -> solve`) bị gãy do output LLM lỗi.
- Có fallback an toàn khi LLM/API gặp sự cố.
- Tích hợp vào `POST /plan` theo luồng end-to-end.

---

## 2) Phạm vi đã triển khai

### 2.1. Cứng hóa parser (`backend/app/parser.py`)
Đã thay parser heuristic sang parser structured output với Pydantic + Instructor:
- Model dữ liệu:
  - `TimeWindow`
  - `StructuredPlanInput` (`budget_max`, `soft_tags`, `hard_start`, `Time_Windows`, `ambiguity_notes`, `parser_notes`)
- System prompt phòng thủ, ép mô hình trả đúng schema.
- Chuẩn hóa dữ liệu:
  - Thời gian (`HH:MM`, `9h30`, ISO datetime, clamp `24:xx` -> `23:59`)
  - Tiền tệ (`tr`, `k`, `m`, `tỷ`, định dạng `1.500.000,50đ`, ngôn ngữ thường như `nửa triệu`, `2 củ rưỡi`)
  - Danh sách tag/notes từ chuỗi hoặc list.
- Chống nghịch lý thời gian:
  - End < Start: clamp hợp lý (overnight day-trip -> `23:59`, hoặc kéo về `start`)
  - Duration quá ngắn: tự nới tối thiểu 30 phút.

### 2.2. Safe Default (an toàn hệ thống)
Đã cập nhật mặc định theo hướng “không triệt tiêu nghiệm”:
- `budget_max = 10_000_000`
- `soft_tags = []`
- `hard_start = "08:00"`
- `Time_Windows = [{"start":"08:00","end":"22:00","label":"default_day_window"}]`

Khi LLM fail, parser luôn trả object hợp lệ từ safe default, không ném vỡ luồng.

### 2.3. Cơ chế async + provider runtime
Đã triển khai parser async:
- `parse_structured_async(...)`
- `parse_async(...)`
- Giữ tương thích sync (`parse(...)`, `parse_structured(...)`) cho code cũ.

Đã tích hợp provider runtime:
- `AsyncOpenAI` client + `instructor.from_openai(...)`
- Base URL theo provider (OpenAI/Gemini OpenAI-compatible endpoint)
- Retry + timeout cấu hình qua settings.

### 2.4. Tích hợp endpoint `POST /plan` end-to-end
Đã refactor endpoint theo async flow:
1. Nhận prompt từ request.
2. `await intent_parser.parse_structured_async(prompt)`.
3. Chuyển structured result sang planner (`plan_with_structured_input(...)`).
4. Trả kết quả plan cho client.

Đã thêm guard endpoint:
- `ValueError` -> HTTP 400
- Lỗi khác -> HTTP 500 (graceful)

### 2.5. Cấu hình hệ thống (`backend/app/config.py`)
Đã mở rộng settings:
- `.env` loading
- `llm_provider`, `llm_model`, `llm_timeout_seconds`, `llm_max_retries`
- `openai_api_key`, `gemini_api_key`
- `llm_openai_base_url`, `llm_gemini_base_url`
- Validation key theo provider + chọn base URL phù hợp.

---

## 3) Test strategy và bộ test đã bổ sung

### 3.1. Test nền parser
File:
- `backend/tests/test_parser.py`

Bao gồm:
- Input chuẩn
- Input mơ hồ/xung đột
- Garbage / prompt injection-like
- LLM fail cưỡng bức -> fallback an toàn

### 3.2. Robust suite lớn (tiếng Việt-first)
File:
- `backend/tests/test_parser_robust_cases.py`

Đã mở rộng dần đến các nhóm:
- Prompt Việt colloquial, dài, đa ngôn ngữ
- Xung đột logic thời gian
- Định dạng tiền tệ hiểm hóc
- Prompt injection/jailbreak/system prompt leak attempts
- Mơ hồ cực độ, emoji-only, thời gian tương đối, thực thể địa chỉ

Kết quả run cuối cho full suite parser/api/routing:
- `63 passed`

---

## 4) Script benchmark & real-provider evaluation

### 4.1. Benchmark endpoint
File:
- `backend/scripts/benchmark_plan_endpoint.py`

Kết quả benchmark đã chạy:
- `iterations=30`
- `success_count=30`
- `avg_ms=3022.94`
- `p50_ms=3019.07`
- `p95_ms=3036.80`
- `p99_ms=3058.83`

### 4.2. Real provider eval nhiều prompt
File:
- `backend/scripts/run_real_provider_parser_eval.py`

Script chạy 25 prompt thật, ghi:
- từng mẫu output
- fallback hay không
- latency từng request + tổng hợp p50/p95

---

## 5) Nhật ký chạy provider thật (quan trọng)

### Giai đoạn A: Gemini key chưa usable quota
- Model: `gemini-2.0-flash`
- Kết quả: `success=0`, `hard_fallbacks=25`
- Lỗi gốc sau khi bật debug:
  - HTTP 429 quota exceeded
  - free-tier metrics limit = 0

### Giai đoạn B: sau khi thay đổi billing/key
- Vẫn `gemini-2.0-flash`
- Lỗi đổi sang:
  - HTTP 404 model deprecated / no longer available for new users

### Giai đoạn C: chuyển model + tuning runtime
Runtime:
- `LLM_PROVIDER=gemini`
- `LLM_MODEL=gemini-2.5-flash`
- `LLM_TIMEOUT_SECONDS=12`
- `LLM_MAX_RETRIES=2`

Kết quả chạy thật (25 prompts):
- `success=25`
- `hard_fallbacks=0`
- `avg_ms=4197.29`
- `p50_ms=3312.94`
- `p95_ms=11768.66`

Kết luận:
- Structured parsing qua client thật đã chạy end-to-end thành công.
- Safe fallback vẫn giữ vai trò bảo hiểm khi provider lỗi.

---

## 6) Đánh giá theo acceptance của DEV3

### Đã đạt
- Có lớp ép kiểu cứng bằng Pydantic + Instructor.
- Parser không trả text tự do, luôn trả object cấu trúc hợp lệ.
- Có retry và fallback an toàn.
- Có test chống sập/garbage/jailbreak/failure.
- Đã tích hợp vào `POST /plan`.
- Đã chạy provider thật và có bằng chứng số liệu.

### Chưa đạt hoàn toàn
- Mục tiêu latency `<1s` chưa đạt trong real LLM run (p50 ~3.3s ở run thành công).

---

## 7) Trạng thái hiện tại
- **Parser gateway Dev3: hoàn thiện chức năng cốt lõi và an toàn hệ thống.**
- **Real provider path: đã chạy thật thành công (25/25 non-fallback ở cấu hình model/runtime phù hợp).**
- **Cần tối ưu tiếp nếu muốn đạt SLA `<1s` thực chiến.**

---

## 8) Đề xuất bước tiếp theo (nếu tiếp tục tối ưu)
1. Rút ngắn system prompt + giảm field optional.
2. Bật fast-path heuristic trước khi gọi LLM cho prompt đơn giản.
3. Giảm retry động theo loại lỗi (timeout/429/5xx).
4. Cache kết quả parse cho prompt gần trùng.
5. Tách profile latency riêng parser vs planner để khoanh vùng bottleneck.
