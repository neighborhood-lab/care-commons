import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders with default title and message', () => {
    render(<ErrorMessage message="Something went wrong" />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    const title = screen.getByText('Error');
    expect(title).toHaveClass('text-sm', 'font-medium', 'text-red-800');
    
    const message = screen.getByText('Something went wrong');
    expect(message).toHaveClass('mt-2', 'text-sm', 'text-red-700');
  });

  it('renders with custom title', () => {
    render(<ErrorMessage title="Custom Error" message="Custom error message" />);
    
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('renders with retry button', () => {
    const retryFn = vi.fn();
    render(<ErrorMessage message="Error occurred" retry={retryFn} />);
    
    const retryButton = screen.getByRole('button', { name: 'Try again' });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveClass('text-sm', 'font-medium', 'text-red-800', 'hover:text-red-700', 'underline');
  });

  it('calls retry function when retry button is clicked', async () => {
    const user = userEvent.setup();
    const retryFn = vi.fn();
    render(<ErrorMessage message="Error occurred" retry={retryFn} />);
    
    const retryButton = screen.getByRole('button', { name: 'Try again' });
    await user.click(retryButton);
    
    expect(retryFn).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when retry is not provided', () => {
    render(<ErrorMessage message="Error without retry" />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ErrorMessage message="Custom styled error" className="custom-error-class" />);
    
    const container = screen.getByText('Error').closest('div').parentElement;
    expect(container).toHaveClass('custom-error-class');
  });

  it('has correct base container classes', () => {
    render(<ErrorMessage message="Base error" />);
    
    const container = screen.getByText('Error').closest('div').parentElement;
    expect(container).toHaveClass('rounded-md', 'bg-red-50', 'p-4', 'border', 'border-red-200');
  });

  it('renders alert icon', () => {
    render(<ErrorMessage message="Error with icon" />);
    
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('h-5', 'w-5', 'text-red-400');
  });

  it('has correct layout structure', () => {
    render(<ErrorMessage message="Layout test" />);
    
    const container = screen.getByText('Error').closest('div').parentElement;
    const flexContainer = container?.firstElementChild;
    const iconContainer = flexContainer?.firstElementChild;
    const contentContainer = flexContainer?.children[1];
    
    expect(container).toBeInTheDocument();
    expect(flexContainer).toHaveClass('flex');
    expect(iconContainer).toHaveClass('flex-shrink-0');
    expect(contentContainer).toHaveClass('ml-3', 'flex-1');
  });

  it('handles long messages', () => {
    const longMessage = 'This is a very long error message that should wrap properly and maintain readability while being displayed in the error component with proper styling and spacing.';
    
    render(<ErrorMessage message={longMessage} />);
    
    const message = screen.getByText(longMessage);
    expect(message).toBeInTheDocument();
    expect(message).toHaveClass('mt-2', 'text-sm', 'text-red-700');
  });

  it('handles empty title gracefully', () => {
    render(<ErrorMessage title="" message="Message with empty title" />);
    
    const title = screen.getByRole('heading', { level: 3 });
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('');
  });

  it('handles empty message gracefully', () => {
    render(<ErrorMessage message="" />);
    
    const message = screen.getByText('').parentElement;
    expect(message).toBeInTheDocument();
    expect(message).toHaveClass('mt-2', 'text-sm', 'text-red-700');
  });

  it('renders with all props', () => {
    const retryFn = vi.fn();
    
    render(
      <ErrorMessage 
        title="Complete Error"
        message="This is a complete error message with all props"
        retry={retryFn}
        className="complete-error"
      />
    );
    
    expect(screen.getByText('Complete Error')).toBeInTheDocument();
    expect(screen.getByText('This is a complete error message with all props')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    
    const container = screen.getByText('Complete Error').closest('div').parentElement;
    expect(container).toHaveClass('complete-error');
  });

  it('retry button has correct attributes', () => {
    const retryFn = vi.fn();
    render(<ErrorMessage message="Test" retry={retryFn} />);
    
    const button = screen.getByRole('button', { name: 'Try again' });
    expect(button).toHaveAttribute('type', 'button');
  });
});