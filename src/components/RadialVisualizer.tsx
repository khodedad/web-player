import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { VisualizerStyle } from '../types/player';

interface RadialVisualizerProps {
  style: VisualizerStyle;
  isPlaying: boolean;
  accentColors?: [string, string];
  circleRef: React.RefObject<HTMLDivElement | null>;
}

interface Particle {
  angle: number;
  distOffset: number;
  speed: number;
  radius: number;
  alpha: number;
  color: string;
}

export const RadialVisualizer: React.FC<RadialVisualizerProps> = ({
  style = 'avee-ring',
  isPlaying,
  accentColors = ['#ec4899', '#8b5cf6'],
  circleRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Cap devicePixelRatio to 1.5 for ultra-high FPS on mobile and 4K TVs
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

    // Lightweight particle pool for orbit modes
    particlesRef.current = Array.from({ length: 28 }).map((_, i) => ({
      angle: (i / 28) * Math.PI * 2,
      distOffset: (i % 3) * 15,
      speed: 0.005 + (i % 4) * 0.003,
      radius: 1.5 + (i % 3),
      alpha: 0.4 + (i % 2) * 0.4,
      color: accentColors[i % 2],
    }));

    const render = () => {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      ctx.clearRect(0, 0, screenW, screenH);

      // Dynamically obtain EXACT center and radius of the cover circle
      let centerX = screenW / 2;
      let centerY = screenH * 0.4;
      let baseRadius = Math.min(screenW, screenH) * 0.2;

      if (circleRef.current) {
        const rect = circleRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          centerX = rect.left + rect.width / 2;
          centerY = rect.top + rect.height / 2;
          baseRadius = rect.width / 2 + 5;
        }
      }

      const { bass, mid, treble } = audioEngine.getEnergyLevels();
      const freqData = audioEngine.updateFrequencyData();
      const pulseScale = 1 + bass * 0.12;

      // 1. Ambient Background Glow (Zero-cost radial gradient)
      const ambientRadius = baseRadius * 1.9 * pulseScale;
      const ambientGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.8,
        centerX,
        centerY,
        ambientRadius
      );
      ambientGradient.addColorStop(0, `${accentColors[0]}33`);
      ambientGradient.addColorStop(0.6, `${accentColors[1]}12`);
      ambientGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = ambientGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ambientRadius, 0, Math.PI * 2);
      ctx.fill();

      // Proportional bar sizing
      const maxBarLength = Math.max(22, Math.min(baseRadius * 0.48, 85));
      const barWidth = Math.max(2.5, Math.min(4.5, baseRadius * 0.04));

      // -------------------------------------------------------------
      // STYLE 1: Avee Player Classic Radial Ring with Glowing Tips
      // -------------------------------------------------------------
      if (style === 'avee-ring') {
        const numBars = 72;
        const stepAngle = (Math.PI * 2) / numBars;

        // Pass 1: Bloom glow underlay
        ctx.save();
        ctx.globalAlpha = isPlaying ? 0.35 : 0.15;
        ctx.lineWidth = barWidth + 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = accentColors[0];
        ctx.beginPath();
        for (let i = 0; i < numBars; i++) {
          const freqVal = freqData[Math.floor((i / numBars) * (freqData.length * 0.7))] || 0;
          const barHeight = Math.max(5, (freqVal / 255) * maxBarLength * (1 + bass * 0.25));
          const angle = i * stepAngle - Math.PI / 2;
          ctx.moveTo(centerX + Math.cos(angle) * (baseRadius + 3), centerY + Math.sin(angle) * (baseRadius + 3));
          ctx.lineTo(centerX + Math.cos(angle) * (baseRadius + 3 + barHeight), centerY + Math.sin(angle) * (baseRadius + 3 + barHeight));
        }
        ctx.stroke();
        ctx.restore();

        // Pass 2: Crisp Vibrant Gradient Bars
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
          const barHeight = Math.max(5, (freqVal / 255) * maxBarLength * (1 + bass * 0.25));
          const angle = i * stepAngle - Math.PI / 2;
          ctx.moveTo(centerX + Math.cos(angle) * (baseRadius + 3), centerY + Math.sin(angle) * (baseRadius + 3));
          ctx.lineTo(centerX + Math.cos(angle) * (baseRadius + 3 + barHeight), centerY + Math.sin(angle) * (baseRadius + 3 + barHeight));
        }
        ctx.stroke();

        // Pass 3: Tip dots
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < numBars; i += 2) {
          const freqVal = freqData[Math.floor((i / numBars) * (freqData.length * 0.7))] || 0;
          if (freqVal > 45) {
            const barHeight = Math.max(5, (freqVal / 255) * maxBarLength * (1 + bass * 0.25));
            const angle = i * stepAngle - Math.PI / 2;
            const tipX = centerX + Math.cos(angle) * (baseRadius + 8 + barHeight);
            const tipY = centerY + Math.sin(angle) * (baseRadius + 8 + barHeight);
            ctx.beginPath();
            ctx.arc(tipX, tipY, Math.max(1.5, Math.min(3.5, 1.5 + (freqVal / 255) * 2)), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // -------------------------------------------------------------
      // STYLE 2: Neon Waves (Smooth undulating neon wave contours)
      // -------------------------------------------------------------
      else if (style === 'neon-waves') {
        const numPoints = 64;
        const stepAngle = (Math.PI * 2) / numPoints;

        // Wave Layer 1
        ctx.save();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = accentColors[0];
        ctx.beginPath();
        for (let i = 0; i <= numPoints; i++) {
          const idx = i % numPoints;
          const freqVal = freqData[Math.floor((idx / numPoints) * (freqData.length * 0.6))] || 0;
          const waveAmp = (freqVal / 255) * maxBarLength * 0.85 * (1 + bass * 0.3);
          const angle = idx * stepAngle - Math.PI / 2;
          const r = baseRadius + 10 + waveAmp;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Wave Layer 2 (Inner harmonized wave)
        ctx.lineWidth = 2;
        ctx.strokeStyle = accentColors[1];
        ctx.beginPath();
        for (let i = 0; i <= numPoints; i++) {
          const idx = i % numPoints;
          const freqVal = freqData[Math.floor(((numPoints - idx) / numPoints) * (freqData.length * 0.5))] || 0;
          const waveAmp = (freqVal / 255) * maxBarLength * 0.5;
          const angle = idx * stepAngle - Math.PI / 2;
          const r = baseRadius + 5 + waveAmp;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // -------------------------------------------------------------
      // STYLE 3: Dual Spectrum (Outer spikes + Inner inverted spikes)
      // -------------------------------------------------------------
      else if (style === 'dual-spectrum') {
        const numBars = 60;
        const stepAngle = (Math.PI * 2) / numBars;

        ctx.save();
        ctx.lineWidth = barWidth;
        ctx.lineCap = 'round';

        // Outer Spectrum
        ctx.strokeStyle = accentColors[0];
        ctx.beginPath();
        for (let i = 0; i < numBars; i++) {
          const freqVal = freqData[Math.floor((i / numBars) * (freqData.length * 0.65))] || 0;
          const outerHeight = Math.max(4, (freqVal / 255) * maxBarLength * 0.9);
          const angle = i * stepAngle - Math.PI / 2;
          ctx.moveTo(centerX + Math.cos(angle) * (baseRadius + 4), centerY + Math.sin(angle) * (baseRadius + 4));
          ctx.lineTo(centerX + Math.cos(angle) * (baseRadius + 4 + outerHeight), centerY + Math.sin(angle) * (baseRadius + 4 + outerHeight));
        }
        ctx.stroke();

        // Inner Spectrum (pointing inwards)
        ctx.strokeStyle = accentColors[1];
        ctx.lineWidth = Math.max(2, barWidth * 0.7);
        ctx.beginPath();
        for (let i = 0; i < numBars; i++) {
          const freqVal = freqData[Math.floor((i / numBars) * (freqData.length * 0.65))] || 0;
          const innerHeight = Math.max(3, (freqVal / 255) * (baseRadius * 0.25));
          const angle = i * stepAngle - Math.PI / 2;
          ctx.moveTo(centerX + Math.cos(angle) * (baseRadius - 2), centerY + Math.sin(angle) * (baseRadius - 2));
          ctx.lineTo(centerX + Math.cos(angle) * (baseRadius - 2 - innerHeight), centerY + Math.sin(angle) * (baseRadius - 2 - innerHeight));
        }
        ctx.stroke();
        ctx.restore();
      }

      // -------------------------------------------------------------
      // STYLE 4: Quantum Orbit (Orbiting energy nodes & constellation)
      // -------------------------------------------------------------
      else if (style === 'particle-orbit') {
        const numDots = 48;
        const stepAngle = (Math.PI * 2) / numDots;

        ctx.save();
        // Connecting Ring
        ctx.strokeStyle = `${accentColors[0]}44`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + 12 + bass * 15, 0, Math.PI * 2);
        ctx.stroke();

        // Pulsing Frequency Dots
        for (let i = 0; i < numDots; i++) {
          const freqVal = freqData[Math.floor((i / numDots) * (freqData.length * 0.7))] || 0;
          const dotDist = baseRadius + 12 + (freqVal / 255) * maxBarLength * (1 + bass * 0.3);
          const angle = i * stepAngle - Math.PI / 2;
          const dx = centerX + Math.cos(angle) * dotDist;
          const dy = centerY + Math.sin(angle) * dotDist;
          const dotSize = Math.max(2, (freqVal / 255) * 5);

          ctx.fillStyle = i % 2 === 0 ? accentColors[0] : accentColors[1];
          ctx.beginPath();
          ctx.arc(dx, dy, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // -------------------------------------------------------------
      // STYLE 5: Bars 3D / Cyber Arc (Circular segmented audio meter)
      // -------------------------------------------------------------
      else if (style === 'bars-3d') {
        const segments = 16;
        const segmentAngle = (Math.PI * 2) / segments;
        const gap = 0.08;

        ctx.save();
        for (let i = 0; i < segments; i++) {
          const freqVal = freqData[i * 4] || 0;
          const rings = Math.floor((freqVal / 255) * 8) + 1;
          const startAngle = i * segmentAngle - Math.PI / 2 + gap;
          const endAngle = (i + 1) * segmentAngle - Math.PI / 2 - gap;

          for (let r = 0; r < rings; r++) {
            const currentR = baseRadius + 8 + r * 8;
            ctx.strokeStyle = r < 4 ? accentColors[0] : (r < 6 ? accentColors[1] : '#ffffff');
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(centerX, centerY, currentR, startAngle, endAngle);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // Lightweight orbiting background particles
      if (isPlaying) {
        ctx.save();
        for (let j = 0; j < particlesRef.current.length; j++) {
          const p = particlesRef.current[j];
          p.angle += p.speed * (1 + treble * 1.5);
          const dist = baseRadius + maxBarLength + 14 + p.distOffset + bass * 20;
          const px = centerX + Math.cos(p.angle) * dist;
          const py = centerY + Math.sin(p.angle) * dist;

          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(px, py, p.radius, 0, Math.PI * 2);
          ctx.fill();
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
