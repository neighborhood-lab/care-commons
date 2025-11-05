/**
 * Coordinator Dashboard
 * Operational view for day-to-day visit management and EVV exceptions
 */

import React from 'react';
import { StatCard } from '../components/StatCard';
import { Card, CardHeader, CardContent } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import { Badge } from '../../../core/components/Badge';
import { useDashboardStats, useEVVExceptions } from '../hooks/useAnalytics';
import {
  Clock,
  CheckCircle,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Check,
  X,
  Eye,
} from 'lucide-react';

export function CoordinatorDashboard() {
  const { data: stats, isLoading: statsLoading, refetch } = useDashboardStats();
  const { data: exceptions, isLoading: exceptionsLoading } = useEVVExceptions();

  if (statsLoading || exceptionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleApprove = (exceptionId: string) => {
    console.log('Approving exception:', exceptionId);
    // In real implementation, call API to approve
  };

  const handleReview = (exceptionId: string) => {
    console.log('Reviewing exception:', exceptionId);
    // In real implementation, navigate to detail view
  };

  const handleReject = (exceptionId: string) => {
    console.log('Rejecting exception:', exceptionId);
    // In real implementation, call API to reject
  };

  const getExceptionBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coordinator Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor daily operations and manage exceptions</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              refetch();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Today's Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="In Progress"
            value={stats?.inProgress || 0}
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="Completed Today"
            value={stats?.completedToday || 0}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Upcoming"
            value={stats?.upcoming || 0}
            icon={Calendar}
            color="gray"
          />
          <StatCard
            title="Needs Review"
            value={stats?.needsReview || 0}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* EVV Exception Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">EVV Exceptions Requiring Review</h2>
              <Badge variant="warning">{exceptions?.length || 0} pending</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {exceptions && exceptions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Visit Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Exception Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {exceptions.map((exception) => (
                      <tr key={exception.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {exception.caregiverName}
                            </p>
                            <p className="text-sm text-gray-500">
                              → {exception.clientName}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(exception.visitDate).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={getExceptionBadgeVariant(exception.severity)}>
                            {exception.exceptionType.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-900">{exception.description}</p>
                          {exception.complianceFlags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {exception.complianceFlags.map((flag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"
                                >
                                  {flag.replace(/_/g, ' ').toLowerCase()}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleApprove(exception.id)}
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleReview(exception.id)}
                              title="Review"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleReject(exception.id)}
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm">No EVV exceptions requiring review at this time</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-medium text-gray-600">Today's Visits</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-sm font-medium text-green-600">
                    {stats?.completedToday || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="text-sm font-medium text-blue-600">
                    {stats?.inProgress || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Upcoming</span>
                  <span className="text-sm font-medium text-gray-600">
                    {stats?.upcoming || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-medium text-gray-600">Exception Status</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending Review</span>
                  <span className="text-sm font-medium text-orange-600">
                    {stats?.needsReview || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Resolved Today</span>
                  <span className="text-sm font-medium text-green-600">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Escalated</span>
                  <span className="text-sm font-medium text-red-600">0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-medium text-gray-600">Quick Actions</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="secondary" size="sm" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Schedule
                </Button>
                <Button variant="secondary" size="sm" className="w-full justify-start">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Review All Exceptions
                </Button>
                <Button variant="secondary" size="sm" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Active Visits Map
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
