import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Select } from '../Select';

describe('Select', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
  ];

  it('renders with default props', () => {
    render(<Select options={mockOptions} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveClass('block', 'w-full', 'rounded-md', 'border-gray-300', 'shadow-sm');
  });

  it('renders with label', () => {
    render(<Select label="Test Select" options={mockOptions} />);
    
    expect(screen.getByText('Test Select')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Select')).toBeInTheDocument();
  });

  it('shows required asterisk when required is true', () => {
    render(<Select label="Required Select" options={mockOptions} required />);
    
    const asterisk = screen.getByText('*');
    expect(asterisk).toBeInTheDocument();
    expect(asterisk).toHaveClass('text-red-500', 'ml-1');
  });

  it('generates correct id from label', () => {
    render(<Select label="Test Label Select" options={mockOptions} />);
    
    const select = screen.getByRole('combobox');
    const label = screen.getByText('Test Label Select');
    
    expect(select).toHaveAttribute('id', 'select-test-label-select');
    expect(label).toHaveAttribute('for', 'select-test-label-select');
  });

  it('uses provided id', () => {
    render(<Select label="Custom ID" id="custom-select-id" options={mockOptions} />);
    
    const select = screen.getByRole('combobox');
    const label = screen.getByText('Custom ID');
    
    expect(select).toHaveAttribute('id', 'custom-select-id');
    expect(label).toHaveAttribute('for', 'custom-select-id');
  });

  it('renders all options correctly', () => {
    render(<Select options={mockOptions} />);
    
    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
  });

  it('renders placeholder option when provided', () => {
    render(<Select options={mockOptions} placeholder="Choose an option" />);
    
    const placeholder = screen.getByRole('option', { name: 'Choose an option' });
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveAttribute('disabled');
    expect(placeholder).toHaveValue('');
  });

  it('displays error message and applies error styles', () => {
    render(<Select label="Error Select" options={mockOptions} error="Please select an option" />);
    
    const select = screen.getByRole('combobox');
    const error = screen.getByText('Please select an option');
    
    expect(select).toHaveClass('border-red-300');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-describedby', 'select-error-select-error');
    expect(error).toBeInTheDocument();
    expect(error).toHaveAttribute('id', 'select-error-select-error');
    expect(error).toHaveClass('mt-1', 'text-sm', 'text-red-600');
  });

  it('displays helper text when no error', () => {
    render(<Select label="Helper Select" options={mockOptions} helperText="Select your preference" />);
    
    const helper = screen.getByText('Select your preference');
    expect(helper).toBeInTheDocument();
    expect(helper).toHaveClass('mt-1', 'text-sm', 'text-gray-500');
  });

  it('does not display helper text when error is present', () => {
    render(
      <Select 
        label="Both Select" 
        options={mockOptions}
        error="Error message"
        helperText="Helper message"
      />
    );
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helper message')).not.toBeInTheDocument();
  });

  it('applies disabled styles when disabled', () => {
    render(<Select options={mockOptions} disabled />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
    expect(select).toHaveClass('disabled:bg-gray-50', 'disabled:text-gray-500', 'disabled:cursor-not-allowed');
  });

  it('handles option selection', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    
    render(<Select options={mockOptions} onChange={handleChange} />);
    const select = screen.getByRole('combobox');
    
    await user.selectOptions(select, 'option1');
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(select).toHaveValue('option1');
  });

  it('handles disabled options', () => {
    render(<Select options={mockOptions} />);
    
    const disabledOption = screen.getByRole('option', { name: 'Option 3' });
    expect(disabledOption).toHaveAttribute('disabled');
  });

  it('applies custom className', () => {
    render(<Select options={mockOptions} className="custom-select-class" />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('custom-select-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    
    render(<Select options={mockOptions} ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });

  it('handles empty options array', () => {
    render(<Select options={[]} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('handles focus and blur events', async () => {
    const user = userEvent.setup();
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    
    render(<Select options={mockOptions} onFocus={handleFocus} onBlur={handleBlur} />);
    const select = screen.getByRole('combobox');
    
    await user.click(select);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    await user.tab(); // Move focus away
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('has correct display name', () => {
    expect(Select.displayName).toBe('Select');
  });

  it('handles empty label gracefully', () => {
    render(<Select label="" options={mockOptions} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('id', 'select-');
  });

  it('passes through additional select attributes', () => {
    render(<Select options={mockOptions} name="test-select" data-testid="custom-select" />);
    
    const select = screen.getByTestId('custom-select');
    expect(select).toHaveAttribute('name', 'test-select');
  });
});