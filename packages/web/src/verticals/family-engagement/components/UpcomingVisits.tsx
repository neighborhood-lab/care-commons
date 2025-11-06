/**
 * Upcoming Visits Component
 *
 * Display next 7 days of scheduled visits
 */

import React from 'react';
import type { VisitSummary } from '@care-commons/family-engagement';

interface UpcomingVisitsProps {
  visits: VisitSummary[];
}

export const UpcomingVisits: React.FC<UpcomingVisitsProps> = ({ visits }) => {
  if (visits.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Visits</h2>
        <div className="text-center py-4">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-sm text-gray-600">No upcoming visits scheduled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Visits (Next 7 Days)</h2>
      <div className="space-y-3">
        {visits.map((visit) => {
          const startTime = new Date(visit.scheduledStartTime);
          const endTime = new Date(visit.scheduledEndTime);
          const dateStr = startTime.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
          const timeStr = `${startTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })} - ${endTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}`;

          const statusColor =
            visit.status === 'SCHEDULED'
              ? 'bg-blue-100 text-blue-800'
              : visit.status === 'IN_PROGRESS'
              ? 'bg-green-100 text-green-800'
              : visit.status === 'COMPLETED'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-red-100 text-red-800';

          return (
            <div
              key={visit.id}
              className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                {visit.caregiverPhotoUrl ? (
                  <img
                    src={visit.caregiverPhotoUrl}
                    alt={visit.caregiverName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-200 text-lg font-semibold text-blue-700">
                    {visit.caregiverName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {visit.caregiverName}
                  </h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                    {visit.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{dateStr}</p>
                <p className="text-xs text-gray-600">{timeStr}</p>
              </div>
            </div>
          );
        })}
      </div>
      {visits.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-4">
          No visits scheduled for the next 7 days
        </p>
      )}
    </div>
  );
};
