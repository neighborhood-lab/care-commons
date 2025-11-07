/**
 * Care Summary Component
 *
 * High-level overview of care status
 */

import React from 'react';
import type { FamilyDashboard } from '@care-commons/family-engagement';

interface CareSummaryProps {
  dashboard: FamilyDashboard;
}

export const CareSummary: React.FC<CareSummaryProps> = ({ dashboard }) => {
  const { client, upcomingVisits, activeCarePlan } = dashboard;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Care Summary</h2>

      {/* Client Info */}
      <div className="mb-6 flex items-center gap-4">
        {client.photoUrl && (
          <img
            src={client.photoUrl}
            alt={client.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{client.name}</h3>
          <p className="text-sm text-gray-600">Your loved one</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-blue-50 p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{upcomingVisits.length}</p>
          <p className="mt-1 text-xs text-gray-600">Upcoming Visits</p>
        </div>
        <div className="rounded-lg bg-green-50 p-4 text-center">
          <p className="text-3xl font-bold text-green-600">
            {activeCarePlan?.goalsAchieved || 0}
          </p>
          <p className="mt-1 text-xs text-gray-600">Goals Achieved</p>
        </div>
        <div className="rounded-lg bg-purple-50 p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">
            {activeCarePlan?.goalsTotal || 0}
          </p>
          <p className="mt-1 text-xs text-gray-600">Total Goals</p>
        </div>
        <div className="rounded-lg bg-orange-50 p-4 text-center">
          <p className="text-3xl font-bold text-orange-600">{dashboard.recentActivity.length}</p>
          <p className="mt-1 text-xs text-gray-600">Recent Activities</p>
        </div>
      </div>

      {/* Care Plan Progress */}
      {activeCarePlan && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Active Care Plan</h3>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{activeCarePlan.name}</span>
              <span className="text-sm font-semibold text-green-600">
                {Math.round(
                  (activeCarePlan.goalsAchieved / activeCarePlan.goalsTotal) * 100
                )}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-green-500 transition-all"
                style={{
                  width: `${
                    (activeCarePlan.goalsAchieved / activeCarePlan.goalsTotal) * 100
                  }%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-600">
              {activeCarePlan.goalsAchieved} of {activeCarePlan.goalsTotal} goals completed
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
