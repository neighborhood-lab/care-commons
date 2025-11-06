import React from 'react';
import { Calendar, UserX, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card } from '@/core/components';
import type { SchedulingStats } from '../types';

interface SchedulingStatsCardsProps {
  stats: SchedulingStats;
}

export const SchedulingStatsCards: React.FC<SchedulingStatsCardsProps> = ({ stats }) => {
  const statCards = [
    {
      label: 'Total Visits',
      value: stats.totalVisits,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Unassigned',
      value: stats.unassignedVisits,
      icon: UserX,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      alert: stats.unassignedVisits > 0,
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Upcoming Today',
      value: stats.upcomingToday,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      label: 'Conflicts',
      value: stats.conflicts,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      alert: stats.conflicts > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat) => (
        <Card
          key={stat.label}
          className={`p-4 ${stat.alert ? 'border-2 border-orange-300 bg-orange-50' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
