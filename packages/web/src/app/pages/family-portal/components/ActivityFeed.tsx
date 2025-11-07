import React, { useState, useMemo } from 'react';
import { ActivityCard } from './ActivityCard';
import { ActivityFilters } from './ActivityFilters';
import { useActivityFeed } from '@/app/hooks/useFamilyPortal';
import { Loader2, AlertCircle } from 'lucide-react';

interface ActivityFeedProps {
  familyMemberId: string;
  limit?: number;
  showFilters?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  familyMemberId,
  limit = 20,
  showFilters = true,
}) => {
  const { data: activities, isLoading, error, refetch } = useActivityFeed(familyMemberId, limit);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Filter activities based on selected types
  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    if (selectedTypes.length === 0) return activities;

    return activities.filter((activity) => {
      // Extract base type from activity type (e.g., 'VISIT_SCHEDULED' -> 'VISIT')
      const baseType = activity.activityType.split('_')[0];
      return selectedTypes.includes(baseType || '');
    });
  }, [activities, selectedTypes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-600">Unable to load activity feed</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No activity to display yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <ActivityFilters
          selectedTypes={selectedTypes}
          onTypeChange={setSelectedTypes}
        />
      )}

      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No activities match your filters</p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))
        )}
      </div>
    </div>
  );
};
