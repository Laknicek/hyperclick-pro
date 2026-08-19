/**
 * Comprehensive Unit Tests:
 * 1. Profile schema validation & automated normalization/repair (validateProfileSchema)
 * 2. Application settings persistence, merging, and defaults (loadSettings, saveSettings)
 * 3. Custom profile CRUD (create, update, rename, clone, delete)
 * 4. Favorites indexing & active/default profile resolution
 * 5. Single profile & bundle JSON serialization & export formatting
 * 6. Profile JSON import parsing, schema validation, duplicate ID collision avoidance, and error reporting
 * 7. Full system backup export and restore
 * 
 * Target file:
 * - src/services/storageService.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateProfileSchema,
  storageService,
  DEFAULT_APP_SETTINGS,
  SoundSynthesizer,
  soundSynthesizer,
} from '../../src/services/storageService';
import { BUILTIN_PRESETS } from '../../src/services/presetLibrary';
import { PresetProfile } from '../../src/types/presets';

describe('Storage Service & Profile Validation Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Profile Schema Validation (validateProfileSchema)', () => {
    it('validates a complete, compliant preset profile successfully', () => {
      const validProfile: Partial<PresetProfile> = {
        id: 'test-profile-1',
        name: 'Quantum Speed Test',
        category: 'gaming',
        description: 'Test profile description',
        icon: 'Zap',
        tags: ['PVP', 'CPS'],
        cps: 20,
        intervalMs: 50,
        button: 'left',
        clickType: 'single',
        triggerMode: 'toggle',
        hotkey: 'F6',
        humanizer: {
          enabled: true,
          algorithm: 'gaussian',
          jitterMs: 5,
          fatigueFactor: 0.2,
          microPauses: false,
          microPauseProbability: 0.05,
          microPauseMinMs: 50,
          microPauseMaxMs: 150,
          cursorJitter: false,
          cursorJitterRadiusPx: 1.5,
        },
      };

      const result = validateProfileSchema(validProfile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data?.id).toBe('test-profile-1');
      expect(result.data?.cps).toBe(20);
      expect(result.data?.intervalMs).toBe(50);
    });

    it('rejects non-object or null payloads', () => {
      expect(validateProfileSchema(null).isValid).toBe(false);
      expect(validateProfileSchema(undefined).isValid).toBe(false);
      expect(validateProfileSchema('string payload').isValid).toBe(false);
      expect(validateProfileSchema(12345).isValid).toBe(false);
    });

    it('recovers and auto-generates missing ID and name with warnings', () => {
      const broken = {
        cps: 15,
      };

      const result = validateProfileSchema(broken);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(2);
      expect(result.data?.id).toMatch(/^profile-recovered-/);
      expect(result.data?.name).toBe('Recovered Custom Profile');
    });

    it('infers CPS from intervalMs when CPS is missing or invalid', () => {
      const missingCps = {
        name: 'Inference Test',
        intervalMs: 40, // 1000 / 40 = 25 CPS
      };

      const result = validateProfileSchema(missingCps);
      expect(result.isValid).toBe(true);
      expect(result.data?.cps).toBe(25);
      expect(result.data?.intervalMs).toBe(40);
    });

    it('infers intervalMs from CPS when intervalMs is missing or invalid', () => {
      const missingInterval = {
        name: 'Interval Inference Test',
        cps: 50, // 1000 / 50 = 20 ms
      };

      const result = validateProfileSchema(missingInterval);
      expect(result.isValid).toBe(true);
      expect(result.data?.cps).toBe(50);
      expect(result.data?.intervalMs).toBe(20);
    });

    it('normalizes unrecognized mouse buttons, click types, and algorithms', () => {
      const invalidEnums = {
        name: 'Enum Test',
        button: 'unknown_button_99',
        clickType: 'quadruple_click_invalid',
        humanizer: {
          algorithm: 'super_quantum_non_existent',
        },
      };

      const result = validateProfileSchema(invalidEnums);
      expect(result.isValid).toBe(true);
      expect(result.data?.button).toBe('left');
      expect(result.data?.clickType).toBe('single');
      expect(result.data?.humanizer.algorithm).toBe('off');
    });
  });

  describe('Application Settings Management', () => {
    it('returns factory defaults when storage is empty', () => {
      const settings = storageService.loadSettings();
      expect(settings.theme).toBe(DEFAULT_APP_SETTINGS.theme);
      expect(settings.sound.enabled).toBe(true);
      expect(settings.overlay.enabled).toBe(true);
    });

    it('persists and deep merges partial settings updates', () => {
      const updated = storageService.saveSettings({
        theme: 'emerald',
        sound: {
          ...DEFAULT_APP_SETTINGS.sound,
          volume: 90,
        },
      });

      expect(updated.theme).toBe('emerald');
      expect(updated.sound.volume).toBe(90);
      expect(updated.sound.enabled).toBe(true); // preserved

      const reloaded = storageService.loadSettings();
      expect(reloaded.theme).toBe('emerald');
      expect(reloaded.sound.volume).toBe(90);
    });

    it('updates single top-level setting via updateSetting', () => {
      storageService.updateSetting('glassmorphism', false);
      expect(storageService.loadSettings().glassmorphism).toBe(false);
    });

    it('resets settings to factory defaults', () => {
      storageService.saveSettings({ theme: 'amber', glassmorphism: false });
      expect(storageService.loadSettings().theme).toBe('amber');

      const reset = storageService.resetSettingsToDefault();
      expect(reset.theme).toBe('cyan');
      expect(storageService.loadSettings().theme).toBe('cyan');
    });
  });

  describe('Custom Profile CRUD Operations', () => {
    it('creates, saves, and lists custom profiles', () => {
      expect(storageService.getCustomProfiles()).toHaveLength(0);

      const created = storageService.createProfile({
        name: 'Auto Miner Pro',
        cps: 16,
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe('Auto Miner Pro');
      expect(created.cps).toBe(16);
      expect(created.isBuiltIn).toBe(false);

      const list = storageService.getCustomProfiles();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(created.id);
    });

    it('saves updates to an existing custom profile', () => {
      const profile = storageService.createProfile({ name: 'Initial Name', cps: 10 });
      profile.name = 'Updated Name';
      profile.cps = 25;

      storageService.saveProfile(profile);

      const fetched = storageService.getProfileById(profile.id);
      expect(fetched?.name).toBe('Updated Name');
      expect(fetched?.cps).toBe(25);
    });

    it('renames a profile successfully', () => {
      const profile = storageService.createProfile({ name: 'Old Title' });
      const renamed = storageService.renameProfile(profile.id, 'New Glorious Title');

      expect(renamed).toBe(true);
      expect(storageService.getProfileById(profile.id)?.name).toBe('New Glorious Title');

      // Renaming non-existent profile returns false
      expect(storageService.renameProfile('fake-id-999', 'Test')).toBe(false);
    });

    it('clones built-in and custom profiles', () => {
      const builtin = BUILTIN_PRESETS[0];
      const cloned = storageService.cloneProfile(builtin.id, 'My Cloned Builtin');

      expect(cloned.id).not.toBe(builtin.id);
      expect(cloned.name).toBe('My Cloned Builtin');
      expect(cloned.isBuiltIn).toBe(false);
      expect(storageService.getCustomProfiles()).toHaveLength(1);
    });

    it('deletes a custom profile and switches active profile if deleted', () => {
      const profile = storageService.createProfile({ name: 'To Be Deleted' });
      storageService.setActiveProfile(profile.id);
      expect(storageService.getActiveProfileId()).toBe(profile.id);

      const deleted = storageService.deleteProfile(profile.id);
      expect(deleted).toBe(true);
      expect(storageService.getProfileById(profile.id)).toBeNull();

      // Should automatically switch to default profile
      expect(storageService.getActiveProfileId()).toBe(storageService.getDefaultProfileId());
    });
  });

  describe('Favorites & Profile Aggregation', () => {
    it('manages favorite IDs and returns combined profile list with isFavorite flags', () => {
      const custom = storageService.createProfile({ name: 'Fav Custom' });
      const allBefore = storageService.getAllProfiles();
      const customItemBefore = allBefore.find((p) => p.id === custom.id);
      expect(customItemBefore?.isFavorite).toBe(false);

      const isFav = storageService.toggleFavorite(custom.id);
      expect(isFav).toBe(true);

      const allAfter = storageService.getAllProfiles();
      const customItemAfter = allAfter.find((p) => p.id === custom.id);
      expect(customItemAfter?.isFavorite).toBe(true);

      // Untoggle
      const untoggled = storageService.toggleFavorite(custom.id);
      expect(untoggled).toBe(false);
    });
  });

  describe('Export, Import & Full System Backup', () => {
    it('exports profile(s) to formatted JSON bundle', () => {
      const profile = storageService.createProfile({ name: 'Export Target', cps: 30 });
      const json = storageService.exportProfileToJson(profile, true);

      const parsed = JSON.parse(json);
      expect(parsed.format).toBe('hyperclick-pro-profile-bundle');
      expect(parsed.schemaVersion).toBe('1.0.0');
      expect(parsed.profiles).toHaveLength(1);
      expect(parsed.profiles[0].name).toBe('Export Target');
      expect(parsed.appSettings).toBeDefined();
    });

    it('imports single profile JSON and handles ID collision', () => {
      const singleProfile: Partial<PresetProfile> = {
        id: 'collide-1',
        name: 'Collision Target',
        cps: 12,
        intervalMs: 83,
      };

      // First import
      const res1 = storageService.importProfilesFromJson(JSON.stringify(singleProfile));
      expect(res1.success).toBe(true);
      expect(res1.imported).toHaveLength(1);
      expect(res1.imported[0].id).toBe('collide-1');

      // Second import of same ID should rename and generate fresh ID
      const res2 = storageService.importProfilesFromJson(JSON.stringify(singleProfile));
      expect(res2.success).toBe(true);
      expect(res2.imported).toHaveLength(1);
      expect(res2.imported[0].id).not.toBe('collide-1');
      expect(res2.imported[0].name).toBe('Collision Target (Imported)');
    });

    it('imports multi-profile bundle JSON', () => {
      const bundle = {
        format: 'hyperclick-pro-profile-bundle',
        schemaVersion: '1.0.0',
        profiles: [
          { name: 'Bundle Item 1', cps: 10, intervalMs: 100 },
          { name: 'Bundle Item 2', cps: 20, intervalMs: 50 },
        ],
      };

      const result = storageService.importProfilesFromJson(JSON.stringify(bundle));
      expect(result.success).toBe(true);
      expect(result.imported).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('reports errors for malformed JSON or invalid schema entries', () => {
      const invalidJson = '{ not valid json syntax';
      const res1 = storageService.importProfilesFromJson(invalidJson);
      expect(res1.success).toBe(false);
      expect(res1.errors.length).toBeGreaterThan(0);

      const invalidStructure = JSON.stringify('just a string');
      const res2 = storageService.importProfilesFromJson(invalidStructure);
      expect(res2.success).toBe(false);
    });

    it('creates and restores full system backup including settings', () => {
      storageService.saveSettings({ theme: 'emerald' });
      storageService.createProfile({ name: 'Backup Item 1' });
      storageService.createProfile({ name: 'Backup Item 2' });

      const backupString = storageService.exportFullBackup();

      // Clear all state
      storageService.resetAllToFactoryDefaults();
      expect(storageService.loadSettings().theme).toBe('cyan');
      expect(storageService.getCustomProfiles()).toHaveLength(0);

      // Restore
      const restoreResult = storageService.restoreFullBackup(backupString);
      expect(restoreResult.success).toBe(true);
      expect(storageService.loadSettings().theme).toBe('emerald');
      expect(storageService.getCustomProfiles()).toHaveLength(2);
    });
  });

  describe('SoundSynthesizer Utility (src/services/storageService.ts)', () => {
    it('instantiates SoundSynthesizer singleton and executes without throwing', () => {
      expect(soundSynthesizer).toBeInstanceOf(SoundSynthesizer);
      expect(() => {
        soundSynthesizer.playClick('off', 0);
        soundSynthesizer.playToggleSound(true, 0);
      }).not.toThrow();
    });

    it('synthesizes all built-in sound synthesizer packs', () => {
      const packs: any[] = [
        'mechanical-blue',
        'mechanical-brown',
        'soft-membrane',
        'bubble-pop',
        'futuristic-laser',
        'subtle-tick',
      ];

      packs.forEach((pack) => {
        expect(() => {
          soundSynthesizer.playClick(pack, 70, true);
          soundSynthesizer.playClick(pack, 70, false);
        }).not.toThrow();
      });

      expect(() => {
        soundSynthesizer.playToggleSound(true, 50);
        soundSynthesizer.playToggleSound(false, 50);
      }).not.toThrow();
    });

    it('handles file export and import methods safely', async () => {
      // Mock File object
      const jsonContent = storageService.exportProfileToJson(storageService.getDefaultProfile());
      const mockFile = new File([jsonContent], 'test-profile.json', { type: 'application/json' });

      const importResult = await storageService.importProfilesFromFile(mockFile);
      expect(importResult.success).toBe(true);
      expect(importResult.imported.length).toBeGreaterThanOrEqual(1);

      // Empty file handling
      const emptyFile = new File([''], 'empty.json', { type: 'application/json' });
      const emptyResult = await storageService.importProfilesFromFile(emptyFile);
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.errors).toContain('File appears to be empty.');
    });
  });
});
