/**
 * Nurse Dashboard
 *
 * Dashboard for nurses showing:
 * - Supervision visits due this month
 * - Care plans requiring review (60-day)
 * - Medication changes requiring approval
 * - Clinical quality metrics
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/hooks';
import { Card, CardHeader, CardContent, Button, EmptyState } from '@/core/components';
import {
  Calendar,
  ClipboardList,
  Pill,
  AlertCircle,
  CheckCircle,
  FileText,
  Users,
  Award,
} from 'lucide-react';

// Type for visit/review status
type StatusType = 'overdue' | 'due-soon' | 'upcoming';

// Shared helper for status styling
const getStatusStyles = (status: StatusType) => {
  switch (status) {
    case 'overdue':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-500',
        text: 'Overdue',
      };
    case 'due-soon':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        badge: 'bg-yellow-500',
        text: 'Due Soon',
      };
    case 'upcoming':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        badge: 'bg-blue-500',
        text: 'Upcoming',
      };
  }
};

interface SupervisionVisitProps {
  clientName: string;
  lastVisit: string;
  dueDate: string;
  status: StatusType;
  visitType: string;
  onClick?: () => void;
}

const SupervisionVisit: React.FC<SupervisionVisitProps> = ({
  clientName,
  lastVisit,
  dueDate,
  status,
  visitType,
  onClick,
}) => {
  const styles = getStatusStyles(status);

  return (
    <div
      className={`p-4 rounded-lg border ${styles.bg} ${styles.border} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">{clientName}</h4>
            <span className={`px-2 py-0.5 text-xs font-bold text-white rounded ${styles.badge}`}>
              {styles.text}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{visitType}</p>
          <div className="mt-2 flex gap-4 text-xs text-gray-500">
            <div>Last visit: {lastVisit}</div>
            <div>Due: {dueDate}</div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
          Schedule
        </Button>
      </div>
    </div>
  );
};

interface CarePlanReviewProps {
  clientName: string;
  planName: string;
  lastReview: string;
  reviewDue: string;
  status: StatusType;
  onClick?: () => void;
}

const CarePlanReview: React.FC<CarePlanReviewProps> = ({
  clientName,
  planName,
  lastReview,
  reviewDue,
  status,
  onClick,
}) => {
  const styles = getStatusStyles(status);

  return (
    <div
      className={`p-4 rounded-lg border ${styles.bg} ${styles.border} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">{clientName}</h4>
            <span className={`px-2 py-0.5 text-xs font-bold text-white rounded ${styles.badge}`}>
              {styles.text}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{planName}</p>
          <div className="mt-2 flex gap-4 text-xs text-gray-500">
            <div>Last review: {lastReview}</div>
            <div>Review due: {reviewDue}</div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
          Review
        </Button>
      </div>
    </div>
  );
};

interface MedicationChangeProps {
  clientName: string;
  medication: string;
  changeType: string;
  requestedBy: string;
  requestDate: string;
  onClick?: () => void;
}

const MedicationChange: React.FC<MedicationChangeProps> = ({
  clientName,
  medication,
  changeType,
  requestedBy,
  requestDate,
  onClick,
}) => {
  return (
    <div
      className={`p-4 rounded-lg border border-yellow-200 bg-yellow-50 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Pill className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-gray-900">{clientName}</h4>
            <p className="text-sm text-gray-700 mt-1">
              <span className="font-medium">{medication}</span> - {changeType}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Requested by {requestedBy} on {requestDate}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            Review
          </Button>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, change, trend, onClick }) => {
  const getTrendColor = () => {
    if (!trend) return 'text-gray-600';
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

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
          {change && (
            <p className={`mt-1 text-sm ${getTrendColor()}`}>
              {change}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">{icon}</div>
      </div>
    </Card>
  );
};

export const NurseDashboard: React.FC = () => {
  useAuth();
  const navigate = useNavigate();

  // Note: Using mock data for demonstration - API integration in progress
  const metrics = [
    {
      label: 'Active Clients',
      value: '42',
      icon: <Users className="h-6 w-6 text-primary-600" />,
      change: '+3 this month',
      trend: 'up' as const,
      onClick: () => navigate('/clients'),
    },
    {
      label: 'Care Plans Active',
      value: '38',
      icon: <ClipboardList className="h-6 w-6 text-green-600" />,
      onClick: () => navigate('/care-plans'),
    },
    {
      label: 'Supervision Visits Due',
      value: '8',
      icon: <Calendar className="h-6 w-6 text-yellow-600" />,
      change: '5 overdue',
      trend: 'down' as const,
      onClick: () => navigate('/supervision-visits'),
    },
    {
      label: 'Quality Score',
      value: '96.2%',
      icon: <Award className="h-6 w-6 text-green-600" />,
      change: '+1.5% improvement',
      trend: 'up' as const,
    },
  ];

  const supervisionVisits = [
    {
      clientName: 'Margaret Wilson',
      lastVisit: '10/15/2024',
      dueDate: '11/10/2024',
      status: 'overdue' as const,
      visitType: '60-day supervision visit',
      onClick: () => navigate('/supervision/margaret-wilson'),
    },
    {
      clientName: 'James Thompson',
      lastVisit: '10/20/2024',
      dueDate: '11/12/2024',
      status: 'overdue' as const,
      visitType: 'Quarterly assessment',
      onClick: () => navigate('/supervision/james-thompson'),
    },
    {
      clientName: 'Patricia Martinez',
      lastVisit: '10/25/2024',
      dueDate: '11/18/2024',
      status: 'due-soon' as const,
      visitType: '60-day supervision visit',
      onClick: () => navigate('/supervision/patricia-martinez'),
    },
  ];

  const carePlanReviews = [
    {
      clientName: 'Robert Anderson',
      planName: 'Post-Surgical Recovery Plan',
      lastReview: '09/15/2024',
      reviewDue: '11/14/2024',
      status: 'due-soon' as const,
      onClick: () => navigate('/care-plans/robert-anderson'),
    },
    {
      clientName: 'Linda Garcia',
      planName: 'Diabetes Management Plan',
      lastReview: '09/20/2024',
      reviewDue: '11/20/2024',
      status: 'upcoming' as const,
      onClick: () => navigate('/care-plans/linda-garcia'),
    },
  ];

  const medicationChanges = [
    {
      clientName: 'John Smith',
      medication: 'Metformin 500mg',
      changeType: 'Dosage increase to 1000mg',
      requestedBy: 'Dr. Johnson',
      requestDate: '11/12/2024',
      onClick: () => navigate('/medications/approval/1'),
    },
    {
      clientName: 'Mary Williams',
      medication: 'Lisinopril 10mg',
      changeType: 'New prescription',
      requestedBy: 'Dr. Smith',
      requestDate: '11/13/2024',
      onClick: () => navigate('/medications/approval/2'),
    },
    {
      clientName: 'David Brown',
      medication: 'Warfarin',
      changeType: 'Discontinuation',
      requestedBy: 'Dr. Lee',
      requestDate: '11/13/2024',
      onClick: () => navigate('/medications/approval/3'),
    },
  ];

  const qualityMetrics = [
    {
      label: 'Visit Completion Rate',
      value: '98.5%',
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      change: '+2.3% vs last month',
      trend: 'up' as const,
    },
    {
      label: 'Care Plan Compliance',
      value: '94.8%',
      icon: <ClipboardList className="h-6 w-6 text-blue-600" />,
      change: '+1.1% vs last month',
      trend: 'up' as const,
    },
    {
      label: 'Medication Adherence',
      value: '96.7%',
      icon: <Pill className="h-6 w-6 text-purple-600" />,
      change: '-0.5% vs last month',
      trend: 'down' as const,
    },
    {
      label: 'Clinical Incidents',
      value: '2',
      icon: <AlertCircle className="h-6 w-6 text-yellow-600" />,
      change: '-3 vs last month',
      trend: 'up' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Nurse Dashboard
        </h1>
        <p className="mt-1 text-gray-600">
          Clinical oversight and quality management
        </p>
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </div>

      {/* Supervision Visits Due */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Supervision Visits Due This Month
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/supervision-visits')}
          >
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {supervisionVisits.length > 0 ? (
            supervisionVisits.map((visit, index) => (
              <SupervisionVisit key={index} {...visit} />
            ))
          ) : (
            <Card>
              <CardContent>
                <EmptyState
                  title="No supervision visits due"
                  description="All supervision visits are up to date"
                  icon={<CheckCircle className="h-12 w-12 text-green-600" />}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Care Plan Reviews and Medication Changes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Care Plan Reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Care Plans Requiring Review
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/care-plans?filter=review-due')}
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {carePlanReviews.map((review, index) => (
              <CarePlanReview key={index} {...review} />
            ))}
          </div>
        </div>

        {/* Medication Changes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Medication Changes Requiring Approval
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/medications/approvals')}
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {medicationChanges.map((change, index) => (
              <MedicationChange key={index} {...change} />
            ))}
          </div>
        </div>
      </div>

      {/* Clinical Quality Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinical Quality Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {qualityMetrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
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
              onClick={() => navigate('/supervision-visits/schedule')}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Schedule Supervision Visit
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/care-plans/create')}
            >
              <ClipboardList className="h-5 w-5 mr-2" />
              Create Care Plan
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/medications')}
            >
              <Pill className="h-5 w-5 mr-2" />
              Review Medications
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/reports/clinical')}
            >
              <FileText className="h-5 w-5 mr-2" />
              Clinical Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
