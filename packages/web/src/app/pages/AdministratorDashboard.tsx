/**
 * Administrator Dashboard
 *
 * Dashboard for administrators showing:
 * - Organization-wide statistics
 * - Compliance alerts
 * - Financial summary
 * - Quick actions
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/hooks';
import { Card, CardHeader, CardContent, Button, EmptyState } from '@/core/components';
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

  // Note: Using mock data for demonstration - API integration in progress
  const stats = [
    {
      label: 'Total Clients',
      value: '247',
      icon: <Users className="h-6 w-6 text-primary-600" />,
      change: '+12 this month',
      trend: 'up' as const,
      onClick: () => navigate('/clients'),
    },
    {
      label: 'Active Caregivers',
      value: '89',
      icon: <Award className="h-6 w-6 text-green-600" />,
      change: '+5 this month',
      trend: 'up' as const,
      onClick: () => navigate('/caregivers'),
    },
    {
      label: 'Visits This Week',
      value: '1,247',
      icon: <Calendar className="h-6 w-6 text-blue-600" />,
      change: '+3.2% vs last week',
      trend: 'up' as const,
      onClick: () => navigate('/scheduling'),
    },
    {
      label: 'Compliance Rate',
      value: '94.2%',
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      change: '+2.1% improvement',
      trend: 'up' as const,
    },
  ];

  const financialStats = [
    {
      label: 'Outstanding Invoices',
      value: '$47,892',
      icon: <DollarSign className="h-6 w-6 text-yellow-600" />,
      change: '23 invoices pending',
      onClick: () => navigate('/billing'),
    },
    {
      label: 'Payroll Pending',
      value: '$124,567',
      icon: <CreditCard className="h-6 w-6 text-purple-600" />,
      change: 'Due in 3 days',
      onClick: () => navigate('/payroll'),
    },
    {
      label: 'Monthly Revenue',
      value: '$542,180',
      icon: <TrendingUp className="h-6 w-6 text-green-600" />,
      change: '+8.3% vs last month',
      trend: 'up' as const,
    },
    {
      label: 'Collection Rate',
      value: '87.5%',
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      change: '-1.2% vs last month',
      trend: 'down' as const,
    },
  ];

  const complianceAlerts = [
    {
      title: 'Expiring Credentials',
      description: '12 caregivers have certifications expiring within 30 days',
      severity: 'warning' as const,
      count: 12,
      onClick: () => navigate('/caregivers?filter=expiring-credentials'),
    },
    {
      title: 'Missing Documentation',
      description: '8 clients missing required intake forms',
      severity: 'critical' as const,
      count: 8,
      onClick: () => navigate('/clients?filter=missing-docs'),
    },
    {
      title: 'Supervision Visits Overdue',
      description: '5 clients require nurse supervision visits',
      severity: 'critical' as const,
      count: 5,
      onClick: () => navigate('/scheduling?filter=supervision-overdue'),
    },
    {
      title: 'EVV Exceptions',
      description: '18 visits with Electronic Visit Verification issues',
      severity: 'warning' as const,
      count: 18,
      onClick: () => navigate('/evv?filter=exceptions'),
    },
  ];

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
