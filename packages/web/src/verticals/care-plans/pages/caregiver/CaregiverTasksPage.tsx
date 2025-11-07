import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Filter, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button, Card, LoadingSpinner, EmptyState, ErrorMessage, Input, Select } from '@/core/components';
import { useAuth } from '@/core/hooks';
import { useTasks } from '../../hooks';
import { TaskCard, TaskCompletionModal, TaskStatusBadge, TaskCategoryIcon } from '../../components';
import type { TaskInstance, TaskStatus } from '../../types';

export const CaregiverTasksPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);

  const { data, isLoading, error, refetch } = useTasks({
    assignedCaregiverId: user?.id,
    scheduledDateFrom: selectedDate,
    scheduledDateTo: selectedDate,
    status: statusFilter ? [statusFilter] : undefined,
  });

  const handleTaskComplete = () => {
    setSelectedTask(null);
    refetch();
  };

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
  const scheduledTasks = tasks.filter(t => t.status === 'SCHEDULED');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const overdueTasks = tasks.filter(t =>
    t.status === 'SCHEDULED' && new Date(t.scheduledDate) < new Date()
  );

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'SKIPPED', label: 'Skipped' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-600 mt-1">
          Tasks scheduled for {format(new Date(selectedDate), 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600">{scheduledTasks.length}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueTasks.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              type="date"
              label="Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card padding="md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Status"
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
              />
            </div>
          </Card>
        )}
      </div>

      {/* Overdue Tasks Alert */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">
                You have {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-red-600">
                Please complete or update these tasks as soon as possible.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks scheduled"
          description={`You don't have any tasks scheduled for ${format(new Date(selectedDate), 'MMMM d, yyyy')}.`}
          icon={<Calendar className="h-12 w-12 text-gray-400" />}
        />
      ) : (
        <div className="space-y-4">
          {/* Overdue Tasks Section */}
          {overdueTasks.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-red-900 mb-3">Overdue Tasks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overdueTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    showCompleteButton={true}
                    onCompleted={refetch}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Tasks Section */}
          {scheduledTasks.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Scheduled Tasks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledTasks.filter(t => !overdueTasks.includes(t)).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    showCompleteButton={true}
                    onCompleted={refetch}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks Section */}
          {completedTasks.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-green-900 mb-3">Completed Tasks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    showCompleteButton={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Completion Modal */}
      {selectedTask && (
        <TaskCompletionModal
          task={selectedTask}
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          onComplete={handleTaskComplete}
        />
      )}
    </div>
  );
};
