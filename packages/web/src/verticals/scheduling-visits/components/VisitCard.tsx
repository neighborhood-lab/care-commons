import React from 'react';
import { Calendar, Clock, MapPin, User, AlertCircle, CheckCircle } from 'lucide-react';
import type { Visit } from '../types';
import { VISIT_STATUS_LABELS, VISIT_STATUS_COLORS, VISIT_TYPE_LABELS } from '../types';

interface VisitCardProps {
  visit: Visit;
  compact?: boolean;
}

export const VisitCard: React.FC<VisitCardProps> = ({ visit, compact = false }) => {
  const statusColor = VISIT_STATUS_COLORS[visit.status];
  const isCompleted = visit.status === 'COMPLETED';
  const isUrgent = visit.isUrgent || visit.isPriority;

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getClientName = () => {
    if (visit.clientFirstName && visit.clientLastName) {
      return `${visit.clientFirstName} ${visit.clientLastName}`;
    }
    return 'Client';
  };

  const getStatusBadgeClasses = () => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      cyan: 'bg-cyan-100 text-cyan-800',
      green: 'bg-green-100 text-green-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800',
    };
    return `${baseClasses} ${colorClasses[statusColor as keyof typeof colorClasses] || colorClasses.gray}`;
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex-shrink-0">
            {isCompleted ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <Calendar className="h-8 w-8 text-blue-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {getClientName()}
              </h3>
              {isUrgent && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
            </div>
            <p className="text-sm text-gray-500">
              {visit.serviceTypeName}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {visit.scheduledStartTime} - {visit.scheduledEndTime}
          </div>
          <span className={getStatusBadgeClasses()}>
            {VISIT_STATUS_LABELS[visit.status]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
              {isCompleted ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <Calendar className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {getClientName()}
                </h3>
                {isUrgent && <AlertCircle className="h-5 w-5 text-red-500" />}
              </div>
              <p className="text-sm text-gray-500">
                {VISIT_TYPE_LABELS[visit.visitType]} • {visit.visitNumber}
              </p>
            </div>
          </div>
          <span className={getStatusBadgeClasses()}>
            {VISIT_STATUS_LABELS[visit.status]}
          </span>
        </div>

        {/* Service Type */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700">{visit.serviceTypeName}</p>
        </div>

        {/* Details Grid */}
        <div className="space-y-3">
          {/* Date & Time */}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{formatDate(visit.scheduledDate)}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>
              {visit.scheduledStartTime} - {visit.scheduledEndTime} ({visit.scheduledDuration} min)
            </span>
          </div>

          {/* Address */}
          <div className="flex items-start text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>
              {visit.address.line1}
              {visit.address.line2 && `, ${visit.address.line2}`}
              <br />
              {visit.address.city}, {visit.address.state} {visit.address.postalCode}
            </span>
          </div>

          {/* Caregiver */}
          {visit.assignedCaregiverId && (
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Assigned</span>
            </div>
          )}
        </div>

        {/* Tasks Progress */}
        {visit.tasksTotal !== undefined && visit.tasksTotal > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tasks</span>
              <span className="font-medium text-gray-900">
                {visit.tasksCompleted ?? 0} / {visit.tasksTotal}
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${((visit.tasksCompleted ?? 0) / visit.tasksTotal) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
