import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StateConfigPanel } from '../components/StateConfigPanel.js';

describe('StateConfigPanel', () => {
  it('should render state configuration title', () => {
    render(<StateConfigPanel />);
    expect(screen.getByText('State-Specific EVV Configuration')).toBeInTheDocument();
  });

  it('should render all 7 supported states', () => {
    render(<StateConfigPanel />);
    expect(screen.getByText('Texas')).toBeInTheDocument();
    expect(screen.getByText('Florida')).toBeInTheDocument();
    expect(screen.getByText('Ohio')).toBeInTheDocument();
    expect(screen.getByText('Pennsylvania')).toBeInTheDocument();
    expect(screen.getByText('Georgia')).toBeInTheDocument();
    expect(screen.getByText('North Carolina')).toBeInTheDocument();
    expect(screen.getByText('Arizona')).toBeInTheDocument();
  });

  it('should display Texas configuration by default', () => {
    render(<StateConfigPanel />);
    expect(screen.getByText('Texas Configuration')).toBeInTheDocument();
  });

  it('should render geofence tolerance input', () => {
    render(<StateConfigPanel />);
    const input = screen.getByLabelText(/Geofence Tolerance/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');
  });

  it('should render grace period input', () => {
    render(<StateConfigPanel />);
    const input = screen.getByLabelText(/Clock-In Grace Period/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');
  });

  it('should render GPS accuracy threshold input', () => {
    render(<StateConfigPanel />);
    const input = screen.getByLabelText(/GPS Accuracy Threshold/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');
  });

  it('should render aggregator select', () => {
    render(<StateConfigPanel />);
    const select = screen.getByLabelText(/EVV Aggregator/i);
    expect(select).toBeInTheDocument();
    expect(select.tagName).toBe('SELECT');
  });

  it('should have Save and Reset buttons disabled initially', () => {
    render(<StateConfigPanel />);
    const saveButton = screen.getByText(/Save Changes/i);
    const resetButton = screen.getByText(/Reset/i);
    expect(saveButton).toBeDisabled();
    expect(resetButton).toBeDisabled();
  });

  it('should enable Save and Reset buttons after changes', () => {
    render(<StateConfigPanel />);
    
    // Make a change to geofence tolerance
    const input = screen.getByLabelText(/Geofence Tolerance/i);
    fireEvent.change(input, { target: { value: '150' } });

    const saveButton = screen.getByText(/Save Changes/i);
    const resetButton = screen.getByText(/Reset/i);
    expect(saveButton).not.toBeDisabled();
    expect(resetButton).not.toBeDisabled();
  });

  it('should show unsaved changes warning after modifications', () => {
    render(<StateConfigPanel />);
    
    // Make a change
    const input = screen.getByLabelText(/Geofence Tolerance/i);
    fireEvent.change(input, { target: { value: '150' } });

    expect(screen.getByText(/You have unsaved changes/i)).toBeInTheDocument();
  });

  it('should switch states when state button is clicked', () => {
    render(<StateConfigPanel />);
    
    // Click Florida
    const floridaButton = screen.getByText('Florida');
    fireEvent.click(floridaButton);

    expect(screen.getByText('Florida Configuration')).toBeInTheDocument();
  });

  it('should render enable/disable toggle', () => {
    render(<StateConfigPanel />);
    expect(screen.getByText(/Enable TX Operations/i)).toBeInTheDocument();
  });

  it('should render required documentation checkboxes', () => {
    render(<StateConfigPanel />);
    expect(screen.getByText(/EVV 6 Required Elements/i)).toBeInTheDocument();
    expect(screen.getByText(/GPS Coordinates/i)).toBeInTheDocument();
  });

  it('should have proper input constraints', () => {
    render(<StateConfigPanel />);
    
    const geofenceInput = screen.getByLabelText(/Geofence Tolerance/i);
    expect(geofenceInput).toHaveAttribute('min', '50');
    expect(geofenceInput).toHaveAttribute('max', '300');
    expect(geofenceInput).toHaveAttribute('step', '10');

    const graceInput = screen.getByLabelText(/Clock-In Grace Period/i);
    expect(graceInput).toHaveAttribute('min', '5');
    expect(graceInput).toHaveAttribute('max', '30');
    expect(graceInput).toHaveAttribute('step', '5');
  });
});
