import React, { useState } from 'react';
import { Clock, Grid, List } from 'lucide-react';
import { LoadingSpinner, EmptyState, ErrorMessage } from '@/core/components';
import { useEVVRecords } from '../hooks';
import { EVVRecordCard, EVVRecordSearch } from '../components';
import type { EVVSearchFilters } from '../types';

export const EVVRecordList: React.FC = () => {
  const [filters, setFilters] = useState<EVVSearchFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data, isLoading, error, refetch } = useEVVRecords(filters);

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
        message={(error as Error).message || 'Failed to load EVV records'}
        retry={refetch}
      />
    );
  }

  const records = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Tracking & EVV</h1>
          <p className="text-gray-600 mt-1">
            {data?.total || 0} total records
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${
                viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
              aria-label="Grid view"
            >
              {/* @ts-ignore */}
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${
                viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
              aria-label="List view"
            >
              {/* @ts-ignore */}
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <EVVRecordSearch filters={filters} onFiltersChange={setFilters} />

      {records.length === 0 ? (
        <EmptyState
          title="No EVV records found"
          description="Visit records will appear here once caregivers clock in."
          icon={(() => { 
            // @ts-ignore 
            return <Clock className="h-12 w-12" />; 
          })()}
        />
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {records.map((record) => (
            <EVVRecordCard
              key={record.id}
              record={record}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}
    </div>
  );
};
