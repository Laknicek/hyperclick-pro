import React, { useState } from 'react';
import { 
  Layers, 
  Sparkles, 
  Check, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Swords, 
  Gamepad2, 
  Crosshair, 
  Cookie, 
  Zap, 
  ShieldCheck,
  Flame
} from 'lucide-react';
import { Preset, ClickConfig, HumanizerConfig } from '../types';
import { playClickSound } from '../utils/audio';

interface PresetManagerProps {
  presets: Preset[];
  activePresetId: string | null;
  onApplyPreset: (preset: Preset) => void;
  onSaveCurrentAsPreset: (name: string, category: 'Gaming' | 'Productivity' | 'Automation' | 'Testing' | 'Custom') => void;
  onDeletePreset: (id: string) => void;
  currentConfig: ClickConfig;
  currentHumanizer: HumanizerConfig;
  soundEnabled: boolean;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  activePresetId,
  onApplyPreset,
  onSaveCurrentAsPreset,
  onDeletePreset,
  currentConfig,
  currentHumanizer,
  soundEnabled,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState<'Gaming' | 'Productivity' | 'Automation' | 'Testing' | 'Custom'>('Custom');
  const [isCreating, setIsCreating] = useState(false);

  const categories = ['All', 'Gaming', 'Productivity', 'Automation', 'Testing', 'Custom'];

  const filteredPresets = selectedCategory === 'All'
    ? presets
    : presets.filter((p) => p.category === selectedCategory);

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Swords': return Swords;
      case 'Gamepad2': return Gamepad2;
      case 'Crosshair': return Crosshair;
      case 'Cookie': return Cookie;
      case 'Zap': return Zap;
      case 'Flame': return Flame;
      case 'ShieldCheck': return ShieldCheck;
      default: return Layers;
    }
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    if (soundEnabled) playClickSound('synth', 0.25);
    onSaveCurrentAsPreset(newPresetName.trim(), newPresetCategory);
    setNewPresetName('');
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Banner & Action */}
      <div className="glass-card rounded-2xl p-4 border border-white/[0.08] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Battle-Tested Gamer & Productivity Presets
            </h2>
            <p className="text-xs text-slate-400">
              One-click optimized configurations for competitive titles, AFK grinding, and high-frequency testing.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-glow-cyan hover:bg-cyan-400 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Save Current Setup</span>
        </button>
      </div>

      {/* New Preset Drawer */}
      {isCreating && (
        <form onSubmit={handleSavePreset} className="glass-card rounded-2xl p-4 border border-cyan-500/30 bg-cyan-950/20 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            placeholder="Preset Name (e.g. Bedwars God Clicker)"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs font-semibold text-white w-full sm:w-72"
            autoFocus
          />
          <select
            value={newPresetCategory}
            onChange={(e) => setNewPresetCategory(e.target.value as any)}
            className="glass-input rounded-xl px-3 py-2 text-xs font-semibold text-white bg-[#0e1220]"
          >
            <option value="Gaming">Gaming</option>
            <option value="Productivity">Productivity</option>
            <option value="Automation">Automation</option>
            <option value="Testing">Testing</option>
            <option value="Custom">Custom</option>
          </select>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-400 text-black font-bold text-xs shadow-glow-cyan"
            >
              Save Preset
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-2 rounded-xl bg-white/5 text-slate-400 text-xs hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                : 'bg-white/[0.02] text-slate-400 hover:text-white border border-white/[0.04]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPresets.map((preset) => {
          const Icon = getPresetIcon(preset.iconName);
          const isCurrentActive = activePresetId === preset.id;
          
          // Calculate approx CPS
          const totalMs = 
            preset.config.interval.hours * 3600000 +
            preset.config.interval.minutes * 60000 +
            preset.config.interval.seconds * 1000 +
            preset.config.interval.milliseconds +
            preset.config.interval.microseconds / 1000;
          const cps = totalMs > 0 ? (1000 / totalMs).toFixed(0) : '1,000+';

          return (
            <div
              key={preset.id}
              className={`glass-card rounded-2xl p-4 border transition-all flex flex-col justify-between group ${
                isCurrentActive
                  ? 'border-cyan-500/60 bg-cyan-950/20 shadow-glow-cyan'
                  : 'border-white/[0.06] hover:border-white/20'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="p-2 rounded-xl border flex items-center justify-center"
                      style={{ backgroundColor: `${preset.color}15`, borderColor: `${preset.color}40`, color: preset.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {preset.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {preset.category}
                      </span>
                    </div>
                  </div>

                  {/* CPS Tag */}
                  <div className="px-2 py-0.5 rounded-lg bg-black/50 border border-white/10 text-cyan-400 font-mono text-xs font-bold">
                    {cps} CPS
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {preset.description}
                </p>

                {/* Features Pills */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">
                    {preset.config.mouseButton.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">
                    {preset.config.clickType.toUpperCase()}
                  </span>
                  {preset.humanizer.enabled && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      STEALTH JITTER
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => {
                    if (soundEnabled) playClickSound('synth', 0.2);
                    onApplyPreset(preset);
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isCurrentActive
                      ? 'bg-cyan-500 text-black shadow-glow-cyan'
                      : 'bg-white/[0.04] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/[0.08] hover:border-cyan-500/30'
                  }`}
                >
                  {isCurrentActive ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                      <span>ACTIVE PROFILE</span>
                    </>
                  ) : (
                    <span>LOAD PROFILE</span>
                  )}
                </button>

                {!preset.isBuiltIn && (
                  <button
                    type="button"
                    onClick={() => onDeletePreset(preset.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete preset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
