/**
 * Comprehensive Unit Tests:
 * 1. Sound profiles metadata & integrity (SOUND_PROFILES)
 * 2. SoundEngine configuration (volume clamping, mute, pitch modulation, humanization)
 * 3. Procedural acoustic calculation & pitch multiplier detuning
 * 4. High CPS voice throttling (1000+ CPS protection & 12ms minimum voice gap)
 * 5. Procedural sound synthesis across all acoustic profiles:
 *    - Cherry MX Blue (dual-stage metallic leaf snap + housing resonant thud)
 *    - Kailh Box White (clickbar tactile snap + spring ping + stem tap)
 *    - Cyber Laser (sawtooth downward frequency glide + bandpass resonance)
 *    - Soft Bubble Pop (upward frequency glide + cavity resonance)
 *    - Retro Arcade Beep (8-bit dual-tone square wave punch)
 *    - Subtle Tech Pulse (sub-bass transient punch + sterile high tick)
 *    - Muted (zero audio output)
 * 6. UI status chimes procedural parameter calculation (playUiChime, playClickSound in src/utils/audio.ts)
 * 
 * Target files:
 * - src/services/soundEngine.ts
 * - src/utils/audio.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { soundEngine, SOUND_PROFILES } from '../../src/services/soundEngine';
import { playClickSound, playUiChime } from '../../src/utils/audio';

// Mock Web Audio API implementation for headless test environments
class MockAudioParam {
  public value = 0;
  public setValueAtTime = vi.fn((val: number) => { this.value = val; });
  public exponentialRampToValueAtTime = vi.fn();
  public linearRampToValueAtTime = vi.fn();
  public setTargetAtTime = vi.fn();
}

class MockAudioNode {
  public connect = vi.fn();
  public disconnect = vi.fn();
}

class MockGainNode extends MockAudioNode {
  public gain = new MockAudioParam();
}

class MockBiquadFilterNode extends MockAudioNode {
  public frequency = new MockAudioParam();
  public Q = new MockAudioParam();
  public type: BiquadFilterType = 'bandpass';
}

class MockOscillatorNode extends MockAudioNode {
  public frequency = new MockAudioParam();
  public type: OscillatorType = 'sine';
  public start = vi.fn();
  public stop = vi.fn();
}

class MockAudioBufferSourceNode extends MockAudioNode {
  public buffer: any = null;
  public start = vi.fn();
  public stop = vi.fn();
}

class MockDynamicsCompressorNode extends MockAudioNode {
  public threshold = new MockAudioParam();
  public knee = new MockAudioParam();
  public ratio = new MockAudioParam();
  public attack = new MockAudioParam();
  public release = new MockAudioParam();
}

class MockAnalyserNode extends MockAudioNode {
  public fftSize = 256;
  public smoothingTimeConstant = 0.6;
  public getByteFrequencyData = vi.fn((arr: Uint8Array) => arr.fill(50));
}

class MockAudioContext {
  public state = 'running';
  public currentTime = 10.0;
  public sampleRate = 44100;
  public destination = new MockAudioNode();

  public resume = vi.fn().mockResolvedValue(undefined);
  public createGain = vi.fn(() => new MockGainNode());
  public createOscillator = vi.fn(() => new MockOscillatorNode());
  public createBiquadFilter = vi.fn(() => new MockBiquadFilterNode());
  public createDynamicsCompressor = vi.fn(() => new MockDynamicsCompressorNode());
  public createAnalyser = vi.fn(() => new MockAnalyserNode());
  public createBuffer = vi.fn((channels, length, rate) => ({
    getChannelData: () => new Float32Array(length),
  }));
  public createBufferSource = vi.fn(() => new MockAudioBufferSourceNode());
}

describe('Procedural Sound Engine & Audio Utilities', () => {
  beforeEach(() => {
    (window as any).AudioContext = MockAudioContext;
    (window as any).webkitAudioContext = MockAudioContext;

    soundEngine.updateConfig({
      profile: 'cherry-mx-blue',
      masterVolume: 0.75,
      muted: false,
      pitchModulation: 0.12,
      humanizeClicks: true,
      maxPolyphony: 8,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Sound Profiles Metadata (SOUND_PROFILES)', () => {
    it('contains all 7 procedural acoustic profiles with complete metadata', () => {
      expect(SOUND_PROFILES.length).toBe(7);

      const ids = SOUND_PROFILES.map((p) => p.id);
      expect(ids).toContain('cherry-mx-blue');
      expect(ids).toContain('kailh-box-white');
      expect(ids).toContain('cyber-laser');
      expect(ids).toContain('bubble-pop');
      expect(ids).toContain('retro-arcade');
      expect(ids).toContain('tech-pulse');
      expect(ids).toContain('muted');

      SOUND_PROFILES.forEach((profile) => {
        expect(profile.name).toBeDefined();
        expect(profile.category).toBeDefined();
        expect(profile.description).toBeDefined();
        expect(profile.primaryFrequency).toBeDefined();
        expect(profile.color).toMatch(/^#/);
        expect(profile.tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SoundEngine Configuration & State', () => {
    it('updates and clamps master volume between 0 and 1', () => {
      soundEngine.setMasterVolume(0.5);
      expect(soundEngine.getMasterVolume()).toBe(0.5);

      soundEngine.setMasterVolume(1.5);
      expect(soundEngine.getMasterVolume()).toBe(1.0);

      soundEngine.setMasterVolume(-0.2);
      expect(soundEngine.getMasterVolume()).toBe(0.0);
    });

    it('toggles and manages mute status', () => {
      soundEngine.setMuted(true);
      expect(soundEngine.isMuted()).toBe(true);

      const toggled = soundEngine.toggleMute();
      expect(toggled).toBe(false);
      expect(soundEngine.isMuted()).toBe(false);
    });

    it('updates pitch modulation and humanization toggles', () => {
      soundEngine.setPitchModulation(0.2);
      expect(soundEngine.getPitchModulation()).toBe(0.2);

      soundEngine.setHumanizeClicks(false);
      expect(soundEngine.isHumanizeClicks()).toBe(false);

      soundEngine.updateConfig({
        profile: 'cyber-laser',
        masterVolume: 0.8,
      });

      expect(soundEngine.getProfile()).toBe('cyber-laser');
      expect(soundEngine.getMasterVolume()).toBe(0.8);
    });

    it('calculates pitch multiplier detuning within pitchModulation boundaries', () => {
      soundEngine.setHumanizeClicks(false);
      const exactMul = (soundEngine as any).getPitchMultiplier();
      expect(exactMul).toBe(1.0);

      soundEngine.setHumanizeClicks(true);
      soundEngine.setPitchModulation(0.12);

      for (let i = 0; i < 50; i++) {
        const mul = (soundEngine as any).getPitchMultiplier();
        // ± (0.12 * 0.35) = ± 0.042
        expect(mul).toBeGreaterThanOrEqual(0.95);
        expect(mul).toBeLessThanOrEqual(1.05);
      }
    });
  });

  describe('Procedural Sound Synthesis & Throttling', () => {
    it('initializes Web Audio context graph on demand', () => {
      const initialized = soundEngine.initContext();
      expect(initialized).toBe(true);
      expect(soundEngine.getAudioContext()).not.toBeNull();
    });

    it('synthesizes all procedural profiles without throwing errors', () => {
      const profiles: any[] = [
        'cherry-mx-blue',
        'kailh-box-white',
        'cyber-laser',
        'bubble-pop',
        'retro-arcade',
        'tech-pulse',
      ];

      profiles.forEach((p) => {
        // Reset throttle timing
        (soundEngine as any).lastPlayTime = 0;
        expect(() => soundEngine.playClick(p)).not.toThrow();
      });
    });

    it('suppresses audio output when muted or profile is "muted"', () => {
      soundEngine.setMuted(true);
      const synthSpy = vi.spyOn(soundEngine as any, 'synthCherryMxBlue');
      soundEngine.playClick('cherry-mx-blue');
      expect(synthSpy).not.toHaveBeenCalled();

      soundEngine.setMuted(false);
      soundEngine.playClick('muted');
      expect(synthSpy).not.toHaveBeenCalled();
    });

    it('applies high-CPS rate limiting gap (12ms minimum gap)', () => {
      soundEngine.initContext();
      const synthSpy = vi.spyOn(soundEngine as any, 'synthCherryMxBlue');

      (soundEngine as any).lastPlayTime = 10.0;
      (soundEngine as any).ctx.currentTime = 10.005; // 5ms gap (< 12ms gap threshold)

      soundEngine.playClick('cherry-mx-blue');
      expect(synthSpy).not.toHaveBeenCalled();

      (soundEngine as any).ctx.currentTime = 10.020; // 20ms gap (> 12ms gap threshold)
      soundEngine.playClick('cherry-mx-blue');
      expect(synthSpy).toHaveBeenCalledTimes(1);
    });

    it('triggers test burst sequence', () => {
      vi.useFakeTimers();
      const playSpy = vi.spyOn(soundEngine, 'playClick');

      soundEngine.playBurst(5, 10, 'cyber-laser');
      vi.advanceTimersByTime(500);

      expect(playSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('subscribes and unsubscribes to level visualizer callback', () => {
      const callback = vi.fn();
      const unsubscribe = soundEngine.subscribeToLevel(callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('Audio Utilities (src/utils/audio.ts)', () => {
    it('playClickSound maps theme aliases to exact sound profile IDs', () => {
      const playClickSpy = vi.spyOn(soundEngine, 'playClick');

      playClickSound('laser', 0.8);
      expect(playClickSpy).toHaveBeenCalledWith('cyber-laser');
      expect(soundEngine.getMasterVolume()).toBe(0.8);

      (soundEngine as any).lastPlayTime = 0;
      playClickSound('synth');
      expect(playClickSpy).toHaveBeenCalledWith('retro-arcade');

      (soundEngine as any).lastPlayTime = 0;
      playClickSound('subtle');
      expect(playClickSpy).toHaveBeenCalledWith('tech-pulse');

      (soundEngine as any).lastPlayTime = 0;
      playClickSound('bubble-pop');
      expect(playClickSpy).toHaveBeenCalledWith('bubble-pop');

      (soundEngine as any).lastPlayTime = 0;
      playClickSound('kailh-box-white');
      expect(playClickSpy).toHaveBeenCalledWith('kailh-box-white');

      (soundEngine as any).lastPlayTime = 0;
      playClickSound('mechanical');
      expect(playClickSpy).toHaveBeenCalledWith('cherry-mx-blue');

      (soundEngine as any).lastPlayTime = 0;
      playClickSound('muted');
      expect(playClickSpy).toHaveBeenCalledWith('muted');
    });

    it('playUiChime plays procedural status chimes without error', () => {
      expect(() => {
        playUiChime('start');
        playUiChime('stop');
        playUiChime('notify');
        playUiChime('toggle');
      }).not.toThrow();
    });
  });
});
