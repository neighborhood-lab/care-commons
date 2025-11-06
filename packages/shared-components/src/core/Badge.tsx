import React from 'react';
import { cn } from '../utils/classnames.js';
import type { Status } from '../types/ui.js';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: Status | 'default';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses = {
  default: 'bg-neutral-800 text-neutral-200',
  success: 'bg-green-900/50 text-green-300 border border-green-800',
  error: 'bg-red-900/50 text-red-300 border border-red-800',
  warning: 'bg-yellow-900/50 text-yellow-300 border border-yellow-800',
  info: 'bg-blue-900/50 text-blue-300 border border-blue-800',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusMap: Record<string, { variant: Status | 'default'; label: string }> = {
    ACTIVE: { variant: 'success', label: 'Active' },
    INACTIVE: { variant: 'default', label: 'Inactive' },
    PENDING: { variant: 'warning', label: 'Pending' },
    COMPLETED: { variant: 'success', label: 'Completed' },
    CANCELLED: { variant: 'error', label: 'Cancelled' },
    SCHEDULED: { variant: 'info', label: 'Scheduled' },
  };

  const config = statusMap[status] || { variant: 'default' as const, label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
