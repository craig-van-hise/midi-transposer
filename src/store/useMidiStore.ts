import { create } from 'zustand';

export interface Zone {
  id: string;
  startNote: number;
  endNote: number;
  channel: number;
  color: string;
  octave: number;
}

export type FilterMode = 'block' | 'limit' | 'octave_wrap' | 'wrap';

export interface MidiStoreState {
  bypass: boolean;
  activeChannels: number[]; // 1-16
  zones: Zone[];
  transposeAmount: number;
  filterMode: FilterMode;
  filterRange: [number, number]; // [min, max]
  midiInputs: WebMidi.MIDIInput[];
  midiOutputs: WebMidi.MIDIOutput[];

  toggleBypass: () => void;
  setActiveChannels: (channels: number[]) => void;
  setZones: (zones: Zone[]) => void;
  setTransposeAmount: (amount: number) => void;
  setFilterMode: (mode: FilterMode) => void;
  setFilterRange: (range: [number, number]) => void;
  setMidiInputs: (inputs: WebMidi.MIDIInput[]) => void;
  setMidiOutputs: (outputs: WebMidi.MIDIOutput[]) => void;
  panic: () => void;
}

export const useMidiStore = create<MidiStoreState>((set, get) => ({
  bypass: false,
  activeChannels: Array.from({ length: 16 }, (_, i) => i + 1), // Default channels 1-16
  zones: [
    { id: 'z1', startNote: 21, endNote: 45, channel: 1, color: '#f43f5e', octave: 0 },
    { id: 'z2', startNote: 46, endNote: 72, channel: 2, color: '#3b82f6', octave: 0 },
    { id: 'z3', startNote: 73, endNote: 108, channel: 3, color: '#10b981', octave: 0 },
  ],
  transposeAmount: 0,
  filterMode: 'block',
  filterRange: [21, 108],
  midiInputs: [],
  midiOutputs: [],

  toggleBypass: () => set((state) => ({ bypass: !state.bypass })),
  setActiveChannels: (activeChannels) => set({ activeChannels }),
  setZones: (zones) => set({ zones }),
  setTransposeAmount: (transposeAmount) => set({ transposeAmount }),
  setFilterMode: (filterMode) => set({ filterMode }),
  setFilterRange: (filterRange) => set({ filterRange }),
  setMidiInputs: (midiInputs) => set({ midiInputs }),
  setMidiOutputs: (midiOutputs) => set({ midiOutputs }),

  panic: () => {
    const outputs = get().midiOutputs;
    outputs.forEach((output) => {
      try {
        for (let ch = 0; ch < 16; ch++) {
          output.send(new Uint8Array([0xB0 + ch, 123, 0]));
          output.send(new Uint8Array([0xB0 + ch, 120, 0]));
        }
      } catch (err) {
        console.error('Failed to send panic messages:', err);
      }
    });
  },
}));
