import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  X,
  Palette,
  Volume2,
  VolumeX,
  Keyboard,
  Sliders,
  Monitor,
  Check,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  Upload,
  Zap,
  Shield,
  Radio,
  Cpu,
  Eye,
  SlidersHorizontal,
  Bell,
  Play,
} from 'lucide-react';
import { GlobalAppSettings as AppSettings, ThemeAccentColor as ThemeAccent, PresetSoundPackType as SoundPackType } from '../types/presets';
import { storageService, soundSynthesizer, DEFAULT_APP_SETTINGS } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (newSettings: AppSettings) => void;
}

const ACCENT_COLORS: {
  id: ThemeAccent;
  label: string;
  hex: string;
  bgClass: string;
  ringClass: string;
  shadowClass: string;
}[] = [
  { id: 'cyan', label: 'Hyper Cyan', hex: '#00f2fe', bgClass: 'bg-accent-cyan', ringClass: 'ring-accent-cyan', shadowClass: 'shadow-glow-cyan' },
  { id: 'purple', label: 'Neon Purple', hex: '#7f00ff', bgClass: 'bg-accent-purple', ringClass: 'ring-accent-purple', shadowClass: 'shadow-glow-purple' },
  { id: 'emerald', label: 'Viper Emerald', hex: '#00f5a0', bgClass: 'bg-accent-emerald', ringClass: 'ring-accent-emerald', shadowClass: 'shadow-glow-emerald' },
  { id: 'rose', label: 'Cyber Rose', hex: '#ff3366', bgClass: 'bg-accent-rose', ringClass: 'ring-accent-rose', shadowClass: 'shadow-glow-rose' },
  { id: 'amber', label: 'Solar Amber', hex: '#ffaa00', bgClass: 'bg-accent-amber', ringClass: 'ring-accent-amber', shadowClass: 'shadow-glow-cyan' },
  { id: 'blue', label: 'Cobalt Blue', hex: '#4facfe', bgClass: 'bg-accent-blue', ringClass: 'ring-accent-blue', shadowClass: 'shadow-glow-cyan' },
];

const SOUND_PACKS: { id: SoundPackType; label: string; description: string }[] = [
  { id: 'mechanical-blue', label: 'Mechanical Blue Switch', description: 'Crisp, tactile, double-click audio feedback' },
  { id: 'mechanical-brown', label: 'Mechanical Brown Tactile', description: 'Deep, dampened mechanical switch bump' },
  { id: 'soft-membrane', label: 'Soft Membrane', description: 'Quiet, soft office keyboard click' },
  { id: 'bubble-pop', label: 'Bubble Pop', description: 'Playful, bouncy pop tone' },
  { id: 'futuristic-laser', label: 'Sci-Fi Pulse Laser', description: 'High-frequency arcade laser zap' },
  { id: 'subtle-tick', label: 'Subtle UI Micro-Tick', description: 'Minimalist, non-intrusive tick' },
  { id: 'off', label: 'Mute / Disabled', description: 'Zero sound generation' },
];

type ActiveTab = 'appearance' | 'hotkeys' | 'audio' | 'system' | 'overlay' | 'performance' | 'backup';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChange,
}) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('appearance');
  const [recordingHotkeyFor, setRecordingHotkeyFor] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const loaded = storageService.loadSettings();
      setSettings(loaded);
      setRecordingHotkeyFor(null);
      setNotification(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const handleUpdate = (partial: Partial<AppSettings>) => {
    const updated = storageService.saveSettings(partial);
    setSettings(updated);
    if (onSettingsChange) onSettingsChange(updated);
  };

  // Hotkey Recorder Listener
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recordingHotkeyFor) return;
    e.preventDefault();
    e.stopPropagation();

    // Ignore single modifier key presses
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    const parts: string[] = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');

    let keyName = e.key;
    if (keyName === ' ') keyName = 'Space';
    else if (keyName.length === 1) keyName = keyName.toUpperCase();

    parts.push(keyName);
    const hotkeyString = parts.join('+');

    const updatedHotkeys = {
      ...settings.hotkeys,
      [recordingHotkeyFor]: hotkeyString,
    };

    handleUpdate({ hotkeys: updatedHotkeys });
    setRecordingHotkeyFor(null);
    soundSynthesizer.playClick('subtle-tick', 60);
    showFeedback('success', `Hotkey updated to [${hotkeyString}]`);
  };

  const handleTestSound = () => {
    soundSynthesizer.playClick(
      settings.sound.soundPack,
      settings.sound.volume,
      settings.sound.frequencyPitchVariance
    );
  };

  const handleExportBackup = () => {
    const backupJson = storageService.exportFullBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hyperclick-full-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showFeedback('success', 'Full system backup saved.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = storageService.restoreFullBackup(content);
        if (res.success) {
          const loaded = storageService.loadSettings();
          setSettings(loaded);
          if (onSettingsChange) onSettingsChange(loaded);
          showFeedback('success', res.message);
        } else {
          showFeedback('error', res.message);
        }
      }
    };
    reader.readAsText(files[0]);
    if (backupFileInputRef.current) backupFileInputRef.current.value = '';
  };

  const handleResetToDefaults = () => {
    const def = storageService.resetSettingsToDefault();
    setSettings(def);
    if (onSettingsChange) onSettingsChange(def);
    setShowResetConfirm(false);
    showFeedback('success', 'Settings reset to factory defaults.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      onKeyDown={recordingHotkeyFor ? handleKeyDown : undefined}
      tabIndex={0}
    >
      {/* Modal Box */}
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[780px] bg-card border border-surface-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-gray-100">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-background/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan shadow-glow-cyan">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Global Preferences & System Settings</h2>
              <p className="text-xs text-gray-400">Themes, hardware triggers, audio acoustics, and engine performance</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-50 border border-surface-100 text-gray-400 hover:text-white hover:bg-surface-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Bar */}
        {notification && (
          <div
            className={`px-6 py-2 flex items-center gap-2 text-xs font-medium border-b transition-all ${
              notification.type === 'success'
                ? 'bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald'
                : 'bg-accent-rose/10 border-accent-rose/30 text-accent-rose'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Modal Layout (Sidebar Navigation + Tab Content) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Navigation Sidebar */}
          <div className="w-56 p-4 border-r border-surface-100 bg-surface-50/30 flex flex-col gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
                activeTab === 'appearance'
                  ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-100'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Theme & Accents</span>
            </button>

            <button
              onClick={() => setActiveTab('hotkeys')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
                activeTab === 'hotkeys'
                  ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/30 font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-100'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>Global Hotkeys</span>
            </button>

            <button
              onClick={() => setActiveTab('audio')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
                activeTab === 'audio'
                  ? 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30 font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-100'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>Audio Acoustics</span>
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
                activeTab === 'system'
                  ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30 font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-100'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>System & Tray</span>
            </button>

            <button
              onClick={() => setActiveTab('overlay')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
                activeTab === 'overlay'
                  ? 'bg-accent-amber/15 text-accent-amber border border-accent-amber/30 font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-100'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>In-Game HUD Overlay</span>
            </button>

            <button
              onClick={() => setActiveTab('performance')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
                activeTab === 'performance'
                  ? 'bg-accent-rose/15 text-accent-rose border border-accent-rose/30 font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-100'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Engine Tuning</span>
            </button>

            <div className="mt-auto pt-3 border-t border-surface-100">
              <button
                onClick={() => setActiveTab('backup')}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
                  activeTab === 'backup'
                    ? 'bg-white/10 text-white border border-white/20 font-semibold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-surface-100'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Backup & Reset</span>
              </button>
            </div>
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
            
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Theme Accent Colors</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Choose the primary glowing neo-glass accent color for badges, active states, and highlights.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ACCENT_COLORS.map((accent) => {
                      const isSelected = settings.theme === accent.id;
                      return (
                        <button
                          key={accent.id}
                          onClick={() => handleUpdate({ theme: accent.id })}
                          className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'bg-surface-100 border-white/40 ring-2 ring-offset-2 ring-offset-background ' + accent.ringClass
                              : 'bg-surface-50 border-surface-200 hover:bg-surface-100 hover:border-surface-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full ${accent.bgClass} ${accent.shadowClass} flex items-center justify-center`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-black font-black" />}
                          </div>
                          <span className="text-xs font-semibold text-white">{accent.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-100">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">UI Visual Effects</h3>
                  
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer hover:bg-surface-100 transition-colors">
                    <div>
                      <span className="text-xs font-semibold text-white block">Neo-Glassmorphism Blur</span>
                      <span className="text-[11px] text-gray-400">Enable frosted glass blur layers across dashboards and panels</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.glassmorphism}
                      onChange={(e) => handleUpdate({ glassmorphism: e.target.checked })}
                      className="w-4 h-4 rounded text-accent-cyan focus:ring-accent-cyan bg-background border-surface-300"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Global Hotkeys Tab */}
            {activeTab === 'hotkeys' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Global Hardware Triggers</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Click any key binding below to rebind. Press your desired key combination (e.g. F6, Ctrl+Shift+X, Mouse4).
                  </p>

                  <div className="space-y-3">
                    {[
                      { key: 'startStop', label: 'Start / Stop Engine (Toggle)', desc: 'Primary activation trigger for the active profile' },
                      { key: 'toggleBurst', label: 'Instant Burst Mode Fire', desc: 'Hold down or press for 3-shot tactical burst' },
                      { key: 'panicKillswitch', label: 'Panic Killswitch (Emergency Halt)', desc: 'Instantly stops all click loops and releases mouse buttons' },
                      { key: 'recordMacro', label: 'Record / Stop Macro Loop', desc: 'Starts dynamic multi-action recorder' },
                      { key: 'pickCoordinates', label: 'Pick Screen Coordinates', desc: 'Captures current mouse location for fixed targeting' },
                      { key: 'nextProfile', label: 'Cycle Next Profile', desc: 'Switches directly to next preset in library' },
                      { key: 'previousProfile', label: 'Cycle Previous Profile', desc: 'Switches back to previous preset' },
                    ].map((hk) => {
                      const isRecording = recordingHotkeyFor === hk.key;
                      const currentValue = (settings.hotkeys as any)[hk.key] || 'None';

                      return (
                        <div
                          key={hk.key}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 border border-surface-200 hover:border-surface-300 transition-colors"
                        >
                          <div>
                            <span className="text-xs font-semibold text-white block">{hk.label}</span>
                            <span className="text-[11px] text-gray-400">{hk.desc}</span>
                          </div>

                          <button
                            onClick={() => setRecordingHotkeyFor(isRecording ? null : hk.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                              isRecording
                                ? 'bg-accent-rose text-white border-accent-rose animate-pulse shadow-glow-rose'
                                : 'bg-background text-accent-cyan border-accent-cyan/40 hover:border-accent-cyan'
                            }`}
                          >
                            {isRecording ? 'Press Key...' : currentValue}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Audio Tab */}
            {activeTab === 'audio' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Audio Acoustics</h3>
                      <p className="text-xs text-gray-400">Synthesize realistic mechanical click soundscapes</p>
                    </div>

                    <button
                      onClick={handleTestSound}
                      className="px-3 py-1.5 rounded-xl bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/40 text-xs font-semibold hover:bg-accent-emerald/30 flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Test Sound
                    </button>
                  </div>

                  {/* Sound Toggle */}
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer mb-3">
                    <div>
                      <span className="text-xs font-semibold text-white block">Master Click Sound Effects</span>
                      <span className="text-[11px] text-gray-400">Play synthetic acoustic switches during clicks</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.sound.enabled}
                      onChange={(e) =>
                        handleUpdate({
                          sound: { ...settings.sound, enabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-accent-cyan focus:ring-accent-cyan bg-background border-surface-300"
                    />
                  </label>

                  {/* Sound Pack Picker */}
                  <div className="space-y-2 mb-4">
                    <label className="text-xs font-medium text-gray-300">Sound Pack Switch Model</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SOUND_PACKS.map((sp) => {
                        const isSelected = settings.sound.soundPack === sp.id;
                        return (
                          <button
                            key={sp.id}
                            onClick={() => {
                              handleUpdate({
                                sound: { ...settings.sound, soundPack: sp.id },
                              });
                              soundSynthesizer.playClick(sp.id, settings.sound.volume);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-accent-emerald/15 border-accent-emerald/50 text-white ring-1 ring-accent-emerald/30'
                                : 'bg-surface-50 border-surface-200 text-gray-300 hover:bg-surface-100'
                            }`}
                          >
                            <div className="text-xs font-bold text-white">{sp.label}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{sp.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-accent-cyan" /> Click Sound Volume
                      </span>
                      <span className="font-mono text-accent-cyan font-bold">{settings.sound.volume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.sound.volume}
                      onChange={(e) =>
                        handleUpdate({
                          sound: { ...settings.sound, volume: Number(e.target.value) },
                        })
                      }
                      className="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                    />
                  </div>

                  {/* Toggle Chime & Pitch Jitter */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer">
                      <span className="text-xs text-gray-300">Start / Stop Toggle Chime</span>
                      <input
                        type="checkbox"
                        checked={settings.sound.audioFeedbackOnToggle}
                        onChange={(e) =>
                          handleUpdate({
                            sound: { ...settings.sound, audioFeedbackOnToggle: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-accent-cyan focus:ring-accent-cyan bg-background border-surface-300"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer">
                      <span className="text-xs text-gray-300">Organic Frequency Variance</span>
                      <input
                        type="checkbox"
                        checked={settings.sound.frequencyPitchVariance}
                        onChange={(e) =>
                          handleUpdate({
                            sound: { ...settings.sound, frequencyPitchVariance: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-accent-cyan focus:ring-accent-cyan bg-background border-surface-300"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">System Integration</h3>
                  <p className="text-xs text-gray-400 mb-4">Windows background process lifecycle, tray, and startup</p>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer hover:bg-surface-100 transition-colors">
                      <div>
                        <span className="text-xs font-semibold text-white block">Auto-Start with Windows</span>
                        <span className="text-[11px] text-gray-400">Launch HyperClick in background minimized to tray on system boot</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.system.autoStartWithWindows}
                        onChange={(e) =>
                          handleUpdate({
                            system: { ...settings.system, autoStartWithWindows: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-accent-cyan focus:ring-accent-cyan bg-background border-surface-300"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer hover:bg-surface-100 transition-colors">
                      <div>
                        <span className="text-xs font-semibold text-white block">Minimize to System Tray</span>
                        <span className="text-[11px] text-gray-400">Hide taskbar icon when minimizing window</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.system.minimizeToTray}
                        onChange={(e) =>
                          handleUpdate({
                            system: { ...settings.system, minimizeToTray: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-accent-cyan focus:ring-accent-cyan bg-background border-surface-300"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer hover:bg-surface-100 transition-colors">
                      <div>
                        <span className="text-xs font-semibold text-white block">Close Button Minimizes to Tray</span>
                        <span className="text-[11px] text-gray-400">Keep clicker running in tray when clicking window [X]</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.system.closeToTray}
                        onChange={(e) =>
                          handleUpdate({
                            system: { ...settings.system, closeToTray: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-accent-cyan focus:ring-accent-cyan bg-background border-surface-300"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer hover:bg-surface-100 transition-colors">
                      <div>
                        <span className="text-xs font-semibold text-white block">Always On Top Window Pin</span>
                        <span className="text-[11px] text-gray-400">Keep HyperClick Pro above gameplay and other applications</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.system.alwaysOnTop}
                        onChange={(e) =>
                          handleUpdate({
                            system: { ...settings.system, alwaysOnTop: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-accent-cyan focus:ring-accent-cyan bg-background border-surface-300"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer hover:bg-surface-100 transition-colors">
                      <div>
                        <span className="text-xs font-semibold text-white block">Hardware GPU Acceleration</span>
                        <span className="text-[11px] text-gray-400">Use GPU rendering for ultra-low latency graphs & animations</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.system.hardwareAcceleration}
                        onChange={(e) =>
                          handleUpdate({
                            system: { ...settings.system, hardwareAcceleration: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-accent-cyan focus:ring-accent-cyan bg-background border-surface-300"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Overlay Tab */}
            {activeTab === 'overlay' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">In-Game HUD & Overlay</h3>
                  <p className="text-xs text-gray-400 mb-4">Transparent lightweight screen telemetry</p>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer">
                      <div>
                        <span className="text-xs font-semibold text-white block">Master In-Game Overlay</span>
                        <span className="text-[11px] text-gray-400">Render floating HUD above games with live CPS counter</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.overlay.enabled}
                        onChange={(e) =>
                          handleUpdate({
                            overlay: { ...settings.overlay, enabled: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-accent-cyan focus:ring-accent-cyan bg-background border-surface-300"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer">
                      <div>
                        <span className="text-xs font-semibold text-white block">Click Ripple Visualizer</span>
                        <span className="text-[11px] text-gray-400">Show expanding glowing pulse rings at click coordinates</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.overlay.showClickRipples}
                        onChange={(e) =>
                          handleUpdate({
                            overlay: { ...settings.overlay, showClickRipples: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-accent-cyan focus:ring-accent-cyan bg-background border-surface-300"
                      />
                    </label>

                    {/* Position */}
                    <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
                      <label className="text-xs font-semibold text-white block">HUD Screen Position</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                          <button
                            key={pos}
                            onClick={() =>
                              handleUpdate({
                                overlay: { ...settings.overlay, position: pos as any },
                              })
                            }
                            className={`px-3 py-2 rounded-lg text-xs capitalize transition-all border ${
                              settings.overlay.position === pos
                                ? 'bg-accent-amber/20 border-accent-amber text-accent-amber font-bold'
                                : 'bg-background border-surface-200 text-gray-400 hover:text-white'
                            }`}
                          >
                            {pos.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Opacity */}
                    <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-white">HUD Opacity</span>
                        <span className="font-mono text-accent-amber font-bold">{settings.overlay.opacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={settings.overlay.opacity}
                        onChange={(e) =>
                          handleUpdate({
                            overlay: { ...settings.overlay, opacity: Number(e.target.value) },
                          })
                        }
                        className="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-accent-amber"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Engine Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Engine Tuning & Latency</h3>
                  <p className="text-xs text-gray-400 mb-4">Precision timing hooks and Windows process priority</p>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer">
                      <div>
                        <span className="text-xs font-semibold text-white block">Microsecond Precision Timer</span>
                        <span className="text-[11px] text-gray-400">Bypasses standard 15ms Windows timer coalescing for sub-millisecond accuracy</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.performance.highPrecisionTimer}
                        onChange={(e) =>
                          handleUpdate({
                            performance: { ...settings.performance, highPrecisionTimer: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-accent-rose focus:ring-accent-rose bg-background border-surface-300"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer">
                      <div>
                        <span className="text-xs font-semibold text-white block">Direct Raw Input Simulation</span>
                        <span className="text-[11px] text-gray-400">Injects clicks directly into input queue bypassing desktop composition lag</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.performance.enableRawInputBypass}
                        onChange={(e) =>
                          handleUpdate({
                            performance: { ...settings.performance, enableRawInputBypass: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-accent-rose focus:ring-accent-rose bg-background border-surface-300"
                      />
                    </label>

                    <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
                      <label className="text-xs font-semibold text-white block">Process Execution Priority</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['normal', 'high', 'realtime'].map((priority) => (
                          <button
                            key={priority}
                            onClick={() =>
                              handleUpdate({
                                performance: { ...settings.performance, processPriority: priority as any },
                              })
                            }
                            className={`px-3 py-2 rounded-lg text-xs capitalize transition-all border ${
                              settings.performance.processPriority === priority
                                ? 'bg-accent-rose/20 border-accent-rose text-accent-rose font-bold'
                                : 'bg-background border-surface-200 text-gray-400 hover:text-white'
                            }`}
                          >
                            {priority}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Backup & Reset Tab */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">State Backup & Factory Reset</h3>
                  <p className="text-xs text-gray-400 mb-4">Export or restore all custom profiles and settings bundles</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                          <Download className="w-4 h-4 text-accent-cyan" /> Full Backup Export
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          Packages your entire configuration, hotkeys, theme preferences, and custom profiles into a single JSON file.
                        </p>
                      </div>
                      <button
                        onClick={handleExportBackup}
                        className="mt-4 px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Download Backup .JSON
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                          <Upload className="w-4 h-4 text-accent-purple" /> Restore From Backup
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          Replaces current profiles and restores previously exported HyperClick Pro backup bundles.
                        </p>
                      </div>
                      <label className="mt-4 px-4 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-glow-purple">
                        <Upload className="w-4 h-4" /> Choose Backup File
                        <input
                          ref={backupFileInputRef}
                          type="file"
                          accept=".json"
                          onChange={handleImportBackup}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Factory Reset Section */}
                  <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/30 space-y-3">
                    <div className="flex items-center gap-2 text-accent-rose font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Danger Zone: Reset All Data</span>
                    </div>
                    <p className="text-[11px] text-gray-300">
                      Clears all customized configurations, profiles, and hotkeys, reverting to factory defaults.
                    </p>

                    {showResetConfirm ? (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleResetToDefaults}
                          className="px-4 py-1.5 rounded-lg bg-accent-rose hover:bg-accent-rose/90 text-white text-xs font-bold transition-colors"
                        >
                          Confirm Complete Reset
                        </button>
                        <button
                          onClick={() => setShowResetConfirm(false)}
                          className="px-3 py-1.5 rounded-lg bg-surface-200 text-gray-300 text-xs hover:bg-surface-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowResetConfirm(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-accent-rose/20 hover:bg-accent-rose/30 text-accent-rose border border-accent-rose/40 text-xs font-semibold transition-colors"
                      >
                        Reset to Factory Defaults
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-surface-100 bg-background/50 flex items-center justify-between text-xs text-gray-400">
          <span>HyperClick Pro v{settings.version} • High-Precision Edition</span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-200 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
