import React, { forwardRef } from 'react';
import { Track } from '../types/player';
import { Disc, Radio } from 'lucide-react';

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
  return (
    <div
      ref={ref}
      onClick={onClick}
      title="ضربه بزنید تا نوع ویژوالایزر تغییر کند"
      className={`relative rounded-full cursor-pointer transition-transform duration-300 transform select-none flex items-center justify-center shrink-0 active:scale-95 w-[clamp(170px,36vh,360px)] h-[clamp(170px,36vh,360px)] sm:w-[clamp(190px,40vmin,420px)] sm:h-[clamp(190px,40vmin,420px)] ${
        isFocused ? 'ring-4 ring-pink-500 scale-105' : ''
      }`}
    >
      {/* Outer Subtle Glow Halo */}
      <div
        className="absolute inset-0 rounded-full opacity-40 transition-opacity duration-700 pointer-events-none"
        style={{
          boxShadow: isPlaying
            ? `0 0 45px ${gradientColors[0]}66, 0 0 90px ${gradientColors[1]}44`
            : `0 0 25px ${gradientColors[0]}33`,
        }}
      />

      {/* Main TV-Proof Vector Artwork Circle */}
      <div
        className={`relative w-full h-full rounded-full overflow-hidden border-2 border-slate-700/65 shadow-2xl flex items-center justify-center bg-slate-900 transition-transform duration-700 ${
          isPlaying ? 'scale-[1.02]' : ''
        }`}
        style={{
          background: `radial-gradient(circle at center, #0f172a 0%, #030712 100%)`,
        }}
      >
        {/* Dynamic Vector Gradient Artwork Backdrop */}
        <div 
          className="absolute inset-0 opacity-80"
          style={{
            background: `linear-gradient(135deg, ${gradientColors[0]}cc, ${gradientColors[1]}cc)`,
          }}
        />

        {/* Vinyl Grooves Texture Rings */}
        <div className="absolute inset-2 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute inset-8 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute inset-16 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute inset-24 rounded-full border border-white/10 pointer-events-none" />

        {/* Inner Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center">
          <div className="p-3 rounded-full bg-black/45 backdrop-blur-md mb-2 shadow-inner border border-white/20 text-white animate-pulse">
            <Radio className="w-8 h-8 sm:w-10 sm:h-10 text-pink-300" />
          </div>
          <div className="text-white font-black text-sm sm:text-lg max-w-[85%] truncate drop-shadow-md">
            {currentTrack.title}
          </div>
          <div className="text-white/90 text-xs sm:text-sm truncate max-w-[85%] font-medium mt-0.5">
            {currentTrack.artist}
          </div>
        </div>

        {/* Center Vinyl Spindle Hole */}
        <div className="absolute w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner flex items-center justify-center z-25">
          <Disc className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        </div>
      </div>
    </div>
  );
});

CoverCircle.displayName = 'CoverCircle';
