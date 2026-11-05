import React, { forwardRef, useState, useEffect } from 'react';
import { Track } from '../types/player';
import { Radio } from 'lucide-react';

interface CoverCircleProps {
  currentTrack: Track;
  isPlaying: boolean;
  gradientColors?: [string, string];
  isFocused?: boolean;
  onClick?: () => void;
}

export const CoverCircle = forwardRef<HTMLDivElement, CoverCircleProps>(({
  currentTrack,
  isPlaying,
  gradientColors = ['#ec4899', '#8b5cf6'],
  isFocused = false,
  onClick,
}, ref) => {
  const [imgError, setImgError] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    setImgError(false);
  }, [currentTrack]);

  // Synchronize subtle pulsing animation with audio playback state
  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    const animate = () => {
      setPulsePhase((prev) => (prev + 0.05) % (Math.PI * 2));
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const hasCover = currentTrack.coverUrl && !imgError;
  const scalePulse = isPlaying ? 1 + Math.sin(pulsePhase) * 0.04 : 1;

  // Dynamic colors derived from currentTrack gradientColors
  const color1 = gradientColors[0] || '#ec4899';
  const color2 = gradientColors[1] || '#8b5cf6';

  return (
    <div
      ref={ref}
      onClick={onClick}
      title="ضربه بزنید تا نوع ویژوالایزر تغییر کند"
      className={`relative rounded-full cursor-pointer transition-transform duration-300 transform select-none flex items-center justify-center shrink-0 active:scale-95 w-[clamp(170px,36vh,360px)] h-[clamp(170px,36vh,360px)] sm:w-[clamp(190px,40vmin,420px)] sm:h-[clamp(190px,40vmin,420px)] ${
        isFocused ? 'ring-4 ring-pink-500 scale-105' : ''
      }`}
    >
      {/* Outer Subtle Glow Halo synchronized with audio */}
      <div
        className="absolute inset-0 rounded-full opacity-50 transition-opacity duration-700 pointer-events-none"
        style={{
          transform: `scale(${scalePulse})`,
          boxShadow: isPlaying
            ? `0 0 55px ${color1}88, 0 0 110px ${color2}66`
            : `0 0 25px ${color1}33`,
        }}
      />

      {/* Main Vinyl / Artwork Circle */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden border-2 border-slate-700/65 shadow-2xl flex items-center justify-center bg-slate-900 transition-transform duration-700"
        style={{
          transform: `scale(${scalePulse})`,
        }}
      >
        {hasCover ? (
          <div className="relative w-full h-full">
            <img
              src={currentTrack.coverUrl!}
              alt={currentTrack.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover rounded-full"
            />
            {/* Subtle Vinyl Grooves Radial Overlay */}
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,_transparent_35%,_rgba(0,0,0,0.5)_95%)] pointer-events-none" />
          </div>
        ) : (
          /* Gorgeous Dynamic Gradient Artwork synchronized with audio beat */
          <div
            className="w-full h-full rounded-full flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
            style={{
              background: `radial-gradient(circle at center, ${color1}dd 0%, ${color2}ee 70%, #030712 100%)`,
            }}
          >
            {/* Animated Audio Wave Rings inside Gradient Cover */}
            <div 
              className="absolute inset-4 rounded-full border border-white/20 pointer-events-none transition-all duration-300"
              style={{ transform: `scale(${0.95 + (isPlaying ? Math.sin(pulsePhase * 2) * 0.08 : 0)})` }}
            />
            <div 
              className="absolute inset-10 rounded-full border border-white/15 pointer-events-none transition-all duration-300"
              style={{ transform: `scale(${0.95 + (isPlaying ? Math.cos(pulsePhase * 2) * 0.08 : 0)})` }}
            />

            <div className="z-10 p-3.5 rounded-full bg-black/35 backdrop-blur-md mb-2 shadow-inner border border-white/20 text-white animate-pulse">
              <Radio className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div className="z-10 text-white font-black text-sm sm:text-lg max-w-[85%] truncate drop-shadow-md">
              {currentTrack.title}
            </div>
            <div className="z-10 text-white/90 text-xs sm:text-sm truncate max-w-[85%] font-medium mt-0.5">
              {currentTrack.artist}
            </div>
          </div>
        )}


      </div>
    </div>
  );
});

CoverCircle.displayName = 'CoverCircle';
