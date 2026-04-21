# Quick Scan — Kiểm tra nhanh video có atom mới không

## Mục đích
Quét nhanh 5 frame từ video để xác định có pattern mới cần extract không.
Tiết kiệm thời gian khi chỉ cần đánh giá sơ bộ.

## Khi nào dùng
- User nói "xem nhanh video này có gì mới không"
- User muốn đánh giá trước khi chạy full extraction
- Video dài (>15 phút), cần lọc trước

## Các bước

### Bước 1: Mở video và chụp 5 frames
Chụp tại các mốc: 10%, 30%, 50%, 70%, 90%.

**Tại sao:** 5 frames đủ để cover phần mở đầu, giữa và kết — nơi phần lớn
pattern layout xuất hiện. Bỏ 0% (thường là intro/logo) và 100% (thường là outro).

### Bước 2: Phân loại nhanh từng frame
Với mỗi frame, trả lời 3 câu:
1. Layout này đã có trong thư viện chưa? (Center/Chain/Radial/Split/Grid/...)
2. Có motion pattern mới nào không? (kiểu animate chưa thấy trước đó)
3. Có connection type mới không? (đường nối, bracket, path curve...)

### Bước 3: Báo cáo kết quả
Tổng hợp thành bảng:

```
| Frame | Layout | Mới? | Ghi chú |
|-------|--------|------|---------|
| 10%   | Radial | ❌   | Giống center+children |
| 30%   | Grid   | ✅   | Ma trận 3x2, chưa có |
| ...   | ...    | ...  | ...     |
```

**Nếu có ≥1 atom mới:** Gợi ý chạy `workflows/full-extraction.md`
**Nếu không có gì mới:** Báo "Video này dùng patterns đã có. Không cần extract."

## Output
- Bảng tổng hợp 5 frames
- Khuyến nghị: chạy full extraction hay bỏ qua

## Kiểm tra Chất lượng
- [ ] Đã chụp đúng 5 frames tại 5 mốc
- [ ] Mỗi frame được so sánh với atom registry hiện có
- [ ] Kết luận rõ ràng: có/không có atom mới
