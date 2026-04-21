import React from 'react';

export const ProFigure: React.FC<{
  gender?: 'male' | 'female';
  pose?: 'standing';
  x?: number;
  y?: number;
  s?: number;
  color?: string;
}> = ({ gender = 'male', pose = 'standing', x = 0, y = 0, s = 1, color = '#FFF' }) => {
  
  // Tầng bậc line weight
  const strokeBody = 4;
  const strokeLimb = 2.5;

  return (
    <div style={{ 
      position: 'absolute', 
      left: x, 
      top: y, 
      transform: `scale(${s})`, 
      transformOrigin: 'bottom center' 
    }}>
      {/* Viewbox tỷ lệ mới: cao và thon hơn (150x260) */}
      <svg width="150" height="260" viewBox="0 0 150 260" style={{ overflow: 'visible' }}>
        
        {/* 1. MẶT & ĐẦU */}
        {/* Đầu nhỏ gọn hơn so với thân */}
        <circle cx="75" cy="40" r="16" stroke={color} strokeWidth={strokeBody} fill="none" />
        {/* Mắt siêu nhỏ (stroke 0, fill color) */}
        <circle cx="69" cy="38" r="1.5" fill={color} />
        <circle cx="81" cy="38" r="1.5" fill={color} />
        {/* Miệng mỏng */}
        <path d="M 71 46 Q 75 48 79 46" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* 2. CỔ & THÂN (Spine) */}
        {/* Nối từ viền dưới của đầu */}
        <path d="M 75 56 L 75 130" stroke={color} strokeWidth={strokeBody} strokeLinecap="round" fill="none" />
        
        {/* Đường hông ngang (Pelvis) để nối chân vững hơn */}
        <path d="M 65 130 L 85 130" stroke={color} strokeWidth={strokeBody} strokeLinecap="round" fill="none" />

        {/* 3. TAY (Limbs - Mỏng hơn body) */}
        {/* Vai hơi dốc xuống, gập ở khuỷu tay, thả lỏng */}
        {/* Tay trái */}
        <path d="M 75 62 C 60 62 53 68 53 85 L 53 125" stroke={color} strokeWidth={strokeLimb} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Tay phải */}
        <path d="M 75 62 C 90 62 97 68 97 85 L 97 125" stroke={color} strokeWidth={strokeLimb} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        
        {/* Bàn tay - chấm tròn */}
        <circle cx="53" cy="125" r="3" fill={color} />
        <circle cx="97" cy="125" r="3" fill={color} />

        {/* 4. CHÂN (Limbs) */}
        {/* Chân trái: Từ hông (65, 130) -> Đầu gối (62, 190) -> Gót (62, 250) -> Mũi chân (50, 250) */}
        <path d="M 67 130 L 62 190 L 62 250 L 48 250" stroke={color} strokeWidth={strokeLimb} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Chân phải: Từ hông (85, 130) -> Đầu gối (88, 190) -> Gót (88, 250) -> Mũi chân (102, 250) */}
        <path d="M 83 130 L 88 190 L 88 250 L 102 250" stroke={color} strokeWidth={strokeLimb} strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Khớp gối (Joints) */}
        <circle cx="62" cy="190" r="2.5" fill={color} />
        <circle cx="88" cy="190" r="2.5" fill={color} />

      </svg>
    </div>
  );
};
