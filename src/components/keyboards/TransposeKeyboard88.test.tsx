import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TransposeKeyboard88 from './TransposeKeyboard88';
import { useMidiStore } from '../../store/useMidiStore';

describe('TransposeKeyboard88 Zustand Wiring Phase 4 TDD Checkpoint', () => {
  it('Test Case 1: Given transposeTarget is 64 and transposeOrigin is 60, Assert component renders correctly and updates store on click', () => {
    useMidiStore.setState({
      transposeOrigin: 60,
      transposeTarget: 64,
    });

    render(<TransposeKeyboard88 />);

    // Renders transpose value label: "+4"
    expect(screen.getByText('+4')).toBeInTheDocument();

    // Find C4 (60) key and E4 (64) key in the component
    const c4Key = document.getElementById('pktranspose-60');
    const f4Key = document.getElementById('pktranspose-65');

    expect(c4Key).toBeInTheDocument();
    expect(f4Key).toBeInTheDocument();

    // Clicking F4 (65) should set transposeTarget to 65
    fireEvent.mouseDown(f4Key!);
    expect(useMidiStore.getState().transposeTarget).toBe(65);

    // Shift-clicking F4 (65) should set transposeOrigin to 65
    fireEvent.mouseDown(f4Key!, { shiftKey: true });
    expect(useMidiStore.getState().transposeOrigin).toBe(65);
  });

  it('Test Case 2: Assert component styles are updated to Rose/Red theme classes and hex colors', () => {
    useMidiStore.setState({
      transposeOrigin: 60,
      transposeTarget: 60,
    });

    const { container } = render(<TransposeKeyboard88 />);

    // Outer card container should have ring-rose-100 instead of ring-blue-100
    const outerContainer = container.firstChild as HTMLElement;
    expect(outerContainer).toHaveClass('ring-rose-100');

    // Slider track fill should have bg-rose-500 instead of bg-blue-500
    const sliderTrackFill = container.querySelector('.bg-rose-500');
    expect(sliderTrackFill).toBeInTheDocument();

    // Slider handle border should be border-rose-500
    const handleBorder = container.querySelector('.border-rose-500');
    expect(handleBorder).toBeInTheDocument();

    // Caret under handle should be border-t-rose-500
    const caret = container.querySelector('.border-t-rose-500');
    expect(caret).toBeInTheDocument();
  });

  it('Test Case 1: Array [60, 61] forces handle 61 into tier 1 (staggered) to prevent visual overlap', () => {
    useMidiStore.setState({
      transposeOrigin: 60,
      transposeTargets: [60, 61],
    });

    render(<TransposeKeyboard88 />);

    const handle60 = screen.getByTestId('transpose-handle-60');
    const handle61 = screen.getByTestId('transpose-handle-61');

    expect(handle60.style.transform).toBe('translateY(-100%)');
    expect(handle61.style.transform).toBe('translateY(20%)');
  });
});
