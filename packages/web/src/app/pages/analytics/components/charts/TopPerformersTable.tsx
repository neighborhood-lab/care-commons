/**
 * Top Performers Table Component
 * Displays top caregivers by performance metrics
 */

import { Award, TrendingUp } from 'lucide-react';
import type { CaregiverPerformance } from '@care-commons/analytics-reporting/types/analytics';

interface TopPerformersTableProps {
  caregivers: CaregiverPerformance[];
  limit?: number;
  className?: string;
  onCaregiverClick?: (caregiverId: string) => void;
}

export function TopPerformersTable({
  caregivers,
  limit = 5,
  className = '',
  onCaregiverClick,
}: TopPerformersTableProps) {
  // Sort by performance score and take top N
  const topPerformers = [...caregivers]
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, limit);

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Caregiver
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Visits
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              On-Time %
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              EVV Compliance
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Score
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {topPerformers.map((caregiver, index) => (
            <tr
              key={caregiver.caregiverId}
              className={`hover:bg-gray-50 ${
                onCaregiverClick ? 'cursor-pointer' : ''
              }`}
              onClick={() =>
                onCaregiverClick && onCaregiverClick(caregiver.caregiverId)
              }
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  {index === 0 && (
                    <Award className="h-5 w-5 text-yellow-500 mr-1" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {index + 1}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {caregiver.caregiverName}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {caregiver.visitsCompleted}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="text-sm text-gray-900">
                    {caregiver.onTimePercentage.toFixed(1)}%
                  </span>
                  {caregiver.onTimePercentage >= 95 && (
                    <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
                  )}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`text-sm font-medium ${
                    caregiver.evvComplianceRate >= 95
                      ? 'text-green-600'
                      : caregiver.evvComplianceRate >= 85
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {caregiver.evvComplianceRate.toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-sm font-bold text-primary-600">
                    {caregiver.performanceScore.toFixed(0)}
                  </div>
                  <div className="ml-2 text-xs text-gray-500">/100</div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {topPerformers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No performance data available
        </div>
      )}
    </div>
  );
}
