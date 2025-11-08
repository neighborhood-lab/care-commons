import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/core/components';
import { Button } from '@/core/components';
import { VisitCard } from './components/VisitCard';
import { MessageList } from './components/MessageList';
import { CarePlanSummary } from './components/CarePlanSummary';
import { api } from '@/services/api';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

export const FamilyDashboard: React.FC = () => {
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['family', 'clients'],
    queryFn: () => api.get('/api/family/clients'),
  });

  const selectedClientId = clients?.[0]?.id;

  const { data: todaysVisits } = useQuery({
    queryKey: ['family', 'visits', 'today', selectedClientId],
    queryFn: () => api.get(`/api/family/clients/${selectedClientId}/visits/today`),
    enabled: !!selectedClientId,
  });

  const { data: recentMessages } = useQuery({
    queryKey: ['family', 'messages', selectedClientId],
    queryFn: () => api.get(`/api/family/clients/${selectedClientId}/messages`),
    enabled: !!selectedClientId,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Family Portal</h1>

      {/* Client Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">Viewing care for:</label>
        <select className="form-select border border-gray-300 rounded-md px-3 py-2">
          {clients?.map((client) => (
            <option key={client.id} value={client.id}>
              {client.first_name} {client.last_name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Visits */}
        <Card title="Today's Visits" className="col-span-1">
          {todaysVisits?.length === 0 ? (
            <p className="text-gray-500">No visits scheduled for today</p>
          ) : (
            <div className="space-y-4">
              {todaysVisits?.map((visit: any) => (
                <VisitCard key={visit.id} visit={visit} />
              ))}
            </div>
          )}
        </Card>

        {/* Recent Messages */}
        <Card title="Recent Messages" className="col-span-1">
          <MessageList messages={recentMessages} clientId={selectedClientId} />
          <Button variant="primary" className="mt-4 w-full">
            Send Message
          </Button>
        </Card>

        {/* Care Plan Summary */}
        <Card title="Current Care Plan" className="col-span-2">
          <CarePlanSummary clientId={selectedClientId} />
        </Card>
      </div>
    </div>
  );
};
