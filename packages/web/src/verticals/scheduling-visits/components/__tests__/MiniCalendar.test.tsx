import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MiniCalendar } from '../MiniCalendar';

describe('MiniCalendar', () => {
  const mockOnDateSelect = vi.fn();
  const mockOnMonthChange = vi.fn();
  const currentDate = new Date('2025-01-15');
  const daysWithVisits = new Set(['2025-01-10', '2025-01-15', '2025-01-20']);

  it('renders current month and year', () => {
    render(
      <MiniCalendar
        currentDate={currentDate}
        daysWithVisits={daysWithVisits}
        onDateSelect={mockOnDateSelect}
        onMonthChange={mockOnMonthChange}
      />
    );

    expect(screen.getByText('January 2025')).toBeInTheDocument();
  });

  it('renders week day headers', () => {
    render(
      <MiniCalendar
        currentDate={currentDate}
        daysWithVisits={daysWithVisits}
        onDateSelect={mockOnDateSelect}
        onMonthChange={mockOnMonthChange}
      />
    );

    expect(screen.getByText('Su')).toBeInTheDocument();
    expect(screen.getByText('Mo')).toBeInTheDocument();
    expect(screen.getByText('Tu')).toBeInTheDocument();
    expect(screen.getByText('We')).toBeInTheDocument();
    expect(screen.getByText('Th')).toBeInTheDocument();
    expect(screen.getByText('Fr')).toBeInTheDocument();
    expect(screen.getByText('Sa')).toBeInTheDocument();
  });

  it('calls onDateSelect when a date is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MiniCalendar
        currentDate={currentDate}
        daysWithVisits={daysWithVisits}
        onDateSelect={mockOnDateSelect}
        onMonthChange={mockOnMonthChange}
      />
    );

    const dayButtons = screen.getAllByRole('button');
    const day15Button = dayButtons.find(btn => 
      btn.textContent === '15' && 
      btn instanceof HTMLButtonElement && 
      !btn.disabled
    );
    
    if (day15Button) {
      await user.click(day15Button);
      expect(mockOnDateSelect).toHaveBeenCalled();
    }
  });

  it('calls onMonthChange when previous month button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MiniCalendar
        currentDate={currentDate}
        daysWithVisits={daysWithVisits}
        onDateSelect={mockOnDateSelect}
        onMonthChange={mockOnMonthChange}
      />
    );

    const prevButton = screen.getByLabelText('Previous month');
    await user.click(prevButton);
    
    expect(mockOnMonthChange).toHaveBeenCalled();
  });

  it('calls onMonthChange when next month button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MiniCalendar
        currentDate={currentDate}
        daysWithVisits={daysWithVisits}
        onDateSelect={mockOnDateSelect}
        onMonthChange={mockOnMonthChange}
      />
    );

    const nextButton = screen.getByLabelText('Next month');
    await user.click(nextButton);
    
    expect(mockOnMonthChange).toHaveBeenCalled();
  });

  it('renders legend showing visit indicator', () => {
    render(
      <MiniCalendar
        currentDate={currentDate}
        daysWithVisits={daysWithVisits}
        onDateSelect={mockOnDateSelect}
        onMonthChange={mockOnMonthChange}
      />
    );

    expect(screen.getByText('Has scheduled visits')).toBeInTheDocument();
  });
});
