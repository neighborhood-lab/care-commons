import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComplianceCenter } from '../components/ComplianceCenter.js';

describe('ComplianceCenter', () => {
  it('should render the component', () => {
    render(<ComplianceCenter />);
    expect(screen.getByText('Compliance Center')).toBeInTheDocument();
  });

  it('should render tab navigation', () => {
    render(<ComplianceCenter />);
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('HIPAA Access Logs')).toBeInTheDocument();
    expect(screen.getByText('Compliance Reports')).toBeInTheDocument();
  });

  it('should show audit trail by default', () => {
    render(<ComplianceCenter />);
    expect(screen.getByText('System Audit Trail')).toBeInTheDocument();
  });

  it('should switch to HIPAA tab when clicked', () => {
    render(<ComplianceCenter />);
    const hipaaTab = screen.getByText('HIPAA Access Logs');
    fireEvent.click(hipaaTab);
    expect(screen.getByText('HIPAA PHI Access Logs')).toBeInTheDocument();
  });

  it('should switch to reports tab when clicked', () => {
    render(<ComplianceCenter />);
    const reportsTab = screen.getByText('Compliance Reports');
    fireEvent.click(reportsTab);
    expect(screen.getByText('Texas EVV Aggregator Submissions')).toBeInTheDocument();
  });

  it('should display audit log table headers', () => {
    render(<ComplianceCenter />);
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Resource')).toBeInTheDocument();
  });

  it('should display audit log entries', () => {
    render(<ComplianceCenter />);
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Coordinator Smith')).toBeInTheDocument();
  });

  it('should have export button', () => {
    render(<ComplianceCenter />);
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should format time durations', () => {
    render(<ComplianceCenter />);
    const timeElements = screen.getAllByText(/ago/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('should switch back to audit tab', () => {
    render(<ComplianceCenter />);
    const reportsTab = screen.getByText('Compliance Reports');
    fireEvent.click(reportsTab);
    const auditTab = screen.getByText('Audit Trail');
    fireEvent.click(auditTab);
    expect(screen.getByText('System Audit Trail')).toBeInTheDocument();
  });
});
