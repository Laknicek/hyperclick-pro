import React from 'react';
import { 
  Gauge, 
  Crosshair, 
  Disc, 
  Layers, 
  LineChart, 
  Settings2,
  Sparkles,
  Keyboard
} from 'lucide-react';
import { AppView } from '../types';

interface NavbarProps {
  activeTab: AppView;
  onSelectTab: (tab: AppView) => void;
  isRunning: boolean;
  sequenceCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  isRunning,
  sequenceCount,
}) => {
  const tabs: { id: AppView; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Speed Dashboard', icon: Gauge },
    { id: 'multipoint', label: 'Multi-Point', icon: Crosshair, badge: sequenceCount > 0 ? sequenceCount : undefined },
    { id: 'recorder', label: 'Macro Suite', icon: Disc },
    { id: 'presets', label: 'Presets Gallery', icon: Layers },
    { id: 'analytics', label: 'Live Telemetry', icon: LineChart },
    { id: 'settings', label: 'Engine Config', icon: Settings2 },
  ];

  return (
    <nav className="w-full glass-panel border-b border-white/[0.06] px-3 py-1.5 flex items-center justify-between z-40 bg-[#0c0e18]/80">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 group ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
              <span>{tab.label}</span>

              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/10 text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              )}

              {/* Active Tab Glow Bar */}
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full shadow-glow-cyan" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Hotkey Cheat Sheet helper */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-100/50 border border-white/[0.06]">
          <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 font-bold">F6:</span>
          <span>Start / Stop</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-100/50 border border-white/[0.06]">
          <span className="text-purple-400 font-bold">F8:</span>
          <span>Pick Target</span>
        </div>
      </div>
    </nav>
  );
};
