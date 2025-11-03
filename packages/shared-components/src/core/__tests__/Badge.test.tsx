import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, StatusBadge } from '../Badge.js';

describe('Badge', () => {
  it('should render children', () => {
    render(<Badge>Badge text</Badge>);
    expect(screen.getByText('Badge text')).toBeInTheDocument();
  });

  it('should apply default variant', () => {
    const { container } = render(<Badge>Text</Badge>);
    expect(container.firstChild).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('should apply success variant', () => {
    const { container } = render(<Badge variant="success">Text</Badge>);
    expect(container.firstChild).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should apply error variant', () => {
    const { container } = render(<Badge variant="error">Text</Badge>);
    expect(container.firstChild).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('should apply warning variant', () => {
    const { container } = render(<Badge variant="warning">Text</Badge>);
    expect(container.firstChild).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('should apply info variant', () => {
    const { container } = render(<Badge variant="info">Text</Badge>);
    expect(container.firstChild).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('should apply small size', () => {
    const { container } = render(<Badge size="sm">Text</Badge>);
    expect(container.firstChild).toHaveClass('px-2', 'py-0.5', 'text-xs');
  });

  it('should apply medium size', () => {
    const { container } = render(<Badge size="md">Text</Badge>);
    expect(container.firstChild).toHaveClass('px-2.5', 'py-1', 'text-sm');
  });
});

describe('StatusBadge', () => {
  it('should render active status', () => {
    render(<StatusBadge status="ACTIVE" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render inactive status', () => {
    render(<StatusBadge status="INACTIVE" />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should render pending status', () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should render completed status', () => {
    render(<StatusBadge status="COMPLETED" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('should render cancelled status', () => {
    render(<StatusBadge status="CANCELLED" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('should render scheduled status', () => {
    render(<StatusBadge status="SCHEDULED" />);
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  it('should handle unknown status', () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />);
    expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();
  });
});
