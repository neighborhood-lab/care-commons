/**
 * Admin Dashboard Page
 * Displays high-level KPIs and analytics for agency administrators
 */

import { useState } from 'react';
import {
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { Card } from '@/core/components';
import { LoadingSpinner, ErrorMessage } from '@/core/components';
import { KPICard } from './components/KPICard';
import { AnalyticsFilters, type FilterValues } from './components/AnalyticsFilters';
import { RevenueChart } from './components/charts/RevenueChart';
import { VisitMetricsChart } from './components/charts/VisitMetricsChart';
import { ComplianceGauge } from './components/charts/ComplianceGauge';
import { TopPerformersTable } from './components/charts/TopPerformersTable';
import { AlertsList } from './components/charts/AlertsList';
import {
  useOperationalKPIs,
  useComplianceAlerts,
  useRevenueTrends,
  useAllCaregiverPerformance,
} from '@/verticals/analytics-reporting/hooks/useAnalytics';

export function AdminDashboard() {
  const [filters, setFilters] = useState<FilterValues>({
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
    },
  });

  // Fetch data using React Query hooks
  const {
    data: kpis,
    isLoading: kpisLoading,
    error: kpisError,
  } = useOperationalKPIs(filters);

  const {
    data: alerts,
    isLoading: alertsLoading,
    error: alertsError,
  } = useComplianceAlerts(filters);

  const {
    data: revenueTrends,
    isLoading: trendsLoading,
    error: trendsError,
  } = useRevenueTrends(filters);

  const {
    data: caregiverPerformance,
    isLoading: performanceLoading,
    error: performanceError,
  } = useAllCaregiverPerformance(filters);

  const isLoading = kpisLoading || alertsLoading || trendsLoading || performanceLoading;
  const error = kpisError || alertsError || trendsError || performanceError;

  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message="Failed to load analytics data. Please try again later." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          High-level KPIs and operational metrics
        </p>
      </div>

      <AnalyticsFilters
        onFiltersChange={handleFiltersChange}
        showBranchFilter
        showServiceTypeFilter
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <KPICard
              title="Total Revenue"
              value={formatCurrency(kpis?.revenueMetrics.billedAmount || 0)}
              subtitle={`${formatCurrency(kpis?.revenueMetrics.paidAmount || 0)} paid`}
              icon={<DollarSign className="h-8 w-8 text-green-600" />}
              trend="up"
              trendValue="+12.5%"
            />
            <KPICard
              title="Outstanding A/R"
              value={formatCurrency(kpis?.revenueMetrics.outstandingAR || 0)}
              subtitle="Accounts receivable"
              icon={<FileText className="h-8 w-8 text-orange-600" />}
              trend="down"
              trendValue="-5.2%"
            />
            <KPICard
              title="Active Clients"
              value={kpis?.clientMetrics.activeClients || 0}
              subtitle={`${kpis?.clientMetrics.newClients || 0} new this period`}
              icon={<Users className="h-8 w-8 text-blue-600" />}
              trend="up"
              trendValue="+8"
            />
            <KPICard
              title="Completed Visits"
              value={kpis?.visits.completed || 0}
              subtitle={`${kpis?.visits.completionRate.toFixed(1) || 0}% completion rate`}
              icon={<Calendar className="h-8 w-8 text-purple-600" />}
              trend="up"
              trendValue="+3.8%"
            />
          </div>

          {/* Revenue Overview Section */}
          <Card padding="md" className="mb-6">
            <Card.Header>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
                  <p className="text-sm text-gray-600">Payment trends over time</p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </Card.Header>
            <Card.Content>
              {revenueTrends && revenueTrends.length > 0 ? (
                <RevenueChart data={revenueTrends} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No revenue data available for selected period
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Visit Metrics and EVV Compliance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card padding="md">
              <Card.Header>
                <h2 className="text-lg font-semibold text-gray-900">Visit Metrics</h2>
                <p className="text-sm text-gray-600">Visit breakdown by status</p>
              </Card.Header>
              <Card.Content>
                {kpis?.visits ? (
                  <VisitMetricsChart data={kpis.visits} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No visit data available
                  </div>
                )}
              </Card.Content>
            </Card>

            <Card padding="md">
              <Card.Header>
                <h2 className="text-lg font-semibold text-gray-900">EVV Compliance</h2>
                <p className="text-sm text-gray-600">Electronic Visit Verification</p>
              </Card.Header>
              <Card.Content>
                {kpis?.evvCompliance ? (
                  <ComplianceGauge
                    value={kpis.evvCompliance.complianceRate}
                    label="EVV Compliance Rate"
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No EVV data available
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>

          {/* Caregiver Performance */}
          <Card padding="md" className="mb-6">
            <Card.Header>
              <h2 className="text-lg font-semibold text-gray-900">Top Performers</h2>
              <p className="text-sm text-gray-600">Highest performing caregivers</p>
            </Card.Header>
            <Card.Content>
              {caregiverPerformance && caregiverPerformance.length > 0 ? (
                <TopPerformersTable
                  caregivers={caregiverPerformance}
                  limit={10}
                  onCaregiverClick={(id) => console.log('Navigate to caregiver:', id)}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No caregiver performance data available
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Compliance Alerts */}
          <Card padding="md">
            <Card.Header>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Compliance Alerts</h2>
                  <p className="text-sm text-gray-600">Issues requiring attention</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </Card.Header>
            <Card.Content>
              {alerts && alerts.length > 0 ? (
                <AlertsList
                  alerts={alerts}
                  onAlertClick={(alert) => console.log('Navigate to alert:', alert)}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No compliance alerts at this time
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Staffing Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <KPICard
              title="Active Caregivers"
              value={kpis?.staffing.activeCaregivers || 0}
              subtitle="Currently employed"
              icon={<Users className="h-6 w-6 text-primary-600" />}
            />
            <KPICard
              title="Utilization Rate"
              value={`${kpis?.staffing.utilizationRate.toFixed(1) || 0}%`}
              subtitle="Caregiver capacity used"
              icon={<TrendingUp className="h-6 w-6 text-green-600" />}
            />
            <KPICard
              title="Credential Expirations"
              value={kpis?.staffing.credentialExpirations || 0}
              subtitle="Expiring soon"
              icon={<AlertTriangle className="h-6 w-6 text-yellow-600" />}
            />
          </div>
        </>
      )}
    </div>
  );
}
