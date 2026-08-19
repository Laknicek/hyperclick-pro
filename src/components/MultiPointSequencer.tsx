import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Play, 
  Square, 
  Target, 
  Layers, 
  Clock, 
  Shuffle, 
  ArrowUp, 
  ArrowDown, 
  Move,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { SequencePoint, SequenceConfig, MouseButton } from '../types';
import { playClickSound } from '../utils/audio';

interface MultiPointSequencerProps {
  sequence: SequenceConfig;
  onChangeSequence: (newSeq: SequenceConfig) => void;
  isRunning: boolean;
  onToggleRunSequence: () => void;
  onPickPointLocation: (pointId: string) => void;
  soundEnabled: boolean;
}

export const MultiPointSequencer: React.FC<MultiPointSequencerProps> = ({
  sequence,
  onChangeSequence,
  isRunning,
  onToggleRunSequence,
  onPickPointLocation,
  soundEnabled,
}) => {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  const handleAddPoint = () => {
    if (soundEnabled) playClickSound('subtle', 0.2);
    const newPoint: SequencePoint = {
      id: `pt-${Date.now()}`,
      name: `Step ${sequence.points.length + 1}`,
      x: 960,
      y: 540,
      button: 'left',
      delayAfterMs: 250,
      holdDurationMs: 50,
      active: true,
      jitterRadius: 2,
    };
    onChangeSequence({
      ...sequence,
      points: [...sequence.points, newPoint],
    });
  };

  const handleRemovePoint = (id: string) => {
    if (soundEnabled) playClickSound('subtle', 0.2);
    onChangeSequence({
      ...sequence,
      points: sequence.points.filter((p) => p.id !== id),
    });
  };

  const handleUpdatePoint = (id: string, updates: Partial<SequencePoint>) => {
    onChangeSequence({
      ...sequence,
      points: sequence.points.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
  };

  const handleMovePoint = (index: number, direction: 'up' | 'down') => {
    if (soundEnabled) playClickSound('subtle', 0.2);
    const newPoints = [...sequence.points];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newPoints.length) return;
    const temp = newPoints[index];
    newPoints[index] = newPoints[targetIdx];
    newPoints[targetIdx] = temp;
    onChangeSequence({ ...sequence, points: newPoints });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header Banner */}
      <div className="glass-card rounded-2xl p-4 border border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Multi-Point Coordinate Sequencer
            </h2>
            <p className="text-xs text-slate-400">
              Chain multiple desktop screen clicks with per-step delays, hold times, and dynamic coordinates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddPoint}
            disabled={isRunning}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-glow-cyan transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Target Point</span>
          </button>
        </div>
      </div>

      {/* Sequence Points List */}
      <div className="flex flex-col gap-2.5">
        {sequence.points.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 border border-white/[0.08] flex flex-col items-center justify-center text-center gap-3">
            <Target className="w-12 h-12 text-slate-600 animate-pulse" />
            <p className="text-sm font-semibold text-slate-300">No Target Points Defined</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Click &quot;Add Target Point&quot; to begin building your automated multi-click workflow.
            </p>
            <button
              onClick={handleAddPoint}
              className="mt-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500/30 transition-all"
            >
              Add Your First Point
            </button>
          </div>
        ) : (
          sequence.points.map((point, index) => (
            <div
              key={point.id}
              className={`glass-card rounded-2xl p-3.5 border transition-all ${
                point.active 
                  ? 'border-white/[0.08] hover:border-cyan-500/30' 
                  : 'border-white/[0.03] opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Step Index & Coordinates */}
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-white/[0.05] border border-white/10 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center">
                    {index + 1}
                  </span>

                  <input
                    type="text"
                    value={point.name}
                    onChange={(e) => handleUpdatePoint(point.id, { name: e.target.value })}
                    disabled={isRunning}
                    className="glass-input rounded-lg px-2 py-1 text-xs font-semibold text-white w-32"
                  />

                  {/* Coordinates X, Y */}
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/[0.06]">
                      <span className="text-amber-400 font-bold">X:</span>
                      <input
                        type="number"
                        value={point.x}
                        onChange={(e) => handleUpdatePoint(point.id, { x: parseInt(e.target.value, 10) || 0 })}
                        disabled={isRunning}
                        className="bg-transparent border-0 w-12 text-center text-xs font-bold text-white focus:outline-none p-0"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/[0.06]">
                      <span className="text-amber-400 font-bold">Y:</span>
                      <input
                        type="number"
                        value={point.y}
                        onChange={(e) => handleUpdatePoint(point.id, { y: parseInt(e.target.value, 10) || 0 })}
                        disabled={isRunning}
                        className="bg-transparent border-0 w-12 text-center text-xs font-bold text-white focus:outline-none p-0"
                      />
                    </div>
                    
                    {/* Pick Location Button */}
                    <button
                      type="button"
                      onClick={() => onPickPointLocation(point.id)}
                      disabled={isRunning}
                      className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all"
                      title="Pick coordinate with mouse"
                    >
                      <Target className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Center & Right Controls */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Button Action */}
                  <select
                    value={point.button}
                    onChange={(e) => handleUpdatePoint(point.id, { button: e.target.value as MouseButton })}
                    disabled={isRunning}
                    className="glass-input rounded-lg px-2 py-1 text-xs font-medium text-slate-200 bg-[#0a0d18]"
                  >
                    <option value="left">Left Click</option>
                    <option value="right">Right Click</option>
                    <option value="middle">Middle Click</option>
                    <option value="double">Double Click</option>
                  </select>

                  {/* Delay After */}
                  <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/[0.06] text-xs font-mono">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={point.delayAfterMs}
                      onChange={(e) => handleUpdatePoint(point.id, { delayAfterMs: parseInt(e.target.value, 10) || 0 })}
                      disabled={isRunning}
                      className="bg-transparent border-0 w-12 text-center text-xs font-bold text-cyan-300 focus:outline-none p-0"
                    />
                    <span className="text-slate-500 text-[10px]">ms</span>
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleMovePoint(index, 'up')}
                      disabled={index === 0 || isRunning}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMovePoint(index, 'down')}
                      disabled={index === sequence.points.length - 1 || isRunning}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleRemovePoint(point.id)}
                    disabled={isRunning}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-30"
                    title="Delete step"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sequence Settings Footer */}
      {sequence.points.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-white/[0.08] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={sequence.loopMode === 'infinite'}
                onChange={(e) => onChangeSequence({
                  ...sequence,
                  loopMode: e.target.checked ? 'infinite' : 'count',
                })}
                disabled={isRunning}
                className="accent-cyan-400 rounded"
              />
              <span>Loop Infinitely</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={sequence.randomizeOrder}
                onChange={(e) => onChangeSequence({
                  ...sequence,
                  randomizeOrder: e.target.checked,
                })}
                disabled={isRunning}
                className="accent-cyan-400 rounded"
              />
              <span>Randomize Step Order</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleRunSequence}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                isRunning
                  ? 'bg-rose-500 text-white shadow-glow-rose hover:bg-rose-600'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-extrabold shadow-glow-cyan hover:scale-105'
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>STOP SEQUENCE</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black text-black" />
                  <span>EXECUTE SEQUENCE</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
