import React from 'react';
import { Target, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardContent, StatusBadge } from '@/core/components';
import { formatDate } from '@/core/utils';
import type { CarePlanGoal } from '../types';

export interface GoalSectionProps {
  goals: CarePlanGoal[];
  onGoalClick?: (goal: CarePlanGoal) => void;
}

export const GoalSection: React.FC<GoalSectionProps> = ({ goals, onGoalClick }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600';
      case 'HIGH':
        return 'text-orange-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader title="Goals" />
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No goals defined yet</p>
            <p className="text-sm text-gray-400 mt-1">Add goals to track care progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={`Goals (${goals.length})`} />
      <CardContent>
        <div className="space-y-4">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                onGoalClick ? 'hover:border-blue-300' : ''
              }`}
              onClick={() => onGoalClick?.(goal)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{goal.name}</h4>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityColor(goal.priority)}`}
                    >
                      {goal.priority}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{goal.description}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {goal.category.replace(/_/g, ' ')}
                    </span>

                    {goal.targetDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Target: {formatDate(goal.targetDate)}
                      </span>
                    )}

                    {goal.progressPercentage !== undefined && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {goal.progressPercentage}% Complete
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={goal.status} />

                  {goal.status === 'AT_RISK' && (
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      At Risk
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {goal.progressPercentage !== undefined && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        goal.status === 'ACHIEVED'
                          ? 'bg-green-500'
                          : goal.status === 'AT_RISK'
                            ? 'bg-orange-500'
                            : 'bg-blue-500'
                      }`}
                      style={{ width: `${goal.progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Achievement Date */}
              {goal.achievedDate && (
                <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
                  <Target className="h-4 w-4" />
                  Achieved on {formatDate(goal.achievedDate)}
                </div>
              )}

              {/* Last Assessment */}
              {goal.lastAssessedDate && (
                <div className="mt-2 text-xs text-gray-500">
                  Last assessed: {formatDate(goal.lastAssessedDate)}
                </div>
              )}

              {/* Notes */}
              {goal.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">{goal.notes}</p>
                </div>
              )}

              {/* Outcome */}
              {goal.outcome && (
                <div className="mt-3 p-3 bg-green-50 rounded-md">
                  <p className="text-sm font-medium text-green-800 mb-1">Outcome:</p>
                  <p className="text-sm text-green-700">{goal.outcome}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
