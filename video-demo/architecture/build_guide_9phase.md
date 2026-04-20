# Remotion Video Build Guide — 9-Phase Prompt System

> **Nguồn:** Chapter 6 Prompt.docx  
> **Mục đích:** Quy trình chuẩn để tạo video Motion Graphics từ đầu đến cuối trong Remotion.

---

## PHASE 1 — SYSTEM SETUP: Role & Constraints

```
You are a senior motion designer and senior Remotion engineer.

You think in systems, timelines, and reusable components.
You do NOT jump ahead.
You work atomically and wait for confirmation before moving to the next phase.

Target:
A modern, design-forward motion graphics explainer video built entirely in Remotion.

Topic:
[INSERT TOPIC] — explainer for a general audience.

Style reference:
Clean, minimal, kinetic motion graphics.
No stock footage. No realism. Flat + abstract visuals.

Technical constraints:
- Remotion (React)
- SVG-first assets
- Reusable components
- 9:16 aspect ratio
- 60 fps
- No external animation libraries

Workflow rule:
You only work on ONE phase at a time and stop.
```

---

## PHASE 2 — ART DIRECTION & VISUAL SYSTEM

```
PHASE 1 — ART DIRECTION

Define a complete visual system for a [TOPIC] explainer video.
Deliverables:
1. Color palette (with hex values and usage rules)
2. Typography system (headline, body, numeric)
3. Shape language (circles, lines, grids, motion rules)
4. Icon style rules
5. Background treatment
6. Motion principles (how things enter, exit, scale, move)

Constraints:
- Must feel modern and premium
- Must be readable for education
- Must translate cleanly into SVG + React components

Output format:
Clear sections with bullet points.
No code yet.
```

> ⚠️ **Do not proceed until you like the look & feel.**

---

## PHASE 3 — STORY & TIMELINE STRUCTURE

```
PHASE 2 — STORY STRUCTURE

Create a storyboard outline for a [TOPIC] explainer video.
Deliverables:
1. Scene list (in order)
2. Purpose of each scene
3. Key visual idea per scene
4. Approximate duration (seconds + frames at 60fps)
5. On-screen text per scene (short, punchy)

Rules:
- No narration yet
- Text must work even without voiceover
- Visuals should escalate in complexity
- Each scene must be modular

Output as a numbered list.
```

---

## PHASE 4 — ASSET INVENTORY (CRITICAL)

```
PHASE 3 — ASSET INVENTORY

Based on the storyboard, list every asset required to build this video.
Deliverables:
1. SVG assets (stars, planet, icons, landmarks, UI shapes)
2. Background elements
3. Text components
4. Reusable motion components
5. Data or labels (numbers, years, facts)

Rules:
- Each asset must be reusable
- No asset should be scene-specific unless unavoidable
- Group assets by category

Output as a checklist.
```

---

## PHASE 5 — SVG ASSET GENERATION PROMPTS

```
PHASE 4A — SVG ASSETS: [CATEGORY]

Generate SVG design specs for:
- [Asset 1]
- [Asset 2]
- [Asset 3]

Rules:
- Flat design
- No gradients unless subtle
- Layered so parts can animate independently
- Optimized for Remotion transforms

Output:
- Description of each SVG
- Layer structure
- Naming conventions

Repeat this phase for:
- Icons
- Landmarks
- Timelines
- Data callouts
```

---

## PHASE 6 — MOTION PRIMITIVES

```
PHASE 6 — MOTION PRIMITIVES

Define reusable animation primitives for this project.

Examples:
- Fade + slide text
- Scale-in icons
- Orbiting planet motion
- Timeline reveal
- Data count-up

Deliverables:
1. Name of each primitive
2. What it animates
3. Parameters (duration, delay, direction)
4. When it should be used

Rules:
- Must be generic
- Must be reusable across scenes
- Designed for Remotion interpolate/spring

No scene composition yet.
```

---

## PHASE 7 — REMOTION COMPONENT ARCHITECTURE

```
PHASE 7 — COMPONENT ARCHITECTURE

Design the Remotion component hierarchy.
Deliverables:
1. Root composition
2. Scene components
3. Shared layout components
4. Motion components
5. Asset wrappers

Rules:
- One responsibility per component
- Scenes should only compose, not animate
- Motion logic must be isolated

Output as a tree structure.
```

---

## PHASE 8 — CODE GENERATION

```
PHASE 8A — CODE

Write the Remotion root composition file.
Constraints:
- 9:16
- 60fps
- Placeholder durations
- No scene content yet

Explain nothing.
Only output code.

Then repeat for:
- Motion primitives
- Layout components
- Scene components
```

---

## PHASE 9 — SCENE ASSEMBLY

```
PHASE 8 — SCENE ASSEMBLY

Assemble Scene [N] using existing components.
Rules:
- No new assets
- No new motion logic
- Only composition and timing

Output code only.
```

> Repeat per scene.

---

## BONUS — VOICEOVER & MUSIC

```
For each Remotion scene, generate a voiceover using the ElevenLabs API
(use the provided API key and voice id), and create a relevant background
music for the whole video using Elevenlabs. Ensure the music duration
matches and the voiceover match the duration of each scene.
Keep the API key secure and never expose it.

API Key: {Your Key}
Voice ID: {Your ID}
```
