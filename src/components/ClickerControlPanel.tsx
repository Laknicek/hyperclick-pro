import React from 'react';
import { 
  Play, 
  Square, 
  MousePointer2, 
  Crosshair, 
  Clock, 
  Repeat, 
  Zap, 
  Sliders, 
  Target, 
  Sparkles,
  Flame,
  CheckCircle2,
  HelpCircle,
  Maximize2,
  Shield,
  Layers,
  Timer
} from 'lucide-react';
import { ClickConfig, MouseButton, ClickType, RepeatMode, CursorMode } from '../types';
import { playClickSound } from '../utils/audio';

interface ClickerControlPanelProps {
  config: ClickConfig;
  onChangeConfig: (newConfig: Partial<ClickConfig>) => void;
  isRunning: boolean;
  onToggleStartStop: () => void;
  onPickLocation: () => void;
  soundEnabled: boolean;
}

export const ClickerControlPanel: React.FC<ClickerControlPanelProps> = ({
  config,
  onChangeConfig,
  isRunning,
  onToggleStartStop,
  onPickLocation,
  soundEnabled,
}) => {
  // Sanitize and calculate total interval in milliseconds
  const safeHours = Math.max(0, config.interval.hours || 0);
  const safeMinutes = Math.max(0, config.interval.minutes || 0);
  const safeSeconds = Math.max(0, config.interval.seconds || 0);
  const safeMillis = Math.max(0, config.interval.milliseconds || 0);
  const safeMicros = Math.max(0, config.interval.microseconds || 0);

  const totalMs = 
    safeHours * 3600000 +
    safeMinutes * 60000 +
    safeSeconds * 1000 +
    safeMillis +
    safeMicros / 1000;

  // Compute accurate CPS display string
  const getCpsDisplay = (): string => {
    if (totalMs <= 0) return '1,000+ CPS (Ultra)';
    const calculatedCps = 1000 / totalMs;
    if (calculatedCps >= 1000) return `${Math.round(calculatedCps).toLocaleString()} CPS`;
    if (calculatedCps >= 100) return `${calculatedCps.toFixed(0)} CPS`;
    if (calculatedCps >= 10) return `${calculatedCps.toFixed(1)} CPS`;
    if (calculatedCps >= 1) return `${calculatedCps.toFixed(2)} CPS`;
    return `${calculatedCps.toFixed(3)} CPS`;
  };

  // Quick Speed Presets
  const speedPresets = [
    { label: '1,000 CPS (1ms)', ms: 1, us: 0, s: 0, m: 0, h: 0 },
    { label: '100 CPS (10ms)', ms: 10, us: 0, s: 0, m: 0, h: 0 },
    { label: '50 CPS (20ms)', ms: 20, us: 0, s: 0, m: 0, h: 0 },
    { label: '20 CPS (50ms)', ms: 50, us: 0, s: 0, m: 0, h: 0 },
    { label: '10 CPS (100ms)', ms: 100, us: 0, s: 0, m: 0, h: 0 },
    { label: '1 CPS (1s)', ms: 0, us: 0, s: 1, m: 0, h: 0 },
  ];

  const handleIntervalChange = (key: keyof typeof config.interval, val: string) => {
    let num = parseInt(val, 10);
    if (isNaN(num) || num < 0) num = 0;
    
    // Bounds sanitization
    if (key === 'hours') num = Math.min(999, num);
    if (key === 'minutes') num = Math.min(59, num);
    if (key === 'seconds') num = Math.min(59, num);
    if (key === 'milliseconds') num = Math.min(999, num);
    if (key === 'microseconds') num = Math.min(999, num);

    onChangeConfig({
      interval: {
        ...config.interval,
        [key]: num,
      }
    });
  };

  const applySpeedPreset = (preset: typeof speedPresets[0]) => {
    if (soundEnabled) playClickSound('subtle', 0.2);
    onChangeConfig({
      interval: {
        hours: preset.h,
        minutes: preset.m,
        seconds: preset.s,
        milliseconds: preset.ms,
        microseconds: preset.us,
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* LEFT COLUMN: Configuration Cards (8 cols) */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        
        {/* CARD 1: Click Interval Engine */}
        <div className="glass-card rounded-2xl p-4 border border-white/[0.08] relative overflow-hidden">
          {/* Top header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Click Interval & Speed Calibration
                </h2>
                <p className="text-[11px] text-slate-400 font-mono">
                  Cycle Interval: {totalMs.toFixed(totalMs < 10 ? 3 : 1)} ms
                </p>
              </div>
            </div>
            
            {/* Theoretical CPS badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs">
              <Flame className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 animate-pulse" />
              <span>Target: <strong className="text-white">{getCpsDisplay()}</strong></span>
            </div>
          </div>

          {/* Precision Interval Inputs Grid */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-3">
            {/* Hours */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider text-center">
                Hours
              </label>
              <input
                type="number"
                min="0"
                max="999"
                value={config.interval.hours === 0 ? '' : config.interval.hours}
                placeholder="0"
                onChange={(e) => handleIntervalChange('hours', e.target.value)}
                disabled={isRunning}
                className="glass-input rounded-xl px-2 py-2 text-center text-sm font-semibold text-white focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
              />
            </div>

            {/* Mins */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider text-center">
                Mins
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={config.interval.minutes === 0 ? '' : config.interval.minutes}
                placeholder="0"
                onChange={(e) => handleIntervalChange('minutes', e.target.value)}
                disabled={isRunning}
                className="glass-input rounded-xl px-2 py-2 text-center text-sm font-semibold text-white focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
              />
            </div>

            {/* Secs */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider text-center">
                Secs
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={config.interval.seconds === 0 ? '' : config.interval.seconds}
                placeholder="0"
                onChange={(e) => handleIntervalChange('seconds', e.target.value)}
                disabled={isRunning}
                className="glass-input rounded-xl px-2 py-2 text-center text-sm font-semibold text-white focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
              />
            </div>

            {/* Milliseconds (Highlighted) */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider text-center flex items-center justify-center gap-1">
                <span>Millis</span>
              </label>
              <input
                type="number"
                min="0"
                max="999"
                value={config.interval.milliseconds === 0 ? '' : config.interval.milliseconds}
                placeholder="0"
                onChange={(e) => handleIntervalChange('milliseconds', e.target.value)}
                disabled={isRunning}
                className="glass-input rounded-xl px-2 py-2 text-center text-sm font-bold text-cyan-300 border-cyan-500/40 shadow-glow-cyan focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
              />
            </div>

            {/* Microseconds (Precision) */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-purple-400 uppercase tracking-wider text-center flex items-center justify-center gap-1">
                <span>Micros (µs)</span>
              </label>
              <input
                type="number"
                min="0"
                max="999"
                step="50"
                value={config.interval.microseconds === 0 ? '' : config.interval.microseconds}
                placeholder="0"
                onChange={(e) => handleIntervalChange('microseconds', e.target.value)}
                disabled={isRunning}
                className="glass-input rounded-xl px-2 py-2 text-center text-sm font-bold text-purple-300 border-purple-500/30 focus:ring-1 focus:ring-purple-400 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Quick Speed Preset Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/[0.04]">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Select:</span>
            {speedPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applySpeedPreset(preset)}
                disabled={isRunning}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/[0.04] hover:bg-cyan-500/20 hover:text-cyan-300 border border-white/[0.06] hover:border-cyan-500/30 text-slate-300 transition-all disabled:opacity-50"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* CARD 2: Mouse Button & Trigger Action Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Mouse Button Select */}
          <div className="glass-card rounded-2xl p-4 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <MousePointer2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Mouse Button Selection
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              {(['left', 'right', 'middle'] as MouseButton[]).map((btn) => (
                <button
                  key={btn}
                  type="button"
                  onClick={() => {
                    if (soundEnabled) playClickSound('subtle', 0.2);
                    onChangeConfig({ mouseButton: btn });
                  }}
                  disabled={isRunning}
                  className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all ${
                    config.mouseButton === btn
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-glow-cyan'
                      : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
                  } disabled:opacity-50`}
                >
                  {btn} Click
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['x1', 'x2'] as MouseButton[]).map((btn) => (
                <button
                  key={btn}
                  type="button"
                  onClick={() => {
                    if (soundEnabled) playClickSound('subtle', 0.2);
                    onChangeConfig({ mouseButton: btn });
                  }}
                  disabled={isRunning}
                  className={`py-1.5 px-3 rounded-xl text-xs font-medium uppercase transition-all ${
                    config.mouseButton === btn
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-glow-cyan'
                      : 'bg-white/[0.02] text-slate-400 hover:text-white border border-white/[0.06]'
                  } disabled:opacity-50`}
                >
                  Side {btn.toUpperCase()} (Thumb)
                </button>
              ))}
            </div>
          </div>

          {/* Click Action Type Select */}
          <div className="glass-card rounded-2xl p-4 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Click Action Type
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              {(['single', 'double', 'triple'] as ClickType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    if (soundEnabled) playClickSound('subtle', 0.2);
                    onChangeConfig({ clickType: type });
                  }}
                  disabled={isRunning}
                  className={`py-2 px-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    config.clickType === type
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-glow-purple'
                      : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
                  } disabled:opacity-50`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['hold', 'burst'] as ClickType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    if (soundEnabled) playClickSound('subtle', 0.2);
                    onChangeConfig({ clickType: type });
                  }}
                  disabled={isRunning}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold uppercase transition-all ${
                    config.clickType === type
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-glow-purple'
                      : 'bg-white/[0.02] text-slate-400 hover:text-white border border-white/[0.06]'
                  } disabled:opacity-50`}
                >
                  {type === 'hold' ? 'Continuous Hold' : 'Burst Volley'}
                </button>
              ))}
            </div>

            {config.clickType === 'burst' && (
              <div className="mt-3 pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex items-center justify-between bg-black/40 px-2 py-1 rounded-lg border border-white/[0.04]">
                  <span className="text-slate-400">Volley Clicks:</span>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={config.burstCount || 3}
                    onChange={(e) => onChangeConfig({ 
                      burstCount: Math.max(2, Math.min(50, parseInt(e.target.value, 10) || 2)) 
                    })}
                    className="glass-input rounded w-12 px-1 py-0.5 text-center text-xs font-bold text-purple-300"
                  />
                </div>

                <div className="flex items-center justify-between bg-black/40 px-2 py-1 rounded-lg border border-white/[0.04]">
                  <span className="text-slate-400">Delay:</span>
                  <div className="flex items-center gap-0.5">
                    <input
                      type="number"
                      min="5"
                      max="500"
                      value={config.burstIntervalMs || 25}
                      onChange={(e) => onChangeConfig({ 
                        burstIntervalMs: Math.max(5, Math.min(500, parseInt(e.target.value, 10) || 25)) 
                      })}
                      className="glass-input rounded w-12 px-1 py-0.5 text-center text-xs font-bold text-purple-300"
                    />
                    <span className="text-slate-500 text-[10px]">ms</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CARD 3: Repeat & Duration Limits */}
        <div className="glass-card rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Repeat className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Repeat Mode & Stop Condition
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Infinite */}
            <button
              type="button"
              onClick={() => {
                if (soundEnabled) playClickSound('subtle', 0.2);
                onChangeConfig({ repeatMode: 'infinite' });
              }}
              disabled={isRunning}
              className={`p-3 rounded-xl flex flex-col items-start gap-1 border transition-all text-left ${
                config.repeatMode === 'infinite'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-glow-emerald'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
              } disabled:opacity-50`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold">Infinite Loop</span>
                {config.repeatMode === 'infinite' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <span className="text-[11px] text-slate-400">Runs until Hotkey pressed</span>
            </button>

            {/* Repeat Count */}
            <div className={`p-3 rounded-xl flex flex-col gap-1.5 border transition-all ${
              config.repeatMode === 'count'
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
            }`}>
              <div 
                onClick={() => { if (!isRunning) onChangeConfig({ repeatMode: 'count' }); }}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="text-xs font-bold">Repeat X Times</span>
                {config.repeatMode === 'count' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min="1"
                  max="10000000"
                  value={config.repeatCount || ''}
                  placeholder="1000"
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onChangeConfig({ 
                      repeatMode: 'count',
                      repeatCount: isNaN(val) || val < 1 ? 1 : val 
                    });
                  }}
                  disabled={isRunning}
                  className="glass-input rounded-lg w-full px-2 py-1 text-xs font-bold text-center text-white"
                />
                <span className="text-[10px] text-slate-400 uppercase font-mono">Clicks</span>
              </div>
            </div>

            {/* Timed Duration */}
            <div className={`p-3 rounded-xl flex flex-col gap-1.5 border transition-all ${
              config.repeatMode === 'duration'
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
            }`}>
              <div 
                onClick={() => { if (!isRunning) onChangeConfig({ repeatMode: 'duration' }); }}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="text-xs font-bold">Timer Limit</span>
                {config.repeatMode === 'duration' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min="1"
                  max="86400"
                  value={Math.round((config.repeatDurationMs || 60000) / 1000)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onChangeConfig({ 
                      repeatMode: 'duration',
                      repeatDurationMs: Math.max(1000, (isNaN(val) || val < 1 ? 1 : val) * 1000) 
                    });
                  }}
                  disabled={isRunning}
                  className="glass-input rounded-lg w-full px-2 py-1 text-xs font-bold text-center text-white"
                />
                <span className="text-[10px] text-slate-400 uppercase font-mono">Secs</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Coordinates & Grand Action Trigger (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        
        {/* CARD: Cursor Coordinates Mode */}
        <div className="glass-card rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Crosshair className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Cursor Target Mode
              </h3>
            </div>
          </div>

          {/* Mode Switch Pills */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                if (soundEnabled) playClickSound('subtle', 0.2);
                onChangeConfig({ cursorMode: 'current' });
              }}
              disabled={isRunning}
              className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                config.cursorMode === 'current'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-glow-amber'
                  : 'bg-white/[0.02] text-slate-400 border border-white/[0.06]'
              } disabled:opacity-50`}
            >
              Dynamic (Live)
            </button>

            <button
              type="button"
              onClick={() => {
                if (soundEnabled) playClickSound('subtle', 0.2);
                onChangeConfig({ cursorMode: 'fixed' });
              }}
              disabled={isRunning}
              className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                config.cursorMode === 'fixed'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-glow-amber'
                  : 'bg-white/[0.02] text-slate-400 border border-white/[0.06]'
              } disabled:opacity-50`}
            >
              Fixed Point
            </button>
          </div>

          {/* Fixed Coordinates Settings */}
          {config.cursorMode === 'fixed' ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/[0.06]">
                  <span className="text-xs font-mono text-amber-400 font-bold">X:</span>
                  <input
                    type="number"
                    min="0"
                    max="7680"
                    value={config.fixedCoords.x}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onChangeConfig({
                        fixedCoords: { ...config.fixedCoords, x: isNaN(val) || val < 0 ? 0 : val }
                      });
                    }}
                    disabled={isRunning}
                    className="glass-input bg-transparent border-0 w-full text-xs font-mono font-bold text-white focus:ring-0 p-0"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/[0.06]">
                  <span className="text-xs font-mono text-amber-400 font-bold">Y:</span>
                  <input
                    type="number"
                    min="0"
                    max="4320"
                    value={config.fixedCoords.y}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onChangeConfig({
                        fixedCoords: { ...config.fixedCoords, y: isNaN(val) || val < 0 ? 0 : val }
                      });
                    }}
                    disabled={isRunning}
                    className="glass-input bg-transparent border-0 w-full text-xs font-mono font-bold text-white focus:ring-0 p-0"
                  />
                </div>
              </div>

              {/* Pick Coordinate Button */}
              <button
                type="button"
                onClick={onPickLocation}
                disabled={isRunning}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-medium text-xs flex items-center justify-center gap-2 transition-all group disabled:opacity-50"
              >
                <Target className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
                <span>Pick Screen Location (F8)</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04] text-xs text-slate-400 flex items-center gap-2">
              <MousePointer2 className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Clicks wherever your mouse cursor hovers across any desktop display.</span>
            </div>
          )}

          {/* Random Radius Dispersion */}
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-400">Position Dispersion:</span>
            <div className="flex items-center gap-1.5 font-mono">
              <input
                type="number"
                min="0"
                max="100"
                value={config.randomCoords.radius}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                  onChangeConfig({
                    randomCoords: {
                      enabled: val > 0,
                      radius: val,
                    }
                  });
                }}
                disabled={isRunning}
                className="glass-input rounded-lg w-14 px-2 py-1 text-center text-xs font-bold text-amber-300"
              />
              <span className="text-slate-500">px</span>
            </div>
          </div>
        </div>

        {/* GRAND CYBERPUNK START / STOP ACTION HERO BUTTON */}
        <div className="glass-card rounded-2xl p-5 border border-white/[0.08] flex flex-col items-center justify-center flex-1 min-h-[220px] relative overflow-hidden">
          {/* Subtle background glow effect */}
          <div className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            isRunning 
              ? 'opacity-30 bg-gradient-to-t from-rose-600/30 via-rose-500/10 to-transparent animate-pulse' 
              : 'opacity-25 bg-gradient-to-t from-cyan-600/30 via-cyan-500/10 to-transparent'
          }`} />

          {/* Pulsing Outer Rings */}
          <div className="relative mb-3">
            {isRunning && (
              <>
                <div className="absolute -inset-4 rounded-full border border-rose-500/40 animate-radar pointer-events-none" />
                <div className="absolute -inset-8 rounded-full border border-rose-500/20 animate-radar pointer-events-none [animation-delay:0.5s]" />
              </>
            )}

            <button
              type="button"
              onClick={onToggleStartStop}
              className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer relative z-10 select-none ${
                isRunning
                  ? 'bg-gradient-to-tr from-rose-600 to-rose-500 text-white shadow-glow-rose hover:scale-105 active:scale-95 border-2 border-rose-300/60'
                  : 'bg-gradient-to-tr from-cyan-500 via-cyan-400 to-blue-500 text-black font-extrabold shadow-glow-cyan hover:scale-105 active:scale-95 border-2 border-cyan-200/80'
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-8 h-8 fill-white mb-1" />
                  <span className="text-xs font-black tracking-widest uppercase text-white">
                    STOP
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-9 h-9 fill-black ml-1 mb-1 text-black" />
                  <span className="text-xs font-black tracking-widest uppercase text-black">
                    START
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Hotkey Tag */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 mt-1">
            <span className="text-slate-400">Hotkey:</span>
            <kbd className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/20 text-cyan-400 font-bold shadow-sm">
              [{config.hotkey || 'F6'}]
            </kbd>
          </div>

          <p className="text-[11px] text-slate-500 mt-1 text-center">
            {isRunning ? 'Engine active: clicking continuously' : 'Press hotkey anywhere on desktop to toggle'}
          </p>
        </div>

      </div>
    </div>
  );
};
