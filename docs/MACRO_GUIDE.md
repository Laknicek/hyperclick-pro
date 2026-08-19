# 🎛️ HyperClick Pro 2026 — Macro & Sequencer Guide

The **HyperClick Pro 2026 Macro Engine** combines spatial multi-point waypoint navigation, Bézier curve trajectory interpolation, and real-time input recording into a unified automation studio.

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
   - [Playback Multiplier (0.2x – 3.0x)](#33-playback-multiplier-02x--30x)
4. [Practical Workflow Tutorials](#4-practical-workflow-tutorials)
   - [Tutorial 1: Batch Form & Data Entry Sequence](#41-tutorial-1-batch-form--data-entry-sequence)
   - [Tutorial 2: Desktop Window Navigation & Repetitive Clicks](#42-tutorial-2-desktop-window-navigation--repetitive-clicks)
5. [JSON Macro File Format Specification (`.json`)](#5-json-macro-file-format-specification-json)

---

## 1. Overview & Macro Engine Architecture

HyperClick Pro's macro runtime operates on a deterministic event queue with sub-millisecond scheduling:

```
+-----------------------------------------------------------------------------------+
|                            HYPERCLICK MACRO PIPELINE                              |
+-----------------------------------------------------------------------------------+
  [ Waypoint Path ] ──▶ [ Bézier Curve Interpolator ] ──▶ [ Velocity Profile (Ease) ]
                                                                     │
  [ Timeline Record] ──▶ [ Microsecond Event Scheduler ] ──▶ [ Win32 SendInput DLL ]
+-----------------------------------------------------------------------------------+
```

---

## 2. Multi-Point Waypoint Sequencer

The Multi-Point Sequencer lets you automate complex multi-location workflows across your entire desktop.

```
                      (Node 1: Select Field 1)
                         [X: 450, Y: 320]
                                │
                         (Bézier Curve)
                                ▼
 (Node 3: Save Data) ◀────── (Node 2: Select Column 2)
  [X: 1200, Y: 850]           [X: 890, Y: 560]
```

### 2.1 Node Properties & Action Types

Each waypoint node in your sequence contains:

| Property | Type | Description |
| :--- | :--- | :--- |
| **Index** | `number` | The execution order of the waypoint ($1, 2, 3 \dots N$). |
| **Name** | `string` | Human-readable label (e.g., "Select Row Field"). |
| **Coordinates** | `(X, Y)` | Target screen coordinates in pixels. |
| **Action** | `enum` | Action to execute when cursor reaches the waypoint: |
| | | • `click`: Standard left button click |
| | | • `double_click`: Rapid dual left clicks |
| | | • `right_click`: Standard right button click |
| | | • `middle_click`: Scroll-wheel click |
| | | • `drag_to`: Drag and drop from current waypoint to target coordinates |
| | | • `move_only`: Moves cursor smoothly without clicking |
| | | • `wait`: Pauses execution for specified delay |
| **Hold Duration** | `number` (ms) | Time the button/key remains held down before release. |
| **Delay Before** | `number` (ms) | Wait time before executing the click. |
| **Delay After** | `number` (ms) | Wait time before proceeding to the next node. |

---

### 2.2 Bézier Trajectory Smoothing & Velocity Curves

HyperClick Pro provides **Cubic Bézier Interpolation** with organic acceleration profiles for smooth mouse movement between coordinates.

#### The Cubic Bézier Formula

Given starting coordinate $P_0$, target coordinate $P_3$, and two control points $P_1, P_2$:

$$\mathbf{B}(t) = (1-t)^3 \mathbf{P}_0 + 3(1-t)^2 t \mathbf{P}_1 + 3(1-t) t^2 \mathbf{P}_2 + t^3 \mathbf{P}_3 \quad \text{for } t \in [0, 1]$$

---

## 3. Real-Time Input Recorder & Timeline Editor

### 3.1 Recording Keystrokes & Mouse Movement
- Press <kbd>F10</kbd> or click **Record Macro** in the Macro Studio tab.
- Perform the desired series of desktop actions.
- Press <kbd>F10</kbd> again to stop recording.

### 3.2 Timeline Event Trimming & Fine-Tuning
- The visual timeline renders all recorded clicks and keystrokes.
- Edit millisecond offsets, delete unnecessary actions, and customize loop counts.

### 3.3 Playback Multiplier (0.2x – 3.0x)
- Speed up playback for rapid bulk execution or slow it down for debugging.

---

## 4. Practical Workflow Tutorials

### 4.1 Tutorial 1: Batch Form & Data Entry Sequence
1. Set Waypoint 1 over the primary text box.
2. Set Waypoint 2 over the submit button.
3. Set loop count to the number of records (e.g. 50).
4. Press <kbd>F7</kbd> to launch the sequence.

### 4.2 Tutorial 2: Desktop Window Navigation & Repetitive Clicks
1. Set Waypoint 1 on the top menu bar.
2. Set Waypoint 2 on the export dialog.
3. Enable 0.7 Bézier curvature for smooth glide across multi-monitor setups.

---

## 5. JSON Macro File Format Specification (`.json`)

```json
{
  "id": "seq_example_workflow",
  "name": "Data Grid Navigation",
  "loopCount": 25,
  "traversalMode": "ordered",
  "humanizePaths": true,
  "waypoints": [
    {
      "id": "wp_1",
      "name": "First Input Cell",
      "x": 500,
      "y": 400,
      "actionType": "click",
      "clickType": "single",
      "mouseButton": "left",
      "delayBeforeMs": 120,
      "delayAfterMs": 250,
      "jitterRadius": 1,
      "holdDurationMs": 40,
      "loopRepeat": 1,
      "enabled": true
    }
  ]
}
```

---

<div align="center">

*HyperClick Pro 2026 • Macro & Sequence Documentation*

</div>
