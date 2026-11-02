import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Track } from '../types/player';

interface TvControlsProps {
  currentTrack: Track;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  focusedElement: string;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onToggleMute: () => void;
}

export const TvControls: React.FC<TvControlsProps> = ({
  currentTrack,
  isPlaying,
  isMuted,
  currentTime,
  duration,
  focusedElement,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onToggleMute,
}) => {
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs === Infinity) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLive = currentTrack.type === 'radio' || duration === 0 || !isFinite(duration);
  const progressPercent = !isLive && duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLive || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div 
      style={{
        width: 'clamp(280px, 62vmin, 620px)',
        gap: 'clamp(8px, 1.8vmin, 18px)',
      }}
      className="flex flex-col items-center z-20 select-none px-2"
    >
      {/* 1. Track Info (Symmetrically spaced, zoom invariant typography) */}
      <div className="text-center w-full flex flex-col items-center">
        <h1 
          style={{ fontSize: 'clamp(1rem, 2.7vmin, 1.75rem)' }}
          className="font-bold text-white tracking-tight drop-shadow-sm truncate max-w-full leading-tight"
        >
          {currentTrack.title}
        </h1>
        <p 
          style={{ fontSize: 'clamp(0.72rem, 1.6vmin, 1.05rem)' }}
          className="text-slate-400 font-medium truncate max-w-[85%] mt-0.5 leading-normal"
        >
          {currentTrack.artist}
        </p>
      </div>

      {/* 2. Responsive Seek Bar & Timers */}
      <div className="w-full flex flex-col gap-1">
        {!isLive ? (
          <div
            onClick={handleSeekBarClick}
            tabIndex={0}
            style={{ height: 'clamp(6px, 1.1vmin, 11px)' }}
            className={`tv-focusable w-full bg-slate-800/80 rounded-full overflow-hidden cursor-pointer relative border border-slate-700/50 ${
              focusedElement === 'seekbar' ? 'tv-focused' : ''
            }`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-150 relative"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        ) : (
          <div 
            style={{ height: 'clamp(5px, 0.9vmin, 9px)' }}
            className="w-full bg-slate-800/50 rounded-full overflow-hidden relative"
          >
            <div className="h-full w-full bg-gradient-to-r from-pink-500/40 via-purple-500/60 to-pink-500/40 animate-pulse" />
          </div>
        )}

        {/* Timers */}
        <div 
          style={{ fontSize: 'clamp(0.6rem, 1.25vmin, 0.85rem)' }}
          className="flex justify-between items-center font-mono font-medium text-slate-500 px-0.5"
        >
          <span>{isLive ? '🔴 پخش زنده' : formatTime(currentTime)}</span>
          <span>{isLive ? 'رادیو ۲۴/۷' : formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. Media Controls Cluster */}
      {/* 100% Mathematically centered directly beneath the circle */}
      <div className="relative w-full flex items-center justify-center my-0.5">
        <div 
          style={{ gap: 'clamp(14px, 3.4vmin, 32px)' }}
          className="flex items-center justify-center"
        >
          {/* Next Button (Left in RTL layout) */}
          <button
            onClick={onNext}
            tabIndex={0}
            title="بعدی (Arrow Right)"
            style={{
              width: 'clamp(40px, 6.8vmin, 62px)',
              height: 'clamp(40px, 6.8vmin, 62px)',
            }}
            className={`tv-focusable rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shadow-md flex items-center justify-center ${
              focusedElement === 'btn-next' ? 'tv-focused' : ''
            }`}
          >
            <SkipForward style={{ width: 'clamp(18px, 3.2vmin, 26px)', height: 'clamp(18px, 3.2vmin, 26px)' }} className="fill-current" />
          </button>

          {/* Center Play / Pause Giant Button */}
          <button
            onClick={onPlayPause}
            tabIndex={0}
            title="پخش/توقف (Enter / Space)"
            style={{
              width: 'clamp(54px, 9.4vmin, 84px)',
              height: 'clamp(54px, 9.4vmin, 84px)',
            }}
            className={`tv-focusable rounded-full bg-gradient-to-tr from-pink-600 to-purple-600 text-white shadow-lg hover:scale-105 active:scale-95 transition-all border border-pink-400/30 flex items-center justify-center ${
              focusedElement === 'btn-play' ? 'tv-focused' : ''
            }`}
          >
            {isPlaying ? (
              <Pause style={{ width: 'clamp(24px, 4.2vmin, 38px)', height: 'clamp(24px, 4.2vmin, 38px)' }} className="fill-current" />
            ) : (
              <Play style={{ width: 'clamp(24px, 4.2vmin, 38px)', height: 'clamp(24px, 4.2vmin, 38px)' }} className="fill-current translate-x-0.5" />
            )}
          </button>

          {/* Previous Button (Right in RTL layout) */}
          <button
            onClick={onPrev}
            tabIndex={0}
            title="قبلی (Arrow Left)"
            style={{
              width: 'clamp(40px, 6.8vmin, 62px)',
              height: 'clamp(40px, 6.8vmin, 62px)',
            }}
            className={`tv-focusable rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shadow-md flex items-center justify-center ${
              focusedElement === 'btn-prev' ? 'tv-focused' : ''
            }`}
          >
            <SkipBack style={{ width: 'clamp(18px, 3.2vmin, 26px)', height: 'clamp(18px, 3.2vmin, 26px)' }} className="fill-current" />
          </button>
        </div>

        {/* Mute Button (Positioned absolutely so it never shifts the 3 main buttons) */}
        <button
          onClick={onToggleMute}
          tabIndex={0}
          title="صدا / سکوت"
          style={{
            width: 'clamp(32px, 5.4vmin, 46px)',
            height: 'clamp(32px, 5.4vmin, 46px)',
          }}
          className={`tv-focusable absolute right-0 rounded-full bg-slate-900/70 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center ${
            focusedElement === 'btn-volume' ? 'tv-focused' : ''
          }`}
        >
          {isMuted ? (
            <VolumeX style={{ width: 'clamp(14px, 2.4vmin, 20px)', height: 'clamp(14px, 2.4vmin, 20px)' }} className="text-red-400" />
          ) : (
            <Volume2 style={{ width: 'clamp(14px, 2.4vmin, 20px)', height: 'clamp(14px, 2.4vmin, 20px)' }} className="text-slate-400" />
          )}
        </button>
      </div>
    </div>
  );
};
