/**
 * HyperClick Pro 2026 - Humanizer Engine
 * Advanced biometric simulation engine featuring:
 * - Box-Muller Gaussian jitter distribution
 * - Perlin 1D gradient noise for organic variance
 * - Cubic & Quartic Bézier trajectory generation with minimum-jerk velocity curves
 * - Neuromuscular micro-tremor simulation (~8-12 Hz)
 * - Fitts's Law micro-fatigue and cognitive recovery modeling
 * - Stochastic micro-break and burst interval synthesis
 */

import { HumanizerConfig, JitterDistribution } from '../../src/types/electron';

export interface Point2D {
  x: number;
  y: number;
}

export interface TrajectoryPoint extends Point2D {
  delayMs: number;
}

export class GaussianDistribution {
  private static hasSpare = false;
  private static spareValue = 0;

  /**
   * Generates a standard normal random variable N(0, 1) via the Box-Muller transform.
   */
  public static sampleStandard(): number {
    if (this.hasSpare) {
      this.hasSpare = false;
      return this.spareValue;
    }

    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random(); // Converting (0, 1] interval
    while (v === 0) v = Math.random();

    const radius = Math.sqrt(-2.0 * Math.log(u));
    const theta = 2.0 * Math.PI * v;

    this.spareValue = radius * Math.sin(theta);
    this.hasSpare = true;

    return radius * Math.cos(theta);
  }

  /**
   * Samples a Gaussian random variable with specified mean and standard deviation.
   */
  public static sample(mean: number, stdDev: number): number {
    return mean + this.sampleStandard() * stdDev;
  }

  /**
   * Samples a Gaussian random variable clamped strictly between min and max.
   */
  public static sampleClamped(mean: number, stdDev: number, min: number, max: number): number {
    if (min >= max) return min;
    let sampled: number;
    let attempts = 0;
    do {
      sampled = this.sample(mean, stdDev);
      attempts++;
      if (attempts > 10) {
        // Fallback clamp if variance is extreme
        return Math.max(min, Math.min(max, sampled));
      }
    } while (sampled < min || sampled > max);

    return sampled;
  }

  /**
   * Generates a 2D circular Gaussian offset vector using Rayleigh radius and uniform angle.
   */
  public static sample2D(maxRadius: number): { dx: number; dy: number } {
    if (maxRadius <= 0) return { dx: 0, dy: 0 };
    
    // Rayleigh distribution for radial distance (stdDev = maxRadius / 3 so 99.7% falls within maxRadius)
    const sigma = maxRadius / 3.0;
    let u = Math.random();
    while (u === 0) u = Math.random();
    
    const r = Math.min(maxRadius, sigma * Math.sqrt(-2.0 * Math.log(u)));
    const theta = Math.random() * 2.0 * Math.PI;

    return {
      dx: Math.round(r * Math.cos(theta)),
      dy: Math.round(r * Math.sin(theta)),
    };
  }
}

/**
 * 1D Perlin Noise for smooth, organic multi-octave timing fluctuations
 */
export class PerlinNoise1D {
  private permutation: number[];

  constructor(seed = Math.random()) {
    this.permutation = [];
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p[i] = i;

    // Fisher-Yates shuffle with seed
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }

    for (let i = 0; i < 512; i++) {
      this.permutation[i] = p[i & 255];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private grad(hash: number, x: number): number {
    return (hash & 1) === 0 ? x : -x;
  }

  public noise(x: number): number {
    const xi = Math.floor(x) & 255;
    const xf = x - Math.floor(x);
    const u = this.fade(xf);

    const g0 = this.grad(this.permutation[xi], xf);
    const g1 = this.grad(this.permutation[xi + 1], xf - 1);

    return (1 - u) * g0 + u * g1;
  }

  public octaveNoise(x: number, octaves = 3, persistence = 0.5): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}

/**
 * Natural Human Bézier Trajectory Synthesizer
 */
export class BezierTrajectory {
  /**
   * Evaluates cubic Bézier curve at parameter t in [0, 1]
   */
  public static cubicBezier(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number): Point2D {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
    const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;

    return { x, y };
  }

  /**
   * Minimum Jerk Velocity Curve t -> t' (produces bell-shaped human velocity profile)
   * Poly: 10 t^3 - 15 t^4 + 6 t^5
   */
  public static minimumJerk(t: number): number {
    const clamped = Math.max(0, Math.min(1, t));
    const t3 = clamped * clamped * clamped;
    const t4 = t3 * clamped;
    const t5 = t4 * clamped;
    return 10 * t3 - 15 * t4 + 6 * t5;
  }

  /**
   * Synthesizes realistic mouse movement path from start to target.
   */
  public static generatePath(
    start: Point2D,
    target: Point2D,
    speedMultiplier = 5
  ): TrajectoryPoint[] {
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 2) {
      return [{ x: target.x, y: target.y, delayMs: 1 }];
    }

    // Determine number of movement steps based on distance & speed
    const baseDurationMs = Math.max(25, Math.min(500, (distance / (speedMultiplier * 0.8))));
    const stepCount = Math.max(8, Math.min(60, Math.floor(distance / 12)));

    // Calculate perpendicular offset for human hand arc curvature
    const perpX = -dy / distance;
    const perpY = dx / distance;

    // Curvature deviation (sway) proportional to distance
    const curvatureFactor = (Math.random() - 0.48) * Math.min(120, distance * 0.35);
    const p1Dist = 0.25 + (Math.random() * 0.15);
    const p2Dist = 0.70 + (Math.random() * 0.15);

    // Control point 1
    const p1: Point2D = {
      x: start.x + dx * p1Dist + perpX * curvatureFactor * 0.9,
      y: start.y + dy * p1Dist + perpY * curvatureFactor * 0.9,
    };

    // Control point 2 (includes slight overshoot / correction)
    const overshootFactor = (Math.random() - 0.5) * (distance * 0.08);
    const p2: Point2D = {
      x: start.x + dx * p2Dist + perpX * curvatureFactor * 0.4 + (dx / distance) * overshootFactor,
      y: start.y + dy * p2Dist + perpY * curvatureFactor * 0.4 + (dy / distance) * overshootFactor,
    };

    const points: TrajectoryPoint[] = [];
    const stepTimeMs = baseDurationMs / stepCount;

    // High frequency neuromuscular micro-tremor parameters (~10Hz)
    const tremorFreq = 8 + Math.random() * 4;
    const tremorAmp = Math.min(1.5, distance * 0.015);
    const tremorPhase = Math.random() * Math.PI * 2;

    for (let i = 1; i <= stepCount; i++) {
      const rawT = i / stepCount;
      const smoothT = this.minimumJerk(rawT);
      const pos = this.cubicBezier(start, p1, p2, target, smoothT);

      // Add neuromuscular micro-tremor perpendicular to path
      const currentProgress = (i * stepTimeMs) / 1000;
      const tremor = Math.sin(2 * Math.PI * tremorFreq * currentProgress + tremorPhase) * tremorAmp * (1 - rawT);

      const finalX = Math.round(pos.x + perpX * tremor);
      const finalY = Math.round(pos.y + perpY * tremor);

      // Micro variance in frame delay
      const jitteredDelay = Math.max(1, Math.round(stepTimeMs + (Math.random() - 0.5) * 2));

      points.push({
        x: finalX,
        y: finalY,
        delayMs: jitteredDelay,
      });
    }

    // Ensure final point is exact target
    if (points.length > 0) {
      points[points.length - 1].x = target.x;
      points[points.length - 1].y = target.y;
    }

    return points;
  }
}

/**
 * Biometric Fatigue & Micro-Recovery State Tracker
 */
export class FatigueTracker {
  private continuousClicks = 0;
  private startTime = Date.now();
  private lastBreakTime = Date.now();
  private fatigueFactor = 0.0; // 0.0 (fresh) to 1.0 (exhausted)

  public reset(): void {
    this.continuousClicks = 0;
    this.startTime = Date.now();
    this.lastBreakTime = Date.now();
    this.fatigueFactor = 0.0;
  }

  public recordClick(): void {
    this.continuousClicks++;
    // Subtle logarithmic fatigue accumulation
    const elapsedMinutes = (Date.now() - this.startTime) / 60000;
    this.fatigueFactor = Math.min(1.0, (Math.log1p(this.continuousClicks / 100) * 0.15) + (elapsedMinutes * 0.05));
  }

  public recordBreak(breakDurationMs: number): void {
    // Exponential recovery during rest
    const recoveryMultiplier = Math.exp(-breakDurationMs / 1000);
    this.fatigueFactor = Math.max(0.0, this.fatigueFactor * recoveryMultiplier);
    this.lastBreakTime = Date.now();
  }

  public getFatigueFactor(): number {
    return this.fatigueFactor;
  }

  public shouldTriggerMicroBreak(intervalSec: number): boolean {
    const timeSinceLastBreak = (Date.now() - this.lastBreakTime) / 1000;
    if (timeSinceLastBreak >= intervalSec) {
      // Natural randomness in break interval
      return Math.random() < 0.75;
    }
    return false;
  }

  /**
   * Computes human fatigue delay penalty
   */
  public getFatigueMultiplier(configuredStrength: number): number {
    // At max fatigue (1.0) and configuredStrength (1.0), interval increases by up to 28%
    return 1.0 + (this.fatigueFactor * configuredStrength * 0.28);
  }
}

/**
 * Unified Humanizer Engine Manager
 */
export class HumanizerEngine {
  private perlin = new PerlinNoise1D();
  private fatigue = new FatigueTracker();
  private noiseStep = 0;

  public reset(): void {
    this.fatigue.reset();
    this.noiseStep = Math.random() * 100;
  }

  public recordClick(): void {
    this.fatigue.recordClick();
  }

  public recordBreak(durationMs: number): void {
    this.fatigue.recordBreak(durationMs);
  }

  public getFatigueFactor(): number {
    return this.fatigue.getFatigueFactor();
  }

  /**
   * Calculates next click interval with full Gaussian jitter, Perlin undulation, and fatigue drift.
   */
  public calculateNextInterval(baseIntervalMs: number, config: HumanizerConfig): number {
    if (!config.enabled || baseIntervalMs <= 0.1) {
      return baseIntervalMs;
    }

    this.noiseStep += 0.08;
    let interval = baseIntervalMs;

    // 1. Fatigue drift
    if (config.fatigueEnabled) {
      const fatigueMult = this.fatigue.getFatigueMultiplier(config.fatigueFactor);
      interval *= fatigueMult;
    }

    // 2. Timing Variance
    const variancePercent = Math.max(0, Math.min(90, config.timingVariancePercent));
    if (variancePercent > 0) {
      const maxDelta = (baseIntervalMs * variancePercent) / 100.0;
      
      switch (config.distribution) {
        case 'gaussian': {
          const stdDev = maxDelta / 2.8; // ~99% within variance range
          const jitter = GaussianDistribution.sampleClamped(0, stdDev, -maxDelta, maxDelta);
          interval += jitter;
          break;
        }
        case 'perlin': {
          const noiseSample = this.perlin.octaveNoise(this.noiseStep);
          interval += noiseSample * maxDelta;
          break;
        }
        case 'uniform':
        default: {
          const jitter = (Math.random() * 2 - 1) * maxDelta;
          interval += jitter;
          break;
        }
      }
    }

    // Prevent impossible non-positive interval
    return Math.max(0.1, interval);
  }

  /**
   * Calculates jittered target screen position.
   */
  public calculateTargetPosition(baseX: number, baseY: number, config: HumanizerConfig): Point2D {
    if (!config.enabled || config.jitterRadius <= 0) {
      return { x: baseX, y: baseY };
    }

    switch (config.distribution) {
      case 'gaussian': {
        const offset = GaussianDistribution.sample2D(config.jitterRadius);
        return {
          x: baseX + offset.dx,
          y: baseY + offset.dy,
        };
      }
      case 'perlin': {
        const angle = this.perlin.noise(this.noiseStep * 1.5) * Math.PI * 2;
        const radius = Math.abs(this.perlin.noise(this.noiseStep * 0.7)) * config.jitterRadius;
        return {
          x: Math.round(baseX + Math.cos(angle) * radius),
          y: Math.round(baseY + Math.sin(angle) * radius),
        };
      }
      case 'uniform':
      default: {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * config.jitterRadius;
        return {
          x: Math.round(baseX + Math.cos(angle) * r),
          y: Math.round(baseY + Math.sin(angle) * r),
        };
      }
    }
  }

  /**
   * Generates a Bézier mouse motion trajectory if enabled, otherwise direct jump.
   */
  public generateTrajectory(
    currentPos: Point2D,
    targetPos: Point2D,
    config: HumanizerConfig
  ): TrajectoryPoint[] {
    if (!config.enabled || !config.bezierMovement) {
      return [{ x: targetPos.x, y: targetPos.y, delayMs: 1 }];
    }

    return BezierTrajectory.generatePath(currentPos, targetPos, config.movementSpeed || 5);
  }

  /**
   * Checks if a natural human micro-break pause should occur.
   * Returns break duration in ms, or 0 if no break.
   */
  public checkMicroBreak(config: HumanizerConfig): number {
    if (!config.enabled || !config.microBreaks) {
      return 0;
    }

    const intervalSec = Math.max(5, config.microBreakIntervalSec || 25);
    if (this.fatigue.shouldTriggerMicroBreak(intervalSec)) {
      // Natural pause duration: 75ms to 280ms Gaussian distributed
      const breakMs = Math.round(GaussianDistribution.sampleClamped(150, 45, 65, 320));
      this.recordBreak(breakMs);
      return breakMs;
    }

    return 0;
  }
}
