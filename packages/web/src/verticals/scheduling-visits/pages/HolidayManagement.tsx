/**
 * Holiday Management Page
 *
 * Admin interface for managing holiday calendars
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/core/components';

interface HolidayCalendar {
  id: string;
  name: string;
  description?: string;
  calendar_type: string;
  state_code?: string;
  is_active: boolean;
}

interface Holiday {
  id: string;
  name: string;
  holiday_date: string;
  calendar_id: string;
  calendar_name?: string;
}

export const HolidayManagementPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: calendars, isLoading: calendarsLoading } = useQuery<HolidayCalendar[]>({
    queryKey: ['holiday-calendars'],
    queryFn: async () => {
      const response = await fetch('/api/holiday-calendars');
      if (!response.ok) {
        throw new Error('Failed to fetch holiday calendars');
      }
      return response.json();
    },
  });

  const { data: holidays, isLoading: holidaysLoading } = useQuery<Holiday[]>({
    queryKey: ['holidays', selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/holidays/year/${selectedYear}`);
      if (!response.ok) {
        throw new Error('Failed to fetch holidays');
      }
      return response.json();
    },
  });

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
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Holiday Management</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Calendar selection */}
        <Card padding="md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Calendars</h2>

          {calendarsLoading ? (
            <div className="text-sm text-gray-500">Loading calendars...</div>
          ) : (
            <div className="space-y-2">
              {calendars?.map((cal) => (
                <label key={cal.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={cal.is_active}
                    readOnly
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{cal.name}</div>
                    <div className="text-xs text-gray-500">
                      {cal.calendar_type}
                      {cal.state_code && ` • ${cal.state_code}`}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </Card>

        {/* Holiday list */}
        <Card padding="md" className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Holidays {selectedYear}</h2>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {[2024, 2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {holidaysLoading ? (
            <div className="text-sm text-gray-500">Loading holidays...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Calendar
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {holidays?.map((holiday) => (
                      <tr key={holiday.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(holiday.holiday_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{holiday.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {holiday.calendar_name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <button
                            className="text-primary-600 hover:text-primary-900 font-medium"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-4 border-t">
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Add Holiday
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
