/**
 * Care Coordinator Dashboard
 *
 * Dashboard for care coordinators showing:
 * - Unassigned visits (needs immediate attention)
 * - Caregiver availability conflicts
 * - Client intake queue
 * - Visit exceptions requiring review
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/hooks';
import { Card, CardContent, Button, EmptyState } from '@/core/components';
import {
  Users,
  AlertCircle,
  UserPlus,
  Clock,
  MapPin,
  CalendarX,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface UrgentItemProps {
  title: string;
  description: string;
  time?: string;
  location?: string;
  priority: 'high' | 'medium' | 'low';
  onClick?: () => void;
}

const UrgentItem: React.FC<UrgentItemProps> = ({ title, description, time, location, priority, onClick }) => {
  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return {
          border: 'border-l-4 border-red-500',
          bg: 'bg-red-50',
          badge: 'bg-red-500',
        };
      case 'medium':
        return {
          border: 'border-l-4 border-yellow-500',
          bg: 'bg-yellow-50',
          badge: 'bg-yellow-500',
        };
      case 'low':
        return {
          border: 'border-l-4 border-blue-500',
          bg: 'bg-blue-50',
          badge: 'bg-blue-500',
        };
    }
  };

  const styles = getPriorityStyles();

  return (
    <div
      className={`p-4 rounded-lg ${styles.border} ${styles.bg} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          {(time || location) && (
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
              {time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {time}
                </div>
              )}
              {location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location}
                </div>
              )}
            </div>
          )}
        </div>
        <span className={`ml-3 px-2 py-1 text-xs font-bold text-white rounded ${styles.badge}`}>
          {priority.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

interface ConflictItemProps {
  caregiverName: string;
  conflictType: string;
  details: string;
  affectedVisits: number;
  onClick?: () => void;
}

const ConflictItem: React.FC<ConflictItemProps> = ({
  caregiverName,
  conflictType,
  details,
  affectedVisits,
  onClick,
}) => {
  return (
    <div
      className={`p-4 rounded-lg border border-yellow-200 bg-yellow-50 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-gray-900">{caregiverName}</h4>
            <p className="text-sm text-gray-700 mt-1">{conflictType}</p>
            <p className="text-sm text-gray-600 mt-1">{details}</p>
          </div>
        </div>
        <div className="ml-3 text-right">
          <div className="text-sm font-semibold text-gray-900">{affectedVisits}</div>
          <div className="text-xs text-gray-600">visits</div>
        </div>
      </div>
    </div>
  );
};

interface IntakeItemProps {
  clientName: string;
  status: string;
  daysWaiting: number;
  nextStep: string;
  onClick?: () => void;
}

const IntakeItem: React.FC<IntakeItemProps> = ({
  clientName,
  status,
  daysWaiting,
  nextStep,
  onClick,
}) => {
  return (
    <div
      className={`p-4 rounded-lg border border-gray-200 hover:border-primary-300 ${onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">{clientName}</h4>
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
              {status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Next: {nextStep}</p>
          <p className="text-xs text-gray-500 mt-1">Waiting {daysWaiting} days</p>
        </div>
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
          Review
        </Button>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  badge?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, badge, onClick }) => {
  return (
    <Card
      padding="md"
      className={`${onClick ? 'cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 active:scale-95' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {badge && (
            <p className="mt-1 text-sm text-gray-600">{badge}</p>
          )}
        </div>
        <div className="flex-shrink-0">{icon}</div>
      </div>
    </Card>
  );
};

export const CoordinatorDashboard: React.FC = () => {
  useAuth();
  const navigate = useNavigate();

  // Note: Using mock data for demonstration - API integration in progress
  const stats = [
    {
      label: 'Unassigned Visits',
      value: '7',
      icon: <CalendarX className="h-6 w-6 text-red-600" />,
      badge: 'Needs immediate attention',
      onClick: () => navigate('/scheduling?filter=unassigned'),
    },
    {
      label: 'Active Clients',
      value: '84',
      icon: <Users className="h-6 w-6 text-primary-600" />,
      badge: 'Your caseload',
      onClick: () => navigate('/clients'),
    },
    {
      label: 'Pending Intakes',
      value: '5',
      icon: <UserPlus className="h-6 w-6 text-blue-600" />,
      badge: 'Awaiting review',
      onClick: () => navigate('/clients?tab=intake'),
    },
    {
      label: 'Visit Exceptions',
      value: '12',
      icon: <AlertCircle className="h-6 w-6 text-yellow-600" />,
      badge: 'Require review',
      onClick: () => navigate('/exceptions'),
    },
  ];

  const unassignedVisits = [
    {
      title: 'John Smith - Personal Care',
      description: 'Morning routine assistance',
      time: 'Today, 8:00 AM',
      location: '123 Main St, Austin, TX',
      priority: 'high' as const,
      onClick: () => navigate('/scheduling/assign/visit-1'),
    },
    {
      title: 'Mary Johnson - Medication Assistance',
      description: 'Med reminder and administration',
      time: 'Today, 10:00 AM',
      location: '456 Oak Ave, Austin, TX',
      priority: 'high' as const,
      onClick: () => navigate('/scheduling/assign/visit-2'),
    },
    {
      title: 'Robert Davis - Companionship',
      description: 'Social engagement and activities',
      time: 'Tomorrow, 2:00 PM',
      location: '789 Elm St, Austin, TX',
      priority: 'medium' as const,
      onClick: () => navigate('/scheduling/assign/visit-3'),
    },
  ];

  const conflicts = [
    {
      caregiverName: 'Sarah Martinez',
      conflictType: 'Double Booking',
      details: 'Scheduled for 2 visits at same time on 11/15',
      affectedVisits: 2,
      onClick: () => navigate('/scheduling?caregiver=sarah-martinez'),
    },
    {
      caregiverName: 'James Wilson',
      conflictType: 'Travel Time Conflict',
      details: 'Insufficient travel time between consecutive visits',
      affectedVisits: 3,
      onClick: () => navigate('/scheduling?caregiver=james-wilson'),
    },
    {
      caregiverName: 'Lisa Anderson',
      conflictType: 'Credential Expiring',
      details: 'CPR certification expires in 5 days',
      affectedVisits: 8,
      onClick: () => navigate('/caregivers/lisa-anderson'),
    },
  ];

  const intakeQueue = [
    {
      clientName: 'Patricia Williams',
      status: 'Assessment Scheduled',
      daysWaiting: 3,
      nextStep: 'Complete initial assessment',
      onClick: () => navigate('/clients/patricia-williams'),
    },
    {
      clientName: 'Michael Brown',
      status: 'Pending Documentation',
      daysWaiting: 5,
      nextStep: 'Upload physician orders',
      onClick: () => navigate('/clients/michael-brown'),
    },
    {
      clientName: 'Jennifer Garcia',
      status: 'Care Plan Review',
      daysWaiting: 2,
      nextStep: 'Finalize care plan',
      onClick: () => navigate('/clients/jennifer-garcia'),
    },
  ];

  const exceptions = [
    {
      title: 'Visit Check-in Late',
      description: 'Sarah M. checked in 25 minutes late for visit with John Smith',
      time: 'Today, 8:25 AM',
      priority: 'medium' as const,
      onClick: () => navigate('/exceptions/visit-late-1'),
    },
    {
      title: 'Visit Duration Mismatch',
      description: 'Scheduled 2 hours, actual 1.5 hours - James W. at Mary Johnson',
      time: 'Yesterday, 10:00 AM',
      priority: 'low' as const,
      onClick: () => navigate('/exceptions/duration-1'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Care Coordinator Dashboard
        </h1>
        <p className="mt-1 text-gray-600">
          Manage your caseload and coordinate care delivery
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Urgent: Unassigned Visits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Unassigned Visits - Needs Immediate Attention
            </h2>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/scheduling?filter=unassigned')}
          >
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {unassignedVisits.length > 0 ? (
            unassignedVisits.map((visit, index) => (
              <UrgentItem key={index} {...visit} />
            ))
          ) : (
            <Card>
              <CardContent>
                <EmptyState
                  title="No unassigned visits"
                  description="All visits have been assigned to caregivers"
                  icon={<CheckCircle className="h-12 w-12 text-green-600" />}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Caregiver Availability Conflicts and Client Intake Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conflicts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Caregiver Availability Conflicts
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/scheduling?tab=conflicts')}
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {conflicts.map((conflict, index) => (
              <ConflictItem key={index} {...conflict} />
            ))}
          </div>
        </div>

        {/* Intake Queue */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Client Intake Queue
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/clients?tab=intake')}
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {intakeQueue.map((intake, index) => (
              <IntakeItem key={index} {...intake} />
            ))}
          </div>
        </div>
      </div>

      {/* Visit Exceptions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Visit Exceptions Requiring Review
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/exceptions')}
          >
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {exceptions.length > 0 ? (
            exceptions.map((exception, index) => (
              <UrgentItem key={index} {...exception} />
            ))
          ) : (
            <Card>
              <CardContent>
                <EmptyState
                  title="No exceptions"
                  description="All visits completed without issues"
                  icon={<CheckCircle className="h-12 w-12 text-green-600" />}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
