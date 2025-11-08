/**
 * Metric Card Component
 * Reusable card for displaying a single metric with trend
 */

import React from 'react';
import { Card, CardContent } from '@/core/components/index.js';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  isLoading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = 'blue',
  isLoading = false,
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.value > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : trend.value < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : null}
                <span
                  className={`text-sm font-medium ${
                    trend.value > 0
                      ? 'text-green-600'
                      : trend.value < 0
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {trend.value > 0 && '+'}
                  {trend.value.toFixed(1)}%
                </span>
                {trend.label && (
                  <span className="text-sm text-gray-500 ml-1">
                    {trend.label}
                  </span>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
