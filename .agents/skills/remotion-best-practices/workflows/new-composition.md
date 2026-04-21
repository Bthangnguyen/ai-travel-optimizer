# New Composition — Tạo composition Remotion mới

## Mục đích
Hướng dẫn từng bước tạo một composition (scene/video) mới trong dự án Dark Needle,
đảm bảo tuân thủ DNA tokens và kiến trúc atom.

## Khi nào dùng
- User muốn tạo video/scene mới
- User nói "thêm Part 3", "tạo composition mới"
- User có kịch bản JSON cần chuyển thành Remotion code

## Điều kiện trước
- Đã đọc DNA rules trong SKILL.md
- Có kịch bản JSON hoặc mô tả text rõ ràng

## Các bước

### Bước 1: Phân tích kịch bản
Đọc JSON plan hoặc text mô tả. Xác định:
- Có bao nhiêu scene?
- Mỗi scene cần atoms nào? (Layout + Content + Connection + Motion + Camera)
- Tổng duration bao nhiêu frames? (30fps)

**Tại sao:** Phân tích trước giúp tránh refactor giữa chừng. Biết trước
cần bao nhiêu scene = tính được timing array chính xác.

### Bước 2: Tạo timing array
```typescript
const D = [90, 120, 120, 150, 90];  // Duration mỗi scene (frames)
const T: number[] = [];
let acc = 0;
for (const d of D) { T.push(acc); acc += d; }
// T = [0, 90, 210, 330, 480]
```

**Tại sao:** Timing array tập trung = 1 chỗ duy nhất để điều chỉnh pacing.
Không scatter timing logic khắp nơi.

### Bước 3: Code từng scene
Với mỗi scene, sử dụng Scene wrapper + atoms:
```typescript
const S1: React.FC = () => (
  <Scene start={T[1]} dur={D[1]}>
    {/* Atoms here */}
  </Scene>
);
```

**Tại sao:** Scene wrapper tự động xử lý fade-in/fade-out + slow zoom drift.
Code bên trong chỉ cần focus vào content.

### Bước 4: Register trong Root.tsx
```typescript
<Composition id="NewComposition" component={NewComp}
  durationInFrames={totalFrames} fps={30} width={1920} height={1080} />
```

### Bước 5: Test render
```bash
npx remotion still NewComposition --frame=0 --scale=0.25
npx remotion still NewComposition --frame=150 --scale=0.25
```

**Tại sao:** Render frame đầu + frame giữa cho confidence tối thiểu
trước khi render full video (tiết kiệm thời gian).

## Output
- `src/[CompositionName]/index.tsx` — Component mới
- `src/Root.tsx` — Updated với registration mới

## Kiểm tra Chất lượng
- [ ] Tất cả DNA rules được tuân thủ (10-point QA)
- [ ] Timing array tập trung, không scatter
- [ ] Scene wrapper có fade-in/fade-out
- [ ] FilmGrain + Vignette overlays
- [ ] Test render 2 frames thành công
