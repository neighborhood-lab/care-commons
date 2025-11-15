/**
 * Caregiver Dashboard
 *
 * Dashboard for caregivers showing:
 * - Today's schedule with map/directions
 * - Pending tasks by client
 * - Timesheet status (submitted, approved, paid)
 * - Training/credential expiration reminders
 * 
 * Error Recovery Features:
 * - Connection status monitoring with visual indicator
 * - Data freshness indicators showing "last updated" timestamps
 * - Manual refresh buttons on each widget
 * - LocalStorage fallback for offline access to last known data
 * - Stale data warnings (>5 minutes old)
 * - Optimistic UI updates for check-in/check-out actions
 * 
 * Regulatory Context:
 * - Supports audit requirements by showing data freshness
 * - Critical for EVV compliance when connectivity is intermittent
 * - Offline-first design ensures caregivers can access schedules
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useIsMobile } from '@/core/hooks';
import { useConnectionStatus } from '@/hooks';
import { Card, CardHeader, CardContent, Button, EmptyState } from '@/core/components';
import { DataFreshness, StaleDataWarning } from '@/components/DataFreshness';
import { NetworkStatusBanner } from '@/components/sync/NetworkStatusBanner';
import {
  getLocalStorage,
  setLocalStorage,
  getLastUpdated,
  CACHE_KEYS,
  CACHE_EXPIRATION,
} from '@/utils/localStorage';
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
  Wifi,
  WifiOff,
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
  onCheckIn?: () => Promise<void>;
  onCheckOut?: () => Promise<void>;
  onViewDetails?: () => void;
  onCall?: () => void;
  isOptimistic?: boolean;
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
  isOptimistic = false,
}) => {
  const isMobile = useIsMobile();
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleCheckIn = async () => {
    if (!onCheckIn || isProcessing) return;
    setIsProcessing(true);
    try {
      await onCheckIn();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!onCheckOut || isProcessing) return;
    setIsProcessing(true);
    try {
      await onCheckOut();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card padding="md" className={`border-2 ${styles.border} ${styles.bg} ${isOptimistic ? 'opacity-70' : ''}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{clientName}</h3>
              <span className={`px-2 py-0.5 text-xs font-bold text-white rounded ${styles.badge}`}>
                {styles.text}
              </span>
              {isOptimistic && (
                <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-200 rounded">
                  Syncing...
                </span>
              )}
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
              onClick={() => void handleCheckIn()}
              disabled={isProcessing}
              className={isMobile ? 'w-full min-h-[44px] text-base font-semibold' : ''}
            >
              <CheckCircle className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
              {isProcessing ? 'Checking In...' : 'Check In'}
            </Button>
          )}
          {onCheckOut && status === 'in-progress' && (
            <Button
              variant="primary"
              size={isMobile ? 'lg' : 'sm'}
              onClick={() => void handleCheckOut()}
              disabled={isProcessing}
              className={isMobile ? 'w-full min-h-[44px] text-base font-semibold' : ''}
            >
              <CheckCircle className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
              {isProcessing ? 'Checking Out...' : 'Check Out'}
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

// Types for dashboard data
interface VisitData {
  clientName: string;
  visitType: string;
  time: string;
  duration: string;
  address: string;
  clientPhone?: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  tasks: string[];
}

interface TimesheetData {
  period: string;
  hours: number;
  status: 'draft' | 'submitted' | 'approved' | 'paid';
}

interface CredentialData {
  title: string;
  expiresIn: string;
  severity: 'critical' | 'warning' | 'info';
}

interface DashboardStats {
  todayVisitsCount: number;
  todayHoursScheduled: number;
  weekHoursWorked: number;
  activeClientsCount: number;
}

export const CaregiverDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const connectionStatus = useConnectionStatus();

  // State for data with localStorage fallback
  const [visits, setVisits] = useState<VisitData[]>(() =>
    getLocalStorage(CACHE_KEYS.CAREGIVER_DASHBOARD_VISITS, [])
  );
  const [timesheets, setTimesheets] = useState<TimesheetData[]>(() =>
    getLocalStorage(CACHE_KEYS.CAREGIVER_DASHBOARD_TIMESHEETS, [])
  );
  const [credentials, setCredentials] = useState<CredentialData[]>(() =>
    getLocalStorage(CACHE_KEYS.CAREGIVER_DASHBOARD_CREDENTIALS, [])
  );
  const [stats, setStats] = useState<DashboardStats>(() =>
    getLocalStorage(CACHE_KEYS.CAREGIVER_DASHBOARD_STATS, {
      todayVisitsCount: 0,
      todayHoursScheduled: 0,
      weekHoursWorked: 0,
      activeClientsCount: 0,
    })
  );

  // Track refresh state for each widget
  const [isRefreshingVisits, setIsRefreshingVisits] = useState(false);
  const [isRefreshingTimesheets, setIsRefreshingTimesheets] = useState(false);
  const [isRefreshingCredentials, setIsRefreshingCredentials] = useState(false);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);

  // Track last updated times
  const [visitsLastUpdated, setVisitsLastUpdated] = useState<Date | null>(
    () => getLastUpdated(CACHE_KEYS.CAREGIVER_DASHBOARD_VISITS)
  );
  const [timesheetsLastUpdated, setTimesheetsLastUpdated] = useState<Date | null>(
    () => getLastUpdated(CACHE_KEYS.CAREGIVER_DASHBOARD_TIMESHEETS)
  );
  const [credentialsLastUpdated, setCredentialsLastUpdated] = useState<Date | null>(
    () => getLastUpdated(CACHE_KEYS.CAREGIVER_DASHBOARD_CREDENTIALS)
  );
  const [statsLastUpdated, setStatsLastUpdated] = useState<Date | null>(
    () => getLastUpdated(CACHE_KEYS.CAREGIVER_DASHBOARD_STATS)
  );

  // Fetch visits data
  const fetchVisits = useCallback(async () => {
    setIsRefreshingVisits(true);
    try {
      // API integration pending - using mock data for demonstration
      // Future: const response = await fetch('/api/caregiver/visits/today');
      // Future: const data = await response.json();
      
      // Mock data for now
      const mockVisits: VisitData[] = [
        {
          clientName: 'John Smith',
          visitType: 'Personal Care',
          time: '8:00 AM',
          duration: '2 hours',
          address: '123 Main St, Austin, TX 78701',
          clientPhone: '(512) 555-0101',
          status: 'upcoming',
          tasks: [
            'Morning routine assistance',
            'Medication reminder',
            'Light housekeeping',
          ],
        },
        {
          clientName: 'Mary Johnson',
          visitType: 'Medication Assistance',
          time: '10:30 AM',
          duration: '1 hour',
          address: '456 Oak Ave, Austin, TX 78702',
          clientPhone: '(512) 555-0102',
          status: 'upcoming',
          tasks: [
            'Medication administration',
            'Vital signs check',
            'Document observations',
          ],
        },
        {
          clientName: 'Robert Davis',
          visitType: 'Companionship',
          time: '2:00 PM',
          duration: '3 hours',
          address: '789 Elm St, Austin, TX 78703',
          clientPhone: '(512) 555-0103',
          status: 'upcoming',
          tasks: [
            'Social engagement',
            'Light exercise/walk',
            'Meal preparation',
          ],
        },
      ];

      setVisits(mockVisits);
      setLocalStorage(CACHE_KEYS.CAREGIVER_DASHBOARD_VISITS, mockVisits, CACHE_EXPIRATION.FIFTEEN_MINUTES);
      setVisitsLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching visits:', error);
      // Keep using cached data
    } finally {
      setIsRefreshingVisits(false);
    }
  }, []);

  // Fetch timesheets data
  const fetchTimesheets = useCallback(async () => {
    setIsRefreshingTimesheets(true);
    try {
      // API integration pending - using mock data for demonstration
      const mockTimesheets: TimesheetData[] = [
        {
          period: 'Current Week (11/10 - 11/16)',
          hours: 32.5,
          status: 'draft',
        },
        {
          period: 'Last Week (11/3 - 11/9)',
          hours: 40,
          status: 'submitted',
        },
        {
          period: 'Week of 10/27 - 11/2',
          hours: 38,
          status: 'approved',
        },
        {
          period: 'Week of 10/20 - 10/26',
          hours: 40,
          status: 'paid',
        },
      ];

      setTimesheets(mockTimesheets);
      setLocalStorage(CACHE_KEYS.CAREGIVER_DASHBOARD_TIMESHEETS, mockTimesheets, CACHE_EXPIRATION.FIFTEEN_MINUTES);
      setTimesheetsLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    } finally {
      setIsRefreshingTimesheets(false);
    }
  }, []);

  // Fetch credentials data
  const fetchCredentials = useCallback(async () => {
    setIsRefreshingCredentials(true);
    try {
      // API integration pending - using mock data for demonstration
      const mockCredentials: CredentialData[] = [
        {
          title: 'CPR Certification',
          expiresIn: '5 days',
          severity: 'critical',
        },
        {
          title: 'First Aid Certificate',
          expiresIn: '45 days',
          severity: 'warning',
        },
      ];

      setCredentials(mockCredentials);
      setLocalStorage(CACHE_KEYS.CAREGIVER_DASHBOARD_CREDENTIALS, mockCredentials, CACHE_EXPIRATION.ONE_HOUR);
      setCredentialsLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching credentials:', error);
    } finally {
      setIsRefreshingCredentials(false);
    }
  }, []);

  // Fetch stats data
  const fetchStats = useCallback(async () => {
    setIsRefreshingStats(true);
    try {
      // API integration pending - using mock data for demonstration
      const mockStats: DashboardStats = {
        todayVisitsCount: 3,
        todayHoursScheduled: 6,
        weekHoursWorked: 32.5,
        activeClientsCount: 8,
      };

      setStats(mockStats);
      setLocalStorage(CACHE_KEYS.CAREGIVER_DASHBOARD_STATS, mockStats, CACHE_EXPIRATION.FIFTEEN_MINUTES);
      setStatsLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsRefreshingStats(false);
    }
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchVisits(),
      fetchTimesheets(),
      fetchCredentials(),
      fetchStats(),
    ]);
  }, [fetchVisits, fetchTimesheets, fetchCredentials, fetchStats]);

  // Navigation handlers to avoid void operator issues
  const handleNavigateToCredentials = useCallback(() => {
    navigate('/profile/credentials');
  }, [navigate]);

  const handleNavigateToSchedule = useCallback(() => {
    navigate('/schedule');
  }, [navigate]);

  const handleNavigateToTimeTracking = useCallback(() => {
    navigate('/time-tracking');
  }, [navigate]);

  const handleNavigateToTraining = useCallback(() => {
    navigate('/training');
  }, [navigate]);

  // Initial data load
  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  // Optimistic UI for check-in/check-out
  const handleCheckIn = async (visitIndex: number) => {
    const visit = visits[visitIndex];
    if (!visit) return;

    // Optimistically update UI
    const updatedVisits = [...visits];
    if (updatedVisits[visitIndex]) {
      updatedVisits[visitIndex] = { ...updatedVisits[visitIndex]!, status: 'in-progress' };
      setVisits(updatedVisits);
    }

    try {
      // API integration pending - mock implementation
      // Future: await fetch('/api/caregiver/visits/check-in', {
      //   method: 'POST',
      //   body: JSON.stringify({ visitId: visit.id }),
      // });
      
      // Update cache
      setLocalStorage(CACHE_KEYS.CAREGIVER_DASHBOARD_VISITS, updatedVisits, CACHE_EXPIRATION.FIFTEEN_MINUTES);
      setVisitsLastUpdated(new Date());
    } catch (error) {
      console.error('Error checking in:', error);
      // Revert on error
      await fetchVisits();
    }
  };

  const handleCheckOut = async (visitIndex: number) => {
    const visit = visits[visitIndex];
    if (!visit) return;

    // Optimistically update UI
    const updatedVisits = [...visits];
    if (updatedVisits[visitIndex]) {
      updatedVisits[visitIndex] = { ...updatedVisits[visitIndex]!, status: 'completed' };
      setVisits(updatedVisits);
    }

    try {
      // API integration pending - mock implementation
      // Future: await fetch('/api/caregiver/visits/check-out', {
      //   method: 'POST',
      //   body: JSON.stringify({ visitId: visit.id }),
      // });
      
      // Update cache
      setLocalStorage(CACHE_KEYS.CAREGIVER_DASHBOARD_VISITS, updatedVisits, CACHE_EXPIRATION.FIFTEEN_MINUTES);
      setVisitsLastUpdated(new Date());
    } catch (error) {
      console.error('Error checking out:', error);
      // Revert on error
      await fetchVisits();
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Status Banner */}
      <NetworkStatusBanner />

      {/* Connection Status Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name ? user.name.split(' ')[0] : 'Caregiver'}!
          </h1>
          <p className="mt-1 text-gray-600">
            Here's your schedule for today
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {connectionStatus.isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-amber-600" />
              <span className="text-amber-700 font-medium">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Stale Data Warning */}
      <StaleDataWarning
        lastUpdated={statsLastUpdated}
        onRefresh={async () => refreshAll()}
        isRefreshing={isRefreshingStats}
      />

      {/* Quick Stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
          <DataFreshness
            lastUpdated={statsLastUpdated}
            onRefresh={async () => fetchStats()}
            isRefreshing={isRefreshingStats}
            compact
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Visits</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.todayVisitsCount}</p>
                <p className="mt-1 text-sm text-gray-600">{stats.todayHoursScheduled} hours scheduled</p>
              </div>
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.weekHoursWorked}</p>
                <p className="mt-1 text-sm text-gray-600">hours worked</p>
              </div>
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.activeClientsCount}</p>
                <p className="mt-1 text-sm text-gray-600">on your schedule</p>
              </div>
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </Card>
        </div>
      </div>

      {/* Credential Alerts */}
      {credentials.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-yellow-600`} />
              <h2 className={`${isMobile ? 'text-xl' : 'text-lg'} font-semibold text-gray-900`}>
                Training & Credential Reminders
              </h2>
            </div>
            <DataFreshness
              lastUpdated={credentialsLastUpdated}
              onRefresh={async () => fetchCredentials()}
              isRefreshing={isRefreshingCredentials}
              compact
            />
          </div>
          <div className="grid grid-cols-1 gap-3">
            {credentials.map((credential, index) => (
              <CredentialAlert
                key={index}
                {...credential}
                onClick={handleNavigateToCredentials}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`${isMobile ? 'text-xl' : 'text-lg'} font-semibold text-gray-900`}>Today's Schedule</h2>
          <div className="flex items-center gap-3">
            <DataFreshness
              lastUpdated={visitsLastUpdated}
              onRefresh={async () => fetchVisits()}
              isRefreshing={isRefreshingVisits}
              compact
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigateToSchedule}
            >
              View Full Schedule
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {visits.length > 0 ? (
            visits.map((visit, index) => (
              <VisitCard
                key={index}
                {...visit}
                onNavigate={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(visit.address)}`, '_blank', 'noopener,noreferrer')}
                onCheckIn={async () => handleCheckIn(index)}
                onCheckOut={async () => handleCheckOut(index)}
                onViewDetails={() => { navigate(`/visits/visit-${index + 1}`); }}
                onCall={visit.clientPhone ? () => { window.location.href = `tel:${visit.clientPhone ?? ''}`; } : undefined}
              />
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
        <div className="flex items-center justify-between mb-3">
          <h2 className={`${isMobile ? 'text-xl' : 'text-lg'} font-semibold text-gray-900`}>Timesheet Status</h2>
          <div className="flex items-center gap-3">
            <DataFreshness
              lastUpdated={timesheetsLastUpdated}
              onRefresh={async () => fetchTimesheets()}
              isRefreshing={isRefreshingTimesheets}
              compact
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigateToTimeTracking}
            >
              View All
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {timesheets.map((timesheet, index) => (
            <TimesheetStatus
              key={index}
              {...timesheet}
              onClick={() => { 
                const period = index === 0 ? 'current' : index === 1 ? 'last' : String(index);
                navigate(`/time-tracking?period=${period}`);
              }}
            />
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
              onClick={handleNavigateToTimeTracking}
            >
              <Clock className="h-5 w-5 mr-2" />
              Submit Timesheet
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={handleNavigateToSchedule}
            >
              <Calendar className="h-5 w-5 mr-2" />
              View Schedule
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={handleNavigateToCredentials}
            >
              <Award className="h-5 w-5 mr-2" />
              Update Credentials
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={handleNavigateToTraining}
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
