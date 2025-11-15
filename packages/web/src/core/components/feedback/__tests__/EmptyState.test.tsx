import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';
import { CalendarDays } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        title="No data found"
        description="There are no items to display"
      />
    );

    expect(screen.getByText('No data found')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <EmptyState
        title="No data"
        icon={<CalendarDays data-testid="calendar-icon" />}
      />
    );

    expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    render(
      <EmptyState
        title="No data"
        action={<button>Add Item</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
  });

  it('renders secondary action when provided', () => {
    render(
      <EmptyState
        title="No data"
        action={<button>Primary Action</button>}
        secondaryAction={<button>Secondary Action</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Primary Action' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Secondary Action' })).toBeInTheDocument();
  });

  it('renders metadata when provided', () => {
    render(
      <EmptyState
        title="No data"
        metadata={<div>Additional information</div>}
      />
    );

    expect(screen.getByText('Additional information')).toBeInTheDocument();
  });

  it('renders illustration instead of icon when both provided', () => {
    render(
      <EmptyState
        title="No data"
        icon={<div data-testid="icon">Icon</div>}
        illustration={<div data-testid="illustration">Illustration</div>}
      />
    );

    expect(screen.getByTestId('illustration')).toBeInTheDocument();
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState
        title="No data"
        className="custom-class"
      />
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('renders with small size', () => {
    render(
      <EmptyState
        title="No data"
        size="sm"
      />
    );

    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders with large size', () => {
    render(
      <EmptyState
        title="No data"
        size="lg"
      />
    );

    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});
