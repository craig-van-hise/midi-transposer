import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMidiStore } from './useMidiStore';

describe('Global Zustand Store & Web MIDI Hook Phase 2 TDD Checkpoint', () => {
  beforeEach(() => {
    useMidiStore.setState({
      bypass: false,
      activeChannels: Array.from({ length: 16 }, (_, i) => i + 1),
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
    });
  });

  it('Test Case 1: Given store is initialized, When toggleBypass is called, Assert bypass state inverts', () => {
    expect(useMidiStore.getState().bypass).toBe(false);
    useMidiStore.getState().toggleBypass();
    expect(useMidiStore.getState().bypass).toBe(true);
    useMidiStore.getState().toggleBypass();
    expect(useMidiStore.getState().bypass).toBe(false);
  });

  it('Test Case 2: Given panic is triggered, Assert Web MIDI output ports receive 0xB0 continuous controller messages for 123 and 120 on all channels', () => {
    const sendMock = vi.fn();
    const mockOutput = {
      id: 'mock-output-1',
      name: 'Mock Output Port',
      send: sendMock,
    } as unknown as WebMidi.MIDIOutput;

    useMidiStore.setState({ midiOutputs: [mockOutput] });

    useMidiStore.getState().panic();

    expect(sendMock).toHaveBeenCalledTimes(32); // 16 channels * 2 messages each

    for (let ch = 0; ch < 16; ch++) {
      expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0xB0 + ch, 123, 0]));
      expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0xB0 + ch, 120, 0]));
    }
  });
});
