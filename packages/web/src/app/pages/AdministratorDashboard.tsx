/**
 * Administrator Dashboard
 *
 * Dashboard for administrators showing:
 * - Organization-wide statistics
 * - Compliance alerts
 * - Financial summary
 * - Quick actions
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/hooks';
import { Card, CardHeader, CardContent, Button, EmptyState, LoadingSpinner, ErrorMessage } from '@/core/components';
import {
  Users,
  Calendar,
  AlertCircle,
  DollarSign,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Award,
  CreditCard,
} from 'lucide-react';
import {
  useOperationalKPIs,
  useComplianceAlerts,
} from '@/verticals/analytics-reporting/hooks/useAnalytics';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, change, trend, onClick }) => {
  const getTrendColor = () => {
    if (!trend) return 'text-gray-600';
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card
      padding="md"
      className={`${onClick ? 'cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 active:scale-95' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`mt-1 text-sm ${getTrendColor()}`}>
              {change}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">{icon}</div>
      </div>
    </Card>
  );
};

interface AlertItemProps {
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  count: number;
  onClick?: () => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ title, description, severity, count, onClick }) => {
  const getSeverityStyles = () => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          badge: 'bg-red-500',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-500',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          badge: 'bg-blue-500',
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <div
      className={`p-4 rounded-lg border ${styles.bg} ${styles.border} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className={`h-5 w-5 ${styles.icon} mt-0.5`} />
          <div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${styles.badge}`}>
          {count}
        </span>
      </div>
    </div>
  );
};

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, description, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 text-left rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
          <div className="text-primary-600">{icon}</div>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </button>
  );
};

export const AdministratorDashboard: React.FC = () => {
  useAuth();
  const navigate = useNavigate();

  // Memoize filters to prevent infinite re-renders
  const kpiFilters = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return {
      dateRange: { startDate, endDate },
    };
  }, []);

  const alertFilters = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      dateRange: { startDate: today, endDate: today },
    };
  }, []);

  // Fetch real data from APIs
  const {
    data: kpis,
    isLoading: kpisLoading,
    error: kpisError,
  } = useOperationalKPIs(kpiFilters);

  const {
    data: alerts,
    isLoading: alertsLoading,
    error: alertsError,
  } = useComplianceAlerts(alertFilters);

  const isLoading = kpisLoading || alertsLoading;
  const error = kpisError || alertsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message="Failed to load dashboard data. Please try again." />
      </div>
    );
  }

  // Map real data to stat cards
  const stats = [
    {
      label: 'Total Clients',
      value: kpis?.clientMetrics.activeClients.toString() ?? '0',
      icon: <Users className="h-6 w-6 text-primary-600" />,
      change: `${kpis?.clientMetrics.newClients ?? 0} new this month`,
      trend: (kpis?.clientMetrics.newClients ?? 0) > 0 ? ('up' as const) : ('neutral' as const),
      onClick: () => navigate('/clients'),
    },
    {
      label: 'Active Caregivers',
      value: kpis?.staffing.activeCaregivers.toString() ?? '0',
      icon: <Award className="h-6 w-6 text-green-600" />,
      change: `${Math.round(kpis?.staffing.utilizationRate ?? 0)}% utilization`,
      trend: 'neutral' as const,
      onClick: () => navigate('/caregivers'),
    },
    {
      label: 'Visits This Week',
      value: (kpis?.visits.scheduled ?? 0).toString(),
      icon: <Calendar className="h-6 w-6 text-blue-600" />,
      change: `${kpis?.visits.completed ?? 0} completed`,
      trend: 'neutral' as const,
      onClick: () => navigate('/scheduling'),
    },
    {
      label: 'EVV Compliance',
      value: `${Math.round(kpis?.evvCompliance.complianceRate ?? 0)}%`,
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      change: `${kpis?.evvCompliance.compliantVisits ?? 0} of ${kpis?.evvCompliance.totalVisits ?? 0} compliant`,
      trend: (kpis?.evvCompliance.complianceRate ?? 0) >= 95 ? ('up' as const) : ((kpis?.evvCompliance.complianceRate ?? 0) >= 85 ? ('neutral' as const) : ('down' as const)),
    },
  ];

  // Map real financial data from revenue metrics
  const financialStats = [
    {
      label: 'Outstanding A/R',
      value: `$${(kpis?.revenueMetrics.outstandingAR ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <DollarSign className="h-6 w-6 text-yellow-600" />,
      change: 'Accounts receivable',
      onClick: () => navigate('/billing'),
    },
    {
      label: 'Total Billed',
      value: `$${(kpis?.revenueMetrics.billedAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      change: `${kpis?.revenueMetrics.billableHours ?? 0} billable hours`,
      trend: 'neutral' as const,
      onClick: () => navigate('/billing'),
    },
    {
      label: 'Collected',
      value: `$${(kpis?.revenueMetrics.paidAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <TrendingUp className="h-6 w-6 text-green-600" />,
      change: 'Paid invoices',
      trend: 'up' as const,
      onClick: () => navigate('/billing'),
    },
    {
      label: 'Avg Reimbursement',
      value: `$${(kpis?.revenueMetrics.averageReimbursementRate ?? 0).toFixed(2)}/hr`,
      icon: <CreditCard className="h-6 w-6 text-purple-600" />,
      change: 'Per billable hour',
      trend: 'neutral' as const,
    },
  ];

  // Map real compliance alerts
  const complianceAlerts = (alerts ?? [])
    .slice(0, 4) // Show top 4 alerts
    .map((alert) => {
      const severityMap: Record<string, 'critical' | 'warning' | 'info'> = {
        CRITICAL: 'critical',
        HIGH: 'critical',
        MEDIUM: 'warning',
        WARNING: 'warning',
        INFO: 'info',
      };
      
      const titleMap: Record<string, string> = {
        CREDENTIAL_EXPIRING: 'Expiring Credentials',
        AUTHORIZATION_EXPIRING: 'Authorization Expiring',
        SUPERVISORY_VISIT_OVERDUE: 'Supervision Visits Overdue',
        EVV_SUBMISSION_DELAYED: 'EVV Submission Delayed',
        CARE_PLAN_EXPIRING: 'Care Plans Expiring',
        ASSESSMENT_OVERDUE: 'Assessments Overdue',
        TRAINING_EXPIRING: 'Training Expiring',
        BACKGROUND_CHECK_EXPIRING: 'Background Checks Expiring',
      };

      return {
        title: titleMap[alert.type] ?? alert.type,
        description: alert.message,
        severity: severityMap[alert.severity] ?? 'info',
        count: alert.count,
        onClick: () => {
          // Navigate to appropriate page based on alert type
          if (alert.type.includes('CREDENTIAL') || alert.type.includes('TRAINING') || alert.type.includes('BACKGROUND')) {
            navigate('/caregivers');
          } else if (alert.type.includes('AUTHORIZATION') || alert.type.includes('ASSESSMENT')) {
            navigate('/clients');
          } else if (alert.type.includes('VISIT') || alert.type.includes('CARE_PLAN')) {
            navigate('/scheduling');
          } else if (alert.type.includes('EVV')) {
            navigate('/time-tracking');
          }
        },
      };
    });

  const quickActions = [
    {
      title: 'Approve Timesheets',
      description: '23 pending approvals',
      icon: <Clock className="h-5 w-5" />,
      onClick: () => navigate('/time-tracking?tab=approvals'),
    },
    {
      title: 'Review Exceptions',
      description: 'Visit and billing exceptions',
      icon: <AlertTriangle className="h-5 w-5" />,
      onClick: () => navigate('/exceptions'),
    },
    {
      title: 'Run Reports',
      description: 'Analytics and compliance reports',
      icon: <FileText className="h-5 w-5" />,
      onClick: () => navigate('/reports'),
    },
    {
      title: 'System Activity',
      description: 'View audit logs and system health',
      icon: <Activity className="h-5 w-5" />,
      onClick: () => navigate('/admin/activity'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Administrator Dashboard
        </h1>
        <p className="mt-1 text-gray-600">
          Organization-wide overview and compliance monitoring
        </p>
      </div>

      {/* Organization Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* Compliance Alerts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Compliance Alerts</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/compliance')}
          >
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {complianceAlerts.map((alert, index) => (
            <AlertItem key={index} {...alert} />
          ))}
        </div>
      </div>

      {/* Financial Summary and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Summary */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h2>
          <div className="space-y-4">
            {financialStats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader title="Recent System Activity" />
        <CardContent>
          <EmptyState
            title="No recent activity"
            description="System activity and audit logs will appear here"
            icon={<Activity className="h-12 w-12" />}
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/admin/activity')}
              >
                View Activity Log
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};
