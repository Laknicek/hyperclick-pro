import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Square,
  Maximize2,
  GripHorizontal,
  Volume2,
  VolumeX,
  Pin,
  PinOff,
  X,
  Activity,
  Zap,
} from 'lucide-react';
import { EngineStatus, AppSettings, ClickConfig } from '../types/electron';
import { soundEngine } from '../services/soundEngine';
import { playClickSound, playUiChime } from '../utils/audio';

export const MiniHudWindow: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentCps, setCurrentCps] = useState(0);
  const [targetCps, setTargetCps] = useState(20);
  const [totalClicks, setTotalClicks] = useState(0);
  const [activeProfileName, setActiveProfileName] = useState('Default Profile');
  const [hotkey, setHotkey] = useState('F6');
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);
  const [isMuted, setIsMuted] = useState(() => soundEngine.isMuted());

  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  // Safe Electron API Accessor
  const getElectronAPI = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (window.electronAPI) return window.electronAPI;
      if (window.electron) return window.electron;
    }
    return null;
  }, []);

  // Initialize and subscribe to IPC updates
  useEffect(() => {
    // Add transparent window class
    document.documentElement.classList.add('transparent-window');
    document.body.classList.add('transparent-window');

    const electron = getElectronAPI();

    if (electron) {
      // 1. Fetch initial state
      if (electron.getFullState) {
        electron.getFullState().then((state) => {
          if (state?.engineStatus) {
            setIsRunning(state.engineStatus.isRunning);
            setCurrentCps(state.engineStatus.cpsActual || 0);
            setTotalClicks(state.engineStatus.clicksPerformed || 0);
            if (state.engineStatus.activeProfileName) {
              setActiveProfileName(state.engineStatus.activeProfileName);
            }
          }
          if (state?.sharedState) {
            if (state.sharedState.activeProfileName) {
              setActiveProfileName(state.sharedState.activeProfileName);
            }
            if (state.sharedState.targetCps) {
              setTargetCps(state.sharedState.targetCps);
            }
            if (state.sharedState.hotkeys?.toggleClicker || state.sharedState.hotkeys?.startStop) {
              setHotkey(state.sharedState.hotkeys.toggleClicker || state.sharedState.hotkeys.startStop);
            }
            if (typeof state.sharedState.isAlwaysOnTop === 'boolean') {
              setIsAlwaysOnTop(state.sharedState.isAlwaysOnTop);
            }
            if (typeof state.sharedState.isMuted === 'boolean') {
              setIsMuted(state.sharedState.isMuted);
            }
          }
          if (state?.settings?.hotkeys) {
            setHotkey(state.settings.hotkeys.toggleClicker || 'F6');
          }
        }).catch((err) => {
          console.warn('[MiniHudWindow] Could not get full initial state:', err);
        });
      } else if (electron.getStatus) {
        electron.getStatus().then((st) => {
          setIsRunning(st.isRunning);
          setCurrentCps(st.cpsActual || 0);
          setTotalClicks(st.clicksPerformed || 0);
        });
      }

      // 2. Subscribe to status updates (live CPS, clicks, running state)
      const unsubStatus = electron.onStatusUpdate((status: EngineStatus) => {
        setIsRunning(status.isRunning);
        setCurrentCps(status.cpsActual || 0);
        setTotalClicks(status.clicksPerformed || 0);
        if (status.activeProfileName) {
          setActiveProfileName(status.activeProfileName);
        }
      });

      // 3. Subscribe to shared state synchronization (profile name, hotkeys, target CPS)
      let unsubStateSync: (() => void) | undefined;
      if (electron.onStateSynced) {
        unsubStateSync = electron.onStateSynced((sharedState: any) => {
          if (sharedState.activeProfileName) {
            setActiveProfileName(sharedState.activeProfileName);
          }
          if (sharedState.targetCps) {
            setTargetCps(sharedState.targetCps);
          }
          if (sharedState.hotkeys?.toggleClicker || sharedState.hotkeys?.startStop) {
            setHotkey(sharedState.hotkeys.toggleClicker || sharedState.hotkeys.startStop);
          }
          if (typeof sharedState.isAlwaysOnTop === 'boolean') {
            setIsAlwaysOnTop(sharedState.isAlwaysOnTop);
          }
          if (typeof sharedState.isMuted === 'boolean') {
            setIsMuted(sharedState.isMuted);
          }
        });
      }

      // 4. Subscribe to hotkeys triggered globally
      const unsubHotkeys = electron.onHotkeyTriggered((action: string) => {
        if (action === 'toggle-clicker' || action === 'start-stop') {
          // Status update will arrive via onStatusUpdate
        } else if (action === 'emergency-stop' || action === 'panic-stop') {
          setIsRunning(false);
        }
      });

      // 5. Subscribe to Always-on-top changes
      let unsubAlwaysOnTop: (() => void) | undefined;
      if (electron.onMiniHudAlwaysOnTopChanged) {
        unsubAlwaysOnTop = electron.onMiniHudAlwaysOnTopChanged((enabled: boolean) => {
          setIsAlwaysOnTop(enabled);
        });
      }

      return () => {
        unsubStatus();
        unsubHotkeys();
        unsubStateSync?.();
        unsubAlwaysOnTop?.();
      };
    }
  }, [getElectronAPI]);

  // Handle Start / Stop Trigger
  const handleToggleStartStop = useCallback(async () => {
    const electron = getElectronAPI();
    const nextRunning = !isRunningRef.current;

    if (!isMuted) {
      if (nextRunning) {
        playUiChime('start');
      } else {
        playUiChime('stop');
      }
    }

    if (electron) {
      if (electron.toggleClickerEngine) {
        const res = await electron.toggleClickerEngine();
        setIsRunning(res.isRunning);
      } else if (nextRunning && electron.startClicker) {
        // Fallback start with default config
        const fallbackConfig: ClickConfig = {
          clickType: 'left',
          cps: targetCps || 20,
          clickIntervalMs: Math.round(1000 / (targetCps || 20)),
          repeatMode: 'infinite',
          repeatCount: 100,
          repeatDurationMs: 10000,
          locationMode: 'current',
          fixedX: 0,
          fixedY: 0,
          waypoints: [],
          waypointLoopMode: 'sequential',
          waypointRepeatCount: 0,
          humanizer: {
            enabled: false,
            jitterRadius: 0,
            timingVariancePercent: 0,
            fatigueEnabled: false,
            fatigueFactor: 0.2,
            microBreaks: false,
            microBreakIntervalSec: 30,
            bezierMovement: false,
            movementSpeed: 5,
            distribution: 'gaussian',
          },
          audioFeedback: !isMuted,
          soundTheme: 'cyber_click',
          soundVolume: 80,
        };
        await electron.startClicker(fallbackConfig);
        setIsRunning(true);
      } else if (!nextRunning && electron.stopClicker) {
        await electron.stopClicker();
        setIsRunning(false);
      }
    } else {
      // Local state toggle in web fallback
      setIsRunning(nextRunning);
    }
  }, [getElectronAPI, isMuted, targetCps]);

  // Handle Always-On-Top Toggle
  const handleToggleAlwaysOnTop = useCallback(async () => {
    const nextState = !isAlwaysOnTop;
    setIsAlwaysOnTop(nextState);
    const electron = getElectronAPI();
    if (electron) {
      if (electron.setMiniHudAlwaysOnTop) {
        await electron.setMiniHudAlwaysOnTop(nextState);
      } else if (electron.setAlwaysOnTop) {
        await electron.setAlwaysOnTop(nextState);
      }
    }
  }, [isAlwaysOnTop, getElectronAPI]);

  // Handle Mute Toggle
  const handleToggleMute = useCallback(() => {
    const nextMuted = soundEngine.toggleMute();
    setIsMuted(nextMuted);
    const electron = getElectronAPI();
    if (electron?.syncState) {
      electron.syncState({ isMuted: nextMuted });
    }
  }, [getElectronAPI]);

  // Handle Expand back to Main Dashboard
  const handleExpandToDashboard = useCallback(async () => {
    const electron = getElectronAPI();
    if (electron?.expandMiniHud) {
      await electron.expandMiniHud();
    } else if (electron?.toggleMiniHud) {
      await electron.toggleMiniHud(false);
    }
  }, [getElectronAPI]);

  // Handle Close / Hide HUD
  const handleClose = useCallback(async () => {
    const electron = getElectronAPI();
    if (electron?.toggleMiniHud) {
      await electron.toggleMiniHud(false);
    } else if (electron?.closeWindow) {
      await electron.closeWindow();
    }
  }, [getElectronAPI]);

  // Local Keyboard Listener for Hotkeys inside HUD window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toUpperCase() === hotkey.toUpperCase()) {
        e.preventDefault();
        handleToggleStartStop();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hotkey, handleToggleStartStop, handleClose]);

  return (
    <div className="w-screen h-screen overflow-hidden p-2 flex items-center justify-center bg-transparent select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Floating Cyber Glass HUD Panel */}
      <div className="w-full h-full glass-panel rounded-2xl border border-cyan-500/40 shadow-[0_0_35px_rgba(0,242,254,0.3)] bg-[#080a12]/95 backdrop-blur-3xl ring-1 ring-white/10 flex flex-col justify-between px-3.5 py-2.5 app-drag-region transition-all">
        
        {/* Top Header Row (Draggable region + Quick Control Icons) */}
        <div className="flex items-center justify-between w-full">
          {/* Left: Drag Handle & Profile Tag */}
          <div className="flex items-center gap-2">
            <div
              title="Drag anywhere to move floating HUD"
              className="text-slate-500 hover:text-cyan-300 transition-colors flex items-center cursor-grab active:cursor-grabbing"
            >
              <GripHorizontal className="w-3.5 h-3.5" />
            </div>

            {/* Pulsing Status Dot */}
            <div className="relative flex items-center justify-center">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-cyan-400 animate-pulse shadow-glow-cyan' : 'bg-slate-600'}`} />
              {isRunning && (
                <span className="absolute w-3.5 h-3.5 rounded-full border border-cyan-400/50 animate-radar" />
              )}
            </div>

            {/* Active Profile Badge */}
            <span
              className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider truncate max-w-[130px]"
              title={`Active Profile: ${activeProfileName}`}
            >
              {activeProfileName}
            </span>
          </div>

          {/* Right: Window Controls (no-drag) */}
          <div className="flex items-center gap-1 no-drag">
            {/* Always-on-top Pin */}
            <button
              type="button"
              onClick={handleToggleAlwaysOnTop}
              title={isAlwaysOnTop ? 'Always-on-top: Active' : 'Enable Always-on-top'}
              className={`p-1 rounded-md transition-all cursor-pointer ${
                isAlwaysOnTop
                  ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 shadow-glow-cyan'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {isAlwaysOnTop ? <Pin className="w-3 h-3 fill-cyan-300/30" /> : <PinOff className="w-3 h-3" />}
            </button>

            {/* Mute Audio Toggle */}
            <button
              type="button"
              onClick={handleToggleMute}
              title={isMuted ? 'Unmute Audio FX' : 'Mute Audio FX'}
              className={`p-1 rounded-md transition-all cursor-pointer ${
                isMuted
                  ? 'text-rose-400 hover:bg-rose-500/20'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'
              }`}
            >
              {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>

            {/* Expand to Main Dashboard Window */}
            <button
              type="button"
              onClick={handleExpandToDashboard}
              title="Expand to Full Dashboard"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" />
            </button>

            {/* Close / Hide HUD */}
            <button
              type="button"
              onClick={handleClose}
              title="Hide Mini HUD"
              className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Bottom Metrics & Big Start/Stop Action Button */}
        <div className="flex items-center justify-between w-full gap-2">
          
          {/* CPS Live Ticker */}
          <div className="flex items-center gap-2 min-w-[90px]">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-slate-400 font-semibold tracking-wider leading-none">
                CPS LIVE
              </span>
              <span className={`text-xl font-mono font-black tracking-tight leading-tight ${
                isRunning ? 'text-cyan-300 neon-text-cyan' : 'text-slate-300'
              }`}>
                {currentCps.toFixed(1)}
              </span>
              <span className="text-[8px] font-mono text-slate-500 leading-none">
                TGT: {targetCps}
              </span>
            </div>
          </div>

          <div className="w-[1px] h-7 bg-white/10" />

          {/* Total Clicks Counter */}
          <div className="flex flex-col min-w-[70px]">
            <span className="text-[9px] font-mono text-slate-400 font-semibold tracking-wider leading-none">
              TOTAL
            </span>
            <span className="text-sm font-mono font-bold text-white leading-tight">
              {totalClicks.toLocaleString()}
            </span>
            <span className="text-[8px] font-mono text-cyan-400/80 leading-none">
              {isRunning ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>

          <div className="w-[1px] h-7 bg-white/10" />

          {/* Big Action Start / Stop Button (no-drag) */}
          <div className="no-drag">
            <button
              type="button"
              onClick={handleToggleStartStop}
              title={`Toggle Clicker [${hotkey}]`}
              className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95 select-none ${
                isRunning
                  ? 'bg-rose-500 text-white shadow-glow-rose hover:bg-rose-600 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black shadow-glow-cyan hover:from-cyan-300 hover:to-blue-400'
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-white text-white" />
                  <span>STOP [{hotkey}]</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>START [{hotkey}]</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default MiniHudWindow;
