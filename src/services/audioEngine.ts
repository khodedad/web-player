/**
 * Web Audio API Engine for TV Web Player
 * Handles AudioContext, AnalyserNode, frequency data extraction, and smooth CORS emulation.
 */

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private audioEle: HTMLAudioElement | null = null;
  private frequencyData: Uint8Array = new Uint8Array(128);
  private isCorsBlocked = false;
  private emulationPhase = 0;

  constructor() {
    // Initialized lazily on user gesture
  }

  public init(audioElement: HTMLAudioElement) {
    this.audioEle = audioElement;
  }

  public async setupWebAudio(): Promise<boolean> {
    if (!this.audioEle) return false;

    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (!this.analyser) {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.82;
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      }

      if (!this.source && this.audioEle) {
        try {
          this.source = this.audioContext.createMediaElementSource(this.audioEle);
          this.source.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
          this.isCorsBlocked = false;
        } catch (err) {
          console.warn('Web Audio CORS restriction detected, using intelligent visualizer emulation mode:', err);
          this.isCorsBlocked = true;
        }
      }

      return true;
    } catch (err) {
      console.warn('Failed to initialize Web Audio API, using visualizer fallback:', err);
      this.isCorsBlocked = true;
      return false;
    }
  }

  public async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  public updateFrequencyData(): Uint8Array {
    if (this.analyser && !this.isCorsBlocked) {
      this.analyser.getByteFrequencyData(this.frequencyData as Uint8Array<ArrayBuffer>);

      // Verify if frequency data is non-zero
      let sum = 0;
      for (let i = 0; i < 20; i++) {
        sum += this.frequencyData[i];
      }

      if (sum === 0 && this.audioEle && !this.audioEle.paused) {
        // Audio is playing but CORS zeroed out Web Audio analyzer
        this.generateEmulatedFrequencies();
      }
    } else if (this.audioEle && !this.audioEle.paused) {
      this.generateEmulatedFrequencies();
    } else {
      // Audio paused -> decay frequency data smoothly to 0
      for (let i = 0; i < this.frequencyData.length; i++) {
        this.frequencyData[i] = Math.max(0, this.frequencyData[i] - 12);
      }
    }

    return this.frequencyData;
  }

  /**
   * Generates rhythmic Avee-style frequency pulses for streams where CORS obscures raw FFT bytes
   */
  private generateEmulatedFrequencies() {
    this.emulationPhase += 0.08;
    const len = this.frequencyData.length;
    const beatRate = Math.sin(this.emulationPhase * 2.5);
    const isKick = beatRate > 0.65;
    
    for (let i = 0; i < len; i++) {
      const normalizedIdx = i / len;
      // Bass boost on lower bins
      let baseVal = 0;
      if (normalizedIdx < 0.2) {
        baseVal = (isKick ? 220 : 130) + Math.sin(this.emulationPhase * 4 + i) * 35;
      } else if (normalizedIdx < 0.6) {
        baseVal = 90 + Math.sin(this.emulationPhase * 3 + i * 0.5) * 45;
      } else {
        baseVal = 50 + Math.cos(this.emulationPhase * 5 + i * 0.8) * 30;
      }

      // Add pseudo random variation
      const jitter = (Math.sin(i * 12.3 + this.emulationPhase * 2) + 1) * 20;
      this.frequencyData[i] = Math.min(255, Math.max(15, Math.floor(baseVal + jitter)));
    }
  }

  public getEnergyLevels(): { bass: number; mid: number; treble: number } {
    const data = this.updateFrequencyData();
    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;

    const len = data.length;
    const bassBinEnd = Math.floor(len * 0.2);
    const midBinEnd = Math.floor(len * 0.6);

    for (let i = 0; i < bassBinEnd; i++) bassSum += data[i];
    for (let i = bassBinEnd; i < midBinEnd; i++) midSum += data[i];
    for (let i = midBinEnd; i < len; i++) trebleSum += data[i];

    return {
      bass: (bassSum / (bassBinEnd * 255)) || 0,
      mid: (midSum / ((midBinEnd - bassBinEnd) * 255)) || 0,
      treble: (trebleSum / ((len - midBinEnd) * 255)) || 0,
    };
  }
}

export const audioEngine = new AudioEngine();
