/**
 * Activity Feed Component
 *
 * Timeline of care activities
 */

import React from 'react';
import type { ActivityFeedItem } from '@care-commons/family-engagement';
import { ActivityCard } from './ActivityCard';

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  loading?: boolean;
  showLimit?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  loading = false,
  showLimit,
}) => {
  const displayedActivities = showLimit ? activities.slice(0, showLimit) : activities;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4">
              <div className="h-12 w-12 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-3xl">📋</p>
        <p className="mt-2 text-gray-600">No recent activities to display</p>
        <p className="mt-1 text-sm text-gray-500">
          Activity updates will appear here as caregivers provide care
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedActivities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
      {showLimit && activities.length > showLimit && (
        <p className="text-center text-sm text-gray-500">
          Showing {showLimit} of {activities.length} activities
        </p>
      )}
    </div>
  );
};
