# 📽️ Automated Video Generation Engine — Dark Needle

A powerful, data-driven motion graphics pipeline built on **Remotion**, designed for high-impact, cinematic storytelling.

## 🚀 Key Features

- **Composable Atom System**: Build complex scenes from simple primitives (Layouts, Connections, Content, Motion, Camera).
- **Camera-First Design**: Aggressive, cinematic pan/zoom transitions that guide the viewer's eye.
- **DNA-Driven Styling**: Strict adherence to branding tokens (Typography, Colors, Lettering) for a cohesive "Dark Needle" aesthetic.
- **Data-Backed Storyboarding**: Orchestrate entire videos using JSON plans.
- **AI Agent-Ready**: Custom skills and tools for automated template extraction and scene assembly.

## 🛠️ Architecture

- `/src/atoms`: Visual primitives (the "Atoms").
- `/src/templates`: Higher-level layout patterns.
- `/src/motion`: Core animation hooks and DNA tokens.
- `/architecture`: Technical documentation and DNA specifications.
- `/plans`: Structured JSON storyboards for video production.
- `/tools`: Pipeline scripts for orchestration, audio generation, and QA validation.

## 🚦 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Launch Studio**:
   ```bash
   npm start
   ```

3. **Render Video**:
   ```bash
   npx remotion render src/index.ts <CompositionName> <OutputFilename>.mp4
   ```

## 🧠 Smart Extraction Skill

This engine includes a custom **Extracting Video Templates** skill for agentic environments, allowing for the rapid reverse-engineering of motion graphics patterns into reusable atoms.

---

*Refinement Version 1.0.0*
