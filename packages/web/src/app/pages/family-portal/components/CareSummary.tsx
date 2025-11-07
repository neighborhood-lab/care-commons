import React from 'react';
import { Card } from '@/core/components';
import { Calendar, CheckCircle, Target, TrendingUp } from 'lucide-react';

interface CareSummaryProps {
  upcomingVisitsCount: number;
  recentActivitiesCount: number;
  activeCarePlan?: {
    id: string;
    name: string;
    goalsTotal: number;
    goalsAchieved: number;
  };
}

export const CareSummary: React.FC<CareSummaryProps> = ({
  upcomingVisitsCount,
  recentActivitiesCount,
  activeCarePlan,
}) => {
  const progressPercentage = activeCarePlan
    ? Math.round((activeCarePlan.goalsAchieved / activeCarePlan.goalsTotal) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Upcoming Visits</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{upcomingVisitsCount}</p>
            <p className="mt-1 text-sm text-gray-600">Next 7 days</p>
          </div>
          <div className="flex-shrink-0">
            <Calendar className="h-12 w-12 text-blue-500" />
          </div>
        </div>
      </Card>

      <Card padding="md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Recent Activities</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{recentActivitiesCount}</p>
            <p className="mt-1 text-sm text-gray-600">Last 7 days</p>
          </div>
          <div className="flex-shrink-0">
            <TrendingUp className="h-12 w-12 text-green-500" />
          </div>
        </div>
      </Card>

      {activeCarePlan ? (
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Care Plan Progress</p>
              <p className="mt-2 text-xl font-bold text-gray-900">{activeCarePlan.name}</p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Goals Achieved</span>
                  <span className="font-semibold text-gray-900">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {activeCarePlan.goalsAchieved} of {activeCarePlan.goalsTotal} goals
                </p>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Care Plan</p>
              <p className="mt-2 text-base text-gray-500">No active care plan</p>
            </div>
            <div className="flex-shrink-0">
              <Target className="h-12 w-12 text-gray-300" />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
