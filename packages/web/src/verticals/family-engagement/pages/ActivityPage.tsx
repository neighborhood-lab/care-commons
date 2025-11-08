/**
 * Activity Page
 *
 * Full activity feed with filtering
 */

import React, { useState } from 'react';
import type { ActivityType } from '@care-commons/family-engagement';
import { useRecentActivity } from '../hooks';
import { ActivityFeed, ActivityFilters } from '../components';

// Calculate default date range outside component to avoid impure function during render
const getDefaultDateRange = () => ({
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
  end: new Date().toISOString().split('T')[0]!,
});

export const ActivityPage: React.FC = () => {
  const familyMemberId = sessionStorage.getItem('familyMemberId') ?? null;

  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([]);
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  const { data: activities, isLoading } = useRecentActivity(familyMemberId, 100);

  // Filter activities based on selected types and date range
  const filteredActivities = activities?.filter((activity) => {
    // Type filter
    if (selectedTypes.length > 0 && !selectedTypes.includes(activity.activityType)) {
      return false;
    }

    // Date range filter
    const activityDate = new Date(activity.occurredAt).toISOString().split('T')[0]!;
    if (activityDate < dateRange.start || activityDate > dateRange.end) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
        <p className="mt-1 text-gray-600">
          View all care activities, visits, tasks, and updates
        </p>
      </div>

      {/* Layout */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <ActivityFilters
            selectedTypes={selectedTypes}
            onTypeChange={setSelectedTypes}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-3">
          {filteredActivities && filteredActivities.length > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredActivities.length} of {activities?.length || 0} activities
            </div>
          )}
          <ActivityFeed activities={filteredActivities || []} loading={isLoading} />
        </div>
      </div>
    </div>
  );
};
