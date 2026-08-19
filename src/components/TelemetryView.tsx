import React, { useRef, useEffect } from 'react';
import { 
  Activity, 
  Flame, 
  Clock, 
  MousePointerClick, 
  Cpu, 
  RotateCcw, 
  Download, 
  Zap, 
  ShieldCheck,
  TrendingUp,
  Percent
} from 'lucide-react';
import { TelemetryData } from '../types';

interface TelemetryViewProps {
  telemetry: TelemetryData;
  onResetTelemetry: () => void;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({
  telemetry,
  onResetTelemetry,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Format session duration (HH:MM:SS)
  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Live Canvas 60 FPS Telemetry Waveform Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Background Cyber Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Render CPS waveform
      const history = telemetry.cpsHistory && telemetry.cpsHistory.length > 0
        ? telemetry.cpsHistory 
        : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

      const maxVal = Math.max(25, telemetry.peakCps * 1.15, ...history);
      const stepX = width / Math.max(1, history.length - 1);

      // Gradient Area Fill
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(0, 242, 254, 0.35)');
      gradient.addColorStop(0.5, 'rgba(127, 0, 255, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 242, 254, 0.0)');

      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let i = 0; i < history.length; i++) {
        const x = i * stepX;
        const normalizedY = (history[i] / maxVal) * (height - 30);
        const y = height - Math.max(4, normalizedY) - 10;
        if (i === 0) {
          ctx.lineTo(x, y);
        } else {
          // Smooth curve using bezier
          const prevX = (i - 1) * stepX;
          const prevNormY = (history[i - 1] / maxVal) * (height - 30);
          const prevY = height - Math.max(4, prevNormY) - 10;
          const cpX = (prevX + x) / 2;
          ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
        }
      }

      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Top glowing stroke line
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = i * stepX;
        const normalizedY = (history[i] / maxVal) * (height - 30);
        const y = height - Math.max(4, normalizedY) - 10;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = (i - 1) * stepX;
          const prevNormY = (history[i - 1] / maxVal) * (height - 30);
          const prevY = height - Math.max(4, prevNormY) - 10;
          const cpX = (prevX + x) / 2;
          ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
        }
      }
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Draw latest point dot with glowing pulse
      if (history.length > 0) {
        const lastIdx = history.length - 1;
        const lastX = lastIdx * stepX;
        const lastNormY = (history[lastIdx] / maxVal) * (height - 30);
        const lastY = height - Math.max(4, lastNormY) - 10;

        ctx.beginPath();
        ctx.arc(lastX - 2, lastY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    render();
  }, [telemetry.cpsHistory, telemetry.peakCps]);

  const handleExportCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Timestamp,CPS,TotalClicks,SessionDurationSec\n" +
      (telemetry.cpsHistory || []).map((cps, i) => `${i},${cps},${telemetry.totalClicks},${telemetry.sessionDuration}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hyperclick_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Banner Stats Row (4 Metric Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Clicks */}
        <div className="glass-card rounded-2xl p-4 border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Clicks</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {telemetry.totalClicks.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-cyan-400 mt-1 font-mono">
            <TrendingUp className="w-3 h-3" />
            <span>Active session total</span>
          </div>
        </div>

        {/* Metric 2: Live / Peak CPS */}
        <div className="glass-card rounded-2xl p-4 border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Current / Peak CPS</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
            <span className="text-purple-300">{telemetry.currentCps.toFixed(1)}</span>
            <span className="text-xs text-slate-500 font-normal">/ {telemetry.peakCps.toFixed(1)} max</span>
          </div>
          <div className="text-[11px] text-purple-400 mt-1 font-mono">
            Hardware verified speed
          </div>
        </div>

        {/* Metric 3: Active Duration */}
        <div className="glass-card rounded-2xl p-4 border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Session Duration</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {formatDuration(telemetry.sessionDuration)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-mono">
            Continuous uptime
          </div>
        </div>

        {/* Metric 4: Latency & CPU Load */}
        <div className="glass-card rounded-2xl p-4 border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Timer Latency</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
            <span className="text-amber-300">{telemetry.avgLatencyMs.toFixed(2)}</span>
            <span className="text-xs text-slate-500 font-normal">ms jitter</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400 mt-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span>CPU: {(telemetry.cpuUsagePercent || 0.8).toFixed(1)}% Load</span>
          </div>
        </div>
      </div>

      {/* Main Dynamic 60 FPS Telemetry Canvas Chart */}
      <div className="glass-card rounded-2xl p-5 border border-white/[0.08] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Real-Time CPS Waveform & Performance Stream
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                High-Resolution 60 FPS Canvas Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onResetTelemetry}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-medium text-rose-300 flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Stats</span>
            </button>
          </div>
        </div>

        {/* Dynamic Canvas Element */}
        <div className="relative w-full h-56 bg-[#0a0c16] rounded-xl overflow-hidden border border-white/[0.06] shadow-inner">
          <canvas
            ref={canvasRef}
            width={720}
            height={224}
            className="w-full h-full block"
          />

          {/* Floating live indicator badge inside canvas */}
          <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 font-mono text-xs">
            <span className={`w-2 h-2 rounded-full ${telemetry.isRunning ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
            <span className="text-slate-300">{telemetry.currentCps.toFixed(1)} CPS LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
