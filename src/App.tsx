/**
 * web play - Responsive Fullscreen Web Music Player & Visualizer
 * Fully responsive across Mobile, Tablet, Desktop, and 16:9 Smart TVs.
 * Optimized padding for edge-to-edge display without TV side clipping.
 * Maximized safe cover circle size and dedicated station popup modal with custom scrollbar.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PRESET_TRACKS } from './constants/tracks';
import { Track, AudioState, VisualizerStyle } from './types/player';
import { audioEngine } from './services/audioEngine';
import { RadialVisualizer } from './components/RadialVisualizer';
import { CoverCircle } from './components/CoverCircle';
import { TvControls } from './components/TvControls';
import { StationModal } from './components/StationModal';
import { useTvRemote } from './hooks/useTvRemote';

const VISUALIZER_STYLES: { id: VisualizerStyle; name: string }[] = [
  { id: 'avee-ring', name: 'حلقه رادیال Avee' },
  { id: 'neon-tunnel', name: 'تونل نئونی ۳ بعدی' },
  { id: 'quantum-waves', name: 'امواج کوانتومی' },
  { id: 'starburst', name: 'کهکشان پرتوهای نوری' },
  { id: 'dual-spectrum', name: 'طیف دوطرفه اینتنس' },
  { id: 'cyber-equalizer', name: 'اکولایزر سایبرپانک' },
];

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(PRESET_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [visualizerStyle, setVisualizerStyle] = useState<VisualizerStyle>('avee-ring');
  const [styleToast, setStyleToast] = useState<string | null>(null);
  const [isStationModalOpen, setIsStationModalOpen] = useState<boolean>(false);

  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isMuted: false,
    volume: 0.9,
    currentTime: 0,
    duration: 0,
    isLive: true,
    isLoading: false,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef<boolean>(true);
  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = audioState.isPlaying;

  const currentTrack = tracks[currentTrackIndex] || PRESET_TRACKS[0];

  // Initialize Web Audio Engine with Audio Element
  useEffect(() => {
    if (audioRef.current) {
      audioEngine.init(audioRef.current);
    }
  }, []);

  // Handle Play/Pause Toggle with zero background buffering on stop
  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      if (audioState.isPlaying) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        setAudioState((prev) => ({ ...prev, isPlaying: false, isLoading: false }));
      } else {
        setAudioState((prev) => ({ ...prev, isLoading: true, error: null }));
        await audioEngine.setupWebAudio();

        audioRef.current.src = currentTrack.url;
        audioRef.current.load();

        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          await audioEngine.resumeContext();
          setAudioState((prev) => ({ ...prev, isPlaying: true, isLoading: false }));
        }
      }
    } catch (err) {
      console.warn('Playback toggle handled:', err);
      setAudioState((prev) => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
      }));
    }
  }, [audioState.isPlaying, currentTrack.url]);

  // Tap on Central Circle cycles through 6 beautiful visualizer types
  const handleCycleVisualizer = useCallback(() => {
    const currentIndex = VISUALIZER_STYLES.findIndex((s) => s.id === visualizerStyle);
    const nextIndex = (currentIndex + 1) % VISUALIZER_STYLES.length;
    const nextStyle = VISUALIZER_STYLES[nextIndex];
    setVisualizerStyle(nextStyle.id);

    setStyleToast(nextStyle.name);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setStyleToast(null);
    }, 1500);
  }, [visualizerStyle]);

  // Track Selector
  const handleSelectTrack = useCallback((track: Track) => {
    const idx = tracks.findIndex((t) => t.id === track.id);
    if (idx !== -1) {
      setCurrentTrackIndex(idx);
      setAudioState((prev) => ({
        ...prev,
        currentTime: 0,
        duration: 0,
        error: null,
      }));
    }
  }, [tracks]);

  const handleNextTrack = useCallback(() => {
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    handleSelectTrack(tracks[nextIdx]);
  }, [currentTrackIndex, tracks, handleSelectTrack]);

  const handlePrevTrack = useCallback(() => {
    const prevIdx = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    handleSelectTrack(tracks[prevIdx]);
  }, [currentTrackIndex, tracks, handleSelectTrack]);

  // When track changes: load new URL and auto-continue playback only if was ALREADY playing
  useEffect(() => {
    if (!audioRef.current) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isPlayingRef.current) {
      setAudioState((prev) => ({ ...prev, isLoading: true }));
      audioRef.current.src = currentTrack.url;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setAudioState((prev) => ({ ...prev, isPlaying: true, isLoading: false }));
          })
          .catch((err) => {
            console.warn('Playback awaiting user action:', err);
            setAudioState((prev) => ({ ...prev, isPlaying: false, isLoading: false }));
          });
      }
    } else {
      audioRef.current.removeAttribute('src');
    }
  }, [currentTrack]);

  // Seek Handler for MP3 files
  const handleSeek = (newTime: number) => {
    if (audioRef.current && currentTrack.type === 'mp3') {
      audioRef.current.currentTime = newTime;
      setAudioState((prev) => ({ ...prev, currentTime: newTime }));
    }
  };

  const handleSeekForward = () => {
    if (audioRef.current && currentTrack.type === 'mp3') {
      const newTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 10);
      handleSeek(newTime);
    }
  };

  const handleSeekBackward = () => {
    if (audioRef.current && currentTrack.type === 'mp3') {
      const newTime = Math.max(0, audioRef.current.currentTime - 10);
      handleSeek(newTime);
    }
  };

  const handleToggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioState.isMuted;
      setAudioState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
    }
  };

  // Focusable elements list for TV Remote navigation
  const focusableElements = [
    'btn-next',
    'btn-play',
    'btn-prev',
    'btn-volume',
    'btn-stations',
    'seekbar',
  ];

  const handleSelectFocusedElement = (elementId: string) => {
    if (elementId === 'btn-play') {
      togglePlayPause();
    } else if (elementId === 'btn-next') {
      handleNextTrack();
    } else if (elementId === 'btn-prev') {
      handlePrevTrack();
    } else if (elementId === 'btn-volume') {
      handleToggleMute();
    } else if (elementId === 'btn-stations') {
      setIsStationModalOpen(true);
    }
  };

  const { focusedElement } = useTvRemote(
    focusableElements,
    {
      onPlayPause: togglePlayPause,
      onNext: handleNextTrack,
      onPrev: handlePrevTrack,
      onSeekForward: handleSeekForward,
      onSeekBackward: handleSeekBackward,
      onSelectFocusedElement: handleSelectFocusedElement,
    },
    isStationModalOpen
  );

  const colors: [string, string] = currentTrack.gradientColors || ['#ec4899', '#8b5cf6'];

  return (
    <div 
      style={{
        paddingTop: 'clamp(4px, 1vmin, 10px)',
        paddingBottom: 'clamp(6px, 1.2vmin, 14px)',
        paddingLeft: 'clamp(4px, 1vmin, 12px)',
        paddingRight: 'clamp(4px, 1vmin, 12px)',
      }}
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#030712] text-slate-100 flex flex-col justify-between items-center select-none"
    >
      {/* Hidden Audio Player Element with preload="none" */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        preload="none"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setAudioState((prev) => ({
              ...prev,
              currentTime: audioRef.current?.currentTime || 0,
              duration: audioRef.current?.duration || 0,
            }));
          }
        }}
        onEnded={handleNextTrack}
        onError={() => {
          setAudioState((prev) => ({
            ...prev,
            isPlaying: false,
            isLoading: false,
          }));
        }}
      />

      {/* Visualizer Style Change Notification Toast */}
      {styleToast && (
        <div 
          style={{
            top: 'clamp(10px, 2vmin, 24px)',
            fontSize: 'clamp(0.72rem, 1.4vmin, 0.95rem)',
            padding: 'clamp(4px, 0.8vmin, 8px) clamp(12px, 2.2vmin, 22px)',
          }}
          className="absolute z-40 rounded-full bg-slate-900/90 border border-pink-500/50 font-semibold text-pink-300 shadow-xl backdrop-blur-md pointer-events-none transition-all animate-bounce"
        >
          {styleToast}
        </div>
      )}

      {/* Lightweight Ambient Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 42%, ${colors[0]}33 0%, ${colors[1]}15 50%, #030712 100%)`,
        }}
      />

      {/* Fullscreen Web Audio Radial Canvas Visualizer */}
      <RadialVisualizer
        style={visualizerStyle}
        isPlaying={audioState.isPlaying}
        accentColors={colors}
        circleRef={circleRef}
      />

      {/* 1. UPPER STAGE: Maximized CoverCircle */}
      <div className="relative z-20 flex-[1.6] flex items-center justify-center w-full pt-1">
        <CoverCircle
          ref={circleRef}
          currentTrack={currentTrack}
          isPlaying={audioState.isPlaying}
          gradientColors={colors}
          isFocused={focusedElement === 'cover-circle'}
          onClick={handleCycleVisualizer}
        />
      </div>

      {/* 2. LOWER STAGE: Controls tucked cleanly at the bottom */}
      <main className="relative z-20 flex-[0.7] flex flex-col items-center justify-end w-full pb-1">
        <TvControls
          currentTrack={currentTrack}
          isPlaying={audioState.isPlaying}
          isMuted={audioState.isMuted}
          volume={audioState.volume}
          currentTime={audioState.currentTime}
          duration={audioState.duration}
          focusedElement={focusedElement}
          onPlayPause={togglePlayPause}
          onNext={handleNextTrack}
          onPrev={handlePrevTrack}
          onSeek={handleSeek}
          onToggleMute={handleToggleMute}
          onOpenStationModal={() => setIsStationModalOpen(true)}
        />
      </main>

      {/* 3. Station Selection Modal Popup with Dedicated ScrollView */}
      <StationModal
        isOpen={isStationModalOpen}
        tracks={tracks}
        currentTrackId={currentTrack.id}
        isPlaying={audioState.isPlaying}
        onClose={() => setIsStationModalOpen(false)}
        onSelectTrack={handleSelectTrack}
      />
    </div>
  );
}
