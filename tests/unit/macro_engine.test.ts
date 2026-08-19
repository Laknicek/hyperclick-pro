/**
 * Comprehensive Unit Tests:
 * 1. MacroEngine singleton, state machine lifecycle (idle, running, paused, stepping, stopped)
 * 2. Traversal modes math & ordering (ordered, reverse, randomized, ping_pong)
 * 3. Bezier control points computation & Cubic Bezier evaluation
 * 4. Gaussian jitter calculations via Box-Muller transform
 * 5. Macro recording, action serialization, and conversion to Waypoint list
 * 6. Polyline path preview generation
 * 7. Waypoint step execution math, delays, repeats, and event callbacks
 * 
 * Target file:
 * - src/services/macroEngine.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MacroEngine } from '../../src/services/macroEngine';
import { MacroSequence, Waypoint, Point2D } from '../../src/types/clicker';

describe('Macro Engine & Multi-Point Sequencer Math', () => {
  let engine: MacroEngine;

  const sampleWaypoints: Waypoint[] = [
    {
      id: 'wp-1',
      name: 'Point A',
      x: 100,
      y: 200,
      actionType: 'click',
      clickType: 'single',
      mouseButton: 'left',
      delayBeforeMs: 50,
      delayAfterMs: 50,
      jitterRadius: 4,
      holdDurationMs: 25,
      loopRepeat: 1,
      enabled: true,
    },
    {
      id: 'wp-2',
      name: 'Point B',
      x: 500,
      y: 300,
      actionType: 'click',
      clickType: 'single',
      mouseButton: 'right',
      delayBeforeMs: 50,
      delayAfterMs: 50,
      jitterRadius: 6,
      holdDurationMs: 25,
      loopRepeat: 2,
      enabled: true,
    },
    {
      id: 'wp-3',
      name: 'Point C',
      x: 800,
      y: 700,
      actionType: 'move_only',
      delayBeforeMs: 50,
      delayAfterMs: 50,
      jitterRadius: 0,
      holdDurationMs: 20,
      loopRepeat: 1,
      enabled: true,
    },
  ];

  const sampleSequence: MacroSequence = {
    id: 'seq-test-1',
    name: 'Test Sequence',
    description: 'Unit testing sequence',
    waypoints: sampleWaypoints,
    loopCount: 2,
    traversalMode: 'ordered',
    humanizePaths: true,
    speedMultiplier: 2.0,
    bezierSmoothness: 0.65,
  };

  beforeEach(() => {
    engine = MacroEngine.getInstance();
  });

  afterEach(async () => {
    await engine.stop();
  });

  describe('Mathematical Algorithms & Geometric Calculations', () => {
    it('computeBezierControlPoints produces organic arch perpendicular to path', () => {
      const start: Point2D = { x: 100, y: 100 };
      const end: Point2D = { x: 700, y: 100 };

      const { cp1, cp2 } = engine.computeBezierControlPoints(start, end, 0.65);

      expect(cp1.x).toBeGreaterThan(start.x);
      expect(cp1.x).toBeLessThan(end.x);
      expect(cp2.x).toBeGreaterThan(start.x);
      expect(cp2.x).toBeLessThan(end.x);

      // Verify arch offset on Y axis
      expect(Math.abs(cp1.y - start.y)).toBeGreaterThan(0);
    });

    it('evaluateCubicBezier evaluates exact endpoints and continuous midpoint', () => {
      const p0: Point2D = { x: 0, y: 0 };
      const cp1: Point2D = { x: 20, y: 80 };
      const cp2: Point2D = { x: 80, y: 80 };
      const p3: Point2D = { x: 100, y: 0 };

      const start = engine.evaluateCubicBezier(p0, cp1, cp2, p3, 0);
      expect(start.x).toBeCloseTo(0);
      expect(start.y).toBeCloseTo(0);

      const end = engine.evaluateCubicBezier(p0, cp1, cp2, p3, 1);
      expect(end.x).toBeCloseTo(100);
      expect(end.y).toBeCloseTo(0);

      const mid = engine.evaluateCubicBezier(p0, cp1, cp2, p3, 0.5);
      expect(mid.x).toBe(50);
      expect(mid.y).toBe(60); // 0.125*0 + 3*0.25*0.5*80 + 3*0.5*0.25*80 + 0.125*0 = 30 + 30 = 60
    });

    it('computeGaussianJitter produces jitter within bounding radius', () => {
      const radius = 10;
      for (let i = 0; i < 500; i++) {
        const jitter = engine.computeGaussianJitter(radius);
        expect(Math.abs(jitter.x)).toBeLessThanOrEqual(radius + 0.001);
        expect(Math.abs(jitter.y)).toBeLessThanOrEqual(radius + 0.001);
      }

      // Zero radius handling
      expect(engine.computeGaussianJitter(0)).toEqual({ x: 0, y: 0 });
      expect(engine.computeGaussianJitter(-5)).toEqual({ x: 0, y: 0 });
    });

    it('generatePathPreview produces discrete polyline path with specified step count', () => {
      const start = { x: 50, y: 50 };
      const end = { x: 300, y: 400 };
      const steps = 20;

      const path = engine.generatePathPreview(start, end, 0.65, steps);
      expect(path).toHaveLength(steps + 1);
      expect(path[0].x).toBeCloseTo(start.x);
      expect(path[0].y).toBeCloseTo(start.y);
      expect(path[path.length - 1].x).toBeCloseTo(end.x);
      expect(path[path.length - 1].y).toBeCloseTo(end.y);
    });
  });

  describe('Traversal Modes Math & Ordering', () => {
    it('ordered traversal preserves sequence order', () => {
      const build = (engine as any).buildTraversalOrder.bind(engine);
      const ordered = build(sampleWaypoints, 'ordered');
      expect(ordered.map((w: Waypoint) => w.id)).toEqual(['wp-1', 'wp-2', 'wp-3']);
    });

    it('reverse traversal reverses waypoint order', () => {
      const build = (engine as any).buildTraversalOrder.bind(engine);
      const reversed = build(sampleWaypoints, 'reverse');
      expect(reversed.map((w: Waypoint) => w.id)).toEqual(['wp-3', 'wp-2', 'wp-1']);
    });

    it('randomized traversal shuffles all items without loss', () => {
      const build = (engine as any).buildTraversalOrder.bind(engine);
      const randomized = build(sampleWaypoints, 'randomized');
      expect(randomized).toHaveLength(3);
      expect(randomized.map((w: Waypoint) => w.id).sort()).toEqual(['wp-1', 'wp-2', 'wp-3']);
    });

    it('ping_pong traversal oscillates back and forth', () => {
      const build = (engine as any).buildTraversalOrder.bind(engine);
      (engine as any).pingPongDirection = 1;

      // First pass: forward
      const pass1 = build(sampleWaypoints, 'ping_pong');
      expect(pass1.map((w: Waypoint) => w.id)).toEqual(['wp-1', 'wp-2', 'wp-3']);

      // Second pass: reverse intermediate
      const pass2 = build(sampleWaypoints, 'ping_pong');
      expect(pass2.map((w: Waypoint) => w.id)).toEqual(['wp-2']);
    });
  });

  describe('Macro Recording & Conversion Engine', () => {
    it('records user actions and converts them into structured waypoints', () => {
      engine.startRecording();
      expect(engine.getState()).toBe('recording');

      engine.recordAction({
        type: 'click',
        x: 400,
        y: 300,
        button: 'left',
      });

      engine.recordAction({
        type: 'mouse_down',
        x: 600,
        y: 450,
        button: 'right',
      });

      engine.recordAction({
        type: 'key_down',
        key: 'Space',
      });

      const sequence = engine.stopRecording('Custom Captured Sequence');
      expect(engine.getState()).toBe('idle');
      expect(sequence.name).toBe('Custom Captured Sequence');
      expect(sequence.waypoints.length).toBe(3);
      expect(sequence.waypoints[0].actionType).toBe('click');
      expect(sequence.waypoints[1].mouseButton).toBe('right');
      expect(sequence.waypoints[2].actionType).toBe('key_press');
      expect(sequence.waypoints[2].key).toBe('Space');
    });

    it('ignores recordAction when not in recording state', () => {
      engine.recordAction({ type: 'click', x: 100, y: 100 });
      const sequence = engine.stopRecording();
      expect(sequence.recordedActions?.length || 0).toBe(0);
    });
  });

  describe('Execution State Machine & Lifecycle', () => {
    it('transitions through running, pause, resume, and stop states', async () => {
      const states: string[] = [];
      const unbind = engine.addListener({
        onStateChange: (s) => states.push(s),
      });

      // Start execution in background
      const execPromise = engine.start({
        ...sampleSequence,
        speedMultiplier: 10.0,
      });

      expect(engine.getState()).toBe('running');

      engine.pause();
      expect(engine.getState()).toBe('paused');

      engine.resume();
      expect(engine.getState()).toBe('running');

      await engine.stop();
      expect(engine.getState()).toBe('idle');

      await execPromise;
      unbind();
    });

    it('executes stepping mode on individual waypoints', async () => {
      const executed: string[] = [];
      const unbind = engine.addListener({
        onWaypointStart: (wp) => executed.push(wp.id),
      });

      await engine.step(sampleSequence);
      expect(executed).toContain('wp-1');
      expect(engine.getState()).toBe('paused');

      await engine.stop();
      unbind();
    });

    it('handles various waypoint action types (drag, key, scroll, wait)', async () => {
      const actionsExecuted: string[] = [];
      const unbind = engine.addListener({
        onActionExecuted: (act) => {
          if (act.type) actionsExecuted.push(act.type);
        },
      });

      const multiActionSequence: MacroSequence = {
        id: 'multi-act',
        name: 'Multi Action',
        waypoints: [
          {
            id: 'wp-drag',
            name: 'Drag',
            x: 100,
            y: 100,
            targetX: 200,
            targetY: 200,
            actionType: 'drag_to',
            delayBeforeMs: 1,
            delayAfterMs: 1,
            jitterRadius: 0,
            enabled: true,
          },
          {
            id: 'wp-key',
            name: 'Key',
            x: 100,
            y: 100,
            actionType: 'key_press',
            key: 'Enter',
            delayBeforeMs: 1,
            delayAfterMs: 1,
            jitterRadius: 0,
            enabled: true,
          },
          {
            id: 'wp-scroll',
            name: 'Scroll',
            x: 100,
            y: 100,
            actionType: 'wheel_scroll',
            scrollAmount: 120,
            delayBeforeMs: 1,
            delayAfterMs: 1,
            jitterRadius: 0,
            enabled: true,
          },
          {
            id: 'wp-wait',
            name: 'Wait',
            x: 100,
            y: 100,
            actionType: 'wait',
            delayBeforeMs: 1,
            delayAfterMs: 5,
            jitterRadius: 0,
            enabled: true,
          },
        ],
        loopCount: 1,
        traversalMode: 'ordered',
        speedMultiplier: 20.0,
      };

      await engine.start(multiActionSequence);
      expect(actionsExecuted).toContain('mouse_up');
      expect(actionsExecuted).toContain('key_down');
      expect(actionsExecuted).toContain('scroll');
      expect(actionsExecuted).toContain('wait');

      unbind();
    });

    it('tracks progress data accurately', () => {
      const progress = engine.getCurrentProgress();
      expect(progress.loop).toBe(0);
      expect(progress.waypointIndex).toBe(0);
      expect(progress.cursor).toBeDefined();
    });
  });
});
