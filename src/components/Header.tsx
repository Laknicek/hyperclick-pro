import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Minus, 
  Square, 
  X, 
  Volume2, 
  VolumeX, 
  PictureInPicture, 
  ShieldCheck, 
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { TelemetryData, AppSettings } from '../types';

interface HeaderProps {
  isRunning: boolean;
  telemetry: TelemetryData;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onToggleMiniHud: () => void;
  isMiniHudActive: boolean;
  onPanicStop: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  telemetry,
  settings,
  onUpdateSettings,
  onToggleMiniHud,
  isMiniHudActive,
  onPanicStop,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  // Electron IPC Handlers
  const handleMinimize = () => {
    if (typeof window !== 'undefined' && (window as any).electron?.minimize) {
      (window as any).electron.minimize();
    }
  };

  const handleMaximize = () => {
    if (typeof window !== 'undefined' && (window as any).electron?.maximize) {
      (window as any).electron.maximize();
      setIsMaximized(!isMaximized);
    } else {
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && (window as any).electron?.close) {
      (window as any).electron.close();
    } else {
      window.close();
    }
  };

  return (
    <header className="h-12 w-full glass-panel border-b border-white/[0.08] flex items-center justify-between px-3 select-none z-50 relative app-drag-region">
      {/* Brand & Logo Badge */}
      <div className="flex items-center gap-3 no-drag">
        <div className="relative group cursor-pointer flex items-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-glow-cyan">
            <Zap className="w-4 h-4 text-white fill-white transition-transform group-hover:scale-110" />
          </div>
          {isRunning && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-glow-cyan"></span>
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-extrabold text-sm tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400">
            HYPERCLICK
          </span>
          <span className="text-[10px] font-bold tracking-widest text-cyan-400/90 uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
            PRO 2026
          </span>
        </div>
      </div>

      {/* Center Live Telemetry & Status Pill */}
      <div className="flex items-center gap-3 no-drag">
        {/* Active Status Pill */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-300 ${
          isRunning 
            ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-glow-cyan' 
            : 'bg-white/[0.03] border-white/10 text-slate-400'
        }`}>
          <div className="relative flex items-center justify-center">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
            {isRunning && (
              <span className="absolute w-4 h-4 rounded-full border border-cyan-400/50 animate-radar" />
            )}
          </div>
          <span className="text-xs font-semibold tracking-wide uppercase">
            {isRunning ? 'CLICKING ACTIVE' : 'ENGINE READY'}
          </span>
        </div>

        {/* Live CPS Mini-Ticker */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-100/60 border border-white/[0.08] font-mono">
          <Activity className={`w-3.5 h-3.5 ${isRunning ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-xs text-slate-400">CPS:</span>
          <span className={`text-xs font-bold ${isRunning ? 'text-cyan-300 neon-text-cyan' : 'text-slate-300'}`}>
            {telemetry.currentCps.toFixed(1)}
          </span>
        </div>

        {/* Precision Mode Indicator */}
        {settings.highPrecisionTimer && (
          <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-[10px] text-purple-300 font-mono" title="Microsecond Precision Active">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>µs MODE</span>
          </div>
        )}
      </div>

      {/* Right Controls: Audio, Mini-HUD, Window Buttons */}
      <div className="flex items-center gap-1 no-drag">
        {/* Sound Toggle */}
        <button
          onClick={() => onUpdateSettings({ soundEffects: !settings.soundEffects })}
          className={`p-1.5 rounded-lg transition-all ${
            settings.soundEffects 
              ? 'text-cyan-400 hover:bg-cyan-500/10' 
              : 'text-slate-500 hover:text-slate-400 hover:bg-white/5'
          }`}
          title={settings.soundEffects ? 'Sound FX Enabled' : 'Sound FX Muted'}
        >
          {settings.soundEffects ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Mini HUD Mode Toggle */}
        <button
          onClick={onToggleMiniHud}
          className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-medium ${
            isMiniHudActive 
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
          title="Toggle Compact Overlay Mini-HUD"
        >
          <PictureInPicture className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* Window Controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleMinimize}
            className="w-8 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={handleMaximize}
            className="w-8 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <Square className="w-3 h-3" />
          </button>

          <button
            onClick={handleClose}
            className="w-8 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-200 hover:bg-rose-600/80 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
