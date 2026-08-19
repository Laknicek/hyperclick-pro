/**
 * HyperClick Pro 2026 - Macro Sequence & Waypoint Engine
 * Multi-point path runner with Bezier curve interpolation, humanized jitter,
 * traversal modes (ordered, randomized, ping-pong, reverse), recording, and step execution.
 */

import {
  MacroSequence,
  Waypoint,
  MacroAction,
  MacroExecutionState,
  SequenceTraversalMode,
  Point2D,
  BezierControlPoints,
  MouseButton,
  ClickType,
  WaypointActionType,
} from '../types/clicker';

export type MacroEngineEventListener = {
  onStateChange?: (state: MacroExecutionState) => void;
  onWaypointStart?: (waypoint: Waypoint, index: number, loopCount: number) => void;
  onWaypointComplete?: (waypoint: Waypoint, index: number, loopCount: number) => void;
  onPathMove?: (currentPoint: Point2D, progress: number, targetWaypoint: Waypoint) => void;
  onLoopComplete?: (currentLoop: number, targetLoops: number) => void;
  onSequenceEnd?: (totalLoopsCompleted: number, totalWaypointsExecuted: number) => void;
  onActionExecuted?: (action: Partial<MacroAction>) => void;
  onError?: (error: Error) => void;
};

// Safe Electron IPC accessor
const getElectronAPI = () => {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return (window as any).electronAPI;
  }
  return undefined;
};

export class MacroEngine {
  private static instance: MacroEngine;

  private state: MacroExecutionState = 'idle';
  private sequence: MacroSequence | null = null;
  private currentLoop = 0;
  private currentWaypointIndex = 0;
  private pingPongDirection: 1 | -1 = 1;
  private isAbortRequested = false;
  private isPauseRequested = false;
  private isSteppingMode = false;
  private resumeResolver: (() => void) | null = null;
  private stepResolver: (() => void) | null = null;
  private currentCursorPos: Point2D = { x: 960, y: 540 };

  private recordedActions: MacroAction[] = [];
  private recordingStartTime = 0;

  private listeners: MacroEngineEventListener[] = [];
  private totalWaypointsExecuted = 0;

  private constructor() {}

  public static getInstance(): MacroEngine {
    if (!MacroEngine.instance) {
      MacroEngine.instance = new MacroEngine();
    }
    return MacroEngine.instance;
  }

  // ----------------------------------------------------
  // Listener Management
  // ----------------------------------------------------

  public addListener(listener: MacroEngineEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyStateChange(newState: MacroExecutionState): void {
    this.state = newState;
    this.listeners.forEach((l) => l.onStateChange?.(newState));
  }

  public getState(): MacroExecutionState {
    return this.state;
  }

  public getCurrentSequence(): MacroSequence | null {
    return this.sequence;
  }

  public getCurrentProgress(): {
    loop: number;
    totalLoops: number;
    waypointIndex: number;
    totalWaypoints: number;
    cursor: Point2D;
  } {
    const totalWp = this.sequence ? this.sequence.waypoints.filter((w) => w.enabled).length : 0;
    return {
      loop: this.currentLoop,
      totalLoops: this.sequence?.loopCount || 0,
      waypointIndex: this.currentWaypointIndex,
      totalWaypoints: totalWp,
      cursor: { ...this.currentCursorPos },
    };
  }

  // ----------------------------------------------------
  // Execution Controls
  // ----------------------------------------------------

  /**
   * Start executing a macro sequence
   */
  public async start(sequence: MacroSequence): Promise<void> {
    if (this.state === 'running') {
      await this.stop();
    }

    this.sequence = JSON.parse(JSON.stringify(sequence));
    const enabledWaypoints = this.sequence?.waypoints.filter((w) => w.enabled) || [];

    if (enabledWaypoints.length === 0) {
      this.notifyStateChange('idle');
      return;
    }

    this.isAbortRequested = false;
    this.isPauseRequested = false;
    this.currentLoop = 0;
    this.currentWaypointIndex = 0;
    this.pingPongDirection = 1;
    this.totalWaypointsExecuted = 0;

    // Fetch initial cursor position if available
    try {
      const electron = getElectronAPI();
      if (electron?.getCursorPosition) {
        this.currentCursorPos = await electron.getCursorPosition();
      }
    } catch {
      // Browser fallback
    }

    this.notifyStateChange('running');

    try {
      await this.runLoopCycle();
    } catch (err: unknown) {
      if (!this.isAbortRequested) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.listeners.forEach((l) => l.onError?.(error));
      }
    } finally {
      this.notifyStateChange('idle');
      this.listeners.forEach((l) =>
        l.onSequenceEnd?.(this.currentLoop, this.totalWaypointsExecuted)
      );
    }
  }

  /**
   * Pause the active execution
   */
  public pause(): void {
    if (this.state === 'running') {
      this.isPauseRequested = true;
      this.notifyStateChange('paused');
    }
  }

  /**
   * Resume paused execution
   */
  public resume(): void {
    if (this.state === 'paused') {
      this.isPauseRequested = false;
      this.notifyStateChange('running');
      if (this.resumeResolver) {
        this.resumeResolver();
        this.resumeResolver = null;
      }
    }
  }

  /**
   * Stop execution immediately
   */
  public async stop(): Promise<void> {
    this.isAbortRequested = true;
    this.isPauseRequested = false;

    if (this.resumeResolver) {
      this.resumeResolver();
      this.resumeResolver = null;
    }

    if (this.stepResolver) {
      this.stepResolver();
      this.stepResolver = null;
    }

    this.notifyStateChange('stopped');
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.notifyStateChange('idle');
  }

  /**
   * Step to next waypoint
   */
  public async step(sequence?: MacroSequence): Promise<void> {
    if (this.state === 'idle' || this.state === 'stopped') {
      if (sequence) {
        this.sequence = JSON.parse(JSON.stringify(sequence));
      }
      if (!this.sequence || this.sequence.waypoints.length === 0) return;
      this.isAbortRequested = false;
      this.notifyStateChange('stepping');
      const waypoints = this.sequence.waypoints.filter((w) => w.enabled);
      if (waypoints.length === 0) return;

      const wp = waypoints[this.currentWaypointIndex % waypoints.length];
      await this.executeWaypoint(wp, this.currentWaypointIndex);
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % waypoints.length;
      this.notifyStateChange('paused');
    } else if (this.state === 'paused') {
      this.isSteppingMode = true;
      this.notifyStateChange('stepping');
      if (this.resumeResolver) {
        this.resumeResolver();
        this.resumeResolver = null;
      }
    }
  }

  // ----------------------------------------------------
  // Traversal & Sequence Execution Flow
  // ----------------------------------------------------

  private async runLoopCycle(): Promise<void> {
    if (!this.sequence) return;

    const maxLoops = this.sequence.loopCount; // 0 = infinite

    while (!this.isAbortRequested) {
      if (maxLoops > 0 && this.currentLoop >= maxLoops) {
        break;
      }

      const activeWaypoints = this.sequence.waypoints.filter((w) => w.enabled);
      if (activeWaypoints.length === 0) break;

      const executionOrder = this.buildTraversalOrder(
        activeWaypoints,
        this.sequence.traversalMode
      );

      for (let i = 0; i < executionOrder.length; i++) {
        if (this.isAbortRequested) return;

        // Handle pause
        if (this.isPauseRequested) {
          await new Promise<void>((resolve) => {
            this.resumeResolver = resolve;
          });
          if (this.isAbortRequested) return;
        }

        const wp = executionOrder[i];
        this.currentWaypointIndex = i;
        await this.executeWaypoint(wp, i);

        // If in stepping mode, re-pause immediately after executing one waypoint
        if (this.isSteppingMode) {
          this.isPauseRequested = true;
          this.isSteppingMode = false;
          this.notifyStateChange('paused');
        }
      }

      this.currentLoop++;
      this.listeners.forEach((l) => l.onLoopComplete?.(this.currentLoop, maxLoops));

      // Check loop condition
      if (maxLoops > 0 && this.currentLoop >= maxLoops) {
        break;
      }
    }
  }

  private buildTraversalOrder(
    waypoints: Waypoint[],
    mode: SequenceTraversalMode
  ): Waypoint[] {
    const list = [...waypoints];
    switch (mode) {
      case 'ordered':
        return list;

      case 'reverse':
        return list.reverse();

      case 'randomized':
        // Fisher-Yates shuffle
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
        return list;

      case 'ping_pong':
        if (list.length <= 2) return list;
        if (this.pingPongDirection === 1) {
          this.pingPongDirection = -1;
          return list;
        } else {
          this.pingPongDirection = 1;
          return [...list].reverse().slice(1, -1);
        }

      default:
        return list;
    }
  }

  // ----------------------------------------------------
  // Single Waypoint Execution
  // ----------------------------------------------------

  private async executeWaypoint(wp: Waypoint, index: number): Promise<void> {
    if (this.isAbortRequested) return;

    this.listeners.forEach((l) => l.onWaypointStart?.(wp, index, this.currentLoop));

    const speed = this.sequence?.speedMultiplier || 1.0;
    const effectiveDelayBefore = Math.max(0, Math.round(wp.delayBeforeMs / speed));
    const effectiveDelayAfter = Math.max(0, Math.round(wp.delayAfterMs / speed));

    // 1. Delay before
    if (effectiveDelayBefore > 0) {
      await this.sleepWithAbort(effectiveDelayBefore);
      if (this.isAbortRequested) return;
    }

    // 2. Calculate target position with Jitter
    const jitter = this.computeGaussianJitter(wp.jitterRadius);
    const targetPos: Point2D = {
      x: Math.round(wp.x + jitter.x),
      y: Math.round(wp.y + jitter.y),
    };

    // 3. Move cursor smoothly via Bezier curve
    const shouldHumanize = this.sequence?.humanizePaths ?? true;
    const smoothness = this.sequence?.bezierSmoothness ?? 0.65;

    await this.movePathBezier(
      this.currentCursorPos,
      targetPos,
      wp,
      shouldHumanize,
      smoothness,
      speed
    );

    if (this.isAbortRequested) return;
    this.currentCursorPos = targetPos;

    // 4. Perform waypoint Action (with per-waypoint loop repeats)
    const repeats = Math.max(1, wp.loopRepeat || 1);
    for (let r = 0; r < repeats; r++) {
      if (this.isAbortRequested) return;
      await this.performAction(wp, targetPos);
      if (r < repeats - 1) {
        await this.sleepWithAbort(Math.max(15, Math.round(40 / speed)));
      }
    }

    this.totalWaypointsExecuted++;
    this.listeners.forEach((l) => l.onWaypointComplete?.(wp, index, this.currentLoop));

    // 5. Delay after
    if (effectiveDelayAfter > 0) {
      await this.sleepWithAbort(effectiveDelayAfter);
    }
  }

  private async performAction(wp: Waypoint, pos: Point2D): Promise<void> {
    const actionType: WaypointActionType = wp.actionType || 'click';
    const button: MouseButton = wp.mouseButton || 'left';
    const clickType: ClickType = wp.clickType || 'single';
    const holdMs: number = wp.holdDurationMs || 35;

    const actionRecord: Partial<MacroAction> = {
      id: `act_${Date.now()}`,
      timestamp: Date.now(),
      relativeTimeMs: 0,
      x: pos.x,
      y: pos.y,
      button,
    };

    const electron = getElectronAPI();

    switch (actionType) {
      case 'click':
      case 'double_click':
      case 'right_click':
      case 'middle_click': {
        const effectiveButton =
          actionType === 'right_click' ? 'right' : actionType === 'middle_click' ? 'middle' : button;
        const effectiveClickType =
          actionType === 'double_click' ? 'double' : clickType;

        if (electron?.simulateClick) {
          await electron.simulateClick({
            x: pos.x,
            y: pos.y,
            button: effectiveButton,
            type: effectiveClickType,
            holdMs,
          });
        } else {
          // Emulation fallback
          await this.sleepWithAbort(holdMs);
        }

        actionRecord.type = 'click';
        this.listeners.forEach((l) => l.onActionExecuted?.(actionRecord));
        break;
      }

      case 'move_only': {
        // Position already updated
        actionRecord.type = 'move';
        this.listeners.forEach((l) => l.onActionExecuted?.(actionRecord));
        break;
      }

      case 'drag_to': {
        if (wp.targetX !== undefined && wp.targetY !== undefined) {
          // Drag start (mouse down)
          if (electron?.simulateClick) {
            await electron.simulateClick({
              x: pos.x,
              y: pos.y,
              button: 'left',
              type: 'hold',
              holdMs: 20,
            });
          }

          // Drag move to target
          const dragEnd: Point2D = { x: wp.targetX, y: wp.targetY };
          await this.movePathBezier(pos, dragEnd, wp, true, 0.7, 1.0);
          this.currentCursorPos = dragEnd;

          // Drag release (mouse up)
          if (electron?.simulateClick) {
            await electron.simulateClick({
              x: dragEnd.x,
              y: dragEnd.y,
              button: 'left',
              type: 'single',
              holdMs: 15,
            });
          }
        }
        actionRecord.type = 'mouse_up';
        this.listeners.forEach((l) => l.onActionExecuted?.(actionRecord));
        break;
      }

      case 'key_press': {
        if (wp.key) {
          if (electron?.simulateKeyPress) {
            await electron.simulateKeyPress({
              key: wp.key,
              holdMs,
            });
          } else {
            await this.sleepWithAbort(holdMs);
          }
          actionRecord.type = 'key_down';
          actionRecord.key = wp.key;
          this.listeners.forEach((l) => l.onActionExecuted?.(actionRecord));
        }
        break;
      }

      case 'wheel_scroll': {
        const deltaY = wp.scrollAmount || 120;
        if (electron?.simulateScroll) {
          await electron.simulateScroll({ deltaX: 0, deltaY });
        }
        actionRecord.type = 'scroll';
        actionRecord.deltaY = deltaY;
        this.listeners.forEach((l) => l.onActionExecuted?.(actionRecord));
        break;
      }

      case 'wait': {
        await this.sleepWithAbort(wp.delayAfterMs || 500);
        actionRecord.type = 'wait';
        this.listeners.forEach((l) => l.onActionExecuted?.(actionRecord));
        break;
      }
    }
  }

  // ----------------------------------------------------
  // Humanized Bezier Curve Path Interpolation
  // ----------------------------------------------------

  /**
   * Generates natural human-like Bezier control points between start and end
   */
  public computeBezierControlPoints(
    start: Point2D,
    end: Point2D,
    smoothness: number = 0.65
  ): BezierControlPoints {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.hypot(dx, dy);

    // Normal vector perpendicular to trajectory
    const nx = -dy / (distance || 1);
    const ny = dx / (distance || 1);

    // Natural human arch curvature (increases with distance)
    const maxArch = Math.min(180, distance * 0.35 * smoothness);
    const archDirection = Math.random() > 0.5 ? 1 : -1;
    const archAmount = (0.3 + Math.random() * 0.7) * maxArch * archDirection;

    // Control Point 1 (30% along path with arch displacement)
    const cp1: Point2D = {
      x: start.x + dx * 0.3 + nx * archAmount + (Math.random() - 0.5) * 20,
      y: start.y + dy * 0.3 + ny * archAmount + (Math.random() - 0.5) * 20,
    };

    // Control Point 2 (70% along path with decaying arch displacement)
    const cp2: Point2D = {
      x: start.x + dx * 0.7 + nx * (archAmount * 0.6) + (Math.random() - 0.5) * 15,
      y: start.y + dy * 0.7 + ny * (archAmount * 0.6) + (Math.random() - 0.5) * 15,
    };

    return { cp1, cp2 };
  }

  /**
   * Evaluates Cubic Bezier curve at t in [0, 1]
   */
  public evaluateCubicBezier(
    p0: Point2D,
    cp1: Point2D,
    cp2: Point2D,
    p3: Point2D,
    t: number
  ): Point2D {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: mt3 * p0.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * p3.y,
    };
  }

  /**
   * Human velocity profile easing: slow acceleration, cruising speed, gentle deceleration with micro-overshoot
   */
  private easeHumanVelocity(t: number): number {
    // Sigmoid / Quintic blend for ultra-smooth human acceleration & deceleration
    if (t < 0.5) {
      return 16 * Math.pow(t, 5);
    } else {
      return 1 - Math.pow(-2 * t + 2, 5) / 2;
    }
  }

  /**
   * Generates a sample polyline path between start and end for visualization or execution
   */
  public generatePathPreview(
    start: Point2D,
    end: Point2D,
    smoothness: number = 0.65,
    steps: number = 30
  ): Point2D[] {
    const { cp1, cp2 } = this.computeBezierControlPoints(start, end, smoothness);
    const points: Point2D[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push(this.evaluateCubicBezier(start, cp1, cp2, end, t));
    }

    return points;
  }

  /**
   * Smoothly animates mouse along Bezier curve
   */
  private async movePathBezier(
    start: Point2D,
    end: Point2D,
    targetWaypoint: Waypoint,
    humanize: boolean,
    smoothness: number,
    speedMultiplier: number
  ): Promise<void> {
    const electron = getElectronAPI();
    const dist = Math.hypot(end.x - start.x, end.y - start.y);
    if (dist < 3) {
      if (electron?.simulateMouseMove) {
        await electron.simulateMouseMove({ x: end.x, y: end.y });
      }
      this.listeners.forEach((l) => l.onPathMove?.(end, 1.0, targetWaypoint));
      return;
    }

    // Step duration proportional to distance & human speed
    const baseDurationMs = Math.min(600, Math.max(80, dist * 0.45));
    const totalDurationMs = Math.max(20, baseDurationMs / speedMultiplier);
    const stepCount = Math.max(6, Math.min(50, Math.round(totalDurationMs / 12)));

    const { cp1, cp2 } = this.computeBezierControlPoints(
      start,
      end,
      humanize ? smoothness : 0
    );

    const startTime = performance.now();

    for (let i = 1; i <= stepCount; i++) {
      if (this.isAbortRequested) return;

      const rawProgress = i / stepCount;
      const easedT = humanize
        ? this.easeHumanVelocity(rawProgress)
        : rawProgress;

      let currentPt = this.evaluateCubicBezier(start, cp1, cp2, end, easedT);

      // Micro tremor / wobble for realistic human mouse movement
      if (humanize && rawProgress < 0.95) {
        const wobble = (Math.random() - 0.5) * 1.5;
        currentPt = {
          x: Math.round(currentPt.x + wobble),
          y: Math.round(currentPt.y + wobble),
        };
      }

      if (electron?.simulateMouseMove) {
        await electron.simulateMouseMove({
          x: Math.round(currentPt.x),
          y: Math.round(currentPt.y),
        });
      }

      this.listeners.forEach((l) =>
        l.onPathMove?.(currentPt, rawProgress, targetWaypoint)
      );

      // Regulate timing
      const elapsed = performance.now() - startTime;
      const targetTime = (i / stepCount) * totalDurationMs;
      const sleepTime = targetTime - elapsed;
      if (sleepTime > 1) {
        await this.sleepWithAbort(sleepTime);
      }
    }

    // Ensure final coordinate precision
    if (electron?.simulateMouseMove) {
      await electron.simulateMouseMove({ x: end.x, y: end.y });
    }
    this.listeners.forEach((l) => l.onPathMove?.(end, 1.0, targetWaypoint));
  }

  // ----------------------------------------------------
  // Gaussian Jitter (Box-Muller Transform)
  // ----------------------------------------------------

  public computeGaussianJitter(radius: number): Point2D {
    if (radius <= 0) return { x: 0, y: 0 };

    // Standard Box-Muller transform for normal distribution
    const u1 = Math.max(1e-6, Math.random());
    const u2 = Math.random();

    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

    // Std deviation = radius / 2.5 so 99% of clicks fall within radius
    const sigma = radius / 2.5;

    return {
      x: Math.max(-radius, Math.min(radius, z0 * sigma)),
      y: Math.max(-radius, Math.min(radius, z1 * sigma)),
    };
  }

  // ----------------------------------------------------
  // Macro Recording Engine
  // ----------------------------------------------------

  public startRecording(): void {
    this.recordedActions = [];
    this.recordingStartTime = performance.now();
    this.notifyStateChange('recording');
  }

  public recordAction(action: Omit<MacroAction, 'id' | 'relativeTimeMs' | 'timestamp'>): void {
    if (this.state !== 'recording') return;

    const now = performance.now();
    const relativeTime = Math.round(now - this.recordingStartTime);

    const fullAction: MacroAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      relativeTimeMs: relativeTime,
      ...action,
    };

    this.recordedActions.push(fullAction);
  }

  public stopRecording(name: string = 'Recorded Sequence'): MacroSequence {
    this.notifyStateChange('idle');

    // Convert recorded mouse actions to Waypoints
    const waypoints: Waypoint[] = [];
    let prevTime = 0;

    // Filter key click/action moments to build Waypoints
    const significantActions = this.recordedActions.filter(
      (a) => a.type === 'click' || a.type === 'mouse_down' || a.type === 'key_down'
    );

    significantActions.forEach((act, idx) => {
      const delayBefore = Math.max(50, Math.min(3000, act.relativeTimeMs - prevTime));
      prevTime = act.relativeTimeMs;

      waypoints.push({
        id: `wp_rec_${idx + 1}`,
        name: `Node ${idx + 1} (${act.type})`,
        x: act.x || 960,
        y: act.y || 540,
        actionType: act.type === 'key_down' ? 'key_press' : 'click',
        clickType: 'single',
        mouseButton: act.button || 'left',
        delayBeforeMs: delayBefore,
        delayAfterMs: 150,
        jitterRadius: 2,
        holdDurationMs: 40,
        loopRepeat: 1,
        enabled: true,
        key: act.key,
        note: `Recorded action ${act.type}`,
      });
    });

    const totalDuration = this.recordedActions.length > 0
      ? this.recordedActions[this.recordedActions.length - 1].relativeTimeMs
      : 1000;

    return {
      id: `seq_rec_${Date.now()}`,
      name,
      description: `Captured ${waypoints.length} waypoints (${this.recordedActions.length} raw events)`,
      waypoints: waypoints.length > 0 ? waypoints : [
        {
          id: 'wp_1',
          name: 'Recorded Point 1',
          x: 960,
          y: 540,
          actionType: 'click',
          clickType: 'single',
          mouseButton: 'left',
          delayBeforeMs: 100,
          delayAfterMs: 200,
          jitterRadius: 2,
          holdDurationMs: 35,
          loopRepeat: 1,
          enabled: true,
        },
      ],
      loopCount: 1,
      traversalMode: 'ordered',
      humanizePaths: true,
      speedMultiplier: 1.0,
      bezierSmoothness: 0.65,
      recordedActions: [...this.recordedActions],
      totalDurationEstimatedMs: totalDuration,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['Recorded'],
    };
  }

  // ----------------------------------------------------
  // Helpers
  // ----------------------------------------------------

  private async sleepWithAbort(ms: number): Promise<void> {
    if (ms <= 0) return;
    const start = performance.now();
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.isAbortRequested || performance.now() - start >= ms) {
          clearInterval(interval);
          resolve();
        }
      }, 5);
    });
  }

  /**
   * Calculates total estimated duration for a sequence in ms
   */
  public estimateSequenceDuration(sequence: MacroSequence): number {
    const speed = sequence.speedMultiplier || 1.0;
    const activeWaypoints = sequence.waypoints.filter((w) => w.enabled);
    if (activeWaypoints.length === 0) return 0;

    let totalMs = 0;
    for (let i = 0; i < activeWaypoints.length; i++) {
      const wp = activeWaypoints[i];
      const nextWp = activeWaypoints[(i + 1) % activeWaypoints.length];
      const dist = Math.hypot(nextWp.x - wp.x, nextWp.y - wp.y);
      const moveTime = Math.min(600, Math.max(80, dist * 0.45));

      totalMs += (wp.delayBeforeMs + wp.delayAfterMs + (wp.holdDurationMs * (wp.loopRepeat || 1)) + moveTime) / speed;
    }

    return Math.round(totalMs);
  }
}

export const macroEngine = MacroEngine.getInstance();
