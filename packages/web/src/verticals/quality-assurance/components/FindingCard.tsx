/**
 * Finding Card Component
 *
 * Displays audit finding information in a card format
 */

import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Card } from '@/core/components';
import type { AuditFinding, FindingSeverity, FindingStatus } from '../types';

export interface FindingCardProps {
  finding: AuditFinding;
  onClick?: () => void;
}

const severityConfig: Record<FindingSeverity, { icon: React.ReactNode; color: string; bgColor: string }> = {
  CRITICAL: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
  },
  MAJOR: {
    icon: <AlertCircle className="h-5 w-5" />,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-200',
  },
  MINOR: {
    icon: <AlertCircle className="h-5 w-5" />,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50 border-yellow-200',
  },
  OBSERVATION: {
    icon: <Info className="h-5 w-5" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
  },
};

const statusColors: Record<FindingStatus, string> = {
  OPEN: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-blue-100 text-blue-800',
  VERIFIED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  DEFERRED: 'bg-purple-100 text-purple-800',
};

export const FindingCard: React.FC<FindingCardProps> = ({ finding, onClick }) => {
  const severityInfo = severityConfig[finding.severity];

  return (
    <Card
      className={`border ${severityInfo.bgColor} ${onClick ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={severityInfo.color}>
              {severityInfo.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-600">
                  {finding.findingNumber}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[finding.status]}`}>
                  {finding.status.replace('_', ' ')}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">
                {finding.title}
              </h4>
              <p className="text-sm text-gray-700 line-clamp-2">
                {finding.description}
              </p>
            </div>
          </div>
        </div>

        {/* Category and Severity */}
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
          <div className="flex items-center gap-1">
            <span className="font-medium">Category:</span>
            <span>{finding.category.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Severity:</span>
            <span className={severityInfo.color}>{finding.severity}</span>
          </div>
        </div>

        {/* Required Action */}
        {finding.requiredCorrectiveAction && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Required Corrective Action:</p>
            <p className="text-sm text-gray-900 line-clamp-2">
              {finding.requiredCorrectiveAction}
            </p>
          </div>
        )}

        {/* Target Resolution Date */}
        {finding.targetResolutionDate && (
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-gray-600">Target Resolution:</span>
            <span className="font-medium text-gray-900">
              {new Date(finding.targetResolutionDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
