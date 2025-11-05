import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { familyPortalApi } from '../services/api-client';
import { useAuth } from '../hooks/useAuth';

export function FamilyDashboardPage() {
  const { familyMember } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await familyPortalApi.getDashboard();
      if (response.success) {
        setDashboard(response.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const client = dashboard?.client;
  const carePlan = dashboard?.carePlan;
  const upcomingVisits = dashboard?.upcomingVisits || [];
  const recentVisits = dashboard?.recentVisits || [];
  const notifications = dashboard?.notifications || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {familyMember?.firstName}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with {client?.firstName}'s care
        </p>
      </div>

      {/* Notifications Banner */}
      {notifications.unreadCount > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-800 font-medium">
                You have {notifications.unreadCount} unread notification{notifications.unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            <Link
              to="/family/notifications"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View all →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{client?.firstName} {client?.lastName}</span>
              </div>
              <div>
                <span className="text-gray-600">Age:</span>
                <span className="ml-2 font-medium">{client?.age} years old</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                  {client?.status}
                </span>
              </div>
              {client?.programs?.map((program: any) => (
                <div key={program.name}>
                  <span className="text-gray-600">Program:</span>
                  <span className="ml-2 font-medium">{program.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              to="/family/chat"
              className="block w-full text-left px-4 py-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
            >
              💬 Chat with AI Assistant
            </Link>
            <Link
              to="/family/care-plan"
              className="block w-full text-left px-4 py-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
            >
              📋 View Care Plan
            </Link>
            <Link
              to="/family/visits"
              className="block w-full text-left px-4 py-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"
            >
              📅 View Visits
            </Link>
          </div>
        </div>

        {/* Care Plan Progress */}
        {carePlan && (
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Care Plan Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Goals Progress</span>
                  <span className="font-medium">{carePlan.goalsProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${carePlan.goalsProgress}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{carePlan.goalsTotal}</div>
                  <div className="text-sm text-gray-600">Total Goals</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{carePlan.goalsAchieved}</div>
                  <div className="text-sm text-gray-600">Achieved</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{carePlan.goalsInProgress}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Visits */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Visits</h2>
          {upcomingVisits.length > 0 ? (
            <div className="space-y-3">
              {upcomingVisits.slice(0, 3).map((visit: any) => (
                <div key={visit.id} className="border-l-4 border-blue-500 pl-3 py-2">
                  <div className="font-medium text-gray-900">
                    {visit.caregiver.firstName} {visit.caregiver.lastName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(visit.scheduledStartTime).toLocaleDateString()} at{' '}
                    {new Date(visit.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No upcoming visits scheduled</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {recentVisits.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Visits</h2>
          <div className="space-y-4">
            {recentVisits.slice(0, 3).map((visit: any) => (
              <div key={visit.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-gray-900">
                      {visit.caregiver.firstName} {visit.caregiver.lastName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(visit.actualStartTime).toLocaleDateString()} •{' '}
                      {visit.services.join(', ')}
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    {visit.status}
                  </span>
                </div>
                {visit.summary && (
                  <p className="text-sm text-gray-700">{visit.summary}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
