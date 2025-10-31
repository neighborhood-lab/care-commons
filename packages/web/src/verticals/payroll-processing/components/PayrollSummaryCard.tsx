import React from 'react';
import { DollarSign, Users, Calendar, CheckCircle } from 'lucide-react';
import type { PayrollSummary } from '../types';
import { formatCurrency } from '../utils';

interface PayrollSummaryCardProps {
  summary: PayrollSummary;
}

export const PayrollSummaryCard: React.FC<PayrollSummaryCardProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Employees</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {summary.totalEmployees}
            </p>
          </div>
          <Users className="h-8 w-8 text-blue-500" />
        </div>
        {summary.upcomingPayDate && (
          <p className="text-xs text-gray-500 mt-2">
            Next pay: {new Date(summary.upcomingPayDate).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Pending Approvals</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {summary.pendingApprovals}
            </p>
          </div>
          <Calendar className="h-8 w-8 text-orange-500" />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Require attention
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">YTD Gross Pay</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(summary.ytdTotals.grossPay)}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-green-500" />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Year to date
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Recent Pay Runs</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {summary.recentPayRuns.completed}
            </p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          of {summary.recentPayRuns.total} completed
        </p>
      </div>
    </div>
  );
};
