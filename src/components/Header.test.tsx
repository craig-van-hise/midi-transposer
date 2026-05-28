import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Header from './Header';
import { useMidiStore } from '../store/useMidiStore';

describe('Header & Modals UI Phase 3 TDD Checkpoint', () => {
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
