/**
 * Comprehensive Unit Tests:
 * 1. SemVer parsing & extraction (with and without 'v' prefix, prerelease tags, fallbacks)
 * 2. SemVer comparison logic & precedence rules (major, minor, patch, prerelease)
 * 3. Human-readable byte formatting (formatBytes)
 * 4. Preferences storage & retrieval (autoCheck, skippedVersion, preferredAsset)
 * 5. Update detection, asset selection (installer vs portable), and event bus emissions
 * 6. Download simulation, progress tracking, and cancellation
 * 
 * Target file:
 * - src/services/updaterService.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  parseSemVer,
  compareSemVer,
  isNewerVersion,
  formatBytes,
  UpdaterService,
  updaterService,
  MOCK_LATEST_RELEASE,
  UpdateReleaseInfo,
  DownloadProgress,
} from '../../src/services/updaterService';

describe('Updater Service & SemVer Algorithms', () => {
  describe('SemVer Parsing (parseSemVer)', () => {
    it('parses standard 3-digit semantic version', () => {
      const sem = parseSemVer('1.2.3');
      expect(sem).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: null,
        raw: '1.2.3',
      });
    });

    it('strips leading "v" or "V" prefixes and trailing whitespace', () => {
      const vLower = parseSemVer('  v2.0.4  ');
      expect(vLower.major).toBe(2);
      expect(vLower.minor).toBe(0);
      expect(vLower.patch).toBe(4);

      const vUpper = parseSemVer('V10.15.99');
      expect(vUpper.major).toBe(10);
      expect(vUpper.minor).toBe(15);
      expect(vUpper.patch).toBe(99);
    });

    it('parses prerelease tags and build identifiers', () => {
      const beta = parseSemVer('1.1.0-beta.2');
      expect(beta.major).toBe(1);
      expect(beta.minor).toBe(1);
      expect(beta.patch).toBe(0);
      expect(beta.prerelease).toBe('beta.2');

      const rc = parseSemVer('v2.0.0-rc.1-preview');
      expect(rc.major).toBe(2);
      expect(rc.minor).toBe(0);
      expect(rc.patch).toBe(0);
      expect(rc.prerelease).toBe('rc.1-preview');
    });

    it('handles empty or malformed strings gracefully', () => {
      const empty = parseSemVer('');
      expect(empty).toEqual({ major: 0, minor: 0, patch: 0, prerelease: null, raw: '0.0.0' });

      const invalid = parseSemVer('abc.def');
      expect(invalid.major).toBe(0);
      expect(invalid.minor).toBe(0);
      expect(invalid.patch).toBe(0);

      const partial = parseSemVer('2.5');
      expect(partial.major).toBe(2);
      expect(partial.minor).toBe(5);
      expect(partial.patch).toBe(0);
    });
  });

  describe('SemVer Comparison (compareSemVer & isNewerVersion)', () => {
    it('compares major versions correctly', () => {
      expect(compareSemVer('2.0.0', '1.9.9')).toBe(1);
      expect(compareSemVer('1.0.0', '2.0.0')).toBe(-1);
    });

    it('compares minor versions correctly', () => {
      expect(compareSemVer('1.3.0', '1.2.9')).toBe(1);
      expect(compareSemVer('1.1.5', '1.2.0')).toBe(-1);
    });

    it('compares patch versions correctly', () => {
      expect(compareSemVer('1.0.5', '1.0.4')).toBe(1);
      expect(compareSemVer('1.0.2', '1.0.3')).toBe(-1);
    });

    it('considers equivalent versions equal (return 0)', () => {
      expect(compareSemVer('1.1.0', '1.1.0')).toBe(0);
      expect(compareSemVer('v1.1.0', '1.1.0')).toBe(0);
      expect(compareSemVer('V2.4.1', 'v2.4.1')).toBe(0);
    });

    it('handles prerelease precedence (release > prerelease)', () => {
      // Standard semver rule: 1.0.0 > 1.0.0-beta
      expect(compareSemVer('1.0.0', '1.0.0-beta')).toBe(1);
      expect(compareSemVer('1.0.0-beta', '1.0.0')).toBe(-1);

      // Prerelease alphabetical comparison
      expect(compareSemVer('1.0.0-beta.2', '1.0.0-beta.1')).toBe(1);
      expect(compareSemVer('1.0.0-alpha', '1.0.0-beta')).toBe(-1);
    });

    it('isNewerVersion returns boolean flag', () => {
      expect(isNewerVersion('1.1.0', '1.0.0')).toBe(true);
      expect(isNewerVersion('1.0.0', '1.0.0')).toBe(false);
      expect(isNewerVersion('0.9.9', '1.0.0')).toBe(false);
      expect(isNewerVersion('v2.0.0', '1.9.9')).toBe(true);
    });
  });

  describe('Byte Size Formatter (formatBytes)', () => {
    it('formats various byte sizes accurately', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(512)).toBe('512 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(71824512)).toBe('68.5 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('respects decimal precision parameter', () => {
      expect(formatBytes(1572864, 2)).toBe('1.5 MB');
      expect(formatBytes(71824512, 0)).toBe('68 MB');
      expect(formatBytes(71824512, 2)).toBe('68.5 MB');
    });
  });

  describe('UpdaterService State & Lifecycle', () => {
    let service: UpdaterService;

    beforeEach(() => {
      localStorage.clear();
      service = UpdaterService.getInstance();
      service.setCurrentVersion('1.0.0');
    });

    afterEach(() => {
      service.cancelDownload();
      localStorage.clear();
    });

    it('returns singleton instance', () => {
      const instance1 = UpdaterService.getInstance();
      const instance2 = UpdaterService.getInstance();
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(updaterService);
    });

    it('manages updater preferences with LocalStorage persistence', () => {
      const defaultPrefs = service.getPreferences();
      expect(defaultPrefs.autoCheckOnStartup).toBe(true);
      expect(defaultPrefs.skippedVersion).toBeNull();
      expect(defaultPrefs.preferredAssetType).toBe('installer');

      // Update settings
      service.setAutoCheckOnStartup(false);
      service.setSkippedVersion('1.1.0');
      service.setPreferredAssetType('portable');

      const updatedPrefs = service.getPreferences();
      expect(updatedPrefs.autoCheckOnStartup).toBe(false);
      expect(updatedPrefs.skippedVersion).toBe('1.1.0');
      expect(updatedPrefs.preferredAssetType).toBe('portable');

      // Clear skipped version
      service.setSkippedVersion(null);
      expect(service.getPreferences().skippedVersion).toBeNull();
    });

    it('emits events on status-change and update detection', async () => {
      const statusChanges: string[] = [];
      let detectedUpdate: UpdateReleaseInfo | null = null;

      const unbindStatus = service.on('status-change', (status) => {
        statusChanges.push(status);
      });

      const unbindAvailable = service.on('update-available', (info) => {
        detectedUpdate = info;
      });

      const release = service.simulateCheck();

      expect(statusChanges).toContain('available');
      expect(detectedUpdate).not.toBeNull();
      expect(release.hasUpdate).toBe(true);
      expect(release.latestVersion).toBe('1.1.0');

      unbindStatus();
      unbindAvailable();
    });

    it('suppresses update notifications if remote version is in skippedVersion preference', () => {
      service.setSkippedVersion(MOCK_LATEST_RELEASE.latestVersion);

      const release = service.simulateCheck(); // ignoreSkipped = false
      expect(release.hasUpdate).toBe(false);
      expect(service.getStatus()).toBe('not-available');

      // With ignoreSkipped = true
      const forceRelease = service.simulateCheck(true);
      expect(forceRelease.hasUpdate).toBe(true);
      expect(service.getStatus()).toBe('available');
    });

    it('detects no updates when current version is >= latest version', () => {
      service.setCurrentVersion('1.2.0');
      const release = service.simulateCheck();

      expect(release.hasUpdate).toBe(false);
      expect(service.getStatus()).toBe('not-available');
    });

    it('classifies release assets correctly into installer vs portable', () => {
      const info = service.getLastReleaseInfo();
      expect(info?.installerAsset?.isInstaller).toBe(true);
      expect(info?.portableAsset?.isPortable).toBe(true);
    });

    it('handles simulated download, progress updates, and completion', async () => {
      vi.useFakeTimers();

      const progressSnapshots: DownloadProgress[] = [];
      service.simulateCheck();

      service.on('progress', (prog) => {
        progressSnapshots.push({ ...prog });
      });

      const downloadPromise = service.downloadUpdate('installer');
      expect(service.getStatus()).toBe('downloading');

      // Fast-forward interval ticks
      await vi.advanceTimersByTimeAsync(4000);
      await downloadPromise;

      expect(service.getStatus()).toBe('downloaded');
      expect(service.getProgress()?.percent).toBe(100);
      expect(progressSnapshots.length).toBeGreaterThan(5);
      expect(progressSnapshots[progressSnapshots.length - 1].percent).toBe(100);

      vi.useRealTimers();
    });

    it('allows cancelling ongoing download', async () => {
      service.simulateCheck();
      const downloadPromise = service.downloadUpdate('installer');
      expect(service.getStatus()).toBe('downloading');

      service.cancelDownload();
      expect(service.getStatus()).toBe('available');
      expect(service.getProgress()).toBeNull();
    });
  });
});
