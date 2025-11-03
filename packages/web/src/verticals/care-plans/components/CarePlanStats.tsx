import React, { useState } from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/core/components';
import type { CarePlan } from '../types';

export interface CarePlanStatsProps {
  carePlan: CarePlan;
}

export const CarePlanStats: React.FC<CarePlanStatsProps> = ({ carePlan }) => {
  const [now] = useState(() => Date.now());

  const isExpiringSoon =
    carePlan.expirationDate &&
    new Date(carePlan.expirationDate) <= new Date(now + 30 * 24 * 60 * 60 * 1000);

  const isOverdue = carePlan.reviewDate && new Date(carePlan.reviewDate) < new Date(now);

  // Calculate goal statistics
  const achievedGoalsCount = carePlan.goals.filter((goal) => goal.status === 'ACHIEVED').length;
  const inProgressGoalsCount = carePlan.goals.filter(
    (goal) => goal.status === 'IN_PROGRESS'
  ).length;
  const atRiskGoalsCount = carePlan.goals.filter((goal) => goal.status === 'AT_RISK').length;
  const notStartedGoalsCount = carePlan.goals.filter(
    (goal) => goal.status === 'NOT_STARTED'
  ).length;
  const averageGoalProgress =
    carePlan.goals.length > 0
      ? carePlan.goals.reduce((sum, goal) => sum + (goal.progressPercentage || 0), 0) /
        carePlan.goals.length
      : 0;

  // Calculate intervention statistics
  const activeInterventionsCount = carePlan.interventions.filter(
    (int) => int.status === 'ACTIVE'
  ).length;
  const suspendedInterventionsCount = carePlan.interventions.filter(
    (int) => int.status === 'SUSPENDED'
  ).length;

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-blue-600';
    if (progress >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'text-green-600';
      case 'PENDING_REVIEW':
        return 'text-yellow-600';
      case 'EXPIRED':
      case 'NON_COMPLIANT':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Goals Overview */}
      <Card>
        <CardHeader title="Goals" />
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-semibold">{carePlan.goals.length}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Achieved</span>
                <span className="text-sm font-medium text-green-600">{achievedGoalsCount}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-600">In Progress</span>
                <span className="text-sm font-medium text-blue-600">{inProgressGoalsCount}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-600">At Risk</span>
                <span className="text-sm font-medium text-orange-600">{atRiskGoalsCount}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Not Started</span>
                <span className="text-sm font-medium text-gray-600">{notStartedGoalsCount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardHeader title="Progress" />
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getProgressColor(averageGoalProgress)}`}>
                {Math.round(averageGoalProgress)}%
              </div>
              <p className="text-sm text-gray-600">Average Goal Progress</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="text-sm font-medium">
                  {carePlan.goals.length > 0
                    ? Math.round((achievedGoalsCount / carePlan.goals.length) * 100)
                    : 0}
                  %
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">On Track</span>
                <span className="text-sm font-medium text-blue-600">
                  {inProgressGoalsCount} goals
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interventions */}
      <Card>
        <CardHeader title="Interventions" />
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-semibold">{carePlan.interventions.length}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Active</span>
                <span className="text-sm font-medium text-green-600">
                  {activeInterventionsCount}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-600">Suspended</span>
                <span className="text-sm font-medium text-orange-600">
                  {suspendedInterventionsCount}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Task Templates</span>
                <span className="text-sm font-medium">{carePlan.taskTemplates.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status & Alerts */}
      <Card>
        <CardHeader title="Status & Alerts" />
        <CardContent>
          <div className="space-y-3">
            {/* Compliance Status */}
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm text-gray-600">Compliance:</span>
              <span
                className={`text-sm font-medium ${getComplianceColor(carePlan.complianceStatus)}`}
              >
                {carePlan.complianceStatus.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm text-gray-600">Priority:</span>
              <span
                className={`text-sm font-medium ${
                  carePlan.priority === 'URGENT'
                    ? 'text-red-600'
                    : carePlan.priority === 'HIGH'
                      ? 'text-orange-600'
                      : carePlan.priority === 'MEDIUM'
                        ? 'text-yellow-600'
                        : 'text-gray-600'
                }`}
              >
                {carePlan.priority}
              </span>
            </div>

            {/* Hours per Week */}
            {carePlan.estimatedHoursPerWeek && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm text-gray-600">Hours/Week:</span>
                <span className="text-sm font-medium">{carePlan.estimatedHoursPerWeek}</span>
              </div>
            )}

            {/* Alerts */}
            <div className="space-y-2 pt-2">
              {isExpiringSoon && (
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3" />
                  Expires Soon
                </div>
              )}

              {isOverdue && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  Review Overdue
                </div>
              )}

              {atRiskGoalsCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3" />
                  {atRiskGoalsCount} Goals At Risk
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
