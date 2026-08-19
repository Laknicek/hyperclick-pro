# 🎛️ HyperClick Pro 2026 — Macro & Sequencer Guide

The **HyperClick Pro 2026 Macro Engine** combines spatial multi-point waypoint navigation, Bézier curve trajectory interpolation, real-time input recording, and intelligent pixel-color screen triggers into a unified automation studio.

---

## 📑 Table of Contents

1. [Overview & Macro Engine Architecture](#1-overview--macro-engine-architecture)
2. [Multi-Point Waypoint Sequencer](#2-multi-point-waypoint-sequencer)
   - [Node Properties & Action Types](#21-node-properties--action-types)
   - [Bézier Trajectory Smoothing & Velocity Curves](#22-b%C3%A9zier-trajectory-smoothing--velocity-curves)
   - [Loop Timers & Inter-Cycle Jitter](#23-loop-timers--inter-cycle-jitter)
3. [Real-Time Input Recorder & Timeline Editor](#3-real-time-input-recorder--timeline-editor)
   - [Recording Keystrokes & Mouse Movement](#31-recording-keystrokes--mouse-movement)
   - [Timeline Event Trimming & Fine-Tuning](#32-timeline-event-trimming--fine-tuning)
   - [Playback Multiplier (0.1x – 10.0x)](#33-playback-multiplier-01x--100x)
4. [Pixel Color Trigger Engine](#4-pixel-color-trigger-engine)
   - [Screen Sampling & Delta Tolerance ($\Delta E$)](#41-screen-sampling--delta-tolerance-%CE%94e)
   - [Trigger Actions & Conditions](#42-trigger-actions--conditions)
5. [Practical Step-by-Step Automation Tutorials](#5-practical-step-by-step-automation-tutorials)
   - [Tutorial 1: Minecraft Auto-Fishing Bot](#51-tutorial-1-minecraft-auto-fishing-bot)
   - [Tutorial 2: MMORPG Auto-Health Potion Monitor](#52-tutorial-2-mmorpg-auto-health-potion-monitor)
   - [Tutorial 3: Human Benchmark Instant Reaction Bot](#53-tutorial-3-human-benchmark-instant-reaction-bot)
6. [JSON Macro File Format Specification (`.hcm` / `.json`)](#6-json-macro-file-format-specification-hcm--json)

---

## 1. Overview & Macro Engine Architecture

HyperClick Pro's macro runtime operates on a deterministic event queue with sub-millisecond scheduling:

```
+-----------------------------------------------------------------------------------+
|                            HYPERCLICK MACRO PIPELINE                              |
+-----------------------------------------------------------------------------------+
  [ Waypoint Path ] ──▶ [ Bézier Curve Interpolator ] ──▶ [ Velocity Profile (Ease) ]
                                                                     │
  [ Pixel Trigger ] ──▶ [ Delta E Color Matcher ]     ───────────────┤
                                                                     ▼
  [ Timeline Record] ──▶ [ Microsecond Event Scheduler ] ──▶ [ Win32 SendInput DLL ]
+-----------------------------------------------------------------------------------+
```

---

## 2. Multi-Point Waypoint Sequencer

The Multi-Point Sequencer lets you automate complex multi-location workflows across your entire desktop.

```
                      (Node 1: Buy Item)
                        [X: 450, Y: 320]
                               │
                        (Bézier Curve)
                               ▼
 (Node 3: Confirm) ◀────── (Node 2: Select Quantity)
 [X: 1200, Y: 850]          [X: 890, Y: 560]
```

### 2.1 Node Properties & Action Types

Each waypoint node in your sequence contains:

| Property | Type | Description |
| :--- | :--- | :--- |
| **Index** | `number` | The execution order of the waypoint ($1, 2, 3 \dots N$). |
| **Name** | `string` | Human-readable label (e.g., "Click Inventory Slot 4"). |
| **Coordinates** | `(X, Y)` | Target screen coordinates in pixels. |
| **Action** | `enum` | Action to execute when cursor reaches the waypoint: |
| | | • `LEFT_CLICK`: Standard left button click |
| | | • `RIGHT_CLICK`: Standard right button click |
| | | • `DOUBLE_CLICK`: Rapid dual left clicks (15ms gap) |
| | | • `HOLD_DOWN`: Depresses mouse button for specified duration |
| | | • `KEY_PRESS`: Sends a specific keyboard key or combo |
| | | • `WAIT_ONLY`: Moves cursor and pauses without clicking |
| **Hold Duration** | `number` (ms) | Time the button/key remains held down before release. |
| **Post Delay** | `number` (ms) | Wait time before executing the next waypoint in the queue. |
| **Travel Speed** | `number` (ms) | Time allocated for cursor travel from previous waypoint. |

---

### 2.2 Bézier Trajectory Smoothing & Velocity Curves

Standard automation tools snap the mouse pointer instantly across coordinates, which is trivially flagged by anti-cheat heuristics. HyperClick Pro utilizes **Cubic Bézier Interpolation** with organic acceleration profiles.

#### The Cubic Bézier Formula

Given starting coordinate $P_0$, target coordinate $P_3$, and two randomized control points $P_1, P_2$:

$$\mathbf{B}(t) = (1-t)^3 \mathbf{P}_0 + 3(1-t)^2 t \mathbf{P}_1 + 3(1-t) t^2 \mathbf{P}_2 + t^3 \mathbf{P}_3 \quad \text{for } t \in [0, 1]$$

```
          P1 (Control 1)
          o . . . . . . 
         /              . . . o P2 (Control 2)
        /                      \
       o                        o
      P0 (Start)                P3 (Target Waypoint)
```

#### Velocity Profiling (Cubic Ease In-Out)
Rather than moving at a constant mechanical velocity, the cursor accelerates smoothly from a standstill, reaches maximum velocity at mid-path, and decelerates upon arriving at the target:

$$v(t) = \begin{cases} 4t^3 & \text{if } t < 0.5 \\ 1 - \frac{(-2t + 2)^3}{2} & \text{if } t \ge 0.5 \end{cases}$$

---

### 2.3 Loop Timers & Inter-Cycle Jitter

- **Infinite Cycling**: The sequence repeats continuously until stopped with <kbd>F6</kbd> or <kbd>F9</kbd>.
- **Loop Iteration Count**: Runs the sequence $N$ times (e.g. 50 cycles).
- **Inter-Cycle Pause**: Injects a configurable rest delay between iterations (e.g. $2000\text{ ms} \pm 250\text{ ms}$ randomized).

---

## 3. Real-Time Input Recorder & Timeline Editor

The **Macro Studio** allows you to record live gameplay or workflow routines and play them back with microsecond accuracy.

```
+-----------------------------------------------------------------------------+
| 🔴 MACRO TIMELINE EDITOR                                                    |
+-----------------------------------------------------------------------------+
| [0.00s] 🟢 Mouse Move (840, 450)                                            |
| [0.35s] 🖱️ Left Click Down                                                 |
| [0.42s] 🖱️ Left Click Up                                                   |
| [0.80s] ⌨️ Key Down: [ W ]                                                  |
| [1.20s] ⌨️ Key Up:   [ W ]                                                  |
| [1.50s] 🟢 Mouse Move (1200, 600) [Bézier Smoothed]                         |
| [1.90s] 🖱️ Right Click (1200, 600)                                          |
+-----------------------------------------------------------------------------+
| Playback Speed: [ 1.0x ▾ ]   [ ▶ Play ]   [ ⏹ Stop ]   [ 💾 Export JSON ]  |
+-----------------------------------------------------------------------------+
```

### 3.1 Recording Keystrokes & Mouse Movement
1. Switch to the **Macro Studio** tab.
2. Click **Record New Macro** or press global hotkey <kbd>F10</kbd>.
3. Perform your actions in-game (movement, clicks, skill combos, inventory sorting).
4. Press <kbd>F10</kbd> to end recording.
5. The recorded sequence is instantly rendered in the visual Timeline Editor.

### 3.2 Timeline Event Trimming & Fine-Tuning
- **Edit Delay**: Click any delay node to adjust the wait interval in milliseconds.
- **Delete Node**: Remove accidental misclicks or unwanted delays.
- **Insert Action**: Add new keystrokes or mouse clicks directly into the timeline.
- **Normalize Trajectories**: Convert rigid linear recordings into smooth Bézier movements with one click.

### 3.3 Playback Multiplier (0.1x – 10.0x)
Adjust execution speed dynamically:
- **0.5x Slow Motion**: For high-precision placement or debugging.
- **1.0x Realtime**: Replays actions at the exact timing they were performed.
- **2.0x – 10.0x Turbo**: Compresses delays for maximum throughput and speed.

---

## 4. Pixel Color Trigger Engine

The Pixel Color Trigger monitors on-screen pixels in real-time and executes actions when specific color states occur.

```
                   +---------------------------+
                   |  Pixel Monitor (X, Y)     |
                   |  Target: #FF3366 (Red)    |
                   |  Tolerance: ΔE <= 15      |
                   +-------------┬-------------+
                                 │
                     [ Color Matched? ]
                      ├──▶ YES: Trigger Left Click / Run Macro
                      └──▶ NO:  Continue Sampling Loop (60 Hz)
```

### 4.1 Screen Sampling & Delta Tolerance ($\Delta E$)

Because in-game lighting, dynamic weather, and anti-aliasing cause slight color variations, HyperClick Pro uses Euclidean RGB Delta Distance:

$$\Delta E = \sqrt{(R_{\text{screen}} - R_{\text{target}})^2 + (G_{\text{screen}} - G_{\text{target}})^2 + (B_{\text{screen}} - B_{\text{target}})^2}$$

- **$\Delta E = 0$**: Exact bitwise color match.
- **$\Delta E \le 15$**: Strict match (accounts for subtle video compression or shadows).
- **$\Delta E \le 40$**: Loose match (accounts for active lighting/shading transitions).

---

## 5. Practical Step-by-Step Automation Tutorials

### 5.1 Tutorial 1: Minecraft Auto-Fishing Bot

Automate fishing in Minecraft by detecting the water bubble splash or bobber dip.

```
+-----------------------------------------------------------------------+
| MINECRAFT AUTO-FISHING SETUP                                          |
| 1. Cast fishing rod into water.                                       |
| 2. Position cursor crosshair over the red top of the bobber.          |
| 3. Press F7 to sample target red color (#FF2200).                     |
| 4. Set Action: Right Click (Reel In) -> Delay 350ms -> Right Click    |
|    (Cast Out).                                                        |
| 5. Tolerance: ΔE = 30. Mode: Trigger on Color Loss (Bobber Submerges).|
+-----------------------------------------------------------------------+
```

1. Open Minecraft and cast your rod.
2. In HyperClick Pro, go to **Pixel Trigger**.
3. Press <kbd>F7</kbd> and click on the red bobber texture.
4. Set condition to **Trigger When Color Changes (Disappears)**.
5. In the Action dropdown, select **Execute Waypoint Sequence**:
   - Node 1: Right Click (Reels in fish)
   - Node 2: Wait 400ms
   - Node 3: Right Click (Casts rod again)
6. Press <kbd>F6</kbd> to activate. Relax while your character automatically fishes 24/7!

---

### 5.2 Tutorial 2: MMORPG Auto-Health Potion Monitor

Automatically drink a health potion when your character's HP drops below 25%.

1. Find the 25% mark on your game's Health Bar.
2. Sample the red health color (`#CC1122`) at that pixel coordinate with <kbd>F7</kbd>.
3. Set condition: **Trigger When Color Disappears** (meaning health dropped below 25%).
4. Set Action: **Press Key `1` (Health Potion Hotbar)**.
5. Set Cooldown: `5000 ms` (to respect the potion cooldown).
6. Enable and play safely with an automated emergency survival net!

---

### 5.3 Tutorial 3: Human Benchmark Instant Reaction Bot

Achieve a 1ms reaction score on human benchmark tests.

1. Navigate to `humanbenchmark.com/tests/reactiontime`.
2. Click to start the test (screen turns red).
3. Sample the green target color (`#4BD663`) at center screen.
4. Set Condition: **Trigger When Color Matches #4BD663**.
5. Set Action: **Instant Left Click**.
6. Activate with <kbd>F6</kbd>. When the red box turns green, HyperClick Pro clicks within **0.5 milliseconds**!

---

## 6. JSON Macro File Format Specification (`.hcm` / `.json`)

HyperClick Pro stores all macros in standardized, human-readable JSON:

```json
{
  "$schema": "https://hyperclick.dev/schemas/macro-v2.json",
  "meta": {
    "name": "MMORPG_Loot_And_Combat_Rotation",
    "author": "HyperClick Engineering",
    "version": "2026.1",
    "created": "2026-08-19T20:48:00Z"
  },
  "settings": {
    "loopMode": "finite",
    "loopCount": 100,
    "interLoopDelayMs": 1500,
    "interLoopJitterMs": 200,
    "playbackSpeed": 1.0,
    "smoothing": "cubic_bezier"
  },
  "waypoints": [
    {
      "id": "wp-1",
      "name": "Target Enemy",
      "x": 960,
      "y": 540,
      "action": "LEFT_CLICK",
      "holdDurationMs": 25,
      "postDelayMs": 120,
      "travelSpeedMs": 150
    },
    {
      "id": "wp-2",
      "name": "Cast Primary Ability (Key 1)",
      "x": 960,
      "y": 540,
      "action": "KEY_PRESS",
      "key": "1",
      "holdDurationMs": 40,
      "postDelayMs": 400,
      "travelSpeedMs": 0
    },
    {
      "id": "wp-3",
      "name": "Loot Chest",
      "x": 1120,
      "y": 680,
      "action": "RIGHT_CLICK",
      "holdDurationMs": 30,
      "postDelayMs": 500,
      "travelSpeedMs": 220
    }
  ]
}
```

---

<div align="center">

**HyperClick Pro 2026 Macro Guide**  
*Precision • Intelligence • Limitless Automation*

</div>
