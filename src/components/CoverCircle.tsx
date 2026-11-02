import React, { forwardRef, useState } from 'react';
import { Track } from '../types/player';
import { Disc, Music } from 'lucide-react';

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
  
  // Route external cover URLs through backend proxy to bypass TV CORS, SSL, and Mixed Content blocks
  const proxiedCoverUrl = currentTrack.coverUrl 
    ? `/api/image-proxy?url=${encodeURIComponent(currentTrack.coverUrl)}`
    : undefined;

  const hasCover = proxiedCoverUrl && !imgError;

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

      {/* Main Vinyl / Artwork Circle */}
      <div
        className={`relative w-full h-full rounded-full overflow-hidden border-2 border-slate-700/65 shadow-2xl flex items-center justify-center bg-slate-900 transition-transform duration-700 ${
          isPlaying ? 'scale-[1.02]' : ''
        }`}
      >
        {hasCover ? (
          <div className="relative w-full h-full">
            <img
              src={proxiedCoverUrl}
              alt={currentTrack.title}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover rounded-full transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100 opacity-90'
              }`}
            />
            {/* Subtle Vinyl Grooves Radial Overlay */}
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,_transparent_35%,_rgba(0,0,0,0.5)_95%)] pointer-events-none" />
          </div>
        ) : (
          /* High-End Sleek Gradient Fallback */
          <div
            className="w-full h-full rounded-full flex flex-col items-center justify-center p-4 text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
            }}
          >
            <div className="z-10 p-3 rounded-full bg-black/25 backdrop-blur-sm mb-1.5 shadow-inner border border-white/10">
              <Music className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="z-10 text-white font-bold text-sm sm:text-base max-w-[85%] truncate drop-shadow-sm">
              {currentTrack.title}
            </div>
            <div className="z-10 text-white/80 text-xs sm:text-sm truncate max-w-[85%]">
              {currentTrack.artist}
            </div>
          </div>
        )}

        {/* Center Vinyl Spindle Hole */}
        <div className="absolute w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner flex items-center justify-center z-20">
          <Disc className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        </div>
      </div>
    </div>
  );
});

CoverCircle.displayName = 'CoverCircle';
