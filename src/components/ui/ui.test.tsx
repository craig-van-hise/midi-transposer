
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';
import { Tooltip } from './Tooltip';

describe('Modal Reusable Component', () => {
  it('renders children when isOpen === true and fires onClose when the background overlay is clicked', () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={false} onClose={handleClose} title="Test Modal">
        <div>Modal Child Content</div>
      </Modal>
    );

    expect(screen.queryByText('Modal Child Content')).toBeNull();

    rerender(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Modal Child Content</div>
      </Modal>
    );

    expect(screen.getByText('Modal Child Content')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();

    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

describe('Tooltip Reusable Component', () => {
  it('renders the wrapped element and contains the tooltip text in the DOM', () => {
    render(
      <Tooltip content="Helper tooltip explanation text">
        <button>Hover Me</button>
      </Tooltip>
    );

    expect(screen.getByText('Hover Me')).toBeInTheDocument();
    const tooltipText = screen.getByText('Helper tooltip explanation text');
    expect(tooltipText).toBeInTheDocument();
  });
});
