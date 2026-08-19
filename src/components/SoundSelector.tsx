import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Sparkles,
  Sliders,
  Play,
  Check,
  Disc,
  Headphones,
  Zap,
  Activity,
  Music,
  Radio,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { soundEngine, SOUND_PROFILES } from '../services/soundEngine';
import { SoundProfileId, SoundEngineConfig } from '../types/sound';

interface SoundSelectorProps {
  config?: SoundEngineConfig;
  onChange?: (config: SoundEngineConfig) => void;
  className?: string;
  isCompact?: boolean;
}

export const SoundSelector: React.FC<SoundSelectorProps> = ({
  config: externalConfig,
  onChange,
  className = '',
  isCompact = false,
}) => {
  // Local state initialized from soundEngine or externalConfig
  const [config, setConfig] = useState<SoundEngineConfig>(() => {
    return externalConfig || soundEngine.getConfig();
  });

  const [activeLevel, setActiveLevel] = useState<number>(0);
  const [previewingId, setPreviewingId] = useState<SoundProfileId | null>(null);
  const [isBurstActive, setIsBurstActive] = useState<boolean>(false);
  const burstTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external config if provided
  useEffect(() => {
    if (externalConfig) {
      setConfig(externalConfig);
      soundEngine.updateConfig(externalConfig);
    }
  }, [externalConfig]);

  // Subscribe to real-time audio volume output for live VU meter
  useEffect(() => {
    const unsubscribe = soundEngine.subscribeToLevel((lvl) => {
      setActiveLevel(lvl);
    });
    return () => {
      unsubscribe();
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    };
  }, []);

  const handleProfileSelect = (profileId: SoundProfileId) => {
    const updated = { ...config, profile: profileId };
    setConfig(updated);
    soundEngine.setProfile(profileId);
    onChange?.(updated);
    // Play preview on selection
    soundEngine.playClick(profileId);
    setPreviewingId(profileId);
    setTimeout(() => setPreviewingId(null), 180);
  };

  const handlePreview = (e: React.MouseEvent, profileId: SoundProfileId) => {
    e.stopPropagation();
    soundEngine.playClick(profileId);
    setPreviewingId(profileId);
    setTimeout(() => setPreviewingId(null), 180);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    const updated = { ...config, masterVolume: vol, muted: vol === 0 ? true : false };
    setConfig(updated);
    soundEngine.setMasterVolume(vol);
    if (vol > 0 && config.muted) {
      soundEngine.setMuted(false);
    }
    onChange?.(updated);
  };

  const handleMuteToggle = () => {
    const newMuted = !config.muted;
    const updated = { ...config, muted: newMuted };
    setConfig(updated);
    soundEngine.setMuted(newMuted);
    onChange?.(updated);
  };

  const handlePitchModChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mod = parseFloat(e.target.value);
    const updated = { ...config, pitchModulation: mod };
    setConfig(updated);
    soundEngine.setPitchModulation(mod);
    onChange?.(updated);
  };

  const handleHumanizeToggle = () => {
    const updated = { ...config, humanizeClicks: !config.humanizeClicks };
    setConfig(updated);
    soundEngine.setHumanizeClicks(updated.humanizeClicks);
    onChange?.(updated);
  };

  const handleTestBurst = (count = 6, cps = 14) => {
    if (isBurstActive) return;
    setIsBurstActive(true);
    soundEngine.playBurst(count, cps, config.profile);
    burstTimerRef.current = setTimeout(() => {
      setIsBurstActive(false);
    }, (count * 1000) / cps + 100);
  };

  // Get icon for profile category
  const getProfileIcon = (category: string, id: string) => {
    switch (category) {
      case 'mechanical':
        return <Layers className="w-4 h-4" />;
      case 'scifi':
        return <Zap className="w-4 h-4" />;
      case 'organic':
        return <Sparkles className="w-4 h-4" />;
      case 'arcade':
        return <Radio className="w-4 h-4" />;
      case 'minimal':
        return <Activity className="w-4 h-4" />;
      default:
        return <VolumeX className="w-4 h-4" />;
    }
  };

  const selectedProfileObj = SOUND_PROFILES.find((p) => p.id === config.profile) || SOUND_PROFILES[0];

  return (
    <div className={`bg-card/95 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 text-slate-100 ${className}`}>
      {/* Header Section */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400 shadow-glow-cyan">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-wide text-white flex items-center gap-2">
              Acoustic Synthesizer
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                Web Audio 2026
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Zero-latency real-time procedural sound waves
            </p>
          </div>
        </div>

        {/* Live Audio Level / VU Meter */}
        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10">
          <Activity className={`w-3.5 h-3.5 transition-colors ${activeLevel > 0.1 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
            {[...Array(8)].map((_, i) => {
              const threshold = (i + 1) / 8;
              const isLit = activeLevel >= threshold * 0.7;
              const colorClass = i > 5 ? 'bg-rose-500' : i > 3 ? 'bg-amber-400' : 'bg-emerald-400';
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all duration-75 ${
                    isLit ? `${colorClass} shadow-sm opacity-100` : 'bg-slate-700/40 opacity-30'
                  }`}
                />
              );
            })}
          </div>
          <span className="text-[11px] font-mono text-slate-400 min-w-[28px] text-right">
            {Math.round(activeLevel * 100)}%
          </span>
        </div>
      </div>

      {/* Profile Selector Grid */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-cyan-400" />
            Sound Profile Selection
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            Active: <strong className="text-cyan-300">{selectedProfileObj.name}</strong>
          </span>
        </div>

        <div className={`grid ${isCompact ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5'}`}>
          {SOUND_PROFILES.map((prof) => {
            const isSelected = config.profile === prof.id;
            const isPreviewing = previewingId === prof.id;

            return (
              <div
                key={prof.id}
                onClick={() => handleProfileSelect(prof.id)}
                style={{
                  borderColor: isSelected ? prof.color : undefined,
                  boxShadow: isSelected ? `0 0 16px -2px ${prof.glowColor}` : undefined,
                }}
                className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-slate-800/90 border-opacity-90 shadow-md ring-1 ring-white/20'
                    : 'bg-slate-900/60 hover:bg-slate-800/60 border-white/10 hover:border-white/20'
                } ${isPreviewing ? 'scale-[0.98]' : 'hover:scale-[1.01]'}`}
              >
                {/* Active Indicator Pin */}
                {isSelected && (
                  <div
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-slate-950 shadow-md"
                    style={{ backgroundColor: prof.color }}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-1.5 rounded-lg border flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: `${prof.color}15`,
                        borderColor: `${prof.color}40`,
                        color: prof.color,
                      }}
                    >
                      {getProfileIcon(prof.category, prof.id)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors">
                        {prof.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded border"
                          style={{
                            backgroundColor: `${prof.color}10`,
                            borderColor: `${prof.color}30`,
                            color: prof.color,
                          }}
                        >
                          {prof.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Play Sample Button */}
                  {prof.id !== 'muted' && (
                    <button
                      type="button"
                      onClick={(e) => handlePreview(e, prof.id)}
                      title="Preview sound"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all active:scale-90"
                    >
                      <Play className={`w-3 h-3 ${isPreviewing ? 'text-cyan-400 fill-cyan-400' : 'fill-slate-400'}`} />
                    </button>
                  )}
                </div>

                {!isCompact && (
                  <>
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {prof.description}
                    </p>
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Freq:</span>
                      <span className="text-slate-300">{prof.primaryFrequency}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls Bar: Master Volume, Pitch Modulation, Test Trigger */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/90 border border-white/10">
        {/* Left Col: Master Volume & Mute */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              {config.muted || config.masterVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : config.masterVolume < 0.5 ? (
                <Volume1 className="w-4 h-4 text-cyan-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              )}
              Master Volume
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {config.muted ? 'MUTED' : `${Math.round(config.masterVolume * 100)}%`}
              </span>
              <button
                type="button"
                onClick={handleMuteToggle}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border transition-all ${
                  config.muted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-slate-800 text-slate-400 border-white/10 hover:text-white hover:border-white/25'
                }`}
              >
                {config.muted ? 'Unmute' : 'Mute'}
              </button>
            </div>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={config.muted ? 0 : config.masterVolume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Right Col: Pitch Modulation (Humanizer) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              Pitch Modulation (Anti-Fatigue)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-purple-300 font-bold">
                ±{Math.round(config.pitchModulation * 35)}%
              </span>
              <button
                type="button"
                onClick={handleHumanizeToggle}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border transition-all ${
                  config.humanizeClicks
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-slate-800 text-slate-400 border-white/10'
                }`}
              >
                {config.humanizeClicks ? 'Humanized' : 'Fixed'}
              </button>
            </div>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={config.pitchModulation}
              onChange={handlePitchModChange}
              disabled={!config.humanizeClicks}
              className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400 focus:outline-none ${
                !config.humanizeClicks ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Quick Test Audio Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Rapid Audio Audition:</span>
          <button
            type="button"
            onClick={() => handleTestBurst(1, 1)}
            disabled={config.profile === 'muted'}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 border border-white/10 text-xs font-medium text-slate-200 transition-all flex items-center gap-1.5"
          >
            <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
            1 Click
          </button>
          <button
            type="button"
            onClick={() => handleTestBurst(5, 12)}
            disabled={config.profile === 'muted' || isBurstActive}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
              isBurstActive
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 active:scale-95 border-white/10 text-slate-200'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-400" />
            5-Burst (12 CPS)
          </button>
          <button
            type="button"
            onClick={() => handleTestBurst(10, 20)}
            disabled={config.profile === 'muted' || isBurstActive}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 border border-white/10 text-xs font-medium text-slate-200 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            10-Burst (20 CPS)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">
            Engine Latency: <strong className="text-emerald-400 font-mono">&lt; 1.2ms</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SoundSelector;
