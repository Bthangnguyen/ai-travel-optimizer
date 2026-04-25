# AI Context Documentation

Thư mục này chứa tài liệu ngữ cảnh (context documentation) được thiết kế đặc biệt để các AI Coding Assistants (Cursor, GitHub Copilot, Antigravity,...) đọc và hiểu codebase trước khi sinh code.

## Danh sách tài liệu

| File | Nội dung | Khi nào cần đọc |
|------|----------|-----------------|
| `system_overview.md` | Kiến trúc 4 lớp, luồng dữ liệu, cấu trúc thư mục | Khi bắt đầu làm bất kỳ tính năng nào |
| `data_models.md` | Định nghĩa POI, API request/response, field names | Khi làm việc với data, API, hoặc UI |
| `backend_logic.md` | Parser, scoring formula, OR-Tools/Greedy/Sequential | Khi sửa backend business logic |
| `development_workflow.md` | Prompt templates, Git convention, task dependencies | Khi cần hỏi AI viết code hoặc setup môi trường |

## Ưu tiên đọc

Nếu bạn chỉ có thời gian đọc 1 file, hãy đọc `system_overview.md`.
Nếu bạn đang làm Task 3 (Data Scraping), đọc `data_models.md` phần POI model.
Nếu bạn đang làm Task 4 (UI), đọc `data_models.md` phần API Endpoints.
