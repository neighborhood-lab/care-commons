import React, { useState } from 'react';
import {
  Calendar,
  Users,
  FileText,
  MessageCircle,
  Bell,
  Heart,
  Activity,
  Clock,
} from 'lucide-react';
import { Card } from '@/core/components';
import { AIChatbot } from './AIChatbot';

/**
 * Family Portal Dashboard
 * Main dashboard for family members to view care information
 */

interface FamilyPortalDashboardProps {
  clientId: string;
  clientName: string;
  familyMember: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export const FamilyPortalDashboard: React.FC<FamilyPortalDashboardProps> = ({
  clientId,
  clientName,
  familyMember,
}) => {
  const [showChatbot, setShowChatbot] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);

  // Mock data - in production, fetch from API
  const nextVisit = {
    date: new Date('2025-11-06T10:00:00'),
    caregiver: 'Sarah Johnson',
    type: 'Personal Care',
  };

  const carePlanProgress = {
    totalGoals: 5,
    completedGoals: 3,
    percentage: 60,
  };

  const recentActivity = [
    { id: 1, type: 'visit', message: 'Visit completed by Sarah Johnson', time: '2 hours ago' },
    { id: 2, type: 'goal', message: 'Mobility goal updated', time: '1 day ago' },
    { id: 3, type: 'message', message: 'New message from Care Coordinator', time: '2 days ago' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {familyMember.firstName}
              </h1>
              <p className="text-sm text-gray-600">
                Viewing care information for {clientName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowChatbot(!showChatbot)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MessageCircle className="w-6 h-6 text-gray-600" />
                <span className="sr-only">Chat Assistant</span>
              </button>
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-6 h-6 text-gray-600" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadNotifications}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card padding="md" className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Next Visit</p>
                <p className="text-2xl font-bold mt-1">
                  {nextVisit.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className="text-sm opacity-90 mt-1">
                  {nextVisit.date.toLocaleDateString()}
                </p>
              </div>
              <Calendar className="w-12 h-12 opacity-80" />
            </div>
          </Card>

          <Card padding="md" className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Care Plan Progress</p>
                <p className="text-2xl font-bold mt-1">{carePlanProgress.percentage}%</p>
                <p className="text-sm opacity-90 mt-1">
                  {carePlanProgress.completedGoals}/{carePlanProgress.totalGoals} Goals
                </p>
              </div>
              <Activity className="w-12 h-12 opacity-80" />
            </div>
          </Card>

          <Card padding="md" className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Active Caregivers</p>
                <p className="text-2xl font-bold mt-1">2</p>
                <p className="text-sm opacity-90 mt-1">Assigned</p>
              </div>
              <Users className="w-12 h-12 opacity-80" />
            </div>
          </Card>

          <Card padding="md" className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">This Week</p>
                <p className="text-2xl font-bold mt-1">5</p>
                <p className="text-sm opacity-90 mt-1">Visits Scheduled</p>
              </div>
              <Clock className="w-12 h-12 opacity-80" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Next Visit */}
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold">Next Scheduled Visit</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{nextVisit.type}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {nextVisit.date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {nextVisit.date.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Caregiver</p>
                    <p className="font-medium text-gray-900">{nextVisit.caregiver}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Care Plan Progress */}
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold">Care Plan Progress</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-medium">{carePlanProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${carePlanProgress.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Active Goals</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {carePlanProgress.totalGoals}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {carePlanProgress.completedGoals}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold">Recent Activity</h2>
              </div>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card padding="lg">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  <span>View Care Plan</span>
                </button>
                <button className="w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-3">
                  <Calendar className="w-5 h-5" />
                  <span>Visit Schedule</span>
                </button>
                <button
                  onClick={() => setShowChatbot(!showChatbot)}
                  className="w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-3"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Ask AI Assistant</span>
                </button>
              </div>
            </Card>

            {/* Contact */}
            <Card padding="lg">
              <h3 className="font-semibold mb-4">Need Help?</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Care Coordinator</p>
                  <p className="font-medium">Jane Smith</p>
                  <p className="text-sm text-blue-600">(555) 123-4567</p>
                </div>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Send Message
                </button>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Chatbot Modal/Slide-over */}
      {showChatbot && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowChatbot(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-[500px] bg-white shadow-2xl">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Care Assistant</h3>
                <button
                  onClick={() => setShowChatbot(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">&times;</span>
                </button>
              </div>
              <div className="flex-1">
                <AIChatbot clientId={clientId} className="h-full border-none shadow-none" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
