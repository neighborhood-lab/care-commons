/**
 * Activity Filters Component
 *
 * Filter activity feed by date range and type
 */

import React from 'react';
import type { ActivityType } from '@care-commons/family-engagement';

interface ActivityFiltersProps {
  selectedTypes: ActivityType[];
  onTypeChange: (types: ActivityType[]) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
}

const activityTypes: { value: ActivityType; label: string }[] = [
  { value: 'VISIT_COMPLETED', label: 'Visits' },
  { value: 'TASK_COMPLETED', label: 'Tasks' },
  { value: 'CARE_PLAN_UPDATED', label: 'Care Plans' },
  { value: 'GOAL_ACHIEVED', label: 'Goals' },
  { value: 'NOTE_ADDED', label: 'Notes' },
  { value: 'MESSAGE_RECEIVED', label: 'Messages' },
];

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  selectedTypes,
  onTypeChange,
  dateRange,
  onDateRangeChange,
}) => {
  const handleTypeToggle = (type: ActivityType) => {
    if (selectedTypes.includes(type)) {
      onTypeChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypeChange([...selectedTypes, type]);
    }
  };

  const handlePresetRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onDateRangeChange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Filter Activities</h3>

      {/* Date Range Presets */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-2">Time Period</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handlePresetRange(7)}
            className="rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200"
          >
            Last 7 days
          </button>
          <button
            onClick={() => handlePresetRange(30)}
            className="rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200"
          >
            Last 30 days
          </button>
          <button
            onClick={() => handlePresetRange(90)}
            className="rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200"
          >
            Last 90 days
          </button>
        </div>
      </div>

      {/* Custom Date Range */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Activity Types */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Activity Types</label>
        <div className="space-y-2">
          {activityTypes.map((type) => (
            <label key={type.value} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type.value)}
                onChange={() => handleTypeToggle(type.value)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear All */}
      {selectedTypes.length > 0 && (
        <button
          onClick={() => onTypeChange([])}
          className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};
