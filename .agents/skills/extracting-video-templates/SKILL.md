---
name: extracting-video-templates
description: >
  Phân tích video mẫu để trích xuất các Composable Atoms (nguyên tử thị giác) và sinh
  component Remotion TSX tái sử dụng. Kích hoạt khi người dùng nói: 'extract template',
  'nạp template mới', 'phân tích video này', 'thêm atom từ video', 'học phong cách này',
  'reverse engineer video', 'tách atom từ link', 'bổ sung thư viện từ video'.
  KHÔNG dùng cho: render video, debug animation, tạo kịch bản JSON, sửa lỗi code,
  chỉnh sửa atom đã có, hoặc các tác vụ không liên quan đến trích xuất template mới.
---

# Extracting Video Templates — Composable Atom System

Trích xuất các khối xây dựng cơ bản (Atoms) từ video mẫu, sau đó sinh component
Remotion TSX có thể kết hợp với nhau để tạo ra các hiệu ứng phức tạp.

---

## Khi nào dùng

- User chia sẻ link YouTube hoặc file video và muốn "extract template"
- User nói "nạp template mới", "phân tích video", "thêm atom"
- User muốn mở rộng thư viện atom với các pattern mới
- User nói "học phong cách này" hoặc "reverse engineer video này"

## Khi nào KHÔNG dùng

- User muốn render/xuất video → dùng Remotion CLI
- User muốn sửa lỗi animation đang có → debug trực tiếp trong code
- User muốn tạo kịch bản JSON mới → dùng tools/plan_processor.js
- User muốn chỉnh sửa atom đã tồn tại → sửa trực tiếp file trong src/atoms/

---

## Core Philosophy

**KHÔNG extract scene hoàn chỉnh.** Extract các ATOMS — khối xây dựng nhỏ nhất.
Complex scenes chỉ là tổ hợp của các atoms đơn giản:

```
center + children + line + camera_sweep = "Center+Children Radial Layout"
word + word + line + camera_pan        = "Word→Word Chain"
center + center + line                 = "Multi-Center Flow"
```

**KHÔNG extract icons.** Icons là content, không phải structure. Chỉ extract template pattern.

---

## Workflow Routing

| Workflow | Khi nào dùng |
|----------|-------------|
| `workflows/quick-scan.md` | Cần kiểm tra nhanh video có atom mới không (5 frames, ~3 phút) |
| `workflows/full-extraction.md` | Trích xuất đầy đủ, sinh code, test compose (20 frames, ~15 phút) |

---

## Atom Architecture

Đọc chi tiết tại `references/atom-layers.md`. Tóm tắt 5 tầng:

| Tầng | Vai trò | Ví dụ |
|------|---------|-------|
| **Layout** | Vị trí trên màn hình | Center, Chain, Radial, Grid, Stack |
| **Connection** | Quan hệ giữa elements | Line, Arrow, Bracket, Path |
| **Content** | Nội dung hiển thị | Word, BoxWord, Badge, Number |
| **Motion** | Cách animate | BlurIn, ScaleSlam, SlideIn, PopIn |
| **Camera** | Di chuyển viewport | StaticZoom, Sweep, Pullback, Dolly |

Composition Formula:
```
SCENE = Layout(positions) + Content(nodes) + Connection(links) + Motion(animations) + Camera(viewport)
```

---

## Output

**Loại:** Remotion TSX Components
**Vị trí:** `src/atoms/`
**Files tạo ra:**
- `src/atoms/[AtomName].tsx` — Component atom mới
- `src/atoms/index.ts` — Updated barrel export
- `resources/design-tokens.json` — Updated atom registry

---

## Tiêu chí Chất lượng

Output TỐT vs XẤU:

| TỐT ✅ | XẤU ❌ |
|--------|--------|
| Atom là pure function của (position, timing, style) | Atom chứa logic nghiệp vụ hoặc hardcode content |
| Atom accepts `delay` prop cho sequencing | Timing cố định, không compose được |
| Dùng DNA tokens (`C.bg`, `C.yellow`) | Hardcode hex colors |
| Dùng `interpolate` + `Easing` từ Remotion | CSS keyframes hoặc thư viện animation ngoài |
| Composable: atom A + atom B tạo scene mới | Monolithic: 1 component = 1 scene duy nhất |
| Có ít nhất 2 ví dụ compose với atoms hiện có | Không test khả năng kết hợp |

---

## References

- `references/atom-layers.md` — Chi tiết 5 tầng atom với bảng existing/missing
- `references/composition-examples.md` — Ví dụ thực tế kết hợp atoms thành scenes
- `resources/design-tokens.json` — Registry atom hiện tại (nguồn sự thật duy nhất)

---

## QA Checklist

Trước khi đánh dấu atom hoàn thành, verify TẤT CẢ:

```
□ 1. Pure function — không internal state ngoài useCurrentFrame()
□ 2. Tất cả colors dùng DNA tokens (C.bg, C.yellow, etc.)
□ 3. Accepts delay prop cho sequencing
□ 4. Hoạt động độc lập VÀ compose được với atoms khác
□ 5. Render đúng bên trong Camera wrapper
□ 6. Không hardcode text/icons — mọi thứ là props
□ 7. Test render ở 3 delay khác nhau xác nhận timing đúng
□ 8. Đã export trong src/atoms/index.ts
□ 9. Đã cập nhật design-tokens.json
□ 10. Có ít nhất 2 ví dụ compose với atoms hiện có
```

**Score < 7:** Tự động sửa, không hiển thị cho user.
**Score ≥ 7:** Hiển thị output kèm "QA: X/10 ✓".

---

## Extraction Priority Matrix

Khi phát hiện nhiều atom mới, ưu tiên theo **composability score**:

| Score | Ý nghĩa |
|-------|---------|
| ★★★★★ | Mở khóa 5+ scene mới khi kết hợp với atoms hiện có |
| ★★★★ | Mở khóa 3-4 scene mới |
| ★★★ | Mở khóa 2 scene mới |
| ★★ | Mở khóa 1 scene |
| ★ | Dùng 1 lần, khả năng tái sử dụng thấp → deprioritize |

---

## Existing Library Reference

Đọc atoms hiện tại từ:
- `src/atoms/` — Composable atoms
- `src/ComponentLibrary/index.tsx` — Primitives & templates cơ bản
- `src/LineTemplate/index.tsx` — Line connection system + Camera
- `src/Part1Redefine/index.tsx` — Overview Flowchart spine
- `src/Part2Priorities/index.tsx` — Camera sweep compositions
- `architecture/dark_needle_system.md` — Full DNA specification
