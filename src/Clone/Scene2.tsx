import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene 2 starts roughly at frame 60 (2 seconds in)
  
  // Notecard animation
  const cardScale = spring({
    frame: frame - 60,
    fps,
    config: { damping: 14 },
  });
  
  // "TEST" word animation (appears around frame 75)
  const testScale = spring({
    frame: frame - 75,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  // Narrator sliding in (around frame 90)
  const narratorSlide = interpolate(
    spring({ frame: frame - 90, fps, config: { damping: 16 } }),
    [0, 1],
    [500, 0] // Slides in from 500px to the right to 0
  );

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Background line/connector */}
      <div 
        style={{
          position: 'absolute',
          bottom: '30%',
          left: 0,
          right: '50%',
          height: '2px',
          backgroundColor: 'rgba(255,255,255,0.3)',
          opacity: frame > 60 ? 1 : 0
        }}
      />
      
      {/* The Notecard */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '40%',
          transform: `translate(-50%, -50%) scale(${cardScale})`,
          width: '300px',
          height: '150px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 0 20px 5px rgba(255,0,0,0.8)', // Neon red border
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'black' }}>
          NEGATIVE SPACE
        </div>
        
        {/* The word TEST overlapping */}
        <div
          style={{
            position: 'absolute',
            bottom: '-30px',
            right: '-10px',
            color: 'red',
            fontSize: '48px',
            fontWeight: 900,
            textShadow: '0 0 10px rgba(255,0,0,0.8)', // Glow
            transform: `scale(${testScale}) rotate(-10deg)`,
          }}
        >
          TEST
        </div>
      </div>

      {/* The Narrator (Placeholder SVG/Shape) */}
      <div
        style={{
          position: 'absolute',
          right: '250px',
          bottom: '100px',
          transform: `translateX(${narratorSlide}px)`,
          width: '150px',
          height: '300px',
          backgroundColor: 'white', // Silhouette
          borderRadius: '75px 75px 0 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Syringe "Head" Placeholder */}
        <div style={{
          width: '60px',
          height: '100px',
          backgroundColor: 'black',
          border: '4px solid white',
          marginTop: '-50px',
          borderRadius: '10px'
        }}>
           <div style={{color:'white', textAlign:'center', marginTop: '20px'}}>Syringe</div>
        </div>
        {/* Pointer stick */}
        <div style={{
           position: 'absolute',
           left: '-100px',
           top: '80px',
           width: '150px',
           height: '4px',
           backgroundColor: 'white',
           transform: 'rotate(-20deg)'
        }} />
      </div>
    </div>
  );
};
