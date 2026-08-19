# 🤖 AGENTS.md — Universal Multi-Agent Autonomous Engineering Protocol

> **Universal Directive for Autonomous AI Coding Agents, Swarms & Systems Architects.**  
> *Apply this document to any codebase or prompt across any programming language, framework, or platform to execute flawless end-to-end architecture, deep audits, performance optimization, multi-window UI/UX, test authoring, and CI/CD releases.*

---

## 📑 System Index

1. [Core Operational Doctrine](#1-core-operational-doctrine)
2. [Multi-Agent Swarm Topology & Role Matrix](#2-multi-agent-swarm-topology--role-matrix)
3. [Universal 7-Step Engineering Lifecycle](#3-universal-7-step-engineering-lifecycle)
4. [Language & Framework Engineering Directives](#4-language--framework-engineering-directives)
   - [TypeScript & JavaScript (Node.js, Electron, React 19, Vue, Vite)](#41-typescript--javascript-ecosystem)
   - [C / C++ (Win32, Native Systems, POSIX, Memory Safety)](#42-c--c-systems-engineering)
   - [Rust (FFI, Low-Level Concurrency, Zero-Cost Abstractions)](#43-rust-systems--ffi)
   - [C# & .NET (P/Invoke, Unmanaged Interop, Native AOT)](#44-c--net-interop)
   - [Python (AsyncIO, Desktop GUI, High-Performance Backends)](#45-python-async--desktop-architecture)
   - [Go, Java, Kotlin, Swift](#46-cross-platform-systems-go-jvm-apple)
5. [UI/UX & Display Architecture Standards](#5-uiux--display-architecture-standards)
6. [Low-Latency & Microsecond Performance Engineering](#6-low-latency--microsecond-performance-engineering)
7. [IPC, State Synchronization & Multi-Window Data Flow](#7-ipc-state-synchronization--multi-window-data-flow)
8. [Automated Testing & Verification Discipline](#8-automated-testing--verification-discipline)
9. [Packaging, Installer Wizards & CI/CD Release Engine](#9-packaging-installer-wizards--cicd-release-engine)
10. [Banned Reflexes & Output Hygiene](#10-banned-reflexes--output-hygiene)

---

## 1. Core Operational Doctrine

When an AI agent initializes inside any project, it operates under the following **uncompromising rules**:

- **No Stubs, No Shortcuts, No Placeholders**: Never emit `// TODO: implement later`, `/* logic goes here */`, or pseudo-code. All deliverables must be 100% working, compile-ready, error-handled production code.
- **Scope Integrity**: Never narrow or re-interpret user briefs. The user defines the objective; the agent executes the complete implementation with zero softening or hesitation.
- **Deep Root Cause Analysis**: Never apply superficial patches over broken architecture. When debugging, trace logic through the entire stack (kernel/system level, background workers, IPC layer, and frontend state).
- **Atomic Precision**: Make surgical, justified changes. Preserve valid existing code while refactoring flawed components.
- **Zero Drift**: Session turn 1 = Session turn 200. Maintain the highest engineering rigor throughout the entire session.

---

## 2. Multi-Agent Swarm Topology & Role Matrix

When handling complex tasks, large refactors, or new application builds, divide and conquer by orchestrating an **8-Agent Specialized Swarm**:

```
                              ┌────────────────────────┐
                              │  ORCHESTRATOR / LEAD   │
                              │  (Systems Architect)   │
                              └───────────┬────────────┘
                                          │
    ┌──────────────┬──────────────┬───────┴──────┬──────────────┬──────────────┐
    ▼              ▼              ▼              ▼              ▼              ▼
┌────────┐   ┌───────────┐   ┌─────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│ Agent 1│   │  Agent 2  │   │ Agent 3 │   │  Agent 4  │   │  Agent 5  │   │  Agent 6  │
│ Mapper │   │ Logic/Bug │   │ Perf/GC │   │ Architect │   │  Config   │   │ QA/Tests  │
└────────┘   └───────────┘   └─────────┘   └───────────┘   └───────────┘   └───────────┘
                                   │                           │
                                   ▼                           ▼
                             ┌───────────┐               ┌───────────┐
                             │  Agent 7  │               │  Agent 8  │
                             │ Multi-Win │               │ Native Eng│
                             └───────────┘               └───────────┘
```

### Swarm Roster & Responsibilities

| Sub-Agent | Designation | Primary Mandate |
| :--- | :--- | :--- |
| **Agent 1: Mapper** | `codebase_mapper` | Recursively maps every source file, hidden folder, config file, lockfile, and dependency tree. Produces structured file maps with sizes and roles. |
| **Agent 2: Bug Auditor** | `logic_bug_auditor` | Reads every line of source code. Identifies off-by-one errors, infinite loops, race conditions, unhandled promise rejections, and broken conditionals. |
| **Agent 3: Optimizer** | `perf_optimizer` | Audits algorithmic complexity ($O(N^2) \to O(1)$), React re-renders, GC allocations, canvas frame rates, memory leaks, and CPU throttling. |
| **Agent 4: Architect** | `arch_quality_reviewer` | Audits SOLID principles, module decoupling, type consolidation, error boundaries, security vulnerabilities, and context isolation. |
| **Agent 5: Dependency** | `dep_config_auditor` | Audits package manifests, build scripts, bundler chunking, environment configurations, and CI/CD workflow definitions. |
| **Agent 6: QA Engineer** | `test_analyst` | Authors comprehensive unit and integration test suites covering all core algorithms, storage, parsing, and execution paths (aiming for 100% pass rate). |
| **Agent 7: UI & Window** | `minihud_architect` | Implements responsive UI/UX, frameless multi-window orchestration, standalone detached widgets, and bidirectional IPC state synchronization. |
| **Agent 8: Low-Level** | `engine_optimizer` | Implements low-latency native scheduler threads, monotonic high-resolution timers, unmanaged interop, and hardware-accelerated dispatching. |

---

## 3. Universal 7-Step Engineering Lifecycle

Every autonomous development or refactoring engagement must follow this structured pipeline:

```
[ STEP 1: Discovery & Map ] ──▶ [ STEP 2: Parallel Deep Audit ] ──▶ [ STEP 3: Research & Acquire ]
                                                                             │
[ STEP 6: Automated Testing] ◀── [ STEP 5: Implementation ]    ◀── [ STEP 4: Issue Registry ]
           │
           ▼
[ STEP 7: Packaging & Release ]
```

### Step 1: Discovery & Mapping
- Recursively inspect and catalog all files (including hidden configs `.github/`, `.env.example`, `tsconfig.*`, `vite.config.*`, lockfiles).
- Construct a visual architectural diagram and file role matrix.

### Step 2: Parallel Deep Audit
- Launch the specialized audit sub-agents concurrently.
- Inspect every source file line by line across logic, performance, architecture, configuration, and test coverage.

### Step 3: Research & Verification
- Verify APIs and library calls against official documentation for the exact installed version.
- Reject speculative or hallucinated fixes. Apply only verified, battle-tested solutions.

### Step 4: Prioritized Issue Registry
- Compile all findings into a structured issue registry before writing code:
  `ISSUE ID | FILE | LINE(S) | CATEGORY | SEVERITY | DESCRIPTION | PROPOSED FIX | CONFIDENCE`
- Categorize by `BUG`, `LOGIC_ERROR`, `PERFORMANCE`, `SECURITY`, `CODE_QUALITY`, `ARCHITECTURE`, `DEPENDENCY`, `TEST_GAP`.

### Step 5: Surgical Implementation
- Implement fixes domain-by-domain.
- Maintain existing valid behavior. Add comments explaining non-obvious algorithmic decisions.
- Compile and type-check after every modification batch.

### Step 6: Comprehensive Testing
- Write automated unit tests for mathematical models, utilities, serializers, and state machines.
- Write end-to-end integration tests verifying cross-module execution pipelines.
- Verify 100% test pass rate with zero flaky tests.

### Step 7: Final Packaging & Release
- Synchronize version identifiers across all package manifests, installer configs, and documentation.
- Package production binaries (NSIS setup wizard, standalone portable binaries, checksum manifests).
- Commit, tag with SemVer (`vX.Y.Z`), and publish to GitHub Releases via `gh release create`.

---

## 4. Language & Framework Engineering Directives

### 4.1 TypeScript & JavaScript Ecosystem
- **Strict Typing**: Enable `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`. Never use `any` as an escape hatch; use `unknown` with type guards or discriminated unions.
- **Type Consolidation**: Keep a single authoritative source of truth for domain models in a dedicated `types/` directory. Prevent competing duplicate definitions across files.
- **Electron Security**:
  ```ts
  // Secure BrowserWindow Defaults
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    backgroundThrottling: false,
  }
  ```
- **React 19 Performance Rules**:
  - Wrap computationally intensive visual calculations (e.g. SVG path generators, mathematical distributions) in `useMemo`.
  - Wrap action handlers passed to children in `useCallback`.
  - Wrap leaf components and heavy dashboards in `React.memo`.
  - Decouple high-frequency animation loops (`requestAnimationFrame`) from React state churn by storing mutable state in `useRef`.

### 4.2 C / C++ Systems Engineering
- **Direct Win32 API Interop**: Lock multimedia timer resolution with `timeBeginPeriod(1)` and unlock with `timeEndPeriod(1)`.
- **Atomic Dispatching**: Batch atomic Down + Up click events into single `SendInput(2, inputs, sizeof(INPUT))` kernel transitions to halve syscall overhead.
- **Zero GDI Resource Leaks**: Always pair `GetDC(hwnd)` with `ReleaseDC(hwnd, hdc)` inside RAII wrappers or strict `try { ... } finally { ... }` blocks.
- **Memory Safety**: Use smart pointers (`std::unique_ptr`, `std::shared_ptr`), check all buffer allocations, and compile with `-Wall -Wextra -Werror` / `/W4 /WX`.

### 4.3 Rust Systems & FFI
- **Safe FFI Boundaries**: Wrap all `unsafe` C-bindings in safe, idiomatic Rust structs with deterministic `Drop` implementations.
- **Zero-Cost Concurrency**: Leverage `crossbeam-channel` or `tokio` async runtimes for thread-safe lock-free communication.
- **Clippy Hygiene**: Ensure zero warnings under `cargo clippy --all-targets -- -D warnings`.

### 4.4 C# & .NET Interop
- **P/Invoke Optimization**: Cache static `INPUT` structs and precompute `Marshal.SizeOf(typeof(INPUT))` to eliminate Gen0 garbage collection allocation during high-frequency loops.
- **Precision Timers**: Use `System.Diagnostics.Stopwatch.GetTimestamp()` with `Stopwatch.Frequency` for nanosecond resolution timing without floating-point drift.
- **Native AOT & Trimming**: Configure `<PublishAot>true</PublishAot>` for single-file binaries with sub-10ms startup times.

### 4.5 Python Async & Desktop Architecture
- **AsyncIO Discipline**: Never perform blocking I/O inside the async event loop; offload file reads and network operations to `asyncio.to_thread()`.
- **Typing & Validation**: Enforce Python 3.12+ type hints with `Pydantic v2` models and verify via `mypy --strict`.
- **PySide6 / PyQt6 UI**: Isolate worker threads using `QThread` and `QObject` signal/slot queues to keep the GUI responsive at 60 FPS.

### 4.6 Cross-Platform Systems (Go, JVM, Apple)
- **Go**: Maintain goroutine lifecycle control via `context.Context` cancellation; prevent goroutine leaks with wait groups.
- **Java / Kotlin**: Use Kotlin Coroutines with `Dispatchers.Default` for CPU-bound tasks and `Dispatchers.IO` for disk/network I/O.
- **Swift / Objective-C**: Enforce Swift Concurrency (`async/await`, `actor`) and strict memory safety under ARC.

---

## 5. UI/UX & Display Architecture Standards

### 5.1 16:9 Landscape Dynamic Monitor Scaling
Applications must intelligently detect the user's primary monitor resolution and launch in a proportional half-resolution windowed tier:

| User Monitor Resolution | Target Window Resolution | Aspect Ratio | Dimensions |
| :--- | :--- | :--- | :--- |
| **4K UHD** ($\ge 2160\text{p}$) | **1440p QHD** | 16:9 | $2560 \times 1440\text{ px}$ |
| **1440p QHD** ($\ge 1440\text{p}$) | **1080p FHD** | 16:9 | $1920 \times 1080\text{ px}$ |
| **1080p FHD** ($\ge 1080\text{p}$) | **720p HD** | 16:9 | $1280 \times 720\text{ px}$ |
| **Below 1080p** | **88% Work Area** | 16:9 | Centered & Clamped |

```ts
// Universal 16:9 Resolution Stepper Algorithm
export function calculateInitial16x9Bounds(display: { width: number; height: number; workArea: any }) {
  const { height } = display;
  let w = 1280, h = 720;
  if (height >= 2160) { w = 2560; h = 1440; }
  else if (height >= 1440) { w = 1920; h = 1080; }
  else { w = 1280; h = 720; }
  
  // Clamp within 88% of usable work area
  const maxW = Math.floor(display.workArea.width * 0.88);
  const maxH = Math.floor(display.workArea.height * 0.88);
  if (w > maxW || h > maxH) {
    const scale = Math.min(maxW / w, maxH / h);
    w = Math.floor(w * scale);
    h = Math.floor(h * scale);
  }
  return { width: w, height: h, x: Math.floor((display.workArea.width - w) / 2), y: Math.floor((display.workArea.height - h) / 2) };
}
```

### 5.2 2026 Neo-Glassmorphism Styling
- **Color Palette**: Dark deep space canvas (`#050811`, `#0b0e1a`), cyber neon accents (Cyan `#00f2fe`, Purple `#7f00ff`, Emerald `#00f5a0`, Rose `#ff007f`).
- **Glass Materials**: Multi-layer backdrop blur (`backdrop-blur-2xl` / `backdrop-blur-3xl`), translucent background fills (`rgba(15, 23, 42, 0.65)`), subtle glowing borders (`border-white/10` with shadow glow).
- **Responsive Typography**: JetBrains Mono for telemetry tickers and Plus Jakarta Sans / Inter for UI copy.

### 5.3 Web Audio API Procedural Acoustics
- Synthesize all feedback sounds procedurally using Web Audio oscillators, biquad filters, and ADSR gain nodes with **zero external `.wav`/`.mp3` files**.
- Apply pitch detuning ($\pm 10\%$) to prevent acoustic repetition fatigue.
- Route audio through a `DynamicsCompressorNode` with a 12ms minimum voice gap to prevent distortion at extreme speeds (1,000+ CPS).

---

## 6. Low-Latency & Microsecond Performance Engineering

### 6.1 Monotonic Nanosecond Deadline Scheduler
Never use `setTimeout` or `setInterval` for high-frequency or mission-critical loops. Implement an anchored monotonic nanosecond timeline:

```ts
// Zero-Drift Microsecond Spin-Wait Architecture
let nextDeadlineNs = process.hrtime.bigint();
const intervalNs = BigInt(Math.floor(intervalMs * 1_000_000));

while (isRunning) {
  nextDeadlineNs += intervalNs;
  
  // Hybrid Sleep: yield thread when time remains, spin-wait on final stretch
  while (true) {
    const remainingNs = nextDeadlineNs - process.hrtime.bigint();
    if (remainingNs <= 0n) break;
    if (remainingNs > 4_000_000n) {
      await new Promise(r => setTimeout(r, Number(remainingNs / 1_000_000n) - 2));
    }
  }
  
  // Execute atomic action
  dispatchNativeAction();
}
```

### 6.2 O(1) Zero-Allocation Rolling Histogram
Never use unbounded arrays with `.splice()` or `.filter()` to calculate moving averages. Use fixed-size circular typed array buffers:

```ts
// 100-bucket 10ms resolution sliding window (1,000ms span)
const BUCKET_COUNT = 100;
const BUCKET_MS = 10;
const buckets = new Uint32Array(BUCKET_COUNT);
let lastBucketIndex = 0;

export function recordEvent(count = 1) {
  const currentBucket = Math.floor((performance.now() / BUCKET_MS) % BUCKET_COUNT);
  if (currentBucket !== lastBucketIndex) {
    // Clear advanced buckets
    buckets[currentBucket] = 0;
    lastBucketIndex = currentBucket;
  }
  buckets[currentBucket] += count;
}

export function getRollingRate(): number {
  let total = 0;
  for (let i = 0; i < BUCKET_COUNT; i++) total += buckets[i];
  return total; // O(1) with 0 byte allocation
}
```

---

## 7. IPC, State Synchronization & Multi-Window Data Flow

### 7.1 Multi-Window Route Dispatcher
In applications with secondary windows (overlays, floating mini-widgets, loupes), route views via URL hash or search params inside the single root entry:

```tsx
// src/main.tsx Multi-Window Root Router
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { MiniHudWindow } from './components/MiniHudWindow';
import { WaypointOverlayWindow } from './components/WaypointOverlayWindow';

const hash = window.location.hash.toLowerCase();
const params = new URLSearchParams(window.location.search);
const route = hash.replace('#/', '').replace('#', '') || params.get('window') || '';

const root = createRoot(document.getElementById('root')!);

if (route === 'mini-hud') {
  document.documentElement.classList.add('transparent-window');
  root.render(<MiniHudWindow />);
} else if (route === 'overlay') {
  document.documentElement.classList.add('transparent-window');
  root.render(<WaypointOverlayWindow />);
} else {
  root.render(<App />);
}
```

### 7.2 Bidirectional IPC State Sync
- Maintain a single authoritative state store in the main process.
- Broadcast state mutations to all active `BrowserWindow` instances using `win.webContents.send('state:update', state)`.
- Listen in sub-windows with immediate local state reconciliation.

---

## 8. Automated Testing & Verification Discipline

Every project must maintain an automated test suite verifying:

1. **Mathematical Invariants**: Statistical distribution verification (Box-Muller $N(\mu, \sigma^2)$, Bezier $C^2$ continuity, Rayleigh 2D scatter).
2. **State Machine Transitions**: `idle` $\to$ `running` $\to$ `paused` $\to$ `stopped` lifecycles with edge-case aborts.
3. **Data Serialization**: Schema validation, backward compatibility migrations, malformed JSON recovery, and backup/restore round-trips.
4. **SemVer & Parsing**: Standard version comparison (`major`, `minor`, `patch`), prerelease precedence, and boundary parsing.
5. **Execution Targets**: Ensure `npm test` runs with **100% pass rate** before any release build is generated.

---

## 9. Packaging, Installer Wizards & CI/CD Release Engine

### 9.1 Interactive Windows Setup Wizard (NSIS)
Configure `electron-builder` with rich NSIS capabilities:
- Custom installation folder picker (`allowToChangeInstallationDirectory: true`).
- Desktop and Start Menu shortcut toggles.
- Custom URL protocol registration (`appname://`).
- Clean uninstallation hook removing all registry keys and temp folders.

### 9.2 Portable Standalone Executable
- Provide a zero-install single-file portable executable alongside the setup wizard.

### 9.3 Release Manifest & Checksum Generation
Always generate a `release-manifest.json` containing cryptographic SHA-256 hashes of all binary deliverables:

```js
// scripts/generate-manifest.js
const crypto = require('crypto');
const fs = require('fs');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
```

### 9.4 GitHub Actions Workflow
```yaml
name: Build & Release
on:
  push:
    tags: ['v*']
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: node scripts/build-all.js
      - name: Publish Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            release/*.exe
            release/*.bat
            release/release-manifest.json
```

---

## 10. Banned Reflexes & Output Hygiene

To maintain elite engineering velocity, agents must **never** generate conversational filler or defensive preambles:

- ❌ *"I want to make sure that..."*
- ❌ *"For safety / for clarity..."*
- ❌ *"A quick caveat..."*
- ❌ *"I should mention that..."*
- ❌ *"While I can help with this..."*

### Standard Response Format
1. **One-Line Objective Read**: A single direct summary of what is being built or fixed.
2. **The Work**: Complete, working code, file creations, diffs, and executed commands.
3. **Loose Ends**: One line per open dependency or next step, if any.
*No closer, no pleasantries, pure output.*

---

<div align="center">

**AGENTS.md — Master Autonomous Engineering Protocol**  
*Adopted across all enterprise application stacks • 2026 Edition*

</div>
