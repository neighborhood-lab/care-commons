/**
 * Family Dashboard Page
 *
 * Main landing page for family members
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useFamilyDashboard, useRecentActivity } from '../hooks';
import { CareSummary, UpcomingVisits, ActivityFeed } from '../components';

export const FamilyDashboard: React.FC = () => {
  // Get family member ID from session
  const familyMemberId = sessionStorage.getItem('familyMemberId') || null;

  const { data: dashboard, isLoading: dashboardLoading } = useFamilyDashboard(familyMemberId);
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(
    familyMemberId,
    5
  );

  if (dashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-96 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Unable to load dashboard. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Your Family Portal</h1>
        <p className="mt-1 text-gray-600">
          Stay informed about {dashboard.client.name}'s care and communicate with the care team
        </p>
      </div>

      {/* Care Summary */}
      <CareSummary dashboard={dashboard} />

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Visits */}
        <UpcomingVisits visits={dashboard.upcomingVisits} />

        {/* Quick Actions */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/family-portal/messages"
              className="flex items-center gap-3 rounded-lg bg-blue-50 p-4 hover:bg-blue-100 transition-colors"
            >
              <span className="text-3xl">💬</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900">Send a Message</h3>
                <p className="text-xs text-blue-700">
                  Contact your care coordinator
                  {dashboard.unreadMessages > 0 && (
                    <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                      {dashboard.unreadMessages} unread
                    </span>
                  )}
                </p>
              </div>
            </Link>

            <Link
              to="/family-portal/activity"
              className="flex items-center gap-3 rounded-lg bg-green-50 p-4 hover:bg-green-100 transition-colors"
            >
              <span className="text-3xl">📋</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-900">View Activity Feed</h3>
                <p className="text-xs text-green-700">See all care updates and completed tasks</p>
              </div>
            </Link>

            <Link
              to="/family-portal/notifications"
              className="flex items-center gap-3 rounded-lg bg-purple-50 p-4 hover:bg-purple-100 transition-colors"
            >
              <span className="text-3xl">🔔</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-purple-900">Notifications</h3>
                <p className="text-xs text-purple-700">
                  Manage your notification preferences
                  {dashboard.unreadNotifications > 0 && (
                    <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                      {dashboard.unreadNotifications} new
                    </span>
                  )}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Link
            to="/family-portal/activity"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            View all →
          </Link>
        </div>
        <ActivityFeed
          activities={recentActivity || []}
          loading={activityLoading}
          showLimit={5}
        />
      </div>
    </div>
  );
};
