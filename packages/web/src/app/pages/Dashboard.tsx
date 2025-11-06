import React from 'react';
import { useAuth } from '@/core/hooks';
import { Card, CardHeader, CardContent } from '@/core/components';
import { Users, Calendar, ClipboardList, AlertCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      label: 'Active Clients',
      value: '124',
      icon: <Users className="h-6 w-6" />,
      change: '+12%',
      gradient: 'from-blue-500 to-primary-600',
      bgGradient: 'from-blue-50 to-primary-50',
    },
    {
      label: "Today's Visits",
      value: '18',
      icon: <Calendar className="h-6 w-6" />,
      change: '+5%',
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
    },
    {
      label: 'Pending Tasks',
      value: '7',
      icon: <ClipboardList className="h-6 w-6" />,
      change: '-3%',
      gradient: 'from-yellow-500 to-orange-600',
      bgGradient: 'from-yellow-50 to-orange-50',
    },
    {
      label: 'Alerts',
      value: '3',
      icon: <AlertCircle className="h-6 w-6" />,
      change: '+2',
      gradient: 'from-red-500 to-pink-600',
      bgGradient: 'from-red-50 to-pink-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 -mx-6 -mt-6 px-6 py-8 mb-6 rounded-b-3xl shadow-lg">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-2 text-primary-100 text-lg">
          Here&apos;s what&apos;s happening with your care operations today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`}></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">{stat.icon}</div>
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
              <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
              <p className="mt-2 text-xs text-gray-500">from last week</p>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`}></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-blue-500 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <div className="h-3 w-3 rounded-full bg-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Visit completed for John Doe
                  </p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-primary-500 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <div className="h-3 w-3 rounded-full bg-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    New client intake scheduled
                  </p>
                  <p className="text-xs text-gray-500 mt-1">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <div className="h-3 w-3 rounded-full bg-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Care plan update required
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Upcoming Visits</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer group">
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">Sarah Johnson</p>
                  <p className="text-xs text-gray-600 mt-1">Personal Care • 2 hours</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary-600">10:00 AM</p>
                  <p className="text-xs text-gray-500 mt-1">Jane Smith</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer group">
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Michael Brown</p>
                  <p className="text-xs text-gray-600 mt-1">Companion Care • 3 hours</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">2:00 PM</p>
                  <p className="text-xs text-gray-500 mt-1">Bob Williams</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer group">
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">Emily Davis</p>
                  <p className="text-xs text-gray-600 mt-1">Skilled Nursing • 1 hour</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-purple-600">4:30 PM</p>
                  <p className="text-xs text-gray-500 mt-1">Mary Johnson</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
