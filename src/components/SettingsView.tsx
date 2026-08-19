import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  Keyboard, 
  Volume2, 
  VolumeX,
  Sparkles, 
  ShieldAlert, 
  Zap, 
  Palette,
  RefreshCw,
  Play,
  Activity,
  Sliders
} from 'lucide-react';
import { AppSettings, ThemeAccent } from '../types';
import { playClickSound, soundEngine, SOUND_PROFILES } from '../utils/audio';
import { SoundProfileId } from '../types/sound';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenUpdateModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onOpenUpdateModal,
}) => {
  const [activeLevel, setActiveLevel] = useState(0);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Subscribe to audio level for live VU meter in settings
  useEffect(() => {
    const unsub = soundEngine.subscribeToLevel((lvl) => {
      setActiveLevel(lvl);
    });
    return () => unsub();
  }, []);

  const accents: { id: ThemeAccent; label: string; color: string }[] = [
    { id: 'cyan', label: 'Cyberpunk Cyan', color: '#00f2fe' },
    { id: 'purple', label: 'Neon Violet', color: '#7f00ff' },
    { id: 'emerald', label: 'Matrix Emerald', color: '#00f5a0' },
    { id: 'rose', label: 'Crimson Rose', color: '#ff3366' },
    { id: 'amber', label: 'Solar Amber', color: '#ffaa00' },
  ];

  const handleAudition = (e: React.MouseEvent, profileId: SoundProfileId) => {
    e.stopPropagation();
    onUpdateSettings({ audioTheme: profileId });
    playClickSound(profileId, settings.soundVolume);
    setPreviewingId(profileId);
    setTimeout(() => setPreviewingId(null), 180);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-4 border border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Engine Configuration & Hardware Calibration
            </h2>
            <p className="text-xs text-slate-400">
              Fine-tune high-precision timers, global desktop hotkeys, audio switch simulation, and desktop behavior.
            </p>
          </div>
        </div>

        {/* Check for Updates Header Quick Action */}
        {onOpenUpdateModal && (
          <button
            type="button"
            onClick={onOpenUpdateModal}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-semibold text-cyan-300 flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,242,254,0.15)]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Check for Updates</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CARD 1: Global Desktop Hotkeys */}
        <div className="glass-card rounded-2xl p-5 border border-white/[0.08] flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Keyboard className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Global Desktop Hotkeys
            </h3>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Start / Stop */}
            <div className="flex items-center justify-between bg-surface-50 p-2.5 rounded-xl border border-white/[0.04]">
              <span className="text-xs text-slate-300 font-medium">Start / Stop Toggle:</span>
              <kbd className="px-3 py-1 rounded-lg bg-black/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
                {settings.hotkeys.startStop}
              </kbd>
            </div>

            {/* Pick Location */}
            <div className="flex items-center justify-between bg-surface-50 p-2.5 rounded-xl border border-white/[0.04]">
              <span className="text-xs text-slate-300 font-medium">Screen Location Picker:</span>
              <kbd className="px-3 py-1 rounded-lg bg-black/60 border border-purple-500/40 text-purple-300 font-mono text-xs font-bold">
                {settings.hotkeys.pickLocation}
              </kbd>
            </div>

            {/* Record Macro */}
            <div className="flex items-center justify-between bg-surface-50 p-2.5 rounded-xl border border-white/[0.04]">
              <span className="text-xs text-slate-300 font-medium">Record Macro Trigger:</span>
              <kbd className="px-3 py-1 rounded-lg bg-black/60 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold">
                {settings.hotkeys.recordMacro}
              </kbd>
            </div>

            {/* Panic Stop (F12) */}
            <div className="flex items-center justify-between bg-surface-50 p-2.5 rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs text-slate-300 font-medium">Emergency Panic Kill:</span>
              </div>
              <kbd className="px-3 py-1 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-400 font-mono text-xs font-bold">
                {settings.hotkeys.panicStop}
              </kbd>
            </div>
          </div>
        </div>

        {/* CARD 2: Tactile Audio & Sound Synthesizer */}
        <div className="glass-card rounded-2xl p-5 border border-white/[0.08] flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Acoustic Click Synthesizer
              </h3>
            </div>

            {/* Live VU Meter indicator */}
            <div className="flex items-center gap-2">
              <Activity className={`w-3.5 h-3.5 transition-colors ${activeLevel > 0.08 ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`} />
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => {
                  onUpdateSettings({ soundEffects: e.target.checked });
                  soundEngine.setMuted(!e.target.checked);
                }}
                className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Volume Slider */}
          <div className={`flex flex-col gap-1.5 ${settings.soundEffects ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Volume Level:</span>
              <span className="font-mono text-cyan-400">{Math.round(settings.soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                onUpdateSettings({ soundVolume: vol });
                soundEngine.setMasterVolume(vol);
              }}
              className="neon-slider"
            />
          </div>

          {/* Audio Profile Selector (All 6 Profiles) */}
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Sound Profile Selection:
            </span>
            <div className="grid grid-cols-2 gap-1.5 max-h-[170px] overflow-y-auto pr-1 custom-scrollbar">
              {SOUND_PROFILES.map((prof) => {
                const isSelected = settings.audioTheme === prof.id || 
                  (settings.audioTheme === 'mechanical' && prof.id === 'cherry-mx-blue') ||
                  (settings.audioTheme === 'laser' && prof.id === 'cyber-laser') ||
                  (settings.audioTheme === 'synth' && prof.id === 'retro-arcade') ||
                  (settings.audioTheme === 'subtle' && prof.id === 'tech-pulse');

                return (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={(e) => handleAudition(e, prof.id)}
                    className={`p-2 rounded-xl text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-glow-cyan'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="text-xs font-bold truncate">{prof.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono truncate">{prof.badge}</div>
                    </div>
                    {prof.id !== 'muted' && (
                      <Play className={`w-3 h-3 flex-shrink-0 ${isSelected ? 'text-cyan-400 fill-cyan-400' : 'text-slate-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CARD 3: Engine Timers & Performance */}
        <div className="glass-card rounded-2xl p-5 border border-white/[0.08] flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Engine Timer Kernel
            </h3>
          </div>

          {/* High-precision timer */}
          <div className="flex items-center justify-between bg-surface-50 p-3 rounded-xl border border-white/[0.04]">
            <div>
              <div className="text-xs font-bold text-slate-200">Microsecond High-Resolution Timer</div>
              <div className="text-[10px] text-slate-400">Enables sub-millisecond Windows multimedia clock precision</div>
            </div>
            <input
              type="checkbox"
              checked={settings.highPrecisionTimer}
              onChange={(e) => onUpdateSettings({ highPrecisionTimer: e.target.checked })}
              className="accent-purple-400 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          {/* Always On Top */}
          <div className="flex items-center justify-between bg-surface-50 p-3 rounded-xl border border-white/[0.04]">
            <div>
              <div className="text-xs font-bold text-slate-200">Keep Window Always On Top</div>
              <div className="text-[10px] text-slate-400">Floats over full-screen games and applications</div>
            </div>
            <input
              type="checkbox"
              checked={settings.alwaysOnTop}
              onChange={(e) => {
                const checked = e.target.checked;
                onUpdateSettings({ alwaysOnTop: checked });
                if (typeof window !== 'undefined') {
                  const win = window as any;
                  if (win.electronAPI?.setAlwaysOnTop) {
                    win.electronAPI.setAlwaysOnTop(checked);
                  }
                }
              }}
              className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* CARD 4: Neo-Glassmorphic Aesthetic Themes */}
        <div className="glass-card rounded-2xl p-5 border border-white/[0.08] flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Cyberpunk Accent Theme
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {accents.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => onUpdateSettings({ accentColor: acc.id })}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                  settings.accentColor === acc.id
                    ? 'bg-white/10 border-white/40 shadow-glass'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: acc.color }}
                />
                <span className="text-xs font-semibold text-slate-200">{acc.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
