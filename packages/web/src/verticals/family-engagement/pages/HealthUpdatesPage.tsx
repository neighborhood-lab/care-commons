/**
 * Family Health Updates Page
 *
 * Shows health reports and visit summaries
 */

import React from 'react';
import { Card } from '@/core/components';
import { useFamilyDashboard } from '../hooks';
import { useAuth } from '@/core/hooks';
import { ActivityFeed, VisitCard } from '../components';
import { Heart, FileText, Activity } from 'lucide-react';
import type { UUID } from '@care-commons/core/browser';

export const HealthUpdatesPage: React.FC = () => {
  const { user } = useAuth();
  const familyMemberId = user?.id as UUID | null;
  const { data: dashboardData, isLoading } = useFamilyDashboard(familyMemberId);

  const clientName = dashboardData?.client?.name || 'your loved one';
  const visits = dashboardData?.upcomingVisits || [];
  const recentActivity = dashboardData?.recentActivity || [];

  // Filter for completed visits
  const completedVisits = visits.filter(v => v.status === 'COMPLETED');

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-gray-200 rounded-lg" />
        <div className="h-96 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Health Updates</h1>
        <p className="text-gray-600 mt-1">
          Visit summaries and health reports for {clientName}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{completedVisits.length}</div>
              <div className="text-sm text-gray-600">Recent Visits</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Heart className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{recentActivity.length}</div>
              <div className="text-sm text-gray-600">Activity Updates</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData?.activeCarePlan ? 'Active' : 'None'}
              </div>
              <div className="text-sm text-gray-600">Care Plan Status</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Visit Summaries */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recent Visit Summaries
        </h2>
        {completedVisits.length > 0 ? (
          <div className="space-y-4">
            {completedVisits.slice(0, 5).map((visit) => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        ) : (
          <Card padding="lg">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No completed visits yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Visit summaries will appear here after visits are completed
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Activity Feed */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </h2>
        <Card padding="md">
          {recentActivity.length > 0 ? (
            <ActivityFeed activities={recentActivity} showLimit={10} />
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </Card>
      </div>

      {/* Information Box */}
      <Card padding="md" className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Heart className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">About Health Updates</h3>
            <p className="text-sm text-blue-800">
              This page shows visit summaries, health reports, and activity updates for {clientName}.
              You'll receive notifications when new updates are available. If you have questions about
              any health information, please contact the care team directly.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
