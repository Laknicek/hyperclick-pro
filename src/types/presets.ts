/**
 * HyperClick Pro 2026 - Preset & Profile Engine Type Definitions
 */

export type ClickButton = 'left' | 'right' | 'middle' | 'mouse4' | 'mouse5';

export type PresetClickType = 'single' | 'double' | 'triple' | 'hold' | 'burst' | 'sequence';

export type PresetTriggerMode = 'toggle' | 'hold' | 'repeat_n_times' | 'duration_timer';

export type PresetCategory = 'gaming' | 'productivity' | 'afk' | 'stealth' | 'testing' | 'custom';

export type HumanizerAlgorithmType = 
  | 'off'
  | 'gaussian'
  | 'uniform'
  | 'fatigue'
  | 'jitter_god'
  | 'butterfly'
  | 'bimodal'
  | 'stealth_human';

export interface PresetHumanizerConfig {
  enabled: boolean;
  algorithm: HumanizerAlgorithmType;
  jitterMs: number;              // Standard deviation or jitter bounds in milliseconds
  minIntervalMs?: number;        // Clamp absolute minimum interval
  maxIntervalMs?: number;        // Clamp absolute maximum interval
  fatigueFactor: number;         // 0.0 - 1.0 (drift rate over long continuous clicking)
  microPauses: boolean;          // Random momentary hesitation (50ms - 250ms)
  microPauseProbability: number; // 0.01 - 0.20
  microPauseMinMs: number;
  microPauseMaxMs: number;
  cursorJitter: boolean;         // Micro cursor displacement (pixel variance)
  cursorJitterRadiusPx: number;  // Radius in pixels for micro-nudge
  bimodalSpreadRatio?: number;   // For butterfly click 2-finger asymmetry (e.g., 0.35)
}

export interface PresetBurstConfig {
  enabled: boolean;
  clicksPerBurst: number;
  burstCps: number;
  cooldownMs: number;
  randomizeBurstCount?: boolean;
}

export interface PresetLocationAction {
  x: number;
  y: number;
  relative?: boolean;
  delayAfterMs?: number;
  label?: string;
}

export interface PresetSequenceStep {
  id: string;
  type: 'click' | 'key' | 'delay' | 'move' | 'scroll';
  button?: ClickButton;
  key?: string;
  delayMs?: number;
  x?: number;
  y?: number;
  scrollAmount?: number;
  comment?: string;
}

export interface PresetLocationConfig {
  mode: 'current_cursor' | 'fixed_point' | 'multi_point' | 'random_area';
  fixedCoords: { x: number; y: number };
  multiPoints: PresetLocationAction[];
  randomArea: { x1: number; y1: number; x2: number; y2: number };
  restoreCursorPositionAfterClick?: boolean;
}

export interface PresetAntiDetectionConfig {
  enabled: boolean;
  noiseInjection: boolean;
  entropyMultiplier: number;
  blockBlacklistedWindows: boolean;
  simulatedHardwareEvents: boolean;
}

export interface PresetProfile {
  id: string;
  name: string;
  category: PresetCategory;
  description: string;
  icon: string;                  // Lucide icon identifier
  tags: string[];
  cps: number;
  targetCpsRange?: [number, number];
  intervalMs: number;
  intervalRangeMs?: [number, number];
  button: ClickButton;
  clickType: PresetClickType;
  triggerMode: PresetTriggerMode;
  repeatCount?: number;          // If triggerMode === 'repeat_n_times'
  durationSeconds?: number;      // If triggerMode === 'duration_timer'
  hotkey: string;
  burst: PresetBurstConfig;
  humanizer: PresetHumanizerConfig;
  location: PresetLocationConfig;
  sequence?: PresetSequenceStep[];
  antiDetection: PresetAntiDetectionConfig;
  isBuiltIn: boolean;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  author?: string;
  version: string;
}

export type ThemeAccentColor = 'cyan' | 'purple' | 'emerald' | 'rose' | 'amber' | 'blue';

export type PresetSoundPackType = 
  | 'mechanical-blue'
  | 'mechanical-brown'
  | 'soft-membrane'
  | 'bubble-pop'
  | 'futuristic-laser'
  | 'subtle-tick'
  | 'off';

export interface PresetSoundSettings {
  enabled: boolean;
  soundPack: PresetSoundPackType;
  volume: number; // 0 - 100
  audioFeedbackOnToggle: boolean;
  frequencyPitchVariance: boolean;
}

export interface PresetSystemSettings {
  autoStartWithWindows: boolean;
  minimizeToTray: boolean;
  closeToTray: boolean;
  alwaysOnTop: boolean;
  runAsAdmin: boolean;
  hardwareAcceleration: boolean;
  showNotificationOnStart: boolean;
}

export interface PresetOverlaySettings {
  enabled: boolean;
  showCpsCounter: boolean;
  showClickRipples: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity: number; // 20 - 100
  scale: number; // 50 - 150
}

export interface PresetGlobalHotkeys {
  startStop: string;
  toggleBurst: string;
  recordMacro: string;
  pickCoordinates: string;
  panicKillswitch: string;
  nextProfile: string;
  previousProfile: string;
}

export interface PresetPerformanceSettings {
  highPrecisionTimer: boolean;
  targetPollRateHz: number;
  processPriority: 'normal' | 'high' | 'realtime';
  enableRawInputBypass: boolean;
}

export interface GlobalAppSettings {
  theme: ThemeAccentColor;
  glassmorphism: boolean;
  activeProfileId: string;
  defaultProfileId: string;
  sound: PresetSoundSettings;
  system: PresetSystemSettings;
  overlay: PresetOverlaySettings;
  hotkeys: PresetGlobalHotkeys;
  performance: PresetPerformanceSettings;
  version: string;
  lastUpdated: string;
}

export interface ProfileExportBundle {
  format: 'hyperclick-pro-profile-bundle';
  schemaVersion: '1.0.0';
  exportedAt: string;
  profiles: PresetProfile[];
  appSettings?: Partial<GlobalAppSettings>;
  checksum?: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
  level: 'error' | 'warning';
}

export interface PresetValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}
