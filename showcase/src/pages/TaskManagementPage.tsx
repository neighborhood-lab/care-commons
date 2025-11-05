import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShowcaseLayout } from '../components/ShowcaseLayout';
import { useCarePlanProvider } from '@/core/providers/context';
import { Search, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    SKIPPED: 'bg-gray-100 text-gray-800',
    MISSED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const TaskManagementPage: React.FC = () => {
  const carePlanProvider = useCarePlanProvider();
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { status: statusFilter ? [statusFilter] : undefined }],
    queryFn: () =>
      carePlanProvider.getTasks({
        status: statusFilter ? [statusFilter as any] : undefined,
      }),
  });

  const stats = {
    total: data?.total || 0,
    scheduled: data?.items.filter(t => t.status === 'SCHEDULED').length || 0,
    completed: data?.items.filter(t => t.status === 'COMPLETED').length || 0,
    overdue: data?.items.filter(t =>
      new Date(t.scheduledEndTime) < new Date() && t.status !== 'COMPLETED'
    ).length || 0,
  };

  return (
    <ShowcaseLayout
      title="Task Management"
      description="Schedule, track, and complete care tasks with digital signatures"
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Total Tasks</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-medium text-gray-600">Scheduled</p>
          </div>
          <p className="mt-1 text-2xl font-semibold text-blue-600">{stats.scheduled}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-gray-600">Completed</p>
          </div>
          <p className="mt-1 text-2xl font-semibold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-gray-600">Overdue</p>
          </div>
          <p className="mt-1 text-2xl font-semibold text-red-600">{stats.overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {['All', 'SCHEDULED', 'COMPLETED', 'IN_PROGRESS'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status === 'All' ? '' : status)}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              (status === 'All' && !statusFilter) || statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status === 'All' ? 'All Tasks' : status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>
                    {task.priority === 'URGENT' && (
                      <span className="text-red-600 text-xs font-medium">URGENT</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>Category: {task.category.replace(/_/g, ' ')}</span>
                    <span>•</span>
                    <span>
                      Scheduled: {format(new Date(task.scheduledStartTime), 'MMM d, h:mm a')}
                    </span>
                    {task.requiresSignature && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600">Signature Required</span>
                      </>
                    )}
                    {task.requiresEvv && (
                      <>
                        <span>•</span>
                        <span className="text-purple-600">EVV Required</span>
                      </>
                    )}
                  </div>
                  {task.completionNotes && (
                    <div className="mt-2 rounded bg-green-50 px-3 py-2">
                      <p className="text-xs text-green-800">
                        <strong>Note:</strong> {task.completionNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ShowcaseLayout>
  );
};
