import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Crosshair,
  Plus,
  Trash2,
  Play,
  Square,
  Pause,
  Eye,
  EyeOff,
  Move,
  Clock,
  MousePointer,
  Maximize,
  Sparkles,
  Layers,
  Settings2,
  Check,
  X,
  Target,
  Zap,
} from 'lucide-react';
import { Waypoint, WaypointRoute, ClickActionType, OverlayState } from '../types/waypoint';
import { soundEngine } from '../services/soundEngine';

export interface WaypointOverlayProps {
  route?: WaypointRoute;
  activeWaypointIndex?: number | null;
  isRunning?: boolean;
  isRecording?: boolean;
  onAddWaypoint?: (waypoint: Omit<Waypoint, 'id' | 'index'>) => void;
  onUpdateWaypoint?: (id: string, updates: Partial<Waypoint>) => void;
  onDeleteWaypoint?: (id: string) => void;
  onToggleRouteExecution?: () => void;
  onClose?: () => void;
  className?: string;
}

export const WaypointOverlay: React.FC<WaypointOverlayProps> = ({
  route: externalRoute,
  activeWaypointIndex = null,
  isRunning = false,
  isRecording = false,
  onAddWaypoint,
  onUpdateWaypoint,
  onDeleteWaypoint,
  onToggleRouteExecution,
  onClose,
  className = '',
}) => {
  // Default route if none provided
  const [internalWaypoints, setInternalWaypoints] = useState<Waypoint[]>([
    { id: 'wp-1', index: 1, x: 380, y: 260, action: 'left', delayMs: 150, label: 'Boss Head' },
    { id: 'wp-2', index: 2, x: 820, y: 340, action: 'left', delayMs: 100, label: 'Item Chest' },
    { id: 'wp-3', index: 3, x: 1140, y: 580, action: 'right', delayMs: 250, label: 'Skill Slot 1' },
    { id: 'wp-4', index: 4, x: 640, y: 720, action: 'double', delayMs: 80, label: 'Confirm Dialog' },
  ]);

  const waypoints = externalRoute?.waypoints || internalWaypoints;

  // Overlay interaction state
  const [overlayState, setOverlayState] = useState<OverlayState>({
    isVisible: true,
    isPickingCoordinates: false,
    isInteractive: true,
    showLabels: true,
    showCoordinates: true,
    showBezierCurves: true,
    showLoupeMagnifier: true,
    magnifierZoom: 2,
    loupePosition: { x: 0, y: 0 },
    crosshairColor: '#00f2fe',
    selectedWaypointId: null,
  });

  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggedWaypointId, setDraggedWaypointId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<ClickActionType>('left');
  const [selectedDelay, setSelectedDelay] = useState<number>(100);

  // Track real-time mouse movement for crosshair and coordinate loupe
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setMousePos({ x, y });

    // Waypoint dragging in interactive mode
    if (draggedWaypointId) {
      if (onUpdateWaypoint) {
        onUpdateWaypoint(draggedWaypointId, { x, y });
      } else {
        setInternalWaypoints((prev) =>
          prev.map((wp) => (wp.id === draggedWaypointId ? { ...wp, x, y } : wp))
        );
      }
    }
  }, [draggedWaypointId, onUpdateWaypoint]);

  const handleGlobalMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // If we are currently in coordinate picking mode
    if (overlayState.isPickingCoordinates) {
      soundEngine.playClick('kailh-box-white');
      const newPoint: Omit<Waypoint, 'id' | 'index'> = {
        x: mousePos.x,
        y: mousePos.y,
        action: selectedAction,
        delayMs: selectedDelay,
        label: `Waypoint ${waypoints.length + 1}`,
      };

      if (onAddWaypoint) {
        onAddWaypoint(newPoint);
      } else {
        const id = `wp-${Date.now()}`;
        setInternalWaypoints((prev) => [
          ...prev,
          { ...newPoint, id, index: prev.length + 1 },
        ]);
      }

      // Exit coordinate picking or stay depending on workflow
      setOverlayState((prev) => ({ ...prev, isPickingCoordinates: false }));
    }
  };

  const handleWaypointMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!overlayState.isInteractive) return;
    setDraggedWaypointId(id);
    setOverlayState((prev) => ({ ...prev, selectedWaypointId: id }));
  };

  const handleMouseUp = () => {
    setDraggedWaypointId(null);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEngine.playClick('tech-pulse');
    if (onDeleteWaypoint) {
      onDeleteWaypoint(id);
    } else {
      setInternalWaypoints((prev) =>
        prev
          .filter((wp) => wp.id !== id)
          .map((wp, idx) => ({ ...wp, index: idx + 1 }))
      );
    }
    if (overlayState.selectedWaypointId === id) {
      setOverlayState((prev) => ({ ...prev, selectedWaypointId: null }));
    }
  };

  /**
   * Generates smooth cubic Bezier path string connecting all waypoints in order
   */
  const bezierPathData = useMemo(() => {
    if (waypoints.length < 2) return '';

    let d = `M ${waypoints[0].x} ${waypoints[0].y}`;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const p0 = i > 0 ? waypoints[i - 1] : waypoints[i];
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const p3 = i < waypoints.length - 2 ? waypoints[i + 2] : p2;

      // Catmull-Rom to Cubic Bezier control points calculation
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x} ${p2.y}`;
    }

    return d;
  }, [waypoints]);

  const getActionColor = (action: ClickActionType) => {
    switch (action) {
      case 'left':
        return '#00f2fe';
      case 'right':
        return '#e100ff';
      case 'middle':
        return '#ffaa00';
      case 'double':
        return '#00f5a0';
      case 'hold':
        return '#ff3366';
      default:
        return '#4facfe';
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseDown={handleGlobalMouseDown}
      onMouseUp={handleMouseUp}
      className={`fixed inset-0 w-screen h-screen z-[9990] overflow-hidden select-none transition-colors ${
        overlayState.isInteractive
          ? overlayState.isPickingCoordinates
            ? 'bg-black/35 cursor-crosshair'
            : 'bg-black/20'
          : 'pointer-events-none bg-transparent'
      } ${className}`}
    >
      {/* Top Floating Control Bar (Interactive only) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-2 bg-card/90 border border-white/15 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-2xl text-slate-100">
        <div className="flex items-center gap-2 pr-3 border-r border-white/10">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
              Waypoint HUD
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                {waypoints.length} TARGETS
              </span>
            </h1>
          </div>
        </div>

        {/* Action / Recording Tools */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick('cyber-laser');
              setOverlayState((prev) => ({
                ...prev,
                isPickingCoordinates: !prev.isPickingCoordinates,
              }));
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
              overlayState.isPickingCoordinates
                ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan animate-pulse ring-2 ring-white/50'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            {overlayState.isPickingCoordinates ? 'Click to Set Point' : 'Pick Target'}
          </button>

          {/* Execution Toggle */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick('retro-arcade');
              onToggleRouteExecution?.();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              isRunning
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-glow-rose'
                : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black shadow-glow-emerald'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>Stop Route</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Run Route</span>
              </>
            )}
          </button>
        </div>

        {/* View Toggles */}
        <div className="flex items-center gap-1 pl-2 border-l border-white/10">
          <button
            type="button"
            onClick={() =>
              setOverlayState((prev) => ({ ...prev, showBezierCurves: !prev.showBezierCurves }))
            }
            title={overlayState.showBezierCurves ? 'Hide Neon Paths' : 'Show Neon Paths'}
            className={`p-1.5 rounded-lg transition-colors ${
              overlayState.showBezierCurves
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() =>
              setOverlayState((prev) => ({ ...prev, showLoupeMagnifier: !prev.showLoupeMagnifier }))
            }
            title="Toggle Coordinate Loupe"
            className={`p-1.5 rounded-lg transition-colors ${
              overlayState.showLoupeMagnifier
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() =>
              setOverlayState((prev) => ({ ...prev, isInteractive: !prev.isInteractive }))
            }
            title={overlayState.isInteractive ? 'Switch to Click-Through' : 'Switch to Edit Mode'}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors ${
              overlayState.isInteractive
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {overlayState.isInteractive ? 'EDIT MODE' : 'CLICK-THROUGH'}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas for Glowing Neon Bezier Splines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#7f00ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00f5a0" stopOpacity="0.9" />
          </linearGradient>

          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="intenseGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="3" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {overlayState.showBezierCurves && bezierPathData && (
          <>
            {/* Ambient Background Blur Glow */}
            <path
              d={bezierPathData}
              fill="none"
              stroke="url(#neonGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.35"
              filter="url(#intenseGlow)"
            />

            {/* Sharp Glowing Vector Path */}
            <path
              d={bezierPathData}
              fill="none"
              stroke="url(#neonGradient)"
              strokeWidth="2.5"
              strokeDasharray="8 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#neonGlow)"
              className="animate-[dash_1.5s_linear_infinite]"
            />
          </>
        )}
      </svg>

      {/* Render Waypoint Target Markers */}
      {waypoints.map((wp, idx) => {
        const isActive = activeWaypointIndex === idx;
        const isSelected = overlayState.selectedWaypointId === wp.id;
        const actionColor = getActionColor(wp.action);

        return (
          <div
            key={wp.id}
            onMouseDown={(e) => handleWaypointMouseDown(e, wp.id)}
            style={{
              left: `${wp.x}px`,
              top: `${wp.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute z-30 transition-transform select-none ${
              overlayState.isInteractive ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : 'pointer-events-none'
            } ${isActive ? 'scale-125' : 'hover:scale-110'}`}
          >
            {/* Animated Target Rings */}
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing sonar wave when executing */}
              {isActive && (
                <div
                  className="absolute -inset-4 rounded-full border-2 border-cyan-400 animate-ping opacity-60 pointer-events-none"
                  style={{ borderColor: actionColor }}
                />
              )}

              {/* Glowing Outer Hex / Circle Reticle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-black text-sm text-slate-950 border-2 shadow-2xl transition-all ${
                  isActive
                    ? 'ring-4 ring-white/60 scale-110'
                    : isSelected
                    ? 'ring-2 ring-white/40'
                    : ''
                }`}
                style={{
                  backgroundColor: actionColor,
                  borderColor: '#ffffff',
                  boxShadow: `0 0 24px ${actionColor}`,
                }}
              >
                {wp.index}
              </div>

              {/* Crosshair Accent Ticks */}
              <div className="absolute -top-2 w-0.5 h-1.5 bg-white/80" />
              <div className="absolute -bottom-2 w-0.5 h-1.5 bg-white/80" />
              <div className="absolute -left-2 w-1.5 h-0.5 bg-white/80" />
              <div className="absolute -right-2 w-1.5 h-0.5 bg-white/80" />

              {/* Waypoint Info Badge / Tooltip */}
              {overlayState.showCoordinates && (
                <div
                  className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-white/20 px-2.5 py-1 rounded-xl shadow-xl backdrop-blur-md whitespace-nowrap flex flex-col items-center gap-0.5 pointer-events-auto"
                >
                  <span className="text-[10px] font-bold text-white tracking-wide">
                    {wp.label || `Target #${wp.index}`}
                  </span>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-300">
                    <span className="text-cyan-300 font-semibold uppercase">{wp.action}</span>
                    <span>•</span>
                    <span className="text-amber-300">{wp.delayMs}ms</span>
                    <span>•</span>
                    <span className="text-slate-400">({wp.x}, {wp.y})</span>
                  </div>

                  {/* Delete Button (in edit mode) */}
                  {overlayState.isInteractive && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(wp.id, e)}
                      title="Delete Waypoint"
                      className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 shadow-md transition-colors"
                    >
                      <X className="w-2.5 h-2.5 stroke-[3]" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Real-time Cursor Coordinate Loupe & Reticle */}
      {overlayState.isPickingCoordinates && overlayState.showLoupeMagnifier && (
        <div
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="pointer-events-none absolute z-40"
        >
          {/* Circular Precision Reticle */}
          <div className="relative w-20 h-20 rounded-full border-2 border-cyan-400 shadow-glow-cyan flex items-center justify-center">
            {/* Crosshair Grid */}
            <div className="absolute w-full h-[1px] bg-cyan-400/50" />
            <div className="absolute h-full w-[1px] bg-cyan-400/50" />
            <div className="w-2 h-2 rounded-full border border-white bg-cyan-400 shadow-sm" />

            {/* Live Pixel Coordinates Badge */}
            <div className="absolute top-22 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-cyan-500/50 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-cyan-300 whitespace-nowrap shadow-2xl flex items-center gap-1.5">
              <span>X: {mousePos.x}</span>
              <span className="text-slate-600">|</span>
              <span>Y: {mousePos.y}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaypointOverlay;
