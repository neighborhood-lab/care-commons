import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormField } from '../FormField';

describe('FormField', () => {
  it('renders with label and children', () => {
    render(
      <FormField label="Test Field">
        <input type="text" data-testid="input" />
      </FormField>
    );

    expect(screen.getByText('Test Field')).toBeInTheDocument();
    expect(screen.getByTestId('input')).toBeInTheDocument();
    expect(screen.getByText('Test Field')).toHaveClass('block', 'text-sm', 'font-medium', 'text-gray-700');
  });

  it('shows required asterisk when required is true', () => {
    render(
      <FormField label="Required Field" required>
        <input type="text" />
      </FormField>
    );

    const asterisk = screen.getByText('*');
    expect(asterisk).toBeInTheDocument();
    expect(asterisk).toHaveClass('text-red-500', 'ml-1');
  });

  it('does not show asterisk when required is false', () => {
    render(
      <FormField label="Optional Field" required={false}>
        <input type="text" />
      </FormField>
    );

    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('displays error message when error is provided', () => {
    render(
      <FormField label="Field with Error" error="This field is required">
        <input type="text" />
      </FormField>
    );

    const error = screen.getByText('This field is required');
    expect(error).toBeInTheDocument();
    expect(error).toHaveClass('text-sm', 'text-red-600');
  });

  it('displays helper text when helperText is provided and no error', () => {
    render(
      <FormField label="Field with Helper" helperText="Enter your name here">
        <input type="text" />
      </FormField>
    );

    const helperText = screen.getByText('Enter your name here');
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('text-sm', 'text-gray-500');
  });

  it('does not display helper text when error is present', () => {
    render(
      <FormField 
        label="Field with Both" 
        error="Error message"
        helperText="Helper message"
      >
        <input type="text" />
      </FormField>
    );

    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helper message')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <FormField label="Custom Field" className="custom-class">
        <input type="text" />
      </FormField>
    );

    const container = screen.getByText('Custom Field').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('has correct base container classes', () => {
    render(
      <FormField label="Base Field">
        <input type="text" />
      </FormField>
    );

    const container = screen.getByText('Base Field').closest('div');
    expect(container).toHaveClass('space-y-1');
  });

  it('renders complex children', () => {
    render(
      <FormField label="Complex Field">
        <div>
          <input type="text" data-testid="complex-input" />
          <button>Submit</button>
        </div>
      </FormField>
    );

    expect(screen.getByTestId('complex-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('handles empty label gracefully', () => {
    render(
      <FormField label="">
        <input type="text" />
      </FormField>
    );

    const label = screen.getByRole('heading', { level: 2 }); // Empty label element
    expect(label).toBeInTheDocument();
  });

  it('handles long labels', () => {
    const longLabel = 'This is a very long label that should still render correctly';
    render(
      <FormField label={longLabel}>
        <input type="text" />
      </FormField>
    );

    expect(screen.getByText(longLabel)).toBeInTheDocument();
  });
});