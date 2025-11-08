/**
 * Financial Metrics Card Component
 * Displays financial KPIs including revenue, expenses, and profit margins
 */

import React from 'react';
import { Card } from '@/core/components/index.js';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, AlertCircle } from 'lucide-react';
import type { RevenueMetrics } from '@/types/analytics-types';

interface FinancialMetricsCardProps {
  metrics: RevenueMetrics;
  trends?: {
    revenue: number; // percentage change
    expenses: number;
    profit: number;
  };
  isLoading?: boolean;
}

export const FinancialMetricsCard: React.FC<FinancialMetricsCardProps> = ({
  metrics,
  trends,
  isLoading = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (value < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <Card>
        <Card.Header title="Financial Metrics" />
        <Card.Content>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </Card.Content>
      </Card>
    );
  }

  const profitMargin = metrics.billedAmount > 0
    ? ((metrics.paidAmount / metrics.billedAmount) * 100)
    : 0;

  return (
    <Card>
      <Card.Header
        title="Financial Metrics"
        action={<DollarSign className="h-5 w-5 text-gray-400" />}
      />
      <Card.Content>
        <div className="space-y-6">
          {/* Revenue */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Billed Amount</span>
              {trends && (
                <div className={`flex items-center gap-1 text-sm ${getTrendColor(trends.revenue)}`}>
                  {getTrendIcon(trends.revenue)}
                  <span>{formatPercentage(trends.revenue)}</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(metrics.billedAmount)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {metrics.billableHours.toLocaleString()} billable hours
            </div>
          </div>

          {/* Paid Amount */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Paid Amount</span>
              <CreditCard className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(metrics.paidAmount)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Avg rate: {formatCurrency(metrics.averageReimbursementRate)}/hr
            </div>
          </div>

          {/* Outstanding AR */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Outstanding A/R</span>
              {metrics.outstandingAR > metrics.billedAmount * 0.3 && (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(metrics.outstandingAR)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Collection rate: {profitMargin.toFixed(1)}%
            </div>
          </div>

          {/* Profit Margin Bar */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Payment Status</span>
              <span className="text-sm font-semibold text-gray-900">
                {profitMargin.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(profitMargin, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
};
