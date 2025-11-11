/**
 * Match Analytics Dashboard
 * 
 * Analytics and reporting for shift matching performance:
 * - Match acceptance rate
 * - Average match score
 * - Override frequency
 * - Top-performing caregivers
 * - Trends over time
 */

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Award, AlertCircle, Users, Clock } from 'lucide-react';
import { LoadingSpinner } from '@/core/components';
import { useQuery } from '@tanstack/react-query';
import type { MatchingMetrics } from '../types';

export const MatchAnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Mock data - in production, this would come from API
  const { data: analytics, isLoading } = useQuery<MatchingMetrics>({
    queryKey: ['match-analytics', dateRange],
    queryFn: async () => {
      // This would call the actual API
      return {
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        periodEnd: new Date().toISOString(),
        totalOpenShifts: 487,
        shiftsMatched: 453,
        shiftsUnmatched: 34,
        matchRate: 93.0,
        averageMatchScore: 84.2,
        averageCandidatesPerShift: 5.3,
        averageResponseTimeMinutes: 24,
        proposalAcceptanceRate: 78.5,
        proposalRejectionRate: 15.2,
        proposalExpirationRate: 6.3,
        excellentMatches: 189,
        goodMatches: 201,
        fairMatches: 63,
        poorMatches: 0,
        topRejectionReasons: [
          { category: 'TOO_FAR', count: 23 },
          { category: 'TIME_CONFLICT', count: 18 },
          { category: 'PERSONAL_REASON', count: 12 },
        ],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500">
        No analytics data available
      </div>
    );
  }

  const getTrendIcon = (value: number, threshold: number) => {
    if (value >= threshold) return <TrendingUp className="h-4 w-4 text-green-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Match Analytics</h1>
          <p className="text-gray-600 mt-1">
            Performance metrics for shift matching algorithm
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('7d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === '7d'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateRange('30d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === '30d'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateRange('90d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === '90d'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Match Rate"
          value={`${analytics.matchRate.toFixed(1)}%`}
          subtitle={`${analytics.shiftsMatched} of ${analytics.totalOpenShifts} shifts`}
          trend={getTrendIcon(analytics.matchRate, 90)}
          trendLabel="+5% vs last period"
          icon={<Award className="h-6 w-6 text-green-600" />}
          color="green"
        />

        <MetricCard
          title="Avg Match Score"
          value={analytics.averageMatchScore.toFixed(1)}
          subtitle="Quality of matches"
          trend={getTrendIcon(analytics.averageMatchScore, 80)}
          trendLabel="+2 points"
          icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
          color="blue"
        />

        <MetricCard
          title="Acceptance Rate"
          value={`${analytics.proposalAcceptanceRate.toFixed(1)}%`}
          subtitle="Caregivers accepting proposals"
          trend={getTrendIcon(analytics.proposalAcceptanceRate, 75)}
          trendLabel="+8% vs last period"
          icon={<Users className="h-6 w-6 text-purple-600" />}
          color="purple"
        />

        <MetricCard
          title="Avg Response Time"
          value={`${analytics.averageResponseTimeMinutes} min`}
          subtitle="Time to respond to proposals"
          trend={<TrendingDown className="h-4 w-4 text-green-600" />}
          trendLabel="-5 min (faster)"
          icon={<Clock className="h-6 w-6 text-orange-600" />}
          color="orange"
        />
      </div>

      {/* Match Quality Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Quality Distribution</h3>
          <div className="space-y-4">
            <QualityBar
              label="Excellent (85-100)"
              count={analytics.excellentMatches}
              total={analytics.shiftsMatched}
              color="green"
            />
            <QualityBar
              label="Good (70-84)"
              count={analytics.goodMatches}
              total={analytics.shiftsMatched}
              color="blue"
            />
            <QualityBar
              label="Fair (50-69)"
              count={analytics.fairMatches}
              total={analytics.shiftsMatched}
              color="yellow"
            />
            <QualityBar
              label="Poor (0-49)"
              count={analytics.poorMatches}
              total={analytics.shiftsMatched}
              color="red"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposal Outcomes</h3>
          <div className="space-y-4">
            <OutcomeBar
              label="Accepted"
              percentage={analytics.proposalAcceptanceRate}
              color="green"
            />
            <OutcomeBar
              label="Rejected"
              percentage={analytics.proposalRejectionRate}
              color="red"
            />
            <OutcomeBar
              label="Expired"
              percentage={analytics.proposalExpirationRate}
              color="gray"
            />
          </div>
        </div>
      </div>

      {/* Top Rejection Reasons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Rejection Reasons</h3>
        <div className="space-y-3">
          {analytics?.topRejectionReasons.map((reason, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {reason.category.replace(/_/g, ' ')}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${(reason.count / (analytics?.topRejectionReasons[0]?.count || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">
                  {reason.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InsightCard
          title="High Match Rate"
          description="Your matching algorithm is performing well with 93% of shifts being matched successfully."
          type="success"
        />
        <InsightCard
          title="Monitor Response Time"
          description="Average response time of 24 minutes is within acceptable range. Consider reducing proposal expiration time."
          type="info"
        />
        <InsightCard
          title="Distance Issues"
          description="'Too far' is the top rejection reason. Consider tightening proximity requirements or expanding caregiver network."
          type="warning"
        />
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend: React.ReactNode;
  trendLabel: string;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'purple' | 'orange';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  color,
}) => {
  const colorClasses = {
    green: 'bg-green-100',
    blue: 'bg-blue-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm">
        {trend}
        <span className="text-gray-600">{trendLabel}</span>
      </div>
    </div>
  );
};

interface QualityBarProps {
  label: string;
  count: number;
  total: number;
  color: 'green' | 'blue' | 'yellow' | 'red';
}

const QualityBar: React.FC<QualityBarProps> = ({ label, count, total, color }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{count} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface OutcomeBarProps {
  label: string;
  percentage: number;
  color: 'green' | 'red' | 'gray';
}

const OutcomeBar: React.FC<OutcomeBarProps> = ({ label, percentage, color }) => {
  const colorClasses = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    gray: 'bg-gray-400',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface InsightCardProps {
  title: string;
  description: string;
  type: 'success' | 'info' | 'warning';
}

const InsightCard: React.FC<InsightCardProps> = ({ title, description, type }) => {
  const colors = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      icon: 'text-green-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      icon: 'text-blue-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      icon: 'text-yellow-600',
    },
  };

  const style = colors[type];

  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`h-5 w-5 ${style.icon} flex-shrink-0 mt-0.5`} />
        <div>
          <h4 className={`text-sm font-semibold ${style.text} mb-1`}>{title}</h4>
          <p className={`text-sm ${style.text}`}>{description}</p>
        </div>
      </div>
    </div>
  );
};
