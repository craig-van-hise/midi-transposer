import React, { useEffect } from 'react';
import Header from './components/Header';
import KeySplitKeyboard from './components/keyboards/KeySplitKeyboard';
import TransposeKeyboard88 from './components/keyboards/TransposeKeyboard88';
import { NoteRangeFilterKeyboard } from './components/keyboards/NoteRangeFilterKeyboard';
import { useMidiStore } from './store/useMidiStore';
import { useWebMidi } from './hooks/useWebMidi';
import { processMidiMessage } from './utils/midiPipeline';

export default function App() {
  // Initialize MIDI device discovery
  useWebMidi();

  const {
    midiInputs,
    midiOutputs,
    zones,
    setZones,
    transposeAmount,
    setTransposeAmount,
    filterMode,
    setFilterMode,
    filterRange,
    setFilterRange,
  } = useMidiStore();

  // Wire MIDI input listening to the pipeline
  useEffect(() => {
    const handleMidiMessage = (event: WebMidi.MIDIMessageEvent) => {
      const state = useMidiStore.getState();
      const outputMessages = processMidiMessage(event.data, state);

      // Send to all available outputs
      state.midiOutputs.forEach((output) => {
        outputMessages.forEach((msg) => {
          try {
            output.send(msg);
          } catch (err) {
            console.error('Failed to send MIDI message:', err);
          }
        });
      });
    };

    midiInputs.forEach((input) => {
      input.onmidimessage = handleMidiMessage;
    });

    return () => {
      midiInputs.forEach((input) => {
        input.onmidimessage = null;
      });
    };
  }, [midiInputs]);

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden flex flex-col items-center pb-32">
      <div className="w-full bg-white shadow-sm">
        <Header />
      </div>
      
      <div className="flex flex-col gap-4 items-center w-full pt-4">
        <KeySplitKeyboard onZonesChange={setZones} />
        <TransposeKeyboard88 onTransposeChange={setTransposeAmount} />
        <NoteRangeFilterKeyboard
          activeMode={filterMode}
          onModeChange={setFilterMode}
          range={filterRange}
          onRangeChange={setFilterRange}
        />
      </div>
    </div>
  );
}
