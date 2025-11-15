import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisitStatusLegend } from '../VisitStatusLegend';

describe('VisitStatusLegend', () => {
  it('renders all visit status items', () => {
    render(<VisitStatusLegend />);

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Needs Review')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('renders title by default', () => {
    render(<VisitStatusLegend />);

    expect(screen.getByText('Visit Status Legend')).toBeInTheDocument();
  });

  it('hides title when showTitle is false', () => {
    render(<VisitStatusLegend showTitle={false} />);

    expect(screen.queryByText('Visit Status Legend')).not.toBeInTheDocument();
  });

  it('renders compact version when compact is true', () => {
    render(<VisitStatusLegend compact />);

    // In compact mode, only labels are shown (no descriptions)
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
    
    // Descriptions should not be present in compact mode
    expect(screen.queryByText('Visit needs caregiver assignment')).not.toBeInTheDocument();
  });

  it('renders descriptions in non-compact mode', () => {
    render(<VisitStatusLegend compact={false} />);

    expect(screen.getByText('Visit needs caregiver assignment')).toBeInTheDocument();
    expect(screen.getByText('Visit has assigned caregiver (color-coded by caregiver)')).toBeInTheDocument();
    expect(screen.getByText('Caregiver has clocked in')).toBeInTheDocument();
  });

  it('renders additional information about caregiver colors', () => {
    render(<VisitStatusLegend />);

    expect(screen.getByText(/Each assigned caregiver is shown in a different color/)).toBeInTheDocument();
  });
});
