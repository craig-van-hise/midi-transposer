import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import KeySplitKeyboard from './KeySplitKeyboard';
import { useMidiStore } from '../../store/useMidiStore';

describe('KeySplitKeyboard Overhaul Phase 3 TDD Checkpoint', () => {
  it('Test Case 1: Given zones are set, Assert keyboard renders Transpose and Play zones and no select elements for channels', () => {
    useMidiStore.setState({
      zones: [
        { id: 'z-trans', type: 'transpose', startNote: 21, endNote: 59, color: '#f43f5e', octave: 0 },
        { id: 'z-play', type: 'play', startNote: 60, endNote: 108, color: '#3b82f6', octave: 0 },
      ],
      transposeOctave: 0,
      playOctave: 0,
    });

    render(<KeySplitKeyboard />);

    // Transpose zone text should be in the DOM
    expect(screen.getByText('Transpose')).toBeInTheDocument();
    // Play zone text should be in the DOM
    expect(screen.getByText('Play')).toBeInTheDocument();

    // Check that channel select elements are removed
    const selects = screen.queryAllByRole('combobox');
    // The only combobox should be the settings or octave if any, but channel dropdowns should be gone
    // Let's explicitly check that there are no channel select elements.
    const channelSelects = selects.filter(select => select.className.includes('appearance-none'));
    expect(channelSelects).toHaveLength(0);
  });
});
