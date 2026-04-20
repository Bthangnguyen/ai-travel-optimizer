import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { Scene1 } from './Scene1';
import { Scene2 } from './Scene2';
import { Scene3 } from './Scene3';
import { Scene4 } from './Scene4';

export const CloneComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#05040e' }}>
      {/* 
        The background is a very dark blue/black solid color.
        We add the audio track extracted from the video.
      */}
      <Audio src={staticFile('audio.mp3')} />

      {/* Render the scenes. Scene logic handles their appearance times based on frame. */}
      <Scene1 />
      <Scene2 />
      <Scene3 />
      <Scene4 />
    </AbsoluteFill>
  );
};
