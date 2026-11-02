import React from 'react';
import { Track } from '../types/player';

interface StationListProps {
  tracks: Track[];
  currentTrackId: string;
  isPlaying: boolean;
  focusedElement: string;
  onSelectTrack: (track: Track) => void;
}

export const StationList: React.FC<StationListProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  focusedElement,
  onSelectTrack,
}) => {
  return (
    <div 
      style={{ padding: 'clamp(6px, 1.4vmin, 14px) clamp(8px, 2vmin, 20px)' }}
      className="w-full z-20 select-none flex justify-center"
    >
      <div 
        style={{ gap: 'clamp(6px, 1.2vmin, 12px)' }}
        className="flex items-center overflow-x-auto no-scrollbar py-0.5 max-w-xl w-full justify-start sm:justify-center"
      >
        {tracks.map((track, idx) => {
          const isActive = track.id === currentTrackId;
          const focusKey = `station-${idx}`;

          return (
            <button
              key={track.id}
              onClick={() => onSelectTrack(track)}
              tabIndex={0}
              style={{
                fontSize: 'clamp(0.68rem, 1.35vmin, 0.92rem)',
                padding: 'clamp(4px, 0.9vmin, 8px) clamp(8px, 1.8vmin, 16px)',
              }}
              className={`tv-focusable shrink-0 flex items-center gap-1.5 rounded-full transition-all ${
                isActive
                  ? 'bg-slate-800 text-pink-400 border border-pink-500/50 font-semibold shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/60'
              } ${focusedElement === focusKey ? 'tv-focused' : ''}`}
            >
              {isActive && (
                <span className={`w-1.5 h-1.5 rounded-full bg-pink-500 ${isPlaying ? 'animate-ping' : ''}`} />
              )}
              <span className="truncate max-w-[120px]">{track.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
