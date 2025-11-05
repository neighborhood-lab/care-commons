import React, { useState } from 'react';
import { MobileLayout } from '../../components/MobileLayout';
import {
  FileText,
  Target,
  TrendingUp,
  Calendar,
  User,
  ChevronRight,
  CheckCircle,
  Circle,
  AlertCircle,
} from 'lucide-react';

interface CarePlan {
  id: string;
  clientName: string;
  planType: string;
  status: 'active' | 'pending-review' | 'completed';
  startDate: string;
  reviewDate: string;
  goals: Goal[];
  completionRate: number;
}

interface Goal {
  id: string;
  title: string;
  progress: number;
  status: 'in-progress' | 'completed' | 'not-started';
  targetDate: string;
}

export const MobileCarePlansPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'review'>('active');

  const carePlans: CarePlan[] = [
    {
      id: '1',
      clientName: 'Dorothy Chen',
      planType: 'Personal Care',
      status: 'active',
      startDate: 'Oct 1, 2024',
      reviewDate: 'Dec 1, 2024',
      completionRate: 75,
      goals: [
        {
          id: 'g1',
          title: 'Improve mobility and independence',
          progress: 80,
          status: 'in-progress',
          targetDate: 'Nov 30, 2024',
        },
        {
          id: 'g2',
          title: 'Maintain medication schedule',
          progress: 100,
          status: 'completed',
          targetDate: 'Nov 15, 2024',
        },
        {
          id: 'g3',
          title: 'Increase social interaction',
          progress: 45,
          status: 'in-progress',
          targetDate: 'Dec 15, 2024',
        },
      ],
    },
    {
      id: '2',
      clientName: 'Robert Martinez',
      planType: 'Companionship',
      status: 'active',
      startDate: 'Sep 15, 2024',
      reviewDate: 'Nov 15, 2024',
      completionRate: 60,
      goals: [
        {
          id: 'g4',
          title: 'Engage in daily activities',
          progress: 70,
          status: 'in-progress',
          targetDate: 'Nov 20, 2024',
        },
        {
          id: 'g5',
          title: 'Improve cognitive function',
          progress: 50,
          status: 'in-progress',
          targetDate: 'Dec 1, 2024',
        },
      ],
    },
    {
      id: '3',
      clientName: 'Margaret Thompson',
      planType: 'Personal Care',
      status: 'pending-review',
      startDate: 'Aug 1, 2024',
      reviewDate: 'Nov 1, 2024',
      completionRate: 85,
      goals: [
        {
          id: 'g6',
          title: 'Pain management',
          progress: 90,
          status: 'in-progress',
          targetDate: 'Nov 10, 2024',
        },
        {
          id: 'g7',
          title: 'Nutritional goals',
          progress: 80,
          status: 'in-progress',
          targetDate: 'Nov 25, 2024',
        },
      ],
    },
  ];

  const getStatusBadge = (status: CarePlan['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
            Active
          </span>
        );
      case 'pending-review':
        return (
          <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded">
            <AlertCircle className="h-3 w-3" />
            Review Due
          </span>
        );
      case 'completed':
        return (
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
            Completed
          </span>
        );
    }
  };

  const getGoalIcon = (status: Goal['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Circle className="h-5 w-5 text-blue-600" />;
      case 'not-started':
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const filteredPlans = carePlans.filter((plan) => {
    if (selectedFilter === 'active') return plan.status === 'active';
    if (selectedFilter === 'review') return plan.status === 'pending-review';
    return true;
  });

  return (
    <MobileLayout title="Care Plans">
      <div className="p-4 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
          {[
            { key: 'active', label: 'Active' },
            { key: 'review', label: 'Review' },
            { key: 'all', label: 'All' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedFilter(tab.key as typeof selectedFilter)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Care Plans List */}
        <div className="space-y-4">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Plan Header */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{plan.clientName}</h3>
                    <p className="text-sm text-gray-600">{plan.planType}</p>
                  </div>
                  {getStatusBadge(plan.status)}
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-semibold text-purple-600">
                      {plan.completionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${plan.completionRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Started: {plan.startDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Review: {plan.reviewDate}</span>
                  </div>
                </div>
              </div>

              {/* Goals Section */}
              <div className="bg-gray-50 p-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-purple-600" />
                  <h4 className="font-semibold text-gray-900 text-sm">
                    Goals ({plan.goals.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {plan.goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="bg-white rounded-lg p-3 border border-gray-100"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {getGoalIcon(goal.status)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {goal.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Target: {goal.targetDate}
                          </p>
                        </div>
                      </div>
                      {goal.status !== 'completed' && (
                        <div className="ml-7">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-semibold text-blue-600">
                              {goal.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${goal.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                <button className="w-full flex items-center justify-between text-purple-600 font-medium hover:text-purple-700 transition-colors">
                  <span className="text-sm">View Full Care Plan</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}

          {filteredPlans.length === 0 && (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No care plans found</p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};
