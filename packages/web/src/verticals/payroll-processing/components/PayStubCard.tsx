import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye } from 'lucide-react';
import { Card, Button } from '@/core/components';
import { formatCurrency, formatDate } from '../utils';
import { useDownloadPayStubPdf } from '../hooks';
import type { PayStub } from '../types';

interface PayStubCardProps {
  payStub: PayStub;
  compact?: boolean;
}

export const PayStubCard: React.FC<PayStubCardProps> = ({ payStub, compact = false }) => {
  const downloadPdf = useDownloadPayStubPdf();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      CALCULATED: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      VOID: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{payStub.caregiverName}</h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(payStub.payPeriodStartDate)} - {formatDate(payStub.payPeriodEndDate)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Net Pay</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(payStub.currentNetPay)}
                </p>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payStub.status)}`}>
                {payStub.status}
              </span>
              <div className="flex gap-2">
                <Link to={`/payroll/stubs/${payStub.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadPdf.mutate(payStub.id)}
                  disabled={downloadPdf.isPending}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{payStub.caregiverName}</h3>
            <p className="text-sm text-gray-600 mt-1">#{payStub.stubNumber}</p>
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payStub.status)}`}>
            {payStub.status}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-gray-500">Pay Period</label>
            <p className="text-sm font-medium">
              {formatDate(payStub.payPeriodStartDate)} - {formatDate(payStub.payPeriodEndDate)}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500">Pay Date</label>
            <p className="text-sm font-medium">{formatDate(payStub.payDate)}</p>
          </div>

          <div className="pt-3 border-t">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Hours</span>
              <span className="font-medium">{payStub.totalHours.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Gross Pay</span>
              <span className="font-medium">{formatCurrency(payStub.currentGrossPay)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Deductions</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(payStub.totalTaxWithheld + payStub.totalOtherDeductions)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold text-gray-900">Net Pay</span>
              <span className="font-bold text-green-600">
                {formatCurrency(payStub.currentNetPay)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to={`/payroll/stubs/${payStub.id}`} className="flex-1">
            <Button variant="outline" className="w-full" leftIcon={<Eye className="h-4 w-4" />}>
              View Details
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => downloadPdf.mutate(payStub.id)}
            disabled={downloadPdf.isPending}
            leftIcon={<Download className="h-4 w-4" />}
          >
            PDF
          </Button>
        </div>
      </div>
    </Card>
  );
};
