/**
 * Holiday Preview Component
 *
 * Displays holidays that will be skipped in a date range
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface HolidayPreviewProps {
  startDate: Date;
  endDate: Date;
  branchId: string;
}

interface Holiday {
  id: string;
  name: string;
  holiday_date: string;
}

export const HolidayPreview: React.FC<HolidayPreviewProps> = ({
  startDate,
  endDate,
  branchId,
}) => {
  const { data: holidays, isLoading, error } = useQuery<Holiday[]>({
    queryKey: ['holidays', startDate.toISOString(), endDate.toISOString(), branchId],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        branchId,
      });

      const response = await fetch(`/api/holidays?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch holidays');
      }
      return response.json();
    },
    enabled: !!startDate && !!endDate && !!branchId,
  });

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500">
        Loading holidays...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        Error loading holidays
      </div>
    );
  }

  if (!holidays || holidays.length === 0) {
    return (
      <p className="text-sm text-green-600">
        ✓ No holidays in this period
      </p>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ul className="space-y-1">
      {holidays.map((holiday) => (
        <li key={holiday.id} className="text-sm text-gray-700">
          • {holiday.name} ({formatDate(holiday.holiday_date)})
        </li>
      ))}
    </ul>
  );
};
