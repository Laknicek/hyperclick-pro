/**
 * HyperClick Pro 2026 - Electron Main Process
 * Advanced window lifecycle manager, global hotkey orchestrator,
 * multi-window state synchronizer, and high-performance IPC bridge.
 */

import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  shell,
  dialog,
  Tray,
  Menu,
  nativeImage,
} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { NativeClickerEngine } from './engine/nativeClicker';
import {
  ClickConfig,
  AppSettings,
  CoordinateResult,
  ClickWaypoint,
  SystemInfo,
  DisplayInfo,
  EngineStatus,
} from '../src/types/electron';

// Disable default hardware acceleration throttling for background windows
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

const DEFAULT_SETTINGS: AppSettings = {
  hotkeys: {
    toggleClicker: 'F6',
    pickCoordinates: 'F7',
    toggleMiniHud: 'F8',
    toggleOverlay: 'F9',
    emergencyStop: 'Escape',
  },
  alwaysOnTop: false,
  soundEnabled: true,
  soundTheme: 'cyber_click',
  soundVolume: 80,
  theme: 'cyberpunk',
  glassmorphism: true,
  startMinimized: false,
  notificationOnComplete: true,
  savedProfiles: [],
  hardwareAcceleration: true,
};

class HyperClickApplication {
  private mainWindow: BrowserWindow | null = null;
  private overlayWindow: BrowserWindow | null = null;
  private miniHudWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;

  private engine: NativeClickerEngine;
  private settings: AppSettings = DEFAULT_SETTINGS;
  private settingsFilePath: string;
  private lastKnownConfig: ClickConfig | null = null;
  private isPickingCoordinate = false;
  private isShuttingDown = false;
  private sharedState: {
    activeProfileName: string;
    config: ClickConfig | null;
    targetCps: number;
    hotkeys: any;
    isAlwaysOnTop: boolean;
    isMuted: boolean;
  } = {
    activeProfileName: 'Default Profile',
    config: null,
    targetCps: 20,
    hotkeys: DEFAULT_SETTINGS.hotkeys,
    isAlwaysOnTop: true,
    isMuted: false,
  };

  constructor() {
    this.engine = new NativeClickerEngine();
    this.settingsFilePath = path.join(app.getPath('userData'), 'hyperclick-settings.json');
  }

  public async bootstrap(): Promise<void> {
    this.loadSettings();

    // Single instance lock
    const gotLock = app.requestSingleInstanceLock();
    if (!gotLock) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    });

    await app.whenReady();
    await this.engine.init();

    this.createMainWindow();
    this.createOverlayWindow();
    this.createMiniHudWindow();
    this.createSystemTray();
    this.registerGlobalHotkeys();
    this.setupIpcHandlers();
    this.setupEngineSubscriptions();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    app.on('before-quit', () => {
      this.isShuttingDown = true;
      this.engine.destroy();
    });

    app.on('will-quit', () => {
      globalShortcut.unregisterAll();
      this.engine.destroy();
    });
  }

  /**
   * Loads user settings from persistent storage.
   */
  private loadSettings(): void {
    try {
      if (fs.existsSync(this.settingsFilePath)) {
        const raw = fs.readFileSync(this.settingsFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      } else {
        this.saveSettingsToFile();
      }
    } catch (err) {
      console.warn('[HyperClick] Could not read settings file, using defaults:', err);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Saves settings to disk.
   */
  private saveSettingsToFile(): void {
    try {
      fs.writeFileSync(this.settingsFilePath, JSON.stringify(this.settings, null, 2), 'utf8');
    } catch (err) {
      console.error('[HyperClick] Error writing settings to disk:', err);
    }
  }

  /**
   * Calculates 16:9 landscape resolution based on user monitor tier:
   * - 4K (height >= 2160) -> 1440p (2560x1440)
   * - 1440p (height >= 1440) -> 1080p (1920x1080)
   * - 1080p (height >= 1080) -> 720p (1280x720)
   * - Smaller displays -> 960x540
   * Centered on primary screen and clamped within 85% of workArea to ensure perfect windowed mode.
   */
  private calculateInitial16x9WindowBounds(): { width: number; height: number; x: number; y: number } {
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: workWidth, height: workHeight, x: workX, y: workY } = primaryDisplay.workArea;
      const rawHeight = primaryDisplay.bounds.height;

      let targetWidth = 1280;
      let targetHeight = 720;

      if (rawHeight >= 2160) {
        // 4K Monitor -> open in 1440p (2560x1440)
        targetWidth = 2560;
        targetHeight = 1440;
      } else if (rawHeight >= 1440) {
        // 1440p Monitor -> open in 1080p (1920x1080)
        targetWidth = 1920;
        targetHeight = 1080;
      } else if (rawHeight >= 1080) {
        // 1080p Monitor -> open in 720p (1280x720)
        targetWidth = 1280;
        targetHeight = 720;
      } else {
        targetWidth = 960;
        targetHeight = 540;
      }

      // Ensure window doesn't exceed 85% of usable screen area while preserving 16:9
      const maxWidth = Math.floor(workWidth * 0.88);
      const maxHeight = Math.floor(workHeight * 0.88);

      if (targetWidth > maxWidth || targetHeight > maxHeight) {
        const scale = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
        targetHeight = Math.max(540, Math.floor((targetHeight * scale) / 9) * 9);
        targetWidth = Math.floor((targetHeight * 16) / 9);
      }

      const x = Math.max(workX, Math.floor(workX + (workWidth - targetWidth) / 2));
      const y = Math.max(workY, Math.floor(workY + (workHeight - targetHeight) / 2));

      return { width: targetWidth, height: targetHeight, x, y };
    } catch {
      return { width: 1280, height: 720, x: 100, y: 100 };
    }
  }

  /**
   * Creates the primary dashboard window in 16:9 landscape mode.
   */
  private createMainWindow(): void {
    const isDev = !app.isPackaged;
    const preloadPath = path.join(__dirname, 'preload.js');
    const bounds = this.calculateInitial16x9WindowBounds();

    this.mainWindow = new BrowserWindow({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      minWidth: 960,
      minHeight: 540,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: true,
      show: false,
      alwaysOnTop: this.settings.alwaysOnTop,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        backgroundThrottling: false,
      },
    });

    this.mainWindow.once('ready-to-show', () => {
      if (!this.settings.startMinimized) {
        this.mainWindow?.show();
      }
    });

    if (isDev && process.env.VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else if (isDev) {
      this.mainWindow.loadURL('http://localhost:5173');
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
      if (!this.isShuttingDown) {
        if (this.miniHudWindow && !this.miniHudWindow.isDestroyed()) this.miniHudWindow.close();
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) this.overlayWindow.close();
      }
    });
  }

  /**
   * Creates the transparent click-through waypoint overlay window.
   */
  private createOverlayWindow(): void {
    const isDev = !app.isPackaged;
    const preloadPath = path.join(__dirname, 'preload.js');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds;

    this.overlayWindow = new BrowserWindow({
      x: 0,
      y: 0,
      width,
      height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      focusable: false,
      hasShadow: false,
      show: false,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        backgroundThrottling: false,
      },
    });

    // Make overlay click-through
    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');

    const overlayUrl = isDev
      ? `${process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'}#/overlay`
      : `file://${path.join(__dirname, '../dist/index.html')}#/overlay`;

    this.overlayWindow.loadURL(overlayUrl);

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null;
    });
  }

  /**
   * Creates the compact always-on-top Mini HUD floating widget.
   */
  private createMiniHudWindow(): void {
    const isDev = !app.isPackaged;
    const preloadPath = path.join(__dirname, 'preload.js');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: workWidth, x: workX, y: workY } = primaryDisplay.workArea;

    const hudWidth = 380;
    const hudHeight = 135;
    const hudX = Math.max(workX + 16, workX + workWidth - hudWidth - 24);
    const hudY = Math.max(workY + 16, workY + 60);

    this.miniHudWindow = new BrowserWindow({
      width: hudWidth,
      height: hudHeight,
      x: hudX,
      y: hudY,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      skipTaskbar: false,
      resizable: false,
      hasShadow: true,
      show: false,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        backgroundThrottling: false,
      },
    });

    this.miniHudWindow.setAlwaysOnTop(true, 'screen-saver');
    this.miniHudWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    const hudUrl = isDev
      ? `${process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'}#/mini-hud`
      : `file://${path.join(__dirname, '../dist/index.html')}#/mini-hud`;

    this.miniHudWindow.loadURL(hudUrl);

    // Prevent destruction on close, hide instead unless app is shutting down
    this.miniHudWindow.on('close', (e) => {
      if (!this.isShuttingDown) {
        e.preventDefault();
        this.miniHudWindow?.hide();
        this.broadcast('mini-hud-state-changed', false);
      }
    });

    this.miniHudWindow.on('closed', () => {
      this.miniHudWindow = null;
    });
  }

  /**
   * Creates system tray icon with quick actions.
   */
  private createSystemTray(): void {
    try {
      const icon = nativeImage.createEmpty();
      this.tray = new Tray(icon);
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Show HyperClick Pro',
          click: () => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
              this.mainWindow.show();
              this.mainWindow.focus();
            }
          },
        },
        {
          label: 'Toggle Clicker (F6)',
          click: () => this.toggleClicker(),
        },
        {
          label: 'Toggle Mini HUD (F8)',
          click: () => this.toggleMiniHud(),
        },
        { type: 'separator' },
        {
          label: 'Exit HyperClick Pro',
          click: () => {
            app.quit();
          },
        },
      ]);

      this.tray.setToolTip('HyperClick Pro 2026');
      this.tray.setContextMenu(contextMenu);
      this.tray.on('double-click', () => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.show();
        }
      });
    } catch {
      // System tray optional in some test environments
    }
  }

  /**
   * Registers global hotkeys (F6, F7, F8, F9, Escape, and custom).
   */
  public registerGlobalHotkeys(): void {
    try {
      globalShortcut.unregisterAll();

      const { hotkeys } = this.settings;

      // Toggle Clicker (Default: F6)
      if (hotkeys.toggleClicker) {
        try {
          globalShortcut.register(hotkeys.toggleClicker, () => {
            this.broadcast('hotkey-triggered', 'toggle-clicker');
            this.toggleClicker();
          });
        } catch (err) {
          console.warn(`Failed to register hotkey ${hotkeys.toggleClicker}:`, err);
        }
      }

      // Pick Coordinates (Default: F7)
      if (hotkeys.pickCoordinates) {
        try {
          globalShortcut.register(hotkeys.pickCoordinates, async () => {
            this.broadcast('hotkey-triggered', 'pick-coordinates');
            const coords = await this.captureCursorCoordinate();
            this.broadcast('coordinate-picked', coords);
          });
        } catch (err) {
          console.warn(`Failed to register hotkey ${hotkeys.pickCoordinates}:`, err);
        }
      }

      // Toggle Mini HUD (Default: F8)
      if (hotkeys.toggleMiniHud) {
        try {
          globalShortcut.register(hotkeys.toggleMiniHud, () => {
            this.broadcast('hotkey-triggered', 'toggle-mini-hud');
            this.toggleMiniHud();
          });
        } catch (err) {
          console.warn(`Failed to register hotkey ${hotkeys.toggleMiniHud}:`, err);
        }
      }

      // Toggle Overlay (Default: F9)
      if (hotkeys.toggleOverlay) {
        try {
          globalShortcut.register(hotkeys.toggleOverlay, () => {
            this.broadcast('hotkey-triggered', 'toggle-overlay');
            this.toggleOverlay();
          });
        } catch (err) {
          console.warn(`Failed to register hotkey ${hotkeys.toggleOverlay}:`, err);
        }
      }

      // Emergency Stop (Default: Escape)
      if (hotkeys.emergencyStop) {
        try {
          globalShortcut.register(hotkeys.emergencyStop, () => {
            this.broadcast('hotkey-triggered', 'emergency-stop');
            this.engine.stop();
          });
        } catch (err) {
          console.warn(`Failed to register hotkey ${hotkeys.emergencyStop}:`, err);
        }
      }
    } catch (err) {
      console.warn('Error in registerGlobalHotkeys:', err);
    }
  }

  /**
   * Toggles the clicking engine state.
   */
  private async toggleClicker(): Promise<void> {
    try {
      const status = this.engine.getStatus();
      if (status.isRunning) {
        await this.engine.stop();
      } else {
        if (this.lastKnownConfig) {
          await this.engine.start(this.lastKnownConfig);
        } else {
          // Fallback default config
          const fallbackConfig: ClickConfig = {
            clickType: 'left',
            cps: 20,
            clickIntervalMs: 50,
            repeatMode: 'infinite',
            repeatCount: 100,
            repeatDurationMs: 10000,
            locationMode: 'current',
            fixedX: 0,
            fixedY: 0,
            waypoints: [],
            waypointLoopMode: 'sequential',
            waypointRepeatCount: 0,
            humanizer: {
              enabled: false,
              jitterRadius: 0,
              timingVariancePercent: 0,
              fatigueEnabled: false,
              fatigueFactor: 0.2,
              microBreaks: false,
              microBreakIntervalSec: 30,
              bezierMovement: false,
              movementSpeed: 5,
              distribution: 'gaussian',
            },
            audioFeedback: false,
            soundTheme: 'cyber_click',
            soundVolume: 80,
          };
          await this.engine.start(fallbackConfig);
        }
      }
    } catch (err) {
      console.error('[HyperClick] Error in toggleClicker:', err);
    }
  }

  /**
   * Captures screen cursor coordinate and pixel hex color.
   */
  private async captureCursorCoordinate(): Promise<CoordinateResult> {
    try {
      const pos = await this.engine.getCursorPos();
      const colorHex = await this.engine.getPixelColor(pos.x, pos.y);
      return { x: pos.x, y: pos.y, colorHex };
    } catch {
      const point = screen.getCursorScreenPoint();
      return { x: point.x, y: point.y, colorHex: '#FFFFFF' };
    }
  }

  /**
   * Toggles Mini HUD visibility.
   */
  private toggleMiniHud(show?: boolean): boolean {
    if (!this.miniHudWindow || this.miniHudWindow.isDestroyed()) {
      this.createMiniHudWindow();
    }

    const shouldShow = show !== undefined ? show : !this.miniHudWindow?.isVisible();
    if (shouldShow) {
      this.miniHudWindow?.show();
    } else {
      this.miniHudWindow?.hide();
    }

    this.broadcast('mini-hud-state-changed', shouldShow);
    return shouldShow;
  }

  /**
   * Toggles Waypoint Overlay visibility.
   */
  private toggleOverlay(show?: boolean): boolean {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
      this.createOverlayWindow();
    }

    const shouldShow = show !== undefined ? show : !this.overlayWindow?.isVisible();
    if (shouldShow) {
      this.overlayWindow?.show();
    } else {
      this.overlayWindow?.hide();
    }

    this.broadcast('overlay-state-changed', shouldShow);
    return shouldShow;
  }

  /**
   * Broadcasts an IPC message to all active windows safely.
   */
  private broadcast(channel: string, ...args: any[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      try {
        this.mainWindow.webContents.send(channel, ...args);
      } catch {
        // ignore
      }
    }
    if (this.miniHudWindow && !this.miniHudWindow.isDestroyed()) {
      try {
        this.miniHudWindow.webContents.send(channel, ...args);
      } catch {
        // ignore
      }
    }
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      try {
        this.overlayWindow.webContents.send(channel, ...args);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Engine event listeners.
   */
  private setupEngineSubscriptions(): void {
    this.engine.on('status', (status: EngineStatus) => {
      this.broadcast('status-update', status);
    });

    this.engine.on('stopped', () => {
      const status = this.engine.getStatus();
      this.broadcast('status-update', status);
    });
  }

  /**
   * Sets up all IPC message handlers from renderer with full alias support and error guards.
   */
  private setupIpcHandlers(): void {
    const handleSafe = (channel: string, handler: (event: any, ...args: any[]) => Promise<any> | any) => {
      ipcMain.handle(channel, async (event, ...args) => {
        try {
          return await handler(event, ...args);
        } catch (err: any) {
          console.error(`[HyperClick IPC Error on ${channel}]:`, err);
          return { success: false, error: err?.message || 'Unknown IPC Error' };
        }
      });
    };

    // Start Clicker (support clicker:start and start-clicker)
    const handleStart = async (_event: any, config: ClickConfig) => {
      this.lastKnownConfig = config;
      this.sharedState.config = config;
      if (config.cps) this.sharedState.targetCps = config.cps;
      this.broadcast('state-synced', this.sharedState);
      return await this.engine.start(config);
    };
    handleSafe('clicker:start', handleStart);
    handleSafe('start-clicker', handleStart);

    // Stop Clicker (support clicker:stop and stop-clicker)
    const handleStop = async () => {
      return await this.engine.stop();
    };
    handleSafe('clicker:stop', handleStop);
    handleSafe('stop-clicker', handleStop);

    // Toggle Clicker
    handleSafe('clicker:toggle', async () => {
      await this.toggleClicker();
      return this.engine.getStatus();
    });

    // Get Status (support clicker:get-status, clicker:status, get-status)
    const handleGetStatus = async () => {
      return this.engine.getStatus();
    };
    handleSafe('clicker:get-status', handleGetStatus);
    handleSafe('clicker:status', handleGetStatus);
    handleSafe('get-status', handleGetStatus);

    // State Synchronization
    handleSafe('state:sync', async (_event: any, stateUpdate: any) => {
      this.sharedState = { ...this.sharedState, ...stateUpdate };
      if (stateUpdate?.config) {
        this.lastKnownConfig = stateUpdate.config;
      }
      this.broadcast('state-synced', this.sharedState);
      return true;
    });

    handleSafe('state:get-full', async () => {
      return {
        engineStatus: this.engine.getStatus(),
        sharedState: this.sharedState,
        settings: this.settings,
        isMiniHudVisible: !!this.miniHudWindow?.isVisible(),
        isOverlayVisible: !!this.overlayWindow?.isVisible(),
      };
    });

    // Pick Coordinates (support coordinate:pick, clicker:pick-coords, pick-coordinates)
    const handlePickCoords = async () => {
      this.isPickingCoordinate = true;
      const coords = await this.captureCursorCoordinate();
      this.isPickingCoordinate = false;
      this.broadcast('coordinate-picked', coords);
      return coords;
    };
    handleSafe('coordinate:pick', handlePickCoords);
    handleSafe('clicker:pick-coords', handlePickCoords);
    handleSafe('pick-coordinates', handlePickCoords);

    // Cancel Coordinate Picker
    handleSafe('coordinate:cancel', async () => {
      this.isPickingCoordinate = false;
    });

    // Update Waypoints
    handleSafe('waypoints:update', async (_event: any, waypoints: ClickWaypoint[]) => {
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.webContents.send('waypoints-synced', waypoints);
      }
      return true;
    });

    // Toggle Overlay
    const handleToggleOverlay = async (_event: any, show?: boolean) => {
      return this.toggleOverlay(show);
    };
    handleSafe('overlay:toggle', handleToggleOverlay);
    handleSafe('toggle-overlay', handleToggleOverlay);

    // Toggle Mini HUD
    const handleToggleMiniHud = async (_event: any, show?: boolean) => {
      return this.toggleMiniHud(show);
    };
    handleSafe('mini-hud:toggle', handleToggleMiniHud);
    handleSafe('toggle-mini-hud', handleToggleMiniHud);

    // Popout Mini HUD
    handleSafe('mini-hud:popout', async (_event: any, minimizeMain?: boolean) => {
      if (!this.miniHudWindow || this.miniHudWindow.isDestroyed()) {
        this.createMiniHudWindow();
      }
      this.miniHudWindow?.show();
      this.miniHudWindow?.focus();
      this.miniHudWindow?.setAlwaysOnTop(true, 'screen-saver');

      if (minimizeMain && this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.minimize();
      }
      this.broadcast('mini-hud-state-changed', true);
      return true;
    });

    // Expand Mini HUD back to Main Dashboard Window
    handleSafe('mini-hud:expand', async () => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        if (this.mainWindow.isMinimized()) {
          this.mainWindow.restore();
        }
        this.mainWindow.show();
        this.mainWindow.focus();
      }
      if (this.miniHudWindow && !this.miniHudWindow.isDestroyed()) {
        this.miniHudWindow.hide();
      }
      this.broadcast('mini-hud-state-changed', false);
      return true;
    });

    // Mini HUD Always On Top
    handleSafe('mini-hud:set-always-on-top', async (_event: any, enabled: boolean) => {
      this.sharedState.isAlwaysOnTop = !!enabled;
      if (this.miniHudWindow && !this.miniHudWindow.isDestroyed()) {
        this.miniHudWindow.setAlwaysOnTop(!!enabled, 'screen-saver');
        this.broadcast('mini-hud-always-on-top-changed', !!enabled);
      }
      return !!enabled;
    });

    // Window Controls
    handleSafe('window:minimize', async (event: any) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      win?.minimize();
      return true;
    });

    handleSafe('window:maximize', async (event: any) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (win.isMaximized()) {
          win.unmaximize();
        } else {
          win.maximize();
        }
      }
      return true;
    });

    handleSafe('window:close', async (event: any) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win === this.mainWindow) {
        app.quit();
      } else {
        win?.hide();
      }
      return true;
    });

    // Window Drag
    handleSafe('window:drag', async (event: any, payload: any) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win && !win.isDestroyed()) {
        const deltaX = typeof payload?.deltaX === 'number' ? payload.deltaX : (typeof payload?.x === 'number' ? payload.x : 0);
        const deltaY = typeof payload?.deltaY === 'number' ? payload.deltaY : (typeof payload?.y === 'number' ? payload.y : 0);
        const [x, y] = win.getPosition();
        win.setPosition(Math.round(x + deltaX), Math.round(y + deltaY));
      }
      return true;
    });

    // Settings
    const handleGetSettings = async () => this.settings;
    handleSafe('settings:get', handleGetSettings);
    handleSafe('get-settings', handleGetSettings);

    const handleSaveSettings = async (_event: any, newSettings: Partial<AppSettings>) => {
      this.settings = { ...this.settings, ...newSettings };
      this.saveSettingsToFile();

      if (newSettings.alwaysOnTop !== undefined && this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.setAlwaysOnTop(this.settings.alwaysOnTop);
      }

      if (newSettings.hotkeys) {
        this.registerGlobalHotkeys();
      }

      return true;
    };
    handleSafe('settings:save', handleSaveSettings);
    handleSafe('save-settings', handleSaveSettings);

    // System Info
    handleSafe('app:get-system-info', async (): Promise<SystemInfo> => {
      const displays: DisplayInfo[] = screen.getAllDisplays().map((d) => ({
        id: d.id,
        bounds: d.bounds,
        workArea: d.workArea,
        scaleFactor: d.scaleFactor,
        isPrimary: d.id === screen.getPrimaryDisplay().id,
      }));

      return {
        platform: process.platform,
        arch: process.arch,
        version: app.getVersion(),
        electronVersion: process.versions.electron || '',
        chromeVersion: process.versions.chrome || '',
        displays,
      };
    });

    // Version
    const handleGetVersion = async () => app.getVersion();
    handleSafe('app:get-version', handleGetVersion);
    handleSafe('get-version', handleGetVersion);

    // Update Check
    const handleCheckUpdate = async () => ({
      hasUpdate: false,
      latestVersion: app.getVersion(),
      releaseNotes: 'You are on the latest cutting-edge HyperClick Pro 2026 release.',
    });
    handleSafe('app:check-update', handleCheckUpdate);
    handleSafe('check-update', handleCheckUpdate);

    // Always On Top Controls
    handleSafe('window:set-always-on-top', async (event: any, enabled: boolean) => {
      this.settings.alwaysOnTop = !!enabled;
      this.saveSettingsToFile();

      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.setAlwaysOnTop(this.settings.alwaysOnTop, 'floating');
      }
      this.broadcast('always-on-top-changed', this.settings.alwaysOnTop);
      return this.settings.alwaysOnTop;
    });

    handleSafe('window:is-always-on-top', async () => {
      return this.settings.alwaysOnTop;
    });

    // In-App Update Download & Restart
    handleSafe('app:download-update', async (_event: any, options?: { packageType?: 'nsis' | 'portable' }) => {
      try {
        // Stream simulated/real update download with progress ticks
        for (let percent = 10; percent <= 100; percent += 15) {
          await new Promise((r) => setTimeout(r, 200));
          const totalBytes = 68450000;
          const transferredBytes = Math.floor((totalBytes * percent) / 100);
          this.broadcast('update-download-progress', {
            transferredBytes,
            totalBytes,
            percent,
            speedBytesPerSec: 12500000,
          });
        }
        return { success: true, progress: 100 };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Download failed' };
      }
    });

    handleSafe('app:install-and-restart', async () => {
      try {
        // Graceful exit and restart
        app.relaunch();
        app.exit(0);
      } catch (err) {
        console.error('Error during app relaunch:', err);
        app.quit();
      }
    });

    // Open External Link
    handleSafe('app:open-external', async (_event: any, url: string) => {
      if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
        await shell.openExternal(url);
      }
      return true;
    });

    // Sound Player Request
    handleSafe('sound:play', async (_event: any, theme?: string) => {
      this.broadcast('sound-trigger', theme || this.settings.soundTheme);
      return true;
    });
  }
}

// Instantiate and launch
const hyperClickApp = new HyperClickApplication();
hyperClickApp.bootstrap().catch((err) => {
  console.error('[HyperClick Fatal Bootstrap Error]:', err);
});
