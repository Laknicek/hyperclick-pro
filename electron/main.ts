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
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
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
   * Creates the primary dashboard window.
   */
  private createMainWindow(): void {
    const isDev = !app.isPackaged;
    const preloadPath = path.join(__dirname, 'preload.js');

    this.mainWindow = new BrowserWindow({
      width: 1040,
      height: 730,
      minWidth: 920,
      minHeight: 640,
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
      if (this.miniHudWindow) this.miniHudWindow.close();
      if (this.overlayWindow) this.overlayWindow.close();
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
    const { width } = primaryDisplay.workAreaSize;

    this.miniHudWindow = new BrowserWindow({
      width: 290,
      height: 130,
      x: width - 320,
      y: 50,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      skipTaskbar: true,
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

    this.miniHudWindow.setAlwaysOnTop(true, 'floating');

    const hudUrl = isDev
      ? `${process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'}#/mini-hud`
      : `file://${path.join(__dirname, '../dist/index.html')}#/mini-hud`;

    this.miniHudWindow.loadURL(hudUrl);

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
            this.mainWindow?.show();
            this.mainWindow?.focus();
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
        this.mainWindow?.show();
      });
    } catch {
      // System tray optional in some test environments
    }
  }

  /**
   * Registers global hotkeys (F6, F7, F8, F9, Escape, and custom).
   */
  public registerGlobalHotkeys(): void {
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
  }

  /**
   * Toggles the clicking engine state.
   */
  private async toggleClicker(): Promise<void> {
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
    if (!this.miniHudWindow) {
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
    if (!this.overlayWindow) {
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
   * Broadcasts an IPC message to all active windows.
   */
  private broadcast(channel: string, ...args: any[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args);
    }
    if (this.miniHudWindow && !this.miniHudWindow.isDestroyed()) {
      this.miniHudWindow.webContents.send(channel, ...args);
    }
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.webContents.send(channel, ...args);
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
   * Sets up all IPC message handlers from renderer.
   */
  private setupIpcHandlers(): void {
    // Start Clicker
    ipcMain.handle('clicker:start', async (_event, config: ClickConfig) => {
      this.lastKnownConfig = config;
      return await this.engine.start(config);
    });

    // Stop Clicker
    ipcMain.handle('clicker:stop', async () => {
      return await this.engine.stop();
    });

    // Get Status
    ipcMain.handle('clicker:get-status', async () => {
      return this.engine.getStatus();
    });

    // Pick Coordinates
    ipcMain.handle('coordinate:pick', async () => {
      this.isPickingCoordinate = true;
      const coords = await this.captureCursorCoordinate();
      this.isPickingCoordinate = false;
      this.broadcast('coordinate-picked', coords);
      return coords;
    });

    // Cancel Coordinate Picker
    ipcMain.handle('coordinate:cancel', async () => {
      this.isPickingCoordinate = false;
    });

    // Update Waypoints
    ipcMain.handle('waypoints:update', async (_event, waypoints: ClickWaypoint[]) => {
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.webContents.send('waypoints-synced', waypoints);
      }
    });

    // Toggle Overlay
    ipcMain.handle('overlay:toggle', async (_event, show?: boolean) => {
      return this.toggleOverlay(show);
    });

    // Toggle Mini HUD
    ipcMain.handle('mini-hud:toggle', async (_event, show?: boolean) => {
      return this.toggleMiniHud(show);
    });

    // Window Controls
    ipcMain.handle('window:minimize', async (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      win?.minimize();
    });

    ipcMain.handle('window:maximize', async (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (win.isMaximized()) {
          win.unmaximize();
        } else {
          win.maximize();
        }
      }
    });

    ipcMain.handle('window:close', async (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win === this.mainWindow) {
        app.quit();
      } else {
        win?.hide();
      }
    });

    // Window Drag
    ipcMain.handle('window:drag', async (event, { deltaX, deltaY }: { deltaX: number; deltaY: number }) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        const [x, y] = win.getPosition();
        win.setPosition(Math.round(x + deltaX), Math.round(y + deltaY));
      }
    });

    // Settings
    ipcMain.handle('settings:get', async () => {
      return this.settings;
    });

    ipcMain.handle('settings:save', async (_event, newSettings: Partial<AppSettings>) => {
      this.settings = { ...this.settings, ...newSettings };
      this.saveSettingsToFile();

      // Update alwaysOnTop if changed
      if (newSettings.alwaysOnTop !== undefined && this.mainWindow) {
        this.mainWindow.setAlwaysOnTop(this.settings.alwaysOnTop);
      }

      // Re-register hotkeys in case bindings changed
      if (newSettings.hotkeys) {
        this.registerGlobalHotkeys();
      }

      return true;
    });

    // System Info
    ipcMain.handle('app:get-system-info', async (): Promise<SystemInfo> => {
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
    ipcMain.handle('app:get-version', async () => {
      return app.getVersion();
    });

    // Update Check
    ipcMain.handle('app:check-update', async () => {
      return {
        hasUpdate: false,
        latestVersion: app.getVersion(),
        releaseNotes: 'You are on the latest cutting-edge HyperClick Pro 2026 release.',
      };
    });

    // Open External Link
    ipcMain.handle('app:open-external', async (_event, url: string) => {
      if (url.startsWith('https://') || url.startsWith('http://')) {
        await shell.openExternal(url);
      }
    });

    // Sound Player Request
    ipcMain.handle('sound:play', async (_event, theme?: string) => {
      this.broadcast('sound-trigger', theme || this.settings.soundTheme);
    });
  }
}

// Instantiate and launch
const hyperClickApp = new HyperClickApplication();
hyperClickApp.bootstrap().catch((err) => {
  console.error('[HyperClick Fatal Bootstrap Error]:', err);
});
