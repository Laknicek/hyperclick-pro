/**
 * HyperClick Pro 2026 - Comprehensive Automation & Sequence Types
 * Complete definitions for Clicker, Multi-Point Waypoints, Macros, Pixel Triggers, Telemetry, and Humanizer
 */

export type MouseButton = 'left' | 'right' | 'middle' | 'mouse4' | 'mouse5';

export type ClickType = 'single' | 'double' | 'triple' | 'hold' | 'burst';

export type ClickLocationMode = 'cursor' | 'static' | 'waypoint' | 'area_random' | 'smart_pixel';

export type ClickRepeatMode = 'infinite' | 'count' | 'duration' | 'until_pixel_match';

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
  | 'afk'
  | 'custom'
  | 'cookie_clicker'
  | 'fps'
  | 'mmo'
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
  | 'wheel_scroll'
  | 'pixel_check';

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

export type PixelTriggerCondition = 
  | 'color_matches'
  | 'color_differs'
  | 'color_brightness_greater'
  | 'color_brightness_less'
  | 'color_in_range';

export type PixelTriggerAction = 
  | 'click'
  | 'double_click'
  | 'right_click'
  | 'start_macro'
  | 'stop_all'
  | 'custom_sequence';

export type PixelClickCoordinateMode = 
  | 'at_pixel'
  | 'at_cursor'
  | 'at_fixed_point';

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
  colorCondition?: {
    expectedColorHex: string;
    tolerance: number;
    condition: PixelTriggerCondition;
  };
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
    | 'scroll'
    | 'pixel_check';
  timestamp: number;
  relativeTimeMs: number;
  x?: number;
  y?: number;
  button?: MouseButton;
  key?: string;
  keyCode?: number;
  deltaX?: number;
  deltaY?: number;
  expectedColor?: string;
  tolerance?: number;
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
  togglePixelTrigger: string;
  emergencyStop: string;
  pickCoordinate: string;
  pickPixelColor: string;
  stepMacro: string;
  nextProfile: string;
  prevProfile: string;
}

export interface PixelTriggerConfig {
  id: string;
  name: string;
  enabled: boolean;
  targetX: number;
  targetY: number;
  expectedColorHex: string;
  expectedColorRgb: RgbColor;
  tolerance: number; // 0 to 100
  checkIntervalMs: number; // Milliseconds between screen checks
  triggerAction: PixelTriggerAction;
  actionDelayMs: number;
  triggerCondition: PixelTriggerCondition;
  clickCoordinateMode: PixelClickCoordinateMode;
  clickX?: number;
  clickY?: number;
  maxTriggersPerMinute: number;
  cooldownMs: number;
  soundAlert: boolean;
  areaScanRadius?: number; // 0 for single pixel, >0 for N px radius search box
  macroSequenceId?: string;
}

export interface ClickerConfig {
  id: string;
  mode: 'cps' | 'interval' | 'burst' | 'hold' | 'sequence' | 'pixel_trigger';
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
  pixelTriggersFired: number;
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
  pixelTrigger?: PixelTriggerConfig;
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
    variancePercent: 18,
    minIntervalMs: 15,
    maxIntervalMs: 150,
    fatigueRampMinutes: 15,
    microPauseFrequency: 0.03,
    microPauseDurationMs: 350,
    overshootCorrection: true,
    jitterRadiusPx: 3,
  };
}

export function createDefaultSoundConfig(): SoundConfig {
  return {
    enabled: true,
    soundTheme: 'cherry_mx_brown',
    volume: 0.45,
    pitchVariance: 0.12,
    soundOnDownOnly: true,
  };
}

export function createDefaultHotkeyConfig(): HotkeyConfig {
  return {
    toggleClicker: 'F6',
    toggleMacro: 'F7',
    recordMacro: 'Ctrl+Shift+R',
    togglePixelTrigger: 'F8',
    emergencyStop: 'F12',
    pickCoordinate: 'F9',
    pickPixelColor: 'F10',
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
    name: 'Standard Sequence Alpha',
    description: 'Multi-target sequential precision pathing with humanized Bezier curves',
    waypoints: [
      {
        id: 'wp_1',
        name: 'Target Alpha',
        x: 450,
        y: 350,
        actionType: 'click',
        clickType: 'single',
        mouseButton: 'left',
        delayBeforeMs: 100,
        delayAfterMs: 300,
        jitterRadius: 2,
        holdDurationMs: 40,
        loopRepeat: 1,
        enabled: true,
        note: 'First interact point',
      },
      {
        id: 'wp_2',
        name: 'Inventory Slot 3',
        x: 720,
        y: 420,
        actionType: 'click',
        clickType: 'single',
        mouseButton: 'left',
        delayBeforeMs: 150,
        delayAfterMs: 250,
        jitterRadius: 3,
        holdDurationMs: 35,
        loopRepeat: 1,
        enabled: true,
        note: 'Select secondary tool',
      },
      {
        id: 'wp_3',
        name: 'Confirm Dialog Button',
        x: 960,
        y: 650,
        actionType: 'double_click',
        clickType: 'double',
        mouseButton: 'left',
        delayBeforeMs: 200,
        delayAfterMs: 500,
        jitterRadius: 2,
        holdDurationMs: 30,
        loopRepeat: 1,
        enabled: true,
        note: 'Execute action confirmation',
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
    tags: ['Standard', 'Productivity'],
    hotkey: 'F7',
  };
}

export function createDefaultPixelTriggerConfig(): PixelTriggerConfig {
  return {
    id: `pt_${Date.now()}`,
    name: 'Golden Target Detector',
    enabled: false,
    targetX: 960,
    targetY: 540,
    expectedColorHex: '#00F2FE',
    expectedColorRgb: { r: 0, g: 242, b: 254 },
    tolerance: 15,
    checkIntervalMs: 60,
    triggerAction: 'click',
    actionDelayMs: 25,
    triggerCondition: 'color_matches',
    clickCoordinateMode: 'at_pixel',
    maxTriggersPerMinute: 600,
    cooldownMs: 150,
    soundAlert: true,
    areaScanRadius: 4,
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
    pixelTriggersFired: 0,
    errorCount: 0,
    clickHistory: [],
  };
}

export function createDefaultClickerConfig(): ClickerConfig {
  return {
    id: 'cfg_default',
    mode: 'cps',
    cps: 25,
    intervalMs: 40,
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
    activeProfileId: 'prof_mmo_rotation',
  };
}

export const BUILT_IN_PROFILES: ProfilePreset[] = [
  {
    id: 'prof_mmo_rotation',
    name: 'MMO Skill & Target Cycle',
    description: 'Rotates through 4 target hotbars with realistic mouse path curves and randomized pauses.',
    category: 'mmo',
    config: {
      mode: 'sequence',
      cps: 12,
      mouseButton: 'left',
      clickLocationMode: 'waypoint',
    },
    macroSequence: {
      id: 'seq_mmo_rot',
      name: '4-Point Skill Cycle',
      description: 'Human-curved rotation sequence',
      waypoints: [
        {
          id: 'wp_mmo_1',
          name: 'Primary Skill (Q)',
          x: 750,
          y: 880,
          actionType: 'click',
          clickType: 'single',
          mouseButton: 'left',
          delayBeforeMs: 50,
          delayAfterMs: 450,
          jitterRadius: 3,
          holdDurationMs: 40,
          loopRepeat: 1,
          enabled: true,
          note: 'Primary DPS combo',
        },
        {
          id: 'wp_mmo_2',
          name: 'Secondary Skill (E)',
          x: 820,
          y: 880,
          actionType: 'click',
          clickType: 'single',
          mouseButton: 'left',
          delayBeforeMs: 80,
          delayAfterMs: 600,
          jitterRadius: 4,
          holdDurationMs: 45,
          loopRepeat: 1,
          enabled: true,
          note: 'Buff activation',
        },
        {
          id: 'wp_mmo_3',
          name: 'Ultimate Trigger (R)',
          x: 890,
          y: 880,
          actionType: 'click',
          clickType: 'single',
          mouseButton: 'left',
          delayBeforeMs: 120,
          delayAfterMs: 900,
          jitterRadius: 2,
          holdDurationMs: 50,
          loopRepeat: 1,
          enabled: true,
          note: 'Finisher burst',
        },
        {
          id: 'wp_mmo_4',
          name: 'Health Potion (1)',
          x: 680,
          y: 880,
          actionType: 'click',
          clickType: 'single',
          mouseButton: 'left',
          delayBeforeMs: 100,
          delayAfterMs: 300,
          jitterRadius: 3,
          holdDurationMs: 35,
          loopRepeat: 1,
          enabled: true,
          note: 'Safety sustain',
        },
      ],
      loopCount: 0,
      traversalMode: 'ordered',
      humanizePaths: true,
      speedMultiplier: 1.0,
      bezierSmoothness: 0.7,
      totalDurationEstimatedMs: 2545,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      tags: ['MMORPG', 'Skill Rotation'],
      hotkey: 'F7',
    },
    isDefault: true,
  },
  {
    id: 'prof_cookie_clicker',
    name: 'Cookie Clicker Golden Rush',
    description: 'Ultra-fast 85 CPS clicker linked with Pixel Detector to auto-hunt Golden Cookies anywhere on screen.',
    category: 'cookie_clicker',
    config: {
      mode: 'cps',
      cps: 85,
      clickType: 'single',
      mouseButton: 'left',
      repeatMode: 'infinite',
    },
    pixelTrigger: {
      id: 'pt_golden_cookie',
      name: 'Golden Shimmer Spotter',
      enabled: true,
      targetX: 960,
      targetY: 540,
      expectedColorHex: '#FFD700',
      expectedColorRgb: { r: 255, g: 215, b: 0 },
      tolerance: 20,
      checkIntervalMs: 80,
      triggerAction: 'click',
      actionDelayMs: 10,
      triggerCondition: 'color_matches',
      clickCoordinateMode: 'at_pixel',
      maxTriggersPerMinute: 300,
      cooldownMs: 500,
      soundAlert: true,
      areaScanRadius: 20,
    },
    hotkey: 'F6',
  },
  {
    id: 'prof_fps_trigger',
    name: 'FPS Fast-Tap & Trigger Bot',
    description: 'Pistol single-fire rapid macro and crosshair pixel color change trigger for instantaneous reaction times.',
    category: 'fps',
    config: {
      mode: 'burst',
      cps: 18,
      burstCount: 3,
      burstIntervalMs: 65,
      mouseButton: 'left',
      clickType: 'burst',
    },
    pixelTrigger: {
      id: 'pt_crosshair_red',
      name: 'Enemy Outline Detection',
      enabled: false,
      targetX: 960,
      targetY: 540,
      expectedColorHex: '#FF1133',
      expectedColorRgb: { r: 255, g: 17, b: 51 },
      tolerance: 18,
      checkIntervalMs: 16,
      triggerAction: 'click',
      actionDelayMs: 5,
      triggerCondition: 'color_matches',
      clickCoordinateMode: 'at_pixel',
      maxTriggersPerMinute: 1200,
      cooldownMs: 80,
      soundAlert: false,
      areaScanRadius: 2,
    },
    hotkey: 'F8',
  },
  {
    id: 'prof_afk_loot',
    name: 'AFK Mining & Auto-Crafter',
    description: 'Multi-node drag & drop sequence with drag-to inventory transfers and anti-cheat randomized jitter.',
    category: 'afk',
    config: {
      mode: 'sequence',
      cps: 15,
    },
    macroSequence: {
      id: 'seq_afk_crafter',
      name: 'Crafting Table Loop',
      description: 'Move ingredients into 3x3 crafting grid',
      waypoints: [
        {
          id: 'wp_craft_1',
          name: 'Material Stack 1',
          x: 600,
          y: 700,
          actionType: 'drag_to',
          clickType: 'single',
          mouseButton: 'left',
          delayBeforeMs: 150,
          delayAfterMs: 200,
          jitterRadius: 2,
          holdDurationMs: 60,
          loopRepeat: 1,
          enabled: true,
          targetX: 850,
          targetY: 450,
          note: 'Drag iron into slot 1',
        },
        {
          id: 'wp_craft_2',
          name: 'Craft Result Slot',
          x: 1100,
          y: 450,
          actionType: 'click',
          clickType: 'single',
          mouseButton: 'left',
          delayBeforeMs: 100,
          delayAfterMs: 300,
          jitterRadius: 2,
          holdDurationMs: 40,
          loopRepeat: 5,
          enabled: true,
          note: 'Collect finished items',
        },
      ],
      loopCount: 50,
      traversalMode: 'ordered',
      humanizePaths: true,
      speedMultiplier: 1.0,
      bezierSmoothness: 0.8,
      totalDurationEstimatedMs: 1800,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      tags: ['AFK', 'Crafting'],
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
    'pixel_check',
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

