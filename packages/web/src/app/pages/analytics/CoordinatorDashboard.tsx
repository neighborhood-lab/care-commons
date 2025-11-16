/**
 * Coordinator Dashboard Page
 * Real-time operational dashboard for care coordinators
 */


import {
  Calendar,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  MapPin,
  Activity,
} from 'lucide-react';
import { Card, LoadingSpinner, ErrorMessage, Badge } from '@/core/components';
import { KPICard } from './components/KPICard';
import { AlertsList } from './components/charts/AlertsList';
import {
  useDashboardStats,
  useComplianceAlerts,
  useEVVExceptions,
} from '@/verticals/analytics-reporting/hooks/useAnalytics';

const REAL_TIME_REFRESH_INTERVAL = 60000; // 60 seconds

export function CoordinatorDashboard() {
  // Fetch data with real-time polling
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    error: statsError,
  } = useDashboardStats({ refetchInterval: REAL_TIME_REFRESH_INTERVAL });

  const {
    data: alerts,
    isLoading: alertsLoading,
    error: alertsError,
  } = useComplianceAlerts(
    {
      dateRange: {
        startDate: new Date(),
        endDate: new Date(),
      },
    },
    { refetchInterval: REAL_TIME_REFRESH_INTERVAL }
  );

  const {
    data: evvExceptions,
    isLoading: exceptionsLoading,
    error: exceptionsError,
  } = useEVVExceptions(
    {
      dateRange: {
        startDate: new Date(),
        endDate: new Date(),
      },
    },
    { refetchInterval: REAL_TIME_REFRESH_INTERVAL }
  );

  const isLoading = statsLoading || alertsLoading || exceptionsLoading;
  const error = statsError ?? alertsError ?? exceptionsError;

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message="Failed to load dashboard data. Please try again." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coordinator Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Real-time operational overview
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Activity className="h-4 w-4 animate-pulse text-green-600" />
            <span>Auto-refreshing (60s)</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Today's Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <KPICard
              title="In Progress"
              value={dashboardStats?.inProgress ?? 0}
              subtitle="Visits happening now"
              icon={<Clock className="h-8 w-8 text-blue-600" />}
            />
            <KPICard
              title="Completed Today"
              value={dashboardStats?.completedToday ?? 0}
              subtitle="Successfully finished"
              icon={<CheckCircle className="h-8 w-8 text-green-600" />}
            />
            <KPICard
              title="Upcoming"
              value={dashboardStats?.upcoming ?? 0}
              subtitle="Next 24 hours"
              icon={<Calendar className="h-8 w-8 text-purple-600" />}
            />
            <KPICard
              title="Needs Review"
              value={dashboardStats?.needsReview ?? 0}
              subtitle="Requires attention"
              icon={<AlertCircle className="h-8 w-8 text-red-600" />}
            />
          </div>

          {/* EVV Issues */}
          <Card padding="md" className="mb-6">
            <Card.Header
              title="EVV Issues"
              subtitle="Electronic Visit Verification exceptions"
              action={
                <Badge variant={evvExceptions && evvExceptions.length > 0 ? 'warning' : 'success'}>
                  {evvExceptions?.length ?? 0} Issues
                </Badge>
              }
            />
            <Card.Content>
              {evvExceptions && evvExceptions.length > 0 ? (
                <div className="space-y-3">
                  {evvExceptions.slice(0, 5).map((exception) => (
                    <div
                      key={exception.id}
                      className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {exception.caregiverName} - {exception.clientName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {exception.description}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="error">{exception.exceptionType}</Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(exception.visitDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          exception.status === 'PENDING'
                            ? 'warning'
                            : exception.status === 'APPROVED'
                            ? 'success'
                            : 'error'
                        }
                      >
                        {exception.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-400" />
                  <p>No EVV issues at this time</p>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Caregiver Status (Mock Data) */}
          <Card padding="md" className="mb-6">
            <Card.Header
              title="Caregiver Status"
              subtitle="Current availability"
            />
            <Card.Content>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">12</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">8</div>
                  <div className="text-sm text-gray-600">On Visit</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Clock className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">5</div>
                  <div className="text-sm text-gray-600">Off Duty</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">2</div>
                  <div className="text-sm text-gray-600">Sick/PTO</div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Client Alerts */}
          <Card padding="md">
            <Card.Header
              title="Client Alerts"
              subtitle="High-priority client issues"
              action={
                <Badge variant={alerts && alerts.length > 0 ? 'error' : 'success'}>
                  {alerts?.length ?? 0} Alerts
                </Badge>
              }
            />
            <Card.Content>
              {alerts && alerts.length > 0 ? (
                <AlertsList
                  alerts={alerts}
                  onAlertClick={(alert) => console.log('Navigate to alert:', alert)}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-400" />
                  <p>No client alerts at this time</p>
                </div>
              )}
            </Card.Content>
          </Card>
        </>
      )}
    </div>
  );
}
