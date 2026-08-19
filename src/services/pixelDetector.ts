/**
 * HyperClick Pro 2026 - Smart Pixel Color Detection Engine
 * High-frequency screen sampling, Delta-E / Euclidean color distance matching,
 * area bounding box scanning, condition triggers, and auto-click execution.
 */

import {
  PixelTriggerConfig,
  RgbColor,
  HslColor,
  Point2D,
  PixelTriggerCondition,
  PixelTriggerAction,
} from '../types/clicker';

export interface PixelCheckResult {
  x: number;
  y: number;
  detectedHex: string;
  detectedRgb: RgbColor;
  targetHex: string;
  targetRgb: RgbColor;
  distancePercent: number; // 0 (exact match) to 100 (opposite)
  isMatch: boolean;
  timestamp: number;
}

export interface PixelTriggerEvent {
  id: string;
  timestamp: number;
  configId: string;
  targetX: number;
  targetY: number;
  detectedColorHex: string;
  action: PixelTriggerAction;
  executionSuccess: boolean;
}

export interface PixelDetectorStatus {
  isActive: boolean;
  fps: number;
  totalChecks: number;
  totalTriggersFired: number;
  lastCheckResult: PixelCheckResult | null;
  lastTriggerEvent: PixelTriggerEvent | null;
  isInCooldown: boolean;
}

export type PixelDetectorListener = {
  onPixelChecked?: (result: PixelCheckResult) => void;
  onTriggerFired?: (event: PixelTriggerEvent) => void;
  onStatusChange?: (status: PixelDetectorStatus) => void;
  onError?: (error: Error) => void;
};

// Safe Electron IPC accessor
const getElectronAPI = () => {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return (window as any).electronAPI;
  }
  return undefined;
};

export class PixelDetector {
  private static instance: PixelDetector;

  private config: PixelTriggerConfig | null = null;
  private isActive = false;
  private timerId: number | null = null;
  private lastTriggerTime = 0;
  private triggersThisMinute = 0;
  private minuteResetTimer = 0;
  private totalChecks = 0;
  private totalTriggersFired = 0;
  private fpsCounter = 0;
  private currentFps = 0;
  private fpsTimer = 0;
  private lastResult: PixelCheckResult | null = null;
  private lastTriggerEvent: PixelTriggerEvent | null = null;
  private simulatedColor: string | null = null;

  private listeners: PixelDetectorListener[] = [];

  private constructor() {
    this.startFpsTracker();
  }

  public static getInstance(): PixelDetector {
    if (!PixelDetector.instance) {
      PixelDetector.instance = new PixelDetector();
    }
    return PixelDetector.instance;
  }

  // ----------------------------------------------------
  // Listener Management
  // ----------------------------------------------------

  public addListener(listener: PixelDetectorListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyStatus(): void {
    const status: PixelDetectorStatus = {
      isActive: this.isActive,
      fps: this.currentFps,
      totalChecks: this.totalChecks,
      totalTriggersFired: this.totalTriggersFired,
      lastCheckResult: this.lastResult,
      lastTriggerEvent: this.lastTriggerEvent,
      isInCooldown: this.isInCooldown(),
    };
    this.listeners.forEach((l) => l.onStatusChange?.(status));
  }

  public getStatus(): PixelDetectorStatus {
    return {
      isActive: this.isActive,
      fps: this.currentFps,
      totalChecks: this.totalChecks,
      totalTriggersFired: this.totalTriggersFired,
      lastCheckResult: this.lastResult,
      lastTriggerEvent: this.lastTriggerEvent,
      isInCooldown: this.isInCooldown(),
    };
  }

  // ----------------------------------------------------
  // Lifecycle Controls
  // ----------------------------------------------------

  public start(config: PixelTriggerConfig): void {
    this.stop();
    this.config = JSON.parse(JSON.stringify(config));
    this.isActive = true;
    this.lastTriggerTime = 0;
    this.triggersThisMinute = 0;
    this.minuteResetTimer = Date.now();

    this.runSamplingLoop();
    this.notifyStatus();
  }

  public stop(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.isActive = false;
    this.notifyStatus();
  }

  public updateConfig(config: PixelTriggerConfig): void {
    this.config = JSON.parse(JSON.stringify(config));
    if (!this.isActive && config.enabled) {
      this.start(config);
    } else if (this.isActive && !config.enabled) {
      this.stop();
    }
  }

  // ----------------------------------------------------
  // High-Frequency Sampling Loop
  // ----------------------------------------------------

  private async runSamplingLoop(): Promise<void> {
    if (!this.isActive || !this.config) return;

    const interval = Math.max(10, this.config.checkIntervalMs || 50);

    try {
      await this.sampleAndEvaluate();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.listeners.forEach((l) => l.onError?.(error));
    }

    if (this.isActive) {
      this.timerId = window.setTimeout(() => this.runSamplingLoop(), interval);
    }
  }

  private async sampleAndEvaluate(): Promise<void> {
    if (!this.config) return;

    this.totalChecks++;
    this.fpsCounter++;

    // Reset rate limiter window every 60s
    if (Date.now() - this.minuteResetTimer >= 60000) {
      this.triggersThisMinute = 0;
      this.minuteResetTimer = Date.now();
    }

    const { targetX, targetY, expectedColorHex, expectedColorRgb, tolerance, triggerCondition, areaScanRadius } = this.config;

    let detectedRgb: RgbColor = { r: 0, g: 0, b: 0 };
    let detectedHex = '#000000';
    let matchCoord: Point2D = { x: targetX, y: targetY };

    // 1. Fetch pixel color from Electron desktop capturer or fallback simulation
    const electron = getElectronAPI();
    if (this.simulatedColor) {
      detectedHex = this.simulatedColor;
      detectedRgb = PixelDetector.hexToRgb(detectedHex);
    } else if (electron?.getPixelColor) {
      try {
        if (areaScanRadius && areaScanRadius > 0 && electron?.scanPixelArea) {
          const scanResult = await electron.scanPixelArea({
            x: targetX,
            y: targetY,
            radius: areaScanRadius,
            targetRgb: expectedColorRgb,
            tolerance,
          });
          if (scanResult && scanResult.found) {
            detectedRgb = { r: scanResult.r, g: scanResult.g, b: scanResult.b };
            detectedHex = scanResult.hex;
            matchCoord = { x: scanResult.x, y: scanResult.y };
          } else {
            const single = await electron.getPixelColor({ x: targetX, y: targetY });
            if (single) {
              detectedRgb = { r: single.r, g: single.g, b: single.b };
              detectedHex = single.hex;
            }
          }
        } else {
          const single = await electron.getPixelColor({ x: targetX, y: targetY });
          if (single) {
            detectedRgb = { r: single.r, g: single.g, b: single.b };
            detectedHex = single.hex;
          }
        }
      } catch {
        // Fallback
      }
    } else {
      // Browser preview simulated variance (subtle drift around target for realism)
      const noise = (Math.random() - 0.5) * 8;
      detectedRgb = {
        r: Math.max(0, Math.min(255, Math.round(expectedColorRgb.r + noise))),
        g: Math.max(0, Math.min(255, Math.round(expectedColorRgb.g + noise))),
        b: Math.max(0, Math.min(255, Math.round(expectedColorRgb.b + noise))),
      };
      detectedHex = PixelDetector.rgbToHex(detectedRgb);
    }

    // 2. Evaluate Condition
    const distanceScore = PixelDetector.computeColorDistance(detectedRgb, expectedColorRgb);
    const isMatch = this.evaluateCondition(
      triggerCondition,
      detectedRgb,
      expectedColorRgb,
      distanceScore,
      tolerance
    );

    const checkResult: PixelCheckResult = {
      x: targetX,
      y: targetY,
      detectedHex,
      detectedRgb,
      targetHex: expectedColorHex,
      targetRgb: expectedColorRgb,
      distancePercent: Math.round(distanceScore * 10) / 10,
      isMatch,
      timestamp: Date.now(),
    };

    this.lastResult = checkResult;
    this.listeners.forEach((l) => l.onPixelChecked?.(checkResult));

    // 3. Fire trigger if matched and cooldown allows
    if (isMatch && !this.isInCooldown() && this.canTriggerThisMinute()) {
      await this.fireTrigger(matchCoord, detectedHex);
    }
  }

  private evaluateCondition(
    condition: PixelTriggerCondition,
    detected: RgbColor,
    target: RgbColor,
    distanceScore: number,
    tolerance: number
  ): boolean {
    const detectedBrightness = PixelDetector.calculatePerceivedBrightness(detected);
    const targetBrightness = PixelDetector.calculatePerceivedBrightness(target);

    switch (condition) {
      case 'color_matches':
        return distanceScore <= tolerance;

      case 'color_differs':
        return distanceScore > tolerance;

      case 'color_brightness_greater':
        return detectedBrightness > targetBrightness + (tolerance * 2.55);

      case 'color_brightness_less':
        return detectedBrightness < targetBrightness - (tolerance * 2.55);

      case 'color_in_range': {
        const deltaR = Math.abs(detected.r - target.r);
        const deltaG = Math.abs(detected.g - target.g);
        const deltaB = Math.abs(detected.b - target.b);
        const tolChannel = (tolerance / 100) * 255;
        return deltaR <= tolChannel && deltaG <= tolChannel && deltaB <= tolChannel;
      }

      default:
        return distanceScore <= tolerance;
    }
  }

  private isInCooldown(): boolean {
    if (!this.config) return false;
    const cooldown = this.config.cooldownMs || 150;
    return Date.now() - this.lastTriggerTime < cooldown;
  }

  private canTriggerThisMinute(): boolean {
    if (!this.config) return true;
    const maxPerMin = this.config.maxTriggersPerMinute || 600;
    return this.triggersThisMinute < maxPerMin;
  }

  private async fireTrigger(targetCoord: Point2D, detectedColor: string): Promise<void> {
    if (!this.config) return;

    this.lastTriggerTime = Date.now();
    this.triggersThisMinute++;
    this.totalTriggersFired++;

    const action = this.config.triggerAction;
    const actionDelay = this.config.actionDelayMs || 0;

    // Optional delay before action
    if (actionDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, actionDelay));
    }

    // Determine click target coordinates
    let clickX = targetCoord.x;
    let clickY = targetCoord.y;

    if (this.config.clickCoordinateMode === 'at_fixed_point' && this.config.clickX !== undefined && this.config.clickY !== undefined) {
      clickX = this.config.clickX;
      clickY = this.config.clickY;
    }

    // Execute configured Action
    const electron = getElectronAPI();
    let success = true;
    try {
      if (this.config.soundAlert) {
        if (electron?.playBeepAlert) {
          electron.playBeepAlert();
        } else if (electron?.playSound) {
          electron.playSound('cyber_beep', 0.6);
        }
      }

      switch (action) {
        case 'click':
          if (electron?.simulateClick) {
            await electron.simulateClick({
              x: clickX,
              y: clickY,
              button: 'left',
              type: 'single',
              holdMs: 30,
            });
          }
          break;

        case 'double_click':
          if (electron?.simulateClick) {
            await electron.simulateClick({
              x: clickX,
              y: clickY,
              button: 'left',
              type: 'double',
              holdMs: 25,
            });
          }
          break;

        case 'right_click':
          if (electron?.simulateClick) {
            await electron.simulateClick({
              x: clickX,
              y: clickY,
              button: 'right',
              type: 'single',
              holdMs: 30,
            });
          }
          break;

        case 'start_macro':
          // Macro trigger hook
          break;

        case 'stop_all':
          this.stop();
          break;
      }
    } catch {
      success = false;
    }

    const event: PixelTriggerEvent = {
      id: `pte_${Date.now()}`,
      timestamp: Date.now(),
      configId: this.config.id,
      targetX: clickX,
      targetY: clickY,
      detectedColorHex: detectedColor,
      action,
      executionSuccess: success,
    };

    this.lastTriggerEvent = event;
    this.listeners.forEach((l) => l.onTriggerFired?.(event));
    this.notifyStatus();
  }

  // ----------------------------------------------------
  // Test & Simulation Helpers
  // ----------------------------------------------------

  public simulateDetectedColor(hex: string | null): void {
    this.simulatedColor = hex;
  }

  public testSimulateTrigger(): void {
    if (!this.config) return;
    this.fireTrigger({ x: this.config.targetX, y: this.config.targetY }, this.config.expectedColorHex);
  }

  private startFpsTracker(): void {
    setInterval(() => {
      this.currentFps = this.fpsCounter;
      this.fpsCounter = 0;
    }, 1000);
  }

  // ----------------------------------------------------
  // Color Mathematics & Conversion Utilities
  // ----------------------------------------------------

  /**
   * Converts HEX string (#RRGGBB or #RGB) to RgbColor
   */
  public static hexToRgb(hex: string): RgbColor {
    const cleanHex = hex.replace('#', '').trim();
    if (cleanHex.length === 3) {
      const r = parseInt(cleanHex[0] + cleanHex[0], 16);
      const g = parseInt(cleanHex[1] + cleanHex[1], 16);
      const b = parseInt(cleanHex[2] + cleanHex[2], 16);
      return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
    }
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return {
      r: isNaN(r) ? 0 : r,
      g: isNaN(g) ? 0 : g,
      b: isNaN(b) ? 0 : b,
    };
  }

  /**
   * Converts RgbColor to uppercase HEX string (#RRGGBB)
   */
  public static rgbToHex(rgb: RgbColor): string {
    const toHex = (c: number) => {
      const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16).toUpperCase();
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  /**
   * Converts RGB to HSL
   */
  public static rgbToHsl(rgb: RgbColor): HslColor {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  /**
   * Computes perceptual human brightness (ITU-R BT.709) [0 - 255]
   */
  public static calculatePerceivedBrightness(rgb: RgbColor): number {
    return Math.round(0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b);
  }

  /**
   * Computes Weighted Euclidean Color Distance (Human Perception Delta-E proxy)
   * Returns distance percentage from 0 (identical) to 100 (max divergence)
   */
  public static computeColorDistance(c1: RgbColor, c2: RgbColor): number {
    const rMean = (c1.r + c2.r) / 2;
    const deltaR = c1.r - c2.r;
    const deltaG = c1.g - c2.g;
    const deltaB = c1.b - c2.b;

    // Perceptually weighted red-mean color difference formula
    const weightR = 2 + rMean / 256;
    const weightG = 4.0;
    const weightB = 2 + (255 - rMean) / 256;

    const distanceSq = weightR * deltaR * deltaR + weightG * deltaG * deltaG + weightB * deltaB * deltaB;
    const distance = Math.sqrt(distanceSq);

    // Max theoretical distance is ~764.83
    const maxDist = 764.83;
    return Math.min(100, Math.max(0, (distance / maxDist) * 100));
  }
}

export const pixelDetector = PixelDetector.getInstance();
