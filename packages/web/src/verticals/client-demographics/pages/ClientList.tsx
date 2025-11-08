import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Grid, List } from 'lucide-react';
import { Button, LoadingSpinner, EmptyState, ErrorMessage } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { useClients } from '../hooks';
import { ClientCard, ClientSearch } from '../components';
import type { ClientSearchFilters } from '../types';

export const ClientList: React.FC = () => {
  const { can } = usePermissions();
  const [filters, setFilters] = useState<ClientSearchFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data, isLoading, error, refetch } = useClients(filters);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={(error as Error).message || 'Failed to load clients'}
        retry={refetch}
      />
    );
  }

  const clients = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">
            {data?.total || 0} total clients
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${
                viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${
                viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
          {can('clients:write') && (
            <Link to="/clients/new">
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                New Client
              </Button>
            </Link>
          )}
        </div>
      </div>

      <ClientSearch filters={filters} onFiltersChange={setFilters} />

      {clients.length === 0 ? (
        <EmptyState
          title="No clients found"
          description="Get started by creating your first client."
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
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}

      {data?.hasMore && (
        <div className="flex justify-center">
          <Button variant="outline">Load More</Button>
        </div>
      )}
    </div>
  );
};
