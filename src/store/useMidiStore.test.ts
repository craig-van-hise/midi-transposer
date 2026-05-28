import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMidiStore } from './useMidiStore';
import { useWebMidi } from '../hooks/useWebMidi';
import { renderHook, act } from '@testing-library/react';

describe('Global Zustand Store & Web MIDI Hook Phase 1 TDD Checkpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Test Case 0: Given store is initialized, Assert diagnostic state properties and setters are functional', () => {
    expect(useMidiStore.getState().midiAccessStatus).toBe('pending');
    expect(useMidiStore.getState().midiErrorText).toBeNull();

    useMidiStore.getState().setMidiAccessStatus('granted');
    expect(useMidiStore.getState().midiAccessStatus).toBe('granted');

    useMidiStore.getState().setMidiErrorText('Failed exclusively');
    expect(useMidiStore.getState().midiErrorText).toBe('Failed exclusively');
  });

  it('Test Case 1: Given navigator.requestMIDIAccess resolves, Assert store midiInputs is populated', async () => {
    const mockInput = {
      id: 'input-1',
      name: 'Mock MIDI Input',
      onmidimessage: null,
    } as unknown as WebMidi.MIDIInput;

    const mockMidiAccess = {
      inputs: new Map([['input-1', mockInput]]),
      outputs: new Map(),
      onstatechange: null,
    } as unknown as WebMidi.MIDIAccess;

    const requestMIDIAccessMock = vi.fn().mockResolvedValue(mockMidiAccess);
    
    // Mock navigator.requestMIDIAccess
    vi.stubGlobal('navigator', {
      requestMIDIAccess: requestMIDIAccessMock,
    });

    // Initialize store state
    useMidiStore.setState({
      midiInputs: [],
      selectedInputId: null,
    });

    // Render the hook
    renderHook(() => useWebMidi());

    // Wait for microtasks to resolve requestMIDIAccess promise
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(requestMIDIAccessMock).toHaveBeenCalled();
    expect(useMidiStore.getState().midiInputs).toHaveLength(1);
    expect(useMidiStore.getState().midiInputs[0].id).toBe('input-1');
    expect(useMidiStore.getState().midiAccessStatus).toBe('granted');
  });

  it('Test Case 1.5: Given navigator.requestMIDIAccess is undefined, Assert status is unsupported', () => {
    vi.stubGlobal('navigator', {});
    useMidiStore.setState({ midiAccessStatus: 'pending', midiErrorText: null });
    renderHook(() => useWebMidi());
    expect(useMidiStore.getState().midiAccessStatus).toBe('unsupported');
    expect(useMidiStore.getState().midiErrorText).toBe('Browser does not support Web MIDI');
  });
});

describe('Global Zustand Store & Web MIDI Hook Phase 2 TDD Checkpoint', () => {
  beforeEach(() => {
    useMidiStore.setState({
      bypass: false,
      activeChannels: Array.from({ length: 16 }, (_, i) => i + 1),
      zones: [
        { id: 'z-trans', type: 'transpose', startNote: 21, endNote: 59, color: '#f43f5e', octave: 0 },
        { id: 'z-play', type: 'play', startNote: 60, endNote: 108, color: '#3b82f6', octave: 0 },
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

describe('MIDI Routing Engine Phase 5 TDD Checkpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Test Case 1: Given note in Transpose Zone, Assert updates transposeTarget and does not output', async () => {
    let messageCallback: ((event: any) => void) | null = null;

    const mockInput = {
      id: 'input-1',
      name: 'Mock MIDI Input',
      get onmidimessage() { return messageCallback; },
      set onmidimessage(cb) { messageCallback = cb; },
    } as unknown as WebMidi.MIDIInput;

    const sendMock = vi.fn();
    const mockOutput = {
      id: 'output-1',
      send: sendMock,
    } as unknown as WebMidi.MIDIOutput;

    const mockMidiAccess = {
      inputs: new Map([['input-1', mockInput]]),
      outputs: new Map([['output-1', mockOutput]]),
      onstatechange: null,
    } as unknown as WebMidi.MIDIAccess;

    vi.stubGlobal('navigator', {
      requestMIDIAccess: vi.fn().mockResolvedValue(mockMidiAccess),
    });

    useMidiStore.setState({
      selectedInputId: 'input-1',
      midiInputs: [mockInput],
      midiOutputs: [mockOutput],
      zones: [
        { id: 'z-trans', type: 'transpose', startNote: 21, endNote: 59, color: '#f43f5e', octave: 0 },
        { id: 'z-play', type: 'play', startNote: 60, endNote: 108, color: '#3b82f6', octave: 0 },
      ],
      transposeOctave: 0,
      playOctave: 0,
      transposeOrigin: 60,
      transposeTarget: 60,
    });

    renderHook(() => useWebMidi());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(messageCallback).toBeDefined();

    // Trigger note on C3 (48) which is in Transpose Zone
    act(() => {
      messageCallback!({ data: new Uint8Array([0x90, 48, 100]) });
    });

    // Check store state: transposeTarget should update to 48
    expect(useMidiStore.getState().transposeTarget).toBe(48);
    // Check that nothing was sent to output
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('Test Case 2: Given note in Play Zone, Assert outputs transposed note', async () => {
    let messageCallback: ((event: any) => void) | null = null;

    const mockInput = {
      id: 'input-1',
      name: 'Mock MIDI Input',
      get onmidimessage() { return messageCallback; },
      set onmidimessage(cb) { messageCallback = cb; },
    } as unknown as WebMidi.MIDIInput;

    const sendMock = vi.fn();
    const mockOutput = {
      id: 'output-1',
      send: sendMock,
    } as unknown as WebMidi.MIDIOutput;

    const mockMidiAccess = {
      inputs: new Map([['input-1', mockInput]]),
      outputs: new Map([['output-1', mockOutput]]),
      onstatechange: null,
    } as unknown as WebMidi.MIDIAccess;

    vi.stubGlobal('navigator', {
      requestMIDIAccess: vi.fn().mockResolvedValue(mockMidiAccess),
    });

    useMidiStore.setState({
      selectedInputId: 'input-1',
      midiInputs: [mockInput],
      midiOutputs: [mockOutput],
      zones: [
        { id: 'z-trans', type: 'transpose', startNote: 21, endNote: 59, color: '#f43f5e', octave: 0 },
        { id: 'z-play', type: 'play', startNote: 60, endNote: 108, color: '#3b82f6', octave: 0 },
      ],
      transposeOctave: 0,
      playOctave: 0,
      transposeOrigin: 60,
      transposeTarget: 64, // Transpose +4 semitones
      filterMode: 'block',
      filterRange: [21, 108],
    });

    renderHook(() => useWebMidi());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Trigger note on C4 (60) which is in Play Zone
    act(() => {
      messageCallback!({ data: new Uint8Array([0x90, 60, 100]) });
    });

    // Check that transposed note E4 (64) was sent to output
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x90, 64, 100]));
  });

  it('Test Case 3: Given a note event, Assert zero-latency visual feedback applies style directly to Input Keyboard DOM element', async () => {
    let messageCallback: ((event: any) => void) | null = null;
    const mockInput = {
      id: 'input-1',
      name: 'Mock MIDI Input',
      get onmidimessage() { return messageCallback; },
      set onmidimessage(cb) { messageCallback = cb; },
    } as unknown as WebMidi.MIDIInput;

    const mockMidiAccess = {
      inputs: new Map([['input-1', mockInput]]),
      outputs: new Map(),
      onstatechange: null,
    } as unknown as WebMidi.MIDIAccess;

    vi.stubGlobal('navigator', {
      requestMIDIAccess: vi.fn().mockResolvedValue(mockMidiAccess),
    });

    useMidiStore.setState({
      selectedInputId: 'input-1',
      midiInputs: [mockInput],
      zones: [
        { id: 'z-trans', type: 'transpose', startNote: 21, endNote: 59, color: '#f43f5e', octave: 0 },
        { id: 'z-play', type: 'play', startNote: 60, endNote: 108, color: '#3b82f6', octave: 0 },
      ],
    });

    // Create a mock DOM element for the input key
    const mockKeyEl = document.createElement('div');
    mockKeyEl.id = 'pksplit-60';
    document.body.appendChild(mockKeyEl);

    renderHook(() => useWebMidi());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Trigger note on
    act(() => {
      messageCallback!({ data: new Uint8Array([0x90, 60, 100]) });
    });

    // Color should be play zone color (#3b82f6)
    expect(mockKeyEl.style.backgroundColor).toBe('rgb(59, 130, 246)');

    // Trigger note off
    act(() => {
      messageCallback!({ data: new Uint8Array([0x80, 60, 0]) });
    });

    // Color should be default white key color (#ffffff)
    expect(mockKeyEl.style.backgroundColor).toBe('rgb(255, 255, 255)');

    // Clean up
    document.body.removeChild(mockKeyEl);
  });
});
