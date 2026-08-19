/**
 * HyperClick Pro 2026 - Mathematical & Biometric Algorithms Utility
 * Core mathematical engine powering:
 * - Box-Muller Gaussian random sampling & Rayleigh 2D jitter
 * - Cubic & Quadratic Bézier curves with minimum-jerk velocity profiles
 * - Fitts's Law human motor movement modeling
 * - Vector distance, clamping, and interpolation utilities
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface TrajectoryPoint extends Point2D {
  delayMs: number;
}

export interface BezierPathOptions {
  speedMultiplier?: number;
  smoothness?: number;
  addTremor?: boolean;
}

/**
 * Generates a standard normal random variable N(0, 1) using the Box-Muller transform.
 * Caches the spare generated value for optimal 2x performance.
 */
let spareBoxMuller: number | null = null;

export function sampleStandardGaussian(): number {
  if (spareBoxMuller !== null) {
    const val = spareBoxMuller;
    spareBoxMuller = null;
    return val;
  }

  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();

  const radius = Math.sqrt(-2.0 * Math.log(u));
  const theta = 2.0 * Math.PI * v;

  spareBoxMuller = radius * Math.sin(theta);
  return radius * Math.cos(theta);
}

/**
 * Samples a Gaussian random variable with given mean and standard deviation.
 */
export function sampleGaussian(mean = 0, stdDev = 1): number {
  return mean + sampleStandardGaussian() * stdDev;
}

/**
 * Samples a Gaussian random variable clamped strictly between [min, max].
 * Implements rejection sampling with fallback clamping for extreme ranges.
 */
export function sampleGaussianClamped(mean: number, stdDev: number, min: number, max: number): number {
  if (min >= max) return min;
  let attempts = 0;
  let val: number;
  do {
    val = sampleGaussian(mean, stdDev);
    attempts++;
    if (attempts > 10) {
      return Math.max(min, Math.min(max, val));
    }
  } while (val < min || val > max);

  return val;
}

/**
 * Generates a 2D Gaussian offset vector bounded within maxRadius using Rayleigh distribution.
 */
export function sampleGaussian2D(maxRadius: number): { dx: number; dy: number } {
  if (maxRadius <= 0) return { dx: 0, dy: 0 };

  const sigma = maxRadius / 3.0;
  let u = Math.random();
  while (u === 0) u = Math.random();

  const r = Math.min(maxRadius, sigma * Math.sqrt(-2.0 * Math.log(u)));
  const theta = Math.random() * 2.0 * Math.PI;

  let dx = Math.round(r * Math.cos(theta));
  let dy = Math.round(r * Math.sin(theta));
  const dist = Math.hypot(dx, dy);
  if (dist > maxRadius && dist > 0) {
    const scale = maxRadius / dist;
    dx = Math.round(dx * scale);
    dy = Math.round(dy * scale);
  }

  return { dx, dy };
}

/**
 * Clamps a numerical value between min and max.
 */
export function clamp(val: number, min: number, max: number): number {
  if (min > max) return min;
  return Math.max(min, Math.min(max, val));
}

/**
 * Linear interpolation between a and b at t in [0, 1].
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Calculates Euclidean distance between two 2D points.
 */
export function distance2D(p1: Point2D, p2: Point2D): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Evaluates a 2nd-order Quadratic Bézier curve at parameter t in [0, 1].
 */
export function quadraticBezier(p0: Point2D, p1: Point2D, p2: Point2D, t: number): Point2D {
  const clampedT = clamp(t, 0, 1);
  const u = 1 - clampedT;
  const x = u * u * p0.x + 2 * u * clampedT * p1.x + clampedT * clampedT * p2.x;
  const y = u * u * p0.y + 2 * u * clampedT * p1.y + clampedT * clampedT * p2.y;
  return { x, y };
}

/**
 * Evaluates a 3rd-order Cubic Bézier curve at parameter t in [0, 1].
 */
export function cubicBezier(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number): Point2D {
  const clampedT = clamp(t, 0, 1);
  const u = 1 - clampedT;
  const tt = clampedT * clampedT;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * clampedT;

  const x = uuu * p0.x + 3 * uu * clampedT * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
  const y = uuu * p0.y + 3 * uu * clampedT * p1.y + 3 * u * tt * p2.y + ttt * p3.y;

  return { x, y };
}

/**
 * Minimum Jerk Velocity Curve t -> t' (produces bell-shaped human velocity profile)
 * Formula: 10*t^3 - 15*t^4 + 6*t^5
 */
export function minimumJerk(t: number): number {
  const clamped = clamp(t, 0, 1);
  const t3 = clamped * clamped * clamped;
  const t4 = t3 * clamped;
  const t5 = t4 * clamped;
  return 10 * t3 - 15 * t4 + 6 * t5;
}

/**
 * Human motor velocity profile easing (Quintic S-curve).
 */
export function easeHumanVelocity(t: number): number {
  const clamped = clamp(t, 0, 1);
  if (clamped < 0.5) {
    return 16 * Math.pow(clamped, 5);
  } else {
    return 1 - Math.pow(-2 * clamped + 2, 5) / 2;
  }
}

/**
 * Fitts's Law Movement Time estimator: MT = a + b * log2(2 * D / W)
 * D = distance to target, W = target width / tolerance
 */
export function fittsLawMovementTime(distance: number, targetWidth = 20, a = 50, b = 100): number {
  if (distance <= 0 || targetWidth <= 0) return a;
  const indexDifficulty = Math.log2((2 * distance) / targetWidth);
  return Math.max(a, a + b * Math.max(0, indexDifficulty));
}

/**
 * Generates an organic Bézier trajectory between start and target points.
 */
export function generateBezierPath(
  start: Point2D,
  target: Point2D,
  options: BezierPathOptions = {}
): TrajectoryPoint[] {
  const speedMultiplier = options.speedMultiplier || 5;
  const smoothness = options.smoothness ?? 0.65;
  const addTremor = options.addTremor ?? true;

  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 2) {
    return [{ x: target.x, y: target.y, delayMs: 1 }];
  }

  const baseDurationMs = Math.max(25, Math.min(500, dist / (speedMultiplier * 0.8)));
  const stepCount = Math.max(8, Math.min(60, Math.floor(dist / 12)));

  const perpX = -dy / dist;
  const perpY = dx / dist;

  const curvatureFactor = (Math.random() - 0.48) * Math.min(120, dist * 0.35 * smoothness);
  const p1Dist = 0.25 + Math.random() * 0.15;
  const p2Dist = 0.70 + Math.random() * 0.15;

  const p1: Point2D = {
    x: start.x + dx * p1Dist + perpX * curvatureFactor * 0.9,
    y: start.y + dy * p1Dist + perpY * curvatureFactor * 0.9,
  };

  const overshootFactor = (Math.random() - 0.5) * (dist * 0.08);
  const p2: Point2D = {
    x: start.x + dx * p2Dist + perpX * curvatureFactor * 0.4 + (dx / dist) * overshootFactor,
    y: start.y + dy * p2Dist + perpY * curvatureFactor * 0.4 + (dy / dist) * overshootFactor,
  };

  const points: TrajectoryPoint[] = [];
  const stepTimeMs = baseDurationMs / stepCount;

  const tremorFreq = 8 + Math.random() * 4;
  const tremorAmp = addTremor ? Math.min(1.5, dist * 0.015) : 0;
  const tremorPhase = Math.random() * Math.PI * 2;

  for (let i = 1; i <= stepCount; i++) {
    const rawT = i / stepCount;
    const smoothT = minimumJerk(rawT);
    const pos = cubicBezier(start, p1, p2, target, smoothT);

    const currentProgress = (i * stepTimeMs) / 1000;
    const tremor = Math.sin(2 * Math.PI * tremorFreq * currentProgress + tremorPhase) * tremorAmp * (1 - rawT);

    const finalX = Math.round(pos.x + perpX * tremor);
    const finalY = Math.round(pos.y + perpY * tremor);
    const jitteredDelay = Math.max(1, Math.round(stepTimeMs + (Math.random() - 0.5) * 2));

    points.push({
      x: finalX,
      y: finalY,
      delayMs: jitteredDelay,
    });
  }

  if (points.length > 0) {
    points[points.length - 1].x = target.x;
    points[points.length - 1].y = target.y;
  }

  return points;
}
