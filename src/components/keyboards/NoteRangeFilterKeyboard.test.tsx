import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteRangeFilterKeyboard } from './NoteRangeFilterKeyboard';
import { useMidiStore } from '../../store/useMidiStore';

describe('NoteRangeFilterKeyboard Zustand Wiring Phase 4 TDD Checkpoint', () => {
  it('Test Case 1: Given filterMode is block and filterRange is [40, 80], Assert component renders with store values and updates store on toggle click', () => {
    useMidiStore.setState({
      filterMode: 'block',
      filterRange: [40, 80],
    });

    render(<NoteRangeFilterKeyboard />);

    // Click Settings gear to open modal
    const settingsBtn = screen.getByTitle('Output Filter Settings');
    fireEvent.click(settingsBtn);

    // Renders active mode 'block' as checked radio
    const blockRadio = screen.getByDisplayValue('block') as HTMLInputElement;
    expect(blockRadio.checked).toBe(true);

    // Click Limit option
    const limitRadio = screen.getByDisplayValue('limit') as HTMLInputElement;
    fireEvent.click(limitRadio);

    // Verify store has updated
    expect(useMidiStore.getState().filterMode).toBe('limit');
  });
});
