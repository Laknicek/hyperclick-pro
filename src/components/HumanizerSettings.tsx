import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Cpu, 
  Activity, 
  Move, 
  Sliders, 
  Coffee, 
  EyeOff, 
  Fingerprint,
  Info,
  SlidersHorizontal,
  Zap
} from 'lucide-react';
import { HumanizerConfig, DistributionType } from '../types';
import { playClickSound } from '../utils/audio';

interface HumanizerSettingsProps {
  config: HumanizerConfig;
  onChangeConfig: (newConfig: Partial<HumanizerConfig>) => void;
  disabled?: boolean;
  soundEnabled?: boolean;
}

export const HumanizerSettings: React.FC<HumanizerSettingsProps> = ({
  config,
  onChangeConfig,
  disabled = false,
  soundEnabled = true,
}) => {
  const handleToggleMaster = () => {
    if (soundEnabled) playClickSound('subtle', 0.2);
    onChangeConfig({ enabled: !config.enabled });
  };

  const safeJitterRadius = Math.max(0, Math.min(30, config.jitterRadius || 0));
  const safeTimingVariance = Math.max(0, Math.min(50, config.timingVariancePercent || 0));
  const safeBezierCurvature = Math.max(1, Math.min(10, config.bezierCurvature || 4));
  const safeFatigueDecay = Math.max(1, Math.min(10, config.fatigueDecayRate || 2));

  // Render SVG Gaussian Curve Visualizer
  const renderGaussianSvg = () => {
    const width = 280;
    const height = 70;
    const mean = width / 2;
    const variance = (safeTimingVariance / 50) * 35 + 15;
    
    let pathD = `M 0,${height}`;
    for (let x = 0; x <= width; x += 3) {
      if (config.distribution === 'gaussian' || config.distribution === 'natural') {
        const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(variance, 2));
        const y = height - Math.exp(exponent) * (height - 8);
        pathD += ` L ${x},${Math.max(4, y)}`;
      } else {
        // Uniform distribution (flat curve with slight noise)
        const y = height - (height * 0.5) + (Math.sin(x * 0.2) * 2);
        pathD += ` L ${x},${y}`;
      }
    }
    pathD += ` L ${width},${height} Z`;

    return (
      <div className="w-full bg-[#0b0e1a]/90 rounded-xl p-2.5 border border-white/[0.06] flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>Timing Jitter Distribution</span>
          </span>
          <span className="text-cyan-400 font-mono font-bold uppercase text-[10px]">
            {config.distribution} curve
          </span>
        </div>

        <div className="relative h-16 w-full flex items-center justify-center overflow-hidden rounded-lg bg-black/40 border border-white/[0.04]">
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#7f00ff" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path d={pathD} fill="url(#curveGradient)" stroke="#00f2fe" strokeWidth="2" />
            {/* Center mean indicator line */}
            <line x1={mean} y1="0" x2={mean} y2={height} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
          </svg>
          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-500">
            ±{(safeTimingVariance * 0.8).toFixed(1)}ms Variance
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-white/[0.08] relative overflow-hidden">
      {/* Top Banner & Master Toggle */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border transition-all ${
            config.enabled 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-glow-emerald' 
              : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
          }`}>
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Ergonomic Rhythm & Motion Assist
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Natural Cadence
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Simulates organic human muscle variance, natural fatigue, and smooth non-linear cursor physics.
            </p>
          </div>
        </div>

        {/* Master Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={handleToggleMaster}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-cyan-500 peer-checked:shadow-glow-emerald"></div>
        </label>
      </div>

      {/* Main Controls Grid */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4 transition-opacity duration-200 ${
        config.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
      }`}>
        
        {/* Left Column: Sliders & Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Positional Jitter Slider */}
          <div className="bg-surface-50 p-3.5 rounded-xl border border-white/[0.04]">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Move className="w-3.5 h-3.5 text-cyan-400" />
                Cursor Positional Jitter
              </span>
              <span className="font-mono text-cyan-400 font-bold px-2 py-0.5 bg-cyan-500/10 rounded-md">
                {safeJitterRadius} px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={safeJitterRadius}
              onChange={(e) => {
                const val = Math.max(0, Math.min(25, parseInt(e.target.value, 10) || 0));
                onChangeConfig({ jitterRadius: val });
              }}
              className="neon-slider"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>Pixel-Exact (0px)</span>
              <span>Organic Tremor (12px)</span>
              <span>Wild Dispersion (25px)</span>
            </div>
          </div>

          {/* Timing Variance Slider */}
          <div className="bg-surface-50 p-3.5 rounded-xl border border-white/[0.04]">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                Timing Variance (Rhythm Fluctuation)
              </span>
              <span className="font-mono text-purple-400 font-bold px-2 py-0.5 bg-purple-500/10 rounded-md">
                ±{safeTimingVariance}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={safeTimingVariance}
              onChange={(e) => {
                const val = Math.max(0, Math.min(50, parseInt(e.target.value, 10) || 0));
                onChangeConfig({ timingVariancePercent: val });
              }}
              className="neon-slider"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>Metronome (0%)</span>
              <span>Human Rhythm (20%)</span>
              <span>Chaotic (50%)</span>
            </div>
          </div>

          {/* Distribution Mode Buttons */}
          <div className="bg-surface-50 p-3.5 rounded-xl border border-white/[0.04]">
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Probability Distribution Algorithm:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['gaussian', 'natural', 'uniform'] as DistributionType[]).map((dist) => (
                <button
                  key={dist}
                  type="button"
                  onClick={() => onChangeConfig({ distribution: dist })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold uppercase transition-all ${
                    config.distribution === dist
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-glow-cyan'
                      : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
                  }`}
                >
                  {dist}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Advanced Physics & Fatigue Toggles (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          
          {/* Gaussian Graph Preview */}
          {renderGaussianSvg()}

          {/* Bezier Path Interpolation Toggle */}
          <div className="bg-surface-50 p-3 rounded-xl border border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">Bezier Curve Interpolation</span>
                <span className="text-[10px] text-slate-400">Curved organic mouse travel paths</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.bezierMovement}
              onChange={(e) => onChangeConfig({ bezierMovement: e.target.checked })}
              className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          {/* Ergonomic Human Fatigue Simulation */}
          <div className="bg-surface-50 p-3 rounded-xl border border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">Human Fatigue Emulation</span>
                <span className="text-[10px] text-slate-400">Subtle slowdown over sustained sessions</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.fatigueSimulation}
              onChange={(e) => onChangeConfig({ fatigueSimulation: e.target.checked })}
              className="accent-amber-400 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          {/* Micro-Pauses & Blinks */}
          <div className="bg-surface-50 p-3 rounded-xl border border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">Micro-Pauses & Breathers</span>
                <span className="text-[10px] text-slate-400">Random 50-200ms pauses every ~30 clicks</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.microPauses}
              onChange={(e) => onChangeConfig({ microPauses: e.target.checked })}
              className="accent-emerald-400 w-4 h-4 rounded cursor-pointer"
            />
          </div>

        </div>

      </div>
    </div>
  );
};
