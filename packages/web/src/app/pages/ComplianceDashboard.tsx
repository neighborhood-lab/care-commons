/**
 * Compliance Dashboard Page
 *
 * Proactive compliance monitoring dashboard showing:
 * - Credential expirations and warnings
 * - Authorization usage and alerts
 * - Care plan review due dates
 * - EVV compliance rates
 * - One-click audit report generation
 */

import React, { useState } from 'react';
import { useCompliance } from '@/core/hooks';
import { Card, CardContent, Button, EmptyState, LoadingSpinner } from '@/core/components';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Shield,
  UserCheck,
  Users,
  Calendar,
  Download,
} from 'lucide-react';
import type { ComplianceDeadline } from '@care-commons/core';
import toast from 'react-hot-toast';

const PRIORITY_STYLES: Record<string, { bg: string; border: string; badge: string; icon: string }> = {
  CRITICAL: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    badge: 'bg-red-500 text-white',
    icon: 'text-red-500',
  },
  HIGH: {
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    badge: 'bg-orange-500 text-white',
    icon: 'text-orange-500',
  },
  MEDIUM: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    badge: 'bg-yellow-500 text-white',
    icon: 'text-yellow-600',
  },
  LOW: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    badge: 'bg-blue-500 text-white',
    icon: 'text-blue-500',
  },
  INFO: {
    bg: 'bg-gray-50',
    border: 'border-gray-500',
    badge: 'bg-gray-500 text-white',
    icon: 'text-gray-500',
  },
};

const STATUS_LABELS = {
  OVERDUE: 'Overdue',
  DUE_SOON: 'Due Soon',
  UPCOMING: 'Upcoming',
  CURRENT: 'Current',
  BLOCKED: 'Blocked',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  CAREGIVER_CREDENTIAL: <UserCheck className="h-4 w-4" />,
  CAREGIVER_BACKGROUND: <Shield className="h-4 w-4" />,
  CAREGIVER_TRAINING: <FileText className="h-4 w-4" />,
  CLIENT_AUTHORIZATION: <Clock className="h-4 w-4" />,
  CARE_PLAN_REVIEW: <Calendar className="h-4 w-4" />,
  EVV_SUBMISSION: <CheckCircle className="h-4 w-4" />,
  INCIDENT_REPORT: <AlertCircle className="h-4 w-4" />,
};

interface DeadlineItemProps {
  deadline: ComplianceDeadline;
  onResolve: (id: string) => void;
}

const DeadlineItem: React.FC<DeadlineItemProps> = ({ deadline, onResolve }) => {
  const styles = PRIORITY_STYLES[deadline.priority] ?? PRIORITY_STYLES['LOW']!;
  const daysRemaining = Math.ceil(
    (new Date(deadline.deadlineDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return (
    <div className={`p-4 rounded-lg border-l-4 ${styles.border} ${styles.bg}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={styles.icon}>
              {CATEGORY_ICONS[deadline.category] ?? <AlertCircle className="h-4 w-4" />}
            </span>
            <h4 className="font-semibold text-gray-900">{deadline.title}</h4>
            <span className={`px-2 py-0.5 text-xs font-bold rounded ${styles.badge}`}>
              {deadline.priority}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{deadline.description}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {deadline.entityName}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {daysRemaining > 0 
                ? `${daysRemaining} days remaining`
                : daysRemaining === 0
                  ? 'Due today'
                  : `${Math.abs(daysRemaining)} days overdue`
              }
            </div>
            <div className="text-gray-400">
              Status: {STATUS_LABELS[deadline.status] ?? deadline.status}
            </div>
          </div>
        </div>
        <div className="ml-4 flex flex-col gap-2">
          {deadline.actionUrl !== undefined && (
            <a
              href={deadline.actionUrl}
              className="text-sm text-primary-600 hover:text-primary-800 hover:underline"
            >
              {deadline.actionLabel ?? 'Take Action'}
            </a>
          )}
          {deadline.status !== 'CURRENT' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onResolve(deadline.id)}
            >
              Resolve
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
}) => {
  const bgColors = {
    default: 'bg-gray-50',
    success: 'bg-green-50',
    warning: 'bg-yellow-50',
    danger: 'bg-red-50',
  };

  const iconColors = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
  };

  return (
    <div className={`p-4 rounded-lg ${bgColors[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle !== undefined && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && trendValue !== undefined && (
            <p className={`text-xs mt-1 ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-500'
            }`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
            </p>
          )}
        </div>
        <div className={`p-2 rounded-full ${bgColors[variant]} ${iconColors[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export const ComplianceDashboard: React.FC = () => {
  const {
    dashboard,
    deadlines,
    isLoading,
    error,
    refresh,
    runScan,
    resolveDeadline,
    generateAuditReport,
  } = useCompliance();
  
  const [isScanning, setIsScanning] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleScan = async (): Promise<void> => {
    setIsScanning(true);
    try {
      await runScan();
      toast.success('Compliance scan completed');
    } catch {
      toast.error('Failed to run compliance scan');
    } finally {
      setIsScanning(false);
    }
  };

  const handleResolve = async (deadlineId: string): Promise<void> => {
    try {
      await resolveDeadline(deadlineId);
      toast.success('Deadline marked as resolved');
    } catch {
      toast.error('Failed to resolve deadline');
    }
  };

  const handleGenerateReport = async (): Promise<void> => {
    setIsGeneratingReport(true);
    try {
      // Default to last 90 days
      const endDate = new Date().toISOString().split('T')[0]!;
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
      
      const report = await generateAuditReport(startDate, endDate);
      
      // Create downloadable JSON
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-audit-report-${endDate}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Audit report generated');
    } catch {
      toast.error('Failed to generate audit report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (isLoading && dashboard === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error !== null && dashboard === null) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-12 w-12" />}
        title="Failed to Load Compliance Data"
        description={error}
        action={
          <Button onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        }
      />
    );
  }

  // Group deadlines by status for display
  const overdueDeadlines = deadlines.filter(d => d.status === 'OVERDUE' || d.status === 'BLOCKED');
  const dueSoonDeadlines = deadlines.filter(d => d.status === 'DUE_SOON');
  const upcomingDeadlines = deadlines.filter(d => d.status === 'UPCOMING');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Autopilot</h1>
          <p className="text-gray-600 mt-1">
            Proactive compliance monitoring - never miss a deadline
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleScan}
            disabled={isScanning}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Run Scan'}
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGeneratingReport ? 'Generating...' : 'Audit Report'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {dashboard !== null && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Overdue Items"
            value={dashboard.deadlineCounts.overdue}
            subtitle="Requires immediate attention"
            icon={<AlertCircle className="h-5 w-5" />}
            variant={dashboard.deadlineCounts.overdue > 0 ? 'danger' : 'success'}
          />
          <SummaryCard
            title="Due Soon"
            value={dashboard.deadlineCounts.dueSoon}
            subtitle="Action needed this week"
            icon={<AlertTriangle className="h-5 w-5" />}
            variant={dashboard.deadlineCounts.dueSoon > 0 ? 'warning' : 'default'}
          />
          <SummaryCard
            title="Caregivers Compliant"
            value={`${dashboard.caregiverCompliance.compliant}/${dashboard.caregiverCompliance.total}`}
            subtitle={`${dashboard.caregiverCompliance.blocked} blocked from scheduling`}
            icon={<UserCheck className="h-5 w-5" />}
            variant={dashboard.caregiverCompliance.blocked > 0 ? 'warning' : 'success'}
          />
          <SummaryCard
            title="Upcoming"
            value={dashboard.deadlineCounts.upcoming}
            subtitle="Within 30 days"
            icon={<Calendar className="h-5 w-5" />}
            variant="default"
          />
        </div>
      )}

      {/* Authorization Alerts */}
      {dashboard !== null && dashboard.authorizationAlerts.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Authorization Alerts
            </h2>
            <div className="space-y-3">
              {dashboard.authorizationAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-yellow-50 border border-yellow-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{alert.clientName}</p>
                      <p className="text-sm text-gray-600">
                        {alert.usedUnits} / {alert.totalUnits} units used ({Math.round(alert.usagePercentage)}%)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        alert.status === 'EXHAUSTED' ? 'bg-red-500 text-white' :
                        alert.status === 'WARNING_90' ? 'bg-orange-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {alert.status.replace('_', ' ')}
                      </span>
                      {alert.projectedExhaustionDate !== undefined && (
                        <p className="text-xs text-gray-500 mt-1">
                          Projected exhaust: {new Date(alert.projectedExhaustionDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Deadlines */}
      {overdueDeadlines.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Overdue ({overdueDeadlines.length})
            </h2>
            <div className="space-y-3">
              {overdueDeadlines.map(deadline => (
                <DeadlineItem
                  key={deadline.id}
                  deadline={deadline}
                  onResolve={handleResolve}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due Soon Deadlines */}
      {dueSoonDeadlines.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Due Soon ({dueSoonDeadlines.length})
            </h2>
            <div className="space-y-3">
              {dueSoonDeadlines.map(deadline => (
                <DeadlineItem
                  key={deadline.id}
                  deadline={deadline}
                  onResolve={handleResolve}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Upcoming ({upcomingDeadlines.length})
            </h2>
            <div className="space-y-3">
              {upcomingDeadlines.slice(0, 10).map(deadline => (
                <DeadlineItem
                  key={deadline.id}
                  deadline={deadline}
                  onResolve={handleResolve}
                />
              ))}
              {upcomingDeadlines.length > 10 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  And {upcomingDeadlines.length - 10} more upcoming deadlines...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {deadlines.length === 0 && (
        <EmptyState
          icon={<CheckCircle className="h-12 w-12 text-green-500" />}
          title="All Clear!"
          description="No compliance deadlines require attention at this time."
          action={
            <Button variant="outline" onClick={handleScan}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Compliance Scan
            </Button>
          }
        />
      )}

      {/* Category Breakdown */}
      {dashboard !== null && dashboard.categoryBreakdown.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Compliance by Category
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboard.categoryBreakdown.map(cat => (
                <div
                  key={cat.category}
                  className="p-3 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {CATEGORY_ICONS[cat.category] ?? <AlertCircle className="h-4 w-4" />}
                    <span className="font-medium text-gray-900">
                      {cat.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total: {cat.total}</span>
                    <div className="flex gap-2">
                      {cat.overdue > 0 && (
                        <span className="text-red-600">{cat.overdue} overdue</span>
                      )}
                      {cat.dueSoon > 0 && (
                        <span className="text-yellow-600">{cat.dueSoon} due soon</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComplianceDashboard;
