---
name: remotion-best-practices
description: >
  Cung cấp kiến thức chuyên sâu về Remotion framework để viết code video animation
  đúng chuẩn, tối ưu hiệu năng. Kích hoạt khi người dùng nói: 'tạo video mới',
  'code remotion', 'render video', 'thêm animation', 'sửa lỗi render', 'setup remotion',
  'thêm audio vào video', 'làm transition', 'chèn subtitle', 'timing animation'.
  KHÔNG dùng cho: extract template từ video mẫu (dùng extracting-video-templates),
  tạo kịch bản/storyboard JSON, hoặc các tác vụ không liên quan đến Remotion code.
---

# Remotion Best Practices — Dark Needle Engine

Kiến thức chuẩn về Remotion framework, đảm bảo code sinh ra luôn chạy mượt,
tối ưu hiệu năng và tuân thủ DNA tokens của Dark Needle.

---

## Khi nào dùng

- User tạo composition/scene mới trong Remotion
- User cần thêm animation, audio, transition
- User gặp lỗi render hoặc visual glitch
- User hỏi về timing, easing, sequencing
- User muốn setup project Remotion mới

## Khi nào KHÔNG dùng

- User muốn extract template từ video mẫu → dùng `extracting-video-templates`
- User muốn tạo kịch bản JSON → dùng `tools/plan_processor.js`
- User hỏi về design system/DNA tokens → đọc `architecture/dark_needle_system.md`

---

## Workflow Routing

| Workflow | Khi nào dùng |
|----------|-------------|
| `workflows/new-composition.md` | Tạo composition mới từ đầu |
| `workflows/debug-render.md` | Sửa lỗi render, visual glitch, timing sai |

---

## Quick Reference — Lệnh thường dùng

### Setup project mới
```bash
npx create-video@latest --yes --blank --no-tailwind my-video
```

### Preview trong Studio
```bash
npx remotion studio
```

### Render test 1 frame (sanity check)
```bash
npx remotion still [composition-id] --scale=0.25 --frame=30
```

### Render full video
```bash
npx remotion render src/index.ts [composition-id] output.mp4
```

---

## Dark Needle DNA Rules

Khi viết code Remotion cho dự án này, LUÔN tuân thủ:

### Colors — Chỉ dùng DNA tokens
```typescript
const C = { bg: '#0A0A0C', white: '#FFF', yellow: '#F5E500', red: '#CC0000', green: '#22C55E' };
```
**KHÔNG BAO GIỜ** hardcode hex color ngoài bảng trên.

### Typography — ALL CAPS + Letter Spacing
```typescript
{
  textTransform: 'uppercase',
  letterSpacing: 2,  // Minimum 2px
  fontWeight: 900,
  fontFamily: "'Impact','Arial Black','Helvetica Neue',sans-serif"
}
```

### Animation — Chỉ dùng Remotion interpolate
```typescript
// ✅ ĐÚNG
import { interpolate, Easing } from 'remotion';
const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
});

// ❌ SAI — không dùng CSS keyframes hoặc thư viện ngoài
```

### Camera — Easing chuẩn
```typescript
// Camera keyframes luôn dùng Easing.inOut(Easing.cubic) cho chuyển động mượt
easing: Easing.inOut(Easing.cubic)
```

### Overlays — Luôn có FilmGrain + Vignette
Mọi composition phải wrap trong `<FilmGrain />` và `<Vignette />` overlays.

---

## Rules Reference

Đọc từng file rule cho kiến thức chi tiết:

### Core Animation & Timing
- `rules/animations.md` — Kỹ năng animation cơ bản
- `rules/timing.md` — Interpolate, Bézier easing, springs
- `rules/sequencing.md` — Delay, trim, limit duration
- `rules/transitions.md` — Scene transition patterns
- `rules/text-animations.md` — Typography animation patterns
- `rules/trimming.md` — Cắt đầu/cuối animation

### Media
- `rules/audio.md` — Import, trim, volume, speed, pitch
- `rules/videos.md` — Embed video, trimming, looping
- `rules/images.md` — Embed images bằng Img component
- `rules/gifs.md` — GIFs đồng bộ với timeline
- `rules/fonts.md` — Google Fonts và local fonts
- `rules/assets.md` — Import images, videos, audio

### Advanced Features
- `rules/voiceover.md` — AI voiceover bằng ElevenLabs TTS
- `rules/subtitles.md` — Subtitle system
- `rules/display-captions.md` — Caption display patterns
- `rules/audio-visualization.md` — Spectrum bars, waveforms
- `rules/charts.md` — Bar, pie, line, stock charts
- `rules/3d.md` — Three.js và React Three Fiber
- `rules/lottie.md` — Lottie animations
- `rules/maps.md` — Mapbox animated maps
- `rules/light-leaks.md` — Light leak overlay effects

### Utilities
- `rules/compositions.md` — Defining compositions, stills, folders
- `rules/calculate-metadata.md` — Dynamic duration, dimensions, props
- `rules/parameters.md` — Parametrizable video với Zod schema
- `rules/measuring-text.md` — Đo kích thước text, fit containers
- `rules/measuring-dom-nodes.md` — Đo DOM element dimensions
- `rules/extract-frames.md` — Trích xuất frames từ video
- `rules/get-audio-duration.md` — Lấy duration audio
- `rules/get-video-duration.md` — Lấy duration video
- `rules/get-video-dimensions.md` — Lấy width/height video
- `rules/can-decode.md` — Check browser decode support
- `rules/transparent-videos.md` — Render video với transparency
- `rules/silence-detection.md` — Phát hiện khoảng lặng bằng FFmpeg
- `rules/ffmpeg.md` — FFmpeg operations
- `rules/sfx.md` — Sound effects

---

## QA Checklist

Trước khi kết thúc bất kỳ tác vụ Remotion nào, verify:

```
□ 1. Tất cả colors dùng DNA tokens (C.bg, C.yellow, etc.)
□ 2. Text là ALL_CAPS với letterSpacing >= 2
□ 3. Animation chỉ dùng interpolate + Easing từ Remotion
□ 4. Camera keyframes dùng Easing.inOut(Easing.cubic)
□ 5. FilmGrain + Vignette overlays có mặt
□ 6. Composition đã registered trong Root.tsx
□ 7. Render test 1 frame thành công (không lỗi visual)
□ 8. Timing: fade-in 8-12 frames, fade-out 5-8 frames (convention)
□ 9. Không sử dụng CSS keyframes hoặc animation library ngoài
□ 10. Icons dùng filter: invert(1) + glow drop-shadow
```

---

## Tiêu chí Chất lượng

| TỐT ✅ | XẤU ❌ |
|--------|--------|
| `interpolate` với `extrapolateLeft/Right: 'clamp'` | Không clamp → giá trị tràn ra ngoài range |
| Easing curves cho chuyển động tự nhiên | Linear interpolation cho mọi thứ |
| Scene wrapper với fade-in/fade-out | Hard cut không transition |
| Camera movement dẫn dắt mắt người xem | Static layout, không có camera motion |
| DNA tokens nhất quán | Mỗi scene dùng màu khác nhau random |
