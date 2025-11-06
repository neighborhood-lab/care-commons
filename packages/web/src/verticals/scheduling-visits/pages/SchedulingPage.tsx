import React, { useState, useMemo } from 'react';
import { startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay, endOfDay } from 'date-fns';
import {
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  RefreshCw,
  Download,
} from 'lucide-react';
import { Button, LoadingSpinner, ErrorMessage, Input, Select } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { formatDate } from '@/core/utils';
import { useVisits, useSchedulingStats } from '../hooks';
import {
  VisitCard,
  WeekCalendarView,
  SchedulingStatsCards,
  AssignmentModal,
} from '../components';
import type { CalendarView, VisitSearchFilters, VisitStatus, VisitWithDetails } from '../types';

export const SchedulingPage: React.FC = () => {
  const { can } = usePermissions();

  // View state
  const [viewMode, setViewMode] = useState<CalendarView>('week');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<VisitStatus[]>([]);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);

  // Modal state
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    if (viewMode === 'week') {
      return {
        start: startOfWeek(currentWeek),
        end: endOfWeek(currentWeek),
      };
    }
    // For list view, show current week + next week
    return {
      start: startOfDay(new Date()),
      end: endOfDay(addWeeks(new Date(), 2)),
    };
  }, [viewMode, currentWeek]);

  // Build filters
  const filters: VisitSearchFilters = useMemo(
    () => ({
      query: searchQuery || undefined,
      dateFrom: dateRange.start,
      dateTo: dateRange.end,
      status: selectedStatus.length > 0 ? selectedStatus : undefined,
      isUnassigned: showUnassignedOnly || undefined,
    }),
    [searchQuery, dateRange, selectedStatus, showUnassignedOnly]
  );

  // Fetch data
  const { data: visitsData, isLoading, error, refetch } = useVisits(filters);
  const { data: stats } = useSchedulingStats(dateRange);

  const visits = visitsData?.items || [];

  const handlePreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const handleToday = () => setCurrentWeek(new Date());

  const handleAssignClick = (visitId: string) => {
    setSelectedVisitId(visitId);
    setAssignmentModalOpen(true);
  };

  const handleVisitClick = (visit: VisitWithDetails) => {
    // Could navigate to visit detail or open quick view modal
    console.log('Visit clicked:', visit);
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'UNASSIGNED', label: 'Unassigned' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Scheduling</h1>
        <ErrorMessage
          message={(error as Error).message || 'Failed to load visits'}
          retry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduling</h1>
          <p className="text-gray-600 mt-1">
            {viewMode === 'week'
              ? `Week of ${formatDate(startOfWeek(currentWeek))}`
              : 'All upcoming visits'}
          </p>
        </div>

        <div className="flex gap-2">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button variant="outline" onClick={() => refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>

          {can('visits:export') && (
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && <SchedulingStatsCards stats={stats} />}

      {/* Filters and Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              placeholder="Search by visit number, client name, or caregiver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filters {selectedStatus.length > 0 || showUnassignedOnly ? `(${selectedStatus.length + (showUnassignedOnly ? 1 : 0)})` : ''}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="Status"
                options={statusOptions}
                value={selectedStatus[0] || ''}
                onChange={(e) =>
                  setSelectedStatus(e.target.value ? [e.target.value as VisitStatus] : [])
                }
              />

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="unassignedOnly"
                  checked={showUnassignedOnly}
                  onChange={(e) => setShowUnassignedOnly(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="unassignedOnly" className="text-sm font-medium text-gray-700">
                  Show unassigned only
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus([]);
                  setShowUnassignedOnly(false);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Week Navigation (only for week view) */}
      {viewMode === 'week' && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
          <Button variant="ghost" size="sm" onClick={handlePreviousWeek} leftIcon={<ChevronLeft className="h-4 w-4" />}>
            Previous Week
          </Button>

          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>

          <Button variant="ghost" size="sm" onClick={handleNextWeek} rightIcon={<ChevronRight className="h-4 w-4" />}>
            Next Week
          </Button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {viewMode === 'week' ? (
            <WeekCalendarView
              visits={visits}
              weekStart={currentWeek}
              onVisitClick={handleVisitClick}
              onAssignClick={handleAssignClick}
            />
          ) : (
            <>
              {visits.length > 0 ? (
                <div className="space-y-4">
                  {visits.map((visit) => (
                    <VisitCard
                      key={visit.id}
                      visit={visit}
                      compact
                      onAssign={handleAssignClick}
                      showActions
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No visits found</h3>
                  <p className="text-gray-600 mt-2">
                    {searchQuery || selectedStatus.length > 0 || showUnassignedOnly
                      ? 'Try adjusting your filters'
                      : 'No visits scheduled for this period'}
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Assignment Modal */}
      {assignmentModalOpen && selectedVisitId && (
        <AssignmentModal
          visitId={selectedVisitId}
          onClose={() => {
            setAssignmentModalOpen(false);
            setSelectedVisitId(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
};
