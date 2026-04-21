# Debug Render — Sửa lỗi render, visual glitch, timing sai

## Mục đích
Quy trình debug có hệ thống khi video render ra bị lỗi hình ảnh, timing sai,
hoặc crash giữa chừng.

## Khi nào dùng
- Render ra video bị blank/đen
- Animation timing bị lệch
- Elements bị overlap hoặc mất vị trí
- Console báo lỗi khi render

## Các bước

### Bước 1: Xác định loại lỗi
Chạy render 1 frame tại vị trí lỗi:
```bash
npx remotion still [comp-id] --frame=[frame_number] --scale=0.25
```

Phân loại:
- **Blank frame** → Element chưa xuất hiện hoặc đã biến mất (timing)
- **Overlap** → Z-index hoặc position conflict
- **Wrong color** → Hardcode thay vì DNA token
- **Crash** → Import error hoặc undefined props

**Tại sao render 1 frame:** Nhanh hơn 100x so với render full video.
Pinpoint chính xác frame có vấn đề.

### Bước 2: Kiểm tra timing
Verify rằng animation nằm trong range đúng:
```typescript
// Element chỉ hiện khi frame >= delay VÀ frame < delay + duration
const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {
  extrapolateLeft: 'clamp',   // ← PHẢI CÓ
  extrapolateRight: 'clamp',  // ← PHẢI CÓ
});
```

**Lỗi phổ biến nhất:** Quên `extrapolateLeft/Right: 'clamp'` → giá trị
tràn ra ngoài [0,1] → element bị âm opacity hoặc scale quá lớn.

### Bước 3: Kiểm tra Scene boundaries
```typescript
// Scene wrapper phải filter frame range đúng
if (frame < start || frame >= end) return null;
```

**Lỗi phổ biến:** Dùng `<=` thay vì `<` cho end → 2 scene overlap 1 frame.

### Bước 4: Kiểm tra Camera wrapper
Nếu dùng Camera component, verify:
1. Camera keyframes cover toàn bộ duration
2. Không có gap giữa 2 keyframe liên tiếp
3. Scale values hợp lý (0.8 - 3.5 range)

### Bước 5: Re-render và verify
```bash
npx remotion still [comp-id] --frame=[fixed_frame] --scale=0.25
```

Nếu vẫn lỗi, render 3 frames liên tiếp (frame-1, frame, frame+1) để xem
transition giữa các state.

## Output
- Fixed source code
- Screenshot xác nhận fix thành công

## Kiểm tra Chất lượng
- [ ] Lỗi đã được reproduce bằng single-frame render
- [ ] Root cause đã xác định (timing? z-index? import?)
- [ ] Fix đã verify bằng re-render
- [ ] Không introduce regression ở scenes khác
