import React from 'react';
import { DollarSign, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import type { BillingSummary } from '../types';
import { formatCurrency } from '../utils';

interface BillingSummaryCardProps {
  summary: BillingSummary;
}

export const BillingSummaryCard: React.FC<BillingSummaryCardProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Invoiced</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(summary.totalInvoiced)}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-blue-500" />
        </div>
        <p className="text-xs text-gray-500 mt-2">{summary.invoiceCount.total} total invoices</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(summary.totalPaid)}
            </p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <p className="text-xs text-gray-500 mt-2">{summary.invoiceCount.paid} paid invoices</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Outstanding</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {formatCurrency(summary.totalOutstanding)}
            </p>
          </div>
          <FileText className="h-8 w-8 text-yellow-500" />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {summary.invoiceCount.sent + summary.invoiceCount.pending} unpaid
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Overdue</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {formatCurrency(summary.overdueAmount)}
            </p>
          </div>
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {summary.invoiceCount.overdue} overdue invoices
        </p>
      </div>
    </div>
  );
};
