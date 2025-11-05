/**
 * Role-Based Dashboard Page
 *
 * Shows a personalized dashboard based on the current user role.
 * Each role sees relevant information and quick actions.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShowcaseLayout } from '../components/ShowcaseLayout';
import { useRole } from '../contexts/RoleContext';
import { useQuery } from '@tanstack/react-query';
import { useDataProvider } from '@/core/providers/context';
import {
  Calendar,
  CheckSquare,
  Users,
  ClipboardList,
  AlertCircle,
  TrendingUp,
  Clock,
  FileText,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';

export const DashboardPage: React.FC = () => {
  const { currentRole, currentPersona } = useRole();
  const provider = useDataProvider();

  // Fetch relevant data based on role
  const { data: tasks } = useQuery({
    queryKey: ['tasks', currentPersona.relatedDataId],
    queryFn: () => {
      if (currentRole === 'patient' || currentRole === 'family') {
        return provider.getTasks({ clientId: currentPersona.relatedDataId, status: ['SCHEDULED'] });
      } else if (currentRole === 'caregiver') {
        return provider.getTasks({ assignedCaregiverId: currentPersona.relatedDataId, status: ['SCHEDULED'] });
      }
      return provider.getTasks({ status: ['SCHEDULED'] });
    },
  });

  const { data: carePlans } = useQuery({
    queryKey: ['carePlans', currentPersona.relatedDataId],
    queryFn: () => {
      if (currentRole === 'patient' || currentRole === 'family') {
        return provider.getCarePlans({ clientId: currentPersona.relatedDataId, status: ['ACTIVE'] });
      }
      return provider.getCarePlans({ status: ['ACTIVE'] });
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => provider.getClients({ status: ['ACTIVE'] }),
    enabled: currentRole === 'coordinator' || currentRole === 'admin',
  });

  const { data: caregivers } = useQuery({
    queryKey: ['caregivers'],
    queryFn: () => provider.getCaregivers({ status: ['ACTIVE'] }),
    enabled: currentRole === 'coordinator' || currentRole === 'admin',
  });

  const { data: shifts } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => provider.getShiftListings({ status: ['OPEN'] }),
    enabled: currentRole === 'caregiver' || currentRole === 'coordinator' || currentRole === 'admin',
  });

  return (
    <ShowcaseLayout
      title={`Welcome, ${currentPersona.name}`}
      description={`${currentPersona.description} • ${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} Dashboard`}
    >
      {/* Role-specific dashboard content */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {currentRole === 'patient' || currentRole === 'family' ? (
            <>
              <StatCard
                title="Upcoming Tasks"
                value={tasks?.total || 0}
                icon={CheckSquare}
                color="bg-green-500"
                link="/tasks"
              />
              <StatCard
                title="Active Care Plans"
                value={carePlans?.total || 0}
                icon={ClipboardList}
                color="bg-purple-500"
                link="/care-plans"
              />
              <StatCard
                title="This Week"
                value={`${tasks?.total || 0} visits`}
                icon={Calendar}
                color="bg-blue-500"
                link="/tasks"
              />
              <StatCard
                title="Care Status"
                value="Good"
                icon={Activity}
                color="bg-green-500"
                link="/care-plans"
              />
            </>
          ) : currentRole === 'caregiver' ? (
            <>
              <StatCard
                title="My Tasks Today"
                value={tasks?.items.filter(t => {
                  const taskDate = new Date(t.scheduledStartTime);
                  const today = new Date();
                  return taskDate.toDateString() === today.toDateString();
                }).length || 0}
                icon={CheckSquare}
                color="bg-green-500"
                link="/tasks"
              />
              <StatCard
                title="This Week"
                value={tasks?.total || 0}
                icon={Calendar}
                color="bg-blue-500"
                link="/tasks"
              />
              <StatCard
                title="Open Shifts"
                value={shifts?.total || 0}
                icon={Clock}
                color="bg-orange-500"
                link="/shifts"
              />
              <StatCard
                title="Hours This Period"
                value="32.5"
                icon={TrendingUp}
                color="bg-purple-500"
              />
            </>
          ) : (
            <>
              <StatCard
                title="Active Clients"
                value={clients?.total || 0}
                icon={Users}
                color="bg-blue-500"
                link="/clients"
              />
              <StatCard
                title="Active Caregivers"
                value={caregivers?.total || 0}
                icon={Users}
                color="bg-green-500"
                link="/caregivers"
              />
              <StatCard
                title="Active Care Plans"
                value={carePlans?.total || 0}
                icon={ClipboardList}
                color="bg-purple-500"
                link="/care-plans"
              />
              <StatCard
                title="Open Shifts"
                value={shifts?.total || 0}
                icon={Calendar}
                color="bg-orange-500"
                link="/shifts"
              />
            </>
          )}
        </div>

        {/* Upcoming Tasks/Schedule */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentRole === 'caregiver' ? 'My Schedule' : 'Upcoming Tasks'}
            </h2>
            <Link
              to="/tasks"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {tasks && tasks.items.length > 0 ? (
            <div className="space-y-3">
              {tasks.items.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    <CheckSquare className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(task.scheduledStartTime), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  <div>
                    <span className={`
                      inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                      ${task.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                        task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'}
                    `}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No upcoming tasks</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {currentPersona.primaryFeatures.map((feature, idx) => (
              <QuickActionButton key={idx} label={feature} />
            ))}
          </div>
        </div>

        {/* Role-specific alerts or info */}
        {(currentRole === 'coordinator' || currentRole === 'admin') && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900">Attention Needed</h3>
                <p className="text-sm text-amber-800 mt-1">
                  2 care plans require review, 3 certifications expiring within 30 days
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShowcaseLayout>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  link?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, link }) => {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className={`${color} rounded-lg p-2`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </>
  );

  if (link) {
    return (
      <Link
        to={link}
        className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      {content}
    </div>
  );
};

interface QuickActionButtonProps {
  label: string;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ label }) => {
  const getLink = (label: string): string => {
    const lower = label.toLowerCase();
    if (lower.includes('care plan')) return '/care-plans';
    if (lower.includes('task')) return '/tasks';
    if (lower.includes('shift')) return '/shifts';
    if (lower.includes('caregiver')) return '/caregivers';
    if (lower.includes('client')) return '/clients';
    if (lower.includes('invoice') || lower.includes('billing')) return '/billing';
    if (lower.includes('profile')) return '/clients';
    return '/';
  };

  return (
    <Link
      to={getLink(label)}
      className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
    >
      {label}
    </Link>
  );
};
