import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene 3 starts around frame 270 (9 seconds in)
  // Words: "TEST", "CAREFULLY", "EXPLAIN" pop up sequentially

  const getWordSpring = (delayFrames: number) => 
    spring({
      frame: frame - (270 + delayFrames),
      fps,
      config: { damping: 12, mass: 0.5 },
    });

  const testScale = getWordSpring(0);
  const carefullyScale = getWordSpring(30);
  const explainScale = getWordSpring(60);

  // Fade out everything at the end of the scene (frame 390 - 13s)
  const opacity = interpolate(frame, [380, 390], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (frame < 270) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, opacity }}>
      {/* Container for the words, positioned to the left of the narrator */}
      <div
        style={{
          position: 'absolute',
          left: '30%',
          top: '30%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ 
          transform: `scale(${testScale})`, 
          color: 'red', 
          fontSize: '48px', 
          fontWeight: 900,
          background: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          boxShadow: '0 0 10px rgba(255,0,0,0.5)',
          alignSelf: 'flex-start'
        }}>
          TEST
        </div>
        
        <div style={{ 
          transform: `scale(${carefullyScale})`, 
          color: 'white', 
          fontSize: '36px', 
          fontWeight: 'bold',
          alignSelf: 'flex-start'
        }}>
          CAREFULLY
        </div>
        
        <div style={{ 
          transform: `scale(${explainScale})`, 
          color: 'white', 
          fontSize: '36px', 
          fontWeight: 'bold',
          alignSelf: 'flex-start'
        }}>
          EXPLAIN
        </div>
      </div>
    </div>
  );
};
