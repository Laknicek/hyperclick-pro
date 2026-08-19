import React, { useState, useEffect, useRef } from 'react';
import {
  Crosshair,
  Eye,
  Sliders,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Target,
  Layers,
  Clock,
  Radar,
  Radio,
  SlidersHorizontal,
  Flame,
  Pipette,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  PixelTriggerConfig,
  PixelTriggerCondition,
  PixelTriggerAction,
  PixelClickCoordinateMode,
  RgbColor,
  createDefaultPixelTriggerConfig,
} from '../types/clicker';
import {
  pixelDetector,
  PixelCheckResult,
  PixelTriggerEvent,
  PixelDetectorStatus,
  PixelDetector,
} from '../services/pixelDetector';
import { soundEngine } from '../services/soundEngine';
import { cn } from '../utils/cn';

interface PixelTriggerPanelProps {
  initialConfig?: PixelTriggerConfig;
  onConfigChange?: (config: PixelTriggerConfig) => void;
  className?: string;
}

export const PixelTriggerPanel: React.FC<PixelTriggerPanelProps> = ({
  initialConfig,
  onConfigChange,
  className,
}) => {
  // ----------------------------------------------------
  // State
  // ----------------------------------------------------
  const [config, setConfig] = useState<PixelTriggerConfig>(
    initialConfig || createDefaultPixelTriggerConfig()
  );
  const [detectorStatus, setDetectorStatus] = useState<PixelDetectorStatus>(
    pixelDetector.getStatus()
  );
  const [latestCheck, setLatestCheck] = useState<PixelCheckResult | null>(null);
  const [triggerHistory, setTriggerHistory] = useState<PixelTriggerEvent[]>([]);
  const [isPickingPixel, setIsPickingPixel] = useState<boolean>(false);
  const [testSimulatedHex, setTestSimulatedHex] = useState<string>(config.expectedColorHex);
  const [isSimulatingColor, setIsSimulatingColor] = useState<boolean>(false);

  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const latestCheckRef = useRef<PixelCheckResult | null>(null);
  const detectorStatusRef = useRef<PixelDetectorStatus>(detectorStatus);

  // Keep refs in sync for the continuous 60fps radar render loop
  useEffect(() => {
    latestCheckRef.current = latestCheck;
  }, [latestCheck]);

  useEffect(() => {
    detectorStatusRef.current = detectorStatus;
  }, [detectorStatus]);

  // ----------------------------------------------------
  // Sync & Event Subscriptions
  // ----------------------------------------------------
  useEffect(() => {
    const unsubscribe = pixelDetector.addListener({
      onPixelChecked: (result) => {
        setLatestCheck(result);
      },
      onTriggerFired: (event) => {
        setTriggerHistory((prev) => [event, ...prev].slice(0, 50));
      },
      onStatusChange: (status) => {
        setDetectorStatus(status);
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateConfig = (updates: Partial<PixelTriggerConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    pixelDetector.updateConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handleColorHexChange = (hex: string) => {
    const rgb = PixelDetector.hexToRgb(hex);
    updateConfig({
      expectedColorHex: hex,
      expectedColorRgb: rgb,
    });
  };

  const handleToggleDetector = () => {
    soundEngine.playClick('kailh-box-white');
    if (detectorStatus.isActive) {
      pixelDetector.stop();
      updateConfig({ enabled: false });
    } else {
      pixelDetector.start({ ...config, enabled: true });
      updateConfig({ enabled: true });
    }
  };

  // ----------------------------------------------------
  // Screen Pixel Picker
  // ----------------------------------------------------
  const handlePickScreenPixel = async () => {
    soundEngine.playClick('cyber-laser');
    setIsPickingPixel(true);

    if (typeof window !== 'undefined' && (window as any).electronAPI?.pickCoordinates) {
      try {
        const result = await (window as any).electronAPI.pickCoordinates();
        if (result && !result.canceled) {
          const updates: Partial<PixelTriggerConfig> = {
            targetX: result.x,
            targetY: result.y,
          };
          if (result.colorHex) {
            updates.expectedColorHex = result.colorHex;
            updates.expectedColorRgb = PixelDetector.hexToRgb(result.colorHex);
          }
          updateConfig(updates);
          soundEngine.playClick('bubble-pop');
        }
      } catch {
        // Ignored
      } finally {
        setIsPickingPixel(false);
      }
    } else {
      // Browser preview simulated coordinate pick
      setTimeout(() => {
        const simulatedX = Math.round(300 + Math.random() * 1200);
        const simulatedY = Math.round(200 + Math.random() * 600);
        updateConfig({ targetX: simulatedX, targetY: simulatedY });
        setIsPickingPixel(false);
        soundEngine.playClick('bubble-pop');
      }, 400);
    }
  };

  // ----------------------------------------------------
  // Live Simulation Test Injection
  // ----------------------------------------------------
  const handleInjectSimulatedColor = (hex: string) => {
    setTestSimulatedHex(hex);
    setIsSimulatingColor(true);
    pixelDetector.simulateDetectedColor(hex);
    soundEngine.playClick('tech-pulse');
  };

  const handleResetSimulatedColor = () => {
    setIsSimulatingColor(false);
    pixelDetector.simulateDetectedColor(null);
    soundEngine.playClick('tech-pulse');
  };

  // ----------------------------------------------------
  // 60FPS Radar HUD Visualizer (Glitch-Free Loop)
  // ----------------------------------------------------
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let sweepAngle = 0;

    const renderRadar = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.min(cx, cy) - 8;

      ctx.clearRect(0, 0, w, h);

      // 1. Radar Circular Grids
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
      ctx.lineWidth = 1;

      for (let r = maxRadius / 4; r <= maxRadius; r += maxRadius / 4) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx, cy - maxRadius);
      ctx.lineTo(cx, cy + maxRadius);
      ctx.moveTo(cx - maxRadius, cy);
      ctx.lineTo(cx + maxRadius, cy);
      ctx.stroke();

      const isActive = detectorStatusRef.current.isActive;
      const lastCheck = latestCheckRef.current;
      const isMatch = lastCheck?.isMatch;

      // 2. Active Scanning Sweep
      if (isActive) {
        sweepAngle = (sweepAngle + 0.035) % (Math.PI * 2);

        // Sweep cone gradient
        const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
        sweepGrad.addColorStop(0, 'rgba(0, 242, 254, 0.4)');
        sweepGrad.addColorStop(1, 'rgba(0, 242, 254, 0.0)');

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxRadius, sweepAngle - 0.45, sweepAngle);
        ctx.closePath();
        ctx.fillStyle = sweepGrad;
        ctx.fill();

        // Sweep front line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + Math.cos(sweepAngle) * maxRadius,
          cy + Math.sin(sweepAngle) * maxRadius
        );
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 3. Center Target Blip
      const blipColor = isMatch ? '#00f5a0' : isActive ? '#00f2fe' : '#64748b';

      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = blipColor;
      ctx.fill();

      if (isMatch) {
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.strokeStyle = '#00f5a0';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#00f5a0';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(renderRadar);
    };

    animationFrameId = requestAnimationFrame(renderRadar);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Run continuous loop once on mount

  // Color difference calculations
  const detectedHex = latestCheck?.detectedHex || '#000000';
  const detectedRgb = latestCheck?.detectedRgb || { r: 0, g: 0, b: 0 };
  const diffPercent = latestCheck?.distancePercent ?? 0;
  const isCurrentlyMatched = latestCheck?.isMatch ?? false;

  return (
    <div className={cn('flex flex-col gap-5 w-full text-slate-100', className)}>
      {/* -------------------------------------------------- */}
      {/* Header & Master Switch */}
      {/* -------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-glass backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-accent-cyan/30 text-accent-cyan shadow-glow-cyan">
            <Target className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={config.name}
                onChange={(e) => updateConfig({ name: e.target.value })}
                className="text-lg font-bold bg-transparent border-b border-transparent hover:border-surface-300 focus:border-accent-cyan focus:outline-none px-1 py-0.5 rounded text-white"
              />
              <span
                className={cn(
                  'text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border transition-colors',
                  detectorStatus.isActive
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 animate-pulse'
                    : 'bg-surface-200 border-white/10 text-slate-400'
                )}
              >
                {detectorStatus.isActive ? `ACTIVE (${detectorStatus.fps} FPS)` : 'STANDBY'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Millisecond-accurate screen pixel color monitor with perceptual Delta-E threshold matching
            </p>
          </div>
        </div>

        {/* Master Trigger Toggle, Pick Screen Pixel & Test Simulation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePickScreenPixel}
            disabled={isPickingPixel}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-95',
              isPickingPixel
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 animate-pulse'
                : 'bg-surface-100 hover:bg-surface-200 border-border text-slate-300'
            )}
            title="Pick Coordinates directly from screen"
          >
            <Pipette className="w-4 h-4 text-accent-cyan" />
            <span>{isPickingPixel ? 'Picking...' : 'Pick Pixel'}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick('retro-arcade');
              pixelDetector.testSimulateTrigger();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 border border-border text-xs font-semibold text-slate-300 transition-all active:scale-95"
            title="Simulate Instant Match & Trigger"
          >
            <Sparkles className="w-4 h-4 text-accent-cyan" />
            <span>Test Trigger</span>
          </button>

          <button
            onClick={handleToggleDetector}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs shadow-glass transition-all transform active:scale-95',
              detectorStatus.isActive
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-glow-rose'
                : 'bg-gradient-to-r from-accent-cyan to-accent-emerald text-slate-950 shadow-glow-cyan font-black'
            )}
          >
            {detectorStatus.isActive ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>STOP DETECTOR</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>START DETECTOR</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* Live Radar & Color Comparison HUD */}
      {/* -------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Radar & Live Color Comparison (Left 6 Cols) */}
        <div className="md:col-span-6 flex flex-col gap-4 p-5 rounded-2xl bg-card border border-border shadow-glass">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div className="flex items-center gap-2">
              <Radar className="w-4 h-4 text-accent-cyan animate-spin-slow" />
              <h3 className="font-bold text-sm text-slate-100">Live Scanning HUD</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Target Coords:</span>
              <span className="text-accent-cyan font-bold">
                X:{config.targetX} Y:{config.targetY}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 justify-between">
            {/* Radar Canvas */}
            <div className="relative w-36 h-36 shrink-0 rounded-full overflow-hidden border border-accent-cyan/30 bg-[#070913] shadow-inner flex items-center justify-center">
              <canvas ref={radarCanvasRef} width={144} height={144} className="w-full h-full block" />
              <div className="absolute inset-0 pointer-events-none rounded-full ring-1 ring-white/10" />
            </div>

            {/* Color Comparison Visualizer */}
            <div className="flex-1 w-full flex flex-col gap-3">
              {/* Swatch Comparison Box */}
              <div className="grid grid-cols-2 gap-2">
                {/* Target Color Swatch */}
                <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-surface-100 border border-border">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                    <span>TARGET COLOR</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-7 h-7 rounded-lg border border-white/20 shadow-md shrink-0"
                      style={{ backgroundColor: config.expectedColorHex }}
                    />
                    <div className="flex flex-col font-mono text-xs">
                      <span className="font-bold text-white uppercase">{config.expectedColorHex}</span>
                      <span className="text-[10px] text-slate-400">
                        RGB({config.expectedColorRgb.r},{config.expectedColorRgb.g},{config.expectedColorRgb.b})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detected Live Swatch */}
                <div
                  className={cn(
                    'flex flex-col gap-1 p-2.5 rounded-xl border transition-all',
                    isCurrentlyMatched
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-glow-emerald'
                      : 'bg-surface-100 border-border'
                  )}
                >
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                    <span>LIVE DETECTED</span>
                    {isCurrentlyMatched && (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> MATCH
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-7 h-7 rounded-lg border border-white/20 shadow-md shrink-0"
                      style={{ backgroundColor: detectedHex }}
                    />
                    <div className="flex flex-col font-mono text-xs">
                      <span className="font-bold text-white uppercase">{detectedHex}</span>
                      <span className="text-[10px] text-slate-400">
                        RGB({detectedRgb.r},{detectedRgb.g},{detectedRgb.b})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Difference & Tolerance Meter */}
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Perceptual Distance (ΔE):</span>
                  <span
                    className={cn(
                      'font-bold',
                      diffPercent <= config.tolerance ? 'text-emerald-400' : 'text-slate-300'
                    )}
                  >
                    {diffPercent}% (Tolerance ≤ {config.tolerance}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-surface-200 overflow-hidden relative">
                  {/* Tolerance boundary line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-accent-cyan z-10 shadow-glow-cyan"
                    style={{ left: `${Math.min(100, config.tolerance)}%` }}
                  />
                  {/* Measured diff bar */}
                  <div
                    className={cn(
                      'h-full transition-all duration-150',
                      diffPercent <= config.tolerance
                        ? 'bg-gradient-to-r from-emerald-400 to-accent-cyan'
                        : 'bg-gradient-to-r from-rose-500 to-amber-500'
                    )}
                    style={{ width: `${Math.min(100, diffPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Telemetry Strip */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center font-mono text-xs">
            <div className="p-2 rounded-xl bg-surface-50 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase block">Screen Checks</span>
              <span className="font-bold text-cyan-300">{detectorStatus.totalChecks.toLocaleString()}</span>
            </div>
            <div className="p-2 rounded-xl bg-surface-50 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase block">Triggers Fired</span>
              <span className="font-bold text-emerald-300">
                {detectorStatus.totalTriggersFired.toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-surface-50 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase block">Check Interval</span>
              <span className="font-bold text-purple-300">{config.checkIntervalMs}ms</span>
            </div>
          </div>

          {/* Live Simulator Test Injector */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-semibold">Simulator Test Injector:</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={testSimulatedHex}
                onChange={(e) => handleInjectSimulatedColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
              <button
                onClick={() => handleInjectSimulatedColor(config.expectedColorHex)}
                className="px-2 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 border border-white/10 text-[10px] font-mono text-cyan-300"
              >
                Inject Match
              </button>
              {isSimulatingColor && (
                <button
                  onClick={handleResetSimulatedColor}
                  className="px-2 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 border border-white/10 text-[10px] font-mono text-slate-400"
                  title="Reset to live screen sampling"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Trigger Configuration Parameters (Right 6 Cols) */}
        <div className="md:col-span-6 flex flex-col gap-4 p-5 rounded-2xl bg-card border border-border shadow-glass">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-accent-purple" />
              <h3 className="font-bold text-sm text-slate-100">Detection Parameters</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-surface-100 px-2 py-0.5 rounded-md">
              Condition Engine
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-xs">
            {/* Target Coordinates */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                <span>Target X (px)</span>
              </label>
              <input
                type="number"
                min="0"
                max="7680"
                value={config.targetX}
                onChange={(e) => updateConfig({ targetX: parseInt(e.target.value) || 0 })}
                className="bg-surface-100 border border-border rounded-xl px-3 py-1.5 font-mono text-white focus:border-accent-cyan focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                <span>Target Y (px)</span>
              </label>
              <input
                type="number"
                min="0"
                max="4320"
                value={config.targetY}
                onChange={(e) => updateConfig({ targetY: parseInt(e.target.value) || 0 })}
                className="bg-surface-100 border border-border rounded-xl px-3 py-1.5 font-mono text-white focus:border-accent-cyan focus:outline-none"
              />
            </div>

            {/* Target Hex Color Picker */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400 font-semibold">Expected Color (HEX)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.expectedColorHex}
                  onChange={(e) => handleColorHexChange(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={config.expectedColorHex}
                  onChange={(e) => handleColorHexChange(e.target.value)}
                  className="w-full bg-surface-100 border border-border rounded-xl px-2.5 py-1.5 font-mono uppercase text-white focus:border-accent-cyan focus:outline-none"
                />
              </div>
            </div>

            {/* Matching Condition */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400 font-semibold">Trigger Condition</label>
              <select
                value={config.triggerCondition}
                onChange={(e) =>
                  updateConfig({
                    triggerCondition: e.target.value as PixelTriggerCondition,
                  })
                }
                className="bg-surface-100 border border-border rounded-xl px-3 py-1.5 text-white focus:border-accent-cyan focus:outline-none"
              >
                <option value="color_matches">Color Matches (≤ Tolerance)</option>
                <option value="color_differs">Color Changes (&gt; Tolerance)</option>
                <option value="color_brightness_greater">Brightness Increases</option>
                <option value="color_brightness_less">Brightness Decreases</option>
                <option value="color_in_range">RGB Range Match</option>
              </select>
            </div>

            {/* Tolerance Slider */}
            <div className="col-span-2 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Tolerance Threshold: ±{config.tolerance}%</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {config.tolerance < 10
                    ? 'Strict Exact Match'
                    : config.tolerance > 30
                    ? 'Broad Range'
                    : 'Balanced'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                value={config.tolerance}
                onChange={(e) => updateConfig({ tolerance: parseInt(e.target.value) || 15 })}
                className="accent-accent-cyan cursor-pointer mt-1"
              />
            </div>

            {/* Action to Trigger */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400 font-semibold">Action on Match</label>
              <select
                value={config.triggerAction}
                onChange={(e) =>
                  updateConfig({
                    triggerAction: e.target.value as PixelTriggerAction,
                  })
                }
                className="bg-surface-100 border border-border rounded-xl px-3 py-1.5 text-white focus:border-accent-cyan focus:outline-none"
              >
                <option value="click">Single Click</option>
                <option value="double_click">Double Click</option>
                <option value="right_click">Right Click</option>
                <option value="start_macro">Start Macro Sequence</option>
                <option value="stop_all">Emergency Stop All</option>
              </select>
            </div>

            {/* Click Location Mode */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400 font-semibold">Click Target Location</label>
              <select
                value={config.clickCoordinateMode}
                onChange={(e) =>
                  updateConfig({
                    clickCoordinateMode: e.target.value as PixelClickCoordinateMode,
                  })
                }
                className="bg-surface-100 border border-border rounded-xl px-3 py-1.5 text-white focus:border-accent-cyan focus:outline-none"
              >
                <option value="at_pixel">At Trigger Pixel</option>
                <option value="at_cursor">At Current Cursor</option>
                <option value="at_fixed_point">At Fixed Point (X, Y)</option>
              </select>
            </div>

            {/* Area Scan Radius */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400 font-semibold">
                Area Scan Box: {config.areaScanRadius ? `±${config.areaScanRadius}px` : 'Single Pixel'}
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={config.areaScanRadius || 0}
                onChange={(e) =>
                  updateConfig({ areaScanRadius: parseInt(e.target.value) || 0 })
                }
                className="accent-accent-purple cursor-pointer mt-1"
              />
            </div>

            {/* Cooldown (ms) */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400 font-semibold">Cooldown (ms)</label>
              <input
                type="number"
                min="10"
                step="50"
                value={config.cooldownMs}
                onChange={(e) =>
                  updateConfig({ cooldownMs: Math.max(10, parseInt(e.target.value) || 150) })
                }
                className="bg-surface-100 border border-border rounded-xl px-3 py-1.5 font-mono text-white focus:border-accent-cyan focus:outline-none"
              />
            </div>

            {/* Sound Alert Toggle */}
            <div className="col-span-2 flex items-center justify-between p-2.5 rounded-xl bg-surface-100 border border-border mt-1">
              <div className="flex items-center gap-2">
                {config.soundAlert ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <div>
                  <span className="text-xs font-semibold text-white block">Audio Confirmation Beep</span>
                  <span className="text-[10px] text-slate-400">Play procedural tone when pixel trigger fires</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const newAlert = !config.soundAlert;
                  updateConfig({ soundAlert: newAlert });
                  if (newAlert) soundEngine.playClick('cyber-laser');
                }}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold border transition-all',
                  config.soundAlert
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-surface-200 border-border text-slate-400'
                )}
              >
                {config.soundAlert ? 'ENABLED' : 'MUTED'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* Trigger Event Activity Log */}
      {/* -------------------------------------------------- */}
      <div className="p-4 rounded-2xl bg-card border border-border flex flex-col gap-3 shadow-glass">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-cyan" />
            <h3 className="font-bold text-xs text-slate-200">Trigger Activity Feed</h3>
          </div>
          <button
            onClick={() => setTriggerHistory([])}
            className="text-[11px] text-slate-400 hover:text-white transition-colors"
          >
            Clear Log
          </button>
        </div>

        {triggerHistory.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-slate-500 text-xs gap-1">
            <Radio className="w-6 h-6 opacity-40 animate-pulse" />
            <span>Awaiting screen triggers...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
            {triggerHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-100 border border-white/5 font-mono text-xs text-slate-300"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: item.detectedColorHex }}
                  />
                  <span className="font-bold text-white uppercase">{item.action}</span>
                  <span className="text-slate-400">
                    @ ({item.targetX}, {item.targetY})
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  <span className="text-emerald-400 font-bold">EXECUTED</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PixelTriggerPanel;
