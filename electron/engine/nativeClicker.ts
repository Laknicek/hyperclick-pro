/**
 * HyperClick Pro 2026 - Ultra-Precision Native Clicker Engine
 * High-performance Win32 input dispatcher with microsecond timing,
 * autonomous C# native worker integration, Gaussian jitter,
 * Bézier curve motion, waypoint sequencing, and sliding-window CPS analytics.
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess, execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { app } from 'electron';
import {
  ClickConfig,
  EngineStatus,
  CoordinateResult,
  ClickWaypoint,
  Point2D,
  TrajectoryPoint,
} from '../../src/types/electron';
import { HumanizerEngine, GaussianDistribution, BezierTrajectory } from './humanizer';
import { CS_WORKER_SOURCE } from './workerSource';

export class NativeClickerEngine extends EventEmitter {
  private workerProcess: ChildProcess | null = null;
  private workerReady = false;
  private workerExePath: string | null = null;
  private pendingRequests: Array<{ resolve: (val: string) => void; reject: (err: Error) => void }> = [];

  private isRunning = false;
  private stopRequested = false;
  private activeConfig: ClickConfig | null = null;

  private humanizer = new HumanizerEngine();
  private clicksPerformed = 0;
  private startTime = 0;
  private currentWaypointIndex = 0;
  private pingPongForward = true;
  private lastClickPos: Point2D | null = null;

  // CPS sliding window tracker (timestamps in ms)
  private clickTimestamps: number[] = [];
  private statusIntervalTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  /**
   * Initializes the native C# worker binary.
   */
  public async init(): Promise<void> {
    try {
      this.ensureWorkerBinary();
      this.spawnWorker();
    } catch (err) {
      console.warn('[HyperClick Engine] C# worker init fallback to powershell mode:', err);
    }
  }

  /**
   * Ensures the C# worker is compiled and cached.
   */
  private ensureWorkerBinary(): void {
    const baseDir = app ? app.getPath('userData') : os.tmpdir();
    const binDir = path.join(baseDir, 'hyperclick-bin');
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    const exePath = path.join(binDir, 'HyperClickWorker.exe');
    this.workerExePath = exePath;

    if (fs.existsSync(exePath)) {
      return; // Already compiled
    }

    const csPath = path.join(binDir, 'HyperClickWorker.cs');
    fs.writeFileSync(csPath, CS_WORKER_SOURCE, 'utf8');

    // Locate csc.exe
    const possibleCscPaths = [
      'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe',
      'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe',
      'csc.exe',
    ];

    let compiler = 'csc.exe';
    for (const p of possibleCscPaths) {
      if (fs.existsSync(p)) {
        compiler = p;
        break;
      }
    }

    const compileCmd = `"${compiler}" /nologo /optimize+ /target:exe /out:"${exePath}" "${csPath}"`;
    execSync(compileCmd, { windowsHide: true, stdio: 'ignore' });
  }

  /**
   * Spawns long-running C# worker subprocess with stdio.
   */
  private spawnWorker(): void {
    if (!this.workerExePath || !fs.existsSync(this.workerExePath)) return;

    this.workerProcess = spawn(this.workerExePath, [], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let buffer = '';

    this.workerProcess.stdout?.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed === 'READY') {
          this.workerReady = true;
          continue;
        }

        if (trimmed.startsWith('PROGRESS ')) {
          // PROGRESS <count> <cps>
          const parts = trimmed.split(' ');
          const count = parseInt(parts[1], 10);
          const cps = parseFloat(parts[2]);
          this.clicksPerformed = count;
          this.emitStatus();
          continue;
        }

        if (trimmed.startsWith('COMPLETED ')) {
          const parts = trimmed.split(' ');
          this.clicksPerformed = parseInt(parts[1], 10);
          this.stop();
          continue;
        }

        // Resolves the oldest pending request
        const req = this.pendingRequests.shift();
        if (req) {
          req.resolve(trimmed);
        }
      }
    });

    this.workerProcess.on('exit', () => {
      this.workerReady = false;
      this.workerProcess = null;
    });
  }

  /**
   * Sends command to C# worker and awaits response.
   */
  private sendWorkerCommand(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.workerProcess || !this.workerReady) {
        // Direct fallback
        this.fallbackDispatch(cmd).then(resolve).catch(reject);
        return;
      }

      this.pendingRequests.push({ resolve, reject });
      this.workerProcess.stdin?.write(cmd + '\n');
    });
  }

  /**
   * PowerShell fallback for Windows systems where C# worker is initializing.
   */
  private fallbackDispatch(cmd: string): Promise<string> {
    return new Promise((resolve) => {
      const parts = cmd.split(' ');
      const action = parts[0];

      if (action === 'GETPOS') {
        try {
          const out = execSync(
            `powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position.X.ToString() + ' ' + [System.Windows.Forms.Cursor]::Position.Y.ToString()"`,
            { windowsHide: true }
          ).toString().trim();
          resolve(`POS ${out}`);
        } catch {
          resolve('POS 0 0');
        }
      } else if (action === 'MOVE') {
        const x = parts[1];
        const y = parts[2];
        execSync(
          `powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})"`,
          { windowsHide: true }
        );
        resolve('OK');
      } else {
        resolve('OK');
      }
    });
  }

  /**
   * Get current cursor position (Win32 GetCursorPos).
   */
  public async getCursorPos(): Promise<Point2D> {
    const res = await this.sendWorkerCommand('GETPOS');
    // Response: "POS 123 456"
    const match = res.match(/POS\s+(-?\d+)\s+(-?\d+)/);
    if (match) {
      return { x: parseInt(match[1], 10), y: parseInt(match[2], 10) };
    }
    return { x: 0, y: 0 };
  }

  /**
   * Get pixel color under coordinate (Win32 GetPixel).
   */
  public async getPixelColor(x: number, y: number): Promise<string> {
    const res = await this.sendWorkerCommand(`GETPIXEL ${x} ${y}`);
    // Response: "COLOR #RRGGBB"
    const match = res.match(/COLOR\s+(#[0-9A-Fa-f]{6})/);
    if (match) {
      return match[1].toUpperCase();
    }
    return '#000000';
  }

  /**
   * Moves mouse cursor smoothly or instantly to target.
   */
  public async moveCursor(x: number, y: number, smooth = false, speed = 5): Promise<void> {
    if (!smooth) {
      await this.sendWorkerCommand(`MOVE ${Math.round(x)} ${Math.round(y)}`);
      this.lastClickPos = { x, y };
      return;
    }

    const current = await this.getCursorPos();
    const trajectory = BezierTrajectory.generatePath(current, { x, y }, speed);

    for (const pt of trajectory) {
      if (this.stopRequested) break;
      await this.sendWorkerCommand(`MOVE ${pt.x} ${pt.y}`);
      if (pt.delayMs > 0) {
        await this.hrSleep(pt.delayMs);
      }
    }
    this.lastClickPos = { x, y };
  }

  /**
   * Dispatches button click.
   * btn: 0 = Left, 1 = Right, 2 = Middle
   */
  public async dispatchClick(
    button: 'left' | 'right' | 'middle',
    x?: number,
    y?: number,
    count = 1,
    holdMicros = 800
  ): Promise<void> {
    const btnCode = button === 'right' ? 1 : button === 'middle' ? 2 : 0;
    const xArg = x !== undefined ? Math.round(x) : '-';
    const yArg = y !== undefined ? Math.round(y) : '-';

    await this.sendWorkerCommand(`CLICK ${btnCode} ${xArg} ${yArg} ${count} ${holdMicros}`);
    this.recordClickEvent(x, y, count);
  }

  /**
   * Dispatches button down.
   */
  public async dispatchButtonDown(button: 'left' | 'right' | 'middle', x?: number, y?: number): Promise<void> {
    const btnCode = button === 'right' ? 1 : button === 'middle' ? 2 : 0;
    const xArg = x !== undefined ? Math.round(x) : '-';
    const yArg = y !== undefined ? Math.round(y) : '-';
    await this.sendWorkerCommand(`DOWN ${btnCode} ${xArg} ${yArg}`);
  }

  /**
   * Dispatches button up.
   */
  public async dispatchButtonUp(button: 'left' | 'right' | 'middle', x?: number, y?: number): Promise<void> {
    const btnCode = button === 'right' ? 1 : button === 'middle' ? 2 : 0;
    const xArg = x !== undefined ? Math.round(x) : '-';
    const yArg = y !== undefined ? Math.round(y) : '-';
    await this.sendWorkerCommand(`UP ${btnCode} ${xArg} ${yArg}`);
  }

  /**
   * Starts the clicking engine with the provided configuration.
   */
  public async start(config: ClickConfig): Promise<{ success: boolean; error?: string }> {
    if (this.isRunning) {
      return { success: false, error: 'Engine already running' };
    }

    this.isRunning = true;
    this.stopRequested = false;
    this.activeConfig = config;
    this.clicksPerformed = 0;
    this.startTime = Date.now();
    this.currentWaypointIndex = 0;
    this.pingPongForward = true;
    this.clickTimestamps = [];
    this.humanizer.reset();

    // Start status broadcast timer at 30Hz
    this.statusIntervalTimer = setInterval(() => {
      this.emitStatus();
    }, 33);

    // Run execution loop asynchronously
    this.runEngineLoop(config).catch((err) => {
      console.error('[HyperClick Engine Loop Error]:', err);
      this.stop();
    });

    return { success: true };
  }

  /**
   * Stops the clicking engine.
   */
  public async stop(): Promise<{ success: boolean }> {
    if (!this.isRunning) return { success: true };

    this.stopRequested = true;
    this.isRunning = false;

    if (this.statusIntervalTimer) {
      clearInterval(this.statusIntervalTimer);
      this.statusIntervalTimer = null;
    }

    // Stop native autonomous worker loop if running
    await this.sendWorkerCommand('STOP_AUTOLOOP');

    // Safety release all mouse buttons
    await this.sendWorkerCommand('UP 0');
    await this.sendWorkerCommand('UP 1');
    await this.sendWorkerCommand('UP 2');

    this.emitStatus();
    this.emit('stopped');

    return { success: true };
  }

  /**
   * High-level click loop orchestrator.
   */
  private async runEngineLoop(config: ClickConfig): Promise<void> {
    const isUltraFast = config.cps >= 200 && config.locationMode !== 'waypoints' && !config.humanizer.enabled;

    // Ultra-Fast Autonomous Native C# Loop optimization
    if (isUltraFast && this.workerReady) {
      const btnCode = config.clickType === 'right' ? 1 : config.clickType === 'middle' ? 2 : 0;
      const x = config.locationMode === 'fixed' ? config.fixedX : -1;
      const y = config.locationMode === 'fixed' ? config.fixedY : -1;
      const intervalUs = Math.max(10, Math.round(1000000 / config.cps));
      const maxClicks = config.repeatMode === 'count' ? config.repeatCount : 0;

      await this.sendWorkerCommand(`START_AUTOLOOP ${btnCode} ${x} ${y} ${intervalUs} ${maxClicks} 0`);
      return;
    }

    // Precise TypeScript orchestration loop with Humanizer, Waypoints, Bézier, Jitter
    let waypointLoopsCompleted = 0;

    while (this.isRunning && !this.stopRequested) {
      // Check Repeat Condition
      if (config.repeatMode === 'count' && this.clicksPerformed >= config.repeatCount) {
        break;
      }
      if (config.repeatMode === 'timer' && Date.now() - this.startTime >= config.repeatDurationMs) {
        break;
      }

      // Check Humanizer Micro-Breaks
      const microBreakMs = this.humanizer.checkMicroBreak(config.humanizer);
      if (microBreakMs > 0) {
        await this.hrSleep(microBreakMs);
        if (this.stopRequested) break;
      }

      // Handle Waypoint Mode
      if (config.locationMode === 'waypoints') {
        if (!config.waypoints || config.waypoints.length === 0) break;

        const currentWp = config.waypoints[this.currentWaypointIndex];
        await this.executeWaypoint(currentWp, config);

        // Advance Waypoint Index
        this.advanceWaypointIndex(config);

        // Check if waypoint loops completed
        if (this.currentWaypointIndex === 0) {
          waypointLoopsCompleted++;
          if (config.waypointRepeatCount > 0 && waypointLoopsCompleted >= config.waypointRepeatCount) {
            break;
          }
        }
        continue;
      }

      // Handle Fixed / Area / Current Location Modes
      let targetX: number | undefined;
      let targetY: number | undefined;

      if (config.locationMode === 'fixed') {
        const target = this.humanizer.calculateTargetPosition(
          config.fixedX,
          config.fixedY,
          config.humanizer
        );
        targetX = target.x;
        targetY = target.y;
      } else if (config.locationMode === 'area' && config.area) {
        const rx = config.area.x + Math.random() * config.area.width;
        const ry = config.area.y + Math.random() * config.area.height;
        const target = this.humanizer.calculateTargetPosition(rx, ry, config.humanizer);
        targetX = target.x;
        targetY = target.y;
      } else {
        // Current location with optional jitter
        if (config.humanizer.enabled && config.humanizer.jitterRadius > 0) {
          const current = await this.getCursorPos();
          const target = this.humanizer.calculateTargetPosition(current.x, current.y, config.humanizer);
          targetX = target.x;
          targetY = target.y;
        }
      }

      // Execute Action
      await this.executeAction(config.clickType, targetX, targetY, config);

      // Compute next interval with humanizer variance
      const baseInterval = config.clickIntervalMs > 0 ? config.clickIntervalMs : 1000 / Math.max(1, config.cps);
      const nextInterval = this.humanizer.calculateNextInterval(baseInterval, config.humanizer);

      await this.hrSleep(nextInterval);
    }

    await this.stop();
  }

  /**
   * Executes a single waypoint action.
   */
  private async executeWaypoint(wp: ClickWaypoint, config: ClickConfig): Promise<void> {
    const target = this.humanizer.calculateTargetPosition(
      wp.x,
      wp.y,
      {
        ...config.humanizer,
        jitterRadius: wp.randomOffsetRadius ?? config.humanizer.jitterRadius,
      }
    );

    // Smooth movement to waypoint
    if (wp.smoothMove ?? config.humanizer.bezierMovement) {
      await this.moveCursor(target.x, target.y, true, config.humanizer.movementSpeed || 5);
    } else {
      await this.moveCursor(target.x, target.y, false);
    }

    if (this.stopRequested) return;

    // Execute waypoint clicks
    const count = Math.max(1, wp.clicksCount || 1);
    for (let c = 0; c < count; c++) {
      if (this.stopRequested) break;
      await this.executeAction(wp.action, target.x, target.y, config, wp.holdDurationMs);

      if (c < count - 1) {
        const intraInterval = config.clickIntervalMs > 0 ? config.clickIntervalMs : 1000 / Math.max(1, config.cps);
        await this.hrSleep(intraInterval);
      }
    }

    // Delay after waypoint
    if (wp.delayAfterMs > 0 && !this.stopRequested) {
      await this.hrSleep(wp.delayAfterMs);
    }
  }

  /**
   * Advances waypoint index based on loop mode (sequential, random, pingpong).
   */
  private advanceWaypointIndex(config: ClickConfig): void {
    const total = config.waypoints.length;
    if (total <= 1) {
      this.currentWaypointIndex = 0;
      return;
    }

    switch (config.waypointLoopMode) {
      case 'random': {
        let nextIdx = this.currentWaypointIndex;
        while (nextIdx === this.currentWaypointIndex) {
          nextIdx = Math.floor(Math.random() * total);
        }
        this.currentWaypointIndex = nextIdx;
        break;
      }
      case 'pingpong': {
        if (this.pingPongForward) {
          if (this.currentWaypointIndex >= total - 1) {
            this.pingPongForward = false;
            this.currentWaypointIndex = total - 2;
          } else {
            this.currentWaypointIndex++;
          }
        } else {
          if (this.currentWaypointIndex <= 0) {
            this.pingPongForward = true;
            this.currentWaypointIndex = 1;
          } else {
            this.currentWaypointIndex--;
          }
        }
        break;
      }
      case 'sequential':
      default: {
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % total;
        break;
      }
    }
  }

  /**
   * Executes configured click action (left, right, middle, double, triple, burst, hold).
   */
  private async executeAction(
    action: string,
    x?: number,
    y?: number,
    config?: ClickConfig,
    customHoldMs?: number
  ): Promise<void> {
    const btn = (action === 'right' ? 'right' : action === 'middle' ? 'middle' : 'left') as 'left' | 'right' | 'middle';

    switch (action) {
      case 'double': {
        await this.dispatchClick(btn, x, y, 2, 800);
        break;
      }
      case 'triple': {
        await this.dispatchClick(btn, x, y, 3, 800);
        break;
      }
      case 'hold': {
        const holdDuration = customHoldMs ?? config?.holdConfig?.durationMs ?? 500;
        await this.dispatchButtonDown(btn, x, y);
        await this.hrSleep(holdDuration);
        await this.dispatchButtonUp(btn, x, y);
        this.recordClickEvent(x, y, 1);
        break;
      }
      case 'burst': {
        const burstSize = config?.burstConfig?.burstSize ?? 5;
        const intraInterval = config?.burstConfig?.intraBurstIntervalMs ?? 20;
        for (let i = 0; i < burstSize; i++) {
          if (this.stopRequested) break;
          await this.dispatchClick(btn, x, y, 1, 600);
          if (i < burstSize - 1) {
            await this.hrSleep(intraInterval);
          }
        }
        break;
      }
      case 'left':
      case 'right':
      case 'middle':
      default: {
        await this.dispatchClick(btn, x, y, 1, 800);
        break;
      }
    }
  }

  /**
   * High-Resolution microsecond sleep utility using process.hrtime.bigint() and hybrid spin-wait.
   */
  public hrSleep(ms: number): Promise<void> {
    if (ms <= 0.05) return Promise.resolve();

    return new Promise((resolve) => {
      const startNs = process.hrtime.bigint();
      const targetNs = BigInt(Math.round(ms * 1_000_000));

      if (ms > 3) {
        // Sleep bulk time on event loop, then spinwait final 2ms for sub-millisecond precision
        setTimeout(() => {
          while (process.hrtime.bigint() - startNs < targetNs) {
            if (this.stopRequested) break;
          }
          resolve();
        }, Math.floor(ms - 2));
      } else {
        setImmediate(() => {
          while (process.hrtime.bigint() - startNs < targetNs) {
            if (this.stopRequested) break;
          }
          resolve();
        });
      }
    });
  }

  /**
   * Records click event for CPS sliding-window analytics.
   */
  private recordClickEvent(x?: number, y?: number, count = 1): void {
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      this.clickTimestamps.push(now);
      this.clicksPerformed++;
    }

    if (x !== undefined && y !== undefined) {
      this.lastClickPos = { x, y };
    }

    this.humanizer.recordClick();
    this.emit('click', { count, x, y });
  }

  /**
   * Calculates actual rolling CPS in the last 1000ms window.
   */
  public getActualCPS(): number {
    const now = Date.now();
    const cutoff = now - 1000;
    // Prune timestamps older than 1 second
    while (this.clickTimestamps.length > 0 && this.clickTimestamps[0] < cutoff) {
      this.clickTimestamps.shift();
    }
    return this.clickTimestamps.length;
  }

  /**
   * Returns complete engine telemetry status.
   */
  public getStatus(): EngineStatus {
    const elapsedMs = this.isRunning ? Date.now() - this.startTime : 0;
    let remainingMs: number | null = null;
    let remainingClicks: number | null = null;

    if (this.activeConfig && this.isRunning) {
      if (this.activeConfig.repeatMode === 'count') {
        remainingClicks = Math.max(0, this.activeConfig.repeatCount - this.clicksPerformed);
      } else if (this.activeConfig.repeatMode === 'timer') {
        remainingMs = Math.max(0, this.activeConfig.repeatDurationMs - elapsedMs);
      }
    }

    return {
      isRunning: this.isRunning,
      clicksPerformed: this.clicksPerformed,
      cpsActual: this.getActualCPS(),
      currentWaypointIndex: this.currentWaypointIndex,
      elapsedMs,
      remainingMs,
      remainingClicks,
      lastClickPos: this.lastClickPos,
      fatigueCurrentFactor: this.humanizer.getFatigueFactor(),
    };
  }

  /**
   * Emits status update event.
   */
  private emitStatus(): void {
    this.emit('status', this.getStatus());
  }

  /**
   * Cleans up worker process on shutdown.
   */
  public destroy(): void {
    this.stop();
    if (this.workerProcess) {
      try {
        this.workerProcess.stdin?.write('EXIT\n');
        this.workerProcess.kill();
      } catch {
        // ignore
      }
      this.workerProcess = null;
    }
  }
}
