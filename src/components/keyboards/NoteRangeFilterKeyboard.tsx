import React, { useState } from 'react';
import { FilterMode } from '../../store/useMidiStore';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const WHITE_KEY_WIDTH = 19;
export const WHITE_KEY_HEIGHT = 88;
export const BLACK_KEY_WIDTH = 11;
export const BLACK_KEY_HEIGHT = 56;
export const TOTAL_WIDTH = 988; // 52 white keys * 19px

export const getNoteCenterX = (note: number) => {
  // Clamp note to valid 88-key range for safety
  const clampedNote = Math.max(21, Math.min(108, note));
  const whiteKeyIndices = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  const isWhite = [0, 2, 4, 5, 7, 9, 11].includes(clampedNote % 12);
  
  // Calculate total white keys from MIDI 0, then subtract 12 (the number of white keys before MIDI 21)
  const whiteKeysBeforeIn88 = (Math.floor(clampedNote / 12) * 7 + whiteKeyIndices[clampedNote % 12]) - 12;
  
  if (isWhite) {
    return (whiteKeysBeforeIn88 + 0.5) * WHITE_KEY_WIDTH;
  } else {
    return (whiteKeysBeforeIn88 + 1) * WHITE_KEY_WIDTH;
  }
};

export const getClosestNote = (x: number) => {
  let minNote = 21;
  let minDist = Infinity;
  for (let i = 21; i <= 108; i++) {
    const cx = getNoteCenterX(i);
    const dist = Math.abs(cx - x);
    if (dist < minDist) {
      minDist = dist;
      minNote = i;
    }
  }
  return minNote;
};

// --- Mode Descriptions ---
const MODE_DESCRIPTIONS: Record<FilterMode, string> = {
  block: 'Mutes notes that fall outside the active range.',
  octave_wrap: 'Folds out-of-range notes by shifting them up or down by octaves until they fit.',
  wrap: 'Folds out-of-range notes back into the range directly.',
  limit: 'Clamps out-of-range notes to the nearest edge (min or max).'
};

// --- Subcomponent: RangeSlider ---
interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({ min, max, value, onValueChange }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [draggingThumb, setDraggingThumb] = React.useState<'min' | 'max' | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, thumb: 'min' | 'max') => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingThumb(thumb);
  };

  const handlePointerMove = React.useCallback((e: PointerEvent) => {
    if (!draggingThumb || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const note = getClosestNote(x);

    let newMin = value[0];
    let newMax = value[1];

    if (draggingThumb === 'min') {
      newMin = Math.min(Math.max(note, min), value[1]);
    } else {
      newMax = Math.max(Math.min(note, max), value[0]);
    }

    if (newMin !== value[0] || newMax !== value[1]) {
      onValueChange([newMin, newMax]);
    }
  }, [draggingThumb, value, min, max, onValueChange]);

  const handlePointerUp = React.useCallback(() => {
    if (draggingThumb) {
      setDraggingThumb(null);
    }
  }, [draggingThumb]);

  React.useEffect(() => {
    if (draggingThumb) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingThumb, handlePointerMove, handlePointerUp]);

  const x1 = getNoteCenterX(value[0]);
  const x2 = getNoteCenterX(value[1]);

  return (
    <div style={{ width: `${TOTAL_WIDTH}px`, display: 'flex', flexDirection: 'column' }}>
      <div 
        ref={containerRef}
        style={{ width: `${TOTAL_WIDTH}px`, height: '32px', position: 'relative', touchAction: 'none' }}
        className="select-none mx-auto"
      >
        {/* Background Track */}
        <div className="absolute top-[22px] left-0 right-0 h-[4px] bg-neutral-200 rounded-full" />
        
        {/* Active Range Track */}
        <div 
          className="absolute top-[22px] h-[4px] bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
          style={{ left: `${x1}px`, width: `${x2 - x1}px` }} 
        />

        {/* Thumbs */}
        <Thumb x={x1} value={value[0]} type="min" onPointerDown={(e) => handlePointerDown(e, 'min')} isDragging={draggingThumb === 'min'} />
        <Thumb x={x2} value={value[1]} type="max" onPointerDown={(e) => handlePointerDown(e, 'max')} isDragging={draggingThumb === 'max'} />
      </div>
    </div>
  );
};

const Thumb = ({ x, value, type, onPointerDown, isDragging }: { x: number, value: number, type: 'min' | 'max', onPointerDown: any, isDragging: boolean }) => {
  return (
    <div 
      onPointerDown={onPointerDown}
      className={`absolute top-[0px] flex flex-col items-center justify-center -translate-x-1/2 ${isDragging ? 'cursor-grabbing z-20' : 'cursor-grab z-10'}`}
      style={{ left: `${x}px` }}
      data-testid={`thumb-${type}`}
    >
      <div className="bg-neutral-900 border border-blue-500 text-white font-mono text-[10px] leading-none px-1.5 py-0.5 rounded shadow-lg mb-[2px] pointer-events-none whitespace-nowrap">
        {value}
      </div>
      <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none drop-shadow-md">
         <path d="M7 15L0 8V3C0 1.34315 1.34315 0 3 0H11C12.6569 0 14 1.34315 14 3V8L7 15Z" fill="#171717" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round"/>
         <line x1="7" y1="3" x2="7" y2="7" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
};

import { whiteKeys, blackKeys, NoteRects } from './keyboardMap';

// --- Subcomponent: Piano88Filter ---
interface Piano88FilterProps {
  minRange: number;
  maxRange: number;
}

export const Piano88Filter: React.FC<Piano88FilterProps> = ({ minRange, maxRange }) => {
  return (
    <div
      id="piano-container-88"
      data-testid="piano-container-88"
      className="relative flex w-[988px] h-[88px] bg-white pointer-events-auto border-t border-[#7a7a7a]"
      style={{
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
      }}
    >
      {whiteKeys.map((n) => {
        const isOutOfRange = n < minRange || n > maxRange;
        const isC = n % 12 === 0;
        const octave = Math.floor(n / 12) - 1;
        return (
          <div
            key={n}
            id={`pk88f-${n}`}
            data-testid={`white-key-${n}`}
            className="relative flex items-end justify-center pb-[4px]"
            style={{
              width: '19px',
              height: '88px',
              flexShrink: 0,
              backgroundColor: '#ffffff',
              borderLeft: '1px solid #7a7a7a',
              borderRight: '1px solid #7a7a7a',
              borderBottom: '1px solid #7a7a7a',
              borderTop: 'none',
              borderBottomLeftRadius: '4px',
              borderBottomRightRadius: '4px',
              boxSizing: 'border-box'
            }}
          >
            {isOutOfRange && (
              <div style={{
                position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.15)', pointerEvents: 'none', zIndex: 1
              }} data-testid={`dim-w-${n}`} />
            )}
            {isC && (
              <span 
                style={{
                  color: '#111827',
                  fontWeight: '600',
                  fontSize: '10px',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  zIndex: 2
                }}
              >
                C{octave}
              </span>
            )}
          </div>
        );
      })}

      {blackKeys.map((n) => {
        const isOutOfRange = n < minRange || n > maxRange;
        return (
          <div
            key={n}
            id={`pk88f-${n}`}
            data-testid={`black-key-${n}`}
            className="absolute z-10"
            style={{
              left: `${NoteRects[n].x}px`,
              top: '-1px',
              width: '11px',
              height: '56px',
              backgroundColor: '#3a3a3a',
              borderBottom: '8px solid #050505',
              borderLeft: '2px solid #050505',
              borderRight: '2px solid #050505',
              borderTop: 'none',
              borderRadius: '0px',
              boxSizing: 'border-box'
            }}
          >
            {isOutOfRange && (
              <div style={{
                position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', pointerEvents: 'none', zIndex: 12
              }} data-testid={`dim-b-${n}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export interface NoteRangeFilterKeyboardProps {
  activeMode?: FilterMode;
  onModeChange?: (mode: FilterMode) => void;
  range?: [number, number];
  onRangeChange?: (range: [number, number]) => void;
}

export const NoteRangeFilterKeyboard: React.FC<NoteRangeFilterKeyboardProps> = ({
  activeMode: externalMode,
  onModeChange: externalOnModeChange,
  range: externalRange,
  onRangeChange: externalOnRangeChange,
}) => {
  const [internalMode, setInternalMode] = React.useState<FilterMode>('block');
  const [internalRange, setInternalRange] = React.useState<[number, number]>([21, 108]);

  const activeMode = externalMode !== undefined ? externalMode : internalMode;
  const onModeChange = externalOnModeChange !== undefined ? externalOnModeChange : setInternalMode;

  const range = externalRange !== undefined ? externalRange : internalRange;
  const onRangeChange = externalOnRangeChange !== undefined ? externalOnRangeChange : setInternalRange;

  const [hoveredMode, setHoveredMode] = React.useState<FilterMode | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      className={`relative bg-white rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.15)] border border-neutral-200 outline-none w-[1020px] flex flex-col focus:ring-4 ring-blue-100 select-none transition-all duration-300 mx-auto ${isCollapsed ? 'h-[40px] overflow-hidden pt-1 pb-1 px-[16px]' : 'pt-4 pb-4 px-[16px]'}`}
      data-testid="outer-card"
      tabIndex={0}
    >
      <div className="relative w-full h-[32px] flex items-center">
        {/* Collapse Toggle / Output label */}
        <div 
          className="flex items-center gap-1.5 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
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
          <span className="font-semibold text-[14px] text-gray-700 select-none">Output</span>
        </div>

        {!isCollapsed && (
          <div className="absolute left-[446px] -translate-x-1/2 flex items-center gap-4">
            <label className="text-xs font-bold tracking-widest text-neutral-400 uppercase">FILTER MODE</label>
            <div className="flex p-1 rounded-lg border border-neutral-300 bg-neutral-50 z-20" data-testid="toggle-container">
              {(['block', 'octave_wrap', 'wrap', 'limit'] as FilterMode[]).map((mode) => (
                <div key={mode} className="relative flex items-center justify-center">
                  <button
                    onClick={() => onModeChange(mode)}
                    onMouseEnter={() => setHoveredMode(mode)}
                    onMouseLeave={() => setHoveredMode(null)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeMode === mode 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                    }`}
                  >
                    {mode === 'block' ? 'Block' :
                     mode === 'octave_wrap' ? 'Octave Wrap' :
                     mode === 'wrap' ? 'Wrap' : 'Limit'}
                  </button>
                  {hoveredMode === mode && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white text-neutral-800 text-xs px-3 py-2 rounded shadow-lg border border-neutral-200 w-48 text-center pointer-events-none animate-in fade-in zoom-in-95 duration-150" data-testid="tooltip">
                      {MODE_DESCRIPTIONS[mode]}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-neutral-700" data-testid="tooltip-caret" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="relative w-[988px] mx-auto flex flex-col items-center gap-1" data-testid="coordinate-lock-container">
          <RangeSlider 
            min={21} 
            max={108} 
            value={range} 
            onValueChange={onRangeChange} 
          />
          <Piano88Filter minRange={range[0]} maxRange={range[1]} />
        </div>
      )}
    </div>
  );
};
