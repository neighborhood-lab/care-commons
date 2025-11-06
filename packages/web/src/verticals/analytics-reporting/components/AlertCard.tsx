/**
 * Alert Card Component
 */

import React from 'react';
import type { ComplianceAlert } from '../types';

interface AlertCardProps {
  alert: ComplianceAlert;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const severityColors = {
    CRITICAL: 'bg-red-50 border-red-200 text-red-800',
    HIGH: 'bg-orange-50 border-orange-200 text-orange-800',
    MEDIUM: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    WARNING: 'bg-blue-50 border-blue-200 text-blue-800',
    INFO: 'bg-gray-50 border-gray-200 text-gray-800',
  };

  const severityBadgeColors = {
    CRITICAL: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-100 text-orange-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    WARNING: 'bg-blue-100 text-blue-800',
    INFO: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className={`border rounded-lg p-4 ${severityColors[alert.severity]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${severityBadgeColors[alert.severity]}`}>
              {alert.severity}
            </span>
            <span className="text-sm font-semibold">{alert.count}</span>
          </div>
          <p className="text-sm font-medium mb-1">{alert.message}</p>
          <p className="text-xs opacity-75">{alert.actionRequired}</p>
        </div>
      </div>
    </div>
  );
};
