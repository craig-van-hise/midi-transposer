import Header from './components/Header';
import KeySplitKeyboard from './components/keyboards/KeySplitKeyboard';
import TransposeKeyboard88 from './components/keyboards/TransposeKeyboard88';
import { NoteRangeFilterKeyboard } from './components/keyboards/NoteRangeFilterKeyboard';
import { useWebMidi } from './hooks/useWebMidi';

export default function App() {
  // Initialize MIDI device discovery and routing
  useWebMidi();

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden flex flex-col items-center pb-32">
      <div className="w-full bg-white shadow-sm">
        <Header />
      </div>
      
      <div className="flex flex-col gap-4 items-center w-full pt-4">
        <KeySplitKeyboard />
        <TransposeKeyboard88 />
        <NoteRangeFilterKeyboard />
      </div>
    </div>
  );
}
