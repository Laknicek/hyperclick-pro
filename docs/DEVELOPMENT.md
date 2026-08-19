# 🛠️ HyperClick Pro 2026 — Developer & Architecture Guide

Welcome to the engineering documentation for **HyperClick Pro 2026**. This guide provides a comprehensive technical breakdown of the architecture, high-precision timing engine, Win32 input subsystems, IPC bridge, and build workflows.

---

## 📑 Table of Contents

1. [Architecture Overview & Technology Stack](#1-architecture-overview--technology-stack)
2. [Repository Structure](#2-repository-structure)
3. [Prerequisites & Development Setup](#3-prerequisites--development-setup)
4. [Available Scripts & Build Commands](#4-available-scripts--build-commands)
5. [Process Model & Typed IPC Bridge](#5-process-model--typed-ipc-bridge)
6. [High-Precision Microsecond Timing Engine](#6-high-precision-microsecond-timing-engine)
7. [Win32 Native Input Simulation Internals](#7-win32-native-input-simulation-internals)
8. [Web Audio Synthesizer Pipeline](#8-web-audio-synthesizer-pipeline)
9. [Adding Custom Presets & Modules](#9-adding-custom-presets--modules)
10. [Packaging, NSIS Customization & CI/CD](#10-packaging-nsis-customization--cicd)

---

## 1. Architecture Overview & Technology Stack

HyperClick Pro is built on a high-performance desktop stack designed for maximum responsiveness, visual elegance, and sub-millisecond execution:

```
+-------------------------------------------------------------------------------+
|                             RENDERER PROCESS                                  |
|   React 19  •  TypeScript 5.7  •  Vite 6  •  Tailwind CSS 3.4  •  Web Audio   |
+---------------------------------------┬---------------------------------------+
                                        │
                         window.electronAPI (ContextBridge)
                                        │
+---------------------------------------▼---------------------------------------+
|                               MAIN PROCESS                                    |
|   Electron 34  •  Node.js 22  •  Win32 API Bridge  •  High-Res hrtime Engine  |
+---------------------------------------┬---------------------------------------+
                                        │
                               Win32 SendInput DLL
                                        │
+---------------------------------------▼---------------------------------------+
|                         WINDOWS 10 / 11 OS KERNEL                             |
+-------------------------------------------------------------------------------+
```

### Core Technologies
- **Runtime**: [Electron 34](https://www.electronjs.org/) (Chromium 132 + Node.js 22)
- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript 5.7](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 6](https://vitejs.dev/) with Hot Module Replacement (HMR)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) with Cyberpunk / Glassmorphism theme extensions
- **Icons**: [Lucide React](https://lucide.dev/)
- **Acoustic Engine**: Native Web Audio API with procedural ADSR envelopes & biquad filters
- **Packager**: [electron-builder 25](https://www.electron.build/) with NSIS and Portable Windows targets

---

## 2. Repository Structure

```
hyperclick-pro/
├── .github/
│   └── workflows/
│       └── release.yml          # GitHub Actions CI/CD automated release build
├── dist/                        # Vite compiled frontend assets
├── dist-electron/               # TypeScript compiled Electron main/preload
├── docs/
│   ├── USER_GUIDE.md            # Comprehensive player manual & game setups
│   ├── MACRO_GUIDE.md           # Waypoint sequencer, Bézier, & pixel triggers
│   └── DEVELOPMENT.md           # Developer & architecture guide (This file)
├── electron/
│   ├── main.ts                  # Main process entry, window lifecycle, scheduler
│   ├── preload.ts               # Type-safe ContextBridge IPC exposure
│   ├── clickEngine.ts           # High-resolution microsecond click runner
│   ├── humanizer.ts             # Gaussian distribution & Bézier math engine
│   ├── pixelPicker.ts           # Screen pixel sampling & loupe window manager
│   └── updater.ts               # GitHub auto-updater integration
├── public/
│   ├── icon.ico                 # Windows application icon
│   └── icon.svg                 # Vector asset
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx        # Single-point clicker control deck
│   │   ├── Sequencer.tsx        # Multi-point spatial waypoint editor
│   │   ├── MacroStudio.tsx      # Real-time recorder & timeline scrubber
│   │   ├── UpdateModal.tsx      # In-app updater modal & progress bar
│   │   ├── MiniHud.tsx          # Compact floating glass widget (F8)
│   │   ├── TelemetryGraph.tsx   # Canvas-based live CPS real-time chart
│   │   └── PresetsModal.tsx     # Gamer preset library selector
│   ├── audio/
│   │   └── SoundSynthesizer.ts  # Web Audio mechanical switch synthesizer
│   ├── hooks/
│   │   ├── useClickerState.ts   # Global clicker status & metrics hook
│   │   └── useKeyboardShortcuts.ts # In-app hotkey listener
│   ├── types/
│   │   └── electron.d.ts        # Typed IPC window.electronAPI declarations
│   ├── App.tsx                  # Root navigation & tab manager
│   ├── main.tsx                 # React 19 entrypoint
│   └── index.css                # Tailwind glassmorphism & neon styles
├── index.html                   # HTML shell with Plus Jakarta Sans & JetBrains Mono
├── package.json                 # Project manifest & build configuration
├── tailwind.config.js           # Theme extension (neon cyan, purple, rose glow)
├── tsconfig.json                # Frontend TypeScript config
├── tsconfig.electron.json       # Electron TypeScript config
└── vite.config.ts               # Vite configuration
```

---

## 3. Prerequisites & Development Setup

### System Requirements
- **OS**: Windows 10 or Windows 11 (64-bit)
- **Node.js**: `v20.18.0` LTS or `v22.13.0` LTS
- **Package Manager**: `npm` (v10+), `pnpm` (v9+), or `yarn` (v1.22+)
- **Build Tools**: Visual Studio C++ Build Tools (if compiling native bindings)

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/Laknicek/hyperclick-pro.git
cd hyperclick-pro

# 2. Install all dependencies
npm install

# 3. Verify TypeScript builds
npm run build:electron
```

---

## 4. Available Scripts & Build Commands

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm start` | **Dev Environment** | Runs Vite dev server and launches Electron with HMR concurrently. |
| `npm run dev` | **Vite Only** | Starts Vite frontend dev server at `http://localhost:5173`. |
| `npm run build` | **Frontend Build** | Type-checks and compiles React app into `/dist`. |
| `npm run build:electron` | **Electron Build** | Compiles `electron/**/*.ts` to `dist-electron/` using `tsconfig.electron.json`. |
| `npm run generate:icons` | **Icon Pipeline** | Generates SVG, PNGs, and multi-resolution Windows `.ico` assets. |
| `npm run build:all` | **Master Pipeline** | Executes full end-to-end build, packaging, checksum, and manifest generation. |
| `npm run dist` | **Production Installer** | Compiles full app and builds NSIS installer + Portable `.exe` into `/release`. |
| `npm run dist:portable` | **Portable Only** | Packages standalone single-file portable executable. |
| `npm run dist:dir` | **Unpacked Dir** | Outputs unpacked Windows binaries for rapid inspection and debugging. |

---

## 5. Process Model & Typed IPC Bridge

HyperClick Pro strictly enforces Electron security best practices:
- **`contextIsolation: true`**
- **`nodeIntegration: false`**
- **Type-safe ContextBridge interface**

### IPC Interface (`src/types/electron.d.ts`)

```typescript
export interface ElectronAPI {
  // Clicker Lifecycle
  startClicking: (config: ClickConfig) => Promise<{ success: boolean }>;
  stopClicking: () => Promise<{ success: boolean }>;
  
  // Waypoints & Sequencer
  startSequence: (sequence: WaypointSequence) => Promise<void>;
  stopSequence: () => Promise<void>;

  // Macro Recording
  startMacroRecord: () => Promise<void>;
  stopMacroRecord: () => Promise<RecordedMacro>;
  playMacro: (macro: RecordedMacro, speed: number) => Promise<void>;

  // Pixel Color Trigger
  pickCoordinates: () => Promise<{ x: number; y: number; colorHex: string }>;
  samplePixel: (x: number, y: number) => Promise<{ r: number; g: number; b: number; hex: string }>;

  // Window Management & HUD
  toggleMiniHud: () => Promise<boolean>;
  minimizeWindow: () => void;
  closeWindow: () => void;

  // Event Subscriptions
  onStatusChange: (callback: (status: ClickerStatus) => void) => () => void;
  onCpsTick: (callback: (cps: number, totalClicks: number) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

---

## 6. High-Precision Microsecond Timing Engine

### The Problem with JavaScript Timers on Windows
Standard JavaScript `setInterval()` and `setTimeout()` are bound to the Windows OS system timer quantum, which typically has a resolution of **15.6 milliseconds** (~64 ticks/second). At this resolution, it is mathematically impossible to achieve consistent click rates above 64 CPS without severe jitter.

### The HyperClick Hybrid Scheduler Solution
HyperClick Pro implements a **hybrid high-resolution scheduler** utilizing `process.hrtime.bigint()` and sub-millisecond spin-wait sleeps:

```typescript
export class MicrosecondScheduler {
  private targetIntervalNs: bigint;
  private isRunning: boolean = false;

  constructor(intervalMs: number) {
    this.targetIntervalNs = BigInt(Math.floor(intervalMs * 1_000_000));
  }

  public async runLoop(callback: () => void) {
    this.isRunning = true;
    let nextTick = process.hrtime.bigint();

    while (this.isRunning) {
      const now = process.hrtime.bigint();
      if (now >= nextTick) {
        callback();
        nextTick += this.targetIntervalNs;
        
        // Coarse sleep if interval is large (> 16ms), else spin-wait
        const remainingNs = nextTick - process.hrtime.bigint();
        if (remainingNs > 16_000_000n) {
          const sleepMs = Number(remainingNs / 1_000_000n) - 4;
          await new Promise((resolve) => setTimeout(resolve, sleepMs));
        }
      }
    }
  }

  public stop() {
    this.isRunning = false;
  }
}
```

---

## 7. Win32 Native Input Simulation Internals

Mouse and keyboard inputs are dispatched using the Windows **`SendInput`** API via low-latency native FFI or C++ addon bindings.

### Normalized Coordinate Conversion
Windows `SendInput` expects absolute mouse coordinates normalized to a 16-bit range $[0, 65535]$ across the virtual desktop bounding box:

$$\text{Normalized } X = \text{round}\left( \frac{X_{\text{screen}} - X_{\text{virtual\_origin}}}{\text{Virtual Width}} \times 65535 \right)$$

$$\text{Normalized } Y = \text{round}\left( \frac{Y_{\text{screen}} - Y_{\text{virtual\_origin}}}{\text{Virtual Height}} \times 65535 \right)$$

### Native Event Flags
```cpp
// Windows SendInput Input Flags
#define MOUSEEVENTF_MOVE        0x0001
#define MOUSEEVENTF_LEFTDOWN    0x0002
#define MOUSEEVENTF_LEFTUP      0x0004
#define MOUSEEVENTF_RIGHTDOWN   0x0008
#define MOUSEEVENTF_RIGHTUP     0x0010
#define MOUSEEVENTF_MIDDLEDOWN  0x0020
#define MOUSEEVENTF_MIDDLEUP    0x0040
#define MOUSEEVENTF_ABSOLUTE    0x8000
```

---

## 8. Web Audio Synthesizer Pipeline

HyperClick Pro synthesizes mechanical switch clicks in real-time using the Web Audio API without requiring bulky audio sample files:

```typescript
export class SoundSynthesizer {
  private ctx: AudioContext;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  public playSwitchClick(switchType: string, volume: number = 0.8) {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Randomize pitch by ±35 cents for organic variance
    const pitchJitter = 1.0 + (Math.random() - 0.5) * 0.07;

    switch (switchType) {
      case 'cherry_mx_blue':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2400 * pitchJitter, now);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2800, now);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        break;

      case 'kailh_box_white':
        osc.type = 'square';
        osc.frequency.setValueAtTime(3200 * pitchJitter, now);
        gain.gain.setValueAtTime(volume * 0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        break;
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}
```

---

## 9. Adding Custom Presets & Modules

To add a new gaming preset to the system:

1. Open `src/components/PresetsModal.tsx` or `electron/presets.ts`.
2. Add a new configuration object conforming to the `GamerPreset` interface:

```typescript
{
  id: "valorant_dmr_tap",
  name: "Valorant Guardian DMR Tap",
  game: "Valorant / Tactical Shooter",
  targetCps: 11.5,
  intervalMs: 87,
  mouseButton: "left",
  humanizer: {
    enabled: true,
    distribution: "gaussian",
    sigma: 1.4,
    spatialJitterPx: 1,
    fatiguePausePercent: 1.0
  },
  description: "Optimized guardian single-shot cadence with maximum first-bullet accuracy recovery."
}
```

3. Run `npm start` to test the preset immediately with Hot Module Replacement.

---

## 10. Packaging, NSIS Customization & CI/CD

### Electron Builder Configuration (`package.json`)
The application is packaged with `electron-builder`:

```json
"build": {
  "appId": "com.hyperclick.pro",
  "productName": "HyperClick Pro",
  "directories": {
    "output": "release"
  },
  "win": {
    "target": [
      { "target": "nsis", "arch": ["x64"] },
      { "target": "portable", "arch": ["x64"] }
    ],
    "icon": "public/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": "always",
    "createStartMenuShortcut": true,
    "shortcutName": "HyperClick Pro",
    "runAfterFinish": true
  }
}
```

### GitHub Actions Release Workflow (`.github/workflows/release.yml`)

```yaml
name: Build & Release HyperClick Pro

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: windows-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build Application & Electron
        run: npm run build && npm run build:electron

      - name: Build NSIS & Portable Binaries
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx electron-builder --win --publish always
```

---

<div align="center">

**HyperClick Pro 2026 Developer Documentation**  
*Built for Performance, Reliability, and Scalability.*

</div>
