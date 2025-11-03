import React, { useState } from 'react';
import { Grid, List } from 'lucide-react';
import { LoadingSpinner, EmptyState, ErrorMessage } from '@/core/components';
import { useOpenShifts, useMatchingMetrics } from '../hooks';
import { OpenShiftCard, MatchingMetricsCard } from '../components';
import type { OpenShiftSearchFilters, MatchingStatus, ShiftPriority } from '../types';

export const OpenShiftList: React.FC = () => {
  const [filters, setFilters] = useState<OpenShiftSearchFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data: shiftsData, isLoading, error, refetch } = useOpenShifts(filters);
  const { data: metrics } = useMatchingMetrics();

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
        message={(error as Error).message || 'Failed to load open shifts'}
        retry={refetch}
      />
    );
  }

  const shifts = shiftsData?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Matching</h1>
          <p className="text-gray-600 mt-1">{shiftsData?.total || 0} open shifts</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              aria-label="Grid view"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              aria-label="List view"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {metrics && <MatchingMetricsCard metrics={metrics} />}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.matchingStatus || ''}
              onChange={(e) =>
                setFilters({ ...filters, matchingStatus: e.target.value as MatchingStatus })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="MATCHING">Matching</option>
              <option value="MATCHED">Matched</option>
              <option value="PROPOSED">Proposed</option>
              <option value="NO_MATCH">No Match</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority || ''}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value as ShiftPriority })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {shifts.length === 0 ? (
        <EmptyState
          title="No open shifts found"
          description="All shifts are currently assigned or there are no shifts matching your filters."
        />
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {shifts.map((shift) => (
            <OpenShiftCard key={shift.id} shift={shift} compact={viewMode === 'list'} />
          ))}
        </div>
      )}
    </div>
  );
};
