/**
 * Corrective Action Card Component
 *
 * Displays corrective action information in a card format
 */

import React from 'react';
import { Target, Calendar, User, TrendingUp } from 'lucide-react';
import { Card } from '@/core/components';
import type { CorrectiveAction, CorrectiveActionStatus } from '../types';

export interface CorrectiveActionCardProps {
  action: CorrectiveAction;
  onClick?: () => void;
}

const statusColors: Record<CorrectiveActionStatus, string> = {
  PLANNED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  IMPLEMENTED: 'bg-green-100 text-green-800',
  VERIFIED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-slate-100 text-slate-800',
  INEFFECTIVE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

export const CorrectiveActionCard: React.FC<CorrectiveActionCardProps> = ({ action, onClick }) => {
  const isOverdue = action.status !== 'COMPLETED' && action.status !== 'VERIFIED' &&
    new Date(action.targetCompletionDate) < new Date();

  return (
    <Card
      className={`${onClick ? 'hover:shadow-md transition-shadow cursor-pointer' : ''} ${isOverdue ? 'border-red-300' : ''}`}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-600">
                {action.actionNumber}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[action.status]}`}>
                {action.status.replace('_', ' ')}
              </span>
              {isOverdue && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  OVERDUE
                </span>
              )}
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">
              {action.title}
            </h4>
            <p className="text-sm text-gray-700 line-clamp-2">
              {action.description}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Progress</span>
            <span className="text-xs font-medium text-gray-900">
              {action.completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${action.completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Action Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="h-4 w-4" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Responsible</p>
              <p className="font-medium text-gray-900 truncate">
                {action.responsiblePersonName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Target Date</p>
              <p className={`font-medium truncate ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {new Date(action.targetCompletionDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Type and Root Cause */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              <span className="font-medium">Type:</span>
              <span>{action.actionType.replace('_', ' ')}</span>
            </div>
            {action.effectivenessRating && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="font-medium">Effectiveness:</span>
                <span>{action.effectivenessRating.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Root Cause */}
        {action.rootCause && (
          <div className="mt-2">
            <p className="text-xs text-gray-600 mb-1">Root Cause:</p>
            <p className="text-xs text-gray-900 line-clamp-2">
              {action.rootCause}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
