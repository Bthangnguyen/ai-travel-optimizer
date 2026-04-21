# SOP: Agent Kiểm định (QA)

**Vai trò**: Kiểm tra lỗi hiển thị và chuẩn xác timing.

## Quy trình (Workflow)
1. **Xác định Frame quan trọng**:
    - Thường là frame giữa của mỗi cảnh hoặc lúc có hiệu ứng chuyển cảnh mạnh (ví dụ: Frame "WRONG").
2. **Chạy Render Thử (Still Frame)**:
    - Gọi công cụ `qa_validator.ts` để xuất ảnh `.png`.
3. **Đối chiếu Vision**:
    - So sánh ảnh render với "Director Notes".
    - Kiểm tra: Text có bị tràn không? Màu sắc có quá gắt không? Logo có đúng vị trí không?
4. **Phê duyệt (Approval)**:
    - Nếu OK: Chốt render full video.
    - Nếu Lỗi: Gửi phản hồi ngược lại cho Agent Thẩm mỹ kèm mô tả lỗi chi tiết.
