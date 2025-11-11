import React from 'react';
import { MapPin, Clock, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

export const EVVPage: React.FC = () => {
  // Mock EVV records
  const evvRecords = [
    {
      id: '1',
      visitDate: '2025-01-15',
      clientName: 'Mary Johnson',
      caregiverName: 'Sarah Williams',
      clockIn: '09:02 AM',
      clockOut: '11:05 AM',
      location: 'Austin, TX',
      verificationMethod: 'GPS + Mobile App',
      status: 'verified' as const,
      state: 'Texas',
      aggregator: 'HHAeXchange',
    },
    {
      id: '2',
      visitDate: '2025-01-15',
      clientName: 'Robert Davis',
      caregiverName: 'Michael Brown',
      clockIn: '10:05 AM',
      clockOut: '--',
      location: 'Miami, FL',
      verificationMethod: 'GPS + Mobile App',
      status: 'in-progress' as const,
      state: 'Florida',
      aggregator: 'Sandata',
    },
    {
      id: '3',
      visitDate: '2025-01-15',
      clientName: 'Patricia Wilson',
      caregiverName: 'Sarah Williams',
      clockIn: '02:15 PM',
      clockOut: '04:10 PM',
      location: 'Austin, TX',
      verificationMethod: 'GPS + Mobile App',
      status: 'pending-review' as const,
      state: 'Texas',
      aggregator: 'HHAeXchange',
    },
  ];

  const statusColors = {
    verified: 'bg-green-100 text-green-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    'pending-review': 'bg-yellow-100 text-yellow-800',
    'failed': 'bg-red-100 text-red-800',
  };

  const statusIcons = {
    verified: CheckCircle,
    'in-progress': Clock,
    'pending-review': AlertTriangle,
    'failed': AlertTriangle,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Electronic Visit Verification (EVV)</h1>
              <p className="mt-2 text-gray-600">21st Century Cures Act Compliance</p>
            </div>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verified Today</p>
                <p className="text-2xl font-bold text-green-600 mt-1">45</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">8</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">3</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">98.2%</p>
              </div>
              <Shield className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* EVV Records */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Today's EVV Records</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {evvRecords.map((record) => {
              const StatusIcon = statusIcons[record.status];
              return (
                <div key={record.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[record.status]}`}>
                          <div className="flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {record.status.replace('-', ' ')}
                          </div>
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          {record.state}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                          {record.aggregator}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{record.clientName}</h3>
                      <p className="text-gray-600 mb-2">Caregiver: {record.caregiverName}</p>
                      <div className="grid md:grid-cols-3 gap-4 mt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Clock In:</span>
                          <span className="font-medium text-gray-900">{record.clockIn}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Clock Out:</span>
                          <span className="font-medium text-gray-900">{record.clockOut}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium text-gray-900">{record.location}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Verification: {record.verificationMethod}
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Multi-State Aggregators */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Supported Aggregators by State</h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Texas</h3>
                <p className="text-sm text-gray-600">Primary: HHAeXchange</p>
                <p className="text-sm text-gray-500">Alt: Sandata, Tellus</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Florida</h3>
                <p className="text-sm text-gray-600">Multi-aggregator</p>
                <p className="text-sm text-gray-500">HHAeXchange, Sandata, Netsmart</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">California</h3>
                <p className="text-sm text-gray-600">Primary: Sandata</p>
                <p className="text-sm text-gray-500">Alt: HHAeXchange</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">EVV Compliance Features</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Six Required Elements</h4>
                <p className="text-sm text-gray-600">Type of service, individual receiving service, date, location, individual providing service, time</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">GPS Verification</h4>
                <p className="text-sm text-gray-600">State-specific geofencing with accuracy tolerances</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Aggregator Integration</h4>
                <p className="text-sm text-gray-600">Automatic submission to HHAeXchange, Sandata, Tellus, and more</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Audit Trail</h4>
                <p className="text-sm text-gray-600">Complete history of all EVV events for compliance audits</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
