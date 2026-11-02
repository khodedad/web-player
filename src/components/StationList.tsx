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
    <div className="w-full px-4 sm:px-8 py-2.5 z-20 select-none flex justify-center">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 max-w-xl w-full justify-start sm:justify-center">
        {tracks.map((track, idx) => {
          const isActive = track.id === currentTrackId;
          const focusKey = `station-${idx}`;

          return (
            <button
              key={track.id}
              onClick={() => onSelectTrack(track)}
              tabIndex={0}
              className={`tv-focusable shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all ${
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
