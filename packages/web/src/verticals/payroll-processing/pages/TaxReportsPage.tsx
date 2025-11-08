import React, { useState } from 'react';
import { Download, FileText, DollarSign, MapPin, Building, Calendar } from 'lucide-react';
import { Button, LoadingSpinner, ErrorMessage, Card } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { usePayrollSummary, usePayRuns } from '../hooks';
import { formatCurrency, formatDate } from '../utils';

export const TaxReportsPage: React.FC = () => {
  const { can } = usePermissions();
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q4-2025');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showMultiState, setShowMultiState] = useState(false);

  const { data: summary, isLoading: summaryLoading, error: summaryError } = usePayrollSummary();
  const { isLoading: runsLoading } = usePayRuns();

  // Generate quarters for current and past 2 years
  const quarters = [];
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 2; year--) {
    for (let q = 4; q >= 1; q--) {
      quarters.push(`Q${q}-${year}`);
    }
  }

  const handleDownloadReport = (reportTitle: string, format: 'pdf' | 'csv') => {
    // In a real implementation, this would trigger a report download
    console.log(`Downloading ${reportTitle} as ${format.toUpperCase()} for ${selectedQuarter}`);
  };

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
        message={(summaryError as Error).message || 'Failed to load tax reports'}
      />
    );
  }

  // Mock tax data - in real implementation, this would come from API
  const taxData = {
    federal: {
      withheld: summary?.ytdTotals.taxWithheld ?? 0,
      socialSecurity: (summary?.ytdTotals.taxWithheld ?? 0) * 0.45,
      medicare: (summary?.ytdTotals.taxWithheld ?? 0) * 0.15,
      federalIncome: (summary?.ytdTotals.taxWithheld ?? 0) * 0.40,
    },
    state: {
      california: (summary?.ytdTotals.taxWithheld ?? 0) * 0.12,
      newYork: (summary?.ytdTotals.taxWithheld ?? 0) * 0.08,
      texas: 0, // No state income tax
    },
    local: {
      total: (summary?.ytdTotals.taxWithheld ?? 0) * 0.02,
    },
  };

  const federalForms = [
    {
      form: '941',
      title: 'Employer\'s Quarterly Federal Tax Return',
      description: 'Report income taxes, Social Security, and Medicare taxes withheld',
      dueDate: '2025-01-31',
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      form: '940',
      title: 'Employer\'s Annual Federal Unemployment (FUTA) Tax Return',
      description: 'Annual report of federal unemployment tax',
      dueDate: '2025-01-31',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
    },
    {
      form: 'W-2',
      title: 'Wage and Tax Statement',
      description: 'Annual wage and tax statement for employees',
      dueDate: '2025-01-31',
      icon: FileText,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      form: 'W-3',
      title: 'Transmittal of Wage and Tax Statements',
      description: 'Summary transmittal of W-2 forms to SSA',
      dueDate: '2025-01-31',
      icon: Building,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  const stateForms = [
    {
      state: 'California',
      form: 'DE 9',
      title: 'Quarterly Contribution Return and Report of Wages',
      description: 'California quarterly wage and tax report',
      dueDate: '2025-01-31',
      icon: MapPin,
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      state: 'New York',
      form: 'NYS-45',
      title: 'Quarterly Combined Withholding, Wage Reporting',
      description: 'New York quarterly withholding report',
      dueDate: '2025-01-31',
      icon: MapPin,
      color: 'bg-pink-100 text-pink-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Reports & Calculations</h1>
          <p className="text-gray-600 mt-1">
            View tax liabilities and generate tax reports
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Report Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quarter
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
              >
                {quarters.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year (Annual Reports)
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                <option value={currentYear}>{currentYear}</option>
                <option value={currentYear - 1}>{currentYear - 1}</option>
                <option value={currentYear - 2}>{currentYear - 2}</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={showMultiState}
                  onChange={(e) => setShowMultiState(e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-700">
                  Show multi-state breakdown
                </span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Tax Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Federal Income Tax</p>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(taxData.federal.federalIncome)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Social Security</p>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(taxData.federal.socialSecurity)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Medicare</p>
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(taxData.federal.medicare)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Tax Withheld</p>
              <Building className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(taxData.federal.withheld)}
            </p>
          </div>
        </Card>
      </div>

      {/* Multi-State Breakdown */}
      {showMultiState && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">State Tax Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">California</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(taxData.state.california)}
                </p>
                <p className="text-sm text-gray-600 mt-1">State Income Tax</p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">New York</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(taxData.state.newYork)}
                </p>
                <p className="text-sm text-gray-600 mt-1">State Income Tax</p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Local Taxes</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(taxData.local.total)}
                </p>
                <p className="text-sm text-gray-600 mt-1">City/County Taxes</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Federal Tax Forms */}
      <div>
        <h2 className="text-xl font-bold mb-4">Federal Tax Forms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {federalForms.map((form, index) => {
            const Icon = form.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`inline-flex p-3 rounded-lg ${form.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Form {form.form}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                          Due: {formatDate(form.dueDate)}
                        </span>
                      </div>
                      <p className="font-medium text-gray-700 mb-1">{form.title}</p>
                      <p className="text-sm text-gray-600 mb-4">{form.description}</p>
                      {can('payroll:read') && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Download className="h-4 w-4" />}
                            onClick={() => handleDownloadReport(form.title, 'pdf')}
                          >
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Download className="h-4 w-4" />}
                            onClick={() => handleDownloadReport(form.title, 'csv')}
                          >
                            Data
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* State Tax Forms */}
      <div>
        <h2 className="text-xl font-bold mb-4">State Tax Forms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stateForms.map((form, index) => {
            const Icon = form.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`inline-flex p-3 rounded-lg ${form.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {form.state} - Form {form.form}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                          Due: {formatDate(form.dueDate)}
                        </span>
                      </div>
                      <p className="font-medium text-gray-700 mb-1">{form.title}</p>
                      <p className="text-sm text-gray-600 mb-4">{form.description}</p>
                      {can('payroll:read') && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Download className="h-4 w-4" />}
                            onClick={() => handleDownloadReport(form.title, 'pdf')}
                          >
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Download className="h-4 w-4" />}
                            onClick={() => handleDownloadReport(form.title, 'csv')}
                          >
                            Data
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Tax Payment Schedule */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Tax Payment Schedule</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Q4 2024 - Form 941</p>
                  <p className="text-sm text-gray-600">Federal quarterly tax return</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(taxData.federal.withheld)}
                </p>
                <p className="text-sm text-red-600">Due: January 31, 2025</p>
              </div>
            </div>

            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">2024 Annual - Form 940</p>
                  <p className="text-sm text-gray-600">Federal unemployment tax</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(taxData.federal.withheld * 0.1)}
                </p>
                <p className="text-sm text-red-600">Due: January 31, 2025</p>
              </div>
            </div>

            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">California DE 9</p>
                  <p className="text-sm text-gray-600">State quarterly contribution</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(taxData.state.california)}
                </p>
                <p className="text-sm text-red-600">Due: January 31, 2025</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
