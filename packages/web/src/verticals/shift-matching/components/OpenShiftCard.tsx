import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, AlertCircle, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { OpenShift } from '../types';
import { getShiftPriorityColor, getMatchingStatusColor, formatDuration } from '../utils';

interface OpenShiftCardProps {
  shift: OpenShift;
  compact?: boolean;
}

export const OpenShiftCard: React.FC<OpenShiftCardProps> = ({ shift, compact = false }) => {
  const priorityColor = getShiftPriorityColor(shift.priority);
  const statusColor = getMatchingStatusColor(shift.matchingStatus);

  return (
    <Link
      to={`/shift-matching/${shift.id}`}
      className={`block bg-white rounded-lg shadow hover:shadow-md transition-shadow ${compact ? 'p-3' : 'p-6'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="font-semibold text-gray-900">
              {new Date(shift.scheduledDate).toLocaleDateString()}
            </span>
            {shift.isUrgent && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
          {shift.clientName && (
            <p className="text-sm text-gray-600">{shift.clientName}</p>
          )}
          <p className="text-sm text-gray-500">{shift.serviceTypeName}</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColor}`}>
            {shift.priority}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
            {shift.matchingStatus.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            {shift.startTime} - {shift.endTime} ({formatDuration(shift.duration)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>
            {shift.address.city}, {shift.address.state}
          </span>
        </div>
        {shift.requiredSkills && shift.requiredSkills.length > 0 && (
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {shift.requiredSkills.map((skill, idx) => (
                <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(shift.createdAt), { addSuffix: true })}
        </span>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Attempts: {shift.matchAttempts}</span>
          {shift.proposedAssignments && shift.proposedAssignments.length > 0 && (
            <span>Proposals: {shift.proposedAssignments.length}</span>
          )}
        </div>
      </div>
    </Link>
  );
};
