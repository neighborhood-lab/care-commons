/**
 * Alert Card Component
 * Displays compliance alerts with severity indicators
 */

import React from 'react';
import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';
import { Button } from '../../../core/components/Button';

interface AlertCardProps {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';
  message: string;
  actionRequired: string;
  count?: number;
  onAction?: () => void;
}

export function AlertCard({ severity, message, actionRequired, count, onAction }: AlertCardProps) {
  const severityConfig = {
    CRITICAL: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
    },
    HIGH: {
      icon: AlertTriangle,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-800',
      iconColor: 'text-orange-500',
    },
    MEDIUM: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500',
    },
    WARNING: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-400',
      textColor: 'text-yellow-700',
      iconColor: 'text-yellow-400',
    },
    INFO: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500',
    },
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bgColor} border-l-4 ${config.borderColor} p-4 mb-3 rounded-r-lg`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${config.textColor}`}>
                {count !== undefined && <span className="font-bold">{count}x </span>}
                {message}
              </p>
              <p className="mt-1 text-sm text-gray-600">{actionRequired}</p>
            </div>
            {onAction && (
              <Button
                size="sm"
                variant="primary"
                onClick={onAction}
                className="ml-4"
              >
                Take Action
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
