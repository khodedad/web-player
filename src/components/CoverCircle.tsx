import React, { forwardRef, useState, useEffect } from 'react';
import { Track } from '../types/player';
import { Disc, Radio, Headphones, Music2, Flame, Sparkles, Mic2 } from 'lucide-react';

interface CoverCircleProps {
  currentTrack: Track;
  isPlaying: boolean;
  gradientColors?: [string, string];
  isFocused?: boolean;
  onClick?: () => void;
}

// Collection of custom high-end vector SVG fallback covers unique to our music player
const FALLBACK_COVERS = [
  // 1. Neon Vinyl Sunset
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23ff2e93"/><stop offset="50%" stop-color="%237c3aed"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><rect width="500" height="500" fill="url(%23bg1)"/><circle cx="250" cy="250" r="180" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="25"/><circle cx="250" cy="250" r="130" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="15"/><circle cx="250" cy="250" r="80" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="10"/><circle cx="250" cy="250" r="40" fill="%23030712"/><path d="M210 210 L290 250 L210 290 Z" fill="white" opacity="0.9"/></svg>',
  
  // 2. Cyberpunk Equalizer Pulse
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><defs><linearGradient id="bg2" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="500" height="500" fill="url(%23bg2)"/><circle cx="250" cy="250" r="160" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="35"/><circle cx="250" cy="250" r="50" fill="%23030712"/><rect x="235" y="195" width="30" height="110" rx="15" fill="white" opacity="0.8"/></svg>',

  // 3. Cosmic Audio Wave
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><defs><linearGradient id="bg3" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%2310b981"/><stop offset="50%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%238b5cf6"/></linearGradient></defs><rect width="500" height="500" fill="url(%23bg3)"/><circle cx="250" cy="250" r="170" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="20"/><circle cx="250" cy="250" r="110" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="15"/><circle cx="250" cy="250" r="45" fill="%23030712"/></svg>'
];

export const CoverCircle = forwardRef<HTMLDivElement, CoverCircleProps>(({
  currentTrack,
  isPlaying,
  gradientColors = ['#ec4899', '#8b5cf6'],
  isFocused = false,
  onClick,
}, ref) => {
  const [imgError, setImgError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  useEffect(() => {
    setImgError(false);
    // Pick deterministic custom cover based on track id string length
    const hash = (currentTrack.id || 'default').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    setFallbackIndex(hash % FALLBACK_COVERS.length);
  }, [currentTrack]);

  const hasCover = currentTrack.coverUrl && !imgError;
  const customCoverSrc = FALLBACK_COVERS[fallbackIndex];

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
        <div className="relative w-full h-full">
          <img
            src={hasCover ? currentTrack.coverUrl! : customCoverSrc}
            alt={currentTrack.title}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover rounded-full transition-transform duration-700 ${
              isPlaying ? 'scale-105' : 'scale-100 opacity-90'
            }`}
          />
          {/* Subtle Vinyl Grooves Radial Overlay */}
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,_transparent_35%,_rgba(0,0,0,0.5)_95%)] pointer-events-none" />
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
