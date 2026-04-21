import React from 'react';
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { DynamicScene } from './DynamicScenes';
import plan from './video_plan.json';

/**
 * Full Script Video Composition (Dynamic Version)
 * Orchestrated by the 5-Agent Pipeline
 */
export const FullScriptVideo: React.FC = () => {
  const frame = useCurrentFrame();

  const vignettePulse = interpolate(
    Math.sin(frame / 60),
    [-1, 1],
    [0.3, 0.5]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* AI Voiceover */}
      <Audio src={staticFile('vo_full.mp3')} />

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at center, transparent 40%, rgba(0,0,0,${vignettePulse}) 100%)`,
          pointerEvents: 'none',
          zIndex: 100,
        }}
      />

      {/* Dynamic Scenes from Plan */}
      {plan.scenes.map((scene) => (
        <DynamicScene
          key={scene.id}
          text={scene.text}
          startFrame={scene.startFrame}
          endFrame={scene.endFrame}
          style={scene.style}
        />
      ))}
    </AbsoluteFill>
  );
};
