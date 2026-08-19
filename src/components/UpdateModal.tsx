import { useState, useEffect, type FC, type ReactNode, type ChangeEvent } from 'react';
import {
  Download,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  X,
  ShieldCheck,
  Zap,
  HardDrive,
  Check,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  updaterService,
  type UpdateReleaseInfo,
  type DownloadProgress,
  type UpdateStatus,
  formatBytes,
} from '../services/updaterService';
import { cn } from '../utils/cn';

export interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoCheckOnOpen?: boolean;
}

export const UpdateModal: FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  autoCheckOnOpen = false,
}) => {
  const [status, setStatus] = useState<UpdateStatus>(updaterService.getStatus());
  const [releaseInfo, setReleaseInfo] = useState<UpdateReleaseInfo | null>(
    updaterService.getLastReleaseInfo()
  );
  const [progress, setProgress] = useState<DownloadProgress | null>(
    updaterService.getProgress()
  );
  const [selectedAsset, setSelectedAsset] = useState<'installer' | 'portable'>('installer');
  const [autoCheck, setAutoCheck] = useState<boolean>(
    updaterService.getPreferences().autoCheckOnStartup
  );
  const [changelogExpanded, setChangelogExpanded] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Subscribe to updaterService events
  useEffect(() => {
    const unsubStatus = updaterService.on('status-change', (newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'downloaded') {
        setProgress((prev) => (prev ? { ...prev, percent: 100 } : null));
      }
    });

    const unsubProgress = updaterService.on('progress', (prog) => {
      setProgress(prog);
    });

    const unsubAvailable = updaterService.on('update-available', (info) => {
      setReleaseInfo(info);
      setErrorMsg(null);
    });

    const unsubNotAvailable = updaterService.on('update-not-available', (info) => {
      setReleaseInfo(info);
      setErrorMsg(null);
    });

    const unsubError = updaterService.on('error', (err) => {
      setErrorMsg(err);
    });

    // Sync initial state
    setStatus(updaterService.getStatus());
    setReleaseInfo(updaterService.getLastReleaseInfo());
    setProgress(updaterService.getProgress());
    setAutoCheck(updaterService.getPreferences().autoCheckOnStartup);

    return () => {
      unsubStatus();
      unsubProgress();
      unsubAvailable();
      unsubNotAvailable();
      unsubError();
    };
  }, []);

  // Trigger check if modal opens with no release info or if autoCheckOnOpen is set
  useEffect(() => {
    if (isOpen) {
      if (autoCheckOnOpen || (!releaseInfo && status === 'idle')) {
        handleCheckUpdates(false);
      }
    }
  }, [isOpen, autoCheckOnOpen]);

  const handleCheckUpdates = async (forceMock: boolean = false) => {
    setErrorMsg(null);
    try {
      const info = await updaterService.checkForUpdates({ forceMock });
      setReleaseInfo(info);
      setIsDemoMode(forceMock);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to check for updates');
    }
  };

  const handleStartDownload = async () => {
    try {
      await updaterService.downloadUpdate(selectedAsset);
    } catch (err: any) {
      setErrorMsg(err.message || 'Download failed');
    }
  };

  const handleInstallNow = async () => {
    try {
      await updaterService.installAndRestart();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to trigger installation');
    }
  };

  const handleToggleAutoCheck = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAutoCheck(checked);
    updaterService.setAutoCheckOnStartup(checked);
  };

  const handleSkipThisVersion = () => {
    if (releaseInfo?.latestVersion) {
      updaterService.setSkippedVersion(releaseInfo.latestVersion);
      onClose();
    }
  };

  // Simple Markdown-to-JSX renderer for release notes
  const renderFormattedChangelog = (notes: string) => {
    if (!notes) return null;

    const lines = notes.split('\n');
    const elements: ReactNode[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (!trimmed) {
        elements.push(<div key={idx} className="h-2" />);
        return;
      }

      // Heading level 3 or 4: ### or ####
      if (trimmed.startsWith('#### ')) {
        const title = trimmed.replace('#### ', '');
        elements.push(
          <h4 key={idx} className="text-sm font-semibold text-cyan-300 mt-3 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {title}
          </h4>
        );
      } else if (trimmed.startsWith('### ')) {
        const title = trimmed.replace('### ', '');
        elements.push(
          <h3 key={idx} className="text-base font-bold text-white mt-4 mb-2 flex items-center gap-2 border-b border-white/10 pb-1">
            <Zap className="w-4 h-4 text-cyan-400" />
            {title}
          </h3>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // Bullet list
        const bulletText = trimmed.substring(2);
        // Parse simple bold tags **text**
        const formattedParts = parseBoldTags(bulletText);

        elements.push(
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 ml-1 py-0.5 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0 shadow-[0_0_6px_#00f2fe]" />
            <div>{formattedParts}</div>
          </div>
        );
      } else {
        elements.push(
          <p key={idx} className="text-xs text-slate-300 leading-relaxed">
            {parseBoldTags(trimmed)}
          </p>
        );
      }
    });

    return <div className="space-y-1">{elements}</div>;
  };

  const parseBoldTags = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-cyan-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  if (!isOpen) return null;

  const currentVer = releaseInfo?.currentVersion || updaterService.getCurrentVersion();
  const latestVer = releaseInfo?.latestVersion || '1.1.0';
  const hasUpdate = releaseInfo?.hasUpdate || status === 'available' || status === 'downloading' || status === 'downloaded';

  const installerSize = releaseInfo?.installerAsset?.size ? formatBytes(releaseInfo.installerAsset.size) : '68.5 MB';
  const portableSize = releaseInfo?.portableAsset?.size ? formatBytes(releaseInfo.portableAsset.size) : '66.2 MB';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Container */}
      <div 
        className={cn(
          "relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl",
          "glass-panel border border-cyan-500/30 shadow-[0_0_50px_-10px_rgba(0,242,254,0.3)]",
          "flex flex-col bg-[#0b0e18]/95 text-slate-100"
        )}
      >
        {/* Subtle Cyber Top Scanline */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#00f2fe]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,254,0.3)]">
              <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  HyperClick Pro Updater
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider font-semibold rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  2026 CI/CD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated release distribution & over-the-air binary upgrade engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
          {/* Version Comparison Card */}
          <div className="p-4 rounded-xl glass-card border border-white/10 bg-gradient-to-r from-cyan-950/20 via-slate-900/40 to-purple-950/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Current Version */}
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Current</span>
                <span className="text-sm font-mono font-bold text-slate-300 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                  v{currentVer}
                </span>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center px-1">
                <ArrowRight className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>

              {/* Latest Version Badge */}
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                  Latest Build
                </span>
                <span className="text-sm font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/40 shadow-[0_0_12px_rgba(0,242,254,0.25)] flex items-center gap-1.5">
                  v{latestVer}
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </span>
              </div>
            </div>

            {/* Status Chip */}
            <div className="flex items-center gap-2">
              {status === 'checking' && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 text-xs font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  Checking GitHub...
                </div>
              )}
              {status === 'not-available' && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-medium shadow-[0_0_10px_rgba(0,245,160,0.2)]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  You're Up to Date!
                </div>
              )}
              {hasUpdate && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 text-xs font-semibold shadow-[0_0_15px_rgba(0,242,254,0.3)]">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  New Update Ready!
                </div>
              )}
            </div>
          </div>

          {/* Error Message banner */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Update Notice:</span> {errorMsg}
              </div>
            </div>
          )}

          {/* Asset Selection (Installer vs Portable) */}
          {hasUpdate && status !== 'downloaded' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                Select Package Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* NSIS Installer */}
                <button
                  type="button"
                  onClick={() => setSelectedAsset('installer')}
                  disabled={status === 'downloading'}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                    selectedAsset === 'installer'
                      ? "bg-cyan-950/30 border-cyan-500/60 shadow-[0_0_15px_rgba(0,242,254,0.2)]"
                      : "bg-white/[0.03] border-white/10 hover:border-white/20 text-slate-400",
                    status === 'downloading' && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      NSIS Windows Installer
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                      {installerSize}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Recommended: Desktop shortcut, start menu entry, auto-updater support.
                  </p>
                  {selectedAsset === 'installer' && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
                  )}
                </button>

                {/* Portable Exe */}
                <button
                  type="button"
                  onClick={() => setSelectedAsset('portable')}
                  disabled={status === 'downloading'}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                    selectedAsset === 'portable'
                      ? "bg-cyan-950/30 border-cyan-500/60 shadow-[0_0_15px_rgba(0,242,254,0.2)]"
                      : "bg-white/[0.03] border-white/10 hover:border-white/20 text-slate-400",
                    status === 'downloading' && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                      Standalone Portable (.exe)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                      {portableSize}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    No installation required. Run directly from USB drives or any folder.
                  </p>
                  {selectedAsset === 'portable' && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Download Progress Bar Section */}
          {(status === 'downloading' || status === 'downloaded') && progress && (
            <div className="p-4 rounded-xl glass-card border border-cyan-500/30 bg-cyan-950/20 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                  {status === 'downloading' ? (
                    <>
                      <Download className="w-4 h-4 animate-bounce text-cyan-400" />
                      <span>Downloading Package...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Package Ready to Install</span>
                    </>
                  )}
                </div>
                <div className="font-mono text-cyan-200 font-bold text-sm">
                  {progress.percent}%
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-3 rounded-full bg-slate-900 border border-white/10 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 transition-all duration-150 rounded-full relative shadow-[0_0_15px_#00f2fe]"
                  style={{ width: `${progress.percent}%` }}
                >
                  {/* Subtle moving light sheen */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                </div>
              </div>

              {/* Progress Stats (Speed, MB, ETA) */}
              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <div>
                  Transferred: <span className="text-slate-200">{progress.formattedTransferred}</span> / {progress.formattedTotal}
                </div>
                <div className="flex items-center gap-4">
                  {status === 'downloading' && (
                    <>
                      <div>
                        Speed: <span className="text-cyan-300">{progress.formattedSpeed}</span>
                      </div>
                      <div>
                        ETA: <span className="text-slate-200">{progress.etaSeconds}s</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Changelog Accordion / Release Notes */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <button
              type="button"
              onClick={() => setChangelogExpanded(!changelogExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-white">
                  Release Notes & Changelog (v{latestVer})
                </span>
                {releaseInfo?.publishedAt && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(releaseInfo.publishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              {changelogExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {changelogExpanded && (
              <div className="px-4 py-3 max-h-56 overflow-y-auto border-t border-white/10 bg-black/20 text-xs custom-scrollbar">
                {releaseInfo?.releaseNotes ? (
                  renderFormattedChangelog(releaseInfo.releaseNotes)
                ) : (
                  <p className="text-slate-400 italic">No changelog provided for this release.</p>
                )}
              </div>
            )}
          </div>

          {/* Auto-check startup preference & Demo toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoCheck}
                onChange={handleToggleAutoCheck}
                className="rounded bg-white/10 border-white/20 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-cyan-400"
              />
              <span className="text-slate-300 text-xs">Automatically check for updates on startup</span>
            </label>

            {/* Offline Demo / Test Simulation trigger */}
            <button
              type="button"
              onClick={() => handleCheckUpdates(true)}
              className="text-[11px] text-slate-500 hover:text-cyan-400 transition-colors underline flex items-center gap-1"
              title="Test the update UI using simulated mock data"
            >
              <Sparkles className="w-3 h-3" />
              Simulate Update Demo
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            {releaseInfo?.htmlUrl && (
              <a
                href={releaseInfo.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on GitHub
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Later / Skip buttons */}
            {hasUpdate && status !== 'downloaded' && (
              <>
                <button
                  type="button"
                  onClick={handleSkipThisVersion}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                >
                  Skip Version
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Later
                </button>
              </>
            )}

            {/* If Up-To-Date or Checking */}
            {!hasUpdate && (
              <button
                type="button"
                onClick={() => handleCheckUpdates(false)}
                disabled={status === 'checking'}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-2 transition-all"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", status === 'checking' && "animate-spin text-cyan-400")} />
                {status === 'checking' ? 'Checking...' : 'Check Again'}
              </button>
            )}

            {/* Download Button */}
            {hasUpdate && status !== 'downloading' && status !== 'downloaded' && (
              <button
                type="button"
                onClick={handleStartDownload}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-[0_0_20px_rgba(0,242,254,0.4)] flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-4 h-4 text-slate-950" />
                Download & Install Now
              </button>
            )}

            {/* Install & Restart Button when downloaded */}
            {status === 'downloaded' && (
              <button
                type="button"
                onClick={handleInstallNow}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-[0_0_20px_rgba(0,245,160,0.4)] flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                Install & Restart Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
