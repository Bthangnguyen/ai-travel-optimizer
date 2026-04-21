import React from 'react';
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';

export const Title: React.FC<{
  titleText: string;
  subtitleText: string;
}> = ({ titleText, subtitleText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame: frame - 15,
    fps,
    config: {
      damping: 12,
    },
  });

  const subtitleOpacity = interpolate(
    frame,
    [40, 60],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const titleScale = interpolate(titleSpring, [0, 1], [0.8, 1]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: 'white',
      }}
    >
      <h1
        style={{
          fontSize: '120px',
          fontWeight: 900,
          margin: 0,
          textAlign: 'center',
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
          letterSpacing: '-2px',
          textShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        {titleText}
      </h1>
      <div
        style={{
          fontSize: '32px',
          fontWeight: 400,
          opacity: subtitleOpacity,
          marginTop: '10px',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          color: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        {subtitleText}
      </div>
    </div>
  );
};
