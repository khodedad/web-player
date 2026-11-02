/**
 * web play - Responsive Fullscreen Web Music Player & Visualizer
 * Fully responsive across Mobile, Tablet, Desktop, and 16:9 Smart TVs.
 * Multiple lightweight Web Audio API visualizer styles cyclable by tapping the central circle.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PRESET_TRACKS } from './constants/tracks';
import { Track, AudioState, VisualizerStyle } from './types/player';
import { audioEngine } from './services/audioEngine';
import { RadialVisualizer } from './components/RadialVisualizer';
import { CoverCircle } from './components/CoverCircle';
import { TvControls } from './components/TvControls';
import { StationList } from './components/StationList';
import { useTvRemote } from './hooks/useTvRemote';

const VISUALIZER_STYLES: { id: VisualizerStyle; name: string }[] = [
  { id: 'avee-ring', name: 'حلقه رادیال Avee' },
  { id: 'neon-waves', name: 'امواج نئون' },
  { id: 'dual-spectrum', name: 'طیف دوطرفه' },
  { id: 'particle-orbit', name: 'مدار کوانتومی' },
  { id: 'bars-3d', name: 'آرک سایبری' },
];

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(PRESET_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [visualizerStyle, setVisualizerStyle] = useState<VisualizerStyle>('avee-ring');
  const [styleToast, setStyleToast] = useState<string | null>(null);

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
  const currentTrack = tracks[currentTrackIndex] || PRESET_TRACKS[0];

  // Initialize Web Audio Engine with Audio Element
  useEffect(() => {
    if (audioRef.current) {
      audioEngine.init(audioRef.current);
    }
  }, []);

  // Handle Play/Pause Toggle
  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      await audioEngine.setupWebAudio();

      if (audioState.isPlaying) {
        audioRef.current.pause();
        setAudioState((prev) => ({ ...prev, isPlaying: false }));
      } else {
        setAudioState((prev) => ({ ...prev, isLoading: true, error: null }));
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          await audioEngine.resumeContext();
          setAudioState((prev) => ({ ...prev, isPlaying: true, isLoading: false }));
        }
      }
    } catch (err) {
      console.error('Audio playback error:', err);
      setAudioState((prev) => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: 'خطا در برقراری اتصال',
      }));
    }
  }, [audioState.isPlaying]);

  // Tap on Central Circle cycles through beautiful visualizer types
  const handleCycleVisualizer = useCallback(() => {
    const currentIndex = VISUALIZER_STYLES.findIndex((s) => s.id === visualizerStyle);
    const nextIndex = (currentIndex + 1) % VISUALIZER_STYLES.length;
    const nextStyle = VISUALIZER_STYLES[nextIndex];
    setVisualizerStyle(nextStyle.id);

    // Show temporary stylish confirmation indicator
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
        isPlaying: false,
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

  // Auto Play when track changes if was playing
  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.src = currentTrack.url;
    audioRef.current.load();

    const handleCanPlay = async () => {
      try {
        await audioEngine.setupWebAudio();
        const playPromise = audioRef.current?.play();
        if (playPromise !== undefined) {
          await playPromise;
          setAudioState((prev) => ({ ...prev, isPlaying: true, isLoading: false }));
        }
      } catch (err) {
        setAudioState((prev) => ({ ...prev, isPlaying: false, isLoading: false }));
      }
    };

    audioRef.current.addEventListener('canplay', handleCanPlay, { once: true });

    return () => {
      audioRef.current?.removeEventListener('canplay', handleCanPlay);
    };
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
    'seekbar',
    ...tracks.map((_, i) => `station-${i}`),
  ];

  const handleSelectFocusedElement = (elementId: string) => {
    if (elementId.startsWith('station-')) {
      const idx = parseInt(elementId.replace('station-', ''), 10);
      if (tracks[idx]) handleSelectTrack(tracks[idx]);
    } else if (elementId === 'btn-play') {
      togglePlayPause();
    } else if (elementId === 'btn-next') {
      handleNextTrack();
    } else if (elementId === 'btn-prev') {
      handlePrevTrack();
    } else if (elementId === 'btn-volume') {
      handleToggleMute();
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
    false
  );

  const colors: [string, string] = currentTrack.gradientColors || ['#ec4899', '#8b5cf6'];

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#030712] text-slate-100 flex flex-col justify-between items-center py-3 sm:py-6 px-4 select-none">
      {/* Hidden Audio Player Element */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
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
            error: 'خطا در بارگیری استریم رادیو',
          }));
        }}
      />

      {/* Visualizer Style Change Notification Toast */}
      {styleToast && (
        <div className="absolute top-5 z-40 px-4 py-1.5 rounded-full bg-slate-900/90 border border-pink-500/50 text-xs font-semibold text-pink-300 shadow-xl backdrop-blur-md pointer-events-none transition-all animate-bounce">
          {styleToast}
        </div>
      )}

      {/* Lightweight Ambient Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${colors[0]}33 0%, ${colors[1]}15 50%, #030712 100%)`,
        }}
      />

      {/* Fullscreen Web Audio Radial Canvas Visualizer - Dynamically Centered */}
      <RadialVisualizer
        style={visualizerStyle}
        isPlaying={audioState.isPlaying}
        accentColors={colors}
        circleRef={circleRef}
      />

      {/* Main Center Stage: Responsive Circle + Minimalist Controls */}
      <main className="relative flex-1 flex flex-col items-center justify-center gap-4 sm:gap-6 z-20 w-full my-auto">
        {/* Center Cover / Vinyl Circle - Clicking cycles visualizer styles */}
        <CoverCircle
          ref={circleRef}
          currentTrack={currentTrack}
          isPlaying={audioState.isPlaying}
          gradientColors={colors}
          isFocused={focusedElement === 'cover-circle'}
          onClick={handleCycleVisualizer}
        />

        {/* Media Controls & Track Info */}
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
        />
      </main>

      {/* Quiet, Minimalist Station Switcher Bar */}
      <StationList
        tracks={tracks}
        currentTrackId={currentTrack.id}
        isPlaying={audioState.isPlaying}
        focusedElement={focusedElement}
        onSelectTrack={handleSelectTrack}
      />
    </div>
  );
}
