import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProgressBar } from '@/core/components';
import { api } from '@/services/api';

interface CarePlanTask {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'pending' | 'in_progress' | 'completed';
  frequency: string;
}

interface CarePlanDetail {
  id: string;
  name: string;
  goals: string;
  status: string;
  start_date: string;
  end_date?: string;
  tasks: CarePlanTask[];
}

export const CarePlanDetails: React.FC<{ clientId: string }> = ({ clientId }) => {
  const { data: carePlan, isLoading } = useQuery<CarePlanDetail>({
    queryKey: ['family', 'care-plan-details', clientId],
    queryFn: () => api.get(`/api/family/clients/${clientId}/care-plan/details`),
  });

  if (isLoading) {
    return <div className="text-gray-500">Loading care plan...</div>;
  }

  if (!carePlan) {
    return <div className="text-gray-500">No active care plan</div>;
  }

  const completedTasks = carePlan.tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = (completedTasks / carePlan.tasks.length) * 100;

  return (
    <div className="space-y-6">
      {/* Care Plan Header */}
      <div>
        <h3 className="text-xl font-semibold">{carePlan.name}</h3>
        <p className="text-gray-600 mt-2">{carePlan.goals}</p>
        <div className="mt-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-gray-500">
              {completedTasks} of {carePlan.tasks.length} tasks
            </span>
          </div>
          <ProgressBar value={progressPercent} variant="success" />
        </div>
      </div>

      {/* Tasks List */}
      <div>
        <h4 className="text-lg font-semibold mb-4">Care Tasks</h4>
        <div className="space-y-3">
          {carePlan.tasks.map((task) => (
            <div
              key={task.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{task.name}</h5>
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded">
                      {task.category}
                    </span>
                    <span>{task.frequency}</span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    task.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : task.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
