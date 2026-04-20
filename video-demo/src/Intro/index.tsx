import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Background } from './Background';
import { Title } from './Title';

export const Intro: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <Title
        titleText="Antigravity"
        subtitleText="The Agentic AI Coding Assistant"
      />
    </AbsoluteFill>
  );
};
