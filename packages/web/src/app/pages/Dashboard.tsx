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
      icon: <Users className="h-6 w-6 text-primary-600" />,
      change: '+12%',
    },
    {
      label: "Today's Visits",
      value: '18',
      icon: <Calendar className="h-6 w-6 text-green-600" />,
      change: '+5%',
    },
    {
      label: 'Pending Tasks',
      value: '7',
      icon: <ClipboardList className="h-6 w-6 text-yellow-600" />,
      change: '-3%',
    },
    {
      label: 'Alerts',
      value: '3',
      icon: <AlertCircle className="h-6 w-6 text-red-600" />,
      change: '+2',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="animate-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here&apos;s what&apos;s happening with your care operations today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={stat.label}
            padding="md"
            hover
            className={`transition-all duration-300 hover:scale-105 cursor-pointer animate-in slide-in-from-bottom-4 delay-${index * 100}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 transition-colors group-hover:text-primary-600">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  <span className={stat.change.startsWith('+') ? 'text-green-600 font-medium' : 'text-gray-600'}>
                    {stat.change}
                  </span>
                  {' from last week'}
                </p>
              </div>
              <div className="flex-shrink-0 transition-transform group-hover:scale-110">
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-in slide-in-from-left duration-500 delay-400">
          <CardHeader title="Recent Activity" />
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="h-2 w-2 mt-2 rounded-full bg-green-500 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Visit completed for John Doe
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="h-2 w-2 mt-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    New client intake scheduled
                  </p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="h-2 w-2 mt-2 rounded-full bg-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Care plan update required
                  </p>
                  <p className="text-xs text-gray-500">Yesterday</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in slide-in-from-right duration-500 delay-400">
          <CardHeader title="Upcoming Visits" />
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all duration-200">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Sarah Johnson</p>
                  <p className="text-xs text-gray-600">Personal Care - 2 hours</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary-600">10:00 AM</p>
                  <p className="text-xs text-gray-600">Jane Smith</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all duration-200">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Michael Brown</p>
                  <p className="text-xs text-gray-600">Companion Care - 3 hours</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary-600">2:00 PM</p>
                  <p className="text-xs text-gray-600">Bob Williams</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all duration-200">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Emily Davis</p>
                  <p className="text-xs text-gray-600">Skilled Nursing - 1 hour</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary-600">4:30 PM</p>
                  <p className="text-xs text-gray-600">Mary Johnson</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
