import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShowcaseLayout } from '../components/ShowcaseLayout';
import { useCarePlanProvider } from '@/core/providers/context';
import { Plus, Search, Target, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Goal } from '../types/showcase-types.js';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800';
    case 'PENDING_APPROVAL':
      return 'bg-yellow-100 text-yellow-800';
    case 'ON_HOLD':
      return 'bg-orange-100 text-orange-800';
    case 'EXPIRED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return 'text-red-600';
    case 'HIGH':
      return 'text-orange-600';
    case 'MEDIUM':
      return 'text-yellow-600';
    case 'LOW':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
};

const getComplianceColor = (status: string) => {
  switch (status) {
    case 'COMPLIANT':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'PENDING_REVIEW':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'EXPIRED':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'NON_COMPLIANT':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export const CarePlansPage: React.FC = () => {
  const carePlanProvider = useCarePlanProvider();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['care-plans', { query: searchQuery }],
    queryFn: () => carePlanProvider.getCarePlans({ query: searchQuery }),
  });

  return (
    <ShowcaseLayout
      title="Care Plans"
      description="Personalized care plans with goals, assessments, and compliance tracking"
    >
      {/* Search and Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search care plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Create Care Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Total Plans</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{data?.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Active</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">
            {data?.items.filter(cp => cp.status === 'ACTIVE').length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Compliant</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">
            {data?.items.filter(cp => cp.complianceStatus === 'COMPLIANT').length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Needs Review</p>
          <p className="mt-1 text-2xl font-semibold text-yellow-600">
            {data?.items.filter(cp => cp.complianceStatus === 'PENDING_REVIEW').length || 0}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading care plans...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">Failed to load care plans. Please try again.</p>
        </div>
      )}

      {/* Empty State */}
      {data && data.items.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No care plans found</p>
        </div>
      )}

      {/* Care Plans List */}
      {data && data.items.length > 0 && (
        <div className="space-y-4">
          {data.items.map((carePlan) => (
            <div
              key={carePlan.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{carePlan.name}</h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                        carePlan.status
                      )}`}
                    >
                      {carePlan.status.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-sm font-medium ${getPriorityColor(carePlan.priority)}`}>
                      {carePlan.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{carePlan.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(carePlan.startDate), 'MMM d, yyyy')} -{' '}
                      {format(new Date(carePlan.endDate), 'MMM d, yyyy')}
                    </span>
                    <span>•</span>
                    <span>{carePlan.planType.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <div className={`rounded-md border px-3 py-1.5 ${getComplianceColor(carePlan.complianceStatus)}`}>
                  <p className="text-xs font-medium">
                    {carePlan.complianceStatus.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              {/* Goals */}
              {carePlan.goals && carePlan.goals.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-gray-400" />
                    <h4 className="text-sm font-medium text-gray-700">
                      Goals ({carePlan.goals.length})
                    </h4>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {carePlan.goals.map((goal: Goal) => (
                      <div
                        key={goal.id}
                        className="rounded-md border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900">{goal.description}</p>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {goal.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{goal.category.replace(/_/g, ' ')}</span>
                          <span
                            className={`font-medium ${
                              goal.status === 'ACHIEVED'
                                ? 'text-green-600'
                                : goal.status === 'ON_TRACK'
                                ? 'text-blue-600'
                                : goal.status === 'AT_RISK'
                                ? 'text-orange-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {goal.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {goal.notes && (
                          <p className="mt-2 text-xs text-gray-600 italic">{goal.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Dates */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Last Review: {format(new Date(carePlan.lastReviewDate), 'MMM d, yyyy')}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Next Review: {format(new Date(carePlan.nextReviewDate), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ShowcaseLayout>
  );
};
