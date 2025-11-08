import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/core/components';
import { Badge } from '@/core/components';
import { VisitTimeline } from './components/VisitTimeline';
import { api } from '@/services/api';

interface Visit {
  id: string;
  caregiver_name: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  notes?: string;
}

export const VisitDetailsPage: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();

  const { data: visit, isLoading } = useQuery<Visit>({
    queryKey: ['visit', visitId],
    queryFn: () => api.get(`/api/family/visits/${visitId}`),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!visit) return <div>Visit not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Visit Details</h1>
            <p className="text-gray-600 mt-2">
              {visit.caregiver_name} • {new Date(visit.scheduled_start).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={visit.status === 'completed' ? 'success' : 'default'}>
            {visit.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Visit Timeline">
          <VisitTimeline visitId={visitId!} />
        </Card>

        <Card title="Visit Information">
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Caregiver</dt>
              <dd className="mt-1 text-sm text-gray-900">{visit.caregiver_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Scheduled Time</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(visit.scheduled_start).toLocaleString()} -{' '}
                {new Date(visit.scheduled_end).toLocaleTimeString()}
              </dd>
            </div>
            {visit.notes && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900">{visit.notes}</dd>
              </div>
            )}
          </dl>
        </Card>
      </div>
    </div>
  );
};
