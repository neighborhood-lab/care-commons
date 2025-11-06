/**
 * Audit Card Component
 *
 * Displays audit summary information in a card format
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/core/components';
import type { AuditSummary, AuditStatus, AuditPriority } from '../types';

export interface AuditCardProps {
  audit: AuditSummary;
}

const statusColors: Record<AuditStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  FINDINGS_REVIEW: 'bg-orange-100 text-orange-800',
  CORRECTIVE_ACTIONS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  ARCHIVED: 'bg-slate-100 text-slate-800',
};

const priorityColors: Record<AuditPriority, string> = {
  LOW: 'text-gray-600',
  MEDIUM: 'text-yellow-600',
  HIGH: 'text-orange-600',
  CRITICAL: 'text-red-600',
};

export const AuditCard: React.FC<AuditCardProps> = ({ audit }) => {
  return (
    <Link to={`/audits/${audit.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {audit.title}
                </h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[audit.priority]}`}>
                  {audit.priority}
                </span>
              </div>
              <p className="text-sm text-gray-600">{audit.auditNumber}</p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[audit.status]}`}
            >
              {audit.status.replace('_', ' ')}
            </span>
          </div>

          {/* Audit Info */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{new Date(audit.scheduledStartDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Lead: {audit.leadAuditorName}</span>
            </div>
          </div>

          {/* Findings Summary */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-gray-900">
                {audit.criticalFindings}
              </span>
              <span className="text-xs text-gray-600">Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {audit.totalFindings}
              </span>
              <span className="text-xs text-gray-600">Total Findings</span>
            </div>
            {audit.complianceScore !== undefined && (
              <div className="ml-auto">
                <span className="text-sm font-semibold text-gray-900">
                  {audit.complianceScore}%
                </span>
                <span className="text-xs text-gray-600 ml-1">Compliance</span>
              </div>
            )}
          </div>

          {/* Overall Rating */}
          {audit.overallRating && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-600">Rating: </span>
              <span className="text-xs font-medium text-gray-900">
                {audit.overallRating.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};
