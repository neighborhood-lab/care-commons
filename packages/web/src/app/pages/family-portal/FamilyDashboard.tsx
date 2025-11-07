import React from 'react';
import { useFamilyDashboard } from '@/app/hooks/useFamilyPortal';
import { CareSummary } from './components/CareSummary';
import { ActivityFeed } from './components/ActivityFeed';
import { UpcomingVisits } from './components/UpcomingVisits';
import { CareTeamCard } from './components/CareTeamCard';
import { Loader2 } from 'lucide-react';

// Temporary: In production, this would come from auth context
const FAMILY_MEMBER_ID = 'family-member-1';

export const FamilyDashboard: React.FC = () => {
  const { data: dashboard, isLoading } = useFamilyDashboard(FAMILY_MEMBER_ID);

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to {dashboard.client.name}'s Care Portal
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Stay connected with your loved one's care journey
        </p>
      </div>

      {/* Care Summary Stats */}
      <CareSummary
        upcomingVisitsCount={dashboard.upcomingVisits.length}
        recentActivitiesCount={dashboard.recentActivity.length}
        activeCarePlan={dashboard.activeCarePlan}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column - Activity Feed */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
          <ActivityFeed
            familyMemberId={FAMILY_MEMBER_ID}
            limit={10}
            showFilters={false}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <UpcomingVisits clientId={dashboard.client.id} />
          <CareTeamCard members={[]} />
        </div>
      </div>
    </div>
  );
};
