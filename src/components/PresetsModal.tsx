import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Zap,
  Flame,
  Sparkles,
  ShieldCheck,
  Shield,
  Clock,
  Crosshair,
  Layers,
  FileSpreadsheet,
  Cpu,
  Award,
  Download,
  Upload,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Check,
  CheckCircle2,
  Star,
  FileJson,
  Grid,
  List,
  AlertCircle,
  SlidersHorizontal,
  MousePointer,
  Activity,
  ArrowRight,
  Info,
  CornerDownRight,
} from 'lucide-react';
import { PresetProfile, PresetCategory, ClickButton, PresetClickType as ClickType } from '../types/presets';
import { PRESET_CATEGORIES, searchPresets } from '../services/presetLibrary';
import { storageService, soundSynthesizer } from '../services/storageService';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfileId: string;
  onSelectProfile: (profile: PresetProfile) => void;
  onProfileUpdated?: () => void;
}

// Icon mapper for dynamic string icon lookup
const ICON_MAP: Record<string, React.ElementType> = {
  Flame,
  Sparkles,
  ShieldCheck,
  Shield,
  Clock,
  Crosshair,
  Layers,
  FileSpreadsheet,
  Award,
  Cpu,
  Zap,
  Activity,
  MousePointer,
};

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  activeProfileId,
  onSelectProfile,
  onProfileUpdated,
}) => {
  const [profiles, setProfiles] = useState<PresetProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'library' | 'import-export'>('library');

  // Custom Profile Creator State
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileCategory, setNewProfileCategory] = useState<PresetCategory>('gaming');
  const [newProfileCps, setNewProfileCps] = useState(15);
  const [newProfileButton, setNewProfileButton] = useState<ClickButton>('left');
  const [newProfileClickType, setNewProfileClickType] = useState<ClickType>('single');
  const [newProfileDesc, setNewProfileDesc] = useState('');

  // Inline Rename State
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  // Import / Export Feedback
  const [importJsonText, setImportJsonText] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profiles on open or update
  const refreshProfiles = () => {
    const all = storageService.getAllProfiles();
    setProfiles(all);
    if (onProfileUpdated) onProfileUpdated();
  };

  useEffect(() => {
    if (isOpen) {
      refreshProfiles();
      setNotification(null);
    }
  }, [isOpen]);

  // Filtered and searched presets
  const filteredProfiles = useMemo(() => {
    const custom = profiles.filter((p) => !p.isBuiltIn);
    return searchPresets(searchQuery, selectedCategory, custom);
  }, [profiles, searchQuery, selectedCategory]);

  const defaultProfileId = storageService.getDefaultProfileId();

  if (!isOpen) return null;

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Handle Profile Activation
  const handleApplyProfile = (profile: PresetProfile) => {
    soundSynthesizer.playClick('subtle-tick', 60);
    storageService.setActiveProfile(profile.id);
    onSelectProfile(profile);
    refreshProfiles();
    showFeedback('success', `Activated "${profile.name}" preset.`);
  };

  // Handle Set as Default
  const handleSetDefault = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    storageService.setDefaultProfile(profileId);
    refreshProfiles();
    showFeedback('success', 'Set as default launch profile.');
  };

  // Handle Favorite Toggle
  const handleToggleFavorite = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    const isFav = storageService.toggleFavorite(profileId);
    refreshProfiles();
    soundSynthesizer.playClick('subtle-tick', 40);
  };

  // Handle Clone
  const handleCloneProfile = (e: React.MouseEvent, profile: PresetProfile) => {
    e.stopPropagation();
    const cloned = storageService.cloneProfile(profile.id, `${profile.name} (Custom)`);
    refreshProfiles();
    showFeedback('success', `Created custom copy "${cloned.name}".`);
  };

  // Handle Delete
  const handleDeleteProfile = (e: React.MouseEvent, profileId: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete custom profile "${name}"?`)) {
      const deleted = storageService.deleteProfile(profileId);
      if (deleted) {
        refreshProfiles();
        showFeedback('success', `Deleted profile "${name}".`);
      }
    }
  };

  // Handle Rename Submit
  const handleSaveRename = (profileId: string) => {
    if (renameText.trim()) {
      storageService.renameProfile(profileId, renameText.trim());
      setRenamingId(null);
      refreshProfiles();
      showFeedback('success', 'Profile renamed.');
    }
  };

  // Handle New Profile Creation
  const handleCreateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) {
      showFeedback('error', 'Please provide a profile name.');
      return;
    }

    const intervalMs = Math.max(1, Math.round(1000 / (newProfileCps || 10)));
    const created = storageService.createProfile({
      name: newProfileName.trim(),
      category: newProfileCategory,
      description: newProfileDesc || 'Custom user automation profile.',
      cps: newProfileCps,
      intervalMs,
      button: newProfileButton,
      clickType: newProfileClickType,
      tags: ['Custom', newProfileCategory.toUpperCase()],
    });

    setIsCreating(false);
    setNewProfileName('');
    setNewProfileDesc('');
    refreshProfiles();
    showFeedback('success', `Created custom profile "${created.name}".`);
  };

  // Handle Single Profile Export
  const handleExportProfile = (e: React.MouseEvent, profile: PresetProfile) => {
    e.stopPropagation();
    storageService.exportProfilesToFile(profile);
    showFeedback('success', `Exported "${profile.name}" to JSON.`);
  };

  // Handle Export All Profiles
  const handleExportAll = () => {
    storageService.exportProfilesToFile(profiles, `hyperclick-all-profiles-${Date.now()}.json`);
    showFeedback('success', `Exported all ${profiles.length} profiles.`);
  };

  // Handle File Import
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const result = await storageService.importProfilesFromFile(file);

    if (result.success) {
      refreshProfiles();
      showFeedback(
        'success',
        `Successfully imported ${result.imported.length} profile(s)!`
      );
      if (result.warnings.length > 0) {
        console.warn('[HyperClick Import Warnings]:', result.warnings);
      }
    } else {
      showFeedback('error', result.errors.join('; ') || 'Import failed.');
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Paste JSON Import
  const handleImportJsonSubmit = () => {
    if (!importJsonText.trim()) {
      showFeedback('error', 'Please paste valid JSON text.');
      return;
    }

    const result = storageService.importProfilesFromJson(importJsonText);
    if (result.success) {
      setImportJsonText('');
      refreshProfiles();
      setActiveTab('library');
      showFeedback(
        'success',
        `Successfully imported ${result.imported.length} profile(s)!`
      );
    } else {
      showFeedback('error', result.errors.join('; ') || 'Invalid JSON format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div className="relative w-full max-w-6xl h-[90vh] max-h-[880px] bg-card border border-surface-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-gray-100">
        
        {/* Glow accent backgrounds */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-background/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan shadow-glow-cyan">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">Preset & Profile Library</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-surface-100 border border-white/10 text-gray-300">
                  {profiles.length} Profiles
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Switch, customize, and deploy game-ready automation algorithms & macros
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab navigation */}
            <div className="flex p-1 rounded-xl bg-surface-50 border border-surface-100 text-xs font-medium">
              <button
                onClick={() => setActiveTab('library')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'library'
                    ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Preset Catalog
              </button>
              <button
                onClick={() => setActiveTab('import-export')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'import-export'
                    ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30 font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <FileJson className="w-3.5 h-3.5" />
                Import / Export
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface-50 border border-surface-100 text-gray-400 hover:text-white hover:bg-surface-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Bar */}
        {notification && (
          <div
            className={`px-6 py-2.5 flex items-center gap-2 text-xs font-medium border-b transition-all ${
              notification.type === 'success'
                ? 'bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald'
                : 'bg-accent-rose/10 border-accent-rose/30 text-accent-rose'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Main Content Area */}
        {activeTab === 'library' ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search & Category Filter Bar */}
            <div className="p-5 border-b border-surface-100 bg-surface-50/40 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by game, preset name, hotkey, CPS, or tag (e.g. Minecraft, 20 CPS, Jitter)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-background/80 border border-surface-200 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/30 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Actions & View Mode Toggle */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue text-black font-semibold text-xs hover:opacity-95 shadow-glow-cyan transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create Profile
                  </button>

                  <div className="flex p-1 rounded-xl bg-background/80 border border-surface-200">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-surface-200 text-white'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                      title="Grid View"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'list'
                          ? 'bg-surface-200 text-white'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                      title="List View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {PRESET_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const count =
                    cat.id === 'all'
                      ? profiles.length
                      : cat.id === 'custom'
                      ? profiles.filter((p) => !p.isBuiltIn).length
                      : profiles.filter((p) => p.category === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                        isSelected
                          ? `${cat.badgeColor} shadow-sm font-semibold scale-105`
                          : 'bg-background/40 border-surface-200 text-gray-400 hover:text-gray-200 hover:border-surface-300'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-white/20' : 'bg-surface-100 text-gray-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Grid / List Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              {filteredProfiles.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <div className="p-4 rounded-full bg-surface-50 border border-surface-200 text-gray-400 mb-3">
                    <Search className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-semibold text-white">No Presets Found</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm">
                    No configurations matched your search "{searchQuery}". Try a different keyword or create a custom profile.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 text-xs font-medium text-white transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                      : 'flex flex-col gap-3'
                  }
                >
                  {filteredProfiles.map((profile) => {
                    const isActive = profile.id === activeProfileId;
                    const isDefault = profile.id === defaultProfileId;
                    const IconComponent = ICON_MAP[profile.icon] || Zap;

                    return (
                      <div
                        key={profile.id}
                        onClick={() => handleApplyProfile(profile)}
                        className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
                          isActive
                            ? 'bg-cardHover border-accent-cyan/50 shadow-glow-cyan ring-1 ring-accent-cyan/40'
                            : 'bg-card hover:bg-cardHover border-surface-200 hover:border-surface-300'
                        } ${viewMode === 'list' ? 'p-4 sm:flex-row sm:items-center sm:gap-6' : 'p-5'}`}
                      >
                        {/* Active Ribbon / Glow Top Accent */}
                        {isActive && (
                          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent-cyan via-accent-blue to-accent-purple" />
                        )}

                        {/* Top Card Section */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
                                  isActive
                                    ? 'bg-accent-cyan/20 border-accent-cyan/40 text-accent-cyan'
                                    : 'bg-surface-100 border-surface-200 text-gray-300 group-hover:text-white group-hover:border-surface-300'
                                }`}
                              >
                                <IconComponent className="w-5 h-5" />
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  {renamingId === profile.id ? (
                                    <div
                                      className="flex items-center gap-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="text"
                                        value={renameText}
                                        onChange={(e) => setRenameText(e.target.value)}
                                        className="px-2 py-0.5 text-sm bg-background border border-accent-cyan rounded text-white"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleSaveRename(profile.id)}
                                        className="p-1 text-accent-emerald hover:bg-surface-100 rounded"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setRenamingId(null)}
                                        className="p-1 text-gray-400 hover:bg-surface-100 rounded"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <h4 className="text-sm font-bold text-white group-hover:text-accent-cyan transition-colors">
                                      {profile.name}
                                    </h4>
                                  )}

                                  {/* Badges */}
                                  {isActive && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent-cyan text-black uppercase tracking-wider shadow-sm">
                                      Active
                                    </span>
                                  )}
                                  {isDefault && (
                                    <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-surface-100 border border-white/10 text-gray-300">
                                      Default
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[11px] font-medium text-gray-400 capitalize">
                                    {profile.category}
                                  </span>
                                  <span className="text-gray-600">•</span>
                                  <span className="text-[11px] font-mono text-accent-cyan font-semibold">
                                    {profile.cps >= 1 ? `${profile.cps} CPS` : `${(profile.intervalMs / 1000).toFixed(0)}s Interval`}
                                  </span>
                                  <span className="text-gray-600">•</span>
                                  <span className="text-[11px] font-mono text-gray-400">
                                    [{profile.hotkey}]
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Favorite Star */}
                            <button
                              onClick={(e) => handleToggleFavorite(e, profile.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                profile.isFavorite
                                  ? 'text-accent-amber hover:text-amber-300'
                                  : 'text-gray-500 hover:text-gray-300'
                              }`}
                              title={profile.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
                            >
                              <Star
                                className="w-4 h-4"
                                fill={profile.isFavorite ? 'currentColor' : 'none'}
                              />
                            </button>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-gray-400 mt-2.5 line-clamp-2 leading-relaxed">
                            {profile.description}
                          </p>

                          {/* Metrics Pill Grid */}
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                            <div className="px-2 py-1 rounded-lg bg-surface-50 border border-surface-100 flex items-center justify-between">
                              <span className="text-gray-400">Humanizer</span>
                              <span className="font-semibold text-gray-200 capitalize">
                                {profile.humanizer.enabled
                                  ? `${profile.humanizer.algorithm.replace('_', ' ')} (±${profile.humanizer.jitterMs}ms)`
                                  : 'Zero Jitter'}
                              </span>
                            </div>
                            <div className="px-2 py-1 rounded-lg bg-surface-50 border border-surface-100 flex items-center justify-between">
                              <span className="text-gray-400">Button</span>
                              <span className="font-semibold text-gray-200 capitalize">
                                {profile.button} ({profile.clickType})
                              </span>
                            </div>
                          </div>

                          {/* Tag Chips */}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {profile.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-[10px] rounded-md bg-surface-100 text-gray-300 border border-surface-200"
                              >
                                {tag}
                              </span>
                            ))}
                            {profile.tags.length > 3 && (
                              <span className="text-[10px] text-gray-500 self-center">
                                +{profile.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom Actions Bar */}
                        <div
                          className={`mt-4 pt-3 border-t border-surface-100 flex items-center justify-between gap-2 ${
                            viewMode === 'list' ? 'sm:mt-0 sm:pt-0 sm:border-0' : ''
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1">
                            {!profile.isBuiltIn && (
                              <>
                                <button
                                  onClick={() => {
                                    setRenamingId(profile.id);
                                    setRenameText(profile.name);
                                  }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-100"
                                  title="Rename Profile"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) =>
                                    handleDeleteProfile(e, profile.id, profile.name)
                                  }
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-accent-rose hover:bg-surface-100"
                                  title="Delete Custom Profile"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            <button
                              onClick={(e) => handleCloneProfile(e, profile)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-accent-purple hover:bg-surface-100"
                              title="Clone to Custom Profile"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => handleExportProfile(e, profile)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-accent-blue hover:bg-surface-100"
                              title="Export to .JSON"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {!isDefault && (
                              <button
                                onClick={(e) => handleSetDefault(e, profile.id)}
                                className="px-2 py-1 rounded text-[10px] text-gray-400 hover:text-white hover:bg-surface-100"
                                title="Set as launch default"
                              >
                                Set Default
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => handleApplyProfile(profile)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                              isActive
                                ? 'bg-accent-cyan text-black shadow-glow-cyan'
                                : 'bg-surface-100 hover:bg-accent-cyan hover:text-black text-gray-200'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Active
                              </>
                            ) : (
                              <>
                                Deploy <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Import / Export Tab */
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* File Import Box */}
              <div className="p-6 rounded-2xl bg-card border border-surface-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-accent-blue/10 border border-accent-blue/30 text-accent-blue">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Import Profile from File</h3>
                      <p className="text-xs text-gray-400">Load .json profile exports or full preset bundles</p>
                    </div>
                  </div>

                  <label
                    htmlFor="file-upload"
                    className="mt-4 border-2 border-dashed border-surface-300 hover:border-accent-cyan rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-background/50 hover:bg-surface-50"
                  >
                    <FileJson className="w-10 h-10 text-accent-cyan mb-2" />
                    <span className="text-sm font-semibold text-white">Click or drag & drop .json profile file</span>
                    <span className="text-xs text-gray-500 mt-1">Supports single profile JSON and bundle archives</span>
                    <input
                      id="file-upload"
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Paste JSON Raw Text */}
              <div className="p-6 rounded-2xl bg-card border border-surface-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-accent-purple/10 border border-accent-purple/30 text-accent-purple">
                      <FileJson className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Paste JSON Configuration</h3>
                      <p className="text-xs text-gray-400">Directly paste exported profile schemas</p>
                    </div>
                  </div>

                  <textarea
                    rows={5}
                    placeholder='Paste raw JSON content here: { "name": "My Custom Jitter", "cps": 18, ... }'
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-background border border-surface-200 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent-purple transition-colors"
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleImportJsonSubmit}
                    className="px-4 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white font-semibold text-xs transition-all shadow-glow-purple flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Validate & Import JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Export Collection Section */}
            <div className="p-6 rounded-2xl bg-card border border-surface-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white">Export Profile Collection</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Download your custom configurations and complete library backups to share or migrate.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportAll}
                    className="px-4 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-200 text-white border border-surface-200 text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Export All Profiles ({profiles.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-surface-100 bg-background/50 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-emerald animate-ping" />
            <span>Active Engine: <strong className="text-white">{profiles.find(p => p.id === activeProfileId)?.name || 'Default'}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-200 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>

      {/* Create Profile Drawer / Submodal */}
      {isCreating && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-card border border-accent-cyan/30 rounded-2xl p-6 shadow-glow-cyan text-white">
            <div className="flex items-center justify-between mb-4 border-b border-surface-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-accent-cyan" />
                <h3 className="text-base font-bold">Create Custom Profile</h3>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProfileSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Profile Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Bedwars Super Jitter v2"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-surface-200 text-white focus:outline-none focus:border-accent-cyan"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Category</label>
                  <select
                    value={newProfileCategory}
                    onChange={(e) => setNewProfileCategory(e.target.value as PresetCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-surface-200 text-white focus:outline-none focus:border-accent-cyan"
                  >
                    <option value="gaming">Gaming & PvP</option>
                    <option value="stealth">Stealth & Anti-Cheat</option>
                    <option value="afk">AFK & Anti-Idle</option>
                    <option value="productivity">Productivity & Office</option>
                    <option value="testing">QA & Benchmark</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">Target Speed (CPS)</label>
                  <input
                    type="number"
                    min="0.1"
                    max="1000"
                    step="0.5"
                    value={newProfileCps}
                    onChange={(e) => setNewProfileCps(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-surface-200 text-white focus:outline-none focus:border-accent-cyan font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Mouse Button</label>
                  <select
                    value={newProfileButton}
                    onChange={(e) => setNewProfileButton(e.target.value as ClickButton)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-surface-200 text-white focus:outline-none focus:border-accent-cyan capitalize"
                  >
                    <option value="left">Left Click</option>
                    <option value="right">Right Click</option>
                    <option value="middle">Middle Click</option>
                    <option value="mouse4">Mouse 4 (Side)</option>
                    <option value="mouse5">Mouse 5 (Side)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">Click Mode</label>
                  <select
                    value={newProfileClickType}
                    onChange={(e) => setNewProfileClickType(e.target.value as ClickType)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-surface-200 text-white focus:outline-none focus:border-accent-cyan capitalize"
                  >
                    <option value="single">Single Click</option>
                    <option value="double">Double Click</option>
                    <option value="triple">Triple Click</option>
                    <option value="hold">Hold Down</option>
                    <option value="burst">Burst Mode</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Notes on usage or game keybindings..."
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-surface-200 text-white focus:outline-none focus:border-accent-cyan"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-accent-cyan text-black font-semibold shadow-glow-cyan hover:opacity-95 transition-all"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
