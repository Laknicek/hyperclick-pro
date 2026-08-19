import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Maximize2, 
  GripHorizontal,
  Volume2,
  VolumeX,
  Zap,
  Activity
} from 'lucide-react';
import { TelemetryData } from '../types';
import { soundEngine } from '../services/soundEngine';

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
  // Free floating draggable position state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundEngine.isMuted());
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hudRef = useRef<HTMLDivElement>(null);

  // Initialize position in bottom-right corner
  useEffect(() => {
    if (typeof window !== 'undefined' && position === null) {
      const defaultX = Math.max(16, window.innerWidth - 420);
      const defaultY = Math.max(16, window.innerHeight - 84);
      setPosition({ x: defaultX, y: defaultY });
    }
  }, [position]);

  // Sync Always-on-top with Electron if available
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electron?.setAlwaysOnTop) {
      (window as any).electron.setAlwaysOnTop(true);
    }
    return () => {
      if (typeof window !== 'undefined' && (window as any).electron?.setAlwaysOnTop) {
        (window as any).electron.setAlwaysOnTop(false);
      }
    };
  }, []);

  // Handle Dragging
  const handleDragStart = (e: React.MouseEvent) => {
    if (!hudRef.current) return;
    const rect = hudRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const hudWidth = hudRef.current?.offsetWidth || 380;
      const hudHeight = hudRef.current?.offsetHeight || 60;

      const newX = Math.max(8, Math.min(window.innerWidth - hudWidth - 8, e.clientX - dragOffsetRef.current.x));
      const newY = Math.max(8, Math.min(window.innerHeight - hudHeight - 8, e.clientY - dragOffsetRef.current.y));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = soundEngine.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <div
      ref={hudRef}
      style={{
        left: position ? `${position.x}px` : undefined,
        top: position ? `${position.y}px` : undefined,
      }}
      className={`fixed z-[9999] select-none transition-shadow ${
        position === null ? 'bottom-4 right-4' : ''
      } animate-in fade-in slide-in-from-bottom-3 duration-200`}
    >
      <div className="glass-panel px-4 py-2.5 rounded-2xl border border-cyan-500/40 shadow-[0_0_30px_rgba(0,242,254,0.25)] flex items-center gap-3 backdrop-blur-3xl bg-[#090b14]/95 text-slate-100 ring-1 ring-white/10">
        
        {/* Drag Handle */}
        <div
          onMouseDown={handleDragStart}
          title="Drag to reposition Mini-HUD"
          className="text-slate-500 hover:text-cyan-300 cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <GripHorizontal className="w-4 h-4" />
        </div>

        {/* Live CPS Indicator */}
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-cyan-400 animate-pulse shadow-glow-cyan' : 'bg-slate-500'}`} />
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-slate-400 leading-none">CPS LIVE</span>
            <span className="text-xs font-mono font-black text-cyan-300 leading-tight">
              {telemetry.currentCps.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="w-[1px] h-6 bg-white/10" />

        {/* Total Clicks */}
        <div className="flex flex-col min-w-[54px]">
          <span className="text-[9px] font-mono text-slate-400 leading-none">TOTAL</span>
          <span className="text-xs font-mono font-bold text-white leading-tight">
            {telemetry.totalClicks.toLocaleString()}
          </span>
        </div>

        <div className="w-[1px] h-6 bg-white/10" />

        {/* Start / Stop Quick Trigger */}
        <button
          type="button"
          onClick={onToggleStartStop}
          title={`Start/Stop Auto-Clicker [${hotkey}]`}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
            isRunning
              ? 'bg-rose-500 text-white shadow-glow-rose hover:bg-rose-600'
              : 'bg-cyan-400 text-slate-950 font-black shadow-glow-cyan hover:bg-cyan-300'
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>STOP</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>[{hotkey}]</span>
            </>
          )}
        </button>

        {/* Mute Toggle */}
        <button
          type="button"
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute Clicks' : 'Mute Clicks'}
          className={`p-1.5 rounded-xl transition-colors ${
            isMuted ? 'text-rose-400 hover:bg-rose-500/20' : 'text-slate-400 hover:text-cyan-300 hover:bg-white/10'
          }`}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Restore Full Window Button */}
        <button
          type="button"
          onClick={onExpand}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Restore Full Dashboard"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default MiniHud;
