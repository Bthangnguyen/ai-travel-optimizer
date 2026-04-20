# Quy Tắc Render Video — Không Sửa Mã Nguồn

> Tài liệu này là **luật bất khả xâm phạm** khi thao tác với hệ thống Remotion.

---

## ❌ TUYỆT ĐỐI KHÔNG LÀM

1. **Không tạo file Composition mới** trong `src/` cho mỗi video test.
2. **Không sửa `Root.tsx`** trừ khi thêm Template Engine mới (phải review).
3. **Không hardcode text/icon vào file `.tsx`** — mọi nội dung phải đến từ JSON.
4. **Không copy-paste Component** — nếu 2 video dùng cùng layout, tái sử dụng Template.

## ✅ LUÔN LÀM

### Khi render video mới:
```bash
npx remotion render src/index.ts <CompositionId> output.mp4 --props=plan.json
```
- Video mới = **File JSON mới**, không phải file TSX mới.
- File JSON chứa: scenes, text, icon paths, timing, template_type.

### Khi test component mới:
1. Uncomment `Sandbox` composition trong `Root.tsx`.
2. Viết code test trong `src/Sandbox/index.tsx`.
3. Render: `npx remotion still src/index.ts Sandbox test.png --frame=0`
4. Sau khi test xong → Comment lại Sandbox, **xóa code test**.

### Khi thêm Template Engine mới:
1. Tạo folder mới trong `src/templates/` (ví dụ: `src/templates/SceneFlowchart.tsx`).
2. Import vào file Engine chính (không phải Root.tsx).
3. Engine tự động load template dựa trên `template_type` trong JSON.

---

## Cấu Trúc Thư Mục Chuẩn

```
src/
├── Root.tsx              ← KHÓA CỨNG. Chỉ đăng ký Compositions.
├── index.ts              ← Entry point. Không đụng.
├── index.css             ← Global styles. Không đụng.
│
├── core/                 ← Core DNA components (Grain, Glow, Vignette, Zoom)
│   ├── FilmGrain.tsx
│   ├── Vignette.tsx
│   ├── CinematicWrapper.tsx
│   └── SvgIcon.tsx
│
├── templates/            ← Template library (mỗi file = 1 scene type)
│   ├── SceneTextOnly.tsx
│   ├── SceneDualCharacter.tsx
│   ├── SceneSingleCharWithText.tsx
│   ├── SceneFlowchart.tsx
│   ├── SceneSplitScreen.tsx
│   └── SceneEnvironment.tsx
│
├── engine/               ← Engine đọc JSON và lắp scene tự động
│   └── VideoEngine.tsx   ← Vòng lặp: đọc scenes[] → gọi Template → render
│
└── Sandbox/              ← Môi trường test tạm (xóa sau khi dùng)
    └── index.tsx

public/
└── icons/                ← SVG assets (copy vào đây, Engine tự đọc)
    ├── Business Pictograms/
    ├── Emotions/
    └── Actions/

plans/                    ← Thư mục chứa JSON kịch bản cho mỗi video
├── test_icon.json
├── dark_needle_ep01.json
└── dark_needle_ep02.json
```

---

## Quy Trình Render Chuẩn (SOP)

```
1. Viết/Nhận Script.txt
       ↓
2. AI Director → Xuất plans/video_xxx.json
       ↓
3. AI Audio → Thêm timing vào JSON + tạo voice.mp3
       ↓
4. Copy SVG assets vào public/icons/
       ↓
5. npx remotion render src/index.ts VideoEngine output.mp4 --props=plans/video_xxx.json
       ↓
6. QA check → Xuất bản
```

**Không bước nào trong quy trình trên yêu cầu sửa file `.tsx`!**
