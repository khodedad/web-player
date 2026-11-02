import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { VisualizerStyle } from '../types/player';

interface RadialVisualizerProps {
  style: VisualizerStyle;
  isPlaying: boolean;
  accentColors?: [string, string];
  circleRef: React.RefObject<HTMLDivElement | null>;
}

interface FullscreenParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  colorIdx: number;
  depth: number;
}

export const RadialVisualizer: React.FC<RadialVisualizerProps> = ({
  style = 'avee-ring',
  isPlaying,
  accentColors = ['#ec4899', '#8b5cf6'],
  circleRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const particlesRef = useRef<FullscreenParticle[]>([]);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Cap devicePixelRatio to 1.5 to guarantee ultra-high performance on 4K TVs and mobile
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const updateCanvasDimensions = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions);

    // Initialize 60 Fullscreen Ambient Light Particles scattered across the ENTIRE screen
    particlesRef.current = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.4,
      size: 1.2 + Math.random() * 2.8,
      baseAlpha: 0.15 + Math.random() * 0.45,
      colorIdx: Math.random() > 0.5 ? 0 : 1,
      depth: 0.5 + Math.random() * 0.8,
    }));

    const render = () => {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      ctx.clearRect(0, 0, screenW, screenH);
      phaseRef.current += 0.015;

      // Dynamically obtain the EXACT position and radius of the center circle
      let centerX = screenW / 2;
      let centerY = screenH * 0.42;
      let baseRadius = Math.min(screenW, screenH) * 0.18;

      if (circleRef.current) {
        const rect = circleRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          centerX = rect.left + rect.width / 2;
          centerY = rect.top + rect.height / 2;
          baseRadius = rect.width / 2 + 4;
        }
      }

      const { bass, mid, treble } = audioEngine.getEnergyLevels();
      const freqData = audioEngine.updateFrequencyData();
      const pulseScale = 1 + bass * 0.15;

      // -----------------------------------------------------------------------
      // 1. FULLSCREEN GLOWING AMBIENT PARTICLES (Across the entire screen)
      // -----------------------------------------------------------------------
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // React to bass speed burst
        const speedMultiplier = isPlaying ? (1 + bass * 1.8) * p.depth : 0.6;
        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

        // Wrap around entire screen seamlessly
        if (p.x < 0) p.x = screenW;
        else if (p.x > screenW) p.x = 0;
        if (p.y < 0) p.y = screenH;
        else if (p.y > screenH) p.y = 0;

        const currentAlpha = Math.min(1, p.baseAlpha + (isPlaying ? bass * 0.4 : 0));
        const currentSize = p.size * (isPlaying ? 1 + bass * 0.5 : 1);

        ctx.fillStyle = p.colorIdx === 0 ? accentColors[0] : accentColors[1];
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // -----------------------------------------------------------------------
      // 2. AMBIENT GLOW AURA BEHIND CENTRAL CIRCLE
      // -----------------------------------------------------------------------
      const ambientRadius = baseRadius * 1.95 * pulseScale;
      const ambientGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.75,
        centerX,
        centerY,
        ambientRadius
      );
      ambientGradient.addColorStop(0, `${accentColors[0]}33`);
      ambientGradient.addColorStop(0.55, `${accentColors[1]}15`);
      ambientGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = ambientGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ambientRadius, 0, Math.PI * 2);
      ctx.fill();

      // Proportional bar math based on baseRadius
      const maxBarLength = Math.max(22, Math.min(baseRadius * 0.5, 95));
      const barWidth = Math.max(2.4, Math.min(4.8, baseRadius * 0.04));

      // -----------------------------------------------------------------------
      // STYLE 1: Avee Player Classic Radial Ring (Batched for Max 60 FPS)
      // -----------------------------------------------------------------------
      if (style === 'avee-ring') {
        const numBars = 72;
        const stepAngle = (Math.PI * 2) / numBars;

        // Pass 1: Bloom additive underlay
        ctx.save();
        ctx.globalAlpha = isPlaying ? 0.35 : 0.15;
        ctx.lineWidth = barWidth + 3.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = accentColors[0];
        ctx.beginPath();
        for (let i = 0; i < numBars; i++) {
          const freqVal = freqData[Math.floor((i / numBars) * (freqData.length * 0.7))] || 0;
          const barHeight = Math.max(5, (freqVal / 255) * maxBarLength * (1 + bass * 0.28));
          const angle = i * stepAngle - Math.PI / 2;
          ctx.moveTo(centerX + Math.cos(angle) * (baseRadius + 3), centerY + Math.sin(angle) * (baseRadius + 3));
          ctx.lineTo(centerX + Math.cos(angle) * (baseRadius + 3 + barHeight), centerY + Math.sin(angle) * (baseRadius + 3 + barHeight));
        }
        ctx.stroke();
        ctx.restore();

        // Pass 2: Sharp Crisp Gradient Bars
        ctx.save();
        ctx.lineWidth = barWidth;
        ctx.lineCap = 'round';
        const grad = ctx.createRadialGradient(centerX, centerY, baseRadius, centerX, centerY, baseRadius + maxBarLength + 10);
        grad.addColorStop(0, accentColors[0]);
        grad.addColorStop(0.7, accentColors[1]);
        grad.addColorStop(1, '#ffffff');
        ctx.strokeStyle = grad;
        ctx.beginPath();
        for (let i = 0; i < numBars; i++) {
          const freqVal = freqData[Math.floor((i / numBars) * (freqData.length * 0.7))] || 0;
          const barHeight = Math.max(5, (freqVal / 255) * maxBarLength * (1 + bass * 0.28));
          const angle = i * stepAngle - Math.PI / 2;
          ctx.moveTo(centerX + Math.cos(angle) * (baseRadius + 3), centerY + Math.sin(angle) * (baseRadius + 3));
          ctx.lineTo(centerX + Math.cos(angle) * (baseRadius + 3 + barHeight), centerY + Math.sin(angle) * (baseRadius + 3 + barHeight));
        }
        ctx.stroke();

        // Pass 3: Avee Glowing White Tip Dots
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        for (let i = 0; i < numBars; i += 2) {
          const freqVal = freqData[Math.floor((i / numBars) * (freqData.length * 0.7))] || 0;
          if (freqVal > 40) {
            const barHeight = Math.max(5, (freqVal / 255) * maxBarLength * (1 + bass * 0.28));
            const angle = i * stepAngle - Math.PI / 2;
            const tipX = centerX + Math.cos(angle) * (baseRadius + 8 + barHeight);
            const tipY = centerY + Math.sin(angle) * (baseRadius + 8 + barHeight);
            const dotSize = Math.max(1.5, Math.min(3.5, 1.5 + (freqVal / 255) * 2));
            ctx.moveTo(tipX + dotSize, tipY);
            ctx.arc(tipX, tipY, dotSize, 0, Math.PI * 2);
          }
        }
        ctx.fill();
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // STYLE 2: Neon Tunnel (Infinite 3D Concentric Pulsing Polygon Rings)
      // -----------------------------------------------------------------------
      else if (style === 'neon-tunnel') {
        const ringCount = 5;
        ctx.save();
        ctx.lineCap = 'round';

        for (let r = 0; r < ringCount; r++) {
          const freqIdx = Math.floor((r / ringCount) * 40);
          const freqAmp = (freqData[freqIdx] || 0) / 255;
          const ringRadius = baseRadius + (r + 1) * (maxBarLength * 0.28) * (1 + bass * 0.35);
          const rotation = phaseRef.current * (r % 2 === 0 ? 0.8 : -0.8);

          ctx.strokeStyle = r % 2 === 0 ? accentColors[0] : accentColors[1];
          ctx.globalAlpha = 0.85 - (r / ringCount) * 0.45;
          ctx.lineWidth = Math.max(1.8, 3.8 - r * 0.5);

          ctx.beginPath();
          const sides = 8;
          for (let s = 0; s <= sides; s++) {
            const a = (s / sides) * Math.PI * 2 + rotation;
            const dist = ringRadius + Math.sin(a * 4 + phaseRef.current * 3) * (freqAmp * 15);
            const px = centerX + Math.cos(a) * dist;
            const py = centerY + Math.sin(a) * dist;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // STYLE 3: Quantum Waves (Fluid Undulating Dual Harmonic Ribbons)
      // -----------------------------------------------------------------------
      else if (style === 'quantum-waves') {
        const numPoints = 64;
        const stepAngle = (Math.PI * 2) / numPoints;

        ctx.save();
        // Ribbon 1 (Primary Neon Wave)
        ctx.lineWidth = 3.8;
        ctx.strokeStyle = accentColors[0];
        ctx.beginPath();
        for (let i = 0; i <= numPoints; i++) {
          const idx = i % numPoints;
          const freqVal = freqData[Math.floor((idx / numPoints) * (freqData.length * 0.65))] || 0;
          const waveAmp = (freqVal / 255) * maxBarLength * 0.9 * (1 + bass * 0.35);
          const waveHarmonic = Math.sin(i * 0.4 + phaseRef.current * 4) * 8;
          const angle = idx * stepAngle - Math.PI / 2;
          const r = baseRadius + 12 + waveAmp + waveHarmonic;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Ribbon 2 (Counter-Harmonic Shimmer)
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = accentColors[1];
        ctx.beginPath();
        for (let i = 0; i <= numPoints; i++) {
          const idx = i % numPoints;
          const freqVal = freqData[Math.floor(((numPoints - idx) / numPoints) * (freqData.length * 0.55))] || 0;
          const waveAmp = (freqVal / 255) * maxBarLength * 0.6;
          const waveHarmonic = Math.cos(i * 0.5 - phaseRef.current * 3) * 6;
          const angle = idx * stepAngle - Math.PI / 2;
          const r = baseRadius + 6 + waveAmp + waveHarmonic;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // STYLE 4: Starburst (Dynamic Laser Beams Radiating into Screen Space)
      // -----------------------------------------------------------------------
      else if (style === 'starburst') {
        const numBeams = 48;
        const stepAngle = (Math.PI * 2) / numBeams;

        ctx.save();
        ctx.lineWidth = barWidth * 0.85;
        ctx.lineCap = 'round';

        ctx.beginPath();
        for (let i = 0; i < numBeams; i++) {
          const freqVal = freqData[Math.floor((i / numBeams) * (freqData.length * 0.7))] || 0;
          const beamLen = Math.max(10, (freqVal / 255) * (maxBarLength * 1.5) * (1 + bass * 0.45));
          const angle = i * stepAngle + phaseRef.current * 0.2;

          ctx.moveTo(centerX + Math.cos(angle) * (baseRadius + 5), centerY + Math.sin(angle) * (baseRadius + 5));
          ctx.lineTo(centerX + Math.cos(angle) * (baseRadius + 5 + beamLen), centerY + Math.sin(angle) * (baseRadius + 5 + beamLen));
        }

        const beamGrad = ctx.createRadialGradient(centerX, centerY, baseRadius, centerX, centerY, baseRadius + maxBarLength * 1.6);
        beamGrad.addColorStop(0, '#ffffff');
        beamGrad.addColorStop(0.3, accentColors[0]);
        beamGrad.addColorStop(0.85, accentColors[1]);
        beamGrad.addColorStop(1, 'transparent');
        ctx.strokeStyle = beamGrad;
        ctx.stroke();
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // STYLE 5: Dual Spectrum (High-Density Inward + Outward Needles)
      // -----------------------------------------------------------------------
      else if (style === 'dual-spectrum') {
        const numBars = 64;
        const stepAngle = (Math.PI * 2) / numBars;

        ctx.save();
        ctx.lineWidth = barWidth * 0.9;
        ctx.lineCap = 'round';

        // Outer Needles
        ctx.strokeStyle = accentColors[0];
        ctx.beginPath();
        for (let i = 0; i < numBars; i++) {
          const freqVal = freqData[Math.floor((i / numBars) * (freqData.length * 0.7))] || 0;
          const outerHeight = Math.max(4, (freqVal / 255) * maxBarLength * 0.95);
          const angle = i * stepAngle - Math.PI / 2;
          ctx.moveTo(centerX + Math.cos(angle) * (baseRadius + 4), centerY + Math.sin(angle) * (baseRadius + 4));
          ctx.lineTo(centerX + Math.cos(angle) * (baseRadius + 4 + outerHeight), centerY + Math.sin(angle) * (baseRadius + 4 + outerHeight));
        }
        ctx.stroke();

        // Inner Needles
        ctx.strokeStyle = accentColors[1];
        ctx.lineWidth = Math.max(1.8, barWidth * 0.7);
        ctx.beginPath();
        for (let i = 0; i < numBars; i++) {
          const freqVal = freqData[Math.floor((i / numBars) * (freqData.length * 0.7))] || 0;
          const innerHeight = Math.max(3, (freqVal / 255) * (baseRadius * 0.28));
          const angle = i * stepAngle - Math.PI / 2;
          ctx.moveTo(centerX + Math.cos(angle) * (baseRadius - 2), centerY + Math.sin(angle) * (baseRadius - 2));
          ctx.lineTo(centerX + Math.cos(angle) * (baseRadius - 2 - innerHeight), centerY + Math.sin(angle) * (baseRadius - 2 - innerHeight));
        }
        ctx.stroke();
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // STYLE 6: Cyber Equalizer (Digital Segmented LED Meter Arcs)
      // -----------------------------------------------------------------------
      else if (style === 'cyber-equalizer') {
        const segments = 24;
        const segmentAngle = (Math.PI * 2) / segments;
        const gap = 0.05;

        ctx.save();
        ctx.lineWidth = 3.6;

        for (let i = 0; i < segments; i++) {
          const freqVal = freqData[Math.floor((i / segments) * (freqData.length * 0.65))] || 0;
          const barsCount = Math.floor((freqVal / 255) * 7) + 1;
          const startAngle = i * segmentAngle - Math.PI / 2 + gap;
          const endAngle = (i + 1) * segmentAngle - Math.PI / 2 - gap;

          for (let r = 0; r < barsCount; r++) {
            const currentR = baseRadius + 6 + r * 7;
            ctx.strokeStyle = r < 3 ? accentColors[0] : (r < 5 ? accentColors[1] : '#ffffff');
            ctx.beginPath();
            ctx.arc(centerX, centerY, currentR, startAngle, endAngle);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', updateCanvasDimensions);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [style, isPlaying, accentColors, circleRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
};
