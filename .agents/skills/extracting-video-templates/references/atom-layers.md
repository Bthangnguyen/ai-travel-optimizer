# Atom Layers — Chi tiết 5 tầng Atom

## Mục đích
Reference đầy đủ về kiến trúc 5 tầng atom, bao gồm danh sách existing/missing
và hướng dẫn phân loại khi phân tích video.

## Khi nào tải
Tải reference này khi bắt đầu phân tích video mới (Phase 2: Atom Decomposition).

---

## Layer 1 — Structural Atoms (Layout)
Định nghĩa VỊ TRÍ elements trên màn hình.

| Atom | Mô tả | Status | Composability |
|------|--------|--------|---------------|
| Center | 1 element tại (960, 540) | ✅ Có | ★★★★★ |
| Pair | 2 elements cạnh nhau | ✅ Có | ★★★ |
| Chain(H) | N elements ngang | ✅ Có | ★★★★★ |
| Chain(V) | N elements dọc | ✅ Có | ★★★★ |
| Radial | 1 center + N children xung quanh | ✅ Có | ★★★★★ |
| Grid(r,c) | Ma trận r×c | ❌ Thiếu | ★★★★★ |
| Stack | Danh sách dọc có stagger | ❌ Thiếu | ★★★★ |
| Orbit | Elements trên đường tròn | ❌ Thiếu | ★★★ |
| Tree | Phân nhánh hierarchical | ❌ Thiếu | ★★★★ |
| Diagonal | Elements dọc đường 45° | ❌ Thiếu | ★★ |

### Cách nhận diện Layout trong video frame:
- Có 1 element chiếm trung tâm → **Center**
- Có 2 element chia đôi màn hình → **Pair/Split**
- Elements xếp hàng ngang → **Chain(H)**
- Elements xếp hàng dọc → **Chain(V)** hoặc **Stack**
- 1 element trung tâm + nhiều element xung quanh → **Radial**
- Elements xếp theo lưới đều → **Grid**

---

## Layer 2 — Connection Atoms
Định nghĩa QUAN HỆ giữa elements.

| Atom | Mô tả | Status | Composability |
|------|--------|--------|---------------|
| Line(A→B) | SVG line thẳng | ✅ Có | ★★★★★ |
| Arrow(A→B) | Line + mũi tên | ✅ Có | ★★★★ |
| Bracket | Dấu ngoặc nhọn gom nhóm | ❌ Thiếu | ★★★★ |
| Circle | Vòng tròn bao quanh | ❌ Thiếu | ★★★ |
| Path | Đường cong bezier | ❌ Thiếu | ★★★★ |
| Pulse | Chấm sáng chạy dọc line | ❌ Thiếu | ★★★ |

### Cách nhận diện Connection:
- Đường thẳng nối 2 element → **Line**
- Đường có mũi tên ở đầu → **Arrow**
- Dấu { hoặc } gom nhóm nhiều items → **Bracket**
- Đường cong nối 2 element → **Path**

---

## Layer 3 — Content Atoms
Định nghĩa NỘI DUNG hiển thị tại mỗi vị trí.

| Atom | Mô tả | Status | Composability |
|------|--------|--------|---------------|
| Word | Text bold uppercase | ✅ Có | ★★★★★ |
| BoxWord | Text trong khung viền | ✅ Có | ★★★★★ |
| Badge | Pill-shaped label | ✅ Có | ★★★★ |
| Number | Counter animated | ❌ Thiếu | ★★★★ |
| Bar | Progress/percentage bar | ❌ Thiếu | ★★★ |
| Quote | Styled quotation block | ❌ Thiếu | ★★ |

### Ghi nhớ:
**KHÔNG lưu icon cụ thể.** Icons là content thay đổi theo ngữ cảnh.
Chỉ ghi nhận "vị trí này có icon" → dùng generic placeholder.

---

## Layer 4 — Motion Atoms
Định nghĩa CÁCH ANIMATE vào/ra.

| Atom | Mô tả | Status | Composability |
|------|--------|--------|---------------|
| BlurIn | Mờ → sắc nét | ✅ Có | ★★★★★ |
| ScaleSlam | Scale 3x → 1x | ✅ Có | ★★★★ |
| SlideIn(dir) | Trượt từ cạnh | ❌ Thiếu | ★★★★★ |
| PopIn | Scale 0→1 with bounce | ❌ Thiếu | ★★★★ |
| TypeWriter | Từng ký tự hiện ra | ❌ Thiếu | ★★★ |
| Wipe | Quét ngang/dọc | ❌ Thiếu | ★★★★ |
| Shake | Rung 3-5 frames | ❌ Thiếu | ★★★ |
| PulseGlow | Opacity nhấp nháy | ❌ Thiếu | ★★ |

### Cách nhận diện Motion:
- Element hiện ra từ mờ → **BlurIn**
- Element "đập" mạnh vào màn hình → **ScaleSlam**
- Element trượt từ ngoài khung hình vào → **SlideIn**
- Element "nảy" lên từ size 0 → **PopIn**

---

## Layer 5 — Camera Atoms
Định nghĩa CÁCH VIEWPORT di chuyển.

| Atom | Mô tả | Status | Composability |
|------|--------|--------|---------------|
| StaticZoom | Drift chậm 1.0→1.04 | ✅ Có | ★★★★ |
| ZoomPush | Push sâu 1.0→3.5 | ✅ Có | ★★★★ |
| Sweep(targets) | Pan giữa các focal points | ✅ Có | ★★★★★ |
| Pullback | Zoom out reveal 0.85-0.95 | ✅ Có | ★★★★ |
| Dolly | Lateral pan mượt | ❌ Thiếu | ★★★★ |
| Rack | Blur foreground, focus bg | ❌ Thiếu | ★★★ |
| Handheld | Random subtle drift | ❌ Thiếu | ★★ |

### Cách nhận diện Camera:
- Khung hình zoom chậm vào → **StaticZoom** hoặc **ZoomPush**
- Khung hình lia sang trái/phải → **Sweep** hoặc **Dolly**
- Khung hình zoom ra lộ toàn cảnh → **Pullback**
- Foreground blur, background sắc nét → **Rack**
