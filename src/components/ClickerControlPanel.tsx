import React, { useState, useEffect } from 'react';
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
  Maximize2
} from 'lucide-react';
import { ClickConfig, MouseButton, ClickType, RepeatMode, CursorMode } from '../types';
import { playUiChime, playClickSound } from '../utils/audio';

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
  // Calculate total interval in milliseconds and derived CPS
  const totalMs = 
    config.interval.hours * 3600000 +
    config.interval.minutes * 60000 +
    config.interval.seconds * 1000 +
    config.interval.milliseconds +
    config.interval.microseconds / 1000;

  const theoreticalCps = totalMs > 0 ? (1000 / totalMs) : 1000;

  // Quick Speed Presets
  const speedPresets = [
    { label: '1,000 CPS (1ms)', ms: 1, us: 0, s: 0 },
    { label: '100 CPS (10ms)', ms: 10, us: 0, s: 0 },
    { label: '50 CPS (20ms)', ms: 20, us: 0, s: 0 },
    { label: '20 CPS (50ms)', ms: 50, us: 0, s: 0 },
    { label: '10 CPS (100ms)', ms: 100, us: 0, s: 0 },
    { label: '1 CPS (1s)', ms: 0, us: 0, s: 1 },
  ];

  const handleIntervalChange = (key: keyof typeof config.interval, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
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
        hours: 0,
        minutes: 0,
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
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Click Interval & Timing
              </h2>
            </div>
            
            {/* Theoretical CPS badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs">
              <Flame className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 animate-pulse" />
              <span>Target: <strong className="text-white">{theoreticalCps >= 1000 ? '1,000+' : theoreticalCps.toFixed(1)} CPS</strong></span>
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
                max="99"
                value={config.interval.hours}
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
                value={config.interval.minutes}
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
                value={config.interval.seconds}
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
                value={config.interval.milliseconds}
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
                value={config.interval.microseconds}
                onChange={(e) => handleIntervalChange('microseconds', e.target.value)}
                disabled={isRunning}
                className="glass-input rounded-xl px-2 py-2 text-center text-sm font-bold text-purple-300 border-purple-500/30 focus:ring-1 focus:ring-purple-400 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Quick Speed Preset Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
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
                Mouse Button
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
                  Extra {btn.toUpperCase()} (Side)
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
              <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Burst Count:</span>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={config.burstCount}
                  onChange={(e) => onChangeConfig({ burstCount: Math.max(2, parseInt(e.target.value, 10) || 2) })}
                  className="glass-input rounded-lg w-16 px-2 py-1 text-center text-xs font-bold text-purple-300"
                />
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
                  max="1000000"
                  value={config.repeatCount}
                  onChange={(e) => onChangeConfig({ 
                    repeatMode: 'count',
                    repeatCount: Math.max(1, parseInt(e.target.value, 10) || 1) 
                  })}
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
                  max="3600"
                  value={Math.round(config.repeatDurationMs / 1000)}
                  onChange={(e) => onChangeConfig({ 
                    repeatMode: 'duration',
                    repeatDurationMs: Math.max(1000, (parseInt(e.target.value, 10) || 1) * 1000) 
                  })}
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
                Cursor Target
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
              Current Location
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
                    value={config.fixedCoords.x}
                    onChange={(e) => onChangeConfig({
                      fixedCoords: { ...config.fixedCoords, x: parseInt(e.target.value, 10) || 0 }
                    })}
                    disabled={isRunning}
                    className="glass-input bg-transparent border-0 w-full text-xs font-mono font-bold text-white focus:ring-0 p-0"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/[0.06]">
                  <span className="text-xs font-mono text-amber-400 font-bold">Y:</span>
                  <input
                    type="number"
                    value={config.fixedCoords.y}
                    onChange={(e) => onChangeConfig({
                      fixedCoords: { ...config.fixedCoords, y: parseInt(e.target.value, 10) || 0 }
                    })}
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
              <span>Clicks wherever your mouse cursor hovers in real-time.</span>
            </div>
          )}

          {/* Random Radius Dispersion */}
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-400">Position Dispersion:</span>
            <div className="flex items-center gap-1.5 font-mono">
              <input
                type="number"
                min="0"
                max="50"
                value={config.randomCoords.radius}
                onChange={(e) => onChangeConfig({
                  randomCoords: {
                    enabled: (parseInt(e.target.value, 10) || 0) > 0,
                    radius: Math.max(0, parseInt(e.target.value, 10) || 0)
                  }
                })}
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
            {isRunning ? 'Clicking active at theoretical speed' : 'Press hotkey anywhere on desktop to toggle'}
          </p>
        </div>

      </div>
    </div>
  );
};
