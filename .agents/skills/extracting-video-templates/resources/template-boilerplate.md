# Template Component Boilerplate

Use this as the starting point when generating a NEW template component.

## Standalone Template

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Img, staticFile } from 'remotion';

// ═══ DNA Tokens ═══
const C = { bg: '#0A0A0C', white: '#FFF', yellow: '#F5E500', red: '#CC0000', green: '#22C55E' };

// ═══ Props Interface ═══
interface TemplateNameProps {
  offset: number;           // Global frame start position
  duration: number;          // Total frames for this template
  // Add template-specific props below:
  // title?: string;
  // items?: { content: string; color: string }[];
}

// ═══ Component ═══
export const TemplateName: React.FC<TemplateNameProps> = ({ offset, duration }) => {
  const f = useCurrentFrame();
  if (f < offset || f >= offset + duration) return null;
  const local = f - offset;

  // Camera (if needed)
  // const camScale = interpolate(local, [...], [...], { ... });

  // Fade in/out
  const fadeIn = interpolate(local, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(local, [duration - 8, duration], [1, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity: fadeIn * fadeOut }}>
      {/* Template content here */}
    </AbsoluteFill>
  );
};
```

## Integration in ComponentLibrary

When adding to `src/ComponentLibrary/index.tsx`:

1. Add a new duration entry to the `D` array
2. Create a scene component (`const SN: React.FC = () => ...`)
3. Include `<SectionLabel>` with template name
4. Add `<SN />` to the main render

## Registration in Root.tsx

```tsx
// Only if template needs its own standalone composition
<Composition
  id="TemplateName"
  component={TemplateName}
  durationInFrames={TOTAL_FRAMES}
  fps={30}
  width={1920}
  height={1080}
/>
```
