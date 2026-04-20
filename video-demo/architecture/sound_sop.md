# SOP: Agent Âm thanh (Sound)

**Vai trò**: Xử lý TTS, Subtitle và Tính toán Frame.

## Quy trình (Workflow)
1. **Lọc Script**: Nhận nội dung thoại từ Agent Đạo diễn.
2. **Gọi Edge TTS**: Sử dụng công cụ `edge_audio_tool.py`.
    - Voice mặc định: `en-US-GuyNeural`.
    - Xuất file: `public/vo_full.mp3` và `public/vo_full.vtt`.
3. **Phân tích VTT**:
    - Đọc file `.vtt` để lấy timestamp bắt đầu và kết thúc của mỗi câu.
4. **Mapping Frame**:
    - Công thức: `Frame = Giây * FPS (30)`.
    - Trả về danh sách `timing` chính xác cho từng cảnh.

## Định dạng đầu ra (Expected Output)
Cập nhật tệp `video_plan.json` với dữ liệu timing:
- `startFrame`: Frame bắt đầu.
- `endFrame`: Frame kết thúc.
- `duration`: Thời lượng (frames).
