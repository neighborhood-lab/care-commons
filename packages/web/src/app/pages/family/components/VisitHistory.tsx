import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { VisitCard } from './VisitCard';

interface Visit {
  id: string;
  caregiver_name: string;
  scheduled_start: string;
  scheduled_end: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  check_in_time?: string;
  check_out_time?: string;
}

export const VisitHistory: React.FC<{ clientId: string }> = ({ clientId }) => {
  const { data: visits, isLoading } = useQuery<Visit[]>({
    queryKey: ['family', 'visits', clientId],
    queryFn: () => api.get(`/api/family/clients/${clientId}/visits`),
  });

  if (isLoading) {
    return <div className="text-gray-500">Loading visit history...</div>;
  }

  if (!visits || visits.length === 0) {
    return <div className="text-gray-500">No visit history available</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Visit History</h3>
      <div className="space-y-3">
        {visits.map((visit) => (
          <VisitCard key={visit.id} visit={visit} />
        ))}
      </div>
    </div>
  );
};
