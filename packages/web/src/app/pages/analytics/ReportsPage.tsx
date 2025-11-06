/**
 * Reports Page
 * Generate and export various analytics reports
 */

import { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  PlusCircle,
} from 'lucide-react';
import { Card, Button, LoadingSpinner, ErrorMessage, Badge } from '@/core/components';
import { AnalyticsFilters, type FilterValues } from './components/AnalyticsFilters';
import {
  useReports,
  useGenerateReport,
  useExportReport,
} from '@/verticals/analytics-reporting/hooks/useAnalytics';
import type { Report, ReportType, ExportFormat } from '@care-commons/analytics-reporting/types/analytics';

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: 'EVV_COMPLIANCE',
    label: 'EVV Compliance Report',
    description: 'Electronic Visit Verification compliance metrics',
  },
  {
    value: 'PRODUCTIVITY',
    label: 'Productivity Report',
    description: 'Caregiver performance and productivity analysis',
  },
  {
    value: 'REVENUE_CYCLE',
    label: 'Revenue Cycle Report',
    description: 'Financial metrics, billing, and collections',
  },
  {
    value: 'CAREGIVER_PERFORMANCE',
    label: 'Caregiver Performance Report',
    description: 'Individual caregiver metrics and KPIs',
  },
  {
    value: 'CLIENT_SUMMARY',
    label: 'Client Summary Report',
    description: 'Client demographics and service utilization',
  },
  {
    value: 'AUTHORIZATION_STATUS',
    label: 'Authorization Status Report',
    description: 'Authorization expiration and compliance',
  },
  {
    value: 'CREDENTIAL_COMPLIANCE',
    label: 'Credential Compliance Report',
    description: 'Caregiver credentials and certifications',
  },
];

export function ReportsPage() {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('EVV_COMPLIANCE');
  const [filters, setFilters] = useState<FilterValues>({
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    },
  });

  const { data: reports, isLoading, error } = useReports();
  const generateReport = useGenerateReport();
  const exportReport = useExportReport();

  const handleGenerateReport = async () => {
    try {
      await generateReport.mutateAsync({
        reportType: selectedReportType,
        filters,
      });
      setShowGenerateModal(false);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const handleExportReport = async (reportId: string, format: ExportFormat) => {
    try {
      await exportReport.mutateAsync({ reportId, format });
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message="Failed to load reports. Please try again later." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="mt-1 text-sm text-gray-600">
              Generate and export analytics reports
            </p>
          </div>
          <Button
            onClick={() => setShowGenerateModal(true)}
            icon={<PlusCircle className="h-5 w-5" />}
          >
            Generate Report
          </Button>
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card padding="md" className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <Card.Header>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Generate Report</h2>
                  <p className="text-sm text-gray-600">
                    Select report type and configure parameters
                  </p>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {/* Report Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Type
                  </label>
                  <select
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value as ReportType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {REPORT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-600">
                    {REPORT_TYPES.find((t) => t.value === selectedReportType)?.description}
                  </p>
                </div>

                {/* Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Filter className="inline h-4 w-4 mr-1" />
                    Filters
                  </label>
                  <AnalyticsFilters
                    onFiltersChange={setFilters}
                    showClientFilter
                    showCaregiverFilter
                    showServiceTypeFilter
                    showBranchFilter
                  />
                </div>
              </div>
            </Card.Content>
            <Card.Footer>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowGenerateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateReport}
                  disabled={generateReport.isPending}
                >
                  {generateReport.isPending ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </div>
      )}

      {/* Reports List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {reports && reports.length > 0 ? (
            reports.map((report) => (
              <Card key={report.id} padding="md">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <FileText className="h-6 w-6 text-primary-600 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {report.title}
                        </h3>
                        <Badge variant="default">
                          {REPORT_TYPES.find((t) => t.value === report.reportType)?.label}
                        </Badge>
                      </div>
                      {report.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {report.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(report.period.startDate)} -{' '}
                          {formatDate(report.period.endDate)}
                        </span>
                        <span>
                          Generated: {formatDate(report.generatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {report.exportFormats.includes('PDF') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleExportReport(report.id, 'PDF')}
                        disabled={exportReport.isPending}
                        icon={<Download className="h-4 w-4" />}
                      >
                        PDF
                      </Button>
                    )}
                    {report.exportFormats.includes('EXCEL') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleExportReport(report.id, 'EXCEL')}
                        disabled={exportReport.isPending}
                        icon={<Download className="h-4 w-4" />}
                      >
                        Excel
                      </Button>
                    )}
                    {report.exportFormats.includes('CSV') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleExportReport(report.id, 'CSV')}
                        disabled={exportReport.isPending}
                        icon={<Download className="h-4 w-4" />}
                      >
                        CSV
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card padding="md">
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No reports generated yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Click "Generate Report" to create your first report
                </p>
                <Button
                  onClick={() => setShowGenerateModal(true)}
                  icon={<PlusCircle className="h-5 w-5" />}
                >
                  Generate Report
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
