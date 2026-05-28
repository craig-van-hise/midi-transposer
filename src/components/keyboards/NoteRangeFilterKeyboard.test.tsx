import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { NoteRangeFilterKeyboard } from './NoteRangeFilterKeyboard';
import { useMidiStore } from '../../store/useMidiStore';

describe('NoteRangeFilterKeyboard Zustand Wiring Phase 4 TDD Checkpoint', () => {
  it('Test Case 1: Given filterMode is block and filterRange is [40, 80], Assert component renders with store values and updates store on toggle click', () => {
    useMidiStore.setState({
      filterMode: 'block',
      filterRange: [40, 80],
    });

    render(<NoteRangeFilterKeyboard />);

    // Renders active mode 'block' (active button class has bg-blue-600)
    const blockBtn = screen.getByRole('button', { name: 'Block' });
    expect(blockBtn).toHaveClass('bg-blue-600');

    // Click Limit button
    const limitBtn = screen.getByRole('button', { name: 'Limit' });
    fireEvent.click(limitBtn);

    // Verify store has updated
    expect(useMidiStore.getState().filterMode).toBe('limit');
  });
});
