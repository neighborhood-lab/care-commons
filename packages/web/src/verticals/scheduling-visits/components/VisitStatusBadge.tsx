import React from 'react';
import { Badge } from '@/core/components';
import type { VisitStatus } from '../types';

interface VisitStatusBadgeProps {
  status: VisitStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<VisitStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  DRAFT: { label: 'Draft', variant: 'default' },
  SCHEDULED: { label: 'Scheduled', variant: 'info' },
  UNASSIGNED: { label: 'Unassigned', variant: 'warning' },
  ASSIGNED: { label: 'Assigned', variant: 'info' },
  CONFIRMED: { label: 'Confirmed', variant: 'success' },
  EN_ROUTE: { label: 'En Route', variant: 'info' },
  ARRIVED: { label: 'Arrived', variant: 'info' },
  IN_PROGRESS: { label: 'In Progress', variant: 'info' },
  PAUSED: { label: 'Paused', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  INCOMPLETE: { label: 'Incomplete', variant: 'warning' },
  CANCELLED: { label: 'Cancelled', variant: 'default' },
  NO_SHOW_CLIENT: { label: 'No Show (Client)', variant: 'error' },
  NO_SHOW_CAREGIVER: { label: 'No Show (Caregiver)', variant: 'error' },
  REJECTED: { label: 'Rejected', variant: 'error' },
};

export const VisitStatusBadge: React.FC<VisitStatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
};
