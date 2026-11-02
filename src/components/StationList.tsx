import React from 'react';
import { Track } from '../types/player';
import { Radio, Music } from 'lucide-react';

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
        style={{ gap: 'clamp(8px, 1.6vmin, 16px)' }}
        className="flex items-center overflow-x-auto no-scrollbar py-1 max-w-2xl w-full justify-start sm:justify-center"
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
                fontSize: 'clamp(0.72rem, 1.5vmin, 1rem)',
                padding: 'clamp(6px, 1.1vmin, 10px) clamp(10px, 2.2vmin, 18px)',
              }}
              className={`tv-focusable shrink-0 flex items-center gap-2 rounded-xl transition-all ${
                isActive
                  ? 'bg-slate-800 text-pink-400 border border-pink-500/60 font-bold shadow-lg scale-105'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/60'
              } ${focusedElement === focusKey ? 'tv-focused' : ''}`}
            >
              {/* Force explicit icon thumbnail for robust TV rendering */}
              <div 
                style={{ width: 'clamp(20px, 3vmin, 28px)', height: 'clamp(20px, 3vmin, 28px)' }}
                className="rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700/80 overflow-hidden relative"
              >
                {track.coverUrl ? (
                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                ) : (
                  <Radio className="w-3.5 h-3.5 text-pink-400" />
                )}
                {isActive && isPlaying && (
                  <div className="absolute inset-0 bg-pink-600/60 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  </div>
                )}
              </div>
              <span className="truncate max-w-[130px]">{track.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
