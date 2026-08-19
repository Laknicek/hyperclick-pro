/**
 * Comprehensive Integration Tests:
 * Full Pipeline Integration:
 * 1. StorageService profile creation with customized Box-Muller humanizer configuration
 * 2. MacroEngine execution of multi-point waypoint sequence with Bezier curves & jitter math
 * 3. Procedural SoundEngine acoustic triggering across macro steps
 * 4. Exporting profile bundle, clearing storage, and re-importing with schema validation & recovery
 * 5. UpdaterService SemVer comparison and remote release simulation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storageService } from '../../src/services/storageService';
import { MacroEngine } from '../../src/services/macroEngine';
import { soundEngine } from '../../src/services/soundEngine';
import { updaterService } from '../../src/services/updaterService';
import { MacroSequence, Waypoint } from '../../src/types/clicker';

// Mock Web Audio API
class MockAudioContext {
  public state = 'running';
  public currentTime = 10.0;
  public sampleRate = 44100;
  public destination = { connect: vi.fn(), disconnect: vi.fn() };
  public resume = vi.fn().mockResolvedValue(undefined);
  public createGain = vi.fn(() => ({
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  public createOscillator = vi.fn(() => ({
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    type: 'sine',
    start: vi.fn(),
    stop: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  public createBiquadFilter = vi.fn(() => ({
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    Q: { setValueAtTime: vi.fn() },
    type: 'bandpass',
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  public createDynamicsCompressor = vi.fn(() => ({
    threshold: { setValueAtTime: vi.fn() },
    knee: { setValueAtTime: vi.fn() },
    ratio: { setValueAtTime: vi.fn() },
    attack: { setValueAtTime: vi.fn() },
    release: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  public createAnalyser = vi.fn(() => ({
    fftSize: 256,
    smoothingTimeConstant: 0.6,
    getByteFrequencyData: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  public createBuffer = vi.fn((channels, length) => ({
    getChannelData: () => new Float32Array(length),
  }));
  public createBufferSource = vi.fn(() => ({
    buffer: null,
    start: vi.fn(),
    stop: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
}

describe('End-to-End System Integration Pipeline', () => {
  beforeEach(() => {
    localStorage.clear();
    (window as any).AudioContext = MockAudioContext;
    (window as any).webkitAudioContext = MockAudioContext;
  });

  afterEach(async () => {
    await MacroEngine.getInstance().stop();
    localStorage.clear();
  });

  it('runs complete lifecycle: profile config -> macro execution -> audio feedback -> backup export/import', async () => {
    // 1. Setup Profile with advanced Gaussian humanizer
    const customProfile = storageService.createProfile({
      name: 'Integration PVP Beast',
      category: 'gaming',
      cps: 18,
      intervalMs: 55,
      humanizer: {
        enabled: true,
        algorithm: 'gaussian',
        jitterMs: 6,
        fatigueFactor: 0.15,
        microPauses: false,
        microPauseProbability: 0.05,
        microPauseMinMs: 50,
        microPauseMaxMs: 150,
        cursorJitter: true,
        cursorJitterRadiusPx: 2.5,
      },
    });

    expect(storageService.getCustomProfiles()).toHaveLength(1);
    storageService.setActiveProfile(customProfile.id);
    expect(storageService.getActiveProfile().id).toBe(customProfile.id);

    // 2. Setup Audio Engine for Cherry MX Blue soundscape
    soundEngine.setProfile('cherry-mx-blue');
    soundEngine.setMasterVolume(0.85);
    const audioSpy = vi.spyOn(soundEngine, 'playClick');

    // 3. Define and run Multi-point Macro Sequence
    const macroEngine = MacroEngine.getInstance();
    const waypointsExecuted: string[] = [];
    const positionsTraversed: { x: number; y: number }[] = [];

    const unbindListeners = macroEngine.addListener({
      onWaypointStart: (wp) => {
        waypointsExecuted.push(wp.id);
      },
      onPathMove: (pt) => {
        positionsTraversed.push({ x: pt.x, y: pt.y });
      },
      onActionExecuted: () => {
        soundEngine.playClick();
      },
    });

    const testWaypoints: Waypoint[] = [
      {
        id: 'wp_integration_1',
        name: 'Inventory Slot 1',
        x: 400,
        y: 300,
        actionType: 'click',
        clickType: 'single',
        mouseButton: 'left',
        delayBeforeMs: 10,
        delayAfterMs: 10,
        jitterRadius: 3,
        holdDurationMs: 10,
        loopRepeat: 1,
        enabled: true,
      },
      {
        id: 'wp_integration_2',
        name: 'Inventory Slot 2',
        x: 700,
        y: 500,
        actionType: 'click',
        clickType: 'single',
        mouseButton: 'right',
        delayBeforeMs: 10,
        delayAfterMs: 10,
        jitterRadius: 4,
        holdDurationMs: 10,
        loopRepeat: 1,
        enabled: true,
      },
    ];

    const sequence: MacroSequence = {
      id: 'seq_integration',
      name: 'Integration Sequence',
      description: 'End-to-end integration test run',
      waypoints: testWaypoints,
      loopCount: 1,
      traversalMode: 'ordered',
      humanizePaths: true,
      speedMultiplier: 15.0, // fast speed for test execution
      bezierSmoothness: 0.7,
    };

    await macroEngine.start(sequence);

    // Verify macro and path execution
    expect(waypointsExecuted).toEqual(['wp_integration_1', 'wp_integration_2']);
    expect(positionsTraversed.length).toBeGreaterThan(5);
    expect(audioSpy).toHaveBeenCalled();

    unbindListeners();

    // 4. Export Profile Bundle & Restore Backup
    const backupJson = storageService.exportFullBackup();
    expect(backupJson).toContain('Integration PVP Beast');

    // Wipe storage
    storageService.resetAllToFactoryDefaults();
    expect(storageService.getCustomProfiles()).toHaveLength(0);

    // Restore from backup
    const restoreResult = storageService.restoreFullBackup(backupJson);
    expect(restoreResult.success).toBe(true);
    expect(storageService.getCustomProfiles()).toHaveLength(1);
    expect(storageService.getCustomProfiles()[0].name).toBe('Integration PVP Beast');

    // 5. Updater verification
    updaterService.setCurrentVersion('1.0.0');
    const updateCheck = updaterService.simulateCheck();
    expect(updateCheck.hasUpdate).toBe(true);
    expect(updateCheck.latestVersion).toBe('1.1.0');
  });
});
