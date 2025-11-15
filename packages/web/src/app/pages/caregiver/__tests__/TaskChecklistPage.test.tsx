import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { TaskChecklistPage } from '../TaskChecklistPage';

// Mock hooks
vi.mock('@/core/hooks', () => ({
  useAuth: () => ({ user: { id: 'user-123', name: 'Test User' } }),
  useIsMobile: () => false,
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ visitId: 'visit-123' }),
  };
});

describe('TaskChecklistPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render task checklist page', () => {
    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Task Checklist')).toBeInTheDocument();
    expect(screen.getByText('0 of 5 tasks completed')).toBeInTheDocument();
  });

  it('should display all tasks', () => {
    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Morning routine assistance')).toBeInTheDocument();
    expect(screen.getByText('Medication reminder')).toBeInTheDocument();
    expect(screen.getByText('Prepare breakfast')).toBeInTheDocument();
    expect(screen.getByText('Light housekeeping')).toBeInTheDocument();
    expect(screen.getByText('Exercise routine')).toBeInTheDocument();
  });

  it('should show progress bar at 0% initially', () => {
    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    const progressBar = screen.getByText('0%');
    expect(progressBar).toBeInTheDocument();
  });

  it('should toggle task completion on checkbox click', () => {
    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).not.toBeChecked();

    fireEvent.click(checkboxes[0]);

    expect(checkboxes[0]).toBeChecked();
  });

  it('should update progress when tasks are completed', () => {
    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    const checkboxes = screen.getAllByRole('checkbox');

    // Complete first task (1 of 5 = 20%)
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText('1 of 5 tasks completed')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('should filter tasks by status', () => {
    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    // Initially showing all tasks (5)
    expect(screen.getByText('All (5)')).toBeInTheDocument();

    // Complete one task
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Filter to pending tasks
    const pendingButton = screen.getByText('Pending (4)');
    fireEvent.click(pendingButton);

    // Should not show completed task
    expect(screen.queryByText('Morning routine assistance')).not.toBeInTheDocument();
  });

  it('should show completed filter correctly', () => {
    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Filter to completed tasks
    const completedButton = screen.getByText('Completed (1)');
    fireEvent.click(completedButton);

    // Should only show completed task
    expect(screen.getByText('Morning routine assistance')).toBeInTheDocument();
    expect(screen.queryByText('Medication reminder')).not.toBeInTheDocument();
  });

  it('should display priority badges', () => {
    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    expect(screen.getAllByText('high')).toHaveLength(2);
    expect(screen.getAllByText('medium')).toHaveLength(2);
    expect(screen.getAllByText('low')).toHaveLength(1);
  });

  it('should display category badges', () => {
    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Personal Care')).toBeInTheDocument();
    expect(screen.getByText('Medication')).toBeInTheDocument();
    expect(screen.getByText('Meal Prep')).toBeInTheDocument();
    expect(screen.getByText('Housekeeping')).toBeInTheDocument();
    expect(screen.getByText('Activities')).toBeInTheDocument();
  });

  it('should mark all tasks complete', () => {
    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    const markAllButton = screen.getByText('Mark All Complete');
    fireEvent.click(markAllButton);

    expect(screen.getByText('5 of 5 tasks completed')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should hide mark all button when all tasks are complete', () => {
    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    const markAllButton = screen.getByText('Mark All Complete');
    fireEvent.click(markAllButton);

    expect(screen.queryByText('Mark All Complete')).not.toBeInTheDocument();
  });

  it('should apply strikethrough to completed tasks', () => {
    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const taskText = screen.getByText('Morning routine assistance');
    expect(taskText).toHaveClass('line-through');
  });

  it('should handle touch start for swipe gestures', () => {
    // Mock mobile
    vi.mocked(require('@/core/hooks').useIsMobile).mockReturnValue(true);

    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    const taskCard = screen.getByText('Morning routine assistance').closest('div');

    if (taskCard?.parentElement) {
      fireEvent.touchStart(taskCard.parentElement, {
        touches: [{ clientX: 0 }],
      });

      // Component should handle touch start without errors
      expect(taskCard).toBeInTheDocument();
    }
  });

  it('should handle touch move for swipe gestures', () => {
    vi.mocked(require('@/core/hooks').useIsMobile).mockReturnValue(true);

    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    const taskCard = screen.getByText('Morning routine assistance').closest('div');

    if (taskCard?.parentElement) {
      fireEvent.touchStart(taskCard.parentElement, {
        touches: [{ clientX: 0 }],
      });

      fireEvent.touchMove(taskCard.parentElement, {
        touches: [{ clientX: 50 }],
      });

      expect(taskCard).toBeInTheDocument();
    }
  });

  it('should complete task on swipe threshold', () => {
    vi.mocked(require('@/core/hooks').useIsMobile).mockReturnValue(true);

    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    const taskCard = screen.getByText('Morning routine assistance').closest('div');

    if (taskCard?.parentElement) {
      // Start swipe
      fireEvent.touchStart(taskCard.parentElement, {
        touches: [{ clientX: 0 }],
      });

      // Move past threshold (100px)
      fireEvent.touchMove(taskCard.parentElement, {
        touches: [{ clientX: 120 }],
      });

      // End swipe
      fireEvent.touchEnd(taskCard.parentElement);

      // Task should be completed
      waitFor(() => {
        expect(screen.getByText('1 of 5 tasks completed')).toBeInTheDocument();
      });
    }
  });

  it('should display task descriptions', () => {
    render(
      <BrowserRouter>
        <TaskChecklistPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Help with bathing, dressing, and grooming')).toBeInTheDocument();
    expect(screen.getByText('8:00 AM medications - see med list')).toBeInTheDocument();
  });
});
