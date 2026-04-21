# Full Extraction — Trích xuất đầy đủ, sinh code, test compose

## Mục đích
Workflow hoàn chỉnh: chụp 20 frames, phân rã thành atoms, sinh code TSX,
test khả năng compose, và đăng ký vào thư viện.

## Khi nào dùng
- Đã chạy quick-scan và xác nhận có atom mới
- User yêu cầu trích xuất đầy đủ từ video
- User nói "extract template", "nạp template mới"

## Điều kiện trước
- Video URL hoặc file path sẵn sàng
- Đã đọc `resources/design-tokens.json` để biết atoms hiện có
- Đã đọc `references/atom-layers.md` để hiểu 5 tầng atom

## Các bước

### Bước 1: Video Ingestion & Frame Capture
Mở video trong browser và chụp 20 screenshots tại mốc 5% intervals
(0%, 5%, 10%, ... 95%).

**Tại sao:** 20 frames ở 5% intervals cho mật độ đủ dày để không bỏ sót bất kỳ
pattern layout nào, kể cả những pattern chỉ xuất hiện trong 2-3 giây.

### Bước 2: Atom Decomposition
Với mỗi frame có visual pattern khác biệt, phân rã thành 5 tầng:

1. **Layout Atom** — elements được đặt ở đâu trên màn hình?
2. **Content Atoms** — những gì được hiển thị? (BỎ QUA icons/images cụ thể)
3. **Connection Atoms** — elements liên kết với nhau bằng gì?
4. **Motion Atoms** — elements animate vào/ra bằng cách nào?
5. **Camera Atoms** — viewport di chuyển ra sao?

**Tại sao phân rã 5 tầng:** Mỗi tầng là một dimension độc lập. Layout "Grid"
có thể kết hợp với Motion "PopIn" HOẶC "BlurIn" — tạo ra 2 scene khác nhau
từ cùng 1 layout atom.

### Bước 3: Gap Analysis
Cross-reference mỗi atom với bảng existing trong `resources/design-tokens.json`:

```
EXISTING  → Đã có trong thư viện → bỏ qua
VARIANT   → Sửa đổi nhỏ → ghi chú tham số khác biệt
NEW ATOM  → Primitive hoàn toàn mới → PHẢI BUILD
```

Ưu tiên NEW atoms có composability score cao nhất (★★★★-★★★★★).

**Tại sao dùng composability score:** Một atom Grid (★★★★★) mở khóa hàng chục
scene mới khi kết hợp với Line/Word/BlurIn. Một atom chỉ dùng 1 lần (★) không
đáng thời gian build.

### Bước 4: Code Generation
Build mỗi atom mới theo template chuẩn:

```typescript
interface AtomNameProps {
  x: number; y: number;       // Position
  delay: number;               // When to start
  duration?: number;           // Animation length
  color?: string;              // DNA token color
}

export const AtomName: React.FC<AtomNameProps> = ({
  x, y, delay, duration = 15, color = C.white
}) => {
  const f = useCurrentFrame();
  const progress = interpolate(f, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic)
  });
  return (/* render */);
};
```

**Tại sao template này:** Pure function pattern đảm bảo atom không có
side effect, chỉ phụ thuộc vào frame counter → luôn deterministic, luôn compose được.

### Bước 5: Composition Test
Kết hợp atom mới với ít nhất 2 atom hiện có để tạo 2 scene phức tạp.
Render test frames và verify output.

**Tại sao test compose:** Một atom chạy solo đẹp nhưng conflict khi kết hợp
với Camera thì vô dụng. Test compose phát hiện xung đột timing, overlap vị trí,
hoặc z-index wars.

### Bước 6: Library Registration
1. Thêm atom mới vào `src/atoms/`
2. Export từ `src/atoms/index.ts`
3. Thêm demo scene trong `src/AtomShowcase/` (solo + combined)
4. Cập nhật `resources/design-tokens.json` atom registry

## Output
- `src/atoms/[AtomName].tsx` — Component(s) mới
- `src/atoms/index.ts` — Updated exports
- `resources/design-tokens.json` — Updated registry
- Screenshots: before (reference) → after (Remotion recreation)

## Kiểm tra Chất lượng
- [ ] Đã chụp đúng 20 frames
- [ ] Mỗi atom mới qua 10-point QA checklist (xem SKILL.md)
- [ ] Ít nhất 2 compose tests thành công
- [ ] design-tokens.json đã cập nhật
- [ ] Atom hoạt động đúng trong Camera wrapper
