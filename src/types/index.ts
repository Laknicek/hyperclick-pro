export type MouseButton = 'left' | 'right' | 'middle' | 'x1' | 'x2';
export type ClickType = 'single' | 'double' | 'triple' | 'hold' | 'burst';
export type RepeatMode = 'infinite' | 'count' | 'duration';
export type CursorMode = 'current' | 'fixed';
export type DistributionType = 'gaussian' | 'uniform' | 'natural';

export interface IntervalConfig {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  microseconds: number;
}

export interface FixedCoords {
  x: number;
  y: number;
}

export interface RandomCoordsConfig {
  enabled: boolean;
  radius: number;
}

export interface ClickConfig {
  interval: IntervalConfig;
  mouseButton: MouseButton;
  clickType: ClickType;
  burstCount: number;
  burstIntervalMs: number;
  repeatMode: RepeatMode;
  repeatCount: number;
  repeatDurationMs: number;
  cursorMode: CursorMode;
  fixedCoords: FixedCoords;
  randomCoords: RandomCoordsConfig;
  hotkey: string;
}

export interface HumanizerConfig {
  enabled: boolean;
  jitterRadius: number; // in pixels
  timingVariancePercent: number; // 0 to 50%
  distribution: DistributionType;
  bezierMovement: boolean;
  bezierCurvature: number; // 1 to 10
  fatigueSimulation: boolean;
  fatigueDecayRate: number; // 1 to 10
  humanReactionDelay: boolean;
  microPauses: boolean;
  microPauseChance: number; // % chance per 100 clicks
  minIntervalOffsetMs: number;
  maxIntervalOffsetMs: number;
}

export interface SequencePoint {
  id: string;
  name: string;
  x: number;
  y: number;
  button: MouseButton | 'double' | 'right-double';
  delayAfterMs: number;
  holdDurationMs: number;
  active: boolean;
  jitterRadius: number;
  comment?: string;
}

export interface SequenceConfig {
  points: SequencePoint[];
  loopMode: 'infinite' | 'count';
  loopCount: number;
  randomizeOrder: boolean;
  interPointDelayJitter: number;
}

export interface MacroAction {
  id: string;
  type: 'mouse-down' | 'mouse-up' | 'mouse-move' | 'key-down' | 'key-up' | 'delay';
  timestamp: number;
  button?: MouseButton;
  x?: number;
  y?: number;
  key?: string;
  delayMs?: number;
}

export interface MacroRecording {
  id: string;
  name: string;
  createdAt: number;
  durationMs: number;
  actions: MacroAction[];
  repeatCount: number;
  playbackSpeed: number;
}

export interface Preset {
  id: string;
  name: string;
  category: 'Gaming' | 'Productivity' | 'Automation' | 'Testing' | 'Custom';
  description: string;
  iconName: string;
  color: string;
  config: ClickConfig;
  humanizer: HumanizerConfig;
  sequence?: SequenceConfig;
  isBuiltIn?: boolean;
}

export interface TelemetryData {
  isRunning: boolean;
  currentCps: number;
  peakCps: number;
  totalClicks: number;
  sessionDuration: number; // seconds
  avgLatencyMs: number;
  cpuUsagePercent: number;
  accuracyRate: number;
  cpsHistory: number[]; // e.g. last 60 data points
  clickHistory: { x: number; y: number; time: number }[];
}

export type AppView = 'dashboard' | 'multipoint' | 'recorder' | 'presets' | 'analytics' | 'settings';

export type ThemeAccent = 'cyan' | 'purple' | 'emerald' | 'rose' | 'amber';

export interface AppSettings {
  accentColor: ThemeAccent;
  soundEffects: boolean;
  soundVolume: number; // 0 to 1
  audioTheme: 'mechanical' | 'laser' | 'subtle' | 'synth';
  alwaysOnTop: boolean;
  minimizeToTray: boolean;
  startMinimized: boolean;
  highPrecisionTimer: boolean;
  hotkeys: {
    startStop: string;
    pickLocation: string;
    recordMacro: string;
    panicStop: string;
    toggleMiniHud: string;
  };
  darkGlassOpacity: number; // 0.6 to 0.98
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

export * from './sound';
export * from './waypoint';
export * from './presets';

