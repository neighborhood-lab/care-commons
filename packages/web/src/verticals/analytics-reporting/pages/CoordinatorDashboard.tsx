/**
 * Coordinator Dashboard
 * Focused dashboard for care coordinators
 * Displays today's overview, caregiver performance, client satisfaction, and scheduling efficiency
 */

import React, { useState } from 'react';
import { Calendar, AlertCircle, Clock, TrendingUp, Download } from 'lucide-react';
import { Button, LoadingSpinner, ErrorMessage, Card, CardContent, Badge } from '@/core/components/index.js';
import { MetricCard, ExportModal } from '../components';
import {
  useDashboardStats,
  useAllCaregiverPerformance,
  useEVVExceptions,
  useOperationalKPIs,
} from '../hooks/useAnalytics';
import type { DateRange, ReportType, ExportFormat, CaregiverPerformance } from '@/types/analytics-types';

export const CoordinatorDashboard: React.FC = () => {
  const [dateRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    endDate: new Date(),
  });
  const [showExportModal, setShowExportModal] = useState(false);

  // Fetch data with auto-refresh
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDashboardStats({ refetchInterval: 60000 }); // 1 min

  const {
    data: caregiverPerformance,
    isLoading: performanceLoading,
  } = useAllCaregiverPerformance({ dateRange });

  const {
    data: exceptions,
    isLoading: exceptionsLoading,
  } = useEVVExceptions({ dateRange }, { refetchInterval: 300000 }); // 5 min

  const {
    data: kpis,
    isLoading: kpisLoading,
  } = useOperationalKPIs({ dateRange });

  const isLoading = statsLoading || performanceLoading || exceptionsLoading || kpisLoading;
  const error = statsError;

  const handleExport = async (format: ExportFormat, options: any) => {
    console.log('Exporting report:', format, options);
  };

  const reportTypes: Array<{
    value: ReportType;
    label: string;
    description: string;
  }> = [
    {
      value: 'CAREGIVER_PERFORMANCE',
      label: 'Caregiver Performance Report',
      description: 'Detailed performance metrics for all caregivers',
    },
    {
      value: 'PRODUCTIVITY',
      label: 'Daily Operations Report',
      description: 'Visit status, exceptions, and scheduling efficiency',
    },
    {
      value: 'EVV_COMPLIANCE',
      label: 'EVV Compliance Report',
      description: 'Electronic visit verification status',
    },
  ];

  // Calculate top performers
  const topPerformers = caregiverPerformance
    ?.sort((a: CaregiverPerformance, b: CaregiverPerformance) => b.performanceScore - a.performanceScore)
    .slice(0, 5) || [];

  // Calculate scheduling efficiency metrics
  const schedulingEfficiency = kpis?.visits
    ? {
        fillRate: (kpis.visits.completed / kpis.visits.scheduled) * 100,
        cancellationRate: (kpis.visits.missed / kpis.visits.scheduled) * 100,
      }
    : { fillRate: 0, cancellationRate: 0 };

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={(error as Error).message || 'Failed to load dashboard data'}
          retry={refetchStats}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coordinator Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Today's overview and operational performance
          </p>
        </div>
        <Button
          leftIcon={<Download className="h-4 w-4" />}
          onClick={() => setShowExportModal(true)}
        >
          Export Report
        </Button>
      </div>

      {isLoading && !stats ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Today's Overview */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="In Progress"
                value={stats?.inProgress.toLocaleString() || '0'}
                subtitle="Active visits now"
                color="blue"
                icon={Clock}
                isLoading={statsLoading}
              />
              <MetricCard
                title="Completed Today"
                value={stats?.completedToday.toLocaleString() || '0'}
                subtitle="Visits finished"
                color="green"
                icon={TrendingUp}
                isLoading={statsLoading}
              />
              <MetricCard
                title="Upcoming"
                value={stats?.upcoming.toLocaleString() || '0'}
                subtitle="Scheduled visits"
                color="purple"
                icon={Calendar}
                isLoading={statsLoading}
              />
              <MetricCard
                title="Needs Review"
                value={stats?.needsReview.toLocaleString() || '0'}
                subtitle="Exceptions & issues"
                color="red"
                icon={AlertCircle}
                isLoading={statsLoading}
              />
            </div>
          </div>

          {/* Caregiver Performance */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performers</h2>
            <Card>
              <CardContent className="p-6">
                {performanceLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : topPerformers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No performance data available
                  </p>
                ) : (
                  <div className="space-y-4">
                    {topPerformers.map((caregiver: CaregiverPerformance, index: number) => (
                      <div
                        key={caregiver.caregiverId}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {caregiver.caregiverName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {caregiver.visitsCompleted} visits completed
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-600">On-Time Rate</div>
                            <div className="font-semibold text-green-600">
                              {caregiver.onTimePercentage.toFixed(1)}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">EVV Compliance</div>
                            <div className="font-semibold text-blue-600">
                              {caregiver.evvComplianceRate.toFixed(1)}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Score</div>
                            <div className="font-bold text-gray-900">
                              {caregiver.performanceScore.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Scheduling Efficiency */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduling Efficiency</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MetricCard
                title="Fill Rate"
                value={`${schedulingEfficiency.fillRate.toFixed(1)}%`}
                subtitle="Visits completed vs scheduled"
                color="green"
                isLoading={kpisLoading}
              />
              <MetricCard
                title="Cancellation Rate"
                value={`${schedulingEfficiency.cancellationRate.toFixed(1)}%`}
                subtitle="Missed or cancelled visits"
                color={schedulingEfficiency.cancellationRate > 10 ? 'red' : 'yellow'}
                isLoading={kpisLoading}
              />
            </div>
          </div>

          {/* Recent Exceptions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Exceptions</h2>
            <Card>
              <CardContent className="p-6">
                {exceptionsLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : !exceptions || exceptions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No exceptions found
                  </p>
                ) : (
                  <div className="space-y-3">
                    {exceptions.slice(0, 10).map((exception) => (
                      <div
                        key={exception.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {exception.caregiverName}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">
                              {exception.clientName}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {exception.description}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              exception.severity === 'CRITICAL' || exception.severity === 'HIGH'
                                ? 'error'
                                : exception.severity === 'MEDIUM'
                                ? 'warning'
                                : 'default'
                            }
                          >
                            {exception.severity}
                          </Badge>
                          <Badge variant="default">
                            {exception.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
