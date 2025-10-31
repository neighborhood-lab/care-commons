import React from 'react';
import { TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react';
import type { MatchingMetrics } from '../types';

interface MatchingMetricsCardProps {
  metrics: MatchingMetrics;
}

export const MatchingMetricsCard: React.FC<MatchingMetricsCardProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Open Shifts</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {metrics.totalOpenShifts}
            </p>
          </div>
          <Users className="h-8 w-8 text-blue-500" />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Needing assignment
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Match Rate</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {metrics.matchRate.toFixed(0)}%
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-500" />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {metrics.shiftsMatched} matched
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Acceptance Rate</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {metrics.proposalAcceptanceRate.toFixed(0)}%
            </p>
          </div>
          <CheckCircle className="h-8 w-8 text-blue-500" />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Proposals accepted
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Avg Match Score</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {metrics.averageMatchScore.toFixed(0)}
            </p>
          </div>
          <XCircle className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Out of 100
        </p>
      </div>
    </div>
  );
};
