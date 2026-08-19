import { PresetProfile, PresetCategory } from '../types/presets';

/**
 * HyperClick Pro 2026 - Master Built-in Preset Library
 * Precision-engineered profiles for high-level gaming, stealth anti-detection,
 * automation macros, and ultra-high-frequency stress testing.
 */

export const BUILTIN_PRESETS: PresetProfile[] = [
  {
    id: 'builtin-minecraft-jitter-god',
    name: 'Minecraft Jitter God',
    category: 'gaming',
    description: 'Emulates high-tier PvP jitter clicking with realistic forearm muscle vibration, Gaussian interval dispersion, and organic micro-fatigue curves.',
    icon: 'Flame',
    tags: ['Minecraft', 'PvP', 'Jitter Click', 'Gaussian Curve', 'Hypixel Ready'],
    cps: 18.5,
    targetCpsRange: [16, 20],
    intervalMs: 54,
    intervalRangeMs: [50, 62],
    button: 'left',
    clickType: 'single',
    triggerMode: 'toggle',
    hotkey: 'F6',
    burst: {
      enabled: false,
      clicksPerBurst: 1,
      burstCps: 18.5,
      cooldownMs: 0,
    },
    humanizer: {
      enabled: true,
      algorithm: 'jitter_god',
      jitterMs: 12,
      minIntervalMs: 44,
      maxIntervalMs: 76,
      fatigueFactor: 0.35,
      microPauses: true,
      microPauseProbability: 0.05,
      microPauseMinMs: 50,
      microPauseMaxMs: 130,
      cursorJitter: true,
      cursorJitterRadiusPx: 1.5,
      bimodalSpreadRatio: 0.2,
    },
    location: {
      mode: 'current_cursor',
      fixedCoords: { x: 0, y: 0 },
      multiPoints: [],
      randomArea: { x1: 0, y1: 0, x2: 0, y2: 0 },
    },
    antiDetection: {
      enabled: true,
      noiseInjection: true,
      entropyMultiplier: 1.4,
      blockBlacklistedWindows: false,
      simulatedHardwareEvents: true,
    },
    isBuiltIn: true,
    isFavorite: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    author: 'HyperClick Pro Team',
    version: '1.0.0',
  },
  {
    id: 'builtin-minecraft-butterfly',
    name: 'Minecraft Butterfly',
    category: 'gaming',
    description: 'Simulates dual-finger butterfly clicking with distinct bimodal index and middle finger cadence, producing high, consistent CPS bursts ideal for bridge placing and combos.',
    icon: 'Sparkles',
    tags: ['Minecraft', 'Butterfly Click', 'Bedwars', 'High CPS', 'Bimodal'],
    cps: 24.0,
    targetCpsRange: [22, 26],
    intervalMs: 41,
    intervalRangeMs: [38, 45],
    button: 'left',
    clickType: 'single',
    triggerMode: 'toggle',
    hotkey: 'F7',
    burst: {
      enabled: false,
      clicksPerBurst: 2,
      burstCps: 26,
      cooldownMs: 15,
    },
    humanizer: {
      enabled: true,
      algorithm: 'butterfly',
      jitterMs: 9,
      minIntervalMs: 34,
      maxIntervalMs: 56,
      fatigueFactor: 0.2,
      microPauses: true,
      microPauseProbability: 0.03,
      microPauseMinMs: 40,
      microPauseMaxMs: 90,
      cursorJitter: false,
      cursorJitterRadiusPx: 0.8,
      bimodalSpreadRatio: 0.42,
    },
    location: {
      mode: 'current_cursor',
      fixedCoords: { x: 0, y: 0 },
      multiPoints: [],
      randomArea: { x1: 0, y1: 0, x2: 0, y2: 0 },
    },
    antiDetection: {
      enabled: true,
      noiseInjection: true,
      entropyMultiplier: 1.25,
      blockBlacklistedWindows: false,
      simulatedHardwareEvents: true,
    },
    isBuiltIn: true,
    isFavorite: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    author: 'HyperClick Pro Team',
    version: '1.0.0',
  },
  {
    id: 'builtin-roblox-anti-afk',
    name: 'Roblox Anti-AFK Survivor',
    category: 'afk',
    description: 'Prevents 20-minute idle disconnects in Roblox and MMOs by performing randomized click actions, gentle micro-camera movements, and anti-idle inputs on a 45-90s cycle.',
    icon: 'ShieldCheck',
    tags: ['Roblox', 'Anti-AFK', 'Auto-Farm', 'Camera Nudge', 'Undetected'],
    cps: 0.02,
    targetCpsRange: [0.01, 0.03],
    intervalMs: 60000,
    intervalRangeMs: [45000, 90000],
    button: 'left',
    clickType: 'sequence',
    triggerMode: 'toggle',
    hotkey: 'F8',
    burst: {
      enabled: false,
      clicksPerBurst: 1,
      burstCps: 1,
      cooldownMs: 0,
    },
    humanizer: {
      enabled: true,
      algorithm: 'uniform',
      jitterMs: 15000,
      minIntervalMs: 40000,
      maxIntervalMs: 95000,
      fatigueFactor: 0.0,
      microPauses: false,
      microPauseProbability: 0,
      microPauseMinMs: 0,
      microPauseMaxMs: 0,
      cursorJitter: true,
      cursorJitterRadiusPx: 12,
    },
    location: {
      mode: 'current_cursor',
      fixedCoords: { x: 0, y: 0 },
      multiPoints: [],
      randomArea: { x1: -50, y1: -50, x2: 50, y2: 50 },
      restoreCursorPositionAfterClick: true,
    },
    sequence: [
      { id: 'seq-1', type: 'move', x: 15, y: -8, comment: 'Slight camera nudge' },
      { id: 'seq-2', type: 'delay', delayMs: 400, comment: 'Human hesitation delay' },
      { id: 'seq-3', type: 'click', button: 'right', delayMs: 120, comment: 'Camera anchor toggle' },
      { id: 'seq-4', type: 'key', key: 'Space', delayMs: 850, comment: 'Anti-AFK character hop' },
      { id: 'seq-5', type: 'move', x: -15, y: 8, comment: 'Restore camera trajectory' },
    ],
    antiDetection: {
      enabled: true,
      noiseInjection: true,
      entropyMultiplier: 2.0,
      blockBlacklistedWindows: false,
      simulatedHardwareEvents: true,
    },
    isBuiltIn: true,
    isFavorite: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    author: 'HyperClick Pro Team',
    version: '1.0.0',
  },
  {
    id: 'builtin-cookie-clicker-overclocked',
    name: 'Cookie Clicker Overclocked',
    category: 'gaming',
    description: 'Blazing 100 CPS continuous raw turbo for Cookie Clicker, clicker RPGs, and incremental idle engines. Zero jitter, strictly timed 10ms ticks.',
    icon: 'Zap',
    tags: ['Cookie Clicker', 'Idle Games', '100 CPS', 'Overclocked', 'Zero Lag'],
    cps: 100,
    targetCpsRange: [98, 100],
    intervalMs: 10,
    intervalRangeMs: [10, 10],
    button: 'left',
    clickType: 'single',
    triggerMode: 'toggle',
    hotkey: 'F9',
    burst: {
      enabled: false,
      clicksPerBurst: 1,
      burstCps: 100,
      cooldownMs: 0,
    },
    humanizer: {
      enabled: false,
      algorithm: 'off',
      jitterMs: 0,
      minIntervalMs: 10,
      maxIntervalMs: 10,
      fatigueFactor: 0,
      microPauses: false,
      microPauseProbability: 0,
      microPauseMinMs: 0,
      microPauseMaxMs: 0,
      cursorJitter: false,
      cursorJitterRadiusPx: 0,
    },
    location: {
      mode: 'current_cursor',
      fixedCoords: { x: 0, y: 0 },
      multiPoints: [],
      randomArea: { x1: 0, y1: 0, x2: 0, y2: 0 },
    },
    antiDetection: {
      enabled: false,
      noiseInjection: false,
      entropyMultiplier: 1.0,
      blockBlacklistedWindows: false,
      simulatedHardwareEvents: true,
    },
    isBuiltIn: true,
    isFavorite: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    author: 'HyperClick Pro Team',
    version: '1.0.0',
  },
  {
    id: 'builtin-fps-tactical-burst',
    name: 'FPS Tactical Burst',
    category: 'gaming',
    description: 'Precision 3-shot burst fire at 12 CPS with 200ms recoil reset cooldown, turning semi-automatic DMRs and pistols into deadly laser rifles.',
    icon: 'Crosshair',
    tags: ['FPS', 'CS2', 'Valorant', 'Tactical Burst', 'Recoil Control'],
    cps: 12,
    targetCpsRange: [11, 13],
    intervalMs: 83,
    intervalRangeMs: [80, 88],
    button: 'left',
    clickType: 'burst',
    triggerMode: 'hold',
    hotkey: 'XButton1',
    burst: {
      enabled: true,
      clicksPerBurst: 3,
      burstCps: 12,
      cooldownMs: 200,
      randomizeBurstCount: false,
    },
    humanizer: {
      enabled: true,
      algorithm: 'gaussian',
      jitterMs: 5,
      minIntervalMs: 75,
      maxIntervalMs: 95,
      fatigueFactor: 0.1,
      microPauses: false,
      microPauseProbability: 0,
      microPauseMinMs: 0,
      microPauseMaxMs: 0,
      cursorJitter: false,
      cursorJitterRadiusPx: 0,
    },
    location: {
      mode: 'current_cursor',
      fixedCoords: { x: 0, y: 0 },
      multiPoints: [],
      randomArea: { x1: 0, y1: 0, x2: 0, y2: 0 },
    },
    antiDetection: {
      enabled: true,
      noiseInjection: true,
      entropyMultiplier: 1.1,
      blockBlacklistedWindows: true,
      simulatedHardwareEvents: true,
    },
    isBuiltIn: true,
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    author: 'HyperClick Pro Team',
    version: '1.0.0',
  },
  {
    id: 'builtin-mmorpg-skill-rotator',
    name: 'MMORPG Skill Rotator',
    category: 'gaming',
    description: 'Automated 1-to-4 ability priority combo loop with interwoven basic attacks, perfectly timed global cooldowns (GCD), and smooth animation cancels.',
    icon: 'Layers',
    tags: ['MMORPG', 'WoW', 'FFXIV', 'Macro Rotation', 'Skill Sequence'],
    cps: 2.5,
    targetCpsRange: [2, 3],
    intervalMs: 400,
    button: 'left',
    clickType: 'sequence',
    triggerMode: 'toggle',
    hotkey: 'F10',
    burst: {
      enabled: false,
      clicksPerBurst: 1,
      burstCps: 1,
      cooldownMs: 0,
    },
    humanizer: {
      enabled: true,
      algorithm: 'gaussian',
      jitterMs: 25,
      minIntervalMs: 150,
      maxIntervalMs: 650,
      fatigueFactor: 0.15,
      microPauses: true,
      microPauseProbability: 0.04,
      microPauseMinMs: 80,
      microPauseMaxMs: 200,
      cursorJitter: false,
      cursorJitterRadiusPx: 0,
    },
    location: {
      mode: 'current_cursor',
      fixedCoords: { x: 0, y: 0 },
      multiPoints: [],
      randomArea: { x1: 0, y1: 0, x2: 0, y2: 0 },
    },
    sequence: [
      { id: 'mmo-1', type: 'key', key: '1', delayMs: 350, comment: 'Primary Opener Skill' },
      { id: 'mmo-2', type: 'click', button: 'left', delayMs: 180, comment: 'Weaved Auto-Attack' },
      { id: 'mmo-3', type: 'key', key: '2', delayMs: 400, comment: 'Secondary DoT Skill' },
      { id: 'mmo-4', type: 'key', key: '3', delayMs: 450, comment: 'Burst Skill' },
      { id: 'mmo-5', type: 'click', button: 'left', delayMs: 200, comment: 'Weaved Auto-Attack' },
      { id: 'mmo-6', type: 'key', key: '4', delayMs: 1100, comment: 'Finisher Ability (Channel GCD)' },
    ],
    antiDetection: {
      enabled: true,
      noiseInjection: true,
      entropyMultiplier: 1.3,
      blockBlacklistedWindows: false,
      simulatedHardwareEvents: true,
    },
    isBuiltIn: true,
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    author: 'HyperClick Pro Team',
    version: '1.0.0',
  },
  {
    id: 'builtin-excel-data-entry-turbo',
    name: 'Excel Data Entry Turbo',
    category: 'productivity',
    description: 'High-speed spreadsheet data progression macro. Executes cell selection click, confirms entry, and navigates down to the adjacent row with a 150ms pace.',
    icon: 'FileSpreadsheet',
    tags: ['Excel', 'Spreadsheet', 'Data Entry', 'Workflow', 'Office Turbo'],
    cps: 4,
    targetCpsRange: [3, 5],
    intervalMs: 250,
    button: 'left',
    clickType: 'sequence',
    triggerMode: 'toggle',
    hotkey: 'Ctrl+Shift+E',
    burst: {
      enabled: false,
      clicksPerBurst: 1,
      burstCps: 4,
      cooldownMs: 0,
    },
    humanizer: {
      enabled: false,
      algorithm: 'uniform',
      jitterMs: 15,
      minIntervalMs: 120,
      maxIntervalMs: 190,
      fatigueFactor: 0,
      microPauses: false,
      microPauseProbability: 0,
      microPauseMinMs: 0,
      microPauseMaxMs: 0,
      cursorJitter: false,
      cursorJitterRadiusPx: 0,
    },
    location: {
      mode: 'current_cursor',
      fixedCoords: { x: 0, y: 0 },
      multiPoints: [],
      randomArea: { x1: 0, y1: 0, x2: 0, y2: 0 },
    },
    sequence: [
      { id: 'xls-1', type: 'click', button: 'left', delayMs: 80, comment: 'Select target cell' },
      { id: 'xls-2', type: 'key', key: 'ArrowDown', delayMs: 150, comment: 'Move to next row' },
    ],
    antiDetection: {
      enabled: false,
      noiseInjection: false,
      entropyMultiplier: 1.0,
      blockBlacklistedWindows: false,
      simulatedHardwareEvents: false,
    },
    isBuiltIn: true,
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    author: 'HyperClick Pro Team',
    version: '1.0.0',
  },
  {
    id: 'builtin-stealth-natural-human',
    name: 'Stealth Natural Human',
    category: 'stealth',
    description: 'Gold-standard anti-cheat bypass profile. Maintains 6-8 CPS with an indistinguishable human biological distribution, Gaussian entropy variance, natural muscle fatigue, and organic micro-hesitations.',
    icon: 'Shield',
    tags: ['Stealth', 'Undetectable', 'Humanized', 'Anti-Cheat Safe', 'Organic Curve'],
    cps: 7.2,
    targetCpsRange: [6, 8],
    intervalMs: 138,
    intervalRangeMs: [125, 166],
    button: 'left',
    clickType: 'single',
    triggerMode: 'toggle',
    hotkey: 'F11',
    burst: {
      enabled: false,
      clicksPerBurst: 1,
      burstCps: 7,
      cooldownMs: 0,
    },
    humanizer: {
      enabled: true,
      algorithm: 'stealth_human',
      jitterMs: 28,
      minIntervalMs: 110,
      maxIntervalMs: 195,
      fatigueFactor: 0.55,
      microPauses: true,
      microPauseProbability: 0.12,
      microPauseMinMs: 110,
      microPauseMaxMs: 280,
      cursorJitter: true,
      cursorJitterRadiusPx: 2.2,
      bimodalSpreadRatio: 0.15,
    },
    location: {
      mode: 'current_cursor',
      fixedCoords: { x: 0, y: 0 },
      multiPoints: [],
      randomArea: { x1: 0, y1: 0, x2: 0, y2: 0 },
    },
    antiDetection: {
      enabled: true,
      noiseInjection: true,
      entropyMultiplier: 2.2,
      blockBlacklistedWindows: true,
      simulatedHardwareEvents: true,
    },
    isBuiltIn: true,
    isFavorite: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    author: 'HyperClick Pro Team',
    version: '1.0.0',
  },
  {
    id: 'builtin-speed-typing-benchmark',
    name: 'Speed Typing / Click Speed Test',
    category: 'testing',
    description: '50 CPS hyper-drive preset tuned specifically for CPSTest.org, Kohi Click Test, and leaderboard record breaks with ultra-low latency timing.',
    icon: 'Award',
    tags: ['Speed Test', 'CPS Benchmark', '50 CPS', 'Leaderboard', 'Turbo Test'],
    cps: 50,
    targetCpsRange: [48, 52],
    intervalMs: 20,
    intervalRangeMs: [19, 21],
    button: 'left',
    clickType: 'single',
    triggerMode: 'toggle',
    hotkey: 'F12',
    burst: {
      enabled: false,
      clicksPerBurst: 1,
      burstCps: 50,
      cooldownMs: 0,
    },
    humanizer: {
      enabled: true,
      algorithm: 'gaussian',
      jitterMs: 1.8,
      minIntervalMs: 18,
      maxIntervalMs: 23,
      fatigueFactor: 0.05,
      microPauses: false,
      microPauseProbability: 0,
      microPauseMinMs: 0,
      microPauseMaxMs: 0,
      cursorJitter: false,
      cursorJitterRadiusPx: 0,
    },
    location: {
      mode: 'current_cursor',
      fixedCoords: { x: 0, y: 0 },
      multiPoints: [],
      randomArea: { x1: 0, y1: 0, x2: 0, y2: 0 },
    },
    antiDetection: {
      enabled: false,
      noiseInjection: false,
      entropyMultiplier: 1.0,
      blockBlacklistedWindows: false,
      simulatedHardwareEvents: true,
    },
    isBuiltIn: true,
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    author: 'HyperClick Pro Team',
    version: '1.0.0',
  },
  {
    id: 'builtin-qa-automation-stress-test',
    name: 'QA Automation Stress Test',
    category: 'testing',
    description: '500 CPS burst stress test (2ms tick interval) designed for software QA engineers, load testing event listeners, browser DOM resilience, and high-frequency dispatchers.',
    icon: 'Cpu',
    tags: ['QA Testing', 'Stress Test', '500 CPS', 'DevOps', 'Load Simulation'],
    cps: 500,
    targetCpsRange: [450, 500],
    intervalMs: 2,
    intervalRangeMs: [2, 2],
    button: 'left',
    clickType: 'single',
    triggerMode: 'toggle',
    hotkey: 'Ctrl+Shift+F12',
    burst: {
      enabled: false,
      clicksPerBurst: 1,
      burstCps: 500,
      cooldownMs: 0,
    },
    humanizer: {
      enabled: false,
      algorithm: 'off',
      jitterMs: 0,
      minIntervalMs: 2,
      maxIntervalMs: 2,
      fatigueFactor: 0,
      microPauses: false,
      microPauseProbability: 0,
      microPauseMinMs: 0,
      microPauseMaxMs: 0,
      cursorJitter: false,
      cursorJitterRadiusPx: 0,
    },
    location: {
      mode: 'current_cursor',
      fixedCoords: { x: 0, y: 0 },
      multiPoints: [],
      randomArea: { x1: 0, y1: 0, x2: 0, y2: 0 },
    },
    antiDetection: {
      enabled: false,
      noiseInjection: false,
      entropyMultiplier: 1.0,
      blockBlacklistedWindows: false,
      simulatedHardwareEvents: false,
    },
    isBuiltIn: true,
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    author: 'HyperClick Pro Team',
    version: '1.0.0',
  },
];

export const PRESET_CATEGORIES: {
  id: PresetCategory | 'all';
  label: string;
  icon: string;
  description: string;
  badgeColor: string;
}[] = [
  {
    id: 'all',
    label: 'All Presets',
    icon: 'Layers',
    description: 'Complete collection of built-in & custom automation profiles',
    badgeColor: 'border-white/20 text-white',
  },
  {
    id: 'gaming',
    label: 'Gaming & PvP',
    icon: 'Gamepad2',
    description: 'High-CPS, jitter, butterfly, and tactical burst profiles for esports',
    badgeColor: 'border-accent-cyan/40 text-accent-cyan bg-accent-cyan/10',
  },
  {
    id: 'stealth',
    label: 'Stealth & Anti-Cheat',
    icon: 'Shield',
    description: 'Biological Gaussian variance and human muscle simulation',
    badgeColor: 'border-accent-emerald/40 text-accent-emerald bg-accent-emerald/10',
  },
  {
    id: 'afk',
    label: 'AFK & Anti-Idle',
    icon: 'Clock',
    description: 'Roblox, MMO, and idling automation with randomized triggers',
    badgeColor: 'border-accent-amber/40 text-accent-amber bg-accent-amber/10',
  },
  {
    id: 'productivity',
    label: 'Productivity & Office',
    icon: 'FileSpreadsheet',
    description: 'Spreadsheet batch entry, data progression, and workplace macros',
    badgeColor: 'border-accent-blue/40 text-accent-blue bg-accent-blue/10',
  },
  {
    id: 'testing',
    label: 'QA & Benchmarking',
    icon: 'Cpu',
    description: 'High-load stress tests (500 CPS) and click test benchmarkers',
    badgeColor: 'border-accent-rose/40 text-accent-rose bg-accent-rose/10',
  },
  {
    id: 'custom',
    label: 'Custom Profiles',
    icon: 'Sparkles',
    description: 'User-created configurations and imported profiles',
    badgeColor: 'border-accent-purple/40 text-accent-purple bg-accent-purple/10',
  },
];

/**
 * Returns all built-in default presets.
 */
export function getBuiltInPresets(): PresetProfile[] {
  return JSON.parse(JSON.stringify(BUILTIN_PRESETS));
}

/**
 * Finds a preset by ID from the built-in library.
 */
export function getPresetById(id: string): PresetProfile | undefined {
  const match = BUILTIN_PRESETS.find((p) => p.id === id);
  return match ? JSON.parse(JSON.stringify(match)) : undefined;
}

/**
 * Filters presets by category.
 */
export function getPresetsByCategory(category: PresetCategory | 'all'): PresetProfile[] {
  if (category === 'all') {
    return getBuiltInPresets();
  }
  return BUILTIN_PRESETS.filter((p) => p.category === category).map((p) =>
    JSON.parse(JSON.stringify(p))
  );
}

/**
 * Searches presets by query string across name, description, tags, and category.
 */
export function searchPresets(
  query: string,
  category: PresetCategory | 'all' = 'all',
  customProfiles: PresetProfile[] = []
): PresetProfile[] {
  const combined = [...BUILTIN_PRESETS, ...customProfiles];
  const cleanQuery = query.trim().toLowerCase();

  return combined.filter((preset) => {
    // Category check
    if (category !== 'all') {
      if (category === 'custom') {
        if (preset.isBuiltIn) return false;
      } else if (preset.category !== category) {
        return false;
      }
    }

    if (!cleanQuery) return true;

    // Search fields
    const matchName = preset.name.toLowerCase().includes(cleanQuery);
    const matchDesc = preset.description.toLowerCase().includes(cleanQuery);
    const matchTags = preset.tags.some((tag: string) => tag.toLowerCase().includes(cleanQuery));
    const matchButton = preset.button.toLowerCase().includes(cleanQuery);
    const matchCps = `${preset.cps}`.includes(cleanQuery);
    const matchHotkey = preset.hotkey.toLowerCase().includes(cleanQuery);

    return matchName || matchDesc || matchTags || matchButton || matchCps || matchHotkey;
  });
}

/**
 * Creates an editable custom user profile cloned from a preset.
 */
export function createCustomProfileFromPreset(
  preset: PresetProfile,
  customName?: string
): PresetProfile {
  const now = new Date().toISOString();
  const id = `profile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  return {
    ...JSON.parse(JSON.stringify(preset)),
    id,
    name: customName || `${preset.name} (Custom Copy)`,
    category: preset.category === 'custom' ? 'custom' : preset.category,
    isBuiltIn: false,
    createdAt: now,
    updatedAt: now,
    author: 'User',
  };
}

/**
 * Calculates statistics and overview metrics for a preset collection.
 */
export function getPresetStats(presets: PresetProfile[]) {
  const total = presets.length;
  const gamingCount = presets.filter((p) => p.category === 'gaming').length;
  const afkCount = presets.filter((p) => p.category === 'afk').length;
  const stealthCount = presets.filter((p) => p.category === 'stealth').length;
  const productivityCount = presets.filter((p) => p.category === 'productivity').length;
  const testingCount = presets.filter((p) => p.category === 'testing').length;
  const customCount = presets.filter((p) => !p.isBuiltIn).length;
  const maxCps = Math.max(...presets.map((p) => p.cps), 0);
  const avgCps = total > 0 ? (presets.reduce((acc, p) => acc + p.cps, 0) / total).toFixed(1) : '0';

  return {
    total,
    gamingCount,
    afkCount,
    stealthCount,
    productivityCount,
    testingCount,
    customCount,
    maxCps,
    avgCps,
  };
}
