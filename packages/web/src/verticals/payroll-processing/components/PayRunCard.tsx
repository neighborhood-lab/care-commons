import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, DollarSign, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { PayRun } from '../types';
import { formatCurrency, formatHours, getPayRunStatusColor } from '../utils';

interface PayRunCardProps {
  payRun: PayRun;
  compact?: boolean;
}

export const PayRunCard: React.FC<PayRunCardProps> = ({ payRun, compact = false }) => {
  const statusColor = getPayRunStatusColor(payRun.status);

  return (
    <Link
      to={`/payroll/runs/${payRun.id}`}
      className={`block bg-white rounded-lg shadow hover:shadow-md transition-shadow ${compact ? 'p-3' : 'p-6'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="font-semibold text-gray-900">
              {payRun.runNumber}
            </span>
            {payRun.hasErrors && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
          <p className="text-sm text-gray-600">
            {new Date(payRun.payPeriodStartDate).toLocaleDateString()} - {new Date(payRun.payPeriodEndDate).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {payRun.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Pay Date:
          </span>
          <span className="font-medium">{new Date(payRun.payDate).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Employees:
          </span>
          <span className="font-medium">{payRun.totalCaregivers}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Hours:</span>
          <span className="font-medium">{formatHours(payRun.totalHours)}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Gross Pay:</span>
          <span className="font-semibold">{formatCurrency(payRun.totalGrossPay)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax Withheld:</span>
          <span className="text-red-600">-{formatCurrency(payRun.totalTaxWithheld)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Deductions:</span>
          <span className="text-red-600">-{formatCurrency(payRun.totalDeductions)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="flex items-center gap-1 font-medium">
            <DollarSign className="h-4 w-4" />
            Net Pay:
          </span>
          <span className="font-bold text-lg text-green-600">{formatCurrency(payRun.totalNetPay)}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {payRun.calculatedAt ? `Calculated ${formatDistanceToNow(new Date(payRun.calculatedAt), { addSuffix: true })}` : 'Not calculated'}
        </span>
        <div className="text-xs text-gray-500">
          <span className="mr-2">DD: {payRun.directDepositCount}</span>
          <span>Check: {payRun.checkCount}</span>
        </div>
      </div>
    </Link>
  );
};
