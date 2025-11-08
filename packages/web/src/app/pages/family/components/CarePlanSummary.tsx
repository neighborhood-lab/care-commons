import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/core/components';
import { Badge } from '@/core/components';
import { ProgressBar } from '@/core/components';
import { api } from '@/services/api';

interface CarePlan {
  name: string;
  goals: string;
  status: string;
  start_date: string;
  completed_tasks: number;
  total_tasks: number;
  task_categories?: Array<{
    name: string;
    completed: number;
    total: number;
  }>;
}

export const CarePlanSummary: React.FC<{ clientId: string }> = ({ clientId }) => {
  const { data: carePlan } = useQuery<CarePlan>({
    queryKey: ['family', 'care-plan', clientId],
    queryFn: () => api.get(`/api/family/clients/${clientId}/care-plan`),
  });

  if (!carePlan) {
    return <p className="text-gray-500">No active care plan</p>;
  }

  const completionRate =
    (carePlan.completed_tasks / carePlan.total_tasks) * 100;

  return (
    <div className="space-y-6">
      {/* Care Plan Header */}
      <div>
        <h3 className="text-xl font-semibold">{carePlan.name}</h3>
        <p className="text-gray-600 mt-2">{carePlan.goals}</p>
        <div className="flex items-center space-x-4 mt-4">
          <Badge variant={carePlan.status === 'active' ? 'success' : 'default'}>
            {carePlan.status}
          </Badge>
          <span className="text-sm text-gray-500">
            Started: {new Date(carePlan.start_date).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-gray-500">
            {carePlan.completed_tasks} of {carePlan.total_tasks} tasks completed
          </span>
        </div>
        <ProgressBar value={completionRate} />
      </div>

      {/* Tasks by Category */}
      {carePlan.task_categories && carePlan.task_categories.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Tasks by Category</h4>
          <div className="space-y-2">
            {carePlan.task_categories.map((category) => (
              <div key={category.name} className="flex justify-between items-center">
                <span className="text-sm">{category.name}</span>
                <span className="text-sm text-gray-500">
                  {category.completed}/{category.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
