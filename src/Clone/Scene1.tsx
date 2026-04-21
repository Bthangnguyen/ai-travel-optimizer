import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // The couple appears from 0 to 2 seconds (0 to 60 frames)
  // Let's fade them out around frame 60
  const opacity = interpolate(frame, [45, 60], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      {/* Placeholder for the hugging couple silhouette */}
      <div
        style={{
          width: '200px',
          height: '400px',
          backgroundColor: 'white',
          borderRadius: '100px',
          boxShadow: '0 0 40px 10px rgba(255,255,255,0.3)', // Glow effect
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <span style={{ color: 'black', fontWeight: 'bold' }}>[COUPLE]</span>
      </div>
    </div>
  );
};
