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
