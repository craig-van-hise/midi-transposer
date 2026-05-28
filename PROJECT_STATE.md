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
