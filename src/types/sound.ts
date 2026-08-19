/**
 * Sound Engine Types and Profiles for HyperClick Pro 2026
 */

export type SoundProfileId = 
  | 'cherry-mx-blue'
  | 'kailh-box-white'
  | 'cyber-laser'
  | 'bubble-pop'
  | 'retro-arcade'
  | 'tech-pulse'
  | 'muted';

export interface SoundProfile {
  id: SoundProfileId;
  name: string;
  category: 'mechanical' | 'scifi' | 'organic' | 'arcade' | 'minimal' | 'none';
  description: string;
  badge: string;
  primaryFrequency: string;
  tags: string[];
  color: string;
  glowColor: string;
}

export interface SoundEngineConfig {
  profile: SoundProfileId;
  masterVolume: number; // 0.0 to 1.0
  muted: boolean;
  pitchModulation: number; // 0.0 to 1.0 (amount of random pitch variation)
  humanizeClicks: boolean;
  maxPolyphony: number;
}

export interface SoundVisualizerState {
  volumeLevel: number; // 0.0 to 1.0 for VU meter
  isPlaying: boolean;
}
