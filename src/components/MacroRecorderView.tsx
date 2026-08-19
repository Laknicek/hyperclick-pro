import React, { useState } from 'react';
import { 
  Disc, 
  Play, 
  Square, 
  Trash2, 
  Save, 
  Clock, 
  FastForward, 
  MousePointer, 
  Keyboard, 
  Sparkles,
  Download,
  Upload
} from 'lucide-react';
import { MacroRecording, MacroAction } from '../types';
import { playClickSound } from '../utils/audio';

interface MacroRecorderViewProps {
  isRecording: boolean;
  isPlaying: boolean;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onPlayMacro: (macro: MacroRecording) => void;
  onStopPlayMacro: () => void;
  soundEnabled: boolean;
}

export const MacroRecorderView: React.FC<MacroRecorderViewProps> = ({
  isRecording,
  isPlaying,
  onStartRecord,
  onStopRecord,
  onPlayMacro,
  onStopPlayMacro,
  soundEnabled,
}) => {
  const [recordings, setRecordings] = useState<MacroRecording[]>([
    {
      id: 'macro-sample-1',
      name: 'Standard Inventory Sorting Macro',
      createdAt: Date.now() - 3600000,
      durationMs: 4200,
      repeatCount: 1,
      playbackSpeed: 1.0,
      actions: [
        { id: '1', type: 'mouse-move', timestamp: 0, x: 500, y: 300 },
        { id: '2', type: 'mouse-down', timestamp: 120, button: 'left' },
        { id: '3', type: 'mouse-up', timestamp: 180, button: 'left' },
        { id: '4', type: 'mouse-move', timestamp: 450, x: 650, y: 300 },
        { id: '5', type: 'mouse-down', timestamp: 580, button: 'left' },
        { id: '6', type: 'mouse-up', timestamp: 640, button: 'left' },
      ]
    }
  ]);

  const [selectedMacroId, setSelectedMacroId] = useState<string>(recordings[0]?.id || '');

  const activeMacro = recordings.find((m) => m.id === selectedMacroId);

  const handleDeleteMacro = (id: string) => {
    if (soundEnabled) playClickSound('subtle', 0.2);
    setRecordings(recordings.filter((m) => m.id !== id));
    if (selectedMacroId === id) {
      setSelectedMacroId(recordings[0]?.id || '');
    }
  };

  const handleUpdateSpeed = (speed: number) => {
    if (!activeMacro) return;
    setRecordings(recordings.map((m) => m.id === activeMacro.id ? { ...m, playbackSpeed: speed } : m));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-4 border border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border transition-all ${
            isRecording 
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-glow-rose animate-pulse' 
              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
          }`}>
            <Disc className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Macro Recording & Automation Suite
            </h2>
            <p className="text-xs text-slate-400">
              Record real-time mouse movements, clicks, and keystrokes for lossless automated reproduction.
            </p>
          </div>
        </div>

        {/* Start / Stop Record Trigger */}
        <div>
          {isRecording ? (
            <button
              onClick={onStopRecord}
              className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-glow-rose hover:bg-rose-600 transition-all"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>STOP RECORDING</span>
            </button>
          ) : (
            <button
              onClick={onStartRecord}
              disabled={isPlaying}
              className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold text-xs flex items-center gap-2 hover:bg-rose-500/30 transition-all disabled:opacity-50"
            >
              <Disc className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>START RECORDING (F9)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Saved Macros List (5 cols) & Macro Inspector (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Saved Macros List */}
        <div className="lg:col-span-5 flex flex-col gap-2.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Saved Macros ({recordings.length})
          </h3>
          
          {recordings.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 border border-white/[0.08] text-center text-slate-500 text-xs">
              No macros recorded yet. Click &quot;Start Recording&quot; above.
            </div>
          ) : (
            recordings.map((macro) => (
              <div
                key={macro.id}
                onClick={() => setSelectedMacroId(macro.id)}
                className={`glass-card rounded-xl p-3 border cursor-pointer transition-all ${
                  selectedMacroId === macro.id
                    ? 'border-cyan-500/50 bg-cyan-500/10 shadow-glow-cyan'
                    : 'border-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${selectedMacroId === macro.id ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-200">{macro.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMacro(macro.id);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                  <span>{(macro.durationMs / 1000).toFixed(1)}s</span>
                  <span>•</span>
                  <span>{macro.actions.length} actions</span>
                  <span>•</span>
                  <span>{macro.playbackSpeed}x speed</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Selected Macro Inspector */}
        <div className="lg:col-span-7">
          {activeMacro ? (
            <div className="glass-card rounded-2xl p-5 border border-white/[0.08] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{activeMacro.name}</h3>
                  <span className="text-xs font-mono text-cyan-400">
                    Duration: {(activeMacro.durationMs / 1000).toFixed(2)} seconds
                  </span>
                </div>

                {/* Playback Trigger */}
                {isPlaying ? (
                  <button
                    onClick={onStopPlayMacro}
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-glow-rose"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>STOP REPLAY</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onPlayMacro(activeMacro)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-extrabold text-xs flex items-center gap-2 shadow-glow-cyan hover:scale-105 transition-transform"
                  >
                    <Play className="w-3.5 h-3.5 fill-black text-black" />
                    <span>REPLAY MACRO</span>
                  </button>
                )}
              </div>

              {/* Playback Speed Controls */}
              <div className="flex items-center justify-between bg-surface-50 p-3 rounded-xl border border-white/[0.04]">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <FastForward className="w-4 h-4 text-cyan-400" />
                  <span>Playback Speed Multiplier:</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  {[0.5, 1.0, 1.5, 2.0, 4.0].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleUpdateSpeed(spd)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeMacro.playbackSpeed === spd
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                          : 'bg-white/[0.03] text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Log Preview */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Action Timeline Stream ({activeMacro.actions.length} events)
                </span>
                <div className="max-h-48 overflow-y-auto bg-[#0a0d18] rounded-xl p-2.5 border border-white/[0.04] flex flex-col gap-1 font-mono text-xs">
                  {activeMacro.actions.map((act, i) => (
                    <div key={act.id} className="flex items-center justify-between text-slate-300 py-0.5 px-2 hover:bg-white/[0.03] rounded">
                      <span className="text-slate-500 text-[10px]">#{i + 1}</span>
                      <span className="text-cyan-400">{act.type}</span>
                      {act.button && <span className="text-purple-400">[{act.button}]</span>}
                      {act.x !== undefined && <span className="text-amber-400">({act.x}, {act.y})</span>}
                      <span className="text-slate-500 text-[11px]">+{act.timestamp}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-10 border border-white/[0.08] text-center text-slate-500 text-xs">
              Select a macro from the left to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
