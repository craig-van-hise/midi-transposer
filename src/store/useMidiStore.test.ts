import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMidiStore } from './useMidiStore';
import { useWebMidi } from '../hooks/useWebMidi';
import { renderHook, act } from '@testing-library/react';

describe('Zustand Store - Transpose Hold Mode TDD Checkpoint', () => {
  it('Test Case 1: Zustand store initializes with transposeHoldMode === sustain', () => {
    expect(useMidiStore.getState().transposeHoldMode).toBe('sustain');
  });

  it('Test Case 2: Calling setTransposeHoldMode successfully updates the state', () => {
    useMidiStore.getState().setTransposeHoldMode('retrigger');
    expect(useMidiStore.getState().transposeHoldMode).toBe('retrigger');
    // Reset to sustain
    useMidiStore.getState().setTransposeHoldMode('sustain');
  });
});

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

describe('Web MIDI Hook - Active Note Tracking Phase 2 TDD Checkpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Test Case 1 & 2: Active note mapping and target changes Note Off sustain integrity', async () => {
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
      transposeTarget: 62, // Target is 62 (+2 semitones)
      filterMode: 'block',
      filterRange: [21, 108],
      transposeHoldMode: 'sustain',
    });

    const { result } = renderHook(() => useWebMidi());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Send Note On for input note 60
    act(() => {
      messageCallback!({ data: new Uint8Array([0x90, 60, 100]) });
    });

    // Check outputs
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x90, 62, 100]));

    // Assert activeRoutedNotes contains 60 -> 62
    const activeRoutedNotes = result.current.activeRoutedNotes;
    expect(activeRoutedNotes.current.get(60)).toEqual(expect.objectContaining({ outNote: 62 }));

    // Change transposeTarget to 64
    act(() => {
      useMidiStore.setState({ transposeTarget: 64 });
    });

    // Send Note Off for input note 60 (velocity 0 or 0x80 status)
    act(() => {
      messageCallback!({ data: new Uint8Array([0x80, 60, 0]) });
    });

    // Assert that Note Off was sent for 62 (not 64)
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x80, 62, 0]));

    // Assert Map is cleared
    expect(activeRoutedNotes.current.has(60)).toBe(false);
  });
});

describe('Web MIDI Hook - Cutoff & Retrigger Engine Phase 3 TDD Checkpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Test Case 1: Cutoff Mode: Map clears and Note Offs trigger when transposeTarget changes', async () => {
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
      transposeTarget: 62, // Target is 62 (+2 semitones)
      filterMode: 'block',
      filterRange: [21, 108],
      transposeHoldMode: 'cutoff',
    });

    const { result } = renderHook(() => useWebMidi());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Send Note On for input note 60 (outputs 62)
    act(() => {
      messageCallback!({ data: new Uint8Array([0x90, 60, 100]) });
    });

    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x90, 62, 100]));
    const activeRoutedNotes = result.current.activeRoutedNotes;
    expect(activeRoutedNotes.current.has(60)).toBe(true);

    // Change transposeTarget to 64
    act(() => {
      useMidiStore.setState({ transposeTarget: 64 });
    });

    // Assert that Note Off for 62 was triggered
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x80, 62, 0]));

    // Assert Map is cleared in cutoff mode
    expect(activeRoutedNotes.current.has(60)).toBe(false);
  });

  it('Test Case 2: Retrigger Mode: Note Off triggers for old note, Note On triggers for new note, Map updates', async () => {
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
      transposeTarget: 62, // Target is 62 (+2 semitones)
      filterMode: 'block',
      filterRange: [21, 108],
      transposeHoldMode: 'retrigger',
    });

    const { result } = renderHook(() => useWebMidi());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Send Note On for input note 60 (outputs 62)
    act(() => {
      messageCallback!({ data: new Uint8Array([0x90, 60, 100]) });
    });

    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x90, 62, 100]));
    const activeRoutedNotes = result.current.activeRoutedNotes;
    expect(activeRoutedNotes.current.has(60)).toBe(true);

    // Change transposeTarget to 64
    act(() => {
      useMidiStore.setState({ transposeTarget: 64 });
    });

    // Assert that Note Off for 62 was triggered
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x80, 62, 0]));

    // Assert that Note On for 64 was triggered
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x90, 64, 100]));

    // Assert Map is updated to 64
    expect(activeRoutedNotes.current.get(60)).toEqual(expect.objectContaining({ outNote: 64 }));
  });
});

describe('Polyphonic Upgrades Phase 1 TDD Checkpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Test Case 1: polyphonyMode === poly, transposeTargets === [64, 67]. Input C4 (60) yields Note Ons for E4 (64) and G4 (67). Map stores [64, 67]', async () => {
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
      transposeTargets: [64, 67],
      polyphonyMode: 'poly',
      filterMode: 'block',
      filterRange: [21, 108],
    });

    const { result } = renderHook(() => useWebMidi());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Send Note On for input note 60 (C4)
    act(() => {
      messageCallback!({ data: new Uint8Array([0x90, 60, 100]) });
    });

    // Assert both E4 (64) and G4 (67) were sent
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x90, 64, 100]));
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x90, 67, 100]));

    // Assert map contains [64, 67]
    const activeRoutedNotes = result.current.activeRoutedNotes;
    expect(activeRoutedNotes.current.get(60)).toEqual(expect.objectContaining({
      outNotes: [64, 67]
    }));
  });

  it('Test Case 2: Note Off C4 (60) correctly silences both 64 and 67 via map lookup', async () => {
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
      transposeTargets: [64, 67],
      polyphonyMode: 'poly',
      filterMode: 'block',
      filterRange: [21, 108],
    });

    const { result } = renderHook(() => useWebMidi());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Send Note On for input note 60 (C4)
    act(() => {
      messageCallback!({ data: new Uint8Array([0x90, 60, 100]) });
    });

    // Send Note Off for input note 60 (C4)
    act(() => {
      messageCallback!({ data: new Uint8Array([0x80, 60, 0]) });
    });

    // Assert Note Offs sent for both 64 and 67
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x80, 64, 0]));
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x80, 67, 0]));

    // Assert map is cleared
    const activeRoutedNotes = result.current.activeRoutedNotes;
    expect(activeRoutedNotes.current.has(60)).toBe(false);
  });
});

describe('Polyphonic Chord Latching TDD Checkpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Test Cases 1, 2, 3: Overwrite transpose targets on first note, append on subsequent notes, latch on release', async () => {
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
      transposeOctave: 0,
      playOctave: 0,
      transposeOrigin: 60,
      transposeTargets: [60],
      polyphonyMode: 'poly',
    });

    renderHook(() => useWebMidi());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Test Case 1: plays Note On 48. Target becomes [48]
    act(() => {
      messageCallback!({ data: new Uint8Array([0x90, 48, 100]) });
    });
    expect(useMidiStore.getState().transposeTargets).toEqual([48]);

    // Test Case 2: plays Note On 52 while holding 48. Target becomes [48, 52]
    act(() => {
      messageCallback!({ data: new Uint8Array([0x90, 52, 100]) });
    });
    expect(useMidiStore.getState().transposeTargets).toEqual([48, 52]);

    // Test Case 3: release both keys. Targets should remain [48, 52] (latched)
    act(() => {
      messageCallback!({ data: new Uint8Array([0x80, 48, 0]) });
      messageCallback!({ data: new Uint8Array([0x80, 52, 0]) });
    });
    expect(useMidiStore.getState().transposeTargets).toEqual([48, 52]);
  });
});

describe('Play Zone Last-Note Priority TDD Checkpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Test Cases 1, 2, 3: Play zone monophonic last-note priority when polyphonyMode === poly', async () => {
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
      transposeTarget: 64,
      transposeTargets: [64, 67], // E4, G4 chord (+4, +7 semitones)
      polyphonyMode: 'poly',
    });

    renderHook(() => useWebMidi());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Test Case 1: user holds C4 (60). C4 chord sounds (64, 67).
    act(() => {
      messageCallback!({ data: new Uint8Array([0x90, 60, 100]) });
    });
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x90, 64, 100]));
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x90, 67, 100]));

    // User plays D4 (62) while holding C4. D4 chord sounds (66, 69) and C4 chord cuts off (64, 67 Note Offs).
    act(() => {
      messageCallback!({ data: new Uint8Array([0x90, 62, 100]) });
    });
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x80, 64, 0]));
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x80, 67, 0]));
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x90, 66, 100]));
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x90, 69, 100]));

    // Test Case 2: User releases C4 (which was already silenced). Verify no new Note Offs are sent.
    const callsCountBeforeRelease = sendMock.mock.calls.length;
    act(() => {
      messageCallback!({ data: new Uint8Array([0x80, 60, 0]) });
    });
    expect(sendMock.mock.calls.length).toBe(callsCountBeforeRelease);

    // Test Case 3: User releases D4. Verify D4 chord receives Note Offs (66, 69).
    act(() => {
      messageCallback!({ data: new Uint8Array([0x80, 62, 0]) });
    });
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x80, 66, 0]));
    expect(sendMock).toHaveBeenCalledWith(new Uint8Array([0x80, 69, 0]));
  });
});



