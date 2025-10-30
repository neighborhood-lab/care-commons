import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '../Input';

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('block', 'w-full', 'rounded-md', 'border-gray-300', 'shadow-sm');
  });

  it('renders with label', () => {
    render(<Input label="Test Input" />);
    
    expect(screen.getByText('Test Input')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
  });

  it('shows required asterisk when required is true', () => {
    render(<Input label="Required Input" required />);
    
    const asterisk = screen.getByText('*');
    expect(asterisk).toBeInTheDocument();
    expect(asterisk).toHaveClass('text-red-500', 'ml-1');
  });

  it('generates correct id from label', () => {
    render(<Input label="Test Label Input" />);
    
    const input = screen.getByRole('textbox');
    const label = screen.getByText('Test Label Input');
    
    expect(input).toHaveAttribute('id', 'input-test-label-input');
    expect(label).toHaveAttribute('for', 'input-test-label-input');
  });

  it('uses provided id', () => {
    render(<Input label="Custom ID" id="custom-input-id" />);
    
    const input = screen.getByRole('textbox');
    const label = screen.getByText('Custom ID');
    
    expect(input).toHaveAttribute('id', 'custom-input-id');
    expect(label).toHaveAttribute('for', 'custom-input-id');
  });

  it('displays error message and applies error styles', () => {
    render(<Input label="Error Input" error="This field is required" />);
    
    const input = screen.getByRole('textbox');
    const error = screen.getByText('This field is required');
    
    expect(input).toHaveClass('border-red-300');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'input-error-input-error');
    expect(error).toBeInTheDocument();
    expect(error).toHaveAttribute('id', 'input-error-input-error');
    expect(error).toHaveClass('mt-1', 'text-sm', 'text-red-600');
  });

  it('displays helper text when no error', () => {
    render(<Input label="Helper Input" helperText="Enter your email address" />);
    
    const helper = screen.getByText('Enter your email address');
    expect(helper).toBeInTheDocument();
    expect(helper).toHaveClass('mt-1', 'text-sm', 'text-gray-500');
  });

  it('does not display helper text when error is present', () => {
    render(
      <Input 
        label="Both Input" 
        error="Error message"
        helperText="Helper message"
      />
    );
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helper message')).not.toBeInTheDocument();
  });

  it('applies disabled styles when disabled', () => {
    render(<Input disabled placeholder="Disabled input" />);
    
    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:bg-gray-50', 'disabled:text-gray-500', 'disabled:cursor-not-allowed');
  });

  it('handles user input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Type here" />);
    
    const input = screen.getByPlaceholderText('Type here');
    await user.type(input, 'Hello World');
    
    expect(input).toHaveValue('Hello World');
  });

  it('handles change events', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, 'test');
    expect(handleChange).toHaveBeenCalledTimes(4); // One call per character
  });

  it('applies custom className', () => {
    render(<Input className="custom-input-class" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    
    render(<Input ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" />);
    let input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<Input type="password" />);
    input = screen.getByLabelText(/password/i) || screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('handles focus and blur events', async () => {
    const user = userEvent.setup();
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    const input = screen.getByRole('textbox');
    
    await user.click(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    await user.tab(); // Move focus away
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('has correct display name', () => {
    expect(Input.displayName).toBe('Input');
  });

  it('handles empty label gracefully', () => {
    render(<Input label="" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'input-');
  });
});