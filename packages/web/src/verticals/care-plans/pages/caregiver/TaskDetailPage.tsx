import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  History
} from 'lucide-react';
import { Button, Card, CardHeader, CardContent, LoadingSpinner, ErrorMessage } from '@/core/components';
import { formatDate, formatTime } from '@/core/utils';
import { useTask } from '../../hooks';
import {
  TaskCompletionModal,
  TaskStatusBadge,
  TaskCategoryIcon,
  getTaskCategoryLabel,
} from '../../components';

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: task, isLoading, error, refetch } = useTask(id);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const handleComplete = () => {
    setShowCompletionModal(true);
  };

  const handleCompletionSuccess = () => {
    setShowCompletionModal(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <ErrorMessage
        message={(error as Error)?.message || 'Failed to load task'}
        retry={refetch}
      />
    );
  }

  const isOverdue = new Date(task.scheduledDate) < new Date() && task.status === 'SCHEDULED';
  const canComplete = task.status === 'SCHEDULED' || task.status === 'IN_PROGRESS';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/caregiver/tasks">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Tasks
          </Button>
        </Link>
      </div>

      {/* Page Title */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${
            isOverdue ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <TaskCategoryIcon category={task.category} className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{task.name}</h1>
            <p className="text-gray-600 mt-1">{task.description}</p>
            <div className="flex items-center gap-4 mt-2">
              <TaskStatusBadge status={task.status} />
              <span className="text-sm text-gray-500">
                {getTaskCategoryLabel(task.category)}
              </span>
            </div>
          </div>
        </div>
        {canComplete && (
          <Button
            leftIcon={<CheckCircle className="h-4 w-4" />}
            onClick={handleComplete}
            size="lg"
          >
            Complete Task
          </Button>
        )}
      </div>

      {/* Overdue Alert */}
      {isOverdue && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">This task is overdue</p>
              <p className="text-sm text-red-600">
                This task was scheduled for {formatDate(task.scheduledDate)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader title="Task Details" />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Scheduled Date</dt>
                  <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                    <Calendar className="h-4 w-4" />
                    {formatDate(task.scheduledDate)}
                  </dd>
                </div>

                {task.scheduledTime && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Scheduled Time</dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                      <Clock className="h-4 w-4" />
                      {formatTime(task.scheduledTime)}
                    </dd>
                  </div>
                )}

                {task.estimatedDuration && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estimated Duration</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {task.estimatedDuration} minutes
                    </dd>
                  </div>
                )}

                {task.assignedCaregiverId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                      <User className="h-4 w-4" />
                      {task.assignedCaregiverId}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {getTaskCategoryLabel(task.category)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader title="Instructions" />
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{task.instructions}</p>
              </div>
            </CardContent>
          </Card>

          {/* Completion Information */}
          {task.status === 'COMPLETED' && (
            <Card>
              <CardHeader title="Completion Information" />
              <CardContent>
                <div className="space-y-4">
                  {task.completedAt && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Completed At</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate(task.completedAt)}
                      </dd>
                    </div>
                  )}

                  {task.completedBy && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Completed By</dt>
                      <dd className="mt-1 text-sm text-gray-900">{task.completedBy}</dd>
                    </div>
                  )}

                  {task.completionNote && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Completion Note</dt>
                      <dd className="mt-1 text-sm text-gray-700 bg-green-50 p-3 rounded-md">
                        {task.completionNote}
                      </dd>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Requirements */}
          <Card>
            <CardHeader title="Requirements" />
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Signature Required</span>
                  <span className={`text-sm font-medium ${
                    task.requiredSignature ? 'text-orange-600' : 'text-gray-400'
                  }`}>
                    {task.requiredSignature ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Note Required</span>
                  <span className={`text-sm font-medium ${
                    task.requiredNote ? 'text-orange-600' : 'text-gray-400'
                  }`}>
                    {task.requiredNote ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader title="Related" />
            <CardContent>
              <div className="space-y-2">
                <Link to={`/care-plans/${task.carePlanId}`}>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    View Care Plan
                  </Button>
                </Link>
                {task.visitId && (
                  <Link to={`/visits/${task.visitId}`}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Visit
                    </Button>
                  </Link>
                )}
                <Link to={`/tasks?carePlanId=${task.carePlanId}`}>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <History className="h-4 w-4 mr-2" />
                    View All Tasks
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <TaskCompletionModal
          task={task}
          isOpen={true}
          onClose={() => setShowCompletionModal(false)}
          onComplete={handleCompletionSuccess}
        />
      )}
    </div>
  );
};
