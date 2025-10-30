import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders with title only', () => {
    render(<EmptyState title="No data found" />);
    
    const title = screen.getByText('No data found');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-lg', 'font-medium', 'text-gray-900', 'mb-2');
  });

  it('renders with title and description', () => {
    render(
      <EmptyState 
        title="No items" 
        description="There are no items to display at this time." 
      />
    );
    
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display at this time.')).toBeInTheDocument();
    
    const description = screen.getByText('There are no items to display at this time.');
    expect(description).toHaveClass('text-sm', 'text-gray-600', 'text-center', 'mb-6', 'max-w-md');
  });

  it('renders with icon', () => {
    const icon = <div data-testid="test-icon">📭</div>;
    render(<EmptyState title="Empty" icon={icon} />);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon').parentElement).toHaveClass('mb-4', 'text-gray-400');
  });

  it('renders with action button', () => {
    const action = <button data-testid="action-button">Add Item</button>;
    render(<EmptyState title="Empty" action={action} />);
    
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });

  it('renders with all props', () => {
    const icon = <div data-testid="icon">📭</div>;
    const action = <button data-testid="action">Action</button>;
    
    render(
      <EmptyState 
        title="Complete Empty State"
        description="This is a complete empty state with all props"
        icon={icon}
        action={action}
      />
    );
    
    expect(screen.getByText('Complete Empty State')).toBeInTheDocument();
    expect(screen.getByText('This is a complete empty state with all props')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByTestId('action')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<EmptyState title="Custom" className="custom-empty-state" />);
    
    const container = screen.getByText('Custom').closest('div');
    expect(container).toHaveClass('custom-empty-state');
  });

  it('has correct base container classes', () => {
    render(<EmptyState title="Base" />);
    
    const container = screen.getByText('Base').closest('div');
    expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'py-12', 'px-4');
  });

  it('does not render icon when not provided', () => {
    render(<EmptyState title="No Icon" />);
    
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="No Description" />);
    
    expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
  });

  it('does not render action when not provided', () => {
    render(<EmptyState title="No Action" />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles complex icon components', () => {
    const complexIcon = (
      <div>
        <svg data-testid="svg-icon"></svg>
        <span>Icon Text</span>
      </div>
    );
    
    render(<EmptyState title="Complex Icon" icon={complexIcon} />);
    
    expect(screen.getByTestId('svg-icon')).toBeInTheDocument();
    expect(screen.getByText('Icon Text')).toBeInTheDocument();
  });

  it('handles complex action components', () => {
    const complexAction = (
      <div>
        <button>Primary Action</button>
        <button>Secondary Action</button>
      </div>
    );
    
    render(<EmptyState title="Complex Action" action={complexAction} />);
    
    expect(screen.getByRole('button', { name: 'Primary Action' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Secondary Action' })).toBeInTheDocument();
  });

  it('handles long titles and descriptions', () => {
    const longTitle = 'This is a very long title that should still render correctly and maintain proper styling';
    const longDescription = 'This is a very long description that should wrap properly and maintain readability while being centered and having proper spacing';
    
    render(
      <EmptyState 
        title={longTitle}
        description={longDescription}
      />
    );
    
    expect(screen.getByText(longTitle)).toBeInTheDocument();
    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it('handles empty title gracefully', () => {
    render(<EmptyState title="" />);
    
    const title = screen.getByRole('heading', { level: 3 });
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('');
  });
});