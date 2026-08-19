/**
 * HyperClick Pro 2026 - Comprehensive Automation & Sequence Types
 * Definitions for Clicker, Multi-Point Waypoints, Macros, Telemetry, and Hand Ergonomics
 */

export type MouseButton = 'left' | 'right' | 'middle' | 'mouse4' | 'mouse5';

export type ClickType = 'single' | 'double' | 'triple' | 'hold' | 'burst';

export type ClickLocationMode = 'cursor' | 'static' | 'waypoint' | 'area_random';

export type ClickRepeatMode = 'infinite' | 'count' | 'duration';

export type HumanizerAlgorithm = 
  | 'gaussian'
  | 'perlin_noise'
  | 'human_fatigue'
  | 'jitter_micro'
  | 'bimodal_reaction';

export type SoundTheme = 
  | 'mechanical_blue'
  | 'cherry_mx_brown'
  | 'cyber_beep'
  | 'bubble_pop'
  | 'laser'
  | 'subtle_tick'
  | 'muted';

export type ProfileCategory = 
  | 'gaming'
  | 'productivity'
  | 'accessibility'
  | 'custom'
  | 'idle_games'
  | 'qa_testing'
  | 'automation';

export type WaypointActionType = 
  | 'click'
  | 'double_click'
  | 'right_click'
  | 'middle_click'
  | 'move_only'
  | 'drag_to'
  | 'key_press'
  | 'wait'
  | 'wheel_scroll';

export type SequenceTraversalMode = 
  | 'ordered'
  | 'randomized'
  | 'ping_pong'
  | 'reverse';

export type MacroExecutionState = 
  | 'idle'
  | 'running'
  | 'paused'
  | 'stopped'
  | 'stepping'
  | 'recording';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface BezierControlPoints {
  cp1: Point2D;
  cp2: Point2D;
}

export interface Waypoint {
  id: string;
  name: string;
  x: number;
  y: number;
  actionType: WaypointActionType;
  clickType: ClickType;
  mouseButton: MouseButton;
  delayBeforeMs: number;
  delayAfterMs: number;
  jitterRadius: number;
  holdDurationMs: number;
  loopRepeat: number;
  enabled: boolean;
  targetX?: number; // Used for drag_to
  targetY?: number; // Used for drag_to
  key?: string; // Used for key_press
  scrollAmount?: number; // Used for wheel_scroll
  note?: string;
  speedMultiplier?: number;
}

export interface MacroAction {
  id: string;
  type: 
    | 'mouse_down'
    | 'mouse_up'
    | 'click'
    | 'move'
    | 'key_down'
    | 'key_up'
    | 'wait'
    | 'scroll';
  timestamp: number;
  relativeTimeMs: number;
  x?: number;
  y?: number;
  button?: MouseButton;
  key?: string;
  keyCode?: number;
  deltaX?: number;
  deltaY?: number;
}

export interface MacroSequence {
  id: string;
  name: string;
  description: string;
  waypoints: Waypoint[];
  loopCount: number; // 0 for infinite loops
  traversalMode: SequenceTraversalMode;
  humanizePaths: boolean;
  speedMultiplier: number;
  bezierSmoothness: number; // 0.0 (straight) to 1.0 (smooth curved paths)
  recordedActions?: MacroAction[];
  totalDurationEstimatedMs: number;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  hotkey?: string;
}

export interface HumanizerConfig {
  enabled: boolean;
  algorithm: HumanizerAlgorithm;
  variancePercent: number; // 0 to 100%
  minIntervalMs: number;
  maxIntervalMs: number;
  fatigueRampMinutes: number; // Gradual slowdown over minutes to mimic fatigue
  microPauseFrequency: number; // 0 to 1 probability (e.g. 0.05 = 5% chance of pause)
  microPauseDurationMs: number; // Average duration of micro pause
  overshootCorrection: boolean; // Simulates human mouse overshoot and correction
  jitterRadiusPx: number;
}

export interface SoundConfig {
  enabled: boolean;
  soundTheme: SoundTheme;
  volume: number; // 0 to 1
  pitchVariance: number; // 0 to 0.5 for realistic variation
  soundOnDownOnly: boolean;
}

export interface HotkeyConfig {
  toggleClicker: string;
  toggleMacro: string;
  recordMacro: string;
  emergencyStop: string;
  pickCoordinate: string;
  stepMacro: string;
  nextProfile: string;
  prevProfile: string;
}

export interface ClickerConfig {
  id: string;
  mode: 'cps' | 'interval' | 'burst' | 'hold' | 'sequence';
  cps: number;
  intervalMs: number;
  clickType: ClickType;
  mouseButton: MouseButton;
  clickLocationMode: ClickLocationMode;
  staticCoordinates: Point2D;
  areaBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  repeatMode: ClickRepeatMode;
  repeatCount: number;
  repeatDurationSec: number;
  holdDurationMs: number;
  burstCount: number;
  burstIntervalMs: number;
  humanizer: HumanizerConfig;
  sound: SoundConfig;
  hotkeys: HotkeyConfig;
  activeProfileId: string;
}

export interface TelemetryStats {
  totalClicks: number;
  sessionClicks: number;
  currentCps: number;
  peakCps: number;
  averageCps: number;
  activeTimeMs: number;
  lastClickTimestamp: number;
  waypointsCompleted: number;
  macroLoopsCompleted: number;
  errorCount: number;
  clickHistory: { timestamp: number; cps: number }[];
}

export interface ProfilePreset {
  id: string;
  name: string;
  description: string;
  category: ProfileCategory;
  config: Partial<ClickerConfig>;
  macroSequence?: MacroSequence;
  hotkey?: string;
  icon?: string;
  isDefault?: boolean;
}

// ----------------------------------------------------
// Default Generators and Factory Helpers
// ----------------------------------------------------

export function createDefaultHumanizerConfig(): HumanizerConfig {
  return {
    enabled: true,
    algorithm: 'gaussian',
    variancePercent: 15,
    minIntervalMs: 20,
    maxIntervalMs: 120,
    fatigueRampMinutes: 20,
    microPauseFrequency: 0.02,
    microPauseDurationMs: 250,
    overshootCorrection: true,
    jitterRadiusPx: 2,
  };
}

export function createDefaultSoundConfig(): SoundConfig {
  return {
    enabled: true,
    soundTheme: 'cherry_mx_brown',
    volume: 0.45,
    pitchVariance: 0.10,
    soundOnDownOnly: true,
  };
}

export function createDefaultHotkeyConfig(): HotkeyConfig {
  return {
    toggleClicker: 'F6',
    toggleMacro: 'F7',
    recordMacro: 'Ctrl+Shift+R',
    emergencyStop: 'F12',
    pickCoordinate: 'F9',
    stepMacro: 'F11',
    nextProfile: 'Ctrl+PageDown',
    prevProfile: 'Ctrl+PageUp',
  };
}

export function createDefaultWaypoint(index: number = 1, x: number = 960, y: number = 540): Waypoint {
  return {
    id: `wp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: `Waypoint ${index}`,
    x,
    y,
    actionType: 'click',
    clickType: 'single',
    mouseButton: 'left',
    delayBeforeMs: 100,
    delayAfterMs: 200,
    jitterRadius: 2,
    holdDurationMs: 35,
    loopRepeat: 1,
    enabled: true,
    note: '',
    speedMultiplier: 1.0,
  };
}

export function createDefaultMacroSequence(): MacroSequence {
  return {
    id: `seq_${Date.now()}`,
    name: 'Spreadsheet Row Iterator',
    description: 'Automated data entry pattern: click cell, move, and advance with steady pace',
    waypoints: [
      {
        id: 'wp_1',
        name: 'Target Cell Alpha',
        x: 450,
        y: 350,
        actionType: 'click',
        clickType: 'single',
        mouseButton: 'left',
        delayBeforeMs: 100,
        delayAfterMs: 300,
        jitterRadius: 1,
        holdDurationMs: 40,
        loopRepeat: 1,
        enabled: true,
        note: 'First data cell',
      },
      {
        id: 'wp_2',
        name: 'Next Input Field',
        x: 720,
        y: 350,
        actionType: 'click',
        clickType: 'single',
        mouseButton: 'left',
        delayBeforeMs: 150,
        delayAfterMs: 250,
        jitterRadius: 1,
        holdDurationMs: 35,
        loopRepeat: 1,
        enabled: true,
        note: 'Second input column',
      },
      {
        id: 'wp_3',
        name: 'Submit / Save Button',
        x: 960,
        y: 650,
        actionType: 'click',
        clickType: 'single',
        mouseButton: 'left',
        delayBeforeMs: 200,
        delayAfterMs: 500,
        jitterRadius: 1,
        holdDurationMs: 30,
        loopRepeat: 1,
        enabled: true,
        note: 'Confirm batch record',
      },
    ],
    loopCount: 0, // infinite
    traversalMode: 'ordered',
    humanizePaths: true,
    speedMultiplier: 1.0,
    bezierSmoothness: 0.65,
    totalDurationEstimatedMs: 1540,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['Productivity', 'Data Entry'],
    hotkey: 'F7',
  };
}

export function createDefaultTelemetryStats(): TelemetryStats {
  return {
    totalClicks: 0,
    sessionClicks: 0,
    currentCps: 0,
    peakCps: 0,
    averageCps: 0,
    activeTimeMs: 0,
    lastClickTimestamp: 0,
    waypointsCompleted: 0,
    macroLoopsCompleted: 0,
    errorCount: 0,
    clickHistory: [],
  };
}

export function createDefaultClickerConfig(): ClickerConfig {
  return {
    id: 'cfg_default',
    mode: 'cps',
    cps: 20,
    intervalMs: 50,
    clickType: 'single',
    mouseButton: 'left',
    clickLocationMode: 'cursor',
    staticCoordinates: { x: 960, y: 540 },
    repeatMode: 'infinite',
    repeatCount: 100,
    repeatDurationSec: 60,
    holdDurationMs: 30,
    burstCount: 5,
    burstIntervalMs: 50,
    humanizer: createDefaultHumanizerConfig(),
    sound: createDefaultSoundConfig(),
    hotkeys: createDefaultHotkeyConfig(),
    activeProfileId: 'prof_accessibility_assist',
  };
}

export const BUILT_IN_PROFILES: ProfilePreset[] = [
  {
    id: 'prof_accessibility_assist',
    name: 'Accessibility Steady Assist',
    description: 'Gentle 4 CPS ergonomic clicking assistance for users with repetitive strain injury (RSI) or motor fatigue.',
    category: 'accessibility',
    config: {
      mode: 'cps',
      cps: 4,
      clickType: 'single',
      mouseButton: 'left',
      repeatMode: 'infinite',
    },
    hotkey: 'F6',
    isDefault: true,
  },
  {
    id: 'prof_idle_clicker',
    name: 'Idle & Incremental Games',
    description: 'Smooth 35 CPS continuous clicking for Cookie Clicker and incremental desktop management games.',
    category: 'idle_games',
    config: {
      mode: 'cps',
      cps: 35,
      clickType: 'single',
      mouseButton: 'left',
      repeatMode: 'infinite',
    },
    hotkey: 'F7',
  },
  {
    id: 'prof_qa_stress_test',
    name: 'QA Software Stress Benchmark',
    description: 'High-speed 200 CPS rapid event dispatcher for testing web app button throttling and UI durability.',
    category: 'qa_testing',
    config: {
      mode: 'cps',
      cps: 200,
      clickType: 'single',
      mouseButton: 'left',
      repeatMode: 'count',
      repeatCount: 1000,
    },
    hotkey: 'F8',
  },
  {
    id: 'prof_spreadsheet_auto',
    name: 'Spreadsheet & Form Automation',
    description: 'Multi-node sequential workflow for navigating form fields, data tables, and batch entry grids.',
    category: 'productivity',
    config: {
      mode: 'sequence',
      cps: 10,
    },
    macroSequence: {
      id: 'seq_data_grid',
      name: 'Data Table Entry Loop',
      description: 'Tabulate and advance table rows',
      waypoints: [
        {
          id: 'wp_cell_1',
          name: 'Primary Cell Focus',
          x: 500,
          y: 400,
          actionType: 'click',
          clickType: 'single',
          mouseButton: 'left',
          delayBeforeMs: 120,
          delayAfterMs: 250,
          jitterRadius: 1,
          holdDurationMs: 40,
          loopRepeat: 1,
          enabled: true,
          note: 'Select first table cell',
        },
        {
          id: 'wp_cell_2',
          name: 'Next Column Field',
          x: 750,
          y: 400,
          actionType: 'click',
          clickType: 'single',
          mouseButton: 'left',
          delayBeforeMs: 150,
          delayAfterMs: 300,
          jitterRadius: 1,
          holdDurationMs: 35,
          loopRepeat: 1,
          enabled: true,
          note: 'Confirm value',
        },
      ],
      loopCount: 25,
      traversalMode: 'ordered',
      humanizePaths: true,
      speedMultiplier: 1.0,
      bezierSmoothness: 0.7,
      totalDurationEstimatedMs: 850,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      tags: ['Productivity', 'Automation'],
    },
  },
];

/**
 * Validates and sanitizes raw untrusted imported JSON into a compliant MacroSequence
 */
export function validateAndSanitizeMacroSequence(raw: unknown): { isValid: boolean; sequence: MacroSequence; errors: string[] } {
  const errors: string[] = [];
  const fallback = createDefaultMacroSequence();

  if (!raw || typeof raw !== 'object') {
    return { isValid: false, sequence: fallback, errors: ['Input is not a valid JSON object.'] };
  }

  const obj = raw as Record<string, unknown>;

  const id = typeof obj.id === 'string' && obj.id.trim() ? obj.id : `seq_${Date.now()}`;
  const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.slice(0, 100) : 'Imported Sequence';
  const description = typeof obj.description === 'string' ? obj.description.slice(0, 500) : 'Imported Macro Sequence';

  const validTraversalModes: SequenceTraversalMode[] = ['ordered', 'randomized', 'ping_pong', 'reverse'];
  const traversalMode: SequenceTraversalMode = validTraversalModes.includes(obj.traversalMode as SequenceTraversalMode)
    ? (obj.traversalMode as SequenceTraversalMode)
    : 'ordered';

  const loopCount = typeof obj.loopCount === 'number' && Number.isFinite(obj.loopCount)
    ? Math.max(0, Math.min(999999, Math.round(obj.loopCount)))
    : 0;

  const speedMultiplier = typeof obj.speedMultiplier === 'number' && Number.isFinite(obj.speedMultiplier)
    ? Math.max(0.1, Math.min(10.0, obj.speedMultiplier))
    : 1.0;

  const bezierSmoothness = typeof obj.bezierSmoothness === 'number' && Number.isFinite(obj.bezierSmoothness)
    ? Math.max(0.0, Math.min(1.0, obj.bezierSmoothness))
    : 0.65;

  const humanizePaths = typeof obj.humanizePaths === 'boolean' ? obj.humanizePaths : true;

  // Sanitize waypoints
  const validActionTypes: WaypointActionType[] = [
    'click',
    'double_click',
    'right_click',
    'middle_click',
    'move_only',
    'drag_to',
    'key_press',
    'wait',
    'wheel_scroll',
  ];

  const validButtons: MouseButton[] = ['left', 'right', 'middle', 'mouse4', 'mouse5'];
  const validClickTypes: ClickType[] = ['single', 'double', 'triple', 'hold', 'burst'];

  let sanitizedWaypoints: Waypoint[] = [];

  if (Array.isArray(obj.waypoints) && obj.waypoints.length > 0) {
    sanitizedWaypoints = obj.waypoints.map((w: unknown, idx: number) => {
      const item = (w && typeof w === 'object' ? w : {}) as Record<string, unknown>;

      const wpId = typeof item.id === 'string' && item.id.trim() ? item.id : `wp_${Date.now()}_${idx + 1}`;
      const wpName = typeof item.name === 'string' && item.name.trim() ? item.name : `Waypoint ${idx + 1}`;

      const x = typeof item.x === 'number' && Number.isFinite(item.x) ? Math.max(0, Math.min(7680, Math.round(item.x))) : 960;
      const y = typeof item.y === 'number' && Number.isFinite(item.y) ? Math.max(0, Math.min(4320, Math.round(item.y))) : 540;

      const actionType: WaypointActionType = validActionTypes.includes(item.actionType as WaypointActionType)
        ? (item.actionType as WaypointActionType)
        : 'click';

      const mouseButton: MouseButton = validButtons.includes(item.mouseButton as MouseButton)
        ? (item.mouseButton as MouseButton)
        : 'left';

      const clickType: ClickType = validClickTypes.includes(item.clickType as ClickType)
        ? (item.clickType as ClickType)
        : 'single';

      const delayBeforeMs = typeof item.delayBeforeMs === 'number' && Number.isFinite(item.delayBeforeMs)
        ? Math.max(0, Math.min(60000, Math.round(item.delayBeforeMs)))
        : 100;

      const delayAfterMs = typeof item.delayAfterMs === 'number' && Number.isFinite(item.delayAfterMs)
        ? Math.max(0, Math.min(60000, Math.round(item.delayAfterMs)))
        : 200;

      const jitterRadius = typeof item.jitterRadius === 'number' && Number.isFinite(item.jitterRadius)
        ? Math.max(0, Math.min(100, Math.round(item.jitterRadius)))
        : 2;

      const holdDurationMs = typeof item.holdDurationMs === 'number' && Number.isFinite(item.holdDurationMs)
        ? Math.max(1, Math.min(10000, Math.round(item.holdDurationMs)))
        : 35;

      const loopRepeat = typeof item.loopRepeat === 'number' && Number.isFinite(item.loopRepeat)
        ? Math.max(1, Math.min(1000, Math.round(item.loopRepeat)))
        : 1;

      const enabled = typeof item.enabled === 'boolean' ? item.enabled : true;

      const sanitizedWp: Waypoint = {
        id: wpId,
        name: wpName,
        x,
        y,
        actionType,
        clickType,
        mouseButton,
        delayBeforeMs,
        delayAfterMs,
        jitterRadius,
        holdDurationMs,
        loopRepeat,
        enabled,
      };

      if (typeof item.targetX === 'number' && Number.isFinite(item.targetX)) {
        sanitizedWp.targetX = Math.max(0, Math.min(7680, Math.round(item.targetX)));
      }
      if (typeof item.targetY === 'number' && Number.isFinite(item.targetY)) {
        sanitizedWp.targetY = Math.max(0, Math.min(4320, Math.round(item.targetY)));
      }
      if (typeof item.key === 'string') {
        sanitizedWp.key = item.key.slice(0, 20);
      }
      if (typeof item.note === 'string') {
        sanitizedWp.note = item.note.slice(0, 200);
      }

      return sanitizedWp;
    });
  } else {
    errors.push('No valid waypoints array found. Default waypoints applied.');
    sanitizedWaypoints = fallback.waypoints;
  }

  const sanitizedSequence: MacroSequence = {
    id,
    name,
    description,
    waypoints: sanitizedWaypoints,
    loopCount,
    traversalMode,
    humanizePaths,
    speedMultiplier,
    bezierSmoothness,
    totalDurationEstimatedMs: 0,
    createdAt: typeof obj.createdAt === 'number' ? obj.createdAt : Date.now(),
    updatedAt: Date.now(),
    tags: Array.isArray(obj.tags) ? obj.tags.filter((t): t is string => typeof t === 'string').slice(0, 10) : ['Imported'],
    hotkey: typeof obj.hotkey === 'string' ? obj.hotkey : undefined,
  };

  return {
    isValid: errors.length === 0,
    sequence: sanitizedSequence,
    errors,
  };
}

