import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '../Input.js';

describe('Input', () => {
  it('should render with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('should render with error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('should render with helper text', () => {
    render(<Input label="Email" helperText="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('should show required indicator', () => {
    render(<Input label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should have error styling when error prop is provided', () => {
    render(<Input label="Email" error="Invalid" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should not show helper text when error is present', () => {
    const { queryByText } = render(
      <Input label="Email" error="Invalid" helperText="Helper text" />
    );
    expect(queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<Input ref={ref as React.RefObject<HTMLInputElement>} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('should have displayName set', () => {
    expect(Input.displayName).toBe('Input');
  });
});
