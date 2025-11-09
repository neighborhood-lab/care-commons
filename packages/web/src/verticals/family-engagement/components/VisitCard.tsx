/**
 * Visit Card Component
 *
 * Display individual visit information for family members
 */

import React from 'react';
import { Card } from '@/core/components';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { VisitSummary } from '@care-commons/family-engagement';

interface VisitCardProps {
  visit: VisitSummary;
  onClick?: () => void;
}

export const VisitCard: React.FC<VisitCardProps> = ({ visit, onClick }) => {
  const startTime = new Date(visit.scheduledStartTime);
  const endTime = new Date(visit.scheduledEndTime);

  const dateStr = startTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const timeStr = `${startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })} - ${endTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;

  const statusConfig = {
    SCHEDULED: {
      color: 'bg-blue-100 text-blue-800',
      icon: Clock,
      iconColor: 'text-blue-600',
    },
    IN_PROGRESS: {
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600',
    },
    COMPLETED: {
      color: 'bg-gray-100 text-gray-800',
      icon: CheckCircle,
      iconColor: 'text-gray-600',
    },
    CANCELLED: {
      color: 'bg-red-100 text-red-800',
      icon: XCircle,
      iconColor: 'text-red-600',
    },
    NO_SHOW: {
      color: 'bg-orange-100 text-orange-800',
      icon: AlertCircle,
      iconColor: 'text-orange-600',
    },
  };

  const config = statusConfig[visit.status];
  const StatusIcon = config.icon;

  const completedTasks = visit.tasksCompleted?.filter(t => t.status === 'COMPLETED').length || 0;
  const totalTasks = visit.tasksCompleted?.length || 0;

  return (
    <Card
      padding="md"
      hover={!!onClick}
      className={onClick ? 'cursor-pointer' : ''}
    >
      <div className="flex items-start gap-4">
        {/* Caregiver Photo */}
        <div className="flex-shrink-0">
          {visit.caregiverPhotoUrl ? (
            <img
              src={visit.caregiverPhotoUrl}
              alt={visit.caregiverName}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
              {visit.caregiverName.charAt(0)}
            </div>
          )}
        </div>

        {/* Visit Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-gray-900">
              {visit.caregiverName}
            </h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
              {visit.status.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${config.iconColor}`} />
              <span>{timeStr}</span>
            </div>
          </div>

          {/* Tasks Summary */}
          {totalTasks > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Tasks completed</span>
                <span className="font-medium">{completedTasks}/{totalTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Visit Notes */}
          {visit.visitNotes && visit.status === 'COMPLETED' && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{visit.visitNotes}</p>
            </div>
          )}

          {/* Cancellation Reason */}
          {visit.cancellationReason && (visit.status === 'CANCELLED' || visit.status === 'NO_SHOW') && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">
                <span className="font-medium">Reason: </span>
                {visit.cancellationReason}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
