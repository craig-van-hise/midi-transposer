import { create } from 'zustand';

export interface Zone {
  id: string;
  type: 'transpose' | 'play';
  startNote: number;
  endNote: number;
  color: string;
  octave: number;
}

export type FilterMode = 'block' | 'limit' | 'octave_wrap' | 'wrap';
export type TransposeHoldMode = 'sustain' | 'cutoff' | 'retrigger';

export interface MidiStoreState {
  bypass: boolean;
  activeChannels: number[]; // 1-16
  zones: Zone[];
  transposeAmount: number;
  filterMode: FilterMode;
  filterRange: [number, number]; // [min, max]
  midiInputs: WebMidi.MIDIInput[];
  midiOutputs: WebMidi.MIDIOutput[];
  selectedInputId: string | null;
  transposeOctave: number;
  playOctave: number;
  transposeOrigin: number;
  transposeTarget: number;
  midiAccessStatus: 'pending' | 'granted' | 'denied' | 'unsupported' | 'error';
  midiErrorText: string | null;
  transposeHoldMode: TransposeHoldMode;

  toggleBypass: () => void;
  setActiveChannels: (channels: number[]) => void;
  setZones: (zones: Zone[]) => void;
  setTransposeAmount: (amount: number) => void;
  setFilterMode: (mode: FilterMode) => void;
  setFilterRange: (range: [number, number]) => void;
  setMidiInputs: (inputs: WebMidi.MIDIInput[]) => void;
  setMidiOutputs: (outputs: WebMidi.MIDIOutput[]) => void;
  setSelectedInputId: (id: string | null) => void;
  setTransposeOctave: (octave: number) => void;
  setPlayOctave: (octave: number) => void;
  setTransposeOrigin: (origin: number) => void;
  setTransposeTarget: (target: number) => void;
  setMidiAccessStatus: (status: 'pending' | 'granted' | 'denied' | 'unsupported' | 'error') => void;
  setMidiErrorText: (text: string | null) => void;
  setTransposeHoldMode: (mode: TransposeHoldMode) => void;
  panic: () => void;
}

export const useMidiStore = create<MidiStoreState>((set, get) => ({
  bypass: false,
  activeChannels: Array.from({ length: 16 }, (_, i) => i + 1), // Default channels 1-16
  zones: [
    { id: 'z-trans', type: 'transpose', startNote: 21, endNote: 59, color: '#f43f5e', octave: 0 },
    { id: 'z-play', type: 'play', startNote: 60, endNote: 108, color: '#3b82f6', octave: 0 },
  ],
  transposeAmount: 0,
  filterMode: 'block',
  filterRange: [21, 108],
  midiInputs: [],
  midiOutputs: [],
  selectedInputId: null,
  transposeOctave: 0,
  playOctave: 0,
  transposeOrigin: 60,
  transposeTarget: 60,
  midiAccessStatus: 'pending',
  midiErrorText: null,
  transposeHoldMode: 'sustain',

  toggleBypass: () => set((state) => ({ bypass: !state.bypass })),
  setActiveChannels: (activeChannels) => set({ activeChannels }),
  setZones: (zones) => set({ zones }),
  setTransposeAmount: (transposeAmount) => set({ transposeAmount }),
  setFilterMode: (filterMode) => set({ filterMode }),
  setFilterRange: (filterRange) => set({ filterRange }),
  setMidiInputs: (midiInputs) => set({ midiInputs }),
  setMidiOutputs: (midiOutputs) => set({ midiOutputs }),
  setSelectedInputId: (selectedInputId) => set({ selectedInputId }),
  setTransposeOctave: (transposeOctave) => set({ transposeOctave }),
  setPlayOctave: (playOctave) => set({ playOctave }),
  setTransposeOrigin: (transposeOrigin) => set({ transposeOrigin }),
  setTransposeTarget: (transposeTarget) => set({ transposeTarget }),
  setMidiAccessStatus: (midiAccessStatus) => set({ midiAccessStatus }),
  setMidiErrorText: (midiErrorText) => set({ midiErrorText }),
  setTransposeHoldMode: (transposeHoldMode) => set({ transposeHoldMode }),

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
