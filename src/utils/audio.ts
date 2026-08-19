// Web Audio API Procedural Sound Synthesizer for HyperClick Pro 2026
import { soundEngine, SOUND_PROFILES } from '../services/soundEngine';
import { SoundProfileId } from '../types/sound';

export { soundEngine, SOUND_PROFILES };

/**
 * Trigger procedural click sound mapped from theme name or exact profile ID
 */
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
  } else if (theme === 'muted') {
    mappedProfile = 'muted';
  }

  soundEngine.playClick(mappedProfile);
}

/**
 * Plays high-precision synthesized UI status chimes (Start, Stop, Toggle, Notify)
 * Uses the shared SoundEngine AudioContext to avoid hitting browser context limits.
 */
export function playUiChime(type: 'start' | 'stop' | 'toggle' | 'notify') {
  try {
    const audioCtx = soundEngine.getAudioContext();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    if (type === 'start') {
      // Uplifting ascending cyber chime (C5 -> C6)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.stop(now + 0.20);
    } else if (type === 'stop') {
      // Descending power down cyber chime (A5 -> E4)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.15);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
      osc.stop(now + 0.22);
    } else if (type === 'notify') {
      // Harmonic dual-tier notification chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.setValueAtTime(987.77, now + 0.08);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.stop(now + 0.24);
    } else {
      // Subtle toggle blip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.stop(now + 0.06);
    }

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);

    // Explicit cleanup
    setTimeout(() => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    }, 280);
  } catch (e) {
    // Audio context error fallback
  }
}
