/**
 * HyperClick Pro 2026 - Electron Preload Script
 * Secure ContextBridge exposing high-performance IPC methods to renderer process.
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
  ClickConfig,
  EngineStatus,
  CoordinateResult,
  ClickWaypoint,
  AppSettings,
  SystemInfo,
  SoundTheme,
  IElectronAPI,
} from '../src/types/electron';

const electronAPI: IElectronAPI = {
  // Clicker Engine
  startClicker: (config: ClickConfig): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('clicker:start', config),

  stopClicker: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('clicker:stop'),

  getStatus: (): Promise<EngineStatus> =>
    ipcRenderer.invoke('clicker:get-status'),

  // Coordinates & Waypoints
  pickCoordinates: (): Promise<CoordinateResult> =>
    ipcRenderer.invoke('coordinate:pick'),

  cancelCoordinatePicker: (): Promise<void> =>
    ipcRenderer.invoke('coordinate:cancel'),

  updateWaypoints: (waypoints: ClickWaypoint[]): Promise<void> =>
    ipcRenderer.invoke('waypoints:update', waypoints),

  // Window & Overlays
  toggleOverlay: (show?: boolean): Promise<boolean> =>
    ipcRenderer.invoke('overlay:toggle', show),

  toggleMiniHud: (show?: boolean): Promise<boolean> =>
    ipcRenderer.invoke('mini-hud:toggle', show),

  minimizeWindow: (): Promise<void> =>
    ipcRenderer.invoke('window:minimize'),

  maximizeWindow: (): Promise<void> =>
    ipcRenderer.invoke('window:maximize'),

  closeWindow: (): Promise<void> =>
    ipcRenderer.invoke('window:close'),

  windowDrag: (deltaX: number, deltaY: number): Promise<void> =>
    ipcRenderer.invoke('window:drag', { deltaX, deltaY }),

  // Settings & System
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:get'),

  saveSettings: (settings: Partial<AppSettings>): Promise<boolean> =>
    ipcRenderer.invoke('settings:save', settings),

  getSystemInfo: (): Promise<SystemInfo> =>
    ipcRenderer.invoke('app:get-system-info'),

  getVersion: (): Promise<string> =>
    ipcRenderer.invoke('app:get-version'),

  checkUpdate: (): Promise<{ hasUpdate: boolean; latestVersion?: string; releaseNotes?: string }> =>
    ipcRenderer.invoke('app:check-update'),

  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('app:open-external', url),

  // Sound Feedback
  playClickSound: (theme?: SoundTheme): Promise<void> =>
    ipcRenderer.invoke('sound:play', theme),

  // Event Subscriptions
  onStatusUpdate: (callback: (status: EngineStatus) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, status: EngineStatus) => callback(status);
    ipcRenderer.on('status-update', handler);
    return () => ipcRenderer.removeListener('status-update', handler);
  },

  onHotkeyTriggered: (callback: (action: string) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, action: string) => callback(action);
    ipcRenderer.on('hotkey-triggered', handler);
    return () => ipcRenderer.removeListener('hotkey-triggered', handler);
  },

  onCoordinatePicked: (callback: (coords: CoordinateResult) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, coords: CoordinateResult) => callback(coords);
    ipcRenderer.on('coordinate-picked', handler);
    return () => ipcRenderer.removeListener('coordinate-picked', handler);
  },

  onOverlayStateChanged: (callback: (visible: boolean) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, visible: boolean) => callback(visible);
    ipcRenderer.on('overlay-state-changed', handler);
    return () => ipcRenderer.removeListener('overlay-state-changed', handler);
  },

  onMiniHudStateChanged: (callback: (visible: boolean) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, visible: boolean) => callback(visible);
    ipcRenderer.on('mini-hud-state-changed', handler);
    return () => ipcRenderer.removeListener('mini-hud-state-changed', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
