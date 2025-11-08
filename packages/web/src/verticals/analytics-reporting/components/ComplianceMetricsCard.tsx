/**
 * Compliance Metrics Card Component
 * Displays compliance status including EVV compliance and credential expirations
 */

import React from 'react';
import { Card, Badge } from '@/core/components/index.js';
import { Shield, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import type { EVVComplianceMetrics, StaffingMetrics, ComplianceAlert } from '@/types/analytics-types';

interface ComplianceMetricsCardProps {
  evvMetrics: EVVComplianceMetrics;
  staffingMetrics: StaffingMetrics;
  alerts?: ComplianceAlert[];
  isLoading?: boolean;
}

export const ComplianceMetricsCard: React.FC<ComplianceMetricsCardProps> = ({
  evvMetrics,
  staffingMetrics,
  alerts = [],
  isLoading = false,
}) => {
  const getComplianceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceIcon = (rate: number) => {
    if (rate >= 95) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (rate >= 85) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'WARNING':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <Card.Header title="Compliance Metrics" />
        <Card.Content>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </Card.Content>
      </Card>
    );
  }

  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
  );

  return (
    <Card>
      <Card.Header
        title="Compliance Status"
        action={<Shield className="h-5 w-5 text-gray-400" />}
      />
      <Card.Content>
        <div className="space-y-6">
          {/* EVV Compliance */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">EVV Compliance</span>
              {getComplianceIcon(evvMetrics.complianceRate)}
            </div>
            <div className={`text-3xl font-bold ${getComplianceColor(evvMetrics.complianceRate)}`}>
              {evvMetrics.complianceRate.toFixed(1)}%
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Compliant</div>
                <div className="font-semibold text-green-600">
                  {evvMetrics.compliantVisits.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Flagged</div>
                <div className="font-semibold text-red-600">
                  {evvMetrics.flaggedVisits.toLocaleString()}
                </div>
              </div>
            </div>
            {evvMetrics.pendingReview > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-yellow-600">
                <Clock className="h-4 w-4" />
                <span>{evvMetrics.pendingReview} pending review</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  evvMetrics.complianceRate >= 95
                    ? 'bg-green-600'
                    : evvMetrics.complianceRate >= 85
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }`}
                style={{ width: `${Math.min(evvMetrics.complianceRate, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Credential Expirations */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Credential Status</span>
              {staffingMetrics.credentialExpirations > 0 && (
                <Badge variant="warning">{staffingMetrics.credentialExpirations}</Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Active Caregivers</span>
                <span className="font-semibold">
                  {staffingMetrics.activeCaregivers.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Expiring Soon</span>
                <span className="font-semibold text-yellow-600">
                  {staffingMetrics.credentialExpirations.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Utilization Rate</span>
                <span className="font-semibold text-blue-600">
                  {staffingMetrics.utilizationRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Critical Alerts */}
          {criticalAlerts.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-gray-900">
                  Critical Alerts ({criticalAlerts.length})
                </span>
              </div>
              <div className="space-y-2">
                {criticalAlerts.slice(0, 3).map((alert, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 bg-red-50 rounded-lg border border-red-100"
                  >
                    <Badge variant={getSeverityBadgeVariant(alert.severity)} className="mt-0.5">
                      {alert.severity}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {alert.message}
                      </div>
                      {alert.count > 1 && (
                        <div className="text-xs text-gray-600 mt-1">
                          {alert.count} items affected
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {criticalAlerts.length > 3 && (
                  <div className="text-sm text-gray-600 text-center">
                    +{criticalAlerts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  );
};
