import React from 'react';
import type { TaskStatus } from '../types';

export interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status, className = '' }) => {
  const variants: Record<TaskStatus, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    SKIPPED: 'bg-gray-100 text-gray-800',
    MISSED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
    ISSUE_REPORTED: 'bg-orange-100 text-orange-800',
  };

  const labels: Record<TaskStatus, string> = {
    SCHEDULED: 'Scheduled',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    SKIPPED: 'Skipped',
    MISSED: 'Missed',
    CANCELLED: 'Cancelled',
    ISSUE_REPORTED: 'Issue Reported',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[status]} ${className}`}
      role="status"
      aria-label={`Task status: ${labels[status]}`}
    >
      {labels[status]}
    </span>
  );
};
