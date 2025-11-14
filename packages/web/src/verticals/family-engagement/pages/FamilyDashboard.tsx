/**
 * Family Dashboard Page
 *
 * Main landing page for family members with real-time data
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MessageCircle, ClipboardList, Heart, ArrowRight } from 'lucide-react';
import { Card } from '@/core/components';
import { useFamilyDashboard } from '../hooks';
import { useAuth } from '@/core/hooks';
import { UpcomingVisits, ActivityFeed, VisitNotifications } from '../components';
import type { UUID } from '@care-commons/core/browser';

interface QuickLinkCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  badge?: number;
}

const QuickLinkCard: React.FC<QuickLinkCardProps> = ({ title, description, icon, to, badge }) => {
  return (
    <Link to={to}>
      <Card
        padding="md"
        hover
        className="h-full cursor-pointer border-2 border-transparent hover:border-primary-300"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <div className="text-primary-600">
              {icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              {badge !== undefined && badge > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
        </div>
      </Card>
    </Link>
  );
};

export const FamilyDashboard: React.FC = () => {
  const { user } = useAuth();
  const familyMemberId = user?.id as UUID | null;

  const { data: dashboardData, isLoading, error } = useFamilyDashboard(familyMemberId);

  // For demo purposes, use hardcoded name if no data
  const clientName = dashboardData?.client?.name || 'Gertrude Stein';
  const firstName = clientName.split(' ')[0];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Family Portal</h1>
          <p className="text-lg text-gray-600 mt-2">
            Here's what's happening with your loved one's care
          </p>
        </div>
        <Card padding="lg">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to Load Dashboard
            </h3>
            <p className="text-gray-600 mb-4">
              We're having trouble loading your dashboard data. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Refresh Page
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const quickLinks = [
    {
      title: 'View Care Schedule',
      description: `See upcoming visits for ${firstName}`,
      icon: <Calendar className="h-6 w-6" />,
      to: '/family-portal/schedule',
    },
    {
      title: 'Messages',
      description: 'Communicate with care team',
      icon: <MessageCircle className="h-6 w-6" />,
      to: '/family-portal/messages',
      badge: dashboardData?.unreadMessages,
    },
    {
      title: 'Care Plan',
      description: 'View care goals and progress',
      icon: <ClipboardList className="h-6 w-6" />,
      to: '/family-portal/care-plan',
    },
    {
      title: 'Health Updates',
      description: 'Visit summaries and reports',
      icon: <Heart className="h-6 w-6" />,
      to: '/family-portal/health-updates',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Visit Notifications (renders nothing, just handles notifications) */}
      <VisitNotifications />

      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, Family Member
        </h1>
        <p className="text-lg text-gray-600">
          Here's what's happening with {firstName}'s care
        </p>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickLinks.map((link) => (
            <QuickLinkCard key={link.to} {...link} />
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Visits */}
        <div>
          <UpcomingVisits visits={dashboardData?.upcomingVisits || []} />
        </div>

        {/* Recent Activity */}
        <div>
          <Card padding="md">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <ActivityFeed activities={dashboardData?.recentActivity || []} showLimit={5} />
          </Card>
        </div>
      </div>

      {/* Care Plan Summary */}
      {dashboardData?.activeCarePlan && (
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {dashboardData.activeCarePlan.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">Active Care Plan</p>
            </div>
            <Link
              to="/family-portal/care-plan"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
            >
              View Details
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData.activeCarePlan.goalsTotal}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Goals</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {dashboardData.activeCarePlan.goalsAchieved}
              </div>
              <div className="text-sm text-gray-600 mt-1">Goals Achieved</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span className="font-medium">
                {dashboardData.activeCarePlan.goalsTotal > 0
                  ? Math.round(
                      (dashboardData.activeCarePlan.goalsAchieved /
                        dashboardData.activeCarePlan.goalsTotal) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    dashboardData.activeCarePlan.goalsTotal > 0
                      ? (dashboardData.activeCarePlan.goalsAchieved /
                          dashboardData.activeCarePlan.goalsTotal) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
