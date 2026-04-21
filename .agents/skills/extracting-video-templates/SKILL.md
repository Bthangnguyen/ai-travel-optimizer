---
name: extracting-video-templates
description: Analyzes reference videos to extract composable visual ATOMS (primitives), then generates reusable Remotion TSX components that combine into complex layouts. Use this skill when the user provides a video link/file and wants to reverse-engineer its visual patterns into the Dark Needle template library.
---

# Extracting Video Templates — Composable Atom System

## Core Philosophy

**DO NOT extract finished scenes.** Extract the ATOMS — the smallest reusable building blocks.  
Complex scenes are just combinations of simple atoms:

```
center + children + line + camera_sweep = "Center+Children Radial Layout"
word + word + line + camera_pan        = "Word→Word Chain"  
center + center + line                 = "Multi-Center Flow"
```

**The goal:** Find new atoms that DON'T exist yet, and verify they compose well with existing atoms.

**DO NOT extract icons.** Icons are content, not structure. Only extract the template pattern.

## When to use this skill
- User shares a video URL and says "extract template", "nạp template mới", "phân tích video"
- User wants to expand the composable atom library

## Atom Architecture

### Layer 1 — Structural Atoms (Position & Layout)
These define WHERE things go on screen:

| Atom | What it does | Existing? |
|---|---|---|
| `Center` | Single element at (960, 540) | ✅ LineNode |
| `Pair` | Two elements side by side | ✅ split_screen |
| `Chain(H)` | N elements in horizontal sequence | ✅ word→word |
| `Chain(V)` | N elements in vertical sequence | ✅ S4_Chain |
| `Radial` | 1 center + N children around it | ✅ center+children |
| `Grid(r,c)` | r×c matrix layout | ❌ NEW |
| `Stack` | Vertical list with stagger | ❌ NEW |
| `Orbit` | Elements on a circular path | ❌ NEW |
| `Tree` | Hierarchical branching | ❌ NEW |
| `Diagonal` | Elements along a 45° line | ❌ NEW |

### Layer 2 — Connection Atoms (Relationships)
These define HOW elements relate:

| Atom | What it does | Existing? |
|---|---|---|
| `Line(A→B)` | SVG line from A to B | ✅ AnimLine |
| `Arrow(A→B)` | Line with arrowhead | ✅ AnimLine(arrow) |
| `Bracket` | Curly brace grouping | ❌ NEW |
| `Circle` | Enclosing ring | ❌ NEW |
| `Path` | Curved bezier connection | ❌ NEW |
| `Pulse` | Animated dot traveling along line | ❌ NEW |

### Layer 3 — Content Atoms (What is displayed)
These define WHAT is shown at a position:

| Atom | What it does | Existing? |
|---|---|---|
| `Word` | Bold uppercase text | ✅ LineNode(word) |
| `BoxWord` | Text inside bordered box | ✅ LineNode(boxword) |
| `Icon` | SVG pictogram (generic placeholder) | ✅ LineNode(icon) |
| `Number` | Animated counter | ❌ NEW |
| `Bar` | Progress/percentage bar | ❌ NEW |
| `Quote` | Styled quotation block | ❌ NEW |
| `Badge` | Pill-shaped label | ✅ Badge |

### Layer 4 — Motion Atoms (How things move)
These define HOW things animate:

| Atom | What it does | Existing? |
|---|---|---|
| `BlurIn` | Fade from blur to sharp | ✅ BlurReveal |
| `ScaleSlam` | Scale from 3x to 1x | ✅ ScalePunch |
| `SlideIn(dir)` | Slide from left/right/top/bottom | ❌ NEW |
| `PopIn` | Scale from 0 to 1 with bounce | ❌ NEW |
| `TypeWriter` | Character-by-character reveal | ❌ NEW |
| `Wipe` | Horizontal/vertical wipe reveal | ❌ NEW |
| `Shake` | 3-5 frame position jitter | ❌ NEW |
| `Pulse` | Opacity throb (glow on/off) | ❌ NEW |

### Layer 5 — Camera Atoms (How the viewport moves)
These define HOW the camera behaves:

| Atom | What it does | Existing? |
|---|---|---|
| `StaticZoom` | Slow 1.0→1.04 drift | ✅ Scene wrapper |
| `ZoomPush` | 1.0→3.5 into target | ✅ OVScene |
| `Sweep(targets)` | Pan between focal points at 2.0-2.5x | ✅ Camera |
| `Pullback` | Zoom out to 0.85-0.95 reveal | ✅ Camera |
| `Dolly` | Smooth lateral pan | ❌ NEW |
| `Rack` | Blur foreground, focus background | ❌ NEW |
| `Handheld` | Subtle random drift | ❌ NEW |

## Composition Rules

When atoms combine, follow these patterns:

```
SCENE = Layout + Content[] + Connection[] + Motion[] + Camera

Example 1: "Focus & Integrity"
  Layout:   Radial(center=1, children=3)
  Content:  [Icon("focus"), BoxWord("habits"), BoxWord("integrity"), BoxWord("promises")]
  Connect:  [Line(center→child1), Line(center→child2), Line(center→child3)]
  Motion:   [BlurIn(center, delay=0), BlurIn(child1, delay=40), ...]
  Camera:   [Sweep(center→child1→child2→child3), Pullback]

Example 2: "Leverage Chain"  
  Layout:   Chain(H, count=4)
  Content:  [Word("info"), Word("tools"), Word("people"), Word("methods")]
  Connect:  [Arrow(1→2), Arrow(2→3), Arrow(3→4)]
  Motion:   [BlurIn(1, delay=0), BlurIn(2, delay=30), ...]
  Camera:   [Sweep(1→2→3→4), Pullback]
```

## Workflow

### Phase 1: Video Ingestion & Frame Capture
- [ ] Open the video in a browser (YouTube) or local player
- [ ] Capture screenshots at **5% intervals** (0%, 5%, 10%, 15%... 95%) — **20 frames total**
- [ ] Save all screenshots to the artifacts directory

### Phase 2: Atom Decomposition
For each unique visual pattern found, decompose it into atoms:
- [ ] Identify the **Layout Atom** (where things are positioned)
- [ ] Identify the **Content Atoms** (what is displayed — ignore specific icons/images)
- [ ] Identify the **Connection Atoms** (how elements relate visually)
- [ ] Identify the **Motion Atoms** (how things animate in/out)
- [ ] Identify the **Camera Atoms** (how the viewport moves)

### Phase 3: Gap Analysis
- [ ] Cross-reference each atom against the existing library (tables above)
- [ ] Classify:
  ```
  EXISTING  → Already in library → skip
  VARIANT   → Slight modification → note param differences  
  NEW ATOM  → Completely new primitive → MUST BUILD
  ```
- [ ] Prioritize NEW atoms that unlock the MOST compositions when combined with existing atoms

### Phase 4: Code Generation
- [ ] Build each new atom as a standalone, composable React component
- [ ] Each atom must accept at minimum: `delay`, `duration`, `color`, position coordinates
- [ ] Atoms must NOT contain hardcoded content — everything is props-driven
- [ ] Follow this template:

```typescript
// Every atom is a pure function of (position, timing, style)
interface AtomNameProps {
  x: number; y: number;       // Position
  delay: number;               // When to start animating
  duration?: number;           // How long the animation takes
  color?: string;              // DNA token color
  // ...atom-specific props
}

export const AtomName: React.FC<AtomNameProps> = ({ x, y, delay, duration = 15, color = C.white }) => {
  const f = useCurrentFrame();
  // Pure interpolation logic — no side effects
  const progress = interpolate(f, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic)
  });
  return (/* render */);
};
```

### Phase 5: Composition Test
- [ ] Combine new atoms with existing atoms to create at least 2 complex scenes
- [ ] Verify the new atoms compose cleanly (no visual conflicts, timing works)
- [ ] Render test frames and verify output

### Phase 6: Library Registration
- [ ] Add new atoms to `src/atoms/` directory (create if needed)
- [ ] Export from `src/atoms/index.ts`
- [ ] Add demo scene in `ComponentLibrary` showing the atom solo + combined
- [ ] Update `resources/design-tokens.json` atom registry

## Extraction Priority Matrix

When multiple new atoms are found, prioritize by **composability score**:

| Score | Meaning |
|---|---|
| ★★★★★ | Unlocks 5+ new scene types when combined with existing atoms |
| ★★★★ | Unlocks 3-4 new scene types |
| ★★★ | Unlocks 2 new scene types |
| ★★ | Unlocks 1 scene type |
| ★ | Single-use pattern, low reuse potential → deprioritize |

## Quality Checklist

Before marking an atom as complete:
- [ ] Pure function — no internal state beyond `useCurrentFrame()`
- [ ] All colors via DNA tokens (`C.bg`, `C.yellow`, etc.)
- [ ] Accepts `delay` prop for sequencing
- [ ] Works independently AND composes with other atoms
- [ ] Renders correctly inside a `Camera` wrapper
- [ ] No hardcoded text/icons — everything is props
- [ ] Test render at 3 different delays confirms correct timing

## Existing Library Reference

Read current atoms from:
- `src/ComponentLibrary/index.tsx` — Primitives & basic templates
- `src/LineTemplate/index.tsx` — Line connection system + Camera
- `src/Part1Redefine/index.tsx` — Overview Flowchart spine
- `src/Part2Priorities/index.tsx` — Camera sweep compositions
- `architecture/dark_needle_system.md` — Full DNA specification
