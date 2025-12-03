/**
 * Activity Card Component
 *
 * Display a single activity feed item
 */

import React from 'react';
import type { ActivityFeedItem } from '@folkcare/family-engagement';

interface ActivityCardProps {
  activity: ActivityFeedItem;
}

const activityIcons: Record<string, string> = {
  VISIT_SCHEDULED: '📅',
  VISIT_STARTED: '▶️',
  VISIT_COMPLETED: '✅',
  VISIT_CANCELLED: '❌',
  CARE_PLAN_UPDATED: '📋',
  GOAL_ACHIEVED: '🎯',
  TASK_COMPLETED: '✓',
  NOTE_ADDED: '📝',
  INCIDENT_REPORTED: '⚠️',
  MESSAGE_RECEIVED: '💬',
  DOCUMENT_UPLOADED: '📄',
};

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const icon = activityIcons[activity.activityType] || '•';
  const timestamp = new Date(activity.occurredAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Icon */}
      <div className="flex-shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl">
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900">{activity.title}</h3>
          <span className="text-xs text-gray-500 whitespace-nowrap">{timestamp}</span>
        </div>
        <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
        {activity.performedByName && (
          <p className="mt-2 text-xs text-gray-500">By: {activity.performedByName}</p>
        )}
      </div>
    </div>
  );
};
