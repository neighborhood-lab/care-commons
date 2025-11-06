import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, User, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { Card, Button } from '@/core/components';
import { formatTime, formatDate } from '@/core/utils';
import { VisitStatusBadge } from './VisitStatusBadge';
import type { VisitWithDetails } from '../types';

interface VisitCardProps {
  visit: VisitWithDetails;
  compact?: boolean;
  onAssign?: (visitId: string) => void;
  onStatusChange?: (visitId: string) => void;
  showActions?: boolean;
}

export const VisitCard: React.FC<VisitCardProps> = ({
  visit,
  compact = false,
  onAssign,
  onStatusChange,
  showActions = true,
}) => {
  const hasConflicts = (visit.conflicts?.length ?? 0) > 0;
  const isUnassigned = !visit.assignedCaregiverId;

  return (
    <Card className={`hover:shadow-md transition-shadow ${compact ? 'p-3' : 'p-4'}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link
                to={`/scheduling/visits/${visit.id}`}
                className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
              >
                {visit.visitNumber}
              </Link>
              {visit.isUrgent && (
                <span title="Urgent">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </span>
              )}
              {visit.isPriority && (
                <span title="Priority">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{visit.serviceTypeName}</p>
          </div>
          <VisitStatusBadge status={visit.status} size="sm" />
        </div>

        {/* Client and Time Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User className="h-4 w-4 text-gray-400" />
            <span>{visit.clientName || 'Unknown Client'}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>
              {formatDate(visit.scheduledDate)} • {formatTime(visit.scheduledStartTime)} -{' '}
              {formatTime(visit.scheduledEndTime)}
            </span>
            <span className="text-gray-500">({visit.scheduledDuration}min)</span>
          </div>

          {!compact && (
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <span className="line-clamp-2">
                {visit.address.line1}, {visit.address.city}, {visit.address.state}
              </span>
            </div>
          )}
        </div>

        {/* Caregiver Info */}
        {visit.assignedCaregiverId ? (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-gray-700">
              Assigned: <span className="font-medium">{visit.caregiverName || 'Unknown'}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <Users className="h-4 w-4" />
            <span className="font-medium">Unassigned</span>
          </div>
        )}

        {/* Conflicts */}
        {hasConflicts && !compact && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="flex-1 text-xs text-yellow-800">
                <p className="font-medium">Conflicts detected:</p>
                <ul className="mt-1 space-y-0.5">
                  {visit.conflicts?.map((conflict, idx) => (
                    <li key={idx}>• {conflict.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && !compact && (
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            {isUnassigned && onAssign && (
              <Button size="sm" variant="primary" onClick={() => onAssign(visit.id)}>
                Assign Caregiver
              </Button>
            )}
            {onStatusChange && (
              <Button size="sm" variant="outline" onClick={() => onStatusChange(visit.id)}>
                Update Status
              </Button>
            )}
            <Link to={`/scheduling/visits/${visit.id}`} className="ml-auto">
              <Button size="sm" variant="ghost">
                View Details
              </Button>
            </Link>
          </div>
        )}

        {/* Compact actions */}
        {showActions && compact && (
          <div className="flex gap-2 pt-2">
            {isUnassigned && onAssign && (
              <Button size="sm" variant="primary" onClick={() => onAssign(visit.id)} className="flex-1">
                Assign
              </Button>
            )}
            <Link to={`/scheduling/visits/${visit.id}`} className="flex-1">
              <Button size="sm" variant="outline" className="w-full">
                View
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
};
