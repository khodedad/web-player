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
        width: '440px',
        gap: '12px',
      }}
      className="flex flex-col items-center z-20 select-none px-2"
    >
      {/* 1. Track Info */}
      <div className="text-center w-full flex flex-col items-center">
        <h1 
          style={{ fontSize: '1.25rem' }}
          className="font-bold text-white tracking-tight drop-shadow-sm truncate max-w-full leading-tight"
        >
          {currentTrack.title}
        </h1>
        <p 
          style={{ fontSize: '0.875rem' }}
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
            style={{ height: '8px' }}
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
            style={{ height: '7px' }}
            className="w-full bg-slate-800/50 rounded-full overflow-hidden relative"
          >
            <div className="h-full w-full bg-gradient-to-r from-pink-500/40 via-purple-500/60 to-pink-500/40 animate-pulse" />
          </div>
        )}

        {/* Timers */}
        <div 
          style={{ fontSize: '0.75rem' }}
          className="flex justify-between items-center font-mono font-medium text-slate-500 px-0.5"
        >
          <span>{isLive ? 'پخش زنده' : formatTime(currentTime)}</span>
          <span>{isLive ? 'رادیو ۲۴/۷' : formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. Media Controls Cluster */}
      <div className="relative w-full flex items-center justify-center my-0.5">
        <div 
          style={{ gap: '20px' }}
          className="flex items-center justify-center"
        >
          {/* Next Button */}
          <button
            onClick={onNext}
            tabIndex={0}
            title="بعدی (Arrow Right)"
            style={{ width: '48px', height: '48px' }}
            className={`tv-focusable rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shadow-md flex items-center justify-center ${
              focusedElement === 'btn-next' ? 'tv-focused' : ''
            }`}
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Center Play / Pause Button */}
          <button
            onClick={onPlayPause}
            tabIndex={0}
            title="پخش/توقف (Enter / Space)"
            style={{ width: '64px', height: '64px' }}
            className={`tv-focusable rounded-full bg-gradient-to-tr from-pink-600 to-purple-600 text-white shadow-lg hover:scale-105 active:scale-95 transition-all border border-pink-400/30 flex items-center justify-center ${
              focusedElement === 'btn-play' ? 'tv-focused' : ''
            }`}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Previous Button */}
          <button
            onClick={onPrev}
            tabIndex={0}
            title="قبلی (Arrow Left)"
            style={{ width: '48px', height: '48px' }}
            className={`tv-focusable rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shadow-md flex items-center justify-center ${
              focusedElement === 'btn-prev' ? 'tv-focused' : ''
            }`}
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          tabIndex={0}
          title="صدا / سکوت"
          style={{ width: '38px', height: '38px' }}
          className={`tv-focusable absolute right-0 rounded-full bg-slate-900/70 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center ${
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
