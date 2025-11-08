import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/core/components';
import { Tabs } from '@/core/components';
import { VisitHistory } from './components/VisitHistory';
import { CareTeam } from './components/CareTeam';
import { CarePlanDetails } from './components/CarePlanDetails';
import { Documents } from './components/Documents';
import { ClientOverview } from './components/ClientOverview';
import { api } from '@/services/api';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  care_start_date: string;
}

export const ClientDetails: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();

  const { data: client, isLoading } = useQuery<Client>({
    queryKey: ['family', 'client', clientId],
    queryFn: () => api.get(`/api/family/clients/${clientId}`),
  });

  if (isLoading) return <div>Loading...</div>;

  if (!client) return <div>Client not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Client Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {client.first_name} {client.last_name}
        </h1>
        <p className="text-gray-600">
          Care started: {new Date(client.care_start_date).toLocaleDateString()}
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: 'Overview',
            content: <ClientOverview client={client} />,
          },
          {
            id: 'visits',
            label: 'Visit History',
            content: <VisitHistory clientId={clientId!} />,
          },
          {
            id: 'care-plan',
            label: 'Care Plan',
            content: <CarePlanDetails clientId={clientId!} />,
          },
          {
            id: 'care-team',
            label: 'Care Team',
            content: <CareTeam clientId={clientId!} />,
          },
          {
            id: 'documents',
            label: 'Documents',
            content: <Documents clientId={clientId!} />,
          },
        ]}
      />
    </div>
  );
};
