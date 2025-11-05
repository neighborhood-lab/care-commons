import React from 'react';
import { Link } from 'react-router-dom';
import { MobileLayout } from '../../components/MobileLayout';
import {
  Calendar,
  CheckSquare,
  Clock,
  MapPin,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const MobileHomePage: React.FC = () => {
  const stats = [
    { label: 'Today\'s Visits', value: '4', icon: Calendar, color: 'bg-blue-500' },
    { label: 'Pending Tasks', value: '12', icon: CheckSquare, color: 'bg-purple-500' },
    { label: 'Hours This Week', value: '28', icon: Clock, color: 'bg-green-500' },
  ];

  const upcomingVisits = [
    {
      id: '1',
      clientName: 'Dorothy Chen',
      time: '2:00 PM - 3:00 PM',
      address: '123 Main St, Austin, TX',
      type: 'Personal Care',
      status: 'upcoming' as const,
    },
    {
      id: '2',
      clientName: 'Robert Martinez',
      time: '4:00 PM - 5:30 PM',
      address: '456 Oak Ave, Austin, TX',
      type: 'Companionship',
      status: 'upcoming' as const,
    },
  ];

  const alerts = [
    {
      id: '1',
      message: 'Complete medication training by end of week',
      type: 'warning' as const,
    },
  ];

  return (
    <MobileLayout title="Home">
      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome, Sarah!</h2>
          <p className="text-purple-100">Tuesday, November 5, 2025</p>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            <span>You're doing great this week!</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100"
              >
                <div className={`${stat.color} w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-900 font-medium">
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Visits */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Next Visits</h3>
            <Link
              to="/mobile/visits"
              className="text-sm text-purple-600 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingVisits.map((visit) => (
              <Link
                key={visit.id}
                to={`/mobile/visits/${visit.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-purple-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{visit.clientName}</h4>
                  <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
                    Upcoming
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{visit.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{visit.address}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">{visit.type}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/mobile/visits"
              className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100 hover:border-purple-300 transition-colors"
            >
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">View Schedule</div>
            </Link>
            <Link
              to="/mobile/tasks"
              className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100 hover:border-purple-300 transition-colors"
            >
              <CheckSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">My Tasks</div>
            </Link>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};
