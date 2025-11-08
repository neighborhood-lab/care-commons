/**
 * Export Modal Component
 * UI for configuring and exporting analytics reports
 */

import React, { useState } from 'react';
import { Button } from '@/core/components/index.js';
import { Download, FileText, Table, File, X, Check } from 'lucide-react';
import type { ExportFormat, ReportType, DateRange } from '@/types/analytics-types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, options: ExportOptions) => Promise<void>;
  reportTypes: Array<{
    value: ReportType;
    label: string;
    description: string;
  }>;
  dateRange: DateRange;
}

interface ExportOptions {
  reportType: ReportType;
  format: ExportFormat;
  includeCharts: boolean;
  includeRawData: boolean;
}

const exportFormats: Array<{
  value: ExportFormat;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    value: 'PDF',
    label: 'PDF Report',
    icon: <FileText className="h-5 w-5" />,
    description: 'Formatted report for printing and sharing',
  },
  {
    value: 'EXCEL',
    label: 'Excel Spreadsheet',
    icon: <Table className="h-5 w-5" />,
    description: 'Detailed data for analysis in Excel',
  },
  {
    value: 'CSV',
    label: 'CSV File',
    icon: <File className="h-5 w-5" />,
    description: 'Raw data export for custom processing',
  },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  reportTypes,
  dateRange,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('PDF');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>(
    reportTypes[0]?.value || 'EVV_COMPLIANCE'
  );
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await onExport(selectedFormat, {
        reportType: selectedReportType,
        format: selectedFormat,
        includeCharts,
        includeRawData,
      });
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Export Report</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6">
            {/* Date Range Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-900">
                <strong>Date Range:</strong> {formatDate(dateRange.startDate)} -{' '}
                {formatDate(dateRange.endDate)}
              </div>
            </div>

            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Report Type
              </label>
              <div className="space-y-2">
                {reportTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedReportType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      value={type.value}
                      checked={selectedReportType === type.value}
                      onChange={(e) => setSelectedReportType(e.target.value as ReportType)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {type.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-3">
                {exportFormats.map((format) => (
                  <button
                    key={format.value}
                    onClick={() => setSelectedFormat(format.value)}
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-all ${
                      selectedFormat === format.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {format.icon}
                    <span className="font-medium text-sm">{format.label}</span>
                    {selectedFormat === format.value && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {exportFormats.find((f) => f.value === selectedFormat)?.description}
              </p>
            </div>

            {/* Export Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    disabled={selectedFormat === 'CSV'}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Include charts and visualizations
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeRawData}
                    onChange={(e) => setIncludeRawData(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Include raw data tables
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              leftIcon={<Download className="h-4 w-4" />}
            >
              {isExporting ? 'Exporting...' : 'Export Report'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
