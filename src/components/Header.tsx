import { useState } from 'react';
import { Power, Info, Settings, TriangleAlert } from 'lucide-react';
import { useMidiStore } from '../store/useMidiStore';

export default function Header() {
  const {
    bypass,
    toggleBypass,
    panic,
    activeChannels,
    setActiveChannels,
    midiInputs,
    selectedInputId,
    setSelectedInputId,
    midiAccessStatus,
    midiErrorText
  } = useMidiStore();
  const [showInfo, setShowInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const toggleChannel = (ch: number) => {
    if (activeChannels.includes(ch)) {
      setActiveChannels(activeChannels.filter((c) => c !== ch));
    } else {
      setActiveChannels([...activeChannels, ch].sort((a, b) => a - b));
    }
  };

  return (
    <header className="flex justify-between items-center bg-white border-b border-neutral-200 px-6 py-4 shadow-sm w-full select-none text-neutral-800">
      <div className="flex items-center gap-2">
        <h1 className="font-extrabold text-xl tracking-tight text-neutral-900">
          MIDI Transposer
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* MIDI Selector */}
        {midiAccessStatus === 'unsupported' ? (
          <span className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-xs font-semibold shadow-sm">
            Browser Unsupported (Use Chrome/Edge)
          </span>
        ) : midiAccessStatus === 'error' ? (
          <span className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-xs font-semibold shadow-sm">
            Error: {midiErrorText}
          </span>
        ) : (
          <select
            data-testid="midi-input-select"
            value={selectedInputId || ''}
            onChange={(e) => setSelectedInputId(e.target.value || null)}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-sm"
          >
            {midiInputs.length === 0 ? (
              <option value="">
                {midiAccessStatus === 'granted'
                  ? "0 Devices (Check if DAW has exclusive lock)"
                  : "No MIDI inputs detected"}
              </option>
            ) : (
              midiInputs.map((input) => (
                <option key={input.id} value={input.id}>
                  {input.name || `MIDI Device ${input.id}`}
                </option>
              ))
            )}
          </select>
        )}

        {/* Power Button */}
        <button
          onClick={toggleBypass}
          className={`p-2 rounded-full border transition-all cursor-pointer ${
            !bypass
              ? 'bg-emerald-500 text-white border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
              : 'bg-neutral-100 text-neutral-400 border-neutral-300 hover:bg-neutral-200'
          }`}
          title={bypass ? 'Bypassed (Turn ON)' : 'Active (Turn OFF)'}
          data-testid="power-button"
        >
          <Power size={20} />
        </button>

        {/* Panic Button */}
        <button
          onClick={panic}
          className="p-2 rounded-full border bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 transition-all cursor-pointer shadow-sm"
          title="MIDI Panic (All Notes Off)"
          data-testid="panic-button"
        >
          <TriangleAlert size={20} />
        </button>

        {/* Info Button */}
        <button
          onClick={() => setShowInfo(true)}
          className="p-2 rounded-full border bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100 transition-all cursor-pointer shadow-sm"
          title="Information"
          data-testid="info-button"
        >
          <Info size={20} />
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-full border bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100 transition-all cursor-pointer shadow-sm"
          title="Settings"
          data-testid="settings-button"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200"
          data-testid="info-modal"
        >
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xl max-w-sm w-full relative">
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 font-bold text-lg cursor-pointer"
            >
              &times;
            </button>
            <h2 className="text-lg font-extrabold mb-3 text-neutral-900 font-sans">
              MIDI Transposer
            </h2>
            <p className="text-neutral-500 text-sm mb-2 leading-relaxed">
              A real-time MIDI processing utility featuring note splitting, transposing, and filtering.
            </p>
            <p className="text-neutral-400 text-xs mb-6">
              by Craig Van Hise
            </p>
            <div className="border-t border-neutral-100 pt-4 flex flex-col gap-2">
              <a
                href="https://virtualvirgin.net"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                virtualvirgin.net
              </a>
              <a
                href="https://github.com/craig-van-hise"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Github Profile
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200"
          data-testid="settings-modal"
        >
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xl max-w-md w-full relative">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 font-bold text-lg cursor-pointer"
            >
              &times;
            </button>
            <h2 className="text-lg font-extrabold mb-4 text-neutral-900">
              MIDI Input Channels
            </h2>
            <p className="text-neutral-500 text-xs mb-4">
              Toggle channels to enable/disable processing. Disabled channels are passed through untouched.
            </p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Array.from({ length: 16 }, (_, i) => {
                const ch = i + 1;
                const isActive = activeChannels.includes(ch);
                return (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={`py-2 rounded-md font-bold text-xs border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
                    }`}
                    data-testid={`channel-toggle-${ch}`}
                  >
                    Ch {ch}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between mt-4 border-t border-neutral-100 pt-4">
              <button
                onClick={() => setActiveChannels(Array.from({ length: 16 }, (_, i) => i + 1))}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Select All
              </button>
              <button
                onClick={() => setActiveChannels([])}
                className="text-xs text-neutral-500 hover:underline font-semibold cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
