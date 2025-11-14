import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/hooks';
import { Card, CardHeader, CardContent, Button, EmptyState } from '@/core/components';
import { Users, Calendar, ClipboardList, AlertCircle, Activity, CalendarPlus } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
    <div id="dashboard" className="space-y-6">
      <div id="family-dashboard">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-gray-600">
          Here&apos;s what&apos;s happening with your care operations today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-600">{stat.change} from last week</p>
              </div>
              <div className="flex-shrink-0">{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Recent Activity" />
          <CardContent>
            <div id="visit-timeline">
              <EmptyState
                title="No recent activity"
                description="Activity will appear here when visits are completed, care plans are updated, or new clients are added to the system."
                icon={<Activity className="h-12 w-12" />}
                action={
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/clients')}
                    >
                      View Clients
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/care-plans')}
                    >
                      View Care Plans
                    </Button>
                  </div>
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Upcoming Visits" />
          <CardContent>
            <div id="today-visits">
              <EmptyState
                title="No upcoming visits"
                description="Schedule visits for your clients to see them appear here. You can assign caregivers and manage visit details."
                icon={<CalendarPlus className="h-12 w-12" />}
                action={
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/scheduling')}
                    >
                      Schedule New Visit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/clients')}
                    >
                      View Clients
                    </Button>
                  </div>
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
