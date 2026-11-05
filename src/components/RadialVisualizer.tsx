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

    particlesRef.current = Array.from({ length: 70 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.4,
      size: 1.2 + Math.random() * 3.2,
      baseAlpha: 0.15 + Math.random() * 0.5,
      colorIdx: Math.random() > 0.5 ? 0 : 1,
      depth: 0.5 + Math.random() * 0.9,
    }));

    const render = () => {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      ctx.clearRect(0, 0, screenW, screenH);
      phaseRef.current += 0.015;

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

      const { bass } = audioEngine.getEnergyLevels();
      const freqData = audioEngine.updateFrequencyData();
      const pulseScale = 1 + bass * 0.15;

      // 1. PARTICLES
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const speedMultiplier = isPlaying ? (1 + bass * 1.8) * p.depth : 0.6;
        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

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

      // 2. AMBIENT GLOW
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

      const maxBarLength = Math.max(22, Math.min(baseRadius * 0.5, 95));
      const barWidth = Math.max(2.4, Math.min(4.8, baseRadius * 0.04));

      // -----------------------------------------------------------------------
      // STYLE 1: Avee Ring
      // -----------------------------------------------------------------------
      if (style === 'avee-ring') {
        const numBars = 72;
        const stepAngle = (Math.PI * 2) / numBars;
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
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // STYLE 2: Neon Tunnel
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
      // STYLE 3: Quantum Waves
      // -----------------------------------------------------------------------
      else if (style === 'quantum-waves') {
        const numPoints = 64;
        const stepAngle = (Math.PI * 2) / numPoints;
        ctx.save();
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
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // STYLE 4: Starburst
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
        ctx.strokeStyle = accentColors[0];
        ctx.stroke();
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // STYLE 5: Dual Spectrum
      // -----------------------------------------------------------------------
      else if (style === 'dual-spectrum') {
        const numBars = 64;
        const stepAngle = (Math.PI * 2) / numBars;
        ctx.save();
        ctx.lineWidth = barWidth * 0.9;
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
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // STYLE 6: Cyber Equalizer
      // -----------------------------------------------------------------------
      else if (style === 'cyber-equalizer') {
        const segments = 24;
        const segmentAngle = (Math.PI * 2) / segments;
        ctx.save();
        ctx.lineWidth = 3.6;
        for (let i = 0; i < segments; i++) {
          const freqVal = freqData[Math.floor((i / segments) * (freqData.length * 0.65))] || 0;
          const barsCount = Math.floor((freqVal / 255) * 7) + 1;
          const startAngle = i * segmentAngle - Math.PI / 2 + 0.05;
          const endAngle = (i + 1) * segmentAngle - Math.PI / 2 - 0.05;
          for (let r = 0; r < barsCount; r++) {
            ctx.strokeStyle = accentColors[0];
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius + 6 + r * 7, startAngle, endAngle);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // NEW STYLE 7: Solar Flare (شعله خورشیدی)
      // -----------------------------------------------------------------------
      else if (style === 'solar-flare') {
        const rays = 36;
        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#f59e0b';
        for (let i = 0; i < rays; i++) {
          const angle = (i / rays) * Math.PI * 2 + phaseRef.current;
          const freqVal = freqData[i % freqData.length] || 0;
          const len = (freqVal / 255) * maxBarLength * 1.8 * (1 + bass * 0.5);
          ctx.beginPath();
          ctx.moveTo(centerX + Math.cos(angle) * baseRadius, centerY + Math.sin(angle) * baseRadius);
          ctx.lineTo(centerX + Math.cos(angle) * (baseRadius + len), centerY + Math.sin(angle) * (baseRadius + len));
          ctx.stroke();
        }
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // NEW STYLE 11: Aurora Waves (امواج شفق قطبی)
      // -----------------------------------------------------------------------
      else if (style === 'aurora-waves') {
        const waves = 3;
        ctx.save();
        for (let w = 0; w < waves; w++) {
          ctx.strokeStyle = w === 0 ? accentColors[0] : (w === 1 ? accentColors[1] : '#3b82f6');
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let x = 0; x < screenW; x += 15) {
            const y = centerY + Math.sin(x * 0.008 + phaseRef.current * 2 + w) * (30 + bass * 40);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // NEW STYLE 12: Cyber Vortex (گرداب انرژی سایبر)
      // -----------------------------------------------------------------------
      else if (style === 'cyber-vortex') {
        const spirals = 36;
        ctx.save();
        ctx.lineWidth = 2.2;
        for (let i = 0; i < spirals; i++) {
          const freqVal = freqData[Math.floor((i / spirals) * (freqData.length * 0.7))] || 0;
          const angle = (i / spirals) * Math.PI * 2 + phaseRef.current * 1.5;
          const spiralR = baseRadius + 8 + (freqVal / 255) * maxBarLength * 1.3 * (1 + bass * 0.4);
          ctx.strokeStyle = i % 2 === 0 ? accentColors[0] : accentColors[1];
          ctx.beginPath();
          ctx.moveTo(centerX + Math.cos(angle) * baseRadius, centerY + Math.sin(angle) * baseRadius);
          const controlAngle = angle + 0.35 * (1 + bass * 0.5);
          ctx.quadraticCurveTo(
            centerX + Math.cos(controlAngle) * (baseRadius + spiralR * 0.6),
            centerY + Math.sin(controlAngle) * (baseRadius + spiralR * 0.6),
            centerX + Math.cos(angle + 0.7) * spiralR,
            centerY + Math.sin(angle + 0.7) * spiralR
          );
          ctx.stroke();
        }
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // NEW STYLE 13: Hyper Cube 3D (مکعب کوانتومی ۳ بعدی)
      // -----------------------------------------------------------------------
      else if (style === 'hyper-cube') {
        const cubeSize = (baseRadius * 0.85) * (1 + bass * 0.35);
        const rotX = phaseRef.current * 0.8;
        const rotY = phaseRef.current * 1.2;

        const vertices = [
          [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
          [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
        ];

        const projected = vertices.map(([vx, vy, vz]) => {
          let x = vx * cubeSize;
          let y = vy * cubeSize;
          let z = vz * cubeSize;

          let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
          let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);

          let x2 = x * Math.cos(rotY) + z1 * Math.sin(rotY);
          let z2 = -x * Math.sin(rotY) + z1 * Math.cos(rotY);

          const scale = 250 / (250 + z2);
          return [centerX + x2 * scale, centerY + y1 * scale];
        });

        const edges = [
          [0,1], [1,2], [2,3], [3,0],
          [4,5], [5,6], [6,7], [7,4],
          [0,4], [1,5], [2,6], [3,7]
        ];

        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = accentColors[0];
        ctx.shadowColor = accentColors[0];
        ctx.shadowBlur = 12;

        ctx.beginPath();
        edges.forEach(([p1, p2]) => {
          ctx.moveTo(projected[p1][0], projected[p1][1]);
          ctx.lineTo(projected[p2][0], projected[p2][1]);
        });
        ctx.stroke();
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // NEW STYLE 14: Laser Grid 3D Horizon (شبکه لیزری رترو)
      // -----------------------------------------------------------------------
      else if (style === 'laser-grid') {
        const gridY = screenH * 0.72;
        ctx.save();
        ctx.strokeStyle = accentColors[1];
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1.5;

        for (let x = -screenW; x < screenW * 2; x += 60) {
          ctx.beginPath();
          ctx.moveTo(centerX, gridY - 40);
          ctx.lineTo(x, screenH);
          ctx.stroke();
        }

        for (let y = gridY; y < screenH; y += 18) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(screenW, y);
          ctx.stroke();
        }

        const towers = 32;
        const towerW = screenW / towers;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = accentColors[0];

        for (let i = 0; i < towers; i++) {
          const freqVal = freqData[Math.floor((i / towers) * (freqData.length * 0.7))] || 0;
          const towerH = (freqVal / 255) * (maxBarLength * 1.6) * (1 + bass * 0.4);
          ctx.fillRect(i * towerW + 2, gridY - towerH, towerW - 4, towerH);
        }
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // NEW STYLE 15: Nebula Pulsar (پالسار سحابی)
      // -----------------------------------------------------------------------
      else if (style === 'nebula-pulsar') {
        const rings = 6;
        ctx.save();
        for (let r = 1; r <= rings; r++) {
          const freqVal = freqData[r * 6] || 0;
          const radius = baseRadius + r * 18 + (freqVal / 255) * 25 * (1 + bass * 0.4);
          ctx.strokeStyle = r % 2 === 0 ? accentColors[0] : accentColors[1];
          ctx.lineWidth = Math.max(1, 4 - r * 0.5);
          ctx.globalAlpha = 0.9 - r * 0.13;
          ctx.setLineDash([8 + r * 2, 6 + r * 3]);
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, phaseRef.current * r * 0.3, phaseRef.current * r * 0.3 + Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // NEW STYLE 16: Fire Ring (حلقه آتشین ارگانیک)
      // -----------------------------------------------------------------------
      else if (style === 'fire-ring') {
        const flames = 48;
        const stepAngle = (Math.PI * 2) / flames;
        ctx.save();
        ctx.lineWidth = barWidth * 1.1;
        ctx.lineCap = 'round';
        const fireGrad = ctx.createRadialGradient(centerX, centerY, baseRadius, centerX, centerY, baseRadius + maxBarLength * 1.3);
        fireGrad.addColorStop(0, '#f59e0b');
        fireGrad.addColorStop(0.5, '#ef4444');
        fireGrad.addColorStop(1, accentColors[0]);
        ctx.strokeStyle = fireGrad;

        ctx.beginPath();
        for (let i = 0; i < flames; i++) {
          const freqVal = freqData[Math.floor((i / flames) * (freqData.length * 0.7))] || 0;
          const noise = Math.sin(i * 0.6 + phaseRef.current * 6) * 12;
          const flameH = Math.max(8, (freqVal / 255) * maxBarLength * 1.2 * (1 + bass * 0.5) + noise);
          const angle = i * stepAngle;
          ctx.moveTo(centerX + Math.cos(angle) * (baseRadius + 2), centerY + Math.sin(angle) * (baseRadius + 2));
          ctx.lineTo(centerX + Math.cos(angle) * (baseRadius + 2 + flameH), centerY + Math.sin(angle) * (baseRadius + 2 + flameH));
        }
        ctx.stroke();
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
