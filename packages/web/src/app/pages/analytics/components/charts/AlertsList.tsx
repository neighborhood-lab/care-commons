/**
 * Alerts List Component
 * Displays compliance alerts requiring attention
 */

import {
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronRight,
} from 'lucide-react';
import type { ComplianceAlert } from '@/types/analytics-types';
import { Badge } from '@/core/components';

interface AlertsListProps {
  alerts: ComplianceAlert[];
  onAlertClick?: (alert: ComplianceAlert) => void;
  className?: string;
}

export function AlertsList({
  alerts,
  onAlertClick,
  className = '',
}: AlertsListProps) {
  const getAlertIcon = (severity: ComplianceAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'MEDIUM':
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBadgeVariant = (
    severity: ComplianceAlert['severity']
  ): 'success' | 'warning' | 'error' | 'default' => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
      case 'WARNING':
        return 'warning';
      case 'INFO':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {alerts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Info className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>No compliance alerts at this time</p>
        </div>
      )}

      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
            onAlertClick ? 'cursor-pointer' : ''
          }`}
          onClick={() => onAlertClick?.(alert)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-0.5">{getAlertIcon(alert.severity)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {alert.message}
                  </h4>
                  <Badge variant={getBadgeVariant(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {alert.actionRequired}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Count: {alert.count}</span>
                  {alert.dueDate && (
                    <span>Due: {formatDate(alert.dueDate)}</span>
                  )}
                  {alert.affectedEntities && alert.affectedEntities.length > 0 && (
                    <span>
                      Affected: {alert.affectedEntities.length} entity(ies)
                    </span>
                  )}
                </div>
              </div>
            </div>
            {onAlertClick && (
              <ChevronRight className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
