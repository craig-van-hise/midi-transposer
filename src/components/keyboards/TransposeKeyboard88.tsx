import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useMidiStore } from '../../store/useMidiStore';

export interface NoteRect {
  note: number;
  x: number;
  w: number;
  isBlack: boolean;
}

// Pre-calculate exact layout for all 88 keys based on standard piano topography
const NoteRects: Record<number, NoteRect> = {};
const whiteKeys: number[] = [];
const blackKeys: number[] = [];

let currentX = 0;
for (let n = 21; n <= 108; n++) {
  // Pattern of black keys starting from C: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
  const relativeToC = n % 12;
  const isBlack = [false, true, false, true, false, false, true, false, true, false, true, false][relativeToC];
  
  if (isBlack) {
    // Topographically, a black key visually straddles the seam between the two adjacent white keys
    // Since currentX tracks the seam (end of previous white key, start of next), this centers it perfectly.
    NoteRects[n] = { note: n, x: currentX - 5.5, w: 11, isBlack: true };
    blackKeys.push(n);
  } else {
    NoteRects[n] = { note: n, x: currentX, w: 19, isBlack: false };
    whiteKeys.push(n);
    currentX += 19;
  }
}

const DEFAULT_ORIGIN = 60; // C4

export interface TransposeKeyboard88Props {
  onTransposeChange?: (amount: number) => void;
}

export default function TransposeKeyboard88({ onTransposeChange }: TransposeKeyboard88Props = {}) {
  const {
    transposeOrigin: originNote,
    setTransposeOrigin: setOriginNote,
    transposeTarget: targetNote,
    setTransposeTarget: setTargetNote,
    transposeHoldMode,
    setTransposeHoldMode,
  } = useMidiStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    onTransposeChange?.(targetNote - originNote);
  }, [targetNote, originNote, onTransposeChange]);
  
  // We need a ref to the keyboard wrapper to measure local coordinates
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [originX, setOriginX] = useState(() => {
    const r = NoteRects[DEFAULT_ORIGIN];
    return r ? r.x + (r.w / 2) : 0;
  });
  const [handleX, setHandleX] = useState(() => {
    const r = NoteRects[DEFAULT_ORIGIN];
    return r ? r.x + (r.w / 2) : 0;
  });

  // Recalculate positions based on DOM
  const updatePositions = () => {
    if (!wrapperRef.current) return;
    
    // Find origin center
    let originCenter = 0;
    const originEl = document.getElementById(`pktranspose-${originNote}`);
    if (originEl && wrapperRef.current) {
        const originRect = originEl.getBoundingClientRect();
        const wrapperRect = wrapperRef.current.getBoundingClientRect();
        originCenter = originRect.left - wrapperRect.left + (originRect.width / 2);
        setOriginX(originCenter);
    } else {
        // Fallback to static metrics
        const r = NoteRects[originNote];
        originCenter = r ? r.x + (r.w / 2) : 0;
        setOriginX(originCenter);
    }
    
    // Find current target center
    const targetEl = document.getElementById(`pktranspose-${targetNote}`);
    if (targetEl && wrapperRef.current) {
        const targetRect = targetEl.getBoundingClientRect();
        const wrapperRect = wrapperRef.current.getBoundingClientRect();
        setHandleX(targetRect.left - wrapperRect.left + (targetRect.width / 2));
    } else {
        const r = NoteRects[targetNote];
        if (r) {
            setHandleX(r.x + (r.w / 2));
        }
    }
  };

  useEffect(() => {
    updatePositions();
    // A small timeout to ensure DOM layout is complete for initial load
    const timer = setTimeout(updatePositions, 50);
    return () => clearTimeout(timer);
  }, [originNote, targetNote, isCollapsed]);

  const getClosestNote = (localX: number) => {
    let best = 21;
    let minDiff = Infinity;
    for (let n = 21; n <= 108; n++) {
      const el = document.getElementById(`pktranspose-${n}`);
      let noteCenter = 0;
      if (el && wrapperRef.current) {
         const rect = el.getBoundingClientRect();
         const wRect = wrapperRef.current.getBoundingClientRect();
         noteCenter = rect.left - wRect.left + (rect.width / 2);
      } else {
         const r = NoteRects[n];
         noteCenter = r ? r.x + (r.w / 2) : 0;
      }
      
      const diff = Math.abs(noteCenter - localX);
      if (diff < minDiff) {
        minDiff = diff;
        best = n;
      }
    }
    return best;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const note = getClosestNote(localX);
      setTargetNote(note);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleTrackMouseDown = (e: React.MouseEvent) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const note = getClosestNote(localX);
    setTargetNote(note);
    setIsDragging(true);
  };

  const handleKeyClick = (e: React.MouseEvent, note: number) => {
    if (e.shiftKey || e.altKey) {
      setOriginNote(note);
    } else {
      setTargetNote(note);
    }
  };

  const transposeValue = targetNote - originNote;
  const trackFillStart = Math.min(originX, handleX);
  const trackFillWidth = Math.abs(handleX - originX);
  
  // Format the label with explicit + or - sign
  const displayLabel = transposeValue > 0 ? `+${transposeValue}` : `${transposeValue}`;
  
  return (
    <div 
      className={`relative bg-white rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.15)] outline-none w-[1020px] flex flex-col focus:ring-4 ring-rose-100 select-none transition-all duration-300 ${isCollapsed ? 'h-[40px]' : 'pt-[36px] pb-[16px] px-[16px]'}`}
      tabIndex={0}
    >
      {/* Collapse Toggle */}
      <div 
        className="absolute top-[10px] left-[14px] flex items-center gap-1.5 cursor-pointer z-30 opacity-70 hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          setIsCollapsed(!isCollapsed);
        }}
        title="Toggle Keyboard"
      >
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-gray-700" strokeWidth={2.5} />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-700" strokeWidth={2.5} />
        )}
        <span className="font-semibold text-[14px] text-gray-700 select-none">Transpose</span>
      </div>

      {/* Transpose Settings Gear Icon / Dropdown */}
      <div 
        className="absolute top-[10px] right-[14px] flex items-center z-30"
        ref={settingsRef}
      >
        <Settings 
          className="w-4 h-4 text-gray-700 cursor-pointer opacity-70 hover:opacity-100 transition-opacity" 
          strokeWidth={2.5}
          onClick={(e) => {
            e.stopPropagation();
            setIsSettingsOpen(!isSettingsOpen);
          }}
          title="Transpose Settings" 
        />
        {isSettingsOpen && (
          <div className="absolute right-0 top-[24px] w-[240px] bg-white border border-gray-200 rounded-md shadow-lg p-3 z-50 flex flex-col gap-2.5 text-left font-sans select-none text-gray-800">
            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Transpose Hold Mode</span>
            <div className="flex flex-col gap-2">
              <label className="flex items-start gap-2 cursor-pointer text-[13px] hover:bg-gray-50 p-1.5 rounded">
                <input 
                  type="radio" 
                  name="holdMode" 
                  value="sustain" 
                  checked={transposeHoldMode === 'sustain'} 
                  onChange={() => setTransposeHoldMode('sustain')}
                  className="mt-[3px] accent-rose-500 cursor-pointer"
                />
                <div>
                  <div className="font-semibold text-gray-800">Sustain Original</div>
                  <div className="text-[11px] text-gray-500 font-normal leading-tight">Notes finish playing on their original pitch.</div>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer text-[13px] hover:bg-gray-50 p-1.5 rounded">
                <input 
                  type="radio" 
                  name="holdMode" 
                  value="cutoff" 
                  checked={transposeHoldMode === 'cutoff'} 
                  onChange={() => setTransposeHoldMode('cutoff')}
                  className="mt-[3px] accent-rose-500 cursor-pointer"
                />
                <div>
                  <div className="font-semibold text-gray-800">Immediate Cutoff</div>
                  <div className="text-[11px] text-gray-500 font-normal leading-tight">Held notes are instantly silenced.</div>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer text-[13px] hover:bg-gray-50 p-1.5 rounded">
                <input 
                  type="radio" 
                  name="holdMode" 
                  value="retrigger" 
                  checked={transposeHoldMode === 'retrigger'} 
                  onChange={() => setTransposeHoldMode('retrigger')}
                  className="mt-[3px] accent-rose-500 cursor-pointer"
                />
                <div>
                  <div className="font-semibold text-gray-800">Retrigger</div>
                  <div className="text-[11px] text-gray-500 font-normal leading-tight">Held notes instantly shift to the new pitch.</div>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Upper Control Surface - Transpose Slider */}
          <div className="relative w-[988px] h-[32px] mb-1 flex items-center">
            {/* The Track Container */}
            <div 
               className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-[8px] rounded-full bg-gray-200 cursor-pointer shadow-inner"
               onMouseDown={handleTrackMouseDown}
            >
              {/* Neutral Center Notch for Origin Note */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-[2px] h-[16px] bg-gray-400 z-10"
                style={{ left: originX - 1 }}
              />
              
              {/* Dynamic Fill */}
              <div 
                className="absolute top-0 bottom-0 bg-rose-500 rounded-full transition-all duration-75"
                style={{ 
                   left: trackFillStart, 
                   width: trackFillWidth 
                }}
              />
            </div>

            {/* The Pointer Handle */}
            <div 
              className="absolute top-1/2 -translate-y-[65%] flex flex-col items-center justify-center cursor-ew-resize z-20 group transition-transform duration-75"
              style={{ left: handleX - 20 }}
              onMouseDown={(e) => {
                 e.stopPropagation();
                 setIsDragging(true);
              }}
            >
              <div className="w-[40px] h-[26px] bg-white border-2 border-rose-500 rounded-md shadow-md flex items-center justify-center font-mono text-sm font-bold text-gray-800 z-10">
                {displayLabel}
              </div>
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-rose-500 -mt-[1px] z-0" />
            </div>
          </div>

          {/* Lower Surface - Physical Keyboard */}
          <div ref={wrapperRef} id="keyboard-wrapper" className="relative flex w-[988px] h-[88px] bg-white pointer-events-auto border-t border-[#7a7a7a]" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
            {whiteKeys.map((n) => {
              const isActive = n === targetNote;
              const isOrigin = n === originNote;
              const isC = n % 12 === 0;
              const octave = Math.floor(n / 12) - 1;
              return (
                <div
                  key={n}
                  id={`pktranspose-${n}`}
                  className="relative transition-colors duration-75 flex items-end justify-center pb-[4px]"
                  style={{
                    width: '19px',
                    height: '88px',
                    flexShrink: 0,
                    backgroundColor: isActive ? '#f43f5e' : (isOrigin ? '#f3f4f6' : '#ffffff'),
                    borderLeft: '1px solid #7a7a7a',
                    borderRight: '1px solid #7a7a7a',
                    borderBottom: '1px solid #7a7a7a',
                    borderTop: 'none',
                    borderBottomLeftRadius: '4px',
                    borderBottomRightRadius: '4px',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    boxShadow: isActive ? 'inset 0 0 10px rgba(255,255,255,0.4), 0 0 8px rgba(244,63,94,0.6)' : 'none',
                  }}
                  onMouseDown={(e) => handleKeyClick(e, n)}
                >
                  {isC && (
                    <span 
                      style={{
                        color: '#111827',
                        fontWeight: '600',
                        fontSize: '10px',
                        pointerEvents: 'none',
                        userSelect: 'none'
                      }}
                    >
                      C{octave}
                    </span>
                  )}
                </div>
              );
            })}
            
            {blackKeys.map((n) => {
              const isActive = n === targetNote;
              const isOrigin = n === originNote;
              return (
                <div
                  key={n}
                  id={`pktranspose-${n}`}
                  className={`absolute z-10 transition-colors duration-75`}
                  style={{
                    left: `${NoteRects[n].x}px`,
                    top: '-1px',
                    width: '11px',
                    height: '56px',
                    backgroundColor: isActive ? '#f43f5e' : (isOrigin ? '#4b5563' : '#3a3a3a'),
                    borderBottom: '8px solid #050505',
                    borderLeft: '2px solid #050505',
                    borderRight: '2px solid #050505',
                    borderTop: 'none',
                    borderRadius: '0px',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    boxShadow: isActive ? 'inset 0 0 6px rgba(255,255,255,0.4), 0 0 10px rgba(244,63,94,0.8)' : 'none',
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleKeyClick(e, n);
                  }}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
