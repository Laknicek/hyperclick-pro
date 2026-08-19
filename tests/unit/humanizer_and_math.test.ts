/**
 * Comprehensive Unit Tests:
 * 1. Box-Muller Gaussian jitter distribution
 * 2. Perlin 1D gradient noise
 * 3. Cubic & Quadratic Bézier curves with minimum-jerk velocity curves
 * 4. Fitts's Law motion modeling & Neuromuscular micro-tremor simulation
 * 5. FatigueTracker biometric decay & recovery
 * 6. Unified HumanizerEngine trajectory & interval calculations
 * 
 * Target files:
 * - electron/engine/humanizer.ts
 * - src/utils/math.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  GaussianDistribution,
  PerlinNoise1D,
  BezierTrajectory,
  FatigueTracker,
  HumanizerEngine,
  Point2D as EnginePoint2D,
} from '../../electron/engine/humanizer';
import {
  sampleStandardGaussian,
  sampleGaussian,
  sampleGaussianClamped,
  sampleGaussian2D,
  clamp,
  lerp,
  distance2D,
  quadraticBezier,
  cubicBezier,
  minimumJerk,
  easeHumanVelocity,
  fittsLawMovementTime,
  generateBezierPath,
  Point2D as MathPoint2D,
} from '../../src/utils/math';
import { HumanizerConfig } from '../../src/types/electron';

describe('Box-Muller Gaussian Distribution & Math Utilities', () => {
  describe('GaussianDistribution (electron/engine/humanizer.ts)', () => {
    it('generates standard normal distribution with mean ≈ 0 and stdDev ≈ 1', () => {
      const samples: number[] = [];
      const sampleCount = 5000;

      for (let i = 0; i < sampleCount; i++) {
        samples.push(GaussianDistribution.sampleStandard());
      }

      const mean = samples.reduce((sum, v) => sum + v, 0) / sampleCount;
      const variance = samples.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / sampleCount;
      const stdDev = Math.sqrt(variance);

      // Sample mean should be within 3 standard errors of 0 (SE = 1 / sqrt(5000) ≈ 0.014)
      expect(mean).toBeGreaterThan(-0.1);
      expect(mean).toBeLessThan(0.1);

      // Sample standard deviation should be close to 1.0 (approx [0.9, 1.1])
      expect(stdDev).toBeGreaterThan(0.9);
      expect(stdDev).toBeLessThan(1.1);
    });

    it('scales Gaussian distribution with specified mean and stdDev', () => {
      const targetMean = 150;
      const targetStdDev = 25;
      const samples: number[] = [];
      const sampleCount = 4000;

      for (let i = 0; i < sampleCount; i++) {
        samples.push(GaussianDistribution.sample(targetMean, targetStdDev));
      }

      const mean = samples.reduce((sum, v) => sum + v, 0) / sampleCount;
      const variance = samples.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / sampleCount;
      const stdDev = Math.sqrt(variance);

      expect(mean).toBeGreaterThan(targetMean - 4);
      expect(mean).toBeLessThan(targetMean + 4);
      expect(stdDev).toBeGreaterThan(targetStdDev - 4);
      expect(stdDev).toBeLessThan(targetStdDev + 4);
    });

    it('strictly clamps samples within [min, max] bounds via rejection sampling', () => {
      const min = 80;
      const max = 120;
      const mean = 100;
      const stdDev = 50;

      for (let i = 0; i < 1000; i++) {
        const val = GaussianDistribution.sampleClamped(mean, stdDev, min, max);
        expect(val).toBeGreaterThanOrEqual(min);
        expect(val).toBeLessThanOrEqual(max);
      }
    });

    it('handles inverted bounds where min >= max gracefully', () => {
      const val = GaussianDistribution.sampleClamped(100, 20, 50, 50);
      expect(val).toBe(50);

      const valInverted = GaussianDistribution.sampleClamped(100, 20, 80, 40);
      expect(valInverted).toBe(80);
    });

    it('generates 2D Gaussian offset vector bounded by maxRadius using Rayleigh distribution', () => {
      const maxRadius = 15;
      
      for (let i = 0; i < 1000; i++) {
        const { dx, dy } = GaussianDistribution.sample2D(maxRadius);
        const radius = Math.hypot(dx, dy);
        expect(radius).toBeLessThanOrEqual(maxRadius + 1.0);
      }

      // Edge case: maxRadius <= 0 returns (0, 0)
      const zeroOffset = GaussianDistribution.sample2D(0);
      expect(zeroOffset).toEqual({ dx: 0, dy: 0 });

      const negativeOffset = GaussianDistribution.sample2D(-5);
      expect(negativeOffset).toEqual({ dx: 0, dy: 0 });
    });
  });

  describe('Pure Math Utilities (src/utils/math.ts)', () => {
    it('sampleStandardGaussian & sampleGaussian adhere to normal distribution', () => {
      const samples: number[] = [];
      for (let i = 0; i < 3000; i++) {
        samples.push(sampleStandardGaussian());
      }
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(Math.abs(mean)).toBeLessThan(0.12);

      const scaled = sampleGaussian(50, 10);
      expect(typeof scaled).toBe('number');
      expect(Number.isFinite(scaled)).toBe(true);
    });

    it('sampleGaussianClamped guarantees minimum and maximum bounds', () => {
      for (let i = 0; i < 500; i++) {
        const val = sampleGaussianClamped(50, 30, 20, 80);
        expect(val).toBeGreaterThanOrEqual(20);
        expect(val).toBeLessThanOrEqual(80);
      }
    });

    it('sampleGaussian2D produces points within circle', () => {
      const radius = 25;
      for (let i = 0; i < 500; i++) {
        const pt = sampleGaussian2D(radius);
        expect(Math.hypot(pt.dx, pt.dy)).toBeLessThanOrEqual(radius + 1.0);
      }
      expect(sampleGaussian2D(0)).toEqual({ dx: 0, dy: 0 });
    });

    it('clamp and lerp functions calculate boundary values correctly', () => {
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(5, 10, 0)).toBe(10); // inverted bounds fallback

      expect(lerp(0, 100, 0)).toBe(0);
      expect(lerp(0, 100, 0.5)).toBe(50);
      expect(lerp(0, 100, 1)).toBe(100);
    });

    it('distance2D calculates exact Euclidean distance', () => {
      const p1: MathPoint2D = { x: 0, y: 0 };
      const p2: MathPoint2D = { x: 3, y: 4 };
      expect(distance2D(p1, p2)).toBe(5);

      const p3: MathPoint2D = { x: -10, y: 20 };
      const p4: MathPoint2D = { x: 2, y: 15 };
      expect(distance2D(p3, p4)).toBeCloseTo(13, 4);
    });

    it('quadraticBezier evaluates quadratic curve endpoints and midpoint', () => {
      const p0 = { x: 0, y: 0 };
      const p1 = { x: 50, y: 100 };
      const p2 = { x: 100, y: 0 };

      const start = quadraticBezier(p0, p1, p2, 0);
      expect(start.x).toBeCloseTo(0);
      expect(start.y).toBeCloseTo(0);

      const end = quadraticBezier(p0, p1, p2, 1);
      expect(end.x).toBeCloseTo(100);
      expect(end.y).toBeCloseTo(0);

      const mid = quadraticBezier(p0, p1, p2, 0.5);
      expect(mid.x).toBe(50);
      expect(mid.y).toBe(50); // 0.25*0 + 0.5*100 + 0.25*0 = 50
    });

    it('cubicBezier evaluates cubic curve endpoints accurately', () => {
      const p0 = { x: 10, y: 20 };
      const p1 = { x: 30, y: 80 };
      const p2 = { x: 70, y: 90 };
      const p3 = { x: 100, y: 200 };

      const start = cubicBezier(p0, p1, p2, p3, 0);
      expect(start.x).toBeCloseTo(10);
      expect(start.y).toBeCloseTo(20);

      const end = cubicBezier(p0, p1, p2, p3, 1);
      expect(end.x).toBeCloseTo(100);
      expect(end.y).toBeCloseTo(200);

      const mid = cubicBezier(p0, p1, p2, p3, 0.5);
      expect(mid.x).toBeGreaterThan(10);
      expect(mid.x).toBeLessThan(100);
      expect(mid.y).toBeGreaterThan(20);
      expect(mid.y).toBeLessThan(200);
    });

    it('minimumJerk velocity curve produces smooth bell-shaped S-curve from 0 to 1', () => {
      expect(minimumJerk(0)).toBe(0);
      expect(minimumJerk(1)).toBe(1);
      expect(minimumJerk(0.5)).toBe(0.5);

      // Clamping outside [0, 1]
      expect(minimumJerk(-0.5)).toBe(0);
      expect(minimumJerk(1.5)).toBe(1);

      // Monotonic progression
      let prev = 0;
      for (let t = 0.05; t <= 1.0; t += 0.05) {
        const curr = minimumJerk(t);
        expect(curr).toBeGreaterThanOrEqual(prev);
        prev = curr;
      }
    });

    it('easeHumanVelocity produces quintic S-curve easing', () => {
      expect(easeHumanVelocity(0)).toBe(0);
      expect(easeHumanVelocity(1)).toBe(1);
      expect(easeHumanVelocity(0.5)).toBe(0.5);

      expect(easeHumanVelocity(0.2)).toBeCloseTo(16 * Math.pow(0.2, 5), 5);
      expect(easeHumanVelocity(0.8)).toBeGreaterThan(0.8);
    });

    it('fittsLawMovementTime calculates expected index of difficulty and movement duration', () => {
      const mt1 = fittsLawMovementTime(100, 20);
      const mt2 = fittsLawMovementTime(400, 20);
      const mt3 = fittsLawMovementTime(400, 10);

      // Higher distance -> longer movement time
      expect(mt2).toBeGreaterThan(mt1);
      // Smaller target width (higher precision) -> longer movement time
      expect(mt3).toBeGreaterThan(mt2);

      // Edge case: zero or negative distance
      expect(fittsLawMovementTime(0, 20)).toBe(50);
      expect(fittsLawMovementTime(100, 0)).toBe(50);
    });

    it('generateBezierPath generates realistic human trajectory points', () => {
      const start = { x: 100, y: 100 };
      const target = { x: 800, y: 600 };

      const path = generateBezierPath(start, target, {
        speedMultiplier: 4,
        smoothness: 0.7,
        addTremor: true,
      });

      expect(path.length).toBeGreaterThanOrEqual(8);
      // Final point must match target exactly
      expect(path[path.length - 1].x).toBe(target.x);
      expect(path[path.length - 1].y).toBe(target.y);

      // Delays must be positive
      path.forEach((pt) => {
        expect(pt.delayMs).toBeGreaterThan(0);
      });

      // Short distance fallback (distance < 2)
      const shortPath = generateBezierPath({ x: 50, y: 50 }, { x: 51, y: 50 });
      expect(shortPath).toEqual([{ x: 51, y: 50, delayMs: 1 }]);
    });
  });

  describe('PerlinNoise1D (electron/engine/humanizer.ts)', () => {
    it('is deterministic for identical seeds', () => {
      const perlinA = new PerlinNoise1D(12345);
      const perlinB = new PerlinNoise1D(12345);

      for (let x = 0; x < 50; x += 0.5) {
        expect(perlinA.noise(x)).toBe(perlinB.noise(x));
        expect(perlinA.octaveNoise(x, 4)).toBe(perlinB.octaveNoise(x, 4));
      }
    });

    it('produces continuous and smooth gradient values', () => {
      const perlin = new PerlinNoise1D(42);
      const step = 0.01;
      let maxDiff = 0;

      for (let x = 0; x < 10; x += step) {
        const val1 = perlin.noise(x);
        const val2 = perlin.noise(x + step);
        const diff = Math.abs(val2 - val1);
        if (diff > maxDiff) maxDiff = diff;
      }

      // Smooth gradient noise step differences should be small
      expect(maxDiff).toBeLessThan(0.08);
    });

    it('octaveNoise normalizes outputs within roughly [-1, 1]', () => {
      const perlin = new PerlinNoise1D(999);
      for (let x = 0; x < 100; x += 1.25) {
        const sample = perlin.octaveNoise(x, 3, 0.5);
        expect(sample).toBeGreaterThanOrEqual(-1.5);
        expect(sample).toBeLessThanOrEqual(1.5);
      }
    });
  });

  describe('BezierTrajectory (electron/engine/humanizer.ts)', () => {
    it('evaluates cubic Bézier curve at endpoints and intermediate intervals', () => {
      const p0: EnginePoint2D = { x: 0, y: 0 };
      const p1: EnginePoint2D = { x: 25, y: 50 };
      const p2: EnginePoint2D = { x: 75, y: 50 };
      const p3: EnginePoint2D = { x: 100, y: 100 };

      const start = BezierTrajectory.cubicBezier(p0, p1, p2, p3, 0);
      expect(start.x).toBeCloseTo(0);
      expect(start.y).toBeCloseTo(0);

      const end = BezierTrajectory.cubicBezier(p0, p1, p2, p3, 1);
      expect(end.x).toBeCloseTo(100);
      expect(end.y).toBeCloseTo(100);

      const mid = BezierTrajectory.cubicBezier(p0, p1, p2, p3, 0.5);
      expect(mid.x).toBe(50);
      expect(mid.y).toBe(50);
    });

    it('minimumJerk calculates smooth acceleration and deceleration polynomial', () => {
      expect(BezierTrajectory.minimumJerk(0)).toBe(0);
      expect(BezierTrajectory.minimumJerk(1)).toBe(1);
      expect(BezierTrajectory.minimumJerk(0.5)).toBe(0.5);
      expect(BezierTrajectory.minimumJerk(-0.1)).toBe(0);
      expect(BezierTrajectory.minimumJerk(1.1)).toBe(1);
    });

    it('generatePath creates human-like trajectory ending precisely at target', () => {
      const start: EnginePoint2D = { x: 200, y: 300 };
      const target: EnginePoint2D = { x: 800, y: 700 };

      const points = BezierTrajectory.generatePath(start, target, 5);

      expect(points.length).toBeGreaterThanOrEqual(8);
      expect(points[points.length - 1].x).toBe(target.x);
      expect(points[points.length - 1].y).toBe(target.y);

      // Short distance jump handling
      const shortJump = BezierTrajectory.generatePath({ x: 10, y: 10 }, { x: 11, y: 10 });
      expect(shortJump).toEqual([{ x: 11, y: 10, delayMs: 1 }]);
    });
  });

  describe('FatigueTracker & Biometric Micro-Recovery', () => {
    let tracker: FatigueTracker;

    beforeEach(() => {
      tracker = new FatigueTracker();
      tracker.reset();
    });

    it('initializes with 0 fatigue factor', () => {
      expect(tracker.getFatigueFactor()).toBe(0.0);
    });

    it('accumulates fatigue with successive clicks up to 1.0 maximum', () => {
      for (let i = 0; i < 50; i++) {
        tracker.recordClick();
      }
      const fatigueAfter50 = tracker.getFatigueFactor();
      expect(fatigueAfter50).toBeGreaterThan(0);

      for (let i = 0; i < 5000; i++) {
        tracker.recordClick();
      }
      expect(tracker.getFatigueFactor()).toBeLessThanOrEqual(1.0);
    });

    it('recovers exponentially when recording a rest break', () => {
      for (let i = 0; i < 200; i++) {
        tracker.recordClick();
      }
      const tired = tracker.getFatigueFactor();
      expect(tired).toBeGreaterThan(0.05);

      // 3-second break
      tracker.recordBreak(3000);
      const recovered = tracker.getFatigueFactor();
      expect(recovered).toBeLessThan(tired);
    });

    it('computes fatigue delay multiplier accurately', () => {
      expect(tracker.getFatigueMultiplier(1.0)).toBe(1.0); // at 0 fatigue

      // Force high fatigue
      for (let i = 0; i < 1000; i++) {
        tracker.recordClick();
      }

      const mult = tracker.getFatigueMultiplier(1.0);
      expect(mult).toBeGreaterThan(1.0);
      expect(mult).toBeLessThanOrEqual(1.28); // Up to +28% penalty
    });

    it('resets all state upon calling reset()', () => {
      for (let i = 0; i < 100; i++) tracker.recordClick();
      expect(tracker.getFatigueFactor()).toBeGreaterThan(0);

      tracker.reset();
      expect(tracker.getFatigueFactor()).toBe(0);
    });
  });

  describe('HumanizerEngine Unified Manager', () => {
    let engine: HumanizerEngine;

    beforeEach(() => {
      engine = new HumanizerEngine();
      engine.reset();
    });

    const baseConfig: HumanizerConfig = {
      enabled: true,
      distribution: 'gaussian',
      timingVariancePercent: 20,
      jitterRadius: 5,
      fatigueEnabled: true,
      fatigueFactor: 0.5,
      microBreaks: true,
      microBreakIntervalSec: 15,
      bezierMovement: true,
      movementSpeed: 5,
      antiDetectionNoise: true,
    };

    it('returns exact base interval when humanizer is disabled', () => {
      const interval = engine.calculateNextInterval(100, {
        ...baseConfig,
        enabled: false,
      });
      expect(interval).toBe(100);

      const tinyInterval = engine.calculateNextInterval(0.05, baseConfig);
      expect(tinyInterval).toBe(0.05);
    });

    it('calculates interval with Gaussian jitter within variance range', () => {
      const baseMs = 100;
      const variancePercent = 25;
      const samples: number[] = [];

      for (let i = 0; i < 1000; i++) {
        const next = engine.calculateNextInterval(baseMs, {
          ...baseConfig,
          fatigueEnabled: false,
          distribution: 'gaussian',
          timingVariancePercent: variancePercent,
        });
        samples.push(next);
        expect(next).toBeGreaterThanOrEqual(75);
        expect(next).toBeLessThanOrEqual(125);
      }

      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(mean).toBeGreaterThan(95);
      expect(mean).toBeLessThan(105);
    });

    it('calculates interval with Perlin noise distribution', () => {
      const baseMs = 100;
      for (let i = 0; i < 100; i++) {
        const next = engine.calculateNextInterval(baseMs, {
          ...baseConfig,
          fatigueEnabled: false,
          distribution: 'perlin',
          timingVariancePercent: 20,
        });
        expect(next).toBeGreaterThanOrEqual(79);
        expect(next).toBeLessThanOrEqual(121);
      }
    });

    it('calculates interval with Uniform distribution', () => {
      const baseMs = 50;
      for (let i = 0; i < 100; i++) {
        const next = engine.calculateNextInterval(baseMs, {
          ...baseConfig,
          fatigueEnabled: false,
          distribution: 'uniform',
          timingVariancePercent: 30,
        });
        expect(next).toBeGreaterThanOrEqual(35);
        expect(next).toBeLessThanOrEqual(65);
      }
    });

    it('calculates jittered screen positions within radius', () => {
      const baseX = 500;
      const baseY = 400;

      // Disabled jitter
      const exact = engine.calculateTargetPosition(baseX, baseY, {
        ...baseConfig,
        jitterRadius: 0,
      });
      expect(exact).toEqual({ x: baseX, y: baseY });

      // Gaussian 2D jitter
      for (let i = 0; i < 200; i++) {
        const pos = engine.calculateTargetPosition(baseX, baseY, {
          ...baseConfig,
          distribution: 'gaussian',
          jitterRadius: 8,
        });
        const dist = Math.hypot(pos.x - baseX, pos.y - baseY);
        expect(dist).toBeLessThanOrEqual(8.5);
      }

      // Perlin jitter
      for (let i = 0; i < 50; i++) {
        const pos = engine.calculateTargetPosition(baseX, baseY, {
          ...baseConfig,
          distribution: 'perlin',
          jitterRadius: 10,
        });
        const dist = Math.hypot(pos.x - baseX, pos.y - baseY);
        expect(dist).toBeLessThanOrEqual(10.5);
      }

      // Uniform jitter
      for (let i = 0; i < 50; i++) {
        const pos = engine.calculateTargetPosition(baseX, baseY, {
          ...baseConfig,
          distribution: 'uniform',
          jitterRadius: 12,
        });
        const dist = Math.hypot(pos.x - baseX, pos.y - baseY);
        expect(dist).toBeLessThanOrEqual(12.5);
      }
    });

    it('generates direct jump when bezierMovement is disabled', () => {
      const start = { x: 10, y: 20 };
      const target = { x: 100, y: 200 };

      const trajectory = engine.generateTrajectory(start, target, {
        ...baseConfig,
        bezierMovement: false,
      });

      expect(trajectory).toEqual([{ x: target.x, y: target.y, delayMs: 1 }]);
    });

    it('generates full Bezier trajectory when bezierMovement is enabled', () => {
      const start = { x: 100, y: 100 };
      const target = { x: 600, y: 500 };

      const trajectory = engine.generateTrajectory(start, target, {
        ...baseConfig,
        bezierMovement: true,
        movementSpeed: 6,
      });

      expect(trajectory.length).toBeGreaterThan(1);
      expect(trajectory[trajectory.length - 1].x).toBe(target.x);
      expect(trajectory[trajectory.length - 1].y).toBe(target.y);
    });

    it('checkMicroBreak returns 0 when microBreaks is disabled', () => {
      const pause = engine.checkMicroBreak({
        ...baseConfig,
        microBreaks: false,
      });
      expect(pause).toBe(0);
    });
  });
});
