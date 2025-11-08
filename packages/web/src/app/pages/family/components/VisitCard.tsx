import React from 'react';

interface Visit {
  id: string;
  caregiver_name: string;
  scheduled_start: string;
  scheduled_end: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  check_in_time?: string;
  check_out_time?: string;
}

interface VisitCardProps {
  visit: Visit;
}

export const VisitCard: React.FC<VisitCardProps> = ({ visit }) => {
  const statusColors = {
    scheduled: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{visit.caregiver_name}</h3>
          <p className="text-sm text-gray-600">
            {formatTime(visit.scheduled_start)} - {formatTime(visit.scheduled_end)}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            statusColors[visit.status]
          }`}
        >
          {visit.status.replace('_', ' ')}
        </span>
      </div>
      {visit.check_in_time && (
        <div className="text-xs text-gray-500 mt-2">
          <span className="inline-flex items-center">
            <span className="mr-1">✓</span>
            Checked in at {formatTime(visit.check_in_time)}
          </span>
        </div>
      )}
      {visit.check_out_time && (
        <div className="text-xs text-gray-500 mt-1">
          <span className="inline-flex items-center">
            <span className="mr-1">✓</span>
            Checked out at {formatTime(visit.check_out_time)}
          </span>
        </div>
      )}
    </div>
  );
};
