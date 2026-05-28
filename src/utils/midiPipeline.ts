import { MidiStoreState } from '../store/useMidiStore';

export function processMidiMessage(
  message: Uint8Array,
  state: MidiStoreState
): Uint8Array[] {
  if (message.length === 0) return [];

  const status = message[0];
  const statusType = status & 0xf0;
  const channel = (status & 0x0f) + 1; // 1-16

  // Only process Note On (0x90) and Note Off (0x80)
  if (statusType !== 0x90 && statusType !== 0x80) {
    return [message];
  }

  if (state.bypass) {
    return [message];
  }

  // 2. Channel Filter
  if (!state.activeChannels.includes(channel)) {
    return [message];
  }

  const originalNote = message[1];
  const velocity = message[2];

  // 3. Split Stage
  const matchingZones = state.zones.filter(
    (z) => originalNote >= z.startNote && originalNote <= z.endNote
  );

  if (matchingZones.length === 0) {
    return [];
  }

  const outputMessages: Uint8Array[] = [];

  for (const zone of matchingZones) {
    let note = originalNote;

    // Apply zone octave shift
    note += zone.octave * 12;

    // Map to zone's channel
    const targetChannel = channel - 1; // 0-15
    const targetStatus = statusType | targetChannel;

    // 4. Transpose Stage
    note += state.transposeAmount;

    // 5. Filter Stage
    const [min, max] = state.filterRange;
    let shouldDrop = false;

    if (state.filterMode === 'block') {
      if (note < min || note > max) {
        shouldDrop = true;
      }
    } else if (state.filterMode === 'limit') {
      note = Math.max(min, Math.min(max, note));
    } else if (state.filterMode === 'octave_wrap') {
      if (note < min || note > max) {
        while (note < min) note += 12;
        while (note > max) note -= 12;
        if (note < min || note > max) {
          shouldDrop = true;
        }
      }
    } else if (state.filterMode === 'wrap') {
      const rangeSize = max - min + 1;
      let offset = (note - min) % rangeSize;
      if (offset < 0) {
        offset += rangeSize;
      }
      note = min + offset;
      if (note < min || note > max) {
        shouldDrop = true;
      }
    } else if (state.filterMode === 'smart_wrap') {
      if (note < min || note > max) {
        // Safe positive modulo for pitch class (0-11)
        const pc = ((note % 12) + 12) % 12;

        if (note > max) {
          // Exceeded top. Find lowest valid note at the bottom.
          let wrapped = min - (min % 12) + pc;
          if (wrapped < min) wrapped += 12;

          if (wrapped <= max) {
            note = wrapped;
          } else {
            shouldDrop = true; // Pitch class does not exist in this narrow range
          }
        } else if (note < min) {
          // Exceeded bottom. Find highest valid note at the top.
          let wrapped = max - (max % 12) + pc;
          if (wrapped > max) wrapped -= 12;

          if (wrapped >= min) {
            note = wrapped;
          } else {
            shouldDrop = true;
          }
        }
      }
    }


    if (!shouldDrop) {
      const finalNote = Math.max(0, Math.min(127, note));
      outputMessages.push(new Uint8Array([targetStatus, finalNote, velocity]));
    }
  }

  return outputMessages;
}
