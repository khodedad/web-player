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
  const hasCover = currentTrack.coverUrl && !imgError;

  return (
    <div
      ref={ref}
      onClick={onClick}
      title="ضربه بزنید تا نوع ویژوالایزر تغییر کند"
      style={{
        width: '180px',
        height: '180px',
      }}
      className={`relative rounded-full cursor-pointer transition-transform duration-300 transform select-none flex items-center justify-center shrink-0 active:scale-95 ${
        isFocused ? 'ring-4 ring-pink-500 scale-105' : ''
      }`}
    >
      {/* Outer Subtle Glow Halo */}
      <div
        className="absolute inset-0 rounded-full opacity-40 transition-opacity duration-700 pointer-events-none"
        style={{
          boxShadow: isPlaying
            ? `0 0 35px ${gradientColors[0]}66, 0 0 70px ${gradientColors[1]}44`
            : `0 0 20px ${gradientColors[0]}33`,
        }}
      />

      {/* Main Vinyl / Artwork Circle */}
      <div
        className={`relative w-full h-full rounded-full overflow-hidden border-2 border-slate-700/60 shadow-2xl flex items-center justify-center bg-slate-900 transition-transform duration-700 ${
          isPlaying ? 'scale-[1.02]' : ''
        }`}
      >
        {hasCover ? (
          <div className="relative w-full h-full">
            <img
              src={currentTrack.coverUrl}
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
            className="w-full h-full rounded-full flex flex-col items-center justify-center p-3 text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
            }}
          >
            <div className="z-10 p-2.5 rounded-full bg-black/25 backdrop-blur-sm mb-1 shadow-inner border border-white/10">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div className="z-10 text-white font-bold text-xs max-w-[85%] truncate drop-shadow-sm">
              {currentTrack.title}
            </div>
            <div className="z-10 text-white/80 text-[10px] truncate max-w-[85%]">
              {currentTrack.artist}
            </div>
          </div>
        )}

        {/* Center Vinyl Spindle Hole */}
        <div 
          style={{ width: '32px', height: '32px' }}
          className="absolute rounded-full bg-slate-950 border border-slate-700/80 shadow-inner flex items-center justify-center z-20"
        >
          <Disc className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </div>
  );
});

CoverCircle.displayName = 'CoverCircle';
