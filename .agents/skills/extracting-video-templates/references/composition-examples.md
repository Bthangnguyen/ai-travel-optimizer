# Composition Examples — Ví dụ kết hợp Atoms thành Scenes

## Mục đích
Minh họa cách các atoms ở 5 tầng kết hợp thành scene hoàn chỉnh.
Giúp AI hiểu pattern compose khi sinh code cho atom mới.

## Khi nào tải
Tải khi cần sinh code compose test (Phase 5 của full-extraction).

---

## Ví dụ 1: "Focus & Integrity" (Đã build — Part2Priorities S1)

```
Layout:   Radial(center=1, children=3)
Content:  [Word("FOCUS"), BoxWord("HABITS"), BoxWord("INTEGRITY"), BoxWord("PROMISES")]
Connect:  [Line(center→child1), Line(center→child2), Line(center→child3)]
Motion:   [BlurIn(center, delay=0), BlurIn(child1, delay=40), BlurIn(child2, delay=55), BlurIn(child3, delay=70)]
Camera:   [Sweep(center→child1→child2→child3, scale=2.5), Pullback(scale=0.85)]
```

**Kết quả:** Camera zoom sâu vào center, lia lần lượt qua 3 children khi chúng
xuất hiện, cuối cùng zoom ra lộ toàn cảnh.

---

## Ví dụ 2: "Leverage Chain" (Đã build — Part2Priorities S2)

```
Layout:   Chain(H, count=4)
Content:  [Word("INFO"), Word("TOOLS"), Word("PEOPLE"), Word("METHODS")]
Connect:  [Arrow(1→2), Arrow(2→3), Arrow(3→4)]
Motion:   [BlurIn(1, delay=0), BlurIn(2, delay=30), BlurIn(3, delay=60), BlurIn(4, delay=90)]
Camera:   [Sweep(1→2→3→4, scale=2.0), Pullback]
```

**Kết quả:** Camera lia theo chuỗi ngang, từng từ hiện ra khi camera đến vị trí.

---

## Ví dụ 3: "Overview Flowchart" (Đã build — Part1Redefine)

```
Layout:   Stack(count=5, spacing=20px)
Content:  [BoxWord("TOPIC 1"), BoxWord("TOPIC 2"), ..., BoxWord("TOPIC 5")]
Connect:  [Arrow(1→2), Arrow(2→3), Arrow(3→4), Arrow(4→5)]
Motion:   [BlurIn(each, stagger=12frames)]
Camera:   [ZoomPush(target=active_item, scale=3.5)]
```

**Kết quả:** Danh sách dọc hiện ra lần lượt, camera push zoom vào item active.

---

## Ví dụ 4: Compose giả định CHƯA BUILD (dùng atom mới Grid)

```
Layout:   Grid(rows=2, cols=3)  ← NEW ATOM
Content:  [Word×6 items]
Connect:  [Line(1→2), Line(2→3), Line(4→5), Line(5→6)]  ← existing
Motion:   [PopIn(each, stagger=8)]  ← NEW ATOM
Camera:   [Sweep(1→3→4→6), Pullback]  ← existing
```

**Kết quả dự kiến:** Ma trận 2x3 hiện ra từng ô với bounce effect,
camera lia chéo từ góc trên-trái xuống góc dưới-phải.

---

## Pattern: Cách compose 2 atom mới cùng lúc

1. Chọn 1 Layout atom mới + 1 Motion atom mới
2. Kết hợp với Connection + Camera HIỆN CÓ
3. Content luôn dùng Word/BoxWord (đã ổn định)
4. Test render ở frame giữa (50% duration) → verify vị trí
5. Test render ở frame cuối → verify timing đúng
