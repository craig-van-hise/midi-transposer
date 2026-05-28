import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import App from './App';

describe('Application Assembly Phase 5.5 TDD Checkpoint', () => {
  it('Test Case 1: Given App renders, Assert all three keyboard components and Header are present in DOM', async () => {
    const mockMidiAccess = {
      inputs: new Map(),
      outputs: new Map(),
      onstatechange: null,
    } as unknown as WebMidi.MIDIAccess;

    vi.stubGlobal('navigator', {
      requestMIDIAccess: vi.fn().mockResolvedValue(mockMidiAccess),
    });

    let container: HTMLElement;
    await act(async () => {
      const rendered = render(<App />);
      container = rendered.container;
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

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
