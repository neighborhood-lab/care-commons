import React, { useState } from 'react';
import { Card } from '@/core/components';
import {
  MapPin,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Navigation,
  AlertCircle,
} from 'lucide-react';

interface ActiveVisit {
  id: string;
  caregiverName: string;
  clientName: string;
  clockInTime: Date;
  gpsStatus: 'good' | 'weak' | 'none';
  geofenceStatus: 'within' | 'outside';
  state: 'TX' | 'FL' | 'OH' | 'PA' | 'GA' | 'NC' | 'AZ';
}

interface EVVException {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  visitId: string;
  caregiverName: string;
  detectedAt: Date;
  requiresAction: boolean;
}

interface PendingVMUR {
  id: string;
  visitId: string;
  caregiverName: string;
  requestedBy: string;
  requestReason: string;
  requestedAt: Date;
  deadline: Date;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
}

// Mock data - in production, this would come from real-time API/WebSocket
// Using fixed timestamps to avoid impure Date.now() calls during render
const MOCK_ACTIVE_VISITS: ActiveVisit[] = [
  {
    id: '1',
    caregiverName: 'Sarah Johnson',
    clientName: 'John Doe',
    clockInTime: new Date('2024-01-15T14:15:00Z'), // 45 mins ago (example)
    gpsStatus: 'good',
    geofenceStatus: 'within',
    state: 'TX',
  },
  {
    id: '2',
    caregiverName: 'Michael Brown',
    clientName: 'Emily Davis',
    clockInTime: new Date('2024-01-15T13:00:00Z'), // 2 hours ago (example)
    gpsStatus: 'weak',
    geofenceStatus: 'within',
    state: 'FL',
  },
  {
    id: '3',
    caregiverName: 'Jennifer Wilson',
    clientName: 'Robert Smith',
    clockInTime: new Date('2024-01-15T14:30:00Z'), // 30 mins ago (example)
    gpsStatus: 'good',
    geofenceStatus: 'outside',
    state: 'TX',
  },
];

const MOCK_EVV_EXCEPTIONS: EVVException[] = [
  {
    id: '1',
    type: 'GEOFENCE_VIOLATION',
    severity: 'critical',
    description: 'Clock-in location 245m from client address',
    visitId: '3',
    caregiverName: 'Jennifer Wilson',
    detectedAt: new Date('2024-01-15T14:30:00Z'), // 30 mins ago (example)
    requiresAction: true,
  },
  {
    id: '2',
    type: 'GPS_ACCURACY_LOW',
    severity: 'warning',
    description: 'GPS accuracy 180m (below 100m threshold)',
    visitId: '2',
    caregiverName: 'Michael Brown',
    detectedAt: new Date('2024-01-15T14:45:00Z'), // 15 mins ago (example)
    requiresAction: false,
  },
  {
    id: '3',
    type: 'CLOCK_IN_TOO_EARLY',
    severity: 'error',
    description: 'Clock-in 18 minutes early (TX allows max 10 minutes)',
    visitId: '5',
    caregiverName: 'David Martinez',
    detectedAt: new Date('2024-01-15T14:00:00Z'), // 1 hour ago (example)
    requiresAction: true,
  },
];

const MOCK_PENDING_VMURS: PendingVMUR[] = [
  {
    id: '1',
    visitId: '101',
    caregiverName: 'Sarah Johnson',
    requestedBy: 'Admin User',
    requestReason: 'FORGOT_TO_CLOCK',
    requestedAt: new Date('2024-01-14T15:00:00Z'), // 1 day ago (example)
    deadline: new Date('2024-01-21T15:00:00Z'), // 6 days from now (example)
    status: 'PENDING',
  },
  {
    id: '2',
    visitId: '102',
    caregiverName: 'Michael Brown',
    requestedBy: 'Coordinator Smith',
    requestReason: 'GPS_UNAVAILABLE',
    requestedAt: new Date('2024-01-15T03:00:00Z'), // 12 hours ago (example)
    deadline: new Date('2024-01-21T15:00:00Z'), // 6.5 days from now (example)
    status: 'PENDING',
  },
];

export const OperationsCenter: React.FC = () => {
  const [activeVisits] = useState<ActiveVisit[]>(MOCK_ACTIVE_VISITS);
  const [exceptions] = useState<EVVException[]>(MOCK_EVV_EXCEPTIONS);
  const [pendingVMURs] = useState<PendingVMUR[]>(MOCK_PENDING_VMURS);

  const getGPSStatusColor = (status: ActiveVisit['gpsStatus']) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50';
      case 'weak':
        return 'text-yellow-600 bg-yellow-50';
      case 'none':
        return 'text-red-600 bg-red-50';
    }
  };

  const getGeofenceStatusColor = (status: ActiveVisit['geofenceStatus']) => {
    return status === 'within'
      ? 'text-green-600 bg-green-50'
      : 'text-red-600 bg-red-50';
  };

  const getSeverityIcon = (severity: EVVException['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const formatDuration = (date: Date) => {
    const now = new Date();
    const minutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Visits - Live GPS Tracking */}
      <Card className="lg:col-span-2" padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Active Visits - Live GPS Tracking
            </h3>
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              {activeVisits.length} Active
            </span>
          </div>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View Map
          </button>
        </div>
        <div className="space-y-4">
          {activeVisits.map((visit) => (
            <div
              key={visit.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {visit.caregiverName} → {visit.clientName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Started {formatDuration(visit.clockInTime)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getGPSStatusColor(visit.gpsStatus)}`}
                    >
                      <MapPin className="h-3 w-3" />
                      GPS: {visit.gpsStatus.toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getGeofenceStatusColor(visit.geofenceStatus)}`}
                    >
                      Geofence: {visit.geofenceStatus.toUpperCase()}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {visit.state}
                    </span>
                  </div>
                </div>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Track
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* EVV Exceptions - Instant Resolution */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">EVV Exceptions</h3>
          <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            {exceptions.filter((e) => e.requiresAction).length} Require Action
          </span>
        </div>
        <div className="space-y-3">
          {exceptions.map((exception) => (
            <div
              key={exception.id}
              className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(exception.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {exception.type.replace(/_/g, ' ')}
                    </p>
                    {exception.requiresAction && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                        Action Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {exception.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {exception.caregiverName} • {formatDuration(exception.detectedAt)}
                  </p>
                </div>
                <button className="text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap">
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pending VMURs (Texas) */}
      <Card padding="md">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Pending VMURs (Texas)
            </h3>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Visit Maintenance Unlock Requests requiring approval
          </p>
        </div>
        <div className="space-y-3">
          {pendingVMURs.map((vmur) => (
            <div
              key={vmur.id}
              className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {vmur.caregiverName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Reason: {vmur.requestReason.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Requested by {vmur.requestedBy} • {formatDuration(vmur.requestedAt)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Deadline: {vmur.deadline.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs text-green-600 hover:text-green-700 font-medium">
                    Approve
                  </button>
                  <button className="text-xs text-red-600 hover:text-red-700 font-medium">
                    Deny
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
