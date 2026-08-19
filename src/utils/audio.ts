// Web Audio API Procedural Sound Synthesizer for HyperClick Pro 2026
import { soundEngine, SOUND_PROFILES } from '../services/soundEngine';
import { SoundProfileId } from '../types/sound';

export { soundEngine, SOUND_PROFILES };

export function playClickSound(
  theme: 'mechanical' | 'laser' | 'subtle' | 'synth' | SoundProfileId = 'mechanical',
  volume?: number
) {
  if (volume !== undefined) {
    soundEngine.setMasterVolume(volume);
  }

  let mappedProfile: SoundProfileId = 'cherry-mx-blue';
  if (theme === 'laser' || theme === 'cyber-laser') {
    mappedProfile = 'cyber-laser';
  } else if (theme === 'synth' || theme === 'retro-arcade') {
    mappedProfile = 'retro-arcade';
  } else if (theme === 'subtle' || theme === 'tech-pulse') {
    mappedProfile = 'tech-pulse';
  } else if (theme === 'bubble-pop') {
    mappedProfile = 'bubble-pop';
  } else if (theme === 'kailh-box-white') {
    mappedProfile = 'kailh-box-white';
  } else if (theme === 'cherry-mx-blue' || theme === 'mechanical') {
    mappedProfile = 'cherry-mx-blue';
  }

  soundEngine.playClick(mappedProfile);
}

export function playUiChime(type: 'start' | 'stop' | 'toggle' | 'notify') {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    if (type === 'start') {
      // Uplifting ascending chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    } else if (type === 'stop') {
      // Descending power down chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    } else if (type === 'notify') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.setValueAtTime(987.77, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    }

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    // Audio context error fallback
  }
}
