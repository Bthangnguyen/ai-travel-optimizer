# Quy tắc Remotion Skills: Nâng cấp Motion Graphics

Bộ quy tắc này được đúc kết từ `remotion-dev/skills`, giúp Agent tạo ra các video có hiệu ứng mượt mà (Premium feeling).

## 1. Nguyên lý Animation (Chuyển động)

### A. Sử dụng `spring()` thay vì `interpolate()` tuyến tính
Spring tạo cảm giác vật lý và tự nhiên hơn.
- **Tham số chuẩn**: `{ fps, frame: frame - delay, config: { damping: 12, stiffness: 100 } }`.
- **Ứng dụng**: Cho Text pop-up, Card slide-in.

### B. Kỹ thuật `interpolate()` nâng cao
- Luôn sử dụng `extrapolateLeft: 'clamp'` và `extrapolateRight: 'clamp'` để tránh lỗi nhảy frame.
- Sử dụng mảng đa điểm: `[0, 0.2, 0.8, 1]` thay vì `[0, 1]` để tạo nhịp điệu (Rhythm).

## 2. Typography & Layout (Chữ và Bố cục)

### A. Text Animation Patterns
- **Letter-by-letter**: Chia text thành mảng ký tự và áp dụng delay dựa trên index.
- **Scale-in-blur**: Kết hợp `scale` và `filter: blur()` để tạo cảm giác cinematic.

### B. Tailwind CSS (v4)
- Ưu tiên sử dụng utility classes cho layout.
- Không hardcode màu sắc, dùng biến HSL hoặc hex tập trung trong `video_plan.json`.

## 3. Media & Assets (Tài nguyên)

### A. Transparent Video
- Sử dụng `staticFile('video.webm')` cho các hiệu ứng nền có độ trong suốt.

### B. Font Loading
- Sử dụng `loadFont` từ `@remotion/google-fonts` để đảm bảo font được load trước khi render frame đầu tiên.

## 4. Kiểm tra kỹ thuật (Technical Audit)

1. **FPS**: Phải là 30.
2. **Metadata**: Phải sử dụng `useVideoConfig()` để lấy kích thước động, không hardcode 1920x1080.
3. **Audio**: Luôn có fade-in (10 frames) và fade-out (30 frames) ở cuối video.
