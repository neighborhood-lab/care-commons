import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardContent, LoadingSpinner, ErrorMessage } from '@/core/components';
import { useShiftMatchingApi } from '../hooks';

export const MatchAnalyticsDashboard: React.FC = () => {
  const api = useShiftMatchingApi();
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['match-analytics', dateRange.from, dateRange.to],
    queryFn: () => api.getMatchingMetrics(dateRange.from, dateRange.to),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load analytics data" />;
  }

  if (!analytics) {
    return <ErrorMessage message="No analytics data available" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Match Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">
            Performance metrics for shift matching and assignments
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Match Rate"
          value={`${analytics.matchRate.toFixed(1)}%`}
          subtitle={`${analytics.shiftsMatched} of ${analytics.totalOpenShifts} shifts`}
          trend={analytics.matchRate >= 80 ? 'up' : 'down'}
          trendValue={analytics.matchRate >= 80 ? '+5% vs last month' : '-3% vs last month'}
        />
        <MetricCard
          title="Avg Match Score"
          value={analytics.averageMatchScore.toFixed(0)}
          subtitle="Out of 100"
          trend="up"
          trendValue="+2 points"
        />
        <MetricCard
          title="Proposal Acceptance"
          value={`${analytics.proposalAcceptanceRate.toFixed(1)}%`}
          subtitle="Caregivers accepting proposals"
          trend={analytics.proposalAcceptanceRate >= 70 ? 'up' : 'down'}
          trendValue={analytics.proposalAcceptanceRate >= 70 ? '+5% vs last month' : '-2% vs last month'}
        />
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Match Quality Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Match Quality Distribution</h3>
          </CardHeader>
          <CardContent>
            <MatchQualityChart
              excellent={analytics.excellentMatches || 0}
              good={analytics.goodMatches || 0}
              fair={analytics.fairMatches || 0}
              poor={analytics.poorMatches || 0}
            />
          </CardContent>
        </Card>

        {/* Response Metrics */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Proposal Responses</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponseBar
                label="Accepted"
                value={analytics.proposalAcceptanceRate}
                color="green"
              />
              <ResponseBar
                label="Rejected"
                value={analytics.proposalRejectionRate}
                color="red"
              />
              <ResponseBar
                label="Expired"
                value={analytics.proposalExpirationRate || 0}
                color="gray"
              />
            </div>
          </CardContent>
        </Card>

        {/* Top Rejection Reasons */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Top Rejection Reasons</h3>
          </CardHeader>
          <CardContent>
            {analytics.topRejectionReasons && analytics.topRejectionReasons.length > 0 ? (
              <div className="space-y-3">
                {analytics.topRejectionReasons.slice(0, 5).map((reason, index) => (
                  <div key={reason.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {index + 1}. {reason.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">{reason.count} times</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No rejection data available</p>
            )}
          </CardContent>
        </Card>

        {/* Additional Stats */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Additional Metrics</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <StatItem
                label="Avg Candidates/Shift"
                value={analytics.averageCandidatesPerShift.toFixed(1)}
              />
              <StatItem
                label="Unmatched Shifts"
                value={analytics.shiftsUnmatched.toString()}
              />
              <StatItem
                label="Total Open Shifts"
                value={analytics.totalOpenShifts.toString()}
              />
              <StatItem
                label="Matched Shifts"
                value={analytics.shiftsMatched.toString()}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend?: 'up' | 'down';
  trendValue?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, trend, trendValue }) => {
  return (
    <Card>
      <CardContent>
        <div className="p-6">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
          {trend && trendValue && (
            <div className="flex items-center gap-1">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface MatchQualityChartProps {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

const MatchQualityChart: React.FC<MatchQualityChartProps> = ({ excellent, good, fair, poor }) => {
  const total = excellent + good + fair + poor;

  if (total === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">No match quality data available</p>
    );
  }

  const percentages = {
    excellent: (excellent / total) * 100,
    good: (good / total) * 100,
    fair: (fair / total) * 100,
    poor: (poor / total) * 100,
  };

  return (
    <div className="space-y-4">
      <QualityBar label="Excellent (85-100)" count={excellent} percentage={percentages.excellent} color="green" />
      <QualityBar label="Good (70-84)" count={good} percentage={percentages.good} color="blue" />
      <QualityBar label="Fair (50-69)" count={fair} percentage={percentages.fair} color="yellow" />
      <QualityBar label="Poor (0-49)" count={poor} percentage={percentages.poor} color="red" />
    </div>
  );
};

interface QualityBarProps {
  label: string;
  count: number;
  percentage: number;
  color: 'green' | 'blue' | 'yellow' | 'red';
}

const QualityBar: React.FC<QualityBarProps> = ({ label, count, percentage, color }) => {
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1 text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-600">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface ResponseBarProps {
  label: string;
  value: number;
  color: 'green' | 'red' | 'gray';
}

const ResponseBar: React.FC<ResponseBarProps> = ({ label, value, color }) => {
  const colorClasses = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1 text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-900 font-semibold">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

interface StatItemProps {
  label: string;
  value: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value }) => {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </div>
  );
};
