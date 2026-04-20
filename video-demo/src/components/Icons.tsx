import React from 'react';

// Common props for icons
export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
};

// Default minimal stick figure head
export const CircleHead: React.FC<IconProps> = ({ size = 80, color = "#FFF", strokeWidth = 4, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <circle cx="50" cy="50" r="45" stroke={color} strokeWidth={strokeWidth} fill="none" />
  </svg>
);

// Wrench - Fix Mode
export const WrenchHead: React.FC<IconProps> = ({ size = 80, color = "#FFF", strokeWidth = 5, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <circle cx="50" cy="50" r="45" fill="#000" />
    <path d="M70,30 A15,15 0 0,0 45,45 L20,70 A5,5 0 0,0 30,80 L55,55 A15,15 0 0,0 70,30 Z" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M65,25 L75,35" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
  </svg>
);

// Syringe - Injection
export const SyringeHead: React.FC<IconProps> = ({ size = 80, color = "#FFF", strokeWidth = 4, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <circle cx="50" cy="50" r="45" fill="#000" />
    <rect x="40" y="30" width="20" height="40" stroke={color} strokeWidth={strokeWidth} fill="none" rx="2" />
    <line x1="50" y1="70" x2="50" y2="85" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <line x1="35" y1="30" x2="65" y2="30" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <line x1="50" y1="15" x2="50" y2="30" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <line x1="40" y1="15" x2="60" y2="15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    {/* Measurement lines */}
    <line x1="40" y1="40" x2="48" y2="40" stroke={color} strokeWidth={2} />
    <line x1="40" y1="50" x2="48" y2="50" stroke={color} strokeWidth={2} />
    <line x1="40" y1="60" x2="48" y2="60" stroke={color} strokeWidth={2} />
  </svg>
);

// Gear - Thinking/Loop
export const GearHead: React.FC<IconProps> = ({ size = 80, color = "#FFF", strokeWidth = 4, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <g transform="translate(50, 50)">
      <circle cx="0" cy="0" r="28" stroke={color} strokeWidth={strokeWidth} fill="#000" />
      <circle cx="0" cy="0" r="10" stroke={color} strokeWidth={strokeWidth} fill="none" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
        <path key={angle} d="M -6,-28 L -4,-38 L 4,-38 L 6,-28" transform={`rotate(${angle})`} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" />
      ))}
    </g>
  </svg>
);

// Crown - Power
export const CrownHead: React.FC<IconProps> = ({ size = 80, color = "#FFF", strokeWidth = 4, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <circle cx="50" cy="50" r="45" fill="#000" />
    <path d="M25,70 L75,70 L85,35 L65,45 L50,25 L35,45 L15,35 Z" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" />
  </svg>
);

// Mask - Identity
export const MaskHead: React.FC<IconProps> = ({ size = 80, color = "#FFF", strokeWidth = 4, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <circle cx="50" cy="50" r="45" fill="#000" />
    <path d="M20,50 Q50,90 80,50 Q50,10 20,50" stroke={color} strokeWidth={strokeWidth} fill="none" />
    <path d="M35,45 Q40,40 45,45 M55,45 Q60,40 65,45 M40,65 Q50,75 60,65" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
  </svg>
);

// Cracked Circle
export const CrackedCircleHead: React.FC<IconProps> = ({ size = 80, color = "#FFF", strokeWidth = 4, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <circle cx="50" cy="50" r="45" stroke={color} strokeWidth={strokeWidth} fill="#000" />
    <path d="M50,5 L45,30 L60,50 L40,70 L55,95" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" />
  </svg>
);
