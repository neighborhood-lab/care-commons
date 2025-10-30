import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary-600', 'text-white', 'px-4', 'py-2');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-200', 'text-gray-900');

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('border', 'border-gray-300', 'bg-white');

    rerender(<Button variant="ghost">Ghost</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('text-gray-700');

    rerender(<Button variant="danger">Danger</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600', 'text-white');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="xs">Extra Small</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('px-2', 'py-1', 'text-xs');

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('px-5', 'py-2.5', 'text-base');
  });

  it('renders with left and right icons', () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    const rightIcon = <span data-testid="right-icon">→</span>;
    
    render(
      <Button leftIcon={leftIcon} rightIcon={rightIcon}>
        With Icons
      </Button>
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('shows loading spinner and disables button when loading', () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(button.querySelector('svg')).toBeInTheDocument();
    expect(button.querySelector('svg')).toHaveClass('animate-spin');
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button');
    
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger click when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const button = screen.getByRole('button');
    
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not trigger click when loading', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button isLoading onClick={handleClick}>Loading</Button>);
    const button = screen.getByRole('button');
    
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    
    render(<Button ref={ref}>Ref Button</Button>);
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('has correct display name', () => {
    expect(Button.displayName).toBe('Button');
  });
});