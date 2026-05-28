### FILE: project_tree.txt


/Users/vv2024/Documents/Repos - vv2024/MIDI/WebApps/midi-transposer
├── # Prompts
|  ├── # 0.md
|  ├── # 1.md
|  ├── # 10.md
|  ├── # 11.md
|  ├── # 12.md
|  ├── # 13.md
|  ├── # 14.md
|  ├── # 15.md
|  ├── # 16.md
|  ├── # 17.md
|  ├── # 2.md
|  ├── # 3.md
|  ├── # 4.md
|  ├── # 5.md
|  ├── # 6.md
|  ├── # 7.md
|  ├── # 8.md
|  └── # 9.md
├── PROJECT_STATE.md
├── README.md
├── index.html
├── llms.txt
├── package-lock.json
├── package.json
├── project_tree.txt
├── src
|  ├── App.test.tsx
|  ├── App.tsx
|  ├── components
|  |  ├── Header.test.tsx
|  |  ├── Header.tsx
|  |  └── keyboards
|  |     ├── KeySplitKeyboard.test.tsx
|  |     ├── KeySplitKeyboard.tsx
|  |     ├── NoteRangeFilterKeyboard.test.tsx
|  |     ├── NoteRangeFilterKeyboard.tsx
|  |     ├── TransposeKeyboard88.test.tsx
|  |     ├── TransposeKeyboard88.tsx
|  |     └── keyboardMap.ts
|  ├── hooks
|  |  └── useWebMidi.ts
|  ├── index.css
|  ├── main.tsx
|  ├── store
|  |  ├── useMidiStore.test.ts
|  |  └── useMidiStore.ts
|  ├── test
|  |  └── setup.ts
|  └── utils
|     ├── midiPipeline.test.ts
|     └── midiPipeline.ts
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts

directory: 488 file: 3704

ignored: directory (70)


[2K[1G

### FILE: PROJECT_STATE.md

# Project State: MIDI Transposer

## 1. Architecture
```
/Users/vv2024/Documents/Repos - vv2024/MIDI/WebApps/midi-transposer
├── index.html
├── package.json
├── src
│   ├── App.test.tsx
│   ├── App.tsx
│   ├── components
│   │   ├── Header.test.tsx
│   │   ├── Header.tsx
│   │   └── keyboards
│   │       ├── KeySplitKeyboard.test.tsx
│   │       ├── KeySplitKeyboard.tsx
│   │       ├── NoteRangeFilterKeyboard.test.tsx
│   │       ├── NoteRangeFilterKeyboard.tsx
│   │       ├── TransposeKeyboard88.test.tsx
│   │       ├── TransposeKeyboard88.tsx
│   │       └── keyboardMap.ts
│   ├── hooks
│   │   └── useWebMidi.ts
│   ├── index.css
│   ├── main.tsx
│   ├── store
│   │   ├── useMidiStore.test.ts
│   │   └── useMidiStore.ts
│   ├── test
│   │   └── setup.ts
│   └── utils
│       ├── midiPipeline.test.ts
│       └── midiPipeline.ts
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## 2. Tech Stack
* **Framework:** React 18, Vite
* **State Management:** Zustand
* **Language:** TypeScript
* **Styling:** Vanilla CSS, TailwindCSS (for utility classes)
* **Icons:** Lucide React
* **Testing:** Vitest, React Testing Library

## 3. Current System Capabilities

### Stable Capabilities
* **MIDI Store (`useMidiStore`):** Manages global bypass status, MIDI device lists (inputs/outputs), active input selection, transpose metrics (origin, target, octave adjustments), filter modes (`block`, `limit`, `octave_wrap`, `wrap`), and a two-zone configuration (`zones` array).
* **MIDI Routing Hook (`useWebMidi`):** Manages navigator access to MIDI hardware, handles real-time message callback binding, processes incoming notes against active zones, applies transpose delta operations, filters signals using configured ranges/modes, and targets physical outputs alongside zero-latency UI key highlighting.
* **Input Split Keyboard (`KeySplitKeyboard`):** Renders a dual-zone keyboard supporting mouse-interactive split resizing. Provides:
  - Independent edge handles for adjusting zone bounds.
  - `Shift`-drag decoupling to separate zones and form unassigned "dead space".
  - Click-and-drag zone bodies to swap play/transpose layout order.
  - Exposed octave knobs mapped to global store variables.
* **Transpose Keyboard (`TransposeKeyboard88`):** Visualizes the target transpose amount and transpose base notes. Features red color-coding mapping directly to the Transpose zone logic.
* **Output Keyboard (`NoteRangeFilterKeyboard`):** Visualizes routed, transposed note output. Accommodates filter toolbar adjustments (mode selector, range sliders) and highlights active output keys in real-time.
* **MIDI Message Pipeline Logic:** Encapsulates raw transposition mathematical functions and clamping filters in a deterministic utility file, fully verified by unit tests.

### Work in Progress / Recent Actions
* Refactored routing state away from `splitPoint` to a decoupled two-zone structure. Verified that keys played in unassigned dead zones are cleanly dropped, and zone swap actions successfully invert play/transpose logic paths.

## 4. Recent Evolution
Migrated the routing engine and split-point interface to support two highly flexible zones (`Transpose` and `Play`) configured as a single `zones` state array in the Zustand store. Restored original Git mechanics for resizing edge handles, seam splitting, and drag-and-drop zone swapping, and updated all React Testing Library suites to maintain 100% passing status.


### FILE: README.md

# MIDI Transposer

A real-time Web MIDI transposition and filtering application built using React, TypeScript, and Zustand. 

## Features
* **Web MIDI API Integration:** Auto-detects and connects to browser-supported physical/virtual MIDI inputs and outputs.
* **Interactive Dual-Zone Layout:** Configures an input keyboard with two independent zones:
  - **Transpose Zone (Rose):** Tracks incoming keys to establish real-time transposition targets.
  - **Play Zone (Blue):** Transposes and forwards notes to physical outputs based on the active transpose targets.
* **Complex Bar Mechanics:** Adjust zone boundaries dynamically via:
  - Outer edge drag-resize handles.
  - `Shift`-drag center handle splitting to create unassigned dead zones (where notes are dropped).
  - Drag-and-drop zone body reordering to swap the physical arrangement of Transpose and Play areas.
* **Octave Adjustments:** Smooth rotary knobs to shift transpose or play zones independently by octaves (-6 to +6).
* **Output Range Filtering:** Selectable mapping modes (`Block`, `Limit`, `Octave Wrap`, `Wrap`) applied to a custom output note range [Min, Max].
* **Panic System:** Sends All Notes Off / Reset All Controllers continuous controller messages across all 16 MIDI channels at any time to silence stuck notes.

## Project Structure
```
├── src
│   ├── App.tsx             # App shell coordinating header and keyboards
│   ├── components
│   │   ├── Header.tsx      # Device selector, panic, bypass toggles
│   │   └── keyboards
│   │       ├── KeySplitKeyboard.tsx         # Input zones and split bar controls
│   │       ├── TransposeKeyboard88.tsx      # Transpose visualizer
│   │       └── NoteRangeFilterKeyboard.tsx  # Output range filter & visualizer
│   ├── hooks
│   │   └── useWebMidi.ts   # Device listener and message routing pipeline
│   ├── store
│   │   └── useMidiStore.ts # Global Zustand application state
│   └── utils
│       └── midiPipeline.ts # Pure mathematical transposition & filtering
```

## Quick Start

### Installation
Install application dependencies:
```bash
npm install
```

### Run Locally
Start the Vite dev server:
```bash
npm run dev
```

### Running Tests
Execute unit tests:
```bash
npm run test
```


