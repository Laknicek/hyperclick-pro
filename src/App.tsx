import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { ClickerControlPanel } from './components/ClickerControlPanel';
import { HumanizerSettings } from './components/HumanizerSettings';
import { TelemetryView } from './components/TelemetryView';
import { MultiPointSequencer } from './components/MultiPointSequencer';
import { MacroRecorderView } from './components/MacroRecorderView';
import { PresetManager } from './components/PresetManager';
import { SettingsView } from './components/SettingsView';
import { MiniHud } from './components/MiniHud';
import { ToastContainer } from './components/ToastContainer';
import { 
  AppView, 
  ClickConfig, 
  HumanizerConfig, 
  SequenceConfig, 
  TelemetryData, 
  AppSettings, 
  Preset, 
  ToastMessage,
  MacroRecording 
} from './types';
import { DEFAULT_PRESETS } from './data/defaultPresets';
import { playClickSound, playUiChime } from './utils/audio';

export const App: React.FC = () => {
  // Navigation View State
  const [activeTab, setActiveTab] = useState<AppView>('dashboard');
  const [isMiniHudActive, setIsMiniHudActive] = useState(false);

  // Application Settings
  const [settings, setSettings] = useState<AppSettings>({
    accentColor: 'cyan',
    soundEffects: true,
    soundVolume: 0.2,
    audioTheme: 'mechanical',
    alwaysOnTop: false,
    minimizeToTray: false,
    startMinimized: false,
    highPrecisionTimer: true,
    hotkeys: {
      startStop: 'F6',
      pickLocation: 'F8',
      recordMacro: 'F9',
      panicStop: 'F12',
      toggleMiniHud: 'F10',
    },
    darkGlassOpacity: 0.85,
  });

  // Clicker Configuration State
  const [clickConfig, setClickConfig] = useState<ClickConfig>({
    interval: { hours: 0, minutes: 0, seconds: 0, milliseconds: 50, microseconds: 0 },
    mouseButton: 'left',
    clickType: 'single',
    burstCount: 3,
    burstIntervalMs: 25,
    repeatMode: 'infinite',
    repeatCount: 1000,
    repeatDurationMs: 60000,
    cursorMode: 'current',
    fixedCoords: { x: 960, y: 540 },
    randomCoords: { enabled: false, radius: 0 },
    hotkey: 'F6',
  });

  // Humanizer Stealth State
  const [humanizerConfig, setHumanizerConfig] = useState<HumanizerConfig>({
    enabled: true,
    jitterRadius: 3,
    timingVariancePercent: 15,
    distribution: 'gaussian',
    bezierMovement: true,
    bezierCurvature: 4,
    fatigueSimulation: true,
    fatigueDecayRate: 2,
    humanReactionDelay: true,
    microPauses: true,
    microPauseChance: 5,
    minIntervalOffsetMs: -10,
    maxIntervalOffsetMs: 15,
  });

  // Multi-Point Sequence State
  const [sequenceConfig, setSequenceConfig] = useState<SequenceConfig>({
    points: [
      { id: 'p1', name: 'Attack Target', x: 800, y: 450, button: 'left', delayAfterMs: 150, holdDurationMs: 30, active: true, jitterRadius: 2 },
      { id: 'p2', name: 'Skill Cast', x: 1120, y: 650, button: 'right', delayAfterMs: 300, holdDurationMs: 50, active: true, jitterRadius: 4 },
    ],
    loopMode: 'infinite',
    loopCount: 100,
    randomizeOrder: false,
    interPointDelayJitter: 10,
  });

  // Presets & Active Profile
  const [presets, setPresets] = useState<Preset[]>(DEFAULT_PRESETS);
  const [activePresetId, setActivePresetId] = useState<string | null>(DEFAULT_PRESETS[0]?.id || null);

  // Macro State
  const [isRecordingMacro, setIsRecordingMacro] = useState(false);
  const [isPlayingMacro, setIsPlayingMacro] = useState(false);

  // Live Telemetry Engine State
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    isRunning: false,
    currentCps: 0,
    peakCps: 0,
    totalClicks: 0,
    sessionDuration: 0,
    avgLatencyMs: 0.12,
    cpuUsagePercent: 0.8,
    accuracyRate: 99.8,
    cpsHistory: Array(30).fill(0),
    clickHistory: [],
  });

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Update Settings Partial
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Start / Stop Toggle Clicker
  const handleToggleStartStop = useCallback(() => {
    setTelemetry((prev) => {
      const nextRunning = !prev.isRunning;
      
      if (nextRunning) {
        if (settings.soundEffects) playUiChime('start');
        addToast('HyperClick Engine Started', `Executing with hotkey [${settings.hotkeys.startStop}]`, 'success');
      } else {
        if (settings.soundEffects) playUiChime('stop');
        addToast('HyperClick Engine Stopped', 'Session telemetry recorded.', 'info');
      }

      // If in Electron, call IPC bridge
      if (typeof window !== 'undefined' && (window as any).electron?.toggleClicker) {
        (window as any).electron.toggleClicker({
          isRunning: nextRunning,
          clickConfig,
          humanizerConfig,
        });
      }

      return {
        ...prev,
        isRunning: nextRunning,
      };
    });
  }, [settings.soundEffects, settings.hotkeys.startStop, clickConfig, humanizerConfig, addToast]);

  // Panic Stop Kill Switch (F12)
  const handlePanicStop = useCallback(() => {
    setTelemetry((prev) => ({ ...prev, isRunning: false }));
    setIsPlayingMacro(false);
    setIsRecordingMacro(false);
    if (settings.soundEffects) playUiChime('stop');
    addToast('EMERGENCY KILL TRIGGERED', 'All automation engines halted immediately.', 'error');
  }, [settings.soundEffects, addToast]);

  // Screen Location Picker Trigger
  const handlePickLocation = useCallback(() => {
    addToast('Target Picker Active', 'Click anywhere on screen or press Enter to lock coordinates (F8)', 'warning');
    // Simulated coordinate capture or Electron screen hook
    if (typeof window !== 'undefined' && (window as any).electron?.pickLocation) {
      (window as any).electron.pickLocation((coords: { x: number; y: number }) => {
        setClickConfig((prev) => ({ ...prev, fixedCoords: coords, cursorMode: 'fixed' }));
        addToast('Coordinates Locked', `X: ${coords.x}, Y: ${coords.y}`, 'success');
      });
    } else {
      // Browser simulated pick
      const fakeX = Math.round(window.screen.width / 2 + (Math.random() * 200 - 100));
      const fakeY = Math.round(window.screen.height / 2 + (Math.random() * 200 - 100));
      setClickConfig((prev) => ({ ...prev, fixedCoords: { x: fakeX, y: fakeY }, cursorMode: 'fixed' }));
      addToast('Coordinates Simulated', `X: ${fakeX}, Y: ${fakeY}`, 'success');
    }
  }, [addToast]);

  // Multi-point location picker
  const handlePickPointLocation = useCallback((pointId: string) => {
    const fakeX = Math.round(window.screen.width / 2 + (Math.random() * 300 - 150));
    const fakeY = Math.round(window.screen.height / 2 + (Math.random() * 300 - 150));
    setSequenceConfig((prev) => ({
      ...prev,
      points: prev.points.map((p) => (p.id === pointId ? { ...p, x: fakeX, y: fakeY } : p)),
    }));
    addToast('Point Updated', `Step target updated to (${fakeX}, ${fakeY})`, 'success');
  }, [addToast]);

  // Apply Preset
  const handleApplyPreset = (preset: Preset) => {
    setActivePresetId(preset.id);
    setClickConfig(preset.config);
    setHumanizerConfig(preset.humanizer);
    if (preset.sequence) {
      setSequenceConfig(preset.sequence);
    }
    addToast(`Preset Loaded: ${preset.name}`, preset.description, 'success');
  };

  // Save Custom Preset
  const handleSaveCurrentAsPreset = (name: string, category: Preset['category']) => {
    const newPreset: Preset = {
      id: `preset-custom-${Date.now()}`,
      name,
      category,
      description: 'Custom user crafted high-performance profile.',
      iconName: 'Zap',
      color: '#00f2fe',
      config: clickConfig,
      humanizer: humanizerConfig,
      sequence: sequenceConfig,
      isBuiltIn: false,
    };
    setPresets((prev) => [newPreset, ...prev]);
    setActivePresetId(newPreset.id);
    addToast('Profile Saved', `Preset "${name}" saved to your presets gallery.`, 'success');
  };

  // Delete Custom Preset
  const handleDeletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    if (activePresetId === id) setActivePresetId(null);
    addToast('Profile Removed', 'Preset removed from gallery.', 'info');
  };

  // Reset Telemetry Stats
  const handleResetTelemetry = () => {
    setTelemetry((prev) => ({
      ...prev,
      totalClicks: 0,
      sessionDuration: 0,
      peakCps: 0,
      currentCps: 0,
      cpsHistory: Array(30).fill(0),
    }));
    addToast('Metrics Cleared', 'Session statistics reset to zero.', 'info');
  };

  // Macro Handlers
  const handleStartRecordMacro = () => {
    setIsRecordingMacro(true);
    addToast('Recording Macro', 'Capturing keystrokes and mouse movements...', 'warning');
  };

  const handleStopRecordMacro = () => {
    setIsRecordingMacro(false);
    addToast('Macro Captured', 'New macro successfully saved to library.', 'success');
  };

  const handlePlayMacro = (macro: MacroRecording) => {
    setIsPlayingMacro(true);
    addToast('Macro Playback', `Replaying "${macro.name}" at ${macro.playbackSpeed}x speed`, 'info');
  };

  const handleStopPlayMacro = () => {
    setIsPlayingMacro(false);
    addToast('Playback Stopped', 'Macro playback paused.', 'info');
  };

  // Global Keyboard Event Listeners for Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hotkey Start/Stop (Default: F6)
      if (e.key.toUpperCase() === settings.hotkeys.startStop.toUpperCase()) {
        e.preventDefault();
        handleToggleStartStop();
      }
      // Panic Kill (Default: F12)
      else if (e.key.toUpperCase() === settings.hotkeys.panicStop.toUpperCase()) {
        e.preventDefault();
        handlePanicStop();
      }
      // Pick Location (Default: F8)
      else if (e.key.toUpperCase() === settings.hotkeys.pickLocation.toUpperCase()) {
        e.preventDefault();
        handlePickLocation();
      }
      // Toggle Mini-HUD (Default: F10)
      else if (e.key.toUpperCase() === settings.hotkeys.toggleMiniHud.toUpperCase()) {
        e.preventDefault();
        setIsMiniHudActive((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.hotkeys, handleToggleStartStop, handlePanicStop, handlePickLocation]);

  // Real-Time High Frequency Engine Simulation & Telemetry Loop (60 FPS)
  useEffect(() => {
    if (!telemetry.isRunning) {
      setTelemetry((prev) => ({
        ...prev,
        currentCps: 0,
        cpsHistory: [...prev.cpsHistory.slice(1), 0],
      }));
      return;
    }

    // Calculate theoretical CPS
    const totalMs = 
      clickConfig.interval.hours * 3600000 +
      clickConfig.interval.minutes * 60000 +
      clickConfig.interval.seconds * 1000 +
      clickConfig.interval.milliseconds +
      clickConfig.interval.microseconds / 1000;
    
    const baseCps = totalMs > 0 ? Math.min(1000, 1000 / totalMs) : 1000;

    let timerInterval = 100; // Update telemetry UI every 100ms
    let clickSoundAccumulator = 0;

    const intervalId = setInterval(() => {
      setTelemetry((prev) => {
        // Apply humanizer jitter variance to CPS if enabled
        let actualCps = baseCps;
        if (humanizerConfig.enabled) {
          const jitterFactor = (Math.random() - 0.5) * (humanizerConfig.timingVariancePercent / 100) * 2;
          actualCps = Math.max(1, baseCps * (1 + jitterFactor));
        }

        const clicksDelta = Math.max(1, Math.round((actualCps * timerInterval) / 1000));
        const newTotal = prev.totalClicks + clicksDelta;
        const newPeak = Math.max(prev.peakCps, actualCps);
        const newHistory = [...prev.cpsHistory.slice(1), actualCps];

        // Play audio switch sound periodically
        if (settings.soundEffects) {
          clickSoundAccumulator++;
          if (clickSoundAccumulator % 3 === 0) {
            playClickSound(settings.audioTheme, settings.soundVolume * 0.4);
          }
        }

        return {
          ...prev,
          currentCps: actualCps,
          peakCps: newPeak,
          totalClicks: newTotal,
          sessionDuration: prev.sessionDuration + 0.1,
          avgLatencyMs: Math.max(0.04, 0.15 + (Math.random() * 0.1 - 0.05)),
          cpuUsagePercent: Math.min(3.5, 0.4 + (actualCps / 300)),
          cpsHistory: newHistory,
        };
      });
    }, timerInterval);

    return () => clearInterval(intervalId);
  }, [
    telemetry.isRunning, 
    clickConfig.interval, 
    humanizerConfig.enabled, 
    humanizerConfig.timingVariancePercent, 
    settings.soundEffects, 
    settings.audioTheme, 
    settings.soundVolume
  ]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#08090e] text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden select-none relative">
      {/* Background Cyber Grid Lines & Glowing ambient lights */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-40" />
      <div className="scanline" />

      {/* Top Frameless Header Titlebar */}
      <Header
        isRunning={telemetry.isRunning}
        telemetry={telemetry}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onToggleMiniHud={() => setIsMiniHudActive(!isMiniHudActive)}
        isMiniHudActive={isMiniHudActive}
        onPanicStop={handlePanicStop}
      />

      {/* Futuristic Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isRunning={telemetry.isRunning}
        sequenceCount={sequenceConfig.points.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          
          {/* TAB 1: Speed Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <ClickerControlPanel
                config={clickConfig}
                onChangeConfig={(newCfg) => setClickConfig((prev) => ({ ...prev, ...newCfg }))}
                isRunning={telemetry.isRunning}
                onToggleStartStop={handleToggleStartStop}
                onPickLocation={handlePickLocation}
                soundEnabled={settings.soundEffects}
              />

              <HumanizerSettings
                config={humanizerConfig}
                onChangeConfig={(newHmn) => setHumanizerConfig((prev) => ({ ...prev, ...newHmn }))}
                disabled={telemetry.isRunning}
                soundEnabled={settings.soundEffects}
              />
            </div>
          )}

          {/* TAB 2: Multi-Point Sequencer */}
          {activeTab === 'multipoint' && (
            <div className="animate-in fade-in duration-200">
              <MultiPointSequencer
                sequence={sequenceConfig}
                onChangeSequence={setSequenceConfig}
                isRunning={telemetry.isRunning}
                onToggleRunSequence={handleToggleStartStop}
                onPickPointLocation={handlePickPointLocation}
                soundEnabled={settings.soundEffects}
              />
            </div>
          )}

          {/* TAB 3: Macro Recorder Suite */}
          {activeTab === 'recorder' && (
            <div className="animate-in fade-in duration-200">
              <MacroRecorderView
                isRecording={isRecordingMacro}
                isPlaying={isPlayingMacro}
                onStartRecord={handleStartRecordMacro}
                onStopRecord={handleStopRecordMacro}
                onPlayMacro={handlePlayMacro}
                onStopPlayMacro={handleStopPlayMacro}
                soundEnabled={settings.soundEffects}
              />
            </div>
          )}

          {/* TAB 4: Presets Gallery */}
          {activeTab === 'presets' && (
            <div className="animate-in fade-in duration-200">
              <PresetManager
                presets={presets}
                activePresetId={activePresetId}
                onApplyPreset={handleApplyPreset}
                onSaveCurrentAsPreset={handleSaveCurrentAsPreset}
                onDeletePreset={handleDeletePreset}
                currentConfig={clickConfig}
                currentHumanizer={humanizerConfig}
                soundEnabled={settings.soundEffects}
              />
            </div>
          )}

          {/* TAB 5: Live Telemetry Analytics */}
          {activeTab === 'analytics' && (
            <div className="animate-in fade-in duration-200">
              <TelemetryView
                telemetry={telemetry}
                onResetTelemetry={handleResetTelemetry}
              />
            </div>
          )}

          {/* TAB 6: Settings & Engine Configuration */}
          {activeTab === 'settings' && (
            <div className="animate-in fade-in duration-200">
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            </div>
          )}

        </div>
      </main>

      {/* Floating Mini HUD Mode */}
      {isMiniHudActive && (
        <MiniHud
          isRunning={telemetry.isRunning}
          onToggleStartStop={handleToggleStartStop}
          onExpand={() => setIsMiniHudActive(false)}
          telemetry={telemetry}
          hotkey={settings.hotkeys.startStop}
        />
      )}

      {/* Neon Cyber Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
      />
    </div>
  );
};

export default App;
