import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityCard } from '../ActivityCard';

describe('ActivityCard', () => {
  it('renders activity information correctly', () => {
    const mockActivity = {
      id: '1',
      activityType: 'VISIT_COMPLETED',
      title: 'Visit Completed',
      description: 'Morning care visit completed successfully',
      performedByName: 'Jane Smith',
      occurredAt: new Date().toISOString(),
    };

    render(<ActivityCard activity={mockActivity} />);

    expect(screen.getByText('Visit Completed')).toBeInTheDocument();
    expect(screen.getByText('Morning care visit completed successfully')).toBeInTheDocument();
    expect(screen.getByText(/By Jane Smith/)).toBeInTheDocument();
  });

  it('renders without performer name', () => {
    const mockActivity = {
      id: '2',
      activityType: 'CARE_PLAN_UPDATED',
      title: 'Care Plan Updated',
      description: 'Care plan has been revised',
      occurredAt: new Date().toISOString(),
    };

    render(<ActivityCard activity={mockActivity} />);

    expect(screen.getByText('Care Plan Updated')).toBeInTheDocument();
    expect(screen.getByText('Care plan has been revised')).toBeInTheDocument();
  });
});
