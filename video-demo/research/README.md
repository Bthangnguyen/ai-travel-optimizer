# Dark Needle Visual DNA Research Pipeline

## Overview
Hệ thống 4 bước để phân tích 100 video của The Dark Needle bằng Gemini Flash 3,
rồi tổng hợp thành bộ Design System hoàn chỉnh.

## Pipeline Steps
1. `step1_collect_urls.js` — Thu thập tất cả URL video từ kênh YouTube
2. `step2_analyze_prompt.md` — Prompt chuẩn hóa cho Gemini Flash 3 phân tích từng video
3. `step3_run_batch.js` — Script tự động gửi từng video URL tới Gemini API
4. `step4_aggregate.js` — Tổng hợp tất cả JSON kết quả → Trích xuất 20/80 pattern

## Output
- `results/` — Thư mục chứa JSON phân tích từng video
- `design_system_final.json` — Bộ Design System hoàn chỉnh sau khi tổng hợp
