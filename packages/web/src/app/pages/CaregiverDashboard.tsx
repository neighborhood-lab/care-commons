/**
 * Caregiver Dashboard
 *
 * Dashboard for caregivers showing:
 * - Today's schedule with map/directions
 * - Pending tasks by client
 * - Timesheet status (submitted, approved, paid)
 * - Training/credential expiration reminders
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useIsMobile } from '@/core/hooks';
import { Card, CardHeader, CardContent, Button, EmptyState } from '@/core/components';
import {
  Calendar,
  Clock,
  MapPin,
  Navigation,
  CheckCircle,
  AlertCircle,
  Award,
  FileText,
  AlertTriangle,
  Users,
  Phone,
} from 'lucide-react';

interface VisitCardProps {
  clientName: string;
  visitType: string;
  time: string;
  duration: string;
  address: string;
  clientPhone?: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  tasks: string[];
  onNavigate?: () => void;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  onViewDetails?: () => void;
  onCall?: () => void;
}

const VisitCard: React.FC<VisitCardProps> = ({
  clientName,
  visitType,
  time,
  duration,
  address,
  clientPhone,
  status,
  tasks,
  onNavigate,
  onCheckIn,
  onCheckOut,
  onViewDetails,
  onCall,
}) => {
  const isMobile = useIsMobile();
  const getStatusStyles = () => {
    switch (status) {
      case 'upcoming':
        return {
          border: 'border-blue-200',
          bg: 'bg-blue-50',
          badge: 'bg-blue-500',
          text: 'Upcoming',
        };
      case 'in-progress':
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          badge: 'bg-green-500',
          text: 'In Progress',
        };
      case 'completed':
        return {
          border: 'border-gray-200',
          bg: 'bg-gray-50',
          badge: 'bg-gray-500',
          text: 'Completed',
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <Card padding="md" className={`border-2 ${styles.border} ${styles.bg}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{clientName}</h3>
              <span className={`px-2 py-0.5 text-xs font-bold text-white rounded ${styles.badge}`}>
                {styles.text}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{visitType}</p>
          </div>
        </div>

        {/* Time and Duration */}
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {time}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {duration}
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 text-sm text-gray-700">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{address}</span>
        </div>

        {/* Client Phone (Mobile) */}
        {clientPhone && isMobile && onCall && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <button
              onClick={onCall}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium underline"
            >
              {clientPhone}
            </button>
          </div>
        )}

        {/* Tasks */}
        {tasks.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Tasks:</p>
            <ul className="space-y-1">
              {tasks.map((task, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                  {task}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap'} gap-2 pt-2 border-t border-gray-200`}>
          {onCheckIn && status === 'upcoming' && (
            <Button
              variant="primary"
              size={isMobile ? 'lg' : 'sm'}
              onClick={onCheckIn}
              className={isMobile ? 'w-full min-h-[44px] text-base font-semibold' : ''}
            >
              <CheckCircle className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
              Check In
            </Button>
          )}
          {onCheckOut && status === 'in-progress' && (
            <Button
              variant="primary"
              size={isMobile ? 'lg' : 'sm'}
              onClick={onCheckOut}
              className={isMobile ? 'w-full min-h-[44px] text-base font-semibold' : ''}
            >
              <CheckCircle className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
              Check Out
            </Button>
          )}
          <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap'} gap-2 ${isMobile ? 'w-full' : ''}`}>
            {onNavigate && (
              <Button
                variant="outline"
                size={isMobile ? 'lg' : 'sm'}
                onClick={onNavigate}
                className={`flex items-center gap-1 ${isMobile ? 'w-full min-h-[44px]' : ''}`}
              >
                <Navigation className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
                Directions
              </Button>
            )}
            {onCall && clientPhone && isMobile && (
              <Button
                variant="outline"
                size="lg"
                onClick={onCall}
                className="w-full min-h-[44px] flex items-center gap-2"
              >
                <Phone className="h-5 w-5" />
                Call Client
              </Button>
            )}
            {onViewDetails && (
              <Button
                variant="outline"
                size={isMobile ? 'lg' : 'sm'}
                onClick={onViewDetails}
                className={isMobile ? 'w-full min-h-[44px]' : ''}
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

interface TimesheetStatusProps {
  period: string;
  hours: number;
  status: 'draft' | 'submitted' | 'approved' | 'paid';
  onClick?: () => void;
}

const TimesheetStatus: React.FC<TimesheetStatusProps> = ({ period, hours, status, onClick }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'draft':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          badge: 'bg-gray-500',
          label: 'Draft',
        };
      case 'submitted':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          badge: 'bg-blue-500',
          label: 'Submitted',
        };
      case 'approved':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          badge: 'bg-green-500',
          label: 'Approved',
        };
      case 'paid':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-700',
          badge: 'bg-purple-500',
          label: 'Paid',
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div
      className={`p-4 rounded-lg ${styles.bg} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{period}</p>
          <p className={`text-sm mt-1 ${styles.text}`}>{hours} hours</p>
        </div>
        <span className={`px-3 py-1 text-xs font-bold text-white rounded ${styles.badge}`}>
          {styles.label}
        </span>
      </div>
    </div>
  );
};

interface CredentialAlertProps {
  title: string;
  expiresIn: string;
  severity: 'critical' | 'warning' | 'info';
  onClick?: () => void;
}

const CredentialAlert: React.FC<CredentialAlertProps> = ({ title, expiresIn, severity, onClick }) => {
  const getSeverityStyles = () => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <div
      className={`p-3 rounded-lg border ${styles.bg} ${styles.border} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <AlertCircle className={`h-5 w-5 ${styles.icon} mt-0.5`} />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
          <p className="text-sm text-gray-600 mt-0.5">Expires in {expiresIn}</p>
        </div>
      </div>
    </div>
  );
};

export const CaregiverDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Note: Using mock data for demonstration - API integration in progress
  const todayVisits = [
    {
      clientName: 'John Smith',
      visitType: 'Personal Care',
      time: '8:00 AM',
      duration: '2 hours',
      address: '123 Main St, Austin, TX 78701',
      clientPhone: '(512) 555-0101',
      status: 'upcoming' as const,
      tasks: [
        'Morning routine assistance',
        'Medication reminder',
        'Light housekeeping',
      ],
      onNavigate: () => window.open('https://maps.google.com/?q=123+Main+St+Austin+TX', '_blank', 'noopener,noreferrer'),
      onCheckIn: () => navigate('/caregiver/checkin/visit-1'),
      onViewDetails: () => navigate('/visits/visit-1'),
      onCall: () => window.location.href = 'tel:+15125550101',
    },
    {
      clientName: 'Mary Johnson',
      visitType: 'Medication Assistance',
      time: '10:30 AM',
      duration: '1 hour',
      address: '456 Oak Ave, Austin, TX 78702',
      clientPhone: '(512) 555-0102',
      status: 'upcoming' as const,
      tasks: [
        'Medication administration',
        'Vital signs check',
        'Document observations',
      ],
      onNavigate: () => window.open('https://maps.google.com/?q=456+Oak+Ave+Austin+TX', '_blank', 'noopener,noreferrer'),
      onCheckIn: () => navigate('/caregiver/checkin/visit-2'),
      onViewDetails: () => navigate('/visits/visit-2'),
      onCall: () => window.location.href = 'tel:+15125550102',
    },
    {
      clientName: 'Robert Davis',
      visitType: 'Companionship',
      time: '2:00 PM',
      duration: '3 hours',
      address: '789 Elm St, Austin, TX 78703',
      clientPhone: '(512) 555-0103',
      status: 'upcoming' as const,
      tasks: [
        'Social engagement',
        'Light exercise/walk',
        'Meal preparation',
      ],
      onNavigate: () => window.open('https://maps.google.com/?q=789+Elm+St+Austin+TX', '_blank', 'noopener,noreferrer'),
      onCheckIn: () => navigate('/caregiver/checkin/visit-3'),
      onViewDetails: () => navigate('/visits/visit-3'),
      onCall: () => window.location.href = 'tel:+15125550103',
    },
  ];

  const timesheets = [
    {
      period: 'Current Week (11/10 - 11/16)',
      hours: 32.5,
      status: 'draft' as const,
      onClick: () => navigate('/time-tracking?period=current'),
    },
    {
      period: 'Last Week (11/3 - 11/9)',
      hours: 40,
      status: 'submitted' as const,
      onClick: () => navigate('/time-tracking?period=last'),
    },
    {
      period: 'Week of 10/27 - 11/2',
      hours: 38,
      status: 'approved' as const,
      onClick: () => navigate('/time-tracking?period=2'),
    },
    {
      period: 'Week of 10/20 - 10/26',
      hours: 40,
      status: 'paid' as const,
      onClick: () => navigate('/time-tracking?period=3'),
    },
  ];

  const credentials = [
    {
      title: 'CPR Certification',
      expiresIn: '5 days',
      severity: 'critical' as const,
      onClick: () => navigate('/profile/credentials'),
    },
    {
      title: 'First Aid Certificate',
      expiresIn: '45 days',
      severity: 'warning' as const,
      onClick: () => navigate('/profile/credentials'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="mt-1 text-gray-600">
          Here's your schedule for today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Visits</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{todayVisits.length}</p>
              <p className="mt-1 text-sm text-gray-600">6 hours scheduled</p>
            </div>
            <Calendar className="h-6 w-6 text-primary-600" />
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">32.5</p>
              <p className="mt-1 text-sm text-gray-600">hours worked</p>
            </div>
            <Clock className="h-6 w-6 text-green-600" />
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">8</p>
              <p className="mt-1 text-sm text-gray-600">on your schedule</p>
            </div>
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Credential Alerts */}
      {credentials.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-yellow-600`} />
            <h2 className={`${isMobile ? 'text-xl' : 'text-lg'} font-semibold text-gray-900`}>
              Training & Credential Reminders
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {credentials.map((credential, index) => (
              <CredentialAlert key={index} {...credential} />
            ))}
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`${isMobile ? 'text-xl' : 'text-lg'} font-semibold text-gray-900`}>Today's Schedule</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/schedule')}
          >
            View Full Schedule
          </Button>
        </div>
        <div className="space-y-4">
          {todayVisits.length > 0 ? (
            todayVisits.map((visit, index) => (
              <VisitCard key={index} {...visit} />
            ))
          ) : (
            <Card>
              <CardContent>
                <EmptyState
                  title="No visits scheduled today"
                  description="Enjoy your day off! Check back tomorrow for your schedule."
                  icon={<Calendar className="h-12 w-12" />}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Timesheet Status */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`${isMobile ? 'text-xl' : 'text-lg'} font-semibold text-gray-900`}>Timesheet Status</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/time-tracking')}
          >
            View All
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {timesheets.map((timesheet, index) => (
            <TimesheetStatus key={index} {...timesheet} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/time-tracking')}
            >
              <Clock className="h-5 w-5 mr-2" />
              Submit Timesheet
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/schedule')}
            >
              <Calendar className="h-5 w-5 mr-2" />
              View Schedule
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/profile/credentials')}
            >
              <Award className="h-5 w-5 mr-2" />
              Update Credentials
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/training')}
            >
              <FileText className="h-5 w-5 mr-2" />
              Training Materials
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
