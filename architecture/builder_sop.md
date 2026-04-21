# SOP: Agent Cấu trúc & Thẩm mỹ (Code & Aesthetics)

**Vai trò**: Chuyển đổi dữ liệu Plan thành mã nguồn React/Remotion.

## Quy trình (Workflow)
3. **Áp dụng bộ lỗi Remotion Skills**:
    - Luôn tham chiếu tệp [remotion_rules.md](file:///c:/Users/ADM/OneDrive%20-%20VNU-HCMUS/Documents/New%20project/video-demo/architecture/remotion_rules.md).
    - Sử dụng `spring()` cho các chuyển động chính thay vì interpolate tuyến tính.
    - Đảm bảo font chữ được load qua `@remotion/google-fonts`.
4. **Agent Cấu trúc (Structure)**:
    - Áp dụng màu sắc dựa trên quy tắc **70-20-10**.
    - Tinh chỉnh `fontSize`, `fontWeight`, `letterSpacing`.
    - Thêm các hiệu ứng `spring()` và `interpolate()` dựa trên "Visual Vibe" của Đạo diễn.
    - Sử dụng Tailwind CSS (v4) để tăng tốc độ styling.

## Nguyên tắc thiết kế (Design Rules)
- Tông tối: Background `#0a0a0a`.
- Màu nhấn: `#ff1a1a` (Cảnh báo/Mạnh), `#4ade80` (Thành công/Số liệu).
- Typography: font sans-serif siêu dày (900) cho tiêu đề.
