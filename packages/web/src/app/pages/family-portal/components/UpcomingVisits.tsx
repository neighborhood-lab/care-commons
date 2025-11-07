import React from 'react';
import { Card } from '@/core/components';
import { Calendar, Clock, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useUpcomingVisits } from '@/app/hooks/useFamilyPortal';
import { Loader2 } from 'lucide-react';

interface UpcomingVisitsProps {
  clientId: string;
}

export const UpcomingVisits: React.FC<UpcomingVisitsProps> = ({ clientId }) => {
  const { data: visits, isLoading } = useUpcomingVisits(clientId);

  if (isLoading) {
    return (
      <Card padding="lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Visits</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </Card>
    );
  }

  if (!visits || visits.length === 0) {
    return (
      <Card padding="lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Visits</h2>
        <p className="text-gray-600">No upcoming visits scheduled</p>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Visits</h2>
      <div className="space-y-4">
        {visits.slice(0, 5).map((visit) => {
          const startDate = parseISO(visit.scheduledStartTime);
          const endDate = parseISO(visit.scheduledEndTime);

          return (
            <div key={visit.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 rounded-lg bg-blue-100 flex flex-col items-center justify-center">
                  <p className="text-xs font-medium text-blue-600 uppercase">
                    {format(startDate, 'MMM')}
                  </p>
                  <p className="text-lg font-bold text-blue-700">{format(startDate, 'd')}</p>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-semibold text-gray-900">
                        {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center space-x-2">
                      {visit.caregiverPhotoUrl ? (
                        <img
                          src={visit.caregiverPhotoUrl}
                          alt={visit.caregiverName}
                          className="h-6 w-6 rounded-full"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                      <p className="text-sm text-gray-700">{visit.caregiverName}</p>
                    </div>

                    {visit.status === 'CANCELLED' && (
                      <p className="mt-2 text-sm text-red-600 font-medium">Cancelled</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
