/**
 * HyperClick Pro 2026 - Procedural Web Audio Sound Engine
 * 
 * Generates 100% procedural, real-time synthesized acoustic profiles
 * without external audio sample files:
 * - Mechanical Cherry MX Blue Click (Dual-stage leaf snap + housing resonant thud)
 * - Kailh Box White (Crisp clickbar tactile snap + high-frequency spring ping)
 * - Cyber Laser Blip (Exponential down-sweep + resonant bandpass harmonics)
 * - Soft Bubble Pop (Exponential upward frequency glide + organic cavity pop)
 * - Retro Arcade Beep (8-bit dual-tone square wave chiptune punch)
 * - Subtle Tech Pulse (Sub-bass transient drop + ultra-short sterile tick)
 * - Muted (Zero audio output)
 * 
 * Features:
 * - Real-time Master Volume & Mute control
 * - Dynamic Pitch Modulation (humanized detuning to eliminate repetition fatigue)
 * - Ultra-High CPS Micro-Transient Adaptive Rate Limiting (handles 1,000+ CPS cleanly)
 * - Automatic AudioNode Graph Garbage Collection & Disconnection (zero memory leak)
 * - Dynamics Compressor with soft-knee limiting to eliminate clipping
 * - AnalyserNode integration for live VU meters and visualizer pulses
 */

import { SoundProfile, SoundProfileId, SoundEngineConfig } from '../types/sound';

export const SOUND_PROFILES: SoundProfile[] = [
  {
    id: 'cherry-mx-blue',
    name: 'Cherry MX Blue',
    category: 'mechanical',
    description: 'Authentic tactile switch with crisp leaf snap and deep housing thud resonance.',
    badge: 'Tactile Click',
    primaryFrequency: '5.2 kHz / 380 Hz',
    tags: ['Mechanical', 'Clicky', 'Dual-Stage', 'Classic'],
    color: '#00f2fe',
    glowColor: 'rgba(0, 242, 254, 0.4)',
  },
  {
    id: 'kailh-box-white',
    name: 'Kailh Box White',
    category: 'mechanical',
    description: 'Modern clickbar mechanism producing an ultra-crisp, sharp acoustic snap.',
    badge: 'Clickbar Snap',
    primaryFrequency: '5.6 kHz / 650 Hz',
    tags: ['Mechanical', 'Crisp', 'Fast Decay', 'Esports'],
    color: '#e100ff',
    glowColor: 'rgba(225, 0, 255, 0.4)',
  },
  {
    id: 'cyber-laser',
    name: 'Cyber Laser',
    category: 'scifi',
    description: 'Futuristic sci-fi energy blip with resonant bandpass sweep and harmonic punch.',
    badge: 'Sci-Fi Synth',
    primaryFrequency: '1.95 kHz → 120 Hz',
    tags: ['Cyberpunk', 'Sawtooth', 'Resonant', 'Modern'],
    color: '#00f5a0',
    glowColor: 'rgba(0, 245, 160, 0.4)',
  },
  {
    id: 'bubble-pop',
    name: 'Soft Bubble Pop',
    category: 'organic',
    description: 'Smooth upward glide with organic acoustic cavity resonance. Satisfying & soft.',
    badge: 'Organic Pop',
    primaryFrequency: '160 Hz → 860 Hz',
    tags: ['Organic', 'Soft', 'Minimal Fatigue', 'Fluid'],
    color: '#4facfe',
    glowColor: 'rgba(79, 172, 254, 0.4)',
  },
  {
    id: 'retro-arcade',
    name: 'Retro Arcade Beep',
    category: 'arcade',
    description: 'Classic 8-bit dual-tone square wave punch. Nostalgic retro gaming feedback.',
    badge: '8-Bit Pulse',
    primaryFrequency: '988 Hz / 1.32 kHz',
    tags: ['8-Bit', 'Chiptune', 'Square Wave', 'Retro'],
    color: '#ffaa00',
    glowColor: 'rgba(255, 170, 0, 0.4)',
  },
  {
    id: 'tech-pulse',
    name: 'Subtle Tech Pulse',
    category: 'minimal',
    description: 'Ultra-clean sub-bass transient punch with sterile high tick. Non-intrusive.',
    badge: 'Clean Transient',
    primaryFrequency: '110 Hz → 42 Hz',
    tags: ['Sub-Bass', 'Sterile', 'Studio', 'Pro'],
    color: '#ff3366',
    glowColor: 'rgba(255, 51, 102, 0.4)',
  },
  {
    id: 'muted',
    name: 'Muted (Silent)',
    category: 'none',
    description: 'Audio feedback disabled for stealth operation.',
    badge: 'Muted',
    primaryFrequency: '0 Hz',
    tags: ['Silent', 'Stealth'],
    color: '#64748b',
    glowColor: 'rgba(100, 116, 139, 0.2)',
  },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private config: SoundEngineConfig = {
    profile: 'cherry-mx-blue',
    masterVolume: 0.75,
    muted: false,
    pitchModulation: 0.12, // ±12% random detune for humanized sound
    humanizeClicks: true,
    maxPolyphony: 8,
  };

  private lastPlayTime = 0;
  private activeVoicesCount = 0;
  private listeners: Set<(level: number) => void> = new Set();
  private animFrameId: number | null = null;
  private smoothedLevel = 0;

  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

  /**
   * Initializes or resumes the AudioContext and graph nodes
   */
  public initContext(): boolean {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) {
        console.warn('[SoundEngine] Web Audio API is not supported in this environment.');
        return false;
      }

      this.ctx = new AudioCtxClass({ latencyHint: 'interactive' });

      // Create Dynamics Compressor to prevent clipping at ultra-high CPS
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(24, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.002, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.05, this.ctx.currentTime);

      // Create AnalyserNode for live VU meter and visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.6;

      // Master Gain Node
      this.masterGain = this.ctx.createGain();
      const currentGain = this.config.muted ? 0 : this.config.masterVolume;
      this.masterGain.gain.setValueAtTime(currentGain, this.ctx.currentTime);

      // Connect: MasterGain -> Compressor -> Analyser -> Destination
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // Pre-render white noise buffer for mechanical switch leaf snaps and transient ticks
      this.generateNoiseBuffer();

      // Start level meter loop
      this.startMeterLoop();

      return true;
    } catch (err) {
      console.error('[SoundEngine] Failed to initialize AudioContext:', err);
      return false;
    }
  }

  /**
   * Returns current active AudioContext (for shared UI chimes)
   */
  public getAudioContext(): AudioContext | null {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.initContext();
    }
    return this.ctx;
  }

  /**
   * Pre-generates 1 second of stereo white noise
   */
  private generateNoiseBuffer() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate; // 1 second buffer
    const buffer = this.ctx.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * 0.8;
      }
    }
    this.noiseBuffer = buffer;
  }

  /**
   * Explicitly schedules disconnection of AudioNodes to prevent memory bloat
   */
  private scheduleNodeCleanup(nodes: (AudioNode | null | undefined)[], delayMs: number) {
    setTimeout(() => {
      for (const node of nodes) {
        if (node) {
          try {
            node.disconnect();
          } catch {
            // Ignore if already disconnected
          }
        }
      }
    }, delayMs);
  }

  /**
   * Starts the meter update loop for real-time visualizer feedback
   */
  private startMeterLoop() {
    if (this.animFrameId !== null || typeof window === 'undefined') return;

    const dataArray = new Uint8Array(64);
    const update = () => {
      if (this.analyser && this.listeners.size > 0) {
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(1, average / 140);
        
        // Smooth drop-off
        this.smoothedLevel = Math.max(normalized, this.smoothedLevel * 0.88);

        this.listeners.forEach((cb) => cb(this.smoothedLevel));
      }
      this.animFrameId = requestAnimationFrame(update);
    };

    this.animFrameId = requestAnimationFrame(update);
  }

  /**
   * Calculates random detune ratio based on pitch modulation config
   */
  private getPitchMultiplier(): number {
    if (!this.config.humanizeClicks || this.config.pitchModulation <= 0) {
      return 1.0;
    }
    const detuneSpread = this.config.pitchModulation * 0.35; // up to ±12%
    return 1.0 + (Math.random() * 2 - 1) * detuneSpread;
  }

  /**
   * Main entry point to trigger procedural click sound
   */
  public playClick(overrideProfile?: SoundProfileId) {
    const profileId = overrideProfile || this.config.profile;
    if (profileId === 'muted' || this.config.muted || this.config.masterVolume <= 0) {
      return;
    }

    if (!this.initContext() || !this.ctx || !this.masterGain) {
      return;
    }

    const now = this.ctx.currentTime;

    // High CPS voice throttling (1000+ CPS Protection):
    // Enforce 12ms minimum voice gap (~83 triggers/sec max) and hard voice cap to eliminate distortion
    const timeDelta = now - this.lastPlayTime;
    if (timeDelta < 0.012 || this.activeVoicesCount >= this.config.maxPolyphony) {
      return;
    }
    this.lastPlayTime = now;

    // Voice count tracking
    this.activeVoicesCount++;
    setTimeout(() => {
      this.activeVoicesCount = Math.max(0, this.activeVoicesCount - 1);
    }, 45);

    const pitchMul = this.getPitchMultiplier();

    switch (profileId) {
      case 'cherry-mx-blue':
        this.synthCherryMxBlue(now, pitchMul);
        break;
      case 'kailh-box-white':
        this.synthKailhBoxWhite(now, pitchMul);
        break;
      case 'cyber-laser':
        this.synthCyberLaser(now, pitchMul);
        break;
      case 'bubble-pop':
        this.synthBubblePop(now, pitchMul);
        break;
      case 'retro-arcade':
        this.synthRetroArcade(now, pitchMul);
        break;
      case 'tech-pulse':
        this.synthTechPulse(now, pitchMul);
        break;
      default:
        this.synthCherryMxBlue(now, pitchMul);
        break;
    }
  }

  /**
   * Synthesizer 1: Cherry MX Blue Click
   * Dual-stage tactile leaf snap + housing bottom-out resonance
   */
  private synthCherryMxBlue(now: number, pitchMul: number) {
    if (!this.ctx || !this.masterGain) return;
    const nodesToClean: AudioNode[] = [];

    // --- 1. Metallic Leaf Snap (Filtered Noise Burst) ---
    if (this.noiseBuffer) {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.noiseBuffer;
      noiseSource.start(now, Math.random() * 0.8, 0.016);

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(5200 * pitchMul, now);
      noiseFilter.Q.setValueAtTime(7.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.65, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      nodesToClean.push(noiseSource, noiseFilter, noiseGain);
    }

    // --- 2. High Ping Tone (Metallic contact leaf resonance) ---
    const pingOsc = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    pingOsc.type = 'sine';
    pingOsc.frequency.setValueAtTime(4200 * pitchMul, now);
    pingOsc.frequency.exponentialRampToValueAtTime(2600 * pitchMul, now + 0.010);

    pingGain.gain.setValueAtTime(0.35, now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.010);

    pingOsc.connect(pingGain);
    pingGain.connect(this.masterGain);
    pingOsc.start(now);
    pingOsc.stop(now + 0.012);
    nodesToClean.push(pingOsc, pingGain);

    // --- 3. Housing Thud (Deep body bottom-out impact) ---
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(410 * pitchMul, now);
    thudOsc.frequency.exponentialRampToValueAtTime(120 * pitchMul, now + 0.022);

    thudGain.gain.setValueAtTime(0.5, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.024);

    thudOsc.connect(thudGain);
    thudGain.connect(this.masterGain);
    thudOsc.start(now);
    thudOsc.stop(now + 0.025);
    nodesToClean.push(thudOsc, thudGain);

    this.scheduleNodeCleanup(nodesToClean, 40);
  }

  /**
   * Synthesizer 2: Kailh Box White Snap
   * Clickbar spring release with crisp, sharp, dry acoustic transient
   */
  private synthKailhBoxWhite(now: number, pitchMul: number) {
    if (!this.ctx || !this.masterGain) return;
    const nodesToClean: AudioNode[] = [];

    // --- 1. Clickbar Snap (Sharp high-frequency burst) ---
    if (this.noiseBuffer) {
      const snapNoise = this.ctx.createBufferSource();
      snapNoise.buffer = this.noiseBuffer;
      snapNoise.start(now, Math.random() * 0.8, 0.008);

      const snapFilter = this.ctx.createBiquadFilter();
      snapFilter.type = 'bandpass';
      snapFilter.frequency.setValueAtTime(5800 * pitchMul, now);
      snapFilter.Q.setValueAtTime(9.0, now);

      const snapGain = this.ctx.createGain();
      snapGain.gain.setValueAtTime(0.8, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.007);

      snapNoise.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(this.masterGain);

      nodesToClean.push(snapNoise, snapFilter, snapGain);
    }

    // --- 2. High Spring Click Ping ---
    const pingOsc = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    pingOsc.type = 'triangle';
    pingOsc.frequency.setValueAtTime(4800 * pitchMul, now);
    pingOsc.frequency.exponentialRampToValueAtTime(3100 * pitchMul, now + 0.008);

    pingGain.gain.setValueAtTime(0.35, now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.008);

    pingOsc.connect(pingGain);
    pingGain.connect(this.masterGain);
    pingOsc.start(now);
    pingOsc.stop(now + 0.010);
    nodesToClean.push(pingOsc, pingGain);

    // --- 3. Crisp Stem Tap ---
    const tapOsc = this.ctx.createOscillator();
    const tapGain = this.ctx.createGain();
    tapOsc.type = 'sine';
    tapOsc.frequency.setValueAtTime(680 * pitchMul, now);
    tapOsc.frequency.exponentialRampToValueAtTime(240 * pitchMul, now + 0.014);

    tapGain.gain.setValueAtTime(0.4, now);
    tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.014);

    tapOsc.connect(tapGain);
    tapGain.connect(this.masterGain);
    tapOsc.start(now);
    tapOsc.stop(now + 0.015);
    nodesToClean.push(tapOsc, tapGain);

    this.scheduleNodeCleanup(nodesToClean, 35);
  }

  /**
   * Synthesizer 3: Cyber Laser Blip
   * Sci-fi resonant energy blip with rapid downward pitch sweep
   */
  private synthCyberLaser(now: number, pitchMul: number) {
    if (!this.ctx || !this.masterGain) return;
    const nodesToClean: AudioNode[] = [];

    // --- 1. Laser Frequency Sweep (Sawtooth with Bandpass) ---
    const laserOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const laserGain = this.ctx.createGain();

    laserOsc.type = 'sawtooth';
    laserOsc.frequency.setValueAtTime(2100 * pitchMul, now);
    laserOsc.frequency.exponentialRampToValueAtTime(110 * pitchMul, now + 0.035);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800 * pitchMul, now);
    filter.frequency.exponentialRampToValueAtTime(320 * pitchMul, now + 0.035);
    filter.Q.setValueAtTime(4.5, now);

    laserGain.gain.setValueAtTime(0.55, now);
    laserGain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

    laserOsc.connect(filter);
    filter.connect(laserGain);
    laserGain.connect(this.masterGain);

    laserOsc.start(now);
    laserOsc.stop(now + 0.040);
    nodesToClean.push(laserOsc, filter, laserGain);

    // --- 2. Low Sub Body ---
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(750 * pitchMul, now);
    subOsc.frequency.exponentialRampToValueAtTime(80 * pitchMul, now + 0.030);

    subGain.gain.setValueAtTime(0.3, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.030);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.032);
    nodesToClean.push(subOsc, subGain);

    this.scheduleNodeCleanup(nodesToClean, 50);
  }

  /**
   * Synthesizer 4: Soft Bubble Pop
   * Fluid organic pop with upward glide and smooth cavity resonance
   */
  private synthBubblePop(now: number, pitchMul: number) {
    if (!this.ctx || !this.masterGain) return;
    const nodesToClean: AudioNode[] = [];

    // --- 1. Upward Sine Glide ---
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();

    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(170 * pitchMul, now);
    popOsc.frequency.exponentialRampToValueAtTime(880 * pitchMul, now + 0.024);

    popGain.gain.setValueAtTime(0.01, now);
    popGain.gain.linearRampToValueAtTime(0.65, now + 0.003);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.030);

    popOsc.connect(popGain);
    popGain.connect(this.masterGain);

    popOsc.start(now);
    popOsc.stop(now + 0.032);
    nodesToClean.push(popOsc, popGain);

    // --- 2. Hollow Cavity Body ---
    const cavityOsc = this.ctx.createOscillator();
    const cavityGain = this.ctx.createGain();

    cavityOsc.type = 'triangle';
    cavityOsc.frequency.setValueAtTime(320 * pitchMul, now);
    cavityOsc.frequency.exponentialRampToValueAtTime(640 * pitchMul, now + 0.020);

    cavityGain.gain.setValueAtTime(0.2, now);
    cavityGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

    cavityOsc.connect(cavityGain);
    cavityGain.connect(this.masterGain);

    cavityOsc.start(now);
    cavityOsc.stop(now + 0.024);
    nodesToClean.push(cavityOsc, cavityGain);

    this.scheduleNodeCleanup(nodesToClean, 45);
  }

  /**
   * Synthesizer 5: Retro Arcade Beep
   * 8-Bit dual-frequency square wave chiptune blip
   */
  private synthRetroArcade(now: number, pitchMul: number) {
    if (!this.ctx || !this.masterGain) return;
    const nodesToClean: AudioNode[] = [];

    const squareOsc = this.ctx.createOscillator();
    const squareGain = this.ctx.createGain();

    squareOsc.type = 'square';
    squareOsc.frequency.setValueAtTime(987.77 * pitchMul, now);
    squareOsc.frequency.setValueAtTime(1318.51 * pitchMul, now + 0.012);

    squareGain.gain.setValueAtTime(0.4, now);
    squareGain.gain.setValueAtTime(0.4, now + 0.020);
    squareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.030);

    squareOsc.connect(squareGain);
    squareGain.connect(this.masterGain);

    squareOsc.start(now);
    squareOsc.stop(now + 0.032);
    nodesToClean.push(squareOsc, squareGain);

    this.scheduleNodeCleanup(nodesToClean, 45);
  }

  /**
   * Synthesizer 6: Subtle Tech Pulse
   * Clean studio sub-bass transient punch + high tick
   */
  private synthTechPulse(now: number, pitchMul: number) {
    if (!this.ctx || !this.masterGain) return;
    const nodesToClean: AudioNode[] = [];

    // --- 1. Sub Bass Transient Punch ---
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(115 * pitchMul, now);
    subOsc.frequency.exponentialRampToValueAtTime(40 * pitchMul, now + 0.028);

    subGain.gain.setValueAtTime(0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.030);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.032);
    nodesToClean.push(subOsc, subGain);

    // --- 2. High Sterile Tick ---
    if (this.noiseBuffer) {
      const tick = this.ctx.createBufferSource();
      tick.buffer = this.noiseBuffer;
      tick.start(now, Math.random() * 0.8, 0.004);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3400 * pitchMul, now);
      filter.Q.setValueAtTime(6.0, now);

      const tickGain = this.ctx.createGain();
      tickGain.gain.setValueAtTime(0.25, now);
      tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.004);

      tick.connect(filter);
      filter.connect(tickGain);
      tickGain.connect(this.masterGain);

      nodesToClean.push(tick, filter, tickGain);
    }

    this.scheduleNodeCleanup(nodesToClean, 45);
  }

  /**
   * Triggers a preview test burst (plays a sequence of clicks at specified CPS)
   */
  public playBurst(count = 5, cps = 12, profile?: SoundProfileId) {
    const intervalMs = 1000 / cps;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.playClick(profile);
      }, i * intervalMs);
    }
  }

  // --- Configuration Setters & Getters ---

  public setProfile(profileId: SoundProfileId) {
    this.config.profile = profileId;
  }

  public getProfile(): SoundProfileId {
    return this.config.profile;
  }

  public setMasterVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    this.config.masterVolume = clamped;
    if (this.ctx && this.masterGain) {
      const target = this.config.muted ? 0 : clamped;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.01);
    }
  }

  public getMasterVolume(): number {
    return this.config.masterVolume;
  }

  public setMuted(muted: boolean) {
    this.config.muted = muted;
    if (this.ctx && this.masterGain) {
      const target = muted ? 0 : this.config.masterVolume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.01);
    }
  }

  public isMuted(): boolean {
    return this.config.muted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.config.muted);
    return this.config.muted;
  }

  public setPitchModulation(mod: number) {
    this.config.pitchModulation = Math.max(0, Math.min(1, mod));
  }

  public getPitchModulation(): number {
    return this.config.pitchModulation;
  }

  public setHumanizeClicks(enabled: boolean) {
    this.config.humanizeClicks = enabled;
  }

  public isHumanizeClicks(): boolean {
    return this.config.humanizeClicks;
  }

  public getConfig(): SoundEngineConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<SoundEngineConfig>) {
    if (partial.profile !== undefined) this.setProfile(partial.profile);
    if (partial.masterVolume !== undefined) this.setMasterVolume(partial.masterVolume);
    if (partial.muted !== undefined) this.setMuted(partial.muted);
    if (partial.pitchModulation !== undefined) this.setPitchModulation(partial.pitchModulation);
    if (partial.humanizeClicks !== undefined) this.setHumanizeClicks(partial.humanizeClicks);
  }

  /**
   * Subscribe to real-time audio volume output (0.0 to 1.0)
   */
  public subscribeToLevel(callback: (level: number) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

// Export singleton instance
export const soundEngine = new SoundEngine();
export default soundEngine;
