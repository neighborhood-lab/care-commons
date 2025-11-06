/**
 * UnassignedVisitsPanel - shows visits that need caregiver assignment
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { LoadingSpinner, EmptyState, ErrorMessage } from '@/core/components';
import { useUnassignedVisits } from '../hooks';
import { VisitCard } from './VisitCard';

interface UnassignedVisitsPanelProps {
  branchId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  onAssignVisit: (visitId: string) => void;
}

export const UnassignedVisitsPanel: React.FC<UnassignedVisitsPanelProps> = ({
  branchId,
  dateFrom,
  dateTo,
  onAssignVisit,
}) => {
  const { data: visits, isLoading, error, refetch } = useUnassignedVisits(
    branchId,
    dateFrom,
    dateTo
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={(error as Error).message || 'Failed to load unassigned visits'}
        retry={refetch}
      />
    );
  }

  if (!visits || visits.length === 0) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-12 w-12 text-gray-400" />}
        title="No unassigned visits"
        description="All visits have been assigned to caregivers."
      />
    );
  }

  const urgentVisits = visits.filter((v) => v.isUrgent);
  const regularVisits = visits.filter((v) => !v.isUrgent);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Unassigned Visits
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {visits.length} visit{visits.length !== 1 ? 's' : ''} need{visits.length === 1 ? 's' : ''} a caregiver
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {urgentVisits.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Urgent ({urgentVisits.length})
          </h3>
          <div className="space-y-3">
            {urgentVisits.map((visit) => (
              <VisitCard
                key={visit.id}
                visit={{
                  ...visit,
                  scheduledDate: new Date(visit.scheduledDate),
                  createdAt: visit.createdAt ? new Date(visit.createdAt) : new Date(visit.scheduledDate),
                  updatedAt: visit.updatedAt ? new Date(visit.updatedAt) : new Date(visit.scheduledDate),
                }}
                compact
                onAssign={onAssignVisit}
              />
            ))}
          </div>
        </div>
      )}

      {regularVisits.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Regular ({regularVisits.length})
          </h3>
          <div className="space-y-3">
            {regularVisits.map((visit) => (
              <VisitCard
                key={visit.id}
                visit={{
                  ...visit,
                  scheduledDate: new Date(visit.scheduledDate),
                  createdAt: visit.createdAt ? new Date(visit.createdAt) : new Date(visit.scheduledDate),
                  updatedAt: visit.updatedAt ? new Date(visit.updatedAt) : new Date(visit.scheduledDate),
                }}
                compact
                onAssign={onAssignVisit}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
