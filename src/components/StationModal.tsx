import React from 'react';
import { Track } from '../types/player';
import { Radio, X, Check } from 'lucide-react';

interface StationModalProps {
  isOpen: boolean;
  tracks: Track[];
  currentTrackId: string;
  isPlaying: boolean;
  onClose: () => void;
  onSelectTrack: (track: Track) => void;
}

export const StationModal: React.FC<StationModalProps> = ({
  isOpen,
  tracks,
  currentTrackId,
  isPlaying,
  onClose,
  onSelectTrack,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
              <Radio className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">انتخاب ایستگاه و استریم</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Station List */}
        <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 no-scrollbar">
          {tracks.map((track) => {
            const isActive = track.id === currentTrackId;

            return (
              <button
                key={track.id}
                onClick={() => {
                  onSelectTrack(track);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
                  isActive
                    ? 'bg-slate-800 border-pink-500/60 text-white shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/70 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Radio className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-start truncate">
                    <span className="font-bold text-sm truncate">{track.title}</span>
                    <span className="text-xs text-slate-400 truncate">{track.genre || track.artist}</span>
                  </div>
                </div>

                {isActive && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs font-semibold shrink-0">
                    <span className={`w-2 h-2 rounded-full bg-pink-500 ${isPlaying ? 'animate-ping' : ''}`} />
                    <span>در حال پخش</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
