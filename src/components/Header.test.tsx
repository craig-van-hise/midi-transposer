import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Header from './Header';
import { useMidiStore } from '../store/useMidiStore';

describe('Header & Modals UI Phase 3 TDD Checkpoint', () => {
  it('Test Case 0a: Given unsupported MIDI status, Assert unsupported text badge renders', () => {
    useMidiStore.setState({
      midiAccessStatus: 'unsupported',
    });
    render(<Header />);
    expect(screen.getByText('Browser Unsupported (Use Chrome/Edge)')).toBeInTheDocument();
  });

  it('Test Case 0b: Given error MIDI status, Assert error text badge renders', () => {
    useMidiStore.setState({
      midiAccessStatus: 'error',
      midiErrorText: 'MIDI Permission Denied',
    });
    render(<Header />);
    expect(screen.getByText('Error: MIDI Permission Denied')).toBeInTheDocument();
  });

  it('Test Case 0c: Given granted MIDI status but no devices, Assert empty option has specific instruction text', () => {
    useMidiStore.setState({
      midiAccessStatus: 'granted',
      midiInputs: [],
    });
    render(<Header />);
    expect(screen.getByText('0 Devices (Check if DAW has exclusive lock)')).toBeInTheDocument();
  });

  it('Test Case 0: Given midiInputs are populated in the store, Assert MIDI selector dropdown renders options and updates selectedInputId on change', () => {
    const mockInputs = [
      { id: 'dev-1', name: 'Keyboard 1' },
      { id: 'dev-2', name: 'Keyboard 2' },
    ] as unknown as WebMidi.MIDIInput[];

    useMidiStore.setState({
      midiInputs: mockInputs,
      selectedInputId: 'dev-1',
    });

    render(<Header />);

    const select = screen.getByTestId('midi-input-select') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('dev-1');
    expect(screen.getByText('Keyboard 1')).toBeInTheDocument();
    expect(screen.getByText('Keyboard 2')).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'dev-2' } });
    expect(useMidiStore.getState().selectedInputId).toBe('dev-2');
  });

  it('Test Case 1: Given Header renders, When Info button clicked, Assert Info Modal is visible in DOM', () => {
    render(<Header />);

    // Info modal should not be visible initially
    expect(screen.queryByTestId('info-modal')).toBeNull();

    // Click Info button
    const infoBtn = screen.getByTestId('info-button');
    fireEvent.click(infoBtn);

    // Info modal should now be in the DOM
    expect(screen.getByTestId('info-modal')).toBeInTheDocument();
  });

  it('Test Case 2: Given Settings Modal is open, When Channel 1 is toggled, Assert Zustand store activeChannels updates', () => {
    // Make sure Channel 1 is active initially
    useMidiStore.setState({ activeChannels: [1, 2, 3] });
    expect(useMidiStore.getState().activeChannels).toContain(1);

    render(<Header />);

    // Open settings modal
    const settingsBtn = screen.getByTestId('settings-button');
    fireEvent.click(settingsBtn);

    // Get Channel 1 toggle button
    const ch1Toggle = screen.getByTestId('channel-toggle-1');
    fireEvent.click(ch1Toggle);

    // Assert Zustand store is updated (Channel 1 should be removed)
    expect(useMidiStore.getState().activeChannels).not.toContain(1);

    // Click it again
    fireEvent.click(ch1Toggle);

    // Channel 1 should be back in the active list
    expect(useMidiStore.getState().activeChannels).toContain(1);
  });
});
