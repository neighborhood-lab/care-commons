import React from 'react';
import { ActivityFeed } from './components/ActivityFeed';

// Temporary: In production, this would come from auth context
const FAMILY_MEMBER_ID = 'family-member-1';

export const ActivityPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Activity Feed</h1>
        <p className="mt-2 text-lg text-gray-600">
          View all care activities and updates
        </p>
      </div>

      <ActivityFeed
        familyMemberId={FAMILY_MEMBER_ID}
        limit={50}
        showFilters={true}
      />
    </div>
  );
};
