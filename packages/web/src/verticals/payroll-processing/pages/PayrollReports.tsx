import React, { useState } from 'react';
import { Download, FileText, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { Button, LoadingSpinner, ErrorMessage, Card } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { usePayrollSummary, usePayRuns } from '../hooks';
import { formatCurrency, formatDate } from '../utils';

export const PayrollReports: React.FC = () => {
  const { can } = usePermissions();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-quarter');

  const { data: summary, isLoading: summaryLoading, error: summaryError } = usePayrollSummary();
  const { data: payRunData, isLoading: runsLoading } = usePayRuns();

  if (summaryLoading || runsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (summaryError) {
    return (
      <ErrorMessage
        message={(summaryError as Error).message || 'Failed to load payroll reports'}
      />
    );
  }

  const reports = [
    {
      title: 'Payroll Summary Report',
      description: 'Comprehensive payroll summary for the selected period',
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Tax Liability Report',
      description: 'Federal, state, and local tax liabilities',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Deduction Summary',
      description: 'Summary of all deductions by category',
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Garnishment Tracking',
      description: 'Track all garnishment orders and payments',
      icon: Calendar,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      title: '401k Contribution Report',
      description: 'Employee and employer 401k contributions',
      icon: TrendingUp,
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      title: 'W-2 Preview',
      description: 'Preview year-end W-2 forms (year-end only)',
      icon: FileText,
      color: 'bg-red-100 text-red-600',
    },
  ];

  const handleDownloadReport = (reportTitle: string) => {
    // In a real implementation, this would trigger a report download
    console.log('Downloading report:', reportTitle, 'for period:', selectedPeriod);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Reports</h1>
          <p className="text-gray-600 mt-1">
            Generate and download payroll reports
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Report Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="current-quarter">Current Quarter</option>
                <option value="last-quarter">Last Quarter</option>
                <option value="ytd">Year to Date</option>
                <option value="last-year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            {selectedPeriod === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Payroll</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(summary.totalGrossPay || 0)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tax Withheld</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(summary.totalTaxWithheld || 0)}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Caregivers Paid</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {summary.totalCaregivers || 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(summary.totalHours || 0).toFixed(0)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Available Reports */}
      <div>
        <h2 className="text-xl font-bold mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, index) => {
            const Icon = report.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className={`inline-flex p-3 rounded-lg ${report.color} mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {report.description}
                  </p>
                  {can('payroll:read') && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Download className="h-4 w-4" />}
                        onClick={() => handleDownloadReport(report.title)}
                        className="flex-1"
                      >
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Download className="h-4 w-4" />}
                        onClick={() => handleDownloadReport(report.title)}
                        className="flex-1"
                      >
                        CSV
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Pay Runs */}
      {payRunData && payRunData.items.length > 0 && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Pay Runs</h2>
            <div className="space-y-3">
              {payRunData.items.slice(0, 5).map((payRun) => (
                <div
                  key={payRun.id}
                  className="flex justify-between items-center border-b pb-3 last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{payRun.runNumber}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(payRun.payPeriodStartDate)} - {formatDate(payRun.payPeriodEndDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(payRun.totalGrossPay)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {payRun.totalCaregivers} caregivers
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
