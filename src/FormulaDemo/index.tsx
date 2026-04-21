import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';

// ═══════════════════════════════════════════════════════════════════════════
// TIER 1: CORE DNA — Applied to EVERY scene automatically
// ═══════════════════════════════════════════════════════════════════════════
const C = { bg: '#000', white: '#FFF', yellow: '#F5E500', red: '#CC0000', green: '#2ECC71' };

// Film Grain (79% of videos)
const FilmGrain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width="100%" height="100%" style={{ position:'absolute',inset:0,zIndex:999,pointerEvents:'none',opacity:0.06 }}>
      <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed={f*3}/><feColorMatrix type="saturate" values="0"/></filter>
      <rect width="100%" height="100%" filter="url(#g)"/>
    </svg>
  );
};

// Vignette
const Vignette: React.FC = () => (
  <div style={{ position:'absolute',inset:0,zIndex:998,pointerEvents:'none',
    background:'radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.65) 100%)' }}/>
);

// Glow wrapper (96% of videos!)
const Glow: React.FC<{children:React.ReactNode;i?:number}> = ({children,i=0.3}) => (
  <div style={{filter:`drop-shadow(0 0 8px rgba(255,255,255,${i})) drop-shadow(0 0 18px rgba(255,255,255,${i*0.4}))`}}>{children}</div>
);

// CinematicWrapper — wraps every scene with Core DNA
const CinematicWrapper: React.FC<{children:React.ReactNode;start:number;end:number}> = ({children,start,end}) => {
  const frame = useCurrentFrame();
  if (frame < start || frame > end) return null;
  const local = frame - start;
  const dur = end - start;
  const zoom = interpolate(local,[0,dur],[1,1.04],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const fadeOut = interpolate(local,[dur-6,dur],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor:C.bg,opacity:fadeOut,transform:`scale(${zoom})`,
      fontFamily:"'Impact','Arial Black','Bebas Neue',sans-serif"}}>
      {children}
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// Stick Figure — improved quality with smooth curves
const Figure: React.FC<{
  gender?:'male'|'female'; pose?:string; x:number; y:number; s?:number; color?:string;
}> = ({gender='male',pose='standing',x,y,s=1,color=C.white}) => {
  const frame = useCurrentFrame();
  const breathe = Math.sin(frame/20)*1.2;
  const sway = Math.sin(frame/28)*0.6;

  const arms: Record<string,string> = {
    standing: 'M50,52 C60,58 68,52 78,46 M50,52 C40,58 32,52 22,46',
    arms_up: 'M50,52 C55,38 60,22 70,12 M50,52 C45,38 40,22 30,12',
    arms_crossed: 'M50,55 C58,58 48,65 42,62 M50,55 C42,58 52,65 58,62',
    pointing: 'M50,52 C65,45 78,35 88,28 M50,52 C38,58 28,52 20,48',
    sitting: 'M50,52 C60,56 68,54 74,50 M50,52 C40,56 32,54 26,50',
    crouching: 'M50,60 C58,55 65,58 70,62 M50,60 C42,55 35,58 30,62',
    falling: 'M50,52 C65,40 80,35 90,45 M50,52 C35,40 20,35 15,50',
    climbing: 'M50,48 C58,35 65,25 72,18 M50,48 C42,55 35,60 28,62',
    hugging: 'M50,52 C58,55 62,58 60,62 M50,52 C42,55 38,58 40,62',
  };

  const legs: Record<string,string> = {
    standing: `M50,88 C45,108 40,128 35,145 M50,88 C55,108 60,128 65,145`,
    arms_up: `M50,88 C45,108 40,128 35,145 M50,88 C55,108 60,128 65,145`,
    arms_crossed: `M50,88 C45,108 40,128 35,145 M50,88 C55,108 60,128 65,145`,
    pointing: `M50,88 C45,108 40,128 35,145 M50,88 C55,108 60,128 65,145`,
    sitting: `M50,88 C45,95 38,108 30,118 M50,88 C55,95 62,108 70,118`,
    crouching: `M50,85 C45,92 38,98 32,105 M50,85 C55,92 62,98 68,105`,
    falling: `M50,88 C60,100 70,110 78,125 M50,88 C42,105 38,120 40,140`,
    climbing: `M50,88 C48,100 45,112 42,125 M50,88 C55,98 60,108 62,120`,
    hugging: `M50,88 C45,108 40,128 35,145 M50,88 C55,108 60,128 65,145`,
  };

  const bodyEnd = pose === 'crouching' ? 82 : 88;
  const headY = pose === 'crouching' ? 32 : 22;

  return (
    <div style={{position:'absolute',left:x,top:y,transform:`scale(${s}) rotate(${sway}deg)`,transformOrigin:'bottom center'}}>
      <Glow i={0.25}>
        <svg width="100" height="150" viewBox="0 0 100 150">
          <circle cx="50" cy={headY} r="13" stroke={color} strokeWidth="2.5" fill="none"/>
          {gender==='female' && <><path d={`M37,${headY-3} C35,${headY+10} 32,${headY+20} 28,${headY+28}`} stroke={color} strokeWidth="2" fill="none"/>
            <path d={`M63,${headY-3} C65,${headY+10} 68,${headY+20} 72,${headY+28}`} stroke={color} strokeWidth="2" fill="none"/></>}
          <line x1="50" y1={headY+14} x2="50" y2={bodyEnd+breathe} stroke={color} strokeWidth="2.5"/>
          {gender==='female' && <path d={`M50,62 L38,${bodyEnd+breathe+5} L62,${bodyEnd+breathe+5} Z`} stroke={color} strokeWidth="1.8" fill="none"/>}
          <path d={arms[pose]||arms.standing} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d={legs[pose]||legs.standing} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </svg>
      </Glow>
    </div>
  );
};

// Self-draw Arrow
const Arrow: React.FC<{x1:number;y1:number;x2:number;y2:number;color?:string;delay?:number}> = ({x1,y1,x2,y2,color=C.yellow,delay=0}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame,[delay,delay+15],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
  const len = Math.sqrt((x2-x1)**2+(y2-y1)**2);
  return (
    <svg style={{position:'absolute',inset:0,zIndex:50,pointerEvents:'none'}} width="1920" height="1080">
      <defs><marker id="ah" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill={color} opacity={p}/></marker></defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="3" markerEnd="url(#ah)" strokeDasharray={len} strokeDashoffset={len*(1-p)} style={{filter:`drop-shadow(0 0 6px ${color})`}}/>
    </svg>
  );
};

// Badge Text (79% of videos)
const Badge: React.FC<{text:string;color?:string;bg?:string;x:number;y:number;delay?:number;size?:number}> = ({text,color=C.white,bg='rgba(255,255,255,0.08)',x,y,delay=0,size=24}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame,[delay,delay+8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const sc = interpolate(frame,[delay,delay+8],[0.85,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
  return (
    <div style={{position:'absolute',left:x,top:y,opacity:op,transform:`scale(${sc})`,
      padding:'8px 22px',border:`2px solid ${color}`,backgroundColor:bg,color,fontSize:size,
      fontWeight:900,letterSpacing:2,textTransform:'uppercase' as const}}>
      {text}
    </div>
  );
};

// Animated text with blur reveal
const BlurText: React.FC<{text:string;color?:string;size?:number;delay?:number;style?:React.CSSProperties}> = ({text,color=C.white,size=48,delay=0,style={}}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame,[delay,delay+10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const blur = interpolate(frame,[delay,delay+12],[12,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return (
    <div style={{color,fontSize:size,fontWeight:900,letterSpacing:3,textTransform:'uppercase' as const,
      opacity:op,filter:`blur(${blur}px)`,...style}}>
      {text}
    </div>
  );
};

// Strikethrough text (RARE — 25%)
const StrikeText: React.FC<{text:string;x:number;y:number;delay?:number;size?:number}> = ({text,x,y,delay=0,size=36}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame,[delay,delay+8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const lineW = interpolate(frame,[delay+10,delay+18],[0,100],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
  return (
    <div style={{position:'absolute',left:x,top:y,opacity:op}}>
      <div style={{color:C.white,fontSize:size,fontWeight:700,letterSpacing:2,textTransform:'uppercase' as const,position:'relative'}}>
        {text}
        <div style={{position:'absolute',top:'50%',left:0,width:`${lineW}%`,height:3,backgroundColor:C.red,transform:'translateY(-50%)'}}/>
      </div>
    </div>
  );
};

// Chair Prop
const Chair: React.FC<{x:number;y:number;s?:number}> = ({x,y,s=1}) => (
  <div style={{position:'absolute',left:x,top:y,transform:`scale(${s})`}}>
    <Glow i={0.15}><svg width="70" height="80" viewBox="0 0 70 80">
      <path d="M10,28 L10,80 M60,28 L60,80 M10,28 C10,10 60,10 60,28 M10,28 L60,28" stroke={C.white} strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg></Glow>
  </div>
);

// Phone Prop (64%)
const Phone: React.FC<{x:number;y:number;s?:number}> = ({x,y,s=1}) => (
  <div style={{position:'absolute',left:x,top:y,transform:`scale(${s})`}}>
    <Glow i={0.15}><svg width="30" height="50" viewBox="0 0 30 50">
      <rect x="2" y="2" width="26" height="46" rx="4" stroke={C.white} strokeWidth="2" fill="none"/>
      <line x1="10" y1="42" x2="20" y2="42" stroke={C.white} strokeWidth="1.5"/>
    </svg></Glow>
  </div>
);

// Heart Prop (61%)
const Heart: React.FC<{x:number;y:number;s?:number;color?:string}> = ({x,y,s=1,color=C.red}) => {
  const frame = useCurrentFrame();
  const beat = 1 + Math.sin(frame/8)*0.05;
  return (
    <div style={{position:'absolute',left:x,top:y,transform:`scale(${s*beat})`}}>
      <Glow i={0.3}><svg width="40" height="38" viewBox="0 0 40 38">
        <path d="M20,35 C10,28 0,20 0,12 C0,5 5,0 12,0 C16,0 19,2 20,5 C21,2 24,0 28,0 C35,0 40,5 40,12 C40,20 30,28 20,35Z" stroke={color} strokeWidth="2" fill="none"/>
      </svg></Glow>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 10 SCENES — Full 3-Tier Formula Demo (~40 seconds = 1200 frames)
// ═══════════════════════════════════════════════════════════════════════════

// S1: text_only — HOOK (CORE) | 0-100
const S1: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <CinematicWrapper start={0} end={100}>
      <div style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:'100%'}}>
        <Glow i={0.5}>
          <BlurText text="THE REASON" color={C.white} size={70} delay={5}/>
          <BlurText text="SHE PULLED AWAY" color={C.yellow} size={100} delay={15} style={{marginTop:10,filter:`drop-shadow(0 0 25px ${C.yellow})`}}/>
        </Glow>
      </div>
    </CinematicWrapper>
  );
};

// S2: dual_character — Confrontation (CORE+COMMON) | 100-240
const S2: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 100;
  const f1 = interpolate(local,[5,18],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const f1x = interpolate(local,[5,18],[-80,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
  const f2 = interpolate(local,[12,25],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const f2x = interpolate(local,[12,25],[80,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
  return (
    <CinematicWrapper start={100} end={240}>
      <div style={{opacity:f1,transform:`translateX(${f1x}px)`}}>
        <Figure gender="male" pose="pointing" x={330} y={280} s={3.2}/>
      </div>
      <div style={{opacity:f2,transform:`translateX(${f2x}px)`}}>
        <Figure gender="female" pose="arms_crossed" x={1200} y={280} s={3.2}/>
      </div>
      <Arrow x1={620} y1={480} x2={1150} y2={480} color={C.yellow} delay={128}/>
      <Badge text="CHASING" color={C.red} bg="rgba(204,0,0,0.12)" x={365} y={810} delay={132} size={30}/>
      <Badge text="COLD" color={C.white} x={1230} y={810} delay={136} size={30}/>
      <BlurText text="You pushed. She retreated." color={C.white} size={34} delay={125} style={{position:'absolute',top:100,left:0,right:0,textAlign:'center'}}/>
    </CinematicWrapper>
  );
};

// S3: environment_scene — Sitting with phone (COMMON) | 240-390
const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 240;
  const envOp = interpolate(local,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return (
    <CinematicWrapper start={240} end={390}>
      <div style={{opacity:envOp}}>
        <Chair x={780} y={480} s={3}/>
        <Figure gender="male" pose="sitting" x={800} y={300} s={3}/>
        <Phone x={1050} y={520} s={3}/>
      </div>
      <BlurText text="CHECKING HER SOCIALS" color={C.white} size={30} delay={255} style={{position:'absolute',top:120,left:0,right:0,textAlign:'center'}}/>
      <BlurText text="EVERY 5 MINUTES" color={C.yellow} size={72} delay={265} style={{position:'absolute',top:170,left:0,right:0,textAlign:'center',filter:`drop-shadow(0 0 20px ${C.yellow})`}}/>
      <Badge text="NEEDY BEHAVIOR" color={C.red} bg="rgba(204,0,0,0.12)" x={760} y={880} delay={275} size={26}/>
    </CinematicWrapper>
  );
};

// S4: single_char_with_text — Concept Word (CORE) | 390-510
const S4: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 390;
  const figOp = interpolate(local,[5,15],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const conceptSc = interpolate(local,[25,33],[1.35,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
  const conceptOp = interpolate(local,[25,30],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return (
    <CinematicWrapper start={390} end={510}>
      <div style={{display:'flex',flexDirection:'row',height:'100%'}}>
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 80px'}}>
          <BlurText text="SHE NEEDED TO FEEL" color={C.white} size={32} delay={405}/>
          <div style={{color:C.yellow,fontSize:110,fontWeight:900,letterSpacing:5,textTransform:'uppercase' as const,
            marginTop:10,transform:`scale(${conceptSc})`,transformOrigin:'left center',opacity:conceptOp,
            filter:`drop-shadow(0 0 25px ${C.yellow})`}}>
            MYSTERY
          </div>
        </div>
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',opacity:figOp}}>
          <Figure gender="male" pose="standing" x={0} y={0} s={4.5}/>
        </div>
      </div>
    </CinematicWrapper>
  );
};

// S5: flowchart — Process (COMMON: 82%) | 510-670
const S5: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 510;
  return (
    <CinematicWrapper start={510} end={670}>
      <div style={{position:'absolute',top:80,left:0,right:0,textAlign:'center'}}>
        <BlurText text="THE CYCLE OF NEEDINESS" color={C.yellow} size={44} delay={520}/>
      </div>
      {/* Node 1 */}
      <Badge text="YOU TEXT HER" color={C.white} x={200} y={400} delay={530} size={26}/>
      <Arrow x1={430} y1={420} x2={620} y2={420} delay={540}/>
      {/* Node 2 */}
      <Badge text="SHE IGNORES" color={C.red} bg="rgba(204,0,0,0.12)" x={640} y={400} delay={545} size={26}/>
      <Arrow x1={880} y1={420} x2={1070} y2={420} delay={555}/>
      {/* Node 3 */}
      <Badge text="YOU PANIC" color={C.red} bg="rgba(204,0,0,0.12)" x={1090} y={400} delay={560} size={26}/>
      {/* Loop arrow back */}
      <Arrow x1={1200} y1={450} x2={300} y2={550} color={C.red} delay={570}/>
      <Badge text="REPEAT ∞" color={C.red} x={680} y={570} delay={575} size={22}/>
      {/* Small figure trapped in loop */}
      <div style={{opacity: interpolate(local,[70,80],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>
        <Figure gender="male" pose="crouching" x={700} y={620} s={2}/>
      </div>
    </CinematicWrapper>
  );
};

// S6: ★ RARE ★ giant_character + strikethrough — Climax | 670-820
const S6: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 670;
  const figOp = interpolate(local,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const figSc = interpolate(local,[0,12],[0.7,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
  // Glitch flash (RARE transition)
  const glitch = (local > 0 && local < 3) ? 0.8 : 0;
  return (
    <CinematicWrapper start={670} end={820}>
      {/* Glitch flash */}
      <div style={{position:'absolute',inset:0,backgroundColor:C.white,opacity:glitch,zIndex:200}}/>
      {/* Giant falling figure */}
      <div style={{opacity:figOp,transform:`scale(${figSc})`,display:'flex',justifyContent:'center',alignItems:'center',height:'100%'}}>
        <Figure gender="male" pose="falling" x={750} y={200} s={6}/>
      </div>
      {/* Strikethrough wrong beliefs */}
      <StrikeText text="TEXT HER MORE" x={150} y={200} delay={690} size={40}/>
      <StrikeText text="SHOW MORE INTEREST" x={150} y={280} delay={700} size={40}/>
      <StrikeText text="BE MORE AVAILABLE" x={150} y={360} delay={710} size={40}/>
      {/* Truth */}
      <BlurText text="WRONG." color={C.yellow} size={80} delay={725} style={{position:'absolute',bottom:120,left:150,filter:`drop-shadow(0 0 25px ${C.yellow})`}}/>
    </CinematicWrapper>
  );
};

// S7: split_screen — Before/After (COMMON: 64%) | 820-960
const S7: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 820;
  const dividerX = interpolate(local,[5,15],[1920,960],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
  return (
    <CinematicWrapper start={820} end={960}>
      {/* Left side: Before (red tint) */}
      <div style={{position:'absolute',left:0,top:0,width:'50%',height:'100%',borderRight:`2px solid ${C.red}`}}>
        <Badge text="BEFORE" color={C.red} x={350} y={80} delay={840} size={32}/>
        <Figure gender="male" pose="crouching" x={350} y={350} s={3} color={C.red}/>
        <Badge text="DESPERATE" color={C.red} bg="rgba(204,0,0,0.12)" x={340} y={830} delay={848}/>
      </div>
      {/* Right side: After (green/yellow tint) */}
      <div style={{position:'absolute',right:0,top:0,width:'50%',height:'100%'}}>
        <Badge text="AFTER" color={C.yellow} x={380} y={80} delay={850} size={32}/>
        <Figure gender="male" pose="standing" x={380} y={350} s={3}/>
        <Heart x={550} y={500} s={2} color={C.yellow}/>
        <Badge text="MAGNETIC" color={C.yellow} x={370} y={830} delay={858}/>
      </div>
      {/* Divider line */}
      <div style={{position:'absolute',left:dividerX,top:0,width:2,height:'100%',backgroundColor:'rgba(255,255,255,0.3)'}}/>
    </CinematicWrapper>
  );
};

// S8: dual_character — Resolution (COMMON) | 960-1080
const S8: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 960;
  const f1 = interpolate(local,[5,15],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const f2 = interpolate(local,[10,20],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return (
    <CinematicWrapper start={960} end={1080}>
      <div style={{opacity:f1}}><Figure gender="male" pose="standing" x={550} y={300} s={3.5}/></div>
      <div style={{opacity:f2}}><Figure gender="female" pose="hugging" x={950} y={300} s={3.5}/></div>
      <Heart x={820} y={350} s={2.5}/>
      <Arrow x1={1100} y1={480} x2={750} y2={480} color={C.yellow} delay={980}/>
      <BlurText text="SHE COMES TO YOU" color={C.yellow} size={50} delay={975} style={{position:'absolute',top:120,left:0,right:0,textAlign:'center',filter:`drop-shadow(0 0 20px ${C.yellow})`}}/>
    </CinematicWrapper>
  );
};

// S9: text_only — Lesson (CORE) | 1080-1160
const S9: React.FC = () => (
  <CinematicWrapper start={1080} end={1160}>
    <div style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:'100%'}}>
      <Glow i={0.4}>
        <BlurText text="STOP CHASING." color={C.white} size={60} delay={1090}/>
        <BlurText text="START ATTRACTING." color={C.white} size={60} delay={1100} style={{marginTop:15}}/>
      </Glow>
    </div>
  </CinematicWrapper>
);

// S10: text_only — Final Impact (CORE) | 1160-1260
const S10: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 1160;
  const sc = interpolate(local,[10,20],[1.5,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
  const op = interpolate(local,[10,15],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return (
    <CinematicWrapper start={1160} end={1260}>
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%'}}>
        <Glow i={0.6}>
          <div style={{color:C.yellow,fontSize:120,fontWeight:900,letterSpacing:6,textTransform:'uppercase' as const,
            transform:`scale(${sc})`,opacity:op,filter:`drop-shadow(0 0 35px ${C.yellow})`}}>
            BE THE PRIZE.
          </div>
        </Glow>
      </div>
    </CinematicWrapper>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPOSITION — 42 seconds (1260 frames @ 30fps)
// ═══════════════════════════════════════════════════════════════════════════
export const FormulaDemo: React.FC = () => (
  <AbsoluteFill style={{backgroundColor:C.bg}}>
    <S1/><S2/><S3/><S4/><S5/><S6/><S7/><S8/><S9/><S10/>
    <FilmGrain/><Vignette/>
  </AbsoluteFill>
);
