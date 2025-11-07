import React from 'react';
import { Calendar, CalendarDays, Clock, Bell } from 'lucide-react';
import type { FrequencyPattern } from '../types';

export interface TaskFrequencyProps {
  pattern: FrequencyPattern;
  timesPerDay?: number;
  timesPerWeek?: number;
  className?: string;
}

export const TaskFrequency: React.FC<TaskFrequencyProps> = ({
  pattern,
  timesPerDay,
  timesPerWeek,
  className = ''
}) => {
  const getIconAndLabel = (): { icon: React.ReactElement; label: string } => {
    switch (pattern) {
      case 'DAILY':
        return {
          icon: <Calendar className="h-4 w-4" />,
          label: timesPerDay ? `${timesPerDay}x Daily` : 'Daily'
        };
      case 'WEEKLY':
        return {
          icon: <CalendarDays className="h-4 w-4" />,
          label: timesPerWeek ? `${timesPerWeek}x Weekly` : 'Weekly'
        };
      case 'BI_WEEKLY':
        return {
          icon: <CalendarDays className="h-4 w-4" />,
          label: 'Bi-Weekly'
        };
      case 'MONTHLY':
        return {
          icon: <CalendarDays className="h-4 w-4" />,
          label: 'Monthly'
        };
      case 'AS_NEEDED':
        return {
          icon: <Bell className="h-4 w-4" />,
          label: 'As Needed'
        };
      case 'CUSTOM':
        return {
          icon: <Clock className="h-4 w-4" />,
          label: 'Custom'
        };
      default:
        return {
          icon: <Calendar className="h-4 w-4" />,
          label: 'Once'
        };
    }
  };

  const { icon, label } = getIconAndLabel();

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm text-gray-600 ${className}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
};

export const getFrequencyLabel = (pattern: FrequencyPattern): string => {
  const labels: Record<FrequencyPattern, string> = {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    BI_WEEKLY: 'Bi-Weekly',
    MONTHLY: 'Monthly',
    AS_NEEDED: 'As Needed',
    CUSTOM: 'Custom',
  };

  return labels[pattern] || 'Once';
};
