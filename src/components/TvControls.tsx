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
    <div className="w-full max-w-md sm:max-w-lg px-4 flex flex-col items-center gap-2.5 sm:gap-3.5 z-20 select-none">
      {/* 1. Track Info */}
      <div className="text-center w-full flex flex-col items-center">
        <h1 className="text-sm sm:text-lg md:text-xl font-bold text-white tracking-tight drop-shadow-sm truncate max-w-full">
          {currentTrack.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium truncate max-w-[85%] mt-0.5">
          {currentTrack.artist}
        </p>
      </div>

      {/* 2. Responsive Seek Bar & Timers */}
      <div className="w-full flex flex-col gap-1">
        {!isLive ? (
          <div
            onClick={handleSeekBarClick}
            tabIndex={0}
            className={`tv-focusable w-full h-2 sm:h-2.5 bg-slate-800/80 rounded-full overflow-hidden cursor-pointer relative border border-slate-700/50 ${
              focusedElement === 'seekbar' ? 'tv-focused' : ''
            }`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-150 relative"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        ) : (
          <div className="w-full h-1.5 sm:h-2 bg-slate-800/50 rounded-full overflow-hidden relative">
            <div className="h-full w-full bg-gradient-to-r from-pink-500/40 via-purple-500/60 to-pink-500/40 animate-pulse" />
          </div>
        )}

        {/* Timers */}
        <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono font-medium text-slate-500 px-0.5">
          <span>{isLive ? 'پخش زنده' : formatTime(currentTime)}</span>
          <span>{isLive ? 'رادیو ۲۴/۷' : formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. Media Controls Cluster */}
      <div className="relative w-full flex items-center justify-center my-0.5">
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          {/* Next Button */}
          <button
            onClick={onNext}
            tabIndex={0}
            title="بعدی (Arrow Right)"
            className={`tv-focusable p-2.5 sm:p-3.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shadow-md ${
              focusedElement === 'btn-next' ? 'tv-focused' : ''
            }`}
          >
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>

          {/* Center Play / Pause Button */}
          <button
            onClick={onPlayPause}
            tabIndex={0}
            title="پخش/توقف (Enter / Space)"
            className={`tv-focusable p-3.5 sm:p-5 rounded-full bg-gradient-to-tr from-pink-600 to-purple-600 text-white shadow-lg hover:scale-105 active:scale-95 transition-all border border-pink-400/30 ${
              focusedElement === 'btn-play' ? 'tv-focused' : ''
            }`}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
            ) : (
              <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Previous Button */}
          <button
            onClick={onPrev}
            tabIndex={0}
            title="قبلی (Arrow Left)"
            className={`tv-focusable p-2.5 sm:p-3.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shadow-md ${
              focusedElement === 'btn-prev' ? 'tv-focused' : ''
            }`}
          >
            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>
        </div>

        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          tabIndex={0}
          title="صدا / سکوت"
          className={`tv-focusable absolute right-0 sm:right-2 p-2.5 sm:p-3 rounded-full bg-slate-900/70 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-all ${
            focusedElement === 'btn-volume' ? 'tv-focused' : ''
          }`}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>
    </div>
  );
};
