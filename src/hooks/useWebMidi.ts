import { useEffect, useRef } from 'react';
import { useMidiStore, MidiStoreState } from '../store/useMidiStore';

export function useWebMidi() {
  const activeRoutedNotes = useRef<Map<number, { outNote: number, channel: number, velocity: number }>>(new Map());

  const triggerVisualNoteFeedback = (note: number, isActive: boolean, color: string) => {
    const el = document.getElementById(`pk88f-${note}`);
    if (!el) return;
    
    const isBlack = [1, 3, 6, 8, 10].includes(note % 12);
    if (isActive) {
      el.style.backgroundColor = color;
      el.style.boxShadow = `inset 0 0 10px rgba(255,255,255,0.4), 0 0 8px ${color}`;
    } else {
      // Restore default styling
      el.style.backgroundColor = isBlack ? '#3a3a3a' : '#ffffff';
      el.style.boxShadow = 'none';
    }
  };

  const calculateFinalNote = (incomingNote: number, state: MidiStoreState) => {
    const {
      playOctave,
      transposeTarget,
      transposeOrigin,
      filterRange,
      filterMode,
    } = state;

    const effectiveNote = incomingNote + (playOctave * 12);
    const delta = transposeTarget - transposeOrigin;
    let finalNote = effectiveNote + delta;

    // Apply Note Range Filter mapping
    const [min, max] = filterRange;
    let shouldDrop = false;

    if (filterMode === 'block') {
      if (finalNote < min || finalNote > max) {
        shouldDrop = true;
      }
    } else if (filterMode === 'limit') {
      finalNote = Math.max(min, Math.min(max, finalNote));
    } else if (filterMode === 'octave_wrap') {
      if (finalNote < min || finalNote > max) {
        while (finalNote < min) finalNote += 12;
        while (finalNote > max) finalNote -= 12;
        if (finalNote < min || finalNote > max) {
          shouldDrop = true;
        }
      }
    } else if (filterMode === 'wrap') {
      const rangeSize = max - min + 1;
      let offset = (finalNote - min) % rangeSize;
      if (offset < 0) {
        offset += rangeSize;
      }
      finalNote = min + offset;
      if (finalNote < min || finalNote > max) {
        shouldDrop = true;
      }
    }

    const outNote = Math.max(0, Math.min(127, finalNote));
    return { outNote, shouldDrop };
  };

  const { 
    setMidiInputs, 
    setMidiOutputs, 
    selectedInputId, 
    setSelectedInputId, 
    midiInputs,
    setMidiAccessStatus,
    setMidiErrorText 
  } = useMidiStore();

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      console.warn('Web MIDI API is not supported in this browser.');
      setMidiAccessStatus('unsupported');
      setMidiErrorText('Browser does not support Web MIDI');
      return;
    }

    let midiAccess: WebMidi.MIDIAccess | null = null;

    const updateDevices = () => {
      if (!midiAccess) return;
      const inputs = Array.from(midiAccess.inputs.values());
      const outputs = Array.from(midiAccess.outputs.values());
      setMidiInputs(inputs);
      setMidiOutputs(outputs);

      // Auto-select first input if none is currently selected
      const currentSelected = useMidiStore.getState().selectedInputId;
      if (!currentSelected && inputs.length > 0) {
        setSelectedInputId(inputs[0].id);
      }
    };

    navigator.requestMIDIAccess()
      .then((access) => {
        midiAccess = access;
        setMidiAccessStatus('granted');
        updateDevices();
        access.onstatechange = () => {
          updateDevices();
        };
      })
      .catch((err) => {
        console.error('Failed to get MIDI access:', err);
        setMidiAccessStatus('error');
        setMidiErrorText(err instanceof Error ? err.message : String(err));
      });

    return () => {
      if (midiAccess) {
        midiAccess.onstatechange = null;
      }
    };
  }, [setMidiInputs, setMidiOutputs, setSelectedInputId, setMidiAccessStatus, setMidiErrorText]);

  // Listen for MIDI messages on the selected input
  useEffect(() => {
    const selectedInput = midiInputs.find((input) => input.id === selectedInputId);
    if (!selectedInput) return;

    const handleMidiMessage = (event: WebMidi.MIDIMessageEvent) => {
      const data = event.data;
      if (!data || data.length < 3) return;

      const status = data[0];
      const statusType = status & 0xf0;
      const channel = status & 0x0f;

      // Only process Note On (0x90) and Note Off (0x80)
      if (statusType !== 0x90 && statusType !== 0x80) {
        // Forward non-note messages directly to outputs
        const state = useMidiStore.getState();
        state.midiOutputs.forEach((output) => {
          try {
            output.send(data);
          } catch (err) {
            console.error('Failed to forward MIDI message:', err);
          }
        });
        return;
      }

      const incomingNote = data[1];
      const velocity = data[2];
      const isNoteOn = statusType === 0x90 && velocity > 0;

      const state = useMidiStore.getState();

      // Zero-latency visual feedback for Input Keyboard
      const inputEl = document.getElementById(`pksplit-${incomingNote}`);
      const activeVisualZone = state.zones.find(z => incomingNote >= z.startNote && incomingNote <= z.endNote);
      if (inputEl) {
        const isBlack = [1, 3, 6, 8, 10].includes(incomingNote % 12);
        if (isNoteOn && activeVisualZone) {
          inputEl.style.backgroundColor = activeVisualZone.color;
          inputEl.style.boxShadow = `0 0 12px ${activeVisualZone.color}, inset 0 0 6px rgba(255,255,255,0.4)`;
        } else {
          const isAssigned = state.zones.some(z => incomingNote >= z.startNote && incomingNote <= z.endNote);
          if (isBlack) {
            inputEl.style.backgroundColor = isAssigned ? '#3a3a3a' : '#4a4a4a';
          } else {
            inputEl.style.backgroundColor = isAssigned ? '#ffffff' : '#8c8c8c';
          }
          inputEl.style.boxShadow = 'none';
        }
      }

      const {
        bypass,
        zones,
        transposeOctave,
        setTransposeTarget,
        midiOutputs,
      } = state;

      if (bypass) {
        // Bypass active: forward untouched
        midiOutputs.forEach((output) => {
          try {
            output.send(data);
          } catch (err) {
            console.error('Failed to forward MIDI message under bypass:', err);
          }
        });
        return;
      }

      const activeZone = zones.find(z => incomingNote >= z.startNote && incomingNote <= z.endNote);
      if (!activeZone) {
        return; // Drop note if no active zone
      }

      if (activeZone.type === 'transpose') {
        // Transpose Zone (Left)
        const effectiveNote = incomingNote + (transposeOctave * 12);
        if (isNoteOn) {
          setTransposeTarget(effectiveNote);
        }
        // Do NOT send to MIDI output.
      } else if (activeZone.type === 'play') {
        if (!isNoteOn) {
          // Note Off Handling: Use active routed note pitch if exists
          const activeNote = activeRoutedNotes.current.get(incomingNote);
          if (activeNote) {
            // Trigger visual feedback on the Output Keyboard using the old note
            triggerVisualNoteFeedback(activeNote.outNote, false, activeZone.color);

            // Send to physical MIDI outputs using the old channel/pitch
            const outMsg = new Uint8Array([0x80 | activeNote.channel, activeNote.outNote, velocity]);
            midiOutputs.forEach((output) => {
              try {
                output.send(outMsg);
              } catch (err) {
                console.error('Failed to send routed MIDI message:', err);
              }
            });
            activeRoutedNotes.current.delete(incomingNote);
          }
          return;
        }

        // Note On Handling
        const { outNote, shouldDrop } = calculateFinalNote(incomingNote, state);

        if (!shouldDrop) {
          // Trigger visual feedback on the Output Keyboard
          triggerVisualNoteFeedback(outNote, true, activeZone.color);

          // Send to physical MIDI outputs
          const outputStatus = 0x90 | channel;
          const outMsg = new Uint8Array([outputStatus, outNote, velocity]);
          midiOutputs.forEach((output) => {
            try {
              output.send(outMsg);
            } catch (err) {
              console.error('Failed to send routed MIDI message:', err);
            }
          });

          // Add to active notes tracking map
          activeRoutedNotes.current.set(incomingNote, { outNote, channel, velocity });
        }
      }
    };

    selectedInput.onmidimessage = handleMidiMessage;

    return () => {
      selectedInput.onmidimessage = null;
    };
  }, [selectedInputId, midiInputs]);

  // Handle active note cutoff/retrigger when transposeTarget changes
  useEffect(() => {
    const unsub = useMidiStore.subscribe((state, prevState) => {
      if (state.transposeTarget === prevState.transposeTarget) return;
      if (state.transposeHoldMode === 'sustain') return;

      activeRoutedNotes.current.forEach((activeData, incomingNote) => {
        // 1. Always send Note Off for the currently playing note
        state.midiOutputs.forEach(out => out.send(new Uint8Array([0x80 | activeData.channel, activeData.outNote, 0])));
        triggerVisualNoteFeedback(activeData.outNote, false, '#3b82f6');

        if (state.transposeHoldMode === 'cutoff') {
          activeRoutedNotes.current.delete(incomingNote);
        } 
        else if (state.transposeHoldMode === 'retrigger') {
          // 2. Calculate new note
          const { outNote: newOut, shouldDrop } = calculateFinalNote(incomingNote, state);
          if (!shouldDrop) {
            // 3. Send new Note On and update Map
            state.midiOutputs.forEach(out => out.send(new Uint8Array([0x90 | activeData.channel, newOut, activeData.velocity])));
            const activeZone = state.zones.find(z => incomingNote >= z.startNote && incomingNote <= z.endNote);
            const color = activeZone ? activeZone.color : '#3b82f6';
            triggerVisualNoteFeedback(newOut, true, color);
            activeRoutedNotes.current.set(incomingNote, { ...activeData, outNote: newOut });
          } else {
            activeRoutedNotes.current.delete(incomingNote);
          }
        }
      });
    });
    return unsub;
  }, []);

  return { activeRoutedNotes };
}
