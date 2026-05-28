import { describe, it, expect } from 'vitest';
import { processMidiMessage } from './midiPipeline';
import { MidiStoreState } from '../store/useMidiStore';

const baseState: MidiStoreState = {
  bypass: false,
  activeChannels: [1],
  zones: [
    { id: 'z1', startNote: 21, endNote: 108, channel: 1, color: '#fff', octave: 0 },
  ],
  transposeAmount: 0,
  filterMode: 'block',
  filterRange: [21, 108],
  midiInputs: [],
  midiOutputs: [],
  toggleBypass: () => {},
  setActiveChannels: () => {},
  setZones: () => {},
  setTransposeAmount: () => {},
  setFilterMode: () => {},
  setFilterRange: () => {},
  setMidiInputs: () => {},
  setMidiOutputs: () => {},
  panic: () => {},
};

describe('MIDI Pipeline Engine Phase 4 TDD Checkpoint', () => {
  it('Test Case 1 (Bypass): Given bypass: true, When Note On (60) arrives, Assert output identical to input', () => {
    const state = { ...baseState, bypass: true };
    const input = new Uint8Array([0x90, 60, 100]);
    const output = processMidiMessage(input, state);
    expect(output).toHaveLength(1);
    expect(output[0]).toEqual(input);
  });

  it('Test Case 2 (Transpose): Given transposeAmount: 5, When Note On (60) arrives, Assert output is Note On (65)', () => {
    const state = { ...baseState, transposeAmount: 5 };
    const input = new Uint8Array([0x90, 60, 100]);
    const output = processMidiMessage(input, state);
    expect(output).toHaveLength(1);
    expect(output[0]).toEqual(new Uint8Array([0x90, 65, 100]));
  });

  it('Test Case 3 (Limit Filter): Given filterMode: limit, range: [50, 60], When Note On (70) arrives, Assert output is Note On (60)', () => {
    const state = {
      ...baseState,
      filterMode: 'limit' as const,
      filterRange: [50, 60] as [number, number],
    };
    const input = new Uint8Array([0x90, 70, 100]);
    const output = processMidiMessage(input, state);
    expect(output).toHaveLength(1);
    expect(output[0]).toEqual(new Uint8Array([0x90, 60, 100]));
  });

  it('Filter Stage: block mode drops out-of-range notes', () => {
    const state = {
      ...baseState,
      filterMode: 'block' as const,
      filterRange: [50, 60] as [number, number],
    };
    const inputUnder = new Uint8Array([0x90, 40, 100]);
    const inputOver = new Uint8Array([0x90, 70, 100]);
    const inputIn = new Uint8Array([0x90, 55, 100]);

    expect(processMidiMessage(inputUnder, state)).toHaveLength(0);
    expect(processMidiMessage(inputOver, state)).toHaveLength(0);

    const outIn = processMidiMessage(inputIn, state);
    expect(outIn).toHaveLength(1);
    expect(outIn[0]).toEqual(inputIn);
  });

  it('Filter Stage: octave_wrap shifts notes by octaves until inside range', () => {
    const state = {
      ...baseState,
      filterMode: 'octave_wrap' as const,
      filterRange: [48, 59] as [number, number],
    };
    const inputLow = new Uint8Array([0x90, 40, 100]);
    const outLow = processMidiMessage(inputLow, state);
    expect(outLow).toHaveLength(1);
    expect(outLow[0]).toEqual(new Uint8Array([0x90, 52, 100]));

    const inputHigh = new Uint8Array([0x90, 68, 100]);
    const outHigh = processMidiMessage(inputHigh, state);
    expect(outHigh).toHaveLength(1);
    expect(outHigh[0]).toEqual(new Uint8Array([0x90, 56, 100]));
  });

  it('Filter Stage: wrap maps note modularly into range size', () => {
    const state = {
      ...baseState,
      filterMode: 'wrap' as const,
      filterRange: [48, 59] as [number, number],
    };
    const input = new Uint8Array([0x90, 60, 100]);
    const output = processMidiMessage(input, state);
    expect(output).toHaveLength(1);
    expect(output[0]).toEqual(new Uint8Array([0x90, 48, 100]));
  });
});
