/**
 * HyperClick Pro 2026 - Electron API Type Definitions
 * Complete TypeScript interfaces for IPC bridge, clicking engine, humanizer, and window controls.
 */

export type ClickType = 'left' | 'right' | 'middle' | 'double' | 'triple' | 'burst' | 'hold';

export type RepeatMode = 'infinite' | 'count' | 'timer';

export type LocationMode = 'current' | 'fixed' | 'waypoints' | 'area';

export type WaypointLoopMode = 'sequential' | 'random' | 'pingpong';

export type JitterDistribution = 'gaussian' | 'uniform' | 'perlin';

export type SoundTheme = 'mech_blue' | 'mech_brown' | 'cyber_click' | 'laser' | 'subtle_tick' | 'bubble';

export type AppTheme = 'cyberpunk' | 'matrix' | 'dracula' | 'synthwave' | 'nord' | 'pure_dark';

export interface ClickWaypoint {
  id: string;
  name?: string;
  x: number;
  y: number;
  action: ClickType;
  clicksCount: number;
  delayAfterMs: number;
  holdDurationMs?: number;
  randomOffsetRadius?: number;
  smoothMove?: boolean;
  colorHex?: string;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface TrajectoryPoint extends Point2D {
  delayMs: number;
}

export interface AreaBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HumanizerConfig {
  enabled: boolean;
  jitterRadius: number; // Max pixel offset standard deviation
  timingVariancePercent: number; // e.g. 15 for +/- 15% interval variance
  fatigueEnabled: boolean; // Simulates human hand fatigue over prolonged clicking
  fatigueFactor: number; // Rate of fatigue (0.0 to 1.0)
  microBreaks: boolean; // Occasional natural pauses (50ms - 250ms)
  microBreakIntervalSec: number; // Frequency in seconds (e.g. every 15-45s)
  bezierMovement: boolean; // Use natural human Bezier curve mouse paths
  movementSpeed: number; // Speed multiplier for Bezier movements (1 to 10)
  distribution: JitterDistribution; // Algorithm for random deviations
}

export interface BurstConfig {
  burstSize: number; // Number of rapid clicks per burst (e.g. 3-8)
  burstDelayMs: number; // Interval between successive bursts (e.g. 150-500ms)
  intraBurstIntervalMs: number; // Ultra-fast interval between clicks within the burst (e.g. 10-30ms)
}

export interface HoldConfig {
  durationMs: number; // Duration to hold mouse button down before releasing
}

export interface ClickConfig {
  clickType: ClickType;
  cps: number; // Target clicks per second (1 to 10,000+)
  clickIntervalMs: number; // Derived or explicit interval in ms (e.g. 100ms for 10 CPS)
  repeatMode: RepeatMode;
  repeatCount: number; // For repeatMode === 'count'
  repeatDurationMs: number; // For repeatMode === 'timer'
  locationMode: LocationMode;
  fixedX: number;
  fixedY: number;
  area?: AreaBounds;
  waypoints: ClickWaypoint[];
  waypointLoopMode: WaypointLoopMode;
  waypointRepeatCount: number; // 0 for infinite loop
  humanizer: HumanizerConfig;
  burstConfig?: BurstConfig;
  holdConfig?: HoldConfig;
  audioFeedback: boolean;
  soundTheme: SoundTheme;
  soundVolume: number; // 0 to 100
}

export interface EngineStatus {
  isRunning: boolean;
  clicksPerformed: number;
  cpsActual: number;
  currentWaypointIndex: number;
  elapsedMs: number;
  remainingMs: number | null;
  remainingClicks: number | null;
  lastClickPos: { x: number; y: number } | null;
  activeProfileName?: string;
  fatigueCurrentFactor?: number;
}

export interface CoordinateResult {
  x: number;
  y: number;
  colorHex?: string;
  canceled?: boolean;
}

export interface AppHotkeys {
  toggleClicker: string; // e.g. 'F6'
  pickCoordinates: string; // e.g. 'F7'
  toggleMiniHud: string; // e.g. 'F8'
  toggleOverlay: string; // e.g. 'F9'
  emergencyStop: string; // e.g. 'Escape' or 'F10'
}

export interface ClickProfile {
  id: string;
  name: string;
  description?: string;
  created: number;
  config: ClickConfig;
}

export interface AppSettings {
  hotkeys: AppHotkeys;
  alwaysOnTop: boolean;
  soundEnabled: boolean;
  soundTheme: SoundTheme;
  soundVolume: number;
  theme: AppTheme;
  glassmorphism: boolean;
  startMinimized: boolean;
  notificationOnComplete: boolean;
  savedProfiles: ClickProfile[];
  hardwareAcceleration: boolean;
}

export interface DisplayInfo {
  id: number;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  isPrimary: boolean;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  electronVersion: string;
  chromeVersion: string;
  displays: DisplayInfo[];
}

export interface IElectronAPI {
  // Clicker Engine
  startClicker: (config: ClickConfig) => Promise<{ success: boolean; error?: string }>;
  stopClicker: () => Promise<{ success: boolean }>;
  getStatus: () => Promise<EngineStatus>;

  // Coordinates & Waypoints
  pickCoordinates: () => Promise<CoordinateResult>;
  cancelCoordinatePicker: () => Promise<void>;
  updateWaypoints: (waypoints: ClickWaypoint[]) => Promise<void>;

  // Window & Overlays
  toggleOverlay: (show?: boolean) => Promise<boolean>;
  toggleMiniHud: (show?: boolean) => Promise<boolean>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  windowDrag: (deltaX: number, deltaY: number) => Promise<void>;

  // Settings & System
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<boolean>;
  getSystemInfo: () => Promise<SystemInfo>;
  getVersion: () => Promise<string>;
  checkUpdate: () => Promise<{ hasUpdate: boolean; latestVersion?: string; releaseNotes?: string }>;
  openExternal: (url: string) => Promise<void>;

  // Sound Feedback
  playClickSound: (theme?: SoundTheme) => Promise<void>;
  playSound?: (theme: string, volume: number) => void;
  playBeepAlert?: () => void;

  // Pixel Detection & Screen Simulation
  getPixelColor?: (params: { x: number; y: number }) => Promise<{ r: number; g: number; b: number; hex: string } | null>;
  scanPixelArea?: (params: { x: number; y: number; radius: number; targetRgb: { r: number; g: number; b: number }; tolerance: number }) => Promise<{ found: boolean; x: number; y: number; r: number; g: number; b: number; hex: string } | null>;
  simulateClick?: (params: { x: number; y: number; button: string; type: string; holdMs?: number }) => Promise<boolean>;
  simulateMouseMove?: (params: { x: number; y: number }) => Promise<void>;

  // Event Subscriptions
  onStatusUpdate: (callback: (status: EngineStatus) => void) => () => void;
  onHotkeyTriggered: (callback: (action: string) => void) => () => void;
  onCoordinatePicked: (callback: (coords: CoordinateResult) => void) => () => void;
  onOverlayStateChanged: (callback: (visible: boolean) => void) => () => void;
  onMiniHudStateChanged: (callback: (visible: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
