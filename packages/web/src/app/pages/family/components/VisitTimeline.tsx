import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';

interface Visit {
  check_in_time?: string;
  check_out_time?: string;
  tasks_completed_time?: string;
  completed_tasks_count?: number;
  total_tasks_count?: number;
  caregiver_name?: string;
  status?: string;
}

export const VisitTimeline: React.FC<{ visitId: string }> = ({ visitId }) => {
  const { data: visit } = useQuery<Visit>({
    queryKey: ['visit', visitId],
    queryFn: () => api.get(`/api/family/visits/${visitId}`),
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
  });

  if (!visit) {
    return <div className="text-gray-500">Loading visit details...</div>;
  }

  const events = [
    {
      time: visit?.check_in_time,
      label: 'Checked In',
      icon: CheckCircle,
      color: 'text-green-500',
      description: `${visit?.caregiver_name} arrived`,
    },
    {
      time: visit?.tasks_completed_time,
      label: 'Tasks Completed',
      icon: CheckCircle,
      color: 'text-blue-500',
      description: `${visit?.completed_tasks_count}/${visit?.total_tasks_count} tasks completed`,
    },
    {
      time: visit?.check_out_time,
      label: 'Checked Out',
      icon: CheckCircle,
      color: 'text-green-500',
      description: 'Visit completed',
    },
  ].filter((event) => event.time);

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const Icon = event.icon;
        return (
          <div key={index} className="flex items-start space-x-4">
            <div className={`${event.color} mt-1`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{event.label}</p>
              <p className="text-sm text-gray-600">{event.description}</p>
              <p className="text-xs text-gray-500">
                {new Date(event.time!).toLocaleTimeString()}
              </p>
            </div>
          </div>
        );
      })}

      {visit?.status === 'in_progress' && (
        <div className="flex items-start space-x-4 opacity-50">
          <Clock className="w-6 h-6 text-gray-400 mt-1" />
          <div className="flex-1">
            <p className="font-medium">In Progress</p>
            <p className="text-sm text-gray-600">Visit is currently ongoing</p>
          </div>
        </div>
      )}
    </div>
  );
};
