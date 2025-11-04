import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminDashboard } from '../AdminDashboard.js';

describe('AdminDashboard', () => {
  it('should render admin dashboard title', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('should render comprehensive system administration subtitle', () => {
    render(<AdminDashboard />);
    expect(
      screen.getByText('Comprehensive system administration and state-specific configuration')
    ).toBeInTheDocument();
  });

  it('should render all real-time stats cards', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Active Visits')).toBeInTheDocument();
    expect(screen.getByText('EVV Exceptions')).toBeInTheDocument();
    expect(screen.getByText('Pending VMURs (TX)')).toBeInTheDocument();
    expect(screen.getByText('Geofence Violations')).toBeInTheDocument();
  });

  it('should render all tab buttons', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Operations Center')).toBeInTheDocument();
    expect(screen.getByText('State Configuration')).toBeInTheDocument();
    expect(screen.getByText('Data Management')).toBeInTheDocument();
    expect(screen.getByText('Compliance Center')).toBeInTheDocument();
  });

  it('should render operations center by default', () => {
    render(<AdminDashboard />);
    // Operations Center is the default view
    expect(screen.getByText('Active Visits - Live GPS Tracking')).toBeInTheDocument();
  });

  it('should display stat values', () => {
    render(<AdminDashboard />);
    // Check that numeric stats are displayed
    const stats = screen.getAllByText(/^\d+$/);
    expect(stats.length).toBeGreaterThan(0);
  });
});
