import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from './App';

describe('Application Assembly Phase 5.5 TDD Checkpoint', () => {
  it('Test Case 1: Given App renders, Assert all three keyboard components and Header are present in DOM', () => {
    const { container } = render(<App />);

    // Assert Header is present
    expect(screen.getByText('MIDI Transposer')).toBeInTheDocument();

    // KeySplitKeyboard contains channel badge selectors
    const channelSelect = container.querySelector('select');
    expect(channelSelect).toBeInTheDocument();

    // TransposeKeyboard88 contains the transpose label
    expect(screen.getAllByText('Transpose')[0]).toBeInTheDocument();

    // NoteRangeFilterKeyboard contains the block mode filter button
    expect(screen.getByText('Block')).toBeInTheDocument();
  });
});
