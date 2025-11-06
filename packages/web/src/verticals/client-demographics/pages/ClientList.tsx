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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">
            {data?.total || 0} total clients
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all ${
                viewMode === 'grid' ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
              }`}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all ${
                viewMode === 'list' ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
              }`}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
          {can('clients:write') && (
            <Link to="/clients/new" className="flex-1 sm:flex-initial">
              <Button leftIcon={<Plus className="h-4 w-4" />} className="w-full sm:w-auto">
                <span className="hidden sm:inline">New Client</span>
                <span className="sm:hidden">New</span>
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

      {data && data.hasMore && (
        <div className="flex justify-center">
          <Button variant="outline">Load More</Button>
        </div>
      )}
    </div>
  );
};
