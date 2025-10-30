import React, { useState } from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';
import { Button, LoadingSpinner, EmptyState, ErrorMessage, Input, Select } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { useTasks } from '../hooks';
import { TaskCard } from '../components';
import type { TaskInstanceSearchFilters, TaskStatus, TaskCategory } from '../types';

export const TaskList: React.FC = () => {
  const { can } = usePermissions();
  const [filters, setFilters] = useState<TaskInstanceSearchFilters>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data, isLoading, error, refetch } = useTasks(filters);

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
        message={(error as Error).message || 'Failed to load tasks'}
        retry={refetch}
      />
    );
  }

  const tasks = data?.items || [];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'SKIPPED', label: 'Skipped' },
    { value: 'MISSED', label: 'Missed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'ISSUE_REPORTED', label: 'Issue Reported' },
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'PERSONAL_HYGIENE', label: 'Personal Hygiene' },
    { value: 'BATHING', label: 'Bathing' },
    { value: 'DRESSING', label: 'Dressing' },
    { value: 'GROOMING', label: 'Grooming' },
    { value: 'TOILETING', label: 'Toileting' },
    { value: 'MOBILITY', label: 'Mobility' },
    { value: 'TRANSFERRING', label: 'Transferring' },
    { value: 'AMBULATION', label: 'Ambulation' },
    { value: 'MEDICATION', label: 'Medication' },
    { value: 'MEAL_PREPARATION', label: 'Meal Preparation' },
    { value: 'FEEDING', label: 'Feeding' },
    { value: 'HOUSEKEEPING', label: 'Housekeeping' },
    { value: 'LAUNDRY', label: 'Laundry' },
    { value: 'SHOPPING', label: 'Shopping' },
    { value: 'TRANSPORTATION', label: 'Transportation' },
    { value: 'COMPANIONSHIP', label: 'Companionship' },
    { value: 'MONITORING', label: 'Monitoring' },
    { value: 'DOCUMENTATION', label: 'Documentation' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">
            {data?.total || 0} total tasks
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
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              placeholder="Search tasks..."
              value={filters.query || ''}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filters
          </Button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md">
            <Select
              label="Status"
              options={statusOptions}
              value={filters.status?.[0] || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value ? [e.target.value as TaskStatus] : undefined,
                })
              }
            />
            
            <Select
              label="Category"
              options={categoryOptions}
              value={filters.category?.[0] || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  category: e.target.value ? [e.target.value as TaskCategory] : undefined,
                })
              }
            />
            
            <Input
              label="Care Plan ID"
              value={filters.carePlanId || ''}
              onChange={(e) => setFilters({ ...filters, carePlanId: e.target.value })}
            />
            
            <Input
              label="Client ID"
              value={filters.clientId || ''}
              onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
            />
            
            <Input
              label="Assigned Caregiver ID"
              value={filters.assignedCaregiverId || ''}
              onChange={(e) => setFilters({ ...filters, assignedCaregiverId: e.target.value })}
            />
            
            <Input
              label="Scheduled Date From"
              type="date"
              value={filters.scheduledDateFrom || ''}
              onChange={(e) => setFilters({ ...filters, scheduledDateFrom: e.target.value })}
            />
            
            <Input
              label="Scheduled Date To"
              type="date"
              value={filters.scheduledDateTo || ''}
              onChange={(e) => setFilters({ ...filters, scheduledDateTo: e.target.value })}
            />
            
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="overdue"
                checked={filters.overdue || false}
                onChange={(e) => setFilters({ ...filters, overdue: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="overdue" className="text-sm text-gray-700">
                Show Overdue Only
              </label>
            </div>
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="No tasks match your current filters."
          action={
            <Button variant="outline" onClick={() => setFilters({})}>
              Clear Filters
            </Button>
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
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              showCompleteButton={can('tasks:write') && task.status === 'SCHEDULED'}
              onCompleted={() => refetch()}
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