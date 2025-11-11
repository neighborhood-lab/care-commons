import React from 'react';
import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle } from 'lucide-react';

export const SchedulingPage: React.FC = () => {

  // Mock visit data
  const visits = [
    {
      id: '1',
      clientName: 'Mary Johnson',
      caregiverName: 'Sarah Williams',
      address: '123 Oak Street, Austin, TX',
      startTime: '09:00 AM',
      endTime: '11:00 AM',
      status: 'completed' as const,
      services: ['Personal Care', 'Meal Preparation'],
    },
    {
      id: '2',
      clientName: 'Robert Davis',
      caregiverName: 'Michael Brown',
      address: '456 Elm Avenue, Austin, TX',
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      status: 'in-progress' as const,
      services: ['Companionship', 'Light Housekeeping'],
    },
    {
      id: '3',
      clientName: 'Patricia Wilson',
      caregiverName: 'Sarah Williams',
      address: '789 Pine Road, Austin, TX',
      startTime: '02:00 PM',
      endTime: '04:00 PM',
      status: 'scheduled' as const,
      services: ['Personal Care', 'Medication Reminder'],
    },
    {
      id: '4',
      clientName: 'James Martinez',
      caregiverName: 'John Smith',
      address: '321 Maple Lane, Austin, TX',
      startTime: '03:00 PM',
      endTime: '05:00 PM',
      status: 'cancelled' as const,
      services: ['Meal Preparation'],
    },
  ];

  const statusColors = {
    completed: 'bg-green-100 text-green-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    scheduled: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusIcons = {
    completed: CheckCircle,
    'in-progress': Clock,
    scheduled: Calendar,
    cancelled: XCircle,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scheduling & Visits</h1>
              <p className="mt-2 text-gray-600">Manage client visits and caregiver schedules</p>
            </div>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Schedule New Visit
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
                <p className="text-sm text-gray-600">Today's Visits</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">12</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">8</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">3</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600 mt-1">1</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Visits List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {visits.map((visit) => {
              const StatusIcon = statusIcons[visit.status];
              return (
                <div key={visit.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[visit.status]}`}>
                          <div className="flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {visit.status.replace('-', ' ')}
                          </div>
                        </span>
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {visit.startTime} - {visit.endTime}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{visit.clientName}</h3>
                      <p className="text-gray-600 flex items-center gap-1 mb-2">
                        <Users className="w-4 h-4" />
                        Caregiver: {visit.caregiverName}
                      </p>
                      <p className="text-gray-600 flex items-center gap-1 mb-3">
                        <MapPin className="w-4 h-4" />
                        {visit.address}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {visit.services.map((service, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            {service}
                          </span>
                        ))}
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

        {/* Features */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduling Features</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Intelligent Scheduling</h4>
                <p className="text-sm text-gray-600">Optimize routes and match caregivers to clients based on skills, location, and availability</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Real-time Updates</h4>
                <p className="text-sm text-gray-600">Caregivers clock in/out via mobile app with GPS verification</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Conflict Detection</h4>
                <p className="text-sm text-gray-600">Automatically prevent double-booking and scheduling conflicts</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Multi-State Support</h4>
                <p className="text-sm text-gray-600">Handle different state requirements and regulations automatically</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
