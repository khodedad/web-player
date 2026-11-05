export type TrackType = 'radio' | 'mp3';

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverUrl?: string;
  type: TrackType;
  genre?: string;
  description?: string;
  gradientColors?: [string, string];
}

export type VisualizerStyle = 
  | 'avee-ring'
  | 'neon-tunnel'
  | 'quantum-waves'
  | 'starburst'
  | 'dual-spectrum'
  | 'cyber-equalizer'
  | 'solar-flare'
  | 'plasma-pulse'
  | 'supernova-ring'
  | 'aurora-waves'
  | 'cyber-vortex'
  | 'hyper-cube'
  | 'laser-grid'
  | 'nebula-pulsar'
  | 'fire-ring';

export interface AudioState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number; // 0 to 1
  currentTime: number;
  duration: number; // 0 for endless radio streams
  isLive: boolean;
  isLoading: boolean;
  error: string | null;
  bitrate?: string;
}

export type TvFocusZone = 'header' | 'visualizer-styles' | 'stations' | 'seekbar' | 'main-controls' | 'volume';
