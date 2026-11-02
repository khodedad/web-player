import React from 'react';
import { Track } from '../types/player';
import { Radio } from 'lucide-react';

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
    <div className="w-full z-20 select-none flex justify-center px-2 sm:px-6 py-2">
      <div className="flex items-center flex-wrap justify-center gap-2.5 max-w-4xl w-full">
        {tracks.map((track, idx) => {
          const isActive = track.id === currentTrackId;
          const focusKey = `station-${idx}`;

          return (
            <button
              key={track.id}
              onClick={() => onSelectTrack(track)}
              tabIndex={0}
              className={`tv-focusable shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all text-xs sm:text-sm font-medium ${
                isActive
                  ? 'bg-slate-800 text-pink-400 border border-pink-500/80 font-bold shadow-lg scale-105'
                  : 'bg-slate-900/95 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80'
              } ${focusedElement === focusKey ? 'tv-focused' : ''}`}
            >
              {/* Fallback-proof SVG / Lucide Icon container */}
              <div className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700/80 text-pink-400">
                <Radio className="w-3.5 h-3.5" />
              </div>
              <span className="truncate max-w-[140px]">{track.title}</span>
              {isActive && isPlaying && (
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping shrink-0 ml-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
