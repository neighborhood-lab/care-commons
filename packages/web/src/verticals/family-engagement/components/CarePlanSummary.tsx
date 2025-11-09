/**
 * Care Plan Summary Component
 *
 * Display care plan progress and goals for family members
 */

import React from 'react';
import { Card, Badge } from '@/core/components';
import { Target, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import type { CarePlanProgressReport, GoalProgressSummary } from '@care-commons/family-engagement';

interface CarePlanSummaryProps {
  report?: CarePlanProgressReport;
  loading?: boolean;
}

const statusConfig = {
  NOT_STARTED: {
    color: 'bg-gray-100 text-gray-800',
    icon: Clock,
    iconColor: 'text-gray-500',
  },
  IN_PROGRESS: {
    color: 'bg-blue-100 text-blue-800',
    icon: TrendingUp,
    iconColor: 'text-blue-500',
  },
  ON_TRACK: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  AT_RISK: {
    color: 'bg-orange-100 text-orange-800',
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
  },
  ACHIEVED: {
    color: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle,
    iconColor: 'text-emerald-500',
  },
};

const GoalCard: React.FC<{ goal: GoalProgressSummary }> = ({ goal }) => {
  const config = statusConfig[goal.currentStatus];
  const StatusIcon = config.icon;

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gray-100`}>
            <StatusIcon className="w-5 h-5 ${config.iconColor}" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{goal.goalName}</h4>
            <p className="text-xs text-gray-500">{goal.category}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.color}`}>
          {goal.currentStatus.replace('_', ' ')}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span className="font-medium">{Math.round(goal.progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              goal.currentStatus === 'ACHIEVED' ? 'bg-emerald-500' :
              goal.currentStatus === 'ON_TRACK' ? 'bg-green-500' :
              goal.currentStatus === 'AT_RISK' ? 'bg-orange-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${goal.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Recent updates */}
      {goal.recentUpdates && (
        <p className="text-sm text-gray-600 mb-2">{goal.recentUpdates}</p>
      )}

      {/* Target date */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Clock className="w-3 h-3" />
        <span>
          Target: {new Date(goal.targetDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
};

export const CarePlanSummary: React.FC<CarePlanSummaryProps> = ({ report, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 text-lg">No active care plan</p>
        <p className="text-gray-400 text-sm mt-2">
          Care plan information will appear here once available
        </p>
      </div>
    );
  }

  const achievementRate = report.goalsTotal > 0
    ? Math.round((report.goalsAchieved / report.goalsTotal) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overall Summary Card */}
      <Card padding="lg">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Care Plan Progress</h3>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(report.reportPeriodStart).toLocaleDateString()} -{' '}
                {new Date(report.reportPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <Badge className="bg-primary-100 text-primary-800">
              {report.reportType}
            </Badge>
          </div>

          {/* Overall Summary Text */}
          {report.overallSummary && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-700 leading-relaxed">{report.overallSummary}</p>
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{report.goalsTotal}</div>
              <div className="text-xs text-gray-600 mt-1">Total Goals</div>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-700">{report.goalsAchieved}</div>
              <div className="text-xs text-gray-600 mt-1">Achieved</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{report.goalsInProgress}</div>
              <div className="text-xs text-gray-600 mt-1">In Progress</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">{report.goalsAtRisk}</div>
              <div className="text-xs text-gray-600 mt-1">At Risk</div>
            </div>
          </div>

          {/* Achievement Rate */}
          <div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span className="font-medium">Overall Achievement Rate</span>
              <span className="font-bold text-gray-900">{achievementRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all"
                style={{ width: `${achievementRate}%` }}
              />
            </div>
          </div>

          {/* Concerns */}
          {report.concernsNoted && (
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
              <h4 className="text-sm font-semibold text-orange-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Areas of Concern
              </h4>
              <p className="text-sm text-gray-700">{report.concernsNoted}</p>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendationsForFamily && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Recommendations
              </h4>
              <p className="text-sm text-gray-700">{report.recommendationsForFamily}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Individual Goals */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.goalProgress?.map((goal) => (
            <GoalCard key={goal.goalId} goal={goal} />
          ))}
        </div>
      </div>

      {/* Prepared By */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t">
        Report prepared by {report.preparedByName}
        {report.publishedAt && (
          <> on {new Date(report.publishedAt).toLocaleDateString()}</>
        )}
      </div>
    </div>
  );
};
