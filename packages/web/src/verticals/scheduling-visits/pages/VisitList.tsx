import React, { useState } from 'react';
import { Calendar, Grid, List, CalendarDays } from 'lucide-react';
import { LoadingSpinner, EmptyState, ErrorMessage } from '@/core/components';
import { useVisits } from '../hooks/useVisits';
import { VisitCard } from '../components';
import type { VisitSearchFilters } from '../types';

const getDefaultFilters = (): VisitSearchFilters => ({
  dateFrom: new Date(),
  dateTo: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
});

export const VisitList: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Default to show visits for the next 30 days
  const [filters] = useState<VisitSearchFilters>(getDefaultFilters);

  const { data: visits, isLoading, error, refetch } = useVisits(filters);

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
        message={(error as Error).message || 'Failed to load visits'}
        retry={() => { void refetch(); }}
      />
    );
  }

  const visitList = visits ?? [];
  const upcomingVisits = visitList.filter((v) => {
    const scheduledDate = typeof v.scheduledDate === 'string'
      ? new Date(v.scheduledDate)
      : v.scheduledDate;
    return scheduledDate >= new Date() && v.status !== 'CANCELLED' && v.status !== 'COMPLETED';
  });

  const completedVisits = visitList.filter((v) => v.status === 'COMPLETED');
  const unassignedVisits = visitList.filter((v) => v.status === 'UNASSIGNED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduling & Visits</h1>
          <p className="text-gray-600 mt-1">
            {visitList.length === 0
              ? 'No visits scheduled'
              : `${visitList.length} total visits`}
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
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${
                viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
              aria-label="List view"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {visitList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {upcomingVisits.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {unassignedVisits.length}
                </p>
              </div>
              <CalendarDays className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {completedVisits.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>
      )}

      {/* Visits List or Empty State */}
      {visitList.length === 0 ? (
        <EmptyState
          title="No visits scheduled"
          description="Visits will appear here once they are scheduled in the system. Check back later or contact your coordinator to schedule visits."
          icon={<Calendar className="h-12 w-12" />}
        />
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {visitList.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}
    </div>
  );
};
