import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Crosshair,
  Save,
  Download,
  Upload,
  Sparkles,
  Clock,
  Activity,
  MousePointer,
  Shuffle,
  Repeat,
  Layers,
  CircleDot,
  Zap,
  ArrowRight,
  Maximize2,
  Sliders,
  CheckCircle2,
  Video,
  Radio,
  FileCode,
  Compass,
} from 'lucide-react';
import {
  MacroSequence,
  Waypoint,
  WaypointActionType,
  SequenceTraversalMode,
  MacroExecutionState,
  Point2D,
  createDefaultWaypoint,
  createDefaultMacroSequence,
  BUILT_IN_PROFILES,
} from '../types/clicker';
import { macroEngine } from '../services/macroEngine';
import { cn } from '../utils/cn';

interface MacroSequencerProps {
  initialSequence?: MacroSequence;
  onSaveSequence?: (sequence: MacroSequence) => void;
  className?: string;
}

export const MacroSequencer: React.FC<MacroSequencerProps> = ({
  initialSequence,
  onSaveSequence,
  className,
}) => {
  // ----------------------------------------------------
  // State
  // ----------------------------------------------------
  const [sequence, setSequence] = useState<MacroSequence>(
    initialSequence || createDefaultMacroSequence()
  );
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(
    sequence.waypoints[0]?.id || null
  );
  const [engineState, setEngineState] = useState<MacroExecutionState>('idle');
  const [activeWaypointIndex, setActiveWaypointIndex] = useState<number>(-1);
  const [virtualCursor, setVirtualCursor] = useState<Point2D>({ x: 960, y: 540 });
  const [currentLoop, setCurrentLoop] = useState<number>(0);
  const [isPickingCoord, setIsPickingCoord] = useState<boolean>(false);
  const [magnifierCoord, setMagnifierCoord] = useState<Point2D>({ x: 960, y: 540 });
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [showPresetsModal, setShowPresetsModal] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recordingTimerRef = useRef<number | null>(null);

  // Selected waypoint accessor
  const selectedWaypoint = useMemo(() => {
    return sequence.waypoints.find((w) => w.id === selectedWaypointId) || sequence.waypoints[0] || null;
  }, [sequence.waypoints, selectedWaypointId]);

  // Total calculated duration
  const estimatedDurationMs = useMemo(() => {
    return macroEngine.estimateSequenceDuration(sequence);
  }, [sequence]);

  // ----------------------------------------------------
  // Engine Event Listeners
  // ----------------------------------------------------
  useEffect(() => {
    const unsubscribe = macroEngine.addListener({
      onStateChange: (newState) => {
        setEngineState(newState);
        if (newState === 'idle' || newState === 'stopped') {
          setActiveWaypointIndex(-1);
        }
      },
      onWaypointStart: (_wp, index, loopCount) => {
        setActiveWaypointIndex(index);
        setCurrentLoop(loopCount);
      },
      onPathMove: (pos) => {
        setVirtualCursor(pos);
      },
      onLoopComplete: (loop) => {
        setCurrentLoop(loop);
      },
      onSequenceEnd: () => {
        setActiveWaypointIndex(-1);
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // ----------------------------------------------------
  // Canvas Mini-Map & Bezier Path Visualizer
  // ----------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Coordinate scaling (Standard screen 1920x1080 to canvas)
      const scaleX = width / 1920;
      const scaleY = height / 1080;

      // 1. Dark Cyber Background & Grid
      ctx.fillStyle = '#0a0c16';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const stepGrid = 40;
      for (let x = 0; x < width; x += stepGrid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += stepGrid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const activeWaypoints = sequence.waypoints.filter((w) => w.enabled);

      // 2. Render Bezier Curved Paths between Waypoints
      if (activeWaypoints.length > 1) {
        for (let i = 0; i < activeWaypoints.length; i++) {
          const wpCurrent = activeWaypoints[i];
          const wpNext = activeWaypoints[(i + 1) % activeWaypoints.length];

          const startPt: Point2D = { x: wpCurrent.x * scaleX, y: wpCurrent.y * scaleY };
          const endPt: Point2D = { x: wpNext.x * scaleX, y: wpNext.y * scaleY };

          const { cp1, cp2 } = macroEngine.computeBezierControlPoints(
            startPt,
            endPt,
            sequence.bezierSmoothness
          );

          // Path Gradient
          const isCurrentSegment = activeWaypointIndex === i;
          const gradient = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);

          if (isCurrentSegment && engineState === 'running') {
            gradient.addColorStop(0, '#00f2fe');
            gradient.addColorStop(0.5, '#7f00ff');
            gradient.addColorStop(1, '#00f5a0');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00f2fe';
            ctx.shadowBlur = 12;
          } else {
            gradient.addColorStop(0, 'rgba(0, 242, 254, 0.3)');
            gradient.addColorStop(1, 'rgba(127, 0, 255, 0.3)');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.8;
            ctx.setLineDash([4, 4]);
            ctx.shadowBlur = 0;
          }

          ctx.beginPath();
          ctx.moveTo(startPt.x, startPt.y);
          ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, endPt.x, endPt.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;
        }
      }

      // 3. Render Waypoint Pins & Jitter Halos
      sequence.waypoints.forEach((wp, idx) => {
        const cx = wp.x * scaleX;
        const cy = wp.y * scaleY;
        const isSelected = wp.id === selectedWaypointId;
        const isActive = activeWaypointIndex === idx && engineState === 'running';

        if (!wp.enabled) {
          ctx.globalAlpha = 0.35;
        } else {
          ctx.globalAlpha = 1.0;
        }

        // Jitter halo
        if (wp.jitterRadius > 0) {
          const jitterCanvasR = Math.max(4, wp.jitterRadius * scaleX * 2.5);
          ctx.beginPath();
          ctx.arc(cx, cy, jitterCanvasR, 0, Math.PI * 2);
          ctx.fillStyle = isSelected
            ? 'rgba(0, 242, 254, 0.15)'
            : 'rgba(255, 255, 255, 0.05)';
          ctx.fill();
          ctx.strokeStyle = isSelected
            ? 'rgba(0, 242, 254, 0.4)'
            : 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Pin base glow
        if (isActive) {
          ctx.beginPath();
          ctx.arc(cx, cy, 18, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 242, 254, 0.25)';
          ctx.fill();
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = 20;
        }

        // Pin circle
        ctx.beginPath();
        ctx.arc(cx, cy, isSelected ? 12 : 9, 0, Math.PI * 2);
        ctx.fillStyle = isActive
          ? '#00f2fe'
          : isSelected
          ? '#7f00ff'
          : '#1a1e36';
        ctx.fill();

        ctx.strokeStyle = isSelected || isActive ? '#ffffff' : 'rgba(0, 242, 254, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Pin Number Label
        ctx.fillStyle = isSelected || isActive ? '#000000' : '#ffffff';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${idx + 1}`, cx, cy);

        // Waypoint name tag above
        ctx.fillStyle = isSelected ? '#00f2fe' : 'rgba(255, 255, 255, 0.6)';
        ctx.font = '500 8px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(wp.name, cx, cy - 16);
      });

      // 4. Render Live Virtual Animated Cursor
      if (engineState === 'running' || engineState === 'stepping') {
        const curX = virtualCursor.x * scaleX;
        const curY = virtualCursor.y * scaleY;

        ctx.globalAlpha = 1.0;
        ctx.shadowColor = '#00f5a0';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.arc(curX, curY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#00f5a0';
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Ping ripple
        const ripple = (Date.now() % 1000) / 1000;
        ctx.beginPath();
        ctx.arc(curX, curY, 6 + ripple * 14, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 245, 160, ${1 - ripple})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    sequence,
    selectedWaypointId,
    activeWaypointIndex,
    virtualCursor,
    engineState,
  ]);

  // ----------------------------------------------------
  // Canvas Click to Reposition / Add Waypoint
  // ----------------------------------------------------
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = 1920 / canvas.width;
    const scaleY = 1080 / canvas.height;

    const screenX = Math.round(clickX * scaleX);
    const screenY = Math.round(clickY * scaleY);

    // If picking coordinate for selected waypoint
    if (isPickingCoord && selectedWaypoint) {
      updateWaypoint(selectedWaypoint.id, { x: screenX, y: screenY });
      setIsPickingCoord(false);
      return;
    }

    // Check if clicked close to an existing waypoint
    const clickedWp = sequence.waypoints.find((w) => {
      const dist = Math.hypot(w.x - screenX, w.y - screenY);
      return dist < 45;
    });

    if (clickedWp) {
      setSelectedWaypointId(clickedWp.id);
    } else {
      // Add new waypoint at clicked location
      const newWp = createDefaultWaypoint(sequence.waypoints.length + 1, screenX, screenY);
      setSequence((prev) => ({
        ...prev,
        waypoints: [...prev.waypoints, newWp],
        updatedAt: Date.now(),
      }));
      setSelectedWaypointId(newWp.id);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const screenX = Math.round((mouseX * 1920) / canvas.width);
    const screenY = Math.round((mouseY * 1080) / canvas.height);

    setMagnifierCoord({ x: screenX, y: screenY });
  };

  // ----------------------------------------------------
  // Waypoint Manipulations
  // ----------------------------------------------------
  const addWaypoint = () => {
    const lastWp = sequence.waypoints[sequence.waypoints.length - 1];
    const newX = lastWp ? Math.min(1800, lastWp.x + 80) : 960;
    const newY = lastWp ? Math.min(1000, lastWp.y + 60) : 540;

    const newWp = createDefaultWaypoint(sequence.waypoints.length + 1, newX, newY);
    setSequence((prev) => ({
      ...prev,
      waypoints: [...prev.waypoints, newWp],
      updatedAt: Date.now(),
    }));
    setSelectedWaypointId(newWp.id);
  };

  const removeWaypoint = (id: string) => {
    if (sequence.waypoints.length <= 1) return;
    const remaining = sequence.waypoints.filter((w) => w.id !== id);
    setSequence((prev) => ({
      ...prev,
      waypoints: remaining,
      updatedAt: Date.now(),
    }));
    if (selectedWaypointId === id) {
      setSelectedWaypointId(remaining[0]?.id || null);
    }
  };

  const duplicateWaypoint = (wp: Waypoint) => {
    const copy: Waypoint = {
      ...wp,
      id: `wp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${wp.name} (Copy)`,
      x: Math.min(1920, wp.x + 30),
      y: Math.min(1080, wp.y + 30),
    };
    setSequence((prev) => ({
      ...prev,
      waypoints: [...prev.waypoints, copy],
      updatedAt: Date.now(),
    }));
    setSelectedWaypointId(copy.id);
  };

  const moveWaypoint = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sequence.waypoints.length) return;

    const newWaypoints = [...sequence.waypoints];
    const [moved] = newWaypoints.splice(index, 1);
    newWaypoints.splice(targetIdx, 0, moved);

    setSequence((prev) => ({
      ...prev,
      waypoints: newWaypoints,
      updatedAt: Date.now(),
    }));
  };

  const updateWaypoint = (id: string, updates: Partial<Waypoint>) => {
    setSequence((prev) => ({
      ...prev,
      waypoints: prev.waypoints.map((w) => (w.id === id ? { ...w, ...updates } : w)),
      updatedAt: Date.now(),
    }));
  };

  // ----------------------------------------------------
  // Execution Control Handlers
  // ----------------------------------------------------
  const handleStart = async () => {
    await macroEngine.start(sequence);
  };

  const handlePause = () => {
    macroEngine.pause();
  };

  const handleResume = () => {
    macroEngine.resume();
  };

  const handleStop = async () => {
    await macroEngine.stop();
  };

  const handleStep = async () => {
    await macroEngine.step(sequence);
  };

  // ----------------------------------------------------
  // Recording Handlers
  // ----------------------------------------------------
  const handleToggleRecord = () => {
    if (engineState === 'recording') {
      const recSequence = macroEngine.stopRecording('Captured Macro Sequence');
      if (recSequence.waypoints.length > 0) {
        setSequence(recSequence);
        setSelectedWaypointId(recSequence.waypoints[0]?.id || null);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingSeconds(0);
    } else {
      macroEngine.startRecording();
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    }
  };

  // ----------------------------------------------------
  // Profile & Save Handlers
  // ----------------------------------------------------
  const handleSaveProfile = () => {
    onSaveSequence?.(sequence);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sequence, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${sequence.name.toLowerCase().replace(/\s+/g, '_')}_macro.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string) as MacroSequence;
        if (parsed.waypoints && Array.isArray(parsed.waypoints)) {
          setSequence(parsed);
          setSelectedWaypointId(parsed.waypoints[0]?.id || null);
        }
      } catch (err) {
        console.error('Failed to parse sequence JSON', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const loadPresetProfile = (presetSequence: MacroSequence) => {
    setSequence(JSON.parse(JSON.stringify(presetSequence)));
    setSelectedWaypointId(presetSequence.waypoints[0]?.id || null);
    setShowPresetsModal(false);
  };

  return (
    <div className={cn('flex flex-col gap-5 w-full text-slate-100', className)}>
      {/* -------------------------------------------------- */}
      {/* Header & Controls Toolbar */}
      {/* -------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-glass backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-accent-cyan/30 text-accent-cyan shadow-glow-cyan">
            <Compass className="w-6 h-6 animate-subtle-float" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={sequence.name}
                onChange={(e) => setSequence((prev) => ({ ...prev, name: e.target.value }))}
                className="text-lg font-bold bg-transparent border-b border-transparent hover:border-surface-300 focus:border-accent-cyan focus:outline-none px-1 py-0.5 rounded text-white"
              />
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-200 border border-white/10 text-cyan-300 font-mono">
                {sequence.waypoints.length} Nodes
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-200 border border-white/10 text-purple-300 font-mono">
                ~{(estimatedDurationMs / 1000).toFixed(1)}s / cycle
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Precision multi-point pathing with Bezier curve easing & humanized micro-variances
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Presets Modal Trigger */}
          <button
            onClick={() => setShowPresetsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 border border-border text-xs font-medium text-slate-200 transition-all"
            title="Load Preconfigured Sequences"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Presets</span>
          </button>

          {/* Record Button */}
          <button
            onClick={handleToggleRecord}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all',
              engineState === 'recording'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse shadow-glow-rose'
                : 'bg-surface-100 hover:bg-surface-200 border-border text-slate-200'
            )}
          >
            <Radio className={cn('w-4 h-4', engineState === 'recording' ? 'text-rose-400 animate-ping' : 'text-rose-400')} />
            <span>
              {engineState === 'recording'
                ? `Recording (${recordingSeconds}s)`
                : 'Record Macro'}
            </span>
          </button>

          {/* Step Button */}
          <button
            onClick={handleStep}
            disabled={engineState === 'running' || engineState === 'recording'}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 disabled:opacity-40 border border-border text-xs font-medium text-slate-200 transition-all"
            title="Execute Single Step"
          >
            <ArrowRight className="w-4 h-4 text-amber-400" />
            <span>Step</span>
          </button>

          {/* Start / Pause / Resume / Stop Controls */}
          {engineState === 'idle' || engineState === 'stopped' ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue hover:opacity-95 text-slate-950 font-bold text-xs shadow-glow-cyan transition-all transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>RUN SEQUENCE</span>
            </button>
          ) : engineState === 'paused' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleResume}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glow-emerald transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </button>
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500 text-rose-300 font-semibold text-xs transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePause}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </button>
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-glow-rose transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          )}

          {/* Save Profile Button */}
          <button
            onClick={handleSaveProfile}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 border border-border text-xs font-medium text-slate-200 transition-all"
            title="Save Profile"
          >
            {saveSuccessNotice ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Save className="w-4 h-4 text-accent-cyan" />
            )}
            <span>{saveSuccessNotice ? 'Saved!' : 'Save'}</span>
          </button>

          {/* Export / Import */}
          <button
            onClick={handleExportJson}
            className="p-2 rounded-xl bg-surface-100 hover:bg-surface-200 border border-border text-slate-300 transition-all"
            title="Export JSON"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl bg-surface-100 hover:bg-surface-200 border border-border text-slate-300 transition-all"
            title="Import JSON"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJson}
            className="hidden"
          />
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* Sequence Settings Strip */}
      {/* -------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-3.5 rounded-2xl bg-card/70 border border-border/80 text-xs">
        {/* Traversal Mode */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Shuffle className="w-3.5 h-3.5 text-accent-cyan" />
            Traversal Mode
          </label>
          <select
            value={sequence.traversalMode}
            onChange={(e) =>
              setSequence((prev) => ({
                ...prev,
                traversalMode: e.target.value as SequenceTraversalMode,
              }))
            }
            className="w-full bg-surface-100 border border-border rounded-xl px-2.5 py-1.5 font-medium text-white focus:border-accent-cyan focus:outline-none"
          >
            <option value="ordered">Ordered (1 → N)</option>
            <option value="randomized">Randomized Shuffle</option>
            <option value="ping_pong">Ping-Pong (1 ↔ N)</option>
            <option value="reverse">Reverse (N → 1)</option>
          </select>
        </div>

        {/* Loops Count */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Repeat className="w-3.5 h-3.5 text-accent-purple" />
            Loop Count
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              max="99999"
              value={sequence.loopCount}
              onChange={(e) =>
                setSequence((prev) => ({
                  ...prev,
                  loopCount: Math.max(0, parseInt(e.target.value) || 0),
                }))
              }
              className="w-full bg-surface-100 border border-border rounded-xl px-2.5 py-1.5 font-mono text-white focus:border-accent-cyan focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {sequence.loopCount === 0 ? '(Infinite)' : 'Loops'}
            </span>
          </div>
        </div>

        {/* Speed Multiplier */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Speed: {sequence.speedMultiplier}x
          </label>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            value={sequence.speedMultiplier}
            onChange={(e) =>
              setSequence((prev) => ({
                ...prev,
                speedMultiplier: parseFloat(e.target.value),
              }))
            }
            className="accent-accent-cyan cursor-pointer mt-1.5"
          />
        </div>

        {/* Bezier Smoothness */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-accent-pink" />
            Curve Arc: {Math.round(sequence.bezierSmoothness * 100)}%
          </label>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={sequence.bezierSmoothness}
            onChange={(e) =>
              setSequence((prev) => ({
                ...prev,
                bezierSmoothness: parseFloat(e.target.value),
              }))
            }
            className="accent-accent-pink cursor-pointer mt-1.5"
          />
        </div>

        {/* Humanize Paths Toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Human Motion
          </label>
          <button
            onClick={() =>
              setSequence((prev) => ({
                ...prev,
                humanizePaths: !prev.humanizePaths,
              }))
            }
            className={cn(
              'w-full py-1.5 px-3 rounded-xl font-semibold text-xs border transition-all text-center',
              sequence.humanizePaths
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-surface-100 border-border text-slate-400'
            )}
          >
            {sequence.humanizePaths ? 'Natural Bezier ON' : 'Direct Linear'}
          </button>
        </div>

        {/* Hotkey Indicator */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-accent-blue" />
            Execution State
          </label>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface-100 border border-border">
            <div
              className={cn(
                'w-2.5 h-2.5 rounded-full',
                engineState === 'running'
                  ? 'bg-emerald-400 animate-ping'
                  : engineState === 'paused'
                  ? 'bg-amber-400'
                  : engineState === 'recording'
                  ? 'bg-rose-500 animate-pulse'
                  : 'bg-slate-500'
              )}
            />
            <span className="font-mono uppercase font-bold text-[11px] tracking-wider text-slate-200">
              {engineState}
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* Interactive Path Visualizer Canvas & Timeline */}
      {/* -------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Visual Map Canvas (Left 7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-glass group">
            {/* Header info overlay */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 backdrop-blur-md text-[11px] font-mono text-slate-300">
              <Crosshair className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Canvas 1920×1080 Scaled</span>
              <span className="text-slate-500">|</span>
              <span className="text-cyan-400">
                X:{magnifierCoord.x} Y:{magnifierCoord.y}
              </span>
            </div>

            {isPickingCoord && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent-cyan/20 border border-accent-cyan text-accent-cyan text-xs font-bold animate-pulse backdrop-blur-md">
                <Crosshair className="w-4 h-4" />
                <span>Click canvas to set coordinates</span>
              </div>
            )}

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={640}
              height={360}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              className={cn(
                'w-full h-auto aspect-video cursor-crosshair block transition-opacity',
                isPickingCoord && 'ring-2 ring-accent-cyan'
              )}
            />

            {/* Bottom mini-bar with status */}
            <div className="p-3 bg-card/90 border-t border-border flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent-cyan" />
                  <span>Target Pins</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Live Cursor</span>
                </span>
              </div>
              <button
                onClick={addWaypoint}
                className="flex items-center gap-1 text-accent-cyan hover:text-cyan-300 font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Waypoint Pin</span>
              </button>
            </div>
          </div>

          {/* Sequential Timeline Scrubber */}
          <div className="p-4 rounded-2xl bg-card border border-border flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-accent-purple" />
                Sequence Execution Timeline
              </span>
              <span className="font-mono text-slate-400">
                Cycle Progress: {activeWaypointIndex + 1} / {sequence.waypoints.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-thin">
              {sequence.waypoints.map((wp, idx) => {
                const isActive = activeWaypointIndex === idx && engineState === 'running';
                const isSelected = selectedWaypointId === wp.id;

                return (
                  <button
                    key={wp.id}
                    onClick={() => setSelectedWaypointId(wp.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all shrink-0',
                      isActive
                        ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan shadow-glow-cyan ring-1 ring-accent-cyan'
                        : isSelected
                        ? 'bg-accent-purple/20 border-accent-purple text-purple-200'
                        : 'bg-surface-100 hover:bg-surface-200 border-border text-slate-300'
                    )}
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-900/60 flex items-center justify-center font-mono font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{wp.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {wp.delayBeforeMs + wp.delayAfterMs}ms
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Waypoints List & Granular Editor (Right 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Waypoints Header & Quick Actions */}
          <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-accent-cyan" />
              <h3 className="font-bold text-sm text-slate-100">Waypoint Nodes</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={addWaypoint}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent-cyan/20 hover:bg-accent-cyan/30 border border-accent-cyan/40 text-accent-cyan text-xs font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Node</span>
              </button>
            </div>
          </div>

          {/* Waypoints Table / List */}
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {sequence.waypoints.map((wp, index) => {
              const isSelected = selectedWaypointId === wp.id;
              const isActive = activeWaypointIndex === index && engineState === 'running';

              return (
                <div
                  key={wp.id}
                  onClick={() => setSelectedWaypointId(wp.id)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer',
                    isActive
                      ? 'bg-accent-cyan/15 border-accent-cyan shadow-glow-cyan'
                      : isSelected
                      ? 'bg-surface-200 border-accent-purple/60'
                      : 'bg-card/70 hover:bg-card border-border/80'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateWaypoint(wp.id, { enabled: !wp.enabled });
                      }}
                      className={cn(
                        'w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs transition-colors',
                        wp.enabled
                          ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
                          : 'bg-surface-200 text-slate-500 border border-border'
                      )}
                      title="Toggle node active state"
                    >
                      {index + 1}
                    </button>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{wp.name}</span>
                        <span className="text-[10px] font-mono text-accent-cyan">
                          ({wp.x}, {wp.y})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                        <span className="uppercase text-purple-300">{wp.actionType}</span>
                        <span>•</span>
                        <span>Delay: {wp.delayBeforeMs + wp.delayAfterMs}ms</span>
                        <span>•</span>
                        <span>Jitter: ±{wp.jitterRadius}px</span>
                      </div>
                    </div>
                  </div>

                  {/* Ordering & Duplicate Buttons */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => moveWaypoint(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded-lg hover:bg-surface-300 disabled:opacity-30 text-slate-400 hover:text-white"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveWaypoint(index, 'down')}
                      disabled={index === sequence.waypoints.length - 1}
                      className="p-1 rounded-lg hover:bg-surface-300 disabled:opacity-30 text-slate-400 hover:text-white"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => duplicateWaypoint(wp)}
                      className="p-1 rounded-lg hover:bg-surface-300 text-slate-400 hover:text-cyan-300"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeWaypoint(wp.id)}
                      disabled={sequence.waypoints.length <= 1}
                      className="p-1 rounded-lg hover:bg-rose-500/20 disabled:opacity-30 text-slate-400 hover:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Waypoint Granular Inspector */}
          {selectedWaypoint && (
            <div className="p-4 rounded-2xl bg-card border border-border/90 flex flex-col gap-4 shadow-glass">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent-purple" />
                  <h4 className="font-bold text-xs text-slate-200">
                    Node Inspector: <span className="text-accent-cyan">{selectedWaypoint.name}</span>
                  </h4>
                </div>
                <button
                  onClick={() => setIsPickingCoord(!isPickingCoord)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all',
                    isPickingCoord
                      ? 'bg-accent-cyan text-slate-950 border-accent-cyan animate-pulse'
                      : 'bg-surface-100 hover:bg-surface-200 border-border text-cyan-300'
                  )}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>{isPickingCoord ? 'Click Canvas...' : 'Pick Coords'}</span>
                </button>
              </div>

              {/* Coordinates & Action Form */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Node Name */}
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-medium">Node Label</label>
                  <input
                    type="text"
                    value={selectedWaypoint.name}
                    onChange={(e) =>
                      updateWaypoint(selectedWaypoint.id, { name: e.target.value })
                    }
                    className="bg-surface-100 border border-border rounded-xl px-3 py-1.5 text-white focus:border-accent-cyan focus:outline-none"
                  />
                </div>

                {/* X Coordinate */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-medium">X Coordinate (px)</label>
                  <input
                    type="number"
                    min="0"
                    max="7680"
                    value={selectedWaypoint.x}
                    onChange={(e) =>
                      updateWaypoint(selectedWaypoint.id, {
                        x: parseInt(e.target.value) || 0,
                      })
                    }
                    className="bg-surface-100 border border-border rounded-xl px-3 py-1.5 font-mono text-white focus:border-accent-cyan focus:outline-none"
                  />
                </div>

                {/* Y Coordinate */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-medium">Y Coordinate (px)</label>
                  <input
                    type="number"
                    min="0"
                    max="4320"
                    value={selectedWaypoint.y}
                    onChange={(e) =>
                      updateWaypoint(selectedWaypoint.id, {
                        y: parseInt(e.target.value) || 0,
                      })
                    }
                    className="bg-surface-100 border border-border rounded-xl px-3 py-1.5 font-mono text-white focus:border-accent-cyan focus:outline-none"
                  />
                </div>

                {/* Action Type */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-medium">Action Type</label>
                  <select
                    value={selectedWaypoint.actionType}
                    onChange={(e) =>
                      updateWaypoint(selectedWaypoint.id, {
                        actionType: e.target.value as WaypointActionType,
                      })
                    }
                    className="bg-surface-100 border border-border rounded-xl px-3 py-1.5 text-white focus:border-accent-cyan focus:outline-none"
                  >
                    <option value="click">Single Click</option>
                    <option value="double_click">Double Click</option>
                    <option value="right_click">Right Click</option>
                    <option value="middle_click">Middle Click</option>
                    <option value="move_only">Move Cursor Only</option>
                    <option value="drag_to">Drag & Drop To...</option>
                    <option value="key_press">Key Press</option>
                    <option value="wheel_scroll">Wheel Scroll</option>
                    <option value="wait">Wait Pause</option>
                  </select>
                </div>

                {/* Jitter Radius */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-medium">
                    Jitter Halo: ±{selectedWaypoint.jitterRadius}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={selectedWaypoint.jitterRadius}
                    onChange={(e) =>
                      updateWaypoint(selectedWaypoint.id, {
                        jitterRadius: parseInt(e.target.value) || 0,
                      })
                    }
                    className="accent-accent-cyan mt-2"
                  />
                </div>

                {/* Delay Before */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-medium">Delay Before (ms)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={selectedWaypoint.delayBeforeMs}
                    onChange={(e) =>
                      updateWaypoint(selectedWaypoint.id, {
                        delayBeforeMs: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="bg-surface-100 border border-border rounded-xl px-3 py-1.5 font-mono text-white focus:border-accent-cyan focus:outline-none"
                  />
                </div>

                {/* Delay After */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-medium">Delay After (ms)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={selectedWaypoint.delayAfterMs}
                    onChange={(e) =>
                      updateWaypoint(selectedWaypoint.id, {
                        delayAfterMs: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="bg-surface-100 border border-border rounded-xl px-3 py-1.5 font-mono text-white focus:border-accent-cyan focus:outline-none"
                  />
                </div>

                {/* Drag Coordinates (if drag_to) */}
                {selectedWaypoint.actionType === 'drag_to' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-purple-300 font-medium">Drop Target X</label>
                      <input
                        type="number"
                        value={selectedWaypoint.targetX ?? selectedWaypoint.x + 100}
                        onChange={(e) =>
                          updateWaypoint(selectedWaypoint.id, {
                            targetX: parseInt(e.target.value) || 0,
                          })
                        }
                        className="bg-surface-100 border border-purple-500/40 rounded-xl px-3 py-1.5 font-mono text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-purple-300 font-medium">Drop Target Y</label>
                      <input
                        type="number"
                        value={selectedWaypoint.targetY ?? selectedWaypoint.y + 100}
                        onChange={(e) =>
                          updateWaypoint(selectedWaypoint.id, {
                            targetY: parseInt(e.target.value) || 0,
                          })
                        }
                        className="bg-surface-100 border border-purple-500/40 rounded-xl px-3 py-1.5 font-mono text-white focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Key Press input (if key_press) */}
                {selectedWaypoint.actionType === 'key_press' && (
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[11px] text-amber-300 font-medium">Target Key (e.g. 'q', 'Enter', 'Space')</label>
                    <input
                      type="text"
                      value={selectedWaypoint.key ?? 'q'}
                      onChange={(e) =>
                        updateWaypoint(selectedWaypoint.id, {
                          key: e.target.value,
                        })
                      }
                      className="bg-surface-100 border border-amber-500/40 rounded-xl px-3 py-1.5 font-mono text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* Preset Profiles Modal */}
      {/* -------------------------------------------------- */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent-cyan" />
                <h3 className="text-lg font-bold text-white">Preset Macro Sequences</h3>
              </div>
              <button
                onClick={() => setShowPresetsModal(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {BUILT_IN_PROFILES.filter((p) => p.macroSequence).map((profile) => (
                <div
                  key={profile.id}
                  className="p-4 rounded-2xl bg-surface-100 hover:bg-surface-200 border border-border flex flex-col justify-between gap-3 transition-all group cursor-pointer"
                  onClick={() => profile.macroSequence && loadPresetProfile(profile.macroSequence)}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white group-hover:text-accent-cyan transition-colors">
                        {profile.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
                        {profile.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {profile.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400">
                    <span>{profile.macroSequence?.waypoints.length} Waypoints</span>
                    <span className="text-cyan-400 font-semibold group-hover:underline">
                      Load Sequence →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
