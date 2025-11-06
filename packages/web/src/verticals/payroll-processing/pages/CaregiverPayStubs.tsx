import React, { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import { LoadingSpinner, EmptyState, ErrorMessage, Card, Button } from '@/core/components';
import { useAuth } from '@/core/hooks';
import { usePayStubs, useDownloadPayStubPdf } from '../hooks';
import { formatCurrency, formatDate } from '../utils';
import { Link } from 'react-router-dom';

export const CaregiverPayStubs: React.FC = () => {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const { data: payStubData, isLoading, error, refetch } = usePayStubs({
    caregiverId: user?.id,
  });

  const downloadPdf = useDownloadPayStubPdf();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={(error as Error).message || 'Failed to load pay stubs'}
        retry={refetch}
      />
    );
  }

  const payStubs = payStubData?.items || [];

  // Calculate YTD totals
  const ytdTotals = payStubs.reduce(
    (acc, stub) => ({
      hours: acc.hours + stub.totalHours,
      grossPay: acc.grossPay + stub.currentGrossPay,
      netPay: acc.netPay + stub.currentNetPay,
      taxes: acc.taxes + stub.totalTaxWithheld,
    }),
    { hours: 0, grossPay: 0, netPay: 0, taxes: 0 }
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      CALCULATED: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      VOID: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Pay Stubs</h1>
          <p className="text-gray-600 mt-1">
            View and download your pay stubs
          </p>
        </div>
        <div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
            <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
          </select>
        </div>
      </div>

      {/* YTD Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">YTD Hours</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {ytdTotals.hours.toFixed(2)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">YTD Gross Pay</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(ytdTotals.grossPay)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">YTD Taxes</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {formatCurrency(ytdTotals.taxes)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">YTD Net Pay</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(ytdTotals.netPay)}
            </p>
          </div>
        </Card>
      </div>

      {/* Pay Stubs List */}
      {payStubs.length === 0 ? (
        <EmptyState
          title="No pay stubs available"
          description="Your pay stubs will appear here once payroll is processed."
        />
      ) : (
        <div className="space-y-4">
          {payStubs.map((payStub) => (
            <Card key={payStub.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Pay Period: {formatDate(payStub.payPeriodStartDate)} - {formatDate(payStub.payPeriodEndDate)}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payStub.status)}`}>
                        {payStub.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <label className="text-xs text-gray-500">Pay Date</label>
                        <p className="text-sm font-medium">{formatDate(payStub.payDate)}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Hours</label>
                        <p className="text-sm font-medium">{payStub.totalHours.toFixed(2)}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Gross Pay</label>
                        <p className="text-sm font-medium">{formatCurrency(payStub.currentGrossPay)}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Deductions</label>
                        <p className="text-sm font-medium text-red-600">
                          -{formatCurrency(payStub.totalTaxWithheld + payStub.totalOtherDeductions)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Net Pay</label>
                        <p className="text-sm font-medium text-green-600">
                          {formatCurrency(payStub.currentNetPay)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link to={`/caregiver/paystubs/${payStub.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye className="h-4 w-4" />}
                      >
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Download className="h-4 w-4" />}
                      onClick={() => downloadPdf.mutate(payStub.id)}
                      disabled={downloadPdf.isPending}
                    >
                      PDF
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tax Documents */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Tax Documents</h2>
          <p className="text-gray-600 mb-4">
            Your W-2 and other tax documents will be available here at year-end.
          </p>
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Download W-2 (Available in January)
          </Button>
        </div>
      </Card>
    </div>
  );
};
