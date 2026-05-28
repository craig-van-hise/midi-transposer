export interface Zone {
  id: string;
  startNote: number;
  endNote: number;
  channel: number;
  color: string;
  octave: number;
}

export interface NoteRect {
  note: number;
  x: number;
  w: number;
  isBlack: boolean;
}

// Pre-calculate exact layout for all 88 keys based on standard piano topography
export const NoteRects: Record<number, NoteRect> = {};
export const whiteKeys: number[] = [];
export const blackKeys: number[] = [];

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

export const getLeftBound = (note: number) => {
  const el = document.getElementById(`pksplit-${note}`);
  const baseLeft = el ? el.offsetLeft : NoteRects[note].x;

  if (!NoteRects[note].isBlack) {
    const prevNote = note - 1;
    if (NoteRects[prevNote] && NoteRects[prevNote].isBlack) {
      const prevEl = document.getElementById(`pksplit-${prevNote}`);
      if (prevEl) {
        return prevEl.offsetLeft + prevEl.offsetWidth;
      }
      return NoteRects[prevNote].x + NoteRects[prevNote].w;
    }
  }
  return baseLeft;
};

export const getRightBound = (note: number) => {
  const el = document.getElementById(`pksplit-${note}`);
  const baseRight = el ? el.offsetLeft + el.offsetWidth : NoteRects[note].x + NoteRects[note].w;

  if (!NoteRects[note].isBlack) {
    const nextNote = note + 1;
    if (NoteRects[nextNote] && NoteRects[nextNote].isBlack) {
      const nextEl = document.getElementById(`pksplit-${nextNote}`);
      if (nextEl) {
        return nextEl.offsetLeft;
      }
      return NoteRects[nextNote].x;
    }
  }
  return baseRight;
};

export const getStartNoteFromX = (x: number): number => {
  let best = 21;
  let minDiff = Infinity;
  for (let n = 21; n <= 108; n++) {
    const d = Math.abs(x - getLeftBound(n));
    if (d < minDiff) { 
      minDiff = d; 
      best = n; 
    }
  }
  return best;
};

export const getEndNoteFromX = (x: number): number => {
  let best = 21;
  let minDiff = Infinity;
  for (let n = 21; n <= 108; n++) {
    const d = Math.abs(x - getRightBound(n));
    if (d < minDiff) { 
      minDiff = d; 
      best = n; 
    }
  }
  return best;
};

export const COLORS = [
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#10b981', // emerald
  '#a855f7', // purple
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#f97316', // orange
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#d946ef', // fuchsia
  '#0ea5e9', // sky
  '#eab308'  // yellow
];

export const getNextColor = (zones: Zone[]) => {
  const used = new Set(zones.map(z => z.color));
  return COLORS.find(c => !used.has(c)) || COLORS[0];
};

export const getNextChannel = (zones: Zone[]) => {
  const used = new Set(zones.map(z => z.channel));
  for (let i = 1; i <= 16; i++) {
    if (!used.has(i)) return i;
  }
  return 1;
};
