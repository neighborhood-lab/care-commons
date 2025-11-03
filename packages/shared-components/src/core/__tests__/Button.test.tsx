import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../Button.js';

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should apply primary variant by default', () => {
    const { container } = render(<Button>Text</Button>);
    expect(container.firstChild).toHaveClass('bg-primary-600');
  });

  it('should apply secondary variant', () => {
    const { container } = render(<Button variant="secondary">Text</Button>);
    expect(container.firstChild).toHaveClass('bg-gray-200');
  });

  it('should apply outline variant', () => {
    const { container } = render(<Button variant="outline">Text</Button>);
    expect(container.firstChild).toHaveClass('border', 'border-gray-300');
  });

  it('should apply ghost variant', () => {
    const { container } = render(<Button variant="ghost">Text</Button>);
    expect(container.firstChild).toHaveClass('text-gray-700', 'hover:bg-gray-100');
  });

  it('should apply danger variant', () => {
    const { container } = render(<Button variant="danger">Text</Button>);
    expect(container.firstChild).toHaveClass('bg-red-600');
  });

  it('should apply medium size by default', () => {
    const { container } = render(<Button>Text</Button>);
    expect(container.firstChild).toHaveClass('px-4', 'py-2');
  });

  it('should apply small size', () => {
    const { container } = render(<Button size="sm">Text</Button>);
    expect(container.firstChild).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  it('should apply large size', () => {
    const { container } = render(<Button size="lg">Text</Button>);
    expect(container.firstChild).toHaveClass('px-5', 'py-2.5', 'text-base');
  });

  it('should show loading spinner when isLoading is true', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('should disable button when isLoading', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should disable button when disabled prop is true', () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should render left icon', () => {
    render(<Button leftIcon={<span>←</span>}>Back</Button>);
    expect(screen.getByText('←')).toBeInTheDocument();
  });

  it('should render right icon', () => {
    render(<Button rightIcon={<span>→</span>}>Next</Button>);
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<Button ref={ref as React.RefObject<HTMLButtonElement>}>Click</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('should have displayName set', () => {
    expect(Button.displayName).toBe('Button');
  });
});
