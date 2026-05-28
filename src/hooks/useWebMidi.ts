import { useEffect } from 'react';
import { useMidiStore } from '../store/useMidiStore';

export function useWebMidi() {
  const setMidiInputs = useMidiStore((state) => state.setMidiInputs);
  const setMidiOutputs = useMidiStore((state) => state.setMidiOutputs);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      console.warn('Web MIDI API is not supported in this browser.');
      return;
    }

    let midiAccess: WebMidi.MIDIAccess | null = null;

    const updateDevices = () => {
      if (!midiAccess) return;
      setMidiInputs(Array.from(midiAccess.inputs.values()));
      setMidiOutputs(Array.from(midiAccess.outputs.values()));
    };

    navigator.requestMIDIAccess()
      .then((access) => {
        midiAccess = access;
        updateDevices();
        access.onstatechange = () => {
          updateDevices();
        };
      })
      .catch((err) => {
        console.error('Failed to get MIDI access:', err);
      });

    return () => {
      if (midiAccess) {
        midiAccess.onstatechange = null;
      }
    };
  }, [setMidiInputs, setMidiOutputs]);
}
