/**
 * Waypoint and HUD Types for HyperClick Pro 2026
 */

export type ClickActionType = 'left' | 'right' | 'middle' | 'double' | 'triple' | 'hold' | 'scroll_up' | 'scroll_down';

export interface Waypoint {
  id: string;
  index: number;
  x: number;
  y: number;
  label?: string;
  action: ClickActionType;
  delayMs: number; // Delay before executing this waypoint click
  holdDurationMs?: number;
  randomRadiusPx?: number; // Jitter radius to avoid bot detection
  color?: string;
  notes?: string;
}

export interface WaypointRoute {
  id: string;
  name: string;
  description?: string;
  waypoints: Waypoint[];
  repeatCount: number; // 0 = infinite loop
  smoothBezier: boolean;
  transitSpeedPxPerSec: number; // For humanized mouse travel
  activeWaypointIndex: number | null;
  isRunning: boolean;
}

export interface OverlayState {
  isVisible: boolean;
  isPickingCoordinates: boolean;
  isInteractive: boolean; // Click-through when false, editable when true
  showLabels: boolean;
  showCoordinates: boolean;
  showBezierCurves: boolean;
  showLoupeMagnifier: boolean;
  magnifierZoom: number;
  loupePosition: { x: number; y: number };
  crosshairColor: string;
  selectedWaypointId: string | null;
}

export interface MiniHudState {
  isVisible: boolean;
  isPinned: boolean;
  position: { x: number; y: number };
  currentProfileName: string;
  currentCps: number;
  targetCps: number;
  totalClicks: number;
  isRunning: boolean;
  isPaused: boolean;
  hotkey: string;
  isMuted: boolean;
}
