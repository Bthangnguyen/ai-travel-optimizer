import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ProFigure } from './components/ProFigure';

export const ProFigureDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <div style={{ position: 'absolute', top: 100, left: 100, color: '#F5E500', fontSize: 40, fontFamily: 'Arial', fontWeight: 'bold' }}>
        V1: Quality Check - Male Standing
      </div>
      
      {/* Grid line to show proportions */}
      <div style={{ position: 'absolute', top: 800, width: '100%', height: 2, backgroundColor: '#333' }} />

      {/* Render 3 sizes to check scale */}
      <ProFigure pose="standing" x={400} y={400} s={1.5} />
      <ProFigure pose="standing" x={800} y={200} s={3} />
      <ProFigure pose="standing" x={1400} y={35} s={4} />

    </AbsoluteFill>
  );
};
