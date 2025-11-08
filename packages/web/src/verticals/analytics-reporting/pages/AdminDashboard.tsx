/**
 * Administrator Dashboard
 * Comprehensive analytics dashboard for administrators
 * Displays financial metrics, operational metrics, compliance metrics, and trend analysis
 */

import React, { useState } from 'react';
import { Download, Calendar, RefreshCw } from 'lucide-react';
import { Button, LoadingSpinner, ErrorMessage } from '@/core/components/index.js';
import {
  FinancialMetricsCard,
  ComplianceMetricsCard,
  TrendChart,
  ExportModal,
  MetricCard,
} from '../components';
import {
  useOperationalKPIs,
  useRevenueTrends,
  useComplianceAlerts,
} from '../hooks/useAnalytics';
import type { DateRange, ReportType, ExportFormat, RevenueTrendDataPoint } from '@/types/analytics-types';

export const AdminDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });
  const [showExportModal, setShowExportModal] = useState(false);

  // Fetch data
  const {
    data: kpis,
    isLoading: kpisLoading,
    error: kpisError,
    refetch: refetchKPIs,
  } = useOperationalKPIs({ dateRange }, { refetchInterval: 300000 }); // 5 min

  const {
    data: revenueTrends,
    isLoading: trendsLoading,
    error: trendsError,
  } = useRevenueTrends({ dateRange });

  const {
    data: complianceAlerts,
    isLoading: alertsLoading,
  } = useComplianceAlerts({ dateRange });

  const isLoading = kpisLoading || trendsLoading || alertsLoading;
  const error = kpisError || trendsError;

  const handleExport = async (format: ExportFormat, options: any) => {
    // Export logic will be handled by the API
    console.log('Exporting report:', format, options);
    // The actual export is handled in the ExportModal through the useExportReport hook
  };

  const reportTypes: Array<{
    value: ReportType;
    label: string;
    description: string;
  }> = [
    {
      value: 'REVENUE_CYCLE',
      label: 'Revenue Cycle Report',
      description: 'Financial performance, A/R aging, and revenue trends',
    },
    {
      value: 'EVV_COMPLIANCE',
      label: 'EVV Compliance Report',
      description: 'Electronic visit verification compliance and exceptions',
    },
    {
      value: 'PRODUCTIVITY',
      label: 'Productivity Report',
      description: 'Caregiver utilization and performance metrics',
    },
    {
      value: 'CREDENTIAL_COMPLIANCE',
      label: 'Credential Compliance Report',
      description: 'Caregiver credentials and expiration tracking',
    },
  ];

  // Transform revenue trends for chart
  const chartData = revenueTrends?.map((point: RevenueTrendDataPoint) => ({
    label: `${point.month} ${point.year}`,
    billed: point.billed,
    paid: point.paid,
    outstanding: point.outstanding,
  })) || [];

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={(error as Error).message || 'Failed to load dashboard data'}
          retry={refetchKPIs}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive view of financial, operational, and compliance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => refetchKPIs()}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => setShowExportModal(true)}
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
        <Calendar className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-gray-600">Date Range:</span>
        <input
          type="date"
          value={dateRange.startDate.toISOString().split('T')[0]}
          onChange={(e) =>
            setDateRange({ ...dateRange, startDate: new Date(e.target.value) })
          }
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        />
        <span className="text-gray-400">to</span>
        <input
          type="date"
          value={dateRange.endDate.toISOString().split('T')[0]}
          onChange={(e) =>
            setDateRange({ ...dateRange, endDate: new Date(e.target.value) })
          }
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        />
      </div>

      {isLoading && !kpis ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Visit Completion Rate"
              value={`${kpis?.visits.completionRate.toFixed(1)}%`}
              subtitle={`${kpis?.visits.completed} of ${kpis?.visits.scheduled} visits`}
              color="green"
              isLoading={kpisLoading}
            />
            <MetricCard
              title="EVV Compliance"
              value={`${(kpis?.evvCompliance.complianceRate ?? 0).toFixed(1)}%`}
              subtitle={`${kpis?.evvCompliance.flaggedVisits ?? 0} flagged visits`}
              color={
                (kpis?.evvCompliance.complianceRate ?? 0) >= 95
                  ? 'green'
                  : (kpis?.evvCompliance.complianceRate ?? 0) >= 85
                  ? 'yellow'
                  : 'red'
              }
              isLoading={kpisLoading}
            />
            <MetricCard
              title="Caregiver Utilization"
              value={`${kpis?.staffing.utilizationRate.toFixed(1)}%`}
              subtitle={`${kpis?.staffing.activeCaregivers} active caregivers`}
              color="blue"
              isLoading={kpisLoading}
            />
            <MetricCard
              title="Active Clients"
              value={kpis?.clientMetrics.activeClients.toLocaleString() || '0'}
              subtitle={`${kpis?.clientMetrics.newClients || 0} new this period`}
              color="purple"
              isLoading={kpisLoading}
            />
          </div>

          {/* Financial and Compliance Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinancialMetricsCard
              metrics={kpis?.revenueMetrics || {
                billableHours: 0,
                billedAmount: 0,
                paidAmount: 0,
                outstandingAR: 0,
                averageReimbursementRate: 0,
              }}
              isLoading={kpisLoading}
            />
            <ComplianceMetricsCard
              evvMetrics={kpis?.evvCompliance || {
                compliantVisits: 0,
                totalVisits: 0,
                complianceRate: 0,
                flaggedVisits: 0,
                pendingReview: 0,
              }}
              staffingMetrics={kpis?.staffing || {
                activeCaregivers: 0,
                utilizationRate: 0,
                overtimeHours: 0,
                credentialExpirations: 0,
              }}
              alerts={complianceAlerts || []}
              isLoading={kpisLoading || alertsLoading}
            />
          </div>

          {/* Revenue Trends Chart */}
          <TrendChart
            title="Revenue Trends"
            data={chartData}
            lines={[
              { dataKey: 'billed', name: 'Billed', color: '#3b82f6' },
              { dataKey: 'paid', name: 'Paid', color: '#10b981' },
              { dataKey: 'outstanding', name: 'Outstanding', color: '#f59e0b' },
            ]}
            chartType="area"
            height={350}
            valueFormatter={(value) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format(value)
            }
            isLoading={trendsLoading}
          />

          {/* Additional Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Missed Visits"
              value={kpis?.visits.missed.toLocaleString() || '0'}
              subtitle="Require follow-up"
              color="red"
              isLoading={kpisLoading}
            />
            <MetricCard
              title="In Progress"
              value={kpis?.visits.inProgress.toLocaleString() || '0'}
              subtitle="Currently active"
              color="blue"
              isLoading={kpisLoading}
            />
            <MetricCard
              title="Credential Expirations"
              value={kpis?.staffing.credentialExpirations.toLocaleString() || '0'}
              subtitle="Expiring within 30 days"
              color="yellow"
              isLoading={kpisLoading}
            />
          </div>
        </>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        reportTypes={reportTypes}
        dateRange={dateRange}
      />
    </div>
  );
};
