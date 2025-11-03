import React from 'react';
import { Activity, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardContent, StatusBadge } from '@/core/components';
import { formatDate } from '@/core/utils';
import type { Intervention } from '../types';

export interface InterventionSectionProps {
  interventions: Intervention[];
  onInterventionClick?: (intervention: Intervention) => void;
}

export const InterventionSection: React.FC<InterventionSectionProps> = ({
  interventions,
  onInterventionClick,
}) => {
  if (interventions.length === 0) {
    return (
      <Card>
        <CardHeader title="Interventions" />
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No interventions defined yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Add interventions to outline care activities
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={`Interventions (${interventions.length})`} />
      <CardContent>
        <div className="space-y-4">
          {interventions.map((intervention) => (
            <div
              key={intervention.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                onInterventionClick ? 'hover:border-blue-300' : ''
              }`}
              onClick={() => onInterventionClick?.(intervention)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">{intervention.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{intervention.description}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {intervention.category.replace(/_/g, ' ')}
                    </span>

                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Started: {formatDate(intervention.startDate)}
                    </span>

                    {intervention.endDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Ends: {formatDate(intervention.endDate)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={intervention.status} />

                  {intervention.status === 'SUSPENDED' && (
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      Suspended
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <p className="text-sm font-medium text-blue-800 mb-1">Instructions:</p>
                <p className="text-sm text-blue-700">{intervention.instructions}</p>
              </div>

              {/* Notes */}
              {intervention.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">{intervention.notes}</p>
                </div>
              )}

              {/* Status-specific information */}
              {intervention.status === 'SUSPENDED' && (
                <div className="mt-3 p-3 bg-orange-50 rounded-md">
                  <p className="text-sm text-orange-700">
                    This intervention is currently suspended. Care activities should be paused until
                    further notice.
                  </p>
                </div>
              )}

              {intervention.status === 'DISCONTINUED' && (
                <div className="mt-3 p-3 bg-red-50 rounded-md">
                  <p className="text-sm text-red-700">
                    This intervention has been discontinued and is no longer part of the care plan.
                  </p>
                </div>
              )}

              {/* Duration indicator */}
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>
                  {intervention.endDate
                    ? `Duration: ${formatDate(intervention.startDate)} - ${formatDate(intervention.endDate)}`
                    : `Started: ${formatDate(intervention.startDate)} (Ongoing)`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
