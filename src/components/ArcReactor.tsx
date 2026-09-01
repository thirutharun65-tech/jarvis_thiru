import React, { useId } from 'react';
import { JarvisState } from '../types';

interface ArcReactorProps {
  state: JarvisState;
  onClick?: () => void;
  size?: number;
  audioLevel?: number; // 0 to 1
}

export const ArcReactor: React.FC<ArcReactorProps> = ({
  state,
  onClick,
  size = 140,
  audioLevel = 0,
}) => {
  const maskId = useId();
  const glowId = useId();
  const gradId = useId();

  // State color mapping
  const getColor = () => {
    switch (state) {
      case 'LISTENING':
        return '#00f0ff'; // Cyan
      case 'UNDERSTANDING':
        return '#38bdf8'; // Sky Blue
      case 'THINKING':
        return '#f59e0b'; // Amber
      case 'EXECUTING':
        return '#6366f1'; // Indigo/Purple
      case 'SPEAKING':
        return '#06b6d4'; // Bright Teal
      case 'COMPLETE':
        return '#10b981'; // Emerald
      case 'ERROR':
        return '#ef4444'; // Crimson
      case 'IDLE':
      default:
        return '#00d8f6';
    }
  };

  const currentColor = getColor();
  const scale = 1 + audioLevel * 0.25;

  return (
    <div
      id="jarvis-arc-reactor-container"
      className="relative flex items-center justify-center cursor-pointer group select-none transition-transform duration-200"
      style={{ width: size, height: size }}
      onClick={onClick}
      title={`JARVIS State: ${state} (Click to toggle voice)`}
    >
      {/* Outer ambient aura glow */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-40 transition-all duration-500 group-hover:opacity-75"
        style={{
          backgroundColor: currentColor,
          transform: `scale(${scale * (state === 'LISTENING' || state === 'SPEAKING' ? 1.3 : 1)})`,
        }}
      />

      {/* SVG Arc Reactor Core */}
      <svg
        viewBox="0 0 200 200"
        className="relative w-full h-full drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]"
        style={{ transform: `scale(${scale})` }}
      >
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="35%" stopColor={currentColor} stopOpacity="0.8" />
            <stop offset="70%" stopColor={currentColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="50%" stopColor={currentColor} />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>

        {/* Outer Ring with Segments */}
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="#0f172a"
          strokeWidth="6"
        />
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke={currentColor}
          strokeWidth="2"
          strokeDasharray="4 8"
          className={state === 'THINKING' || state === 'EXECUTING' ? 'animate-[spin_4s_linear_infinite]' : ''}
          opacity="0.8"
        />

        {/* Middle Triangular/Poly Segment Ring */}
        <g
          className={
            state === 'LISTENING'
              ? 'animate-[spin_6s_linear_infinite]'
              : state === 'EXECUTING'
              ? 'animate-[spin_2s_linear_infinite_reverse]'
              : 'animate-[spin_16s_linear_infinite]'
          }
          style={{ transformOrigin: '100px 100px' }}
        >
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle, i) => (
            <rect
              key={i}
              x="96"
              y="18"
              width="8"
              height="16"
              rx="2"
              fill={currentColor}
              opacity={i % 2 === 0 ? '0.9' : '0.4'}
              transform={`rotate(${angle} 100 100)`}
            />
          ))}
        </g>

        {/* Secondary Inner Gyro Ring */}
        <circle
          cx="100"
          cy="100"
          r="62"
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
        />
        <circle
          cx="100"
          cy="100"
          r="62"
          fill="none"
          stroke={currentColor}
          strokeWidth="3"
          strokeDasharray="20 15 35 10"
          className={state !== 'IDLE' ? 'animate-[spin_3s_linear_infinite_reverse]' : ''}
          style={{ transformOrigin: '100px 100px' }}
        />

        {/* Triangle Inner Lattice (Tony Stark Arc Geometry) */}
        <polygon
          points="100,48 145,126 55,126"
          fill="none"
          stroke={currentColor}
          strokeWidth="1.5"
          opacity="0.75"
          className={state === 'EXECUTING' ? 'animate-pulse' : ''}
        />
        <polygon
          points="100,152 145,74 55,74"
          fill="none"
          stroke={currentColor}
          strokeWidth="1.5"
          opacity="0.4"
        />

        {/* Inner Core Pulse Glow */}
        <circle
          cx="100"
          cy="100"
          r={state === 'LISTENING' || state === 'SPEAKING' ? 32 + audioLevel * 10 : 28}
          fill={`url(#${glowId})`}
          className="transition-all duration-100"
        />

        {/* Bright Center Node */}
        <circle
          cx="100"
          cy="100"
          r="12"
          fill="#ffffff"
          className="drop-shadow-[0_0_8px_#ffffff]"
        />
      </svg>

      {/* State badge overlay underneath */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase border bg-[#050b14]/90 shadow-lg transition-colors"
        style={{
          borderColor: currentColor,
          color: currentColor,
          boxShadow: `0 0 10px ${currentColor}33`,
        }}
      >
        ● {state}
      </div>
    </div>
  );
};
