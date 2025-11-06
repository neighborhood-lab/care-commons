import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Send } from 'lucide-react';
import { Button, LoadingSpinner, ErrorMessage, Card } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { usePayStub, useDownloadPayStubPdf } from '../hooks';
import { formatCurrency, formatDate } from '../utils';
import { TaxSummary, DeductionsList } from '../components';

export const PayStubDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const { data: payStub, isLoading, error } = usePayStub(id);
  const downloadPdf = useDownloadPayStubPdf();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !payStub) {
    return (
      <ErrorMessage
        message="Failed to load pay stub"
        retry={() => navigate('/payroll/stubs')}
      />
    );
  }

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/payroll/stubs')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pay Stub #{payStub.stubNumber}
            </h1>
            <p className="text-gray-600 mt-1">{payStub.caregiverName}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => downloadPdf.mutate(payStub.id)}
            leftIcon={<Download className="h-4 w-4" />}
            disabled={downloadPdf.isPending}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Pay Period Info */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="text-sm text-gray-600">Pay Period</label>
              <p className="text-lg font-semibold">
                {formatDate(payStub.payPeriodStartDate)} - {formatDate(payStub.payPeriodEndDate)}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Pay Date</label>
              <p className="text-lg font-semibold">{formatDate(payStub.payDate)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Payment Method</label>
              <p className="text-lg font-semibold">{payStub.paymentMethod.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Status</label>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payStub.status)}`}>
                {payStub.status}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Earnings Summary */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Earnings</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="text-gray-700">Regular Hours</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({payStub.regularHours.toFixed(2)} hrs)
                </span>
              </div>
              <span className="font-semibold">{formatCurrency(payStub.regularPay)}</span>
            </div>

            {payStub.overtimeHours > 0 && (
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <span className="text-gray-700">Overtime Hours</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({payStub.overtimeHours.toFixed(2)} hrs)
                  </span>
                </div>
                <span className="font-semibold">{formatCurrency(payStub.overtimePay)}</span>
              </div>
            )}

            {payStub.doubleTimeHours > 0 && (
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <span className="text-gray-700">Double Time Hours</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({payStub.doubleTimeHours.toFixed(2)} hrs)
                  </span>
                </div>
                <span className="font-semibold">{formatCurrency(payStub.doubleTimePay)}</span>
              </div>
            )}

            {payStub.bonuses > 0 && (
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-700">Bonuses</span>
                <span className="font-semibold">{formatCurrency(payStub.bonuses)}</span>
              </div>
            )}

            {payStub.reimbursements > 0 && (
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-700">Reimbursements</span>
                <span className="font-semibold">{formatCurrency(payStub.reimbursements)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300">
              <span className="text-lg font-bold">Gross Pay</span>
              <span className="text-lg font-bold">{formatCurrency(payStub.currentGrossPay)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tax Withholdings */}
      <TaxSummary payStub={payStub} />

      {/* Other Deductions */}
      {payStub.deductions && payStub.deductions.length > 0 && (
        <DeductionsList deductions={payStub.deductions} />
      )}

      {/* Net Pay */}
      <Card>
        <div className="p-6 bg-green-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Net Pay</h2>
              <p className="text-sm text-gray-600 mt-1">Take-home pay after all deductions</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(payStub.currentNetPay)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                YTD: {formatCurrency(payStub.yearToDateNetPay)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Year-to-Date Summary */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Year-to-Date Totals</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-600">Hours</label>
              <p className="text-lg font-semibold">{payStub.ytdHours.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Gross Pay</label>
              <p className="text-lg font-semibold">{formatCurrency(payStub.ytdGrossPay)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Total Tax</label>
              <p className="text-lg font-semibold">
                {formatCurrency(payStub.ytdFederalTax + payStub.ytdStateTax + payStub.ytdSocialSecurity + payStub.ytdMedicare)}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Net Pay</label>
              <p className="text-lg font-semibold">{formatCurrency(payStub.ytdNetPay)}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
