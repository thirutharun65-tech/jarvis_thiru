import React, { useEffect, useRef } from 'react';
import { JarvisState } from '../types';

interface AudioVisualizerProps {
  state: JarvisState;
  isActive: boolean;
  audioLevel?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  state,
  isActive,
  audioLevel = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const numBars = 32;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isVoiceActive = state === 'LISTENING' || state === 'SPEAKING' || isActive;
      const primaryColor =
        state === 'SPEAKING'
          ? '#00f0ff'
          : state === 'LISTENING'
          ? '#38bdf8'
          : state === 'EXECUTING'
          ? '#6366f1'
          : state === 'THINKING'
          ? '#f59e0b'
          : state === 'ERROR'
          ? '#ef4444'
          : '#0ea5e9';

      const barWidth = width / numBars - 2;
      const midY = height / 2;

      // Draw Center Baseline
      ctx.strokeStyle = `${primaryColor}33`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Render Frequency Bars & Sine Wave
      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 2) + 1;
        const normalized = (i - numBars / 2) / (numBars / 2);
        const envelope = Math.cos(normalized * Math.PI * 0.5);

        let dynamicHeight = 4;
        if (isVoiceActive) {
          const sine = Math.sin(phase + i * 0.35);
          const noise = Math.sin(phase * 1.5 + i * 0.8) * 0.5;
          const energy = Math.max(0.15, audioLevel > 0 ? audioLevel : 0.45);
          dynamicHeight = Math.abs(sine + noise) * envelope * (height * 0.42) * energy + 6;
        } else if (state === 'THINKING' || state === 'EXECUTING') {
          const sine = Math.sin(phase * 2 + i * 0.5);
          dynamicHeight = Math.abs(sine) * envelope * 18 + 4;
        } else {
          // Subtle resting breathing wave
          const sine = Math.sin(phase * 0.8 + i * 0.2);
          dynamicHeight = Math.abs(sine) * envelope * 8 + 3;
        }

        // Draw top & bottom symmetrical bars
        ctx.fillStyle = primaryColor;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = isVoiceActive ? 8 : 2;

        const yTop = midY - dynamicHeight;
        const yBottom = midY;

        ctx.fillRect(x, yTop, barWidth, dynamicHeight);
        ctx.fillStyle = `${primaryColor}66`;
        ctx.fillRect(x, yBottom, barWidth, dynamicHeight * 0.6);
      }

      phase += isVoiceActive ? 0.15 : 0.04;
      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [state, isActive, audioLevel]);

  return (
    <div className="relative w-full h-14 flex items-center justify-center bg-[#050b14]/80 rounded-lg border border-cyan-900/30 overflow-hidden px-3">
      <canvas
        ref={canvasRef}
        width={340}
        height={56}
        className="w-full h-full"
      />
      <div className="absolute top-1 right-2 flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-cyan-400/70 uppercase">
        <span className={`w-1.5 h-1.5 rounded-full ${isActive || state === 'LISTENING' || state === 'SPEAKING' ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
        {state === 'LISTENING' ? 'MIC AUDIO STREAM' : state === 'SPEAKING' ? 'VOICE SYNTH' : 'NEURAL AUDIO'}
      </div>
    </div>
  );
};
