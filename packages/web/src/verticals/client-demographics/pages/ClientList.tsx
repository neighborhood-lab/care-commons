import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Grid, List, Users, Sparkles } from 'lucide-react';
import { 
  Button, 
  LoadingSpinner, 
  ErrorMessage, 
  EmptyState,
  DemoDataBanner 
} from '@/core/components';
import { usePermissions, useDemoData } from '@/core/hooks';
import { useClients } from '../hooks';
import { ClientCard, ClientSearch } from '../components';
import type { ClientSearchFilters } from '../types';

export const ClientList: React.FC = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [filters, setFilters] = useState<ClientSearchFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data, isLoading, error, refetch } = useClients(filters);
  const {
    hasDemoData,
    isSeeding,
    isClearing,
    seedDemoData,
    clearDemoData,
    stats,
  } = useDemoData();

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

      {/* Demo Data Banner */}
      {hasDemoData && (
        <DemoDataBanner
          onClearDemo={clearDemoData}
          onAddRealData={() => navigate('/clients/new')}
          isClearing={isClearing}
          stats={stats || undefined}
        />
      )}

      <ClientSearch filters={filters} onFiltersChange={setFilters} />

      {clients.length === 0 ? (
        <EmptyState
          title="No clients found"
          description={
            !hasDemoData
              ? "Get started by loading sample data to explore the platform, or add your first client."
              : "Get started by creating your first client."
          }
          icon={<Users />}
          size="lg"
          action={
            !hasDemoData ? (
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Sparkles className="h-4 w-4" />}
                onClick={() => void seedDemoData()}
                isLoading={isSeeding}
              >
                Load Sample Data
              </Button>
            ) : (
              can('clients:write') && (
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => navigate('/clients/new')}
                >
                  Add Client
                </Button>
              )
            )
          }
          secondaryAction={
            !hasDemoData && can('clients:write') ? (
              <Button
                variant="outline"
                size="lg"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => navigate('/clients/new')}
              >
                Add Client
              </Button>
            ) : null
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
