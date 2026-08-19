import {
  GlobalAppSettings as AppSettings,
  PresetProfile,
  ProfileExportBundle,
  PresetValidationResult as ValidationResult,
  ClickButton,
  PresetClickType as ClickType,
  PresetTriggerMode as TriggerMode,
  HumanizerAlgorithmType as HumanizerAlgorithm,
} from '../types/presets';
import { BUILTIN_PRESETS, createCustomProfileFromPreset } from './presetLibrary';

/**
 * Storage keys for browser localStorage persistence
 */
const STORAGE_KEYS = {
  SETTINGS: 'hyperclick_app_settings_v1',
  CUSTOM_PROFILES: 'hyperclick_custom_profiles_v1',
  ACTIVE_PROFILE_ID: 'hyperclick_active_profile_id_v1',
  DEFAULT_PROFILE_ID: 'hyperclick_default_profile_id_v1',
  FAVORITES: 'hyperclick_favorite_profile_ids_v1',
};

/**
 * Default Global Application Settings
 */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'cyan',
  glassmorphism: true,
  activeProfileId: 'builtin-minecraft-jitter-god',
  defaultProfileId: 'builtin-minecraft-jitter-god',
  sound: {
    enabled: true,
    soundPack: 'mechanical-blue',
    volume: 65,
    audioFeedbackOnToggle: true,
    frequencyPitchVariance: true,
  },
  system: {
    autoStartWithWindows: false,
    minimizeToTray: true,
    closeToTray: true,
    alwaysOnTop: false,
    runAsAdmin: false,
    hardwareAcceleration: true,
    showNotificationOnStart: true,
  },
  overlay: {
    enabled: true,
    showCpsCounter: true,
    showClickRipples: true,
    position: 'top-right',
    opacity: 85,
    scale: 100,
  },
  hotkeys: {
    startStop: 'F6',
    toggleBurst: 'F7',
    recordMacro: 'Ctrl+Shift+R',
    pickCoordinates: 'Ctrl+Shift+C',
    panicKillswitch: 'Escape',
    nextProfile: 'Ctrl+PageDown',
    previousProfile: 'Ctrl+PageUp',
  },
  performance: {
    highPrecisionTimer: true,
    targetPollRateHz: 1000,
    processPriority: 'high',
    enableRawInputBypass: true,
  },
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
};

/**
 * Validates whether an object conforms to PresetProfile schema.
 * Features automated error recovery, schema repair, and normalization.
 */
export function validateProfileSchema(obj: unknown): ValidationResult<PresetProfile> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!obj || typeof obj !== 'object') {
    return {
      isValid: false,
      errors: ['Profile payload must be a non-null JSON object.'],
      warnings: [],
    };
  }

  const p = obj as Record<string, any>;

  // ID validation & recovery
  let id = typeof p.id === 'string' && p.id.trim() ? p.id.trim() : '';
  if (!id) {
    id = `profile-recovered-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    warnings.push('Profile missing "id". Auto-generated fresh unique ID.');
  }

  // Name validation & recovery
  let name = typeof p.name === 'string' && p.name.trim() ? p.name.trim() : '';
  if (!name) {
    name = 'Recovered Custom Profile';
    warnings.push('Profile missing "name". Defaulted to "Recovered Custom Profile".');
  }

  const description = typeof p.description === 'string' ? p.description : '';
  const icon = typeof p.icon === 'string' && p.icon ? p.icon : 'Zap';
  const tags = Array.isArray(p.tags) ? p.tags.map(String) : ['Custom'];

  // CPS & Interval normalization
  let cps = Number(p.cps);
  let intervalMs = Number(p.intervalMs);

  if (isNaN(cps) || cps <= 0) {
    if (!isNaN(intervalMs) && intervalMs > 0) {
      cps = Math.max(0.01, +(1000 / intervalMs).toFixed(2));
      warnings.push(`Inferred CPS (${cps}) from intervalMs (${intervalMs}ms).`);
    } else {
      cps = 10;
      intervalMs = 100;
      warnings.push('Missing CPS and intervalMs. Defaulted to 10 CPS (100ms).');
    }
  }

  if (isNaN(intervalMs) || intervalMs <= 0) {
    intervalMs = Math.max(1, Math.round(1000 / cps));
  }

  // Button enum validation
  const validButtons: ClickButton[] = ['left', 'right', 'middle', 'mouse4', 'mouse5'];
  let button: ClickButton = 'left';
  if (typeof p.button === 'string') {
    const norm = p.button.toLowerCase() as ClickButton;
    if (validButtons.includes(norm)) {
      button = norm;
    } else {
      warnings.push(`Unrecognized mouse button "${p.button}". Defaulted to "left".`);
    }
  }

  // ClickType enum validation
  const validClickTypes: ClickType[] = ['single', 'double', 'triple', 'hold', 'burst', 'sequence'];
  let clickType: ClickType = 'single';
  if (typeof p.clickType === 'string') {
    const norm = p.clickType.toLowerCase() as ClickType;
    if (validClickTypes.includes(norm)) {
      clickType = norm;
    } else {
      warnings.push(`Unrecognized click type "${p.clickType}". Defaulted to "single".`);
    }
  }

  // TriggerMode validation
  const validTriggerModes: TriggerMode[] = ['toggle', 'hold', 'repeat_n_times', 'duration_timer'];
  let triggerMode: TriggerMode = 'toggle';
  if (typeof p.triggerMode === 'string') {
    const norm = p.triggerMode.toLowerCase() as TriggerMode;
    if (validTriggerModes.includes(norm)) {
      triggerMode = norm;
    }
  }

  // Hotkey
  const hotkey = typeof p.hotkey === 'string' && p.hotkey.trim() ? p.hotkey.trim() : 'F6';

  // Humanizer config validation and repair
  const rawHumanizer = p.humanizer && typeof p.humanizer === 'object' ? p.humanizer : {};
  const validAlgos: HumanizerAlgorithm[] = [
    'off',
    'gaussian',
    'uniform',
    'fatigue',
    'jitter_god',
    'butterfly',
    'bimodal',
    'stealth_human',
  ];
  const humanizerAlgo: HumanizerAlgorithm = validAlgos.includes(rawHumanizer.algorithm)
    ? rawHumanizer.algorithm
    : 'off';

  const humanizer = {
    enabled: Boolean(rawHumanizer.enabled),
    algorithm: humanizerAlgo,
    jitterMs: Number(rawHumanizer.jitterMs) || 0,
    minIntervalMs: typeof rawHumanizer.minIntervalMs === 'number' ? rawHumanizer.minIntervalMs : undefined,
    maxIntervalMs: typeof rawHumanizer.maxIntervalMs === 'number' ? rawHumanizer.maxIntervalMs : undefined,
    fatigueFactor: Number(rawHumanizer.fatigueFactor) || 0,
    microPauses: Boolean(rawHumanizer.microPauses),
    microPauseProbability: Number(rawHumanizer.microPauseProbability) || 0.05,
    microPauseMinMs: Number(rawHumanizer.microPauseMinMs) || 50,
    microPauseMaxMs: Number(rawHumanizer.microPauseMaxMs) || 150,
    cursorJitter: Boolean(rawHumanizer.cursorJitter),
    cursorJitterRadiusPx: Number(rawHumanizer.cursorJitterRadiusPx) || 1.5,
    bimodalSpreadRatio: typeof rawHumanizer.bimodalSpreadRatio === 'number' ? rawHumanizer.bimodalSpreadRatio : undefined,
  };

  // Burst config validation
  const rawBurst = p.burst && typeof p.burst === 'object' ? p.burst : {};
  const burst = {
    enabled: Boolean(rawBurst.enabled),
    clicksPerBurst: Number(rawBurst.clicksPerBurst) || 3,
    burstCps: Number(rawBurst.burstCps) || 12,
    cooldownMs: Number(rawBurst.cooldownMs) || 200,
    randomizeBurstCount: Boolean(rawBurst.randomizeBurstCount),
  };

  // Location config validation
  const rawLocation = p.location && typeof p.location === 'object' ? p.location : {};
  const location = {
    mode: rawLocation.mode || 'current_cursor',
    fixedCoords: rawLocation.fixedCoords || { x: 0, y: 0 },
    multiPoints: Array.isArray(rawLocation.multiPoints) ? rawLocation.multiPoints : [],
    randomArea: rawLocation.randomArea || { x1: 0, y1: 0, x2: 0, y2: 0 },
    restoreCursorPositionAfterClick: Boolean(rawLocation.restoreCursorPositionAfterClick),
  };

  // Anti-detection config validation
  const rawAnti = p.antiDetection && typeof p.antiDetection === 'object' ? p.antiDetection : {};
  const antiDetection = {
    enabled: Boolean(rawAnti.enabled),
    noiseInjection: Boolean(rawAnti.noiseInjection),
    entropyMultiplier: Number(rawAnti.entropyMultiplier) || 1.0,
    blockBlacklistedWindows: Boolean(rawAnti.blockBlacklistedWindows),
    simulatedHardwareEvents: rawAnti.simulatedHardwareEvents !== false,
  };

  const sanitized: PresetProfile = {
    id,
    name,
    category: (p.category as any) || 'custom',
    description,
    icon,
    tags,
    cps,
    targetCpsRange: Array.isArray(p.targetCpsRange)
      ? [Number(p.targetCpsRange[0]) || cps, Number(p.targetCpsRange[1]) || cps]
      : undefined,
    intervalMs,
    intervalRangeMs: Array.isArray(p.intervalRangeMs)
      ? [Number(p.intervalRangeMs[0]) || intervalMs, Number(p.intervalRangeMs[1]) || intervalMs]
      : undefined,
    button,
    clickType,
    triggerMode,
    repeatCount: typeof p.repeatCount === 'number' ? p.repeatCount : undefined,
    durationSeconds: typeof p.durationSeconds === 'number' ? p.durationSeconds : undefined,
    hotkey,
    burst,
    humanizer,
    location,
    sequence: Array.isArray(p.sequence) ? p.sequence : undefined,
    antiDetection,
    isBuiltIn: Boolean(p.isBuiltIn),
    isFavorite: Boolean(p.isFavorite),
    createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: typeof p.author === 'string' ? p.author : 'User',
    version: typeof p.version === 'string' ? p.version : '1.0.0',
  };

  return {
    isValid: true,
    data: sanitized,
    errors,
    warnings,
  };
}

/**
 * Storage Service Manager
 */
class StorageService {
  /**
   * Safe Electron IPC bridge accessor
   */
  private getElectronAPI() {
    if (typeof window !== 'undefined') {
      if ((window as any).electronAPI) return (window as any).electronAPI;
      if ((window as any).electron) return (window as any).electron;
    }
    return null;
  }

  /**
   * Loads global application settings with complete fallback
   */
  public loadSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) {
        return { ...DEFAULT_APP_SETTINGS };
      }
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_APP_SETTINGS,
        ...parsed,
        sound: { ...DEFAULT_APP_SETTINGS.sound, ...(parsed.sound || {}) },
        system: { ...DEFAULT_APP_SETTINGS.system, ...(parsed.system || {}) },
        overlay: { ...DEFAULT_APP_SETTINGS.overlay, ...(parsed.overlay || {}) },
        hotkeys: { ...DEFAULT_APP_SETTINGS.hotkeys, ...(parsed.hotkeys || {}) },
        performance: { ...DEFAULT_APP_SETTINGS.performance, ...(parsed.performance || {}) },
      };
    } catch (e) {
      console.error('[StorageService] Error parsing settings from localStorage:', e);
      return { ...DEFAULT_APP_SETTINGS };
    }
  }

  /**
   * Saves global application settings to LocalStorage and Electron
   */
  public saveSettings(settings: Partial<AppSettings>): AppSettings {
    try {
      const current = this.loadSettings();
      const merged: AppSettings = {
        ...current,
        ...settings,
        sound: { ...current.sound, ...(settings.sound || {}) },
        system: { ...current.system, ...(settings.system || {}) },
        overlay: { ...current.overlay, ...(settings.overlay || {}) },
        hotkeys: { ...current.hotkeys, ...(settings.hotkeys || {}) },
        performance: { ...current.performance, ...(settings.performance || {}) },
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));

      // Sync with Electron if available
      const electron = this.getElectronAPI();
      if (electron?.saveSettings) {
        electron.saveSettings(merged).catch((err: any) => {
          console.warn('[StorageService] Electron saveSettings non-fatal error:', err);
        });
      }

      // Notify window listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hyperclick_settings_updated', { detail: merged }));
      }

      return merged;
    } catch (e) {
      console.error('[StorageService] Error saving settings to localStorage:', e);
      return { ...DEFAULT_APP_SETTINGS, ...settings } as AppSettings;
    }
  }

  /**
   * Updates a single top-level setting
   */
  public updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): AppSettings {
    return this.saveSettings({ [key]: value });
  }

  /**
   * Resets global application settings to factory defaults
   */
  public resetSettingsToDefault(): AppSettings {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_APP_SETTINGS };
  }

  /**
   * Retrieves all custom user-created profiles from local storage
   */
  public getCustomProfiles(): PresetProfile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_PROFILES);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      const validProfiles: PresetProfile[] = [];
      for (const item of parsed) {
        const validated = validateProfileSchema(item);
        if (validated.isValid && validated.data) {
          validProfiles.push(validated.data);
        }
      }
      return validProfiles;
    } catch (e) {
      console.error('[StorageService] Error loading custom profiles:', e);
      return [];
    }
  }

  /**
   * Saves custom user-created profiles list
   */
  private saveCustomProfiles(profiles: PresetProfile[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_PROFILES, JSON.stringify(profiles));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hyperclick_profiles_updated', { detail: profiles }));
      }
    } catch (e) {
      console.error('[StorageService] Error saving custom profiles:', e);
    }
  }

  /**
   * Retrieves list of all favorite profile IDs
   */
  public getFavoriteIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return raw
        ? JSON.parse(raw)
        : [
            'builtin-minecraft-jitter-god',
            'builtin-minecraft-butterfly',
            'builtin-stealth-natural-human',
          ];
    } catch {
      return [];
    }
  }

  /**
   * Toggles favorite status for a profile ID
   */
  public toggleFavorite(id: string): boolean {
    const favorites = new Set(this.getFavoriteIds());
    let isFav = false;
    if (favorites.has(id)) {
      favorites.delete(id);
      isFav = false;
    } else {
      favorites.add(id);
      isFav = true;
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(Array.from(favorites)));
    return isFav;
  }

  /**
   * Returns all available profiles (Built-in + Custom), with favorites applied
   */
  public getAllProfiles(): PresetProfile[] {
    const custom = this.getCustomProfiles();
    const favorites = new Set(this.getFavoriteIds());

    const all = [...BUILTIN_PRESETS, ...custom].map((profile) => ({
      ...profile,
      isFavorite: favorites.has(profile.id),
    }));

    return all;
  }

  /**
   * Finds any profile (built-in or custom) by ID
   */
  public getProfileById(id: string): PresetProfile | null {
    const all = this.getAllProfiles();
    return all.find((p) => p.id === id) || null;
  }

  /**
   * Creates and persists a new custom profile
   */
  public createProfile(base?: Partial<PresetProfile>): PresetProfile {
    const now = new Date().toISOString();
    const id = `profile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newProfile: PresetProfile = {
      id,
      name: base?.name || 'New Custom Profile',
      category: base?.category || 'custom',
      description: base?.description || 'Custom user configuration.',
      icon: base?.icon || 'Zap',
      tags: base?.tags || ['Custom', 'User Profile'],
      cps: base?.cps ?? 10,
      targetCpsRange: base?.targetCpsRange || [9, 11],
      intervalMs: base?.intervalMs ?? 100,
      intervalRangeMs: base?.intervalRangeMs || [90, 110],
      button: base?.button || 'left',
      clickType: base?.clickType || 'single',
      triggerMode: base?.triggerMode || 'toggle',
      hotkey: base?.hotkey || 'F6',
      burst: base?.burst || {
        enabled: false,
        clicksPerBurst: 3,
        burstCps: 12,
        cooldownMs: 200,
      },
      humanizer: base?.humanizer || {
        enabled: true,
        algorithm: 'gaussian',
        jitterMs: 8,
        minIntervalMs: 60,
        maxIntervalMs: 140,
        fatigueFactor: 0.1,
        microPauses: false,
        microPauseProbability: 0.05,
        microPauseMinMs: 50,
        microPauseMaxMs: 150,
        cursorJitter: false,
        cursorJitterRadiusPx: 1.0,
      },
      location: base?.location || {
        mode: 'current_cursor',
        fixedCoords: { x: 0, y: 0 },
        multiPoints: [],
        randomArea: { x1: 0, y1: 0, x2: 0, y2: 0 },
      },
      sequence: base?.sequence,
      antiDetection: base?.antiDetection || {
        enabled: true,
        noiseInjection: true,
        entropyMultiplier: 1.2,
        blockBlacklistedWindows: false,
        simulatedHardwareEvents: true,
      },
      isBuiltIn: false,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
      author: 'User',
      version: '1.0.0',
    };

    const customProfiles = this.getCustomProfiles();
    customProfiles.push(newProfile);
    this.saveCustomProfiles(customProfiles);

    return newProfile;
  }

  /**
   * Saves or updates a profile. If it's a built-in profile, clones it to a custom profile.
   */
  public saveProfile(profile: PresetProfile): PresetProfile {
    const customProfiles = this.getCustomProfiles();
    const existingIndex = customProfiles.findIndex((p) => p.id === profile.id);

    const updatedProfile: PresetProfile = {
      ...profile,
      isBuiltIn: false,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      customProfiles[existingIndex] = updatedProfile;
    } else {
      if (profile.isBuiltIn) {
        return this.cloneProfile(profile.id, `${profile.name} (Custom)`);
      }
      customProfiles.push(updatedProfile);
    }

    this.saveCustomProfiles(customProfiles);
    return updatedProfile;
  }

  /**
   * Renames a custom profile
   */
  public renameProfile(id: string, newName: string): boolean {
    const customProfiles = this.getCustomProfiles();
    const target = customProfiles.find((p) => p.id === id);
    if (!target) return false;

    target.name = newName.trim();
    target.updatedAt = new Date().toISOString();
    this.saveCustomProfiles(customProfiles);
    return true;
  }

  /**
   * Clones any profile into a new custom profile
   */
  public cloneProfile(id: string, customName?: string): PresetProfile {
    const source = this.getProfileById(id) || BUILTIN_PRESETS[0];
    const cloned = createCustomProfileFromPreset(source, customName);

    const customProfiles = this.getCustomProfiles();
    customProfiles.push(cloned);
    this.saveCustomProfiles(customProfiles);
    return cloned;
  }

  /**
   * Deletes a custom profile. Returns true if successfully deleted.
   */
  public deleteProfile(id: string): boolean {
    const customProfiles = this.getCustomProfiles();
    const filtered = customProfiles.filter((p) => p.id !== id);

    if (filtered.length === customProfiles.length) {
      return false; // Not found or was built-in
    }

    this.saveCustomProfiles(filtered);

    // If active profile was deleted, switch to default
    const currentActiveId = this.getActiveProfileId();
    if (currentActiveId === id) {
      this.setActiveProfile(this.getDefaultProfileId());
    }

    return true;
  }

  /**
   * Sets the active profile ID
   */
  public setActiveProfile(id: string): boolean {
    const profile = this.getProfileById(id);
    if (!profile) return false;

    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, id);
    this.saveSettings({ activeProfileId: id });
    return true;
  }

  /**
   * Gets the currently active profile
   */
  public getActiveProfile(): PresetProfile {
    const activeId = this.getActiveProfileId();
    const profile = this.getProfileById(activeId);
    if (profile) return profile;

    const fallback = this.getDefaultProfile();
    this.setActiveProfile(fallback.id);
    return fallback;
  }

  /**
   * Gets active profile ID
   */
  public getActiveProfileId(): string {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    if (stored && this.getProfileById(stored)) return stored;
    return this.loadSettings().activeProfileId || BUILTIN_PRESETS[0].id;
  }

  /**
   * Sets default profile ID
   */
  public setDefaultProfile(id: string): boolean {
    const profile = this.getProfileById(id);
    if (!profile) return false;

    localStorage.setItem(STORAGE_KEYS.DEFAULT_PROFILE_ID, id);
    this.saveSettings({ defaultProfileId: id });
    return true;
  }

  /**
   * Gets default profile ID
   */
  public getDefaultProfileId(): string {
    const stored = localStorage.getItem(STORAGE_KEYS.DEFAULT_PROFILE_ID);
    if (stored && this.getProfileById(stored)) return stored;
    return this.loadSettings().defaultProfileId || BUILTIN_PRESETS[0].id;
  }

  /**
   * Gets default profile
   */
  public getDefaultProfile(): PresetProfile {
    const defId = this.getDefaultProfileId();
    return this.getProfileById(defId) || BUILTIN_PRESETS[0];
  }

  /**
   * Serializes profile(s) into a JSON export string
   */
  public exportProfileToJson(
    profiles: PresetProfile | PresetProfile[],
    includeAppSettings = false
  ): string {
    const profileList = Array.isArray(profiles) ? profiles : [profiles];

    const bundle: ProfileExportBundle = {
      format: 'hyperclick-pro-profile-bundle',
      schemaVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      profiles: profileList,
      appSettings: includeAppSettings ? this.loadSettings() : undefined,
    };

    return JSON.stringify(bundle, null, 2);
  }

  /**
   * Triggers download of profile(s) as a .json file
   */
  public async exportProfilesToFile(
    profiles: PresetProfile | PresetProfile[],
    filename?: string
  ): Promise<void> {
    const list = Array.isArray(profiles) ? profiles : [profiles];
    const defaultName =
      list.length === 1
        ? `hyperclick-${list[0].name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`
        : `hyperclick-profiles-bundle-${Date.now()}.json`;

    const finalName = filename || defaultName;
    const jsonString = this.exportProfileToJson(list);

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Parses JSON string and imports profiles with schema validation and repair
   */
  public importProfilesFromJson(jsonString: string): {
    success: boolean;
    imported: PresetProfile[];
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const imported: PresetProfile[] = [];

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e: any) {
      return {
        success: false,
        imported: [],
        errors: [`Invalid JSON format: ${e.message || 'Syntax Error'}`],
        warnings: [],
      };
    }

    let candidates: any[] = [];
    if (parsed && typeof parsed === 'object') {
      if (parsed.format === 'hyperclick-pro-profile-bundle' && Array.isArray(parsed.profiles)) {
        candidates = parsed.profiles;
        if (parsed.appSettings) {
          warnings.push('Bundle contains app settings. Apply them via Settings > Restore Backup.');
        }
      } else if (Array.isArray(parsed)) {
        candidates = parsed;
      } else {
        candidates = [parsed];
      }
    } else {
      return {
        success: false,
        imported: [],
        errors: ['Imported content is neither a valid profile object nor a bundle array.'],
        warnings: [],
      };
    }

    const existingCustom = this.getCustomProfiles();
    const existingIds = new Set([
      ...BUILTIN_PRESETS.map((p) => p.id),
      ...existingCustom.map((p) => p.id),
    ]);

    for (let i = 0; i < candidates.length; i++) {
      const item = candidates[i];
      const validation = validateProfileSchema(item);

      if (!validation.isValid || !validation.data) {
        errors.push(
          `Item #${i + 1} ("${item?.name || 'Unnamed'}"): ${validation.errors.join('; ')}`
        );
        continue;
      }

      if (validation.warnings.length > 0) {
        warnings.push(`Item #${i + 1} (${validation.data.name}): ${validation.warnings.join('; ')}`);
      }

      const profile = validation.data;

      // Resolve ID collisions or imported built-ins
      if (existingIds.has(profile.id) || profile.isBuiltIn) {
        profile.id = `profile-imported-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        profile.name = `${profile.name} (Imported)`;
      }

      profile.isBuiltIn = false;
      profile.updatedAt = new Date().toISOString();

      existingCustom.push(profile);
      existingIds.add(profile.id);
      imported.push(profile);
    }

    if (imported.length > 0) {
      this.saveCustomProfiles(existingCustom);
    }

    return {
      success: imported.length > 0,
      imported,
      errors,
      warnings,
    };
  }

  /**
   * Imports profiles from a browser File object
   */
  public async importProfilesFromFile(file: File): Promise<{
    success: boolean;
    imported: PresetProfile[];
    errors: string[];
    warnings: string[];
  }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) {
          resolve({
            success: false,
            imported: [],
            errors: ['File appears to be empty.'],
            warnings: [],
          });
          return;
        }
        resolve(this.importProfilesFromJson(text));
      };
      reader.onerror = () => {
        resolve({
          success: false,
          imported: [],
          errors: ['Failed to read file from disk.'],
          warnings: [],
        });
      };
      reader.readAsText(file);
    });
  }

  /**
   * Creates a full system export (Settings + All Custom Profiles)
   */
  public exportFullBackup(): string {
    const bundle: ProfileExportBundle = {
      format: 'hyperclick-pro-profile-bundle',
      schemaVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      profiles: this.getCustomProfiles(),
      appSettings: this.loadSettings(),
    };
    return JSON.stringify(bundle, null, 2);
  }

  /**
   * Restores a full system backup
   */
  public restoreFullBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.appSettings) {
        this.saveSettings(parsed.appSettings);
      }
      if (Array.isArray(parsed.profiles)) {
        const importRes = this.importProfilesFromJson(JSON.stringify(parsed.profiles));
        return {
          success: true,
          message: `Backup restored! Settings loaded and ${importRes.imported.length} custom profiles imported.`,
        };
      }
      return { success: true, message: 'Settings successfully restored.' };
    } catch (e: any) {
      return { success: false, message: `Backup restoration failed: ${e.message}` };
    }
  }

  /**
   * Resets everything back to fresh factory state
   */
  public resetAllToFactoryDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_PROFILES);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    localStorage.removeItem(STORAGE_KEYS.DEFAULT_PROFILE_ID);
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
  }
}

export const storageService = new StorageService();

/**
 * High-performance Web Audio API Synthetic Click Sound Generator
 */
export class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playClick(
    pack: AppSettings['sound']['soundPack'] = 'mechanical-blue',
    volumePercent = 65,
    variance = true
  ) {
    if (pack === 'off' || volumePercent <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const masterVol = (volumePercent / 100) * 0.35;
      const pitchOffset = variance ? Math.random() * 0.16 - 0.08 : 0;

      switch (pack) {
        case 'mechanical-blue': {
          const osc1 = this.ctx.createOscillator();
          const gain1 = this.ctx.createGain();
          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(2400 * (1 + pitchOffset), now);
          osc1.frequency.exponentialRampToValueAtTime(300, now + 0.015);

          gain1.gain.setValueAtTime(masterVol, now);
          gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

          osc1.connect(gain1);
          gain1.connect(this.ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.02);
          break;
        }

        case 'mechanical-brown': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(850 * (1 + pitchOffset), now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.025);

          gain.gain.setValueAtTime(masterVol * 1.2, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.03);
          break;
        }

        case 'soft-membrane': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(450 * (1 + pitchOffset), now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.035);

          gain.gain.setValueAtTime(masterVol * 0.8, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }

        case 'bubble-pop': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600 * (1 + pitchOffset), now);
          osc.frequency.exponentialRampToValueAtTime(1600 * (1 + pitchOffset), now + 0.03);

          gain.gain.setValueAtTime(masterVol * 0.9, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }

        case 'futuristic-laser': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(3200 * (1 + pitchOffset), now);
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

          gain.gain.setValueAtTime(masterVol * 0.7, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.045);
          break;
        }

        case 'subtle-tick':
        default: {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1800 * (1 + pitchOffset), now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.008);

          gain.gain.setValueAtTime(masterVol * 0.6, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.01);
          break;
        }
      }
    } catch {
      // Audio error suppressed silently
    }
  }

  public playToggleSound(enabled: boolean, volume = 65) {
    if (volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const vol = (volume / 100) * 0.25;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';

      if (enabled) {
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
      } else {
        osc.frequency.setValueAtTime(1320, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
      }

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // ignore
    }
  }
}

export const soundSynthesizer = new SoundSynthesizer();
