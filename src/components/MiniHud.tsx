import React from 'react';
import { 
  Zap, 
  Play, 
  Square, 
  Maximize2, 
  Activity, 
  GripHorizontal,
  Flame
} from 'lucide-react';
import { TelemetryData } from '../types';

interface MiniHudProps {
  isRunning: boolean;
  onToggleStartStop: () => void;
  onExpand: () => void;
  telemetry: TelemetryData;
  hotkey: string;
}

export const MiniHud: React.FC<MiniHudProps> = ({
  isRunning,
  onToggleStartStop,
  onExpand,
  telemetry,
  hotkey,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="glass-panel px-4 py-2.5 rounded-2xl border border-cyan-500/40 shadow-2xl flex items-center gap-3 backdrop-blur-3xl bg-[#090b14]/90">
        
        {/* Drag handle */}
        <div className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing app-drag-region">
          <GripHorizontal className="w-4 h-4" />
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 leading-none">CPS LIVE</span>
            <span className="text-xs font-mono font-black text-cyan-300 leading-tight">
              {telemetry.currentCps.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="w-[1px] h-6 bg-white/10" />

        {/* Total Clicks */}
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 leading-none">TOTAL</span>
          <span className="text-xs font-mono font-bold text-white leading-tight">
            {telemetry.totalClicks.toLocaleString()}
          </span>
        </div>

        <div className="w-[1px] h-6 bg-white/10" />

        {/* Start / Stop Quick Trigger */}
        <button
          onClick={onToggleStartStop}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            isRunning
              ? 'bg-rose-500 text-white shadow-glow-rose hover:bg-rose-600'
              : 'bg-cyan-400 text-black font-extrabold shadow-glow-cyan hover:bg-cyan-300'
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>STOP</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-black text-black" />
              <span>[{hotkey}]</span>
            </>
          )}
        </button>

        {/* Restore Window Button */}
        <button
          onClick={onExpand}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Restore Full Dashboard"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
