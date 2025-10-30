import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge, StatusBadge } from '../Badge';

describe('Badge', () => {
  it('renders with default props', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800', 'px-2', 'py-0.5', 'text-xs');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Badge variant="success">Success</Badge>);
    let badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');

    rerender(<Badge variant="error">Error</Badge>);
    badge = screen.getByText('Error');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');

    rerender(<Badge variant="warning">Warning</Badge>);
    badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');

    rerender(<Badge variant="info">Info</Badge>);
    badge = screen.getByText('Info');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    let badge = screen.getByText('Small');
    expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');

    rerender(<Badge size="md">Medium</Badge>);
    badge = screen.getByText('Medium');
    expect(badge).toHaveClass('px-2.5', 'py-1', 'text-sm');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>);
    const badge = screen.getByText('Custom');
    
    expect(badge).toHaveClass('custom-badge');
  });

  it('renders complex children', () => {
    render(
      <Badge>
        <span>Icon</span>
        <span>Text</span>
      </Badge>
    );
    
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('has correct base classes', () => {
    render(<Badge>Test</Badge>);
    const badge = screen.getByText('Test');
    
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'font-medium');
  });
});

describe('StatusBadge', () => {
  it('renders known status values correctly', () => {
    const { rerender } = render(<StatusBadge status="ACTIVE" />);
    let badge = screen.getByText('Active');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');

    rerender(<StatusBadge status="INACTIVE" />);
    badge = screen.getByText('Inactive');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');

    rerender(<StatusBadge status="PENDING" />);
    badge = screen.getByText('Pending');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');

    rerender(<StatusBadge status="COMPLETED" />);
    badge = screen.getByText('Completed');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');

    rerender(<StatusBadge status="CANCELLED" />);
    badge = screen.getByText('Cancelled');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');

    rerender(<StatusBadge status="SCHEDULED" />);
    badge = screen.getByText('Scheduled');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('renders unknown status as default variant', () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />);
    const badge = screen.getByText('UNKNOWN_STATUS');
    
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('handles empty status', () => {
    render(<StatusBadge status="" />);
    const badge = screen.getByText('');
    
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('preserves case for unknown statuses', () => {
    render(<StatusBadge status="Custom_Status" />);
    const badge = screen.getByText('Custom_Status');
    
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });
});