import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, AlertTriangle, Calendar, FileText } from 'lucide-react';
import { Button, LoadingSpinner, EmptyState, ErrorMessage, Card, StatusBadge } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { ClientSearch } from '../components';
import { useClientsDashboard } from '../hooks';
import type { ClientSearchFilters } from '../types';

interface DashboardClient {
  id: string;
  clientNumber: string;
  fullName: string;
  preferredName?: string;
  age: number;
  status: string;
  primaryPhone?: string | null;
  address?: {
    line1: string;
    city: string;
    state: string;
  } | null;
  alertsCount: number;
  criticalAlerts: number;
  hasCriticalRisks: boolean;
  programs: Array<{
    id: string;
    name: string;
  }>;
  nextVisit?: {
    date: Date;
    startTime: string;
  } | null;
  lastVisitDate?: Date | null;
  outstandingTasks: number;
}

export const ClientDashboard: React.FC = () => {
  const { can } = usePermissions();
  const [filters, setFilters] = useState<ClientSearchFilters>({});
  const [page, setPage] = useState(1);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useClientsDashboard({ ...filters, page });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard';
    return (
      <ErrorMessage
        message={errorMessage}
        retry={() => void refetch()}
      />
    );
  }

  const clients = (data?.items ?? []) as DashboardClient[];

  const toggleExpand = (clientId: string) => {
    setExpandedClientId(expandedClientId === clientId ? null : clientId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {data?.total ?? 0} total clients
          </p>
        </div>
        {can('clients:write') && (
          <Link to="/clients/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              New Client
            </Button>
          </Link>
        )}
      </div>

      <ClientSearch filters={filters} onFiltersChange={setFilters} />

      {clients.length === 0 ? (
        <EmptyState
          title="No clients found"
          description="Adjust your filters or create a new client."
          action={
            can('clients:write') ? (
              <Link to="/clients/new">
                <Button leftIcon={<Plus className="h-4 w-4" />}>
                  Create Client
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {clients.map((client) => (
            <Card key={client.id} padding="md" hover>
              <div className="space-y-4">
                {/* Header */}
                <div 
                  className="flex justify-between items-start cursor-pointer"
                  onClick={() => toggleExpand(client.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Link 
                        to={`/clients/${client.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {client.preferredName ?? client.fullName}
                      </Link>
                      <StatusBadge status={client.status} />
                      {client.hasCriticalRisks && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                          <AlertTriangle className="h-3 w-3" />
                          Critical
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{client.clientNumber}</span>
                      <span>Age: {client.age}</span>
                      {client.primaryPhone && <span>{client.primaryPhone}</span>}
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    {client.alertsCount > 0 && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-yellow-50 rounded">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-800 font-medium">{client.alertsCount}</span>
                      </div>
                    )}
                    {client.nextVisit && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-800 font-medium">
                          {new Date(client.nextVisit.date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedClientId === client.id && (
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    {client.address && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Address:</span> {client.address.line1}, {client.address.city}, {client.address.state}
                      </div>
                    )}
                    
                    {client.programs.length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Active Programs:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {client.programs.map((program) => (
                            <span
                              key={program.id}
                              className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded"
                            >
                              {program.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                      {client.outstandingTasks > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                          {client.outstandingTasks} outstanding task{client.outstandingTasks > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {client.lastVisitDate && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Last Visit:</span> {new Date(client.lastVisitDate).toLocaleDateString()}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Link to={`/clients/${client.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      <Link to={`/clients/${client.id}/care-plans`}>
                        <Button variant="outline" size="sm">
                          Care Plans
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > data.items.length && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
          )}
          <span className="flex items-center px-4 text-sm text-gray-700">
            Showing {data.items.length} of {data.total} clients
          </span>
          {data.items.length < data.total && (
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
