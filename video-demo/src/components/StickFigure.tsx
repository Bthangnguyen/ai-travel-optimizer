import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { CircleHead, WrenchHead, SyringeHead, GearHead, CrownHead, MaskHead, CrackedCircleHead } from './Icons';

export type HeadType = 'circle' | 'wrench' | 'syringe' | 'gear' | 'crown' | 'mask' | 'cracked';

export type StickFigureProps = {
  headType?: HeadType;
  color?: string;
  delay?: number;
  scale?: number;
  style?: React.CSSProperties;
  posture?: 'upright' | 'slouched';
};

const headComponents: Record<HeadType, React.FC<any>> = {
  circle: CircleHead,
  wrench: WrenchHead,
  syringe: SyringeHead,
  gear: GearHead,
  crown: CrownHead,
  mask: MaskHead,
  cracked: CrackedCircleHead,
};

export const StickFigure: React.FC<StickFigureProps> = ({
  headType = 'circle',
  color = '#FFF',
  delay = 0,
  scale = 1,
  style,
  posture = 'upright'
}) => {
  const frame = useCurrentFrame();
  const HeadComponent = headComponents[headType] || CircleHead;
  
  // Assemble timing — uses delay as offset from start
  const PARTS_DELAY = 3;
  
  const fadeIn = (d: number) => interpolate(frame, [d, d + 4], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const headOpacity = fadeIn(delay);
  const torsoOpacity = fadeIn(delay + PARTS_DELAY);
  const armsOpacity = fadeIn(delay + PARTS_DELAY * 2);
  
  // Posture logic
  const isSlouched = posture === 'slouched';
  const bodyRotation = isSlouched ? 20 : 0;
  
  // Gear rotation logic if headType is gear
  const gearRotation = headType === 'gear' ? (frame / 60) * 360 : 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transform: `scale(${scale})`,
      ...style
    }}>
      {/* Head */}
      <div style={{
        opacity: headOpacity,
        zIndex: 2,
        transform: `rotate(${gearRotation}deg) translateY(${isSlouched ? 15 : 0}px) translateX(${isSlouched ? 10 : 0}px)`
      }}>
        <HeadComponent size={80} color={color} />
      </div>
      
      {/* Body Area */}
      <div style={{
        position: 'relative',
        width: 140,
        height: 160,
        transformOrigin: 'top center',
        transform: `rotate(${bodyRotation}deg)`,
      }}>
        {/* Torso */}
        <div style={{
          position: 'absolute',
          top: -5,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 4,
          height: 120,
          backgroundColor: color,
          opacity: torsoOpacity,
          borderRadius: 2
        }} />
        
        {/* Arms */}
        <svg width="140" height="100" style={{ position: 'absolute', top: 10, left: 0, opacity: armsOpacity }}>
          <path 
            d={isSlouched 
              ? "M70,0 Q90,50 100,90 M70,0 Q50,50 40,90" 
              : "M70,0 Q110,40 130,20 M70,0 Q30,40 10,20" 
            }
            stroke={color} 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round" 
          />
        </svg>
        
        {/* Legs */}
        <svg width="140" height="150" style={{ position: 'absolute', top: 110, left: 0, opacity: torsoOpacity }}>
          <path 
            d="M70,0 Q90,50 110,120 M70,0 Q50,50 30,120"
            stroke={color} 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round" 
          />
        </svg>
      </div>
    </div>
  );
};
