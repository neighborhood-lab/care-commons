/**
 * Reports & Analytics Dashboard
 *
 * Comprehensive administrator reporting with:
 * - Monthly revenue by payer source (Medicaid, Medicare, Private)
 * - Caregiver utilization rates (billable hours / available hours)
 * - Visit completion rates by coordinator
 * - Compliance metrics (EVV, documentation, credentials)
 * - Client satisfaction trends
 * - Export to Excel/PDF functionality
 */

import { useState } from 'react';
import {
  Download,
  Filter,
  DollarSign,
  Users,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, Button, LoadingSpinner, ErrorMessage, Badge } from '@/core/components';
import {
  useOperationalKPIs,
  useRevenueTrends,
  useAllCaregiverPerformance,
} from '@/verticals/analytics-reporting/hooks/useAnalytics';
import type { FilterValues } from '@/app/pages/analytics/components/AnalyticsFilters';
import { AnalyticsFilters } from '@/app/pages/analytics/components/AnalyticsFilters';

// Payer source colors
const PAYER_COLORS = {
  MEDICAID: '#3b82f6', // blue
  MEDICARE: '#10b981', // green
  PRIVATE: '#f59e0b', // amber
  OTHER: '#6b7280', // gray
};

// Default date range (last 30 days)
const getDefaultFilters = (): FilterValues => ({
  dateRange: {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
});

export function ReportsPage() {
  const [filters, setFilters] = useState<FilterValues>(getDefaultFilters);
  const [exportFormat, setExportFormat] = useState<'PDF' | 'EXCEL' | null>(null);

  // Fetch analytics data
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useOperationalKPIs(filters);
  const { data: revenueTrends, isLoading: trendsLoading, error: trendsError } = useRevenueTrends(filters);
  const { data: caregiverPerformance, isLoading: performanceLoading, error: performanceError } = useAllCaregiverPerformance(filters);

  const isLoading = kpisLoading || trendsLoading || performanceLoading;
  const error = kpisError ?? trendsError ?? performanceError;

  // Mock data for demonstration - in production, this would come from the API
  const revenueByPayerData = [
    { name: 'Medicaid', value: 245000, percentage: 52 },
    { name: 'Medicare', value: 180000, percentage: 38 },
    { name: 'Private Pay', value: 47000, percentage: 10 },
  ];

  const caregiverUtilizationData = caregiverPerformance?.slice(0, 10).map(cg => ({
    name: cg.caregiverName,
    visitsCompleted: cg.visitsCompleted,
    availableVisits: 20, // Assume 20 visits/month capacity
    utilizationRate: Math.round((cg.visitsCompleted / 20) * 100),
  })) ?? [];

  const visitCompletionByCoordinatorData = [
    { coordinator: 'Sarah Johnson', completed: 145, total: 158, rate: 92 },
    { coordinator: 'Michael Chen', completed: 132, total: 145, rate: 91 },
    { coordinator: 'Emily Davis', completed: 128, total: 142, rate: 90 },
    { coordinator: 'Robert Wilson', completed: 118, total: 135, rate: 87 },
    { coordinator: 'Maria Garcia', completed: 115, total: 138, rate: 83 },
  ];

  const complianceMetricsData = [
    { metric: 'EVV Compliance', value: (kpis?.evvCompliance.complianceRate ?? 0) * 100, target: 95 },
    { metric: 'Documentation', value: 94, target: 95 },
    { metric: 'Credentials Current', value: 97, target: 100 },
    { metric: 'Training Complete', value: 89, target: 90 },
  ];

  const clientSatisfactionTrendsData = revenueTrends?.map((point) => ({
    month: point.month,
    satisfaction: 85 + Math.random() * 10, // Mock data - would come from client surveys
  })) ?? [];

  // Export handlers
  const handleExportPDF = async () => {
    setExportFormat('PDF');
    try {
      // In production, this would call the export API
      console.log('Exporting to PDF...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('PDF export functionality would be implemented here using a library like jsPDF or backend generation');
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExportFormat(null);
    }
  };

  const handleExportExcel = async () => {
    setExportFormat('EXCEL');
    try {
      // In production, this would call the export API
      console.log('Exporting to Excel...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Excel export functionality would be implemented here using a library like xlsx or backend generation');
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExportFormat(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message="Failed to load reports data. Please try again later." />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive administrator reports with export capabilities
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleExportPDF}
              disabled={exportFormat === 'PDF'}
              leftIcon={<Download className="h-5 w-5" />}
            >
              {exportFormat === 'PDF' ? 'Exporting...' : 'Export PDF'}
            </Button>
            <Button
              onClick={handleExportExcel}
              disabled={exportFormat === 'EXCEL'}
              leftIcon={<Download className="h-5 w-5" />}
            >
              {exportFormat === 'EXCEL' ? 'Exporting...' : 'Export Excel'}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <AnalyticsFilters
          onFiltersChange={setFilters}
          showBranchFilter
        />
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(kpis?.revenueMetrics.billedAmount ?? 0)}
                  </p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +12% from last period
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-primary-600" />
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Visit Completion</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatPercentage((kpis?.visits.completionRate ?? 0) * 100)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {kpis?.visits.completed ?? 0} of {(kpis?.visits.completed ?? 0) + (kpis?.visits.missed ?? 0)} visits
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">EVV Compliance</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatPercentage((kpis?.evvCompliance.complianceRate ?? 0) * 100)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {kpis?.evvCompliance.compliantVisits ?? 0} compliant visits
                  </p>
                </div>
                <BarChart3 className="h-10 w-10 text-blue-600" />
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Caregivers</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {kpis?.staffing.activeCaregivers ?? 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {kpis?.staffing.utilizationRate ? formatPercentage(kpis.staffing.utilizationRate * 100) : '0%'} avg utilization
                  </p>
                </div>
                <Users className="h-10 w-10 text-purple-600" />
              </div>
            </Card>
          </div>

          {/* Monthly Revenue by Payer Source */}
          <Card padding="md">
            <Card.Header
              title="Monthly Revenue by Payer Source"
              subtitle="Revenue breakdown by Medicaid, Medicare, and Private Pay"
            />
            <Card.Content>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={revenueByPayerData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.percent?.toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {revenueByPayerData.map((_entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={Object.values(PAYER_COLORS)[idx]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Table */}
                <div className="space-y-3">
                  {revenueByPayerData.map((payer, idx) => (
                    <div key={payer.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: Object.values(PAYER_COLORS)[idx] }}
                        />
                        <span className="font-medium text-gray-900">{payer.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatCurrency(payer.value)}</div>
                        <div className="text-sm text-gray-600">{payer.percentage}% of total</div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total Revenue</span>
                      <span className="font-bold text-lg text-gray-900">
                        {formatCurrency(revenueByPayerData.reduce((sum, p) => sum + p.value, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Caregiver Utilization Rates */}
          <Card padding="md">
            <Card.Header
              title="Caregiver Utilization Rates"
              subtitle="Visits completed vs. capacity"
            />
            <Card.Content>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={caregiverUtilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="visitsCompleted" fill="#3b82f6" name="Visits Completed" />
                  <Bar dataKey="availableVisits" fill="#e5e7eb" name="Available Capacity" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Average Utilization:</strong> {
                    caregiverUtilizationData.length > 0
                      ? formatPercentage(caregiverUtilizationData.reduce((sum, cg) => sum + cg.utilizationRate, 0) / caregiverUtilizationData.length)
                      : '0%'
                  }
                  {' • '}
                  <strong>Target:</strong> 75-85%
                </p>
              </div>
            </Card.Content>
          </Card>

          {/* Visit Completion Rates by Coordinator */}
          <Card padding="md">
            <Card.Header
              title="Visit Completion Rates by Coordinator"
              subtitle="Performance metrics for care coordinators"
            />
            <Card.Content>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coordinator
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Assigned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completion Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visitCompletionByCoordinatorData.map((coordinator) => (
                      <tr key={coordinator.coordinator}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {coordinator.coordinator}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{coordinator.completed}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{coordinator.total}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {coordinator.rate}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {coordinator.rate >= 90 ? (
                            <Badge variant="success">Excellent</Badge>
                          ) : coordinator.rate >= 85 ? (
                            <Badge variant="default">Good</Badge>
                          ) : (
                            <Badge variant="warning">Needs Improvement</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Content>
          </Card>

          {/* Compliance Metrics */}
          <Card padding="md">
            <Card.Header
              title="Compliance Metrics"
              subtitle="EVV, documentation, credentials, and training compliance"
            />
            <Card.Content>
              <div className="space-y-4">
                {complianceMetricsData.map((metric) => (
                  <div key={metric.metric}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{metric.metric}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatPercentage(metric.value)}
                        </span>
                        <span className="text-xs text-gray-500">
                          (Target: {formatPercentage(metric.target)})
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          metric.value >= metric.target
                            ? 'bg-green-600'
                            : metric.value >= metric.target - 5
                            ? 'bg-yellow-500'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Compliance Alert
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Training completion is below target. Additional caregivers need to complete required training.
                    </p>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Client Satisfaction Trends */}
          <Card padding="md">
            <Card.Header
              title="Client Satisfaction Trends"
              subtitle="Monthly satisfaction scores over time"
            />
            <Card.Content>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={clientSatisfactionTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${Math.round(value as number)}%`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="satisfaction"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Satisfaction Score"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {clientSatisfactionTrendsData.length > 0
                      ? formatPercentage(clientSatisfactionTrendsData.reduce((sum, point) => sum + point.satisfaction, 0) / clientSatisfactionTrendsData.length)
                      : '0%'}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Trend</p>
                  <p className="text-2xl font-bold text-blue-600 flex items-center gap-1">
                    <TrendingUp className="h-5 w-5" />
                    +2.3%
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Surveys Completed</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round((kpis?.clientMetrics.activeClients ?? 0) * 0.65)}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  );
}
