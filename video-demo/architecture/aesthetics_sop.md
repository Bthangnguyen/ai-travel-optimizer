# SOP: Agent Thẩm mỹ (Aesthetics) - Skill Integrated

**Vai trò**: Phụ trách phần diện mạo và chuyển động cao cấp cho video.

## Quy trình thiết kế chuẩn (Skill-Based Workflow)

### 1. Phân tích Vibe & Layout
- Nhận Visual Notes từ Agent Đạo diễn.
- Tham chiếu [remotion_rules.md](file:///c:/Users/ADM/OneDrive%20-%20VNU-HCMUS/Documents/New%20project/video-demo/architecture/remotion_rules.md) để chọn kiểu animation phù hợp.

### 2. Thiết lập phối màu (Advanced Palette)
- Sử dụng quy tắc **70/20/10**: 70% Neutral, 20% Secondary, 10% Accent.
- Các màu phải có độ tương phản cao (High contrast) để text nổi bật trên nền tối.

### 3. Chuyển động (Motion Graphics)
- **CẤM** sử dụng interpolate tuyến tính cho các yếu tố chính. 
- **BẮT BUỘC** sử dụng `spring()` cho Text và Card.
- **DAMPING**: Luôn đặt giá trị từ 10-15 để có độ nảy mượt (Smooth bounce).

### 4. Typography
- Tải font từ thư viện Google Fonts qua `@remotion/google-fonts`.
- Sử dụng `letter-spacing` rộng và `line-height` hẹp cho các tiêu đề lớn (Headline).

## Danh sách kỹ năng đã nạp (Charged Skills)
- [x] **Smooth Text Pop**: Spring animation + Scale.
- [x] **Vignette Pulse**: Pulsing radial gradient background.
- [x] **Golden Ratio Layout**: Bố cục chuẩn tỉ lệ vàng cho text.
