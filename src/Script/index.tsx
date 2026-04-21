import React from 'react';
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Scene1 } from './Scene1';
import { Scene2 } from './Scene2';
import { Scene3 } from './Scene3';
import { Scene4 } from './Scene4';
import { Scene5 } from './Scene5';

/**
 * Main composition with voiceover audio.
 * Duration: 30 seconds (900 frames @ 30fps)
 */
export const ScriptVideo: React.FC = () => {
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
      <Audio src={staticFile('voiceover.mp3')} />

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at center, transparent 40%, rgba(0,0,0,${vignettePulse}) 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Render all scenes */}
      <Scene1 />
      <Scene2 />
      <Scene3 />
      <Scene4 />
      <Scene5 />
    </AbsoluteFill>
  );
};
