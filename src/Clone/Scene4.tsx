import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene 4 starts around frame 390 (13 seconds in)
  
  // Spotlight opacity
  const spotlightOpacity = interpolate(frame, [390, 420], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (frame < 390) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: spotlightOpacity }}>
      {/* Spotlight ray */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '600px',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)',
          filter: 'blur(20px)',
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
        }}
      />
      
      {/* The light fixture (Placeholder) */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100px',
          height: '40px',
          backgroundColor: '#333',
          borderBottomLeftRadius: '20px',
          borderBottomRightRadius: '20px',
        }}
      />
    </div>
  );
};
