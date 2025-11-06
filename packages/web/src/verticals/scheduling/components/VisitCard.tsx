/**
 * VisitCard component - displays visit information
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react';
import { Card, Badge } from '@/core/components';
import type { VisitListItem } from '../types';

interface VisitCardProps {
  visit: VisitListItem;
  compact?: boolean;
  onAssign?: (visitId: string) => void;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  UNASSIGNED: 'bg-yellow-100 text-yellow-800',
  ASSIGNED: 'bg-green-100 text-green-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  EN_ROUTE: 'bg-blue-100 text-blue-800',
  ARRIVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  PAUSED: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  INCOMPLETE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW_CLIENT: 'bg-red-100 text-red-800',
  NO_SHOW_CAREGIVER: 'bg-red-100 text-red-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle2 className="h-4 w-4" />,
  CANCELLED: <XCircle className="h-4 w-4" />,
  UNASSIGNED: <AlertCircle className="h-4 w-4" />,
  IN_PROGRESS: <Clock className="h-4 w-4" />,
};

export const VisitCard: React.FC<VisitCardProps> = ({
  visit,
  compact = false,
  onAssign,
}) => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours || '0', 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (compact) {
    return (
      <Link to={`/scheduling/visits/${visit.id}`}>
        <Card className="hover:shadow-md transition-shadow p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {visit.clientName || 'Unknown Client'}
                  </h3>
                  {visit.isUrgent && (
                    <Badge variant="error" size="sm">
                      Urgent
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {visit.serviceTypeName}
                </p>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(visit.scheduledStartTime)} -{' '}
                  {formatTime(visit.scheduledEndTime)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {visit.assignedCaregiverName ? (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    {visit.assignedCaregiverName}
                  </div>
                ) : (
                  <Badge variant="warning" size="sm">
                    Unassigned
                  </Badge>
                )}
              </div>
              <Badge
                className={statusColors[visit.status] || statusColors.DRAFT}
              >
                {visit.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to={`/scheduling/visits/${visit.id}`}>
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                  {visit.clientName || 'Unknown Client'}
                </h3>
              </Link>
              {visit.isUrgent && (
                <Badge variant="error">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Urgent
                </Badge>
              )}
              {visit.isPriority && (
                <Badge variant="warning">Priority</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{visit.serviceTypeName}</p>
            <p className="text-xs text-gray-500 mt-1">#{visit.visitNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            {statusIcons[visit.status]}
            <Badge
              className={statusColors[visit.status] || statusColors.DRAFT}
            >
              {visit.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-700">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium">{formatDate(visit.scheduledDate)}</span>
          </div>

          <div className="flex items-center text-sm text-gray-700">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            <span>
              {formatTime(visit.scheduledStartTime)} -{' '}
              {formatTime(visit.scheduledEndTime)}
            </span>
          </div>

          {visit.assignedCaregiverName ? (
            <div className="flex items-center text-sm text-gray-700">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              <span>{visit.assignedCaregiverName}</span>
            </div>
          ) : (
            <div className="flex items-center text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>No caregiver assigned</span>
            </div>
          )}
        </div>

        {visit.status === 'UNASSIGNED' && onAssign && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => onAssign(visit.id)}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Assign Caregiver
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};
