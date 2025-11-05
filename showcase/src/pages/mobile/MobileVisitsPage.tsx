import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MobileLayout } from '../../components/MobileLayout';
import {
  Clock,
  MapPin,
  Phone,
  Navigation,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface Visit {
  id: string;
  clientName: string;
  clientPhone: string;
  time: string;
  startTime: string;
  endTime: string;
  address: string;
  type: string;
  status: 'completed' | 'in-progress' | 'upcoming' | 'missed';
  distance?: string;
}

export const MobileVisitsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('today');

  const visits: Visit[] = [
    {
      id: '1',
      clientName: 'Dorothy Chen',
      clientPhone: '(512) 555-0123',
      time: '2:00 PM - 3:00 PM',
      startTime: '2:00 PM',
      endTime: '3:00 PM',
      address: '123 Main St, Austin, TX 78701',
      type: 'Personal Care',
      status: 'upcoming',
      distance: '2.3 mi',
    },
    {
      id: '2',
      clientName: 'Robert Martinez',
      clientPhone: '(512) 555-0124',
      time: '4:00 PM - 5:30 PM',
      startTime: '4:00 PM',
      endTime: '5:30 PM',
      address: '456 Oak Ave, Austin, TX 78702',
      type: 'Companionship',
      status: 'upcoming',
      distance: '3.7 mi',
    },
    {
      id: '3',
      clientName: 'Margaret Thompson',
      clientPhone: '(512) 555-0125',
      time: '6:00 PM - 7:00 PM',
      startTime: '6:00 PM',
      endTime: '7:00 PM',
      address: '789 Pine Rd, Austin, TX 78703',
      type: 'Personal Care',
      status: 'upcoming',
      distance: '5.1 mi',
    },
    {
      id: '4',
      clientName: 'James Wilson',
      clientPhone: '(512) 555-0126',
      time: '10:00 AM - 11:00 AM',
      startTime: '10:00 AM',
      endTime: '11:00 AM',
      address: '321 Elm St, Austin, TX 78704',
      type: 'Medication Management',
      status: 'completed',
      distance: '1.8 mi',
    },
  ];

  const getStatusBadge = (status: Visit['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded animate-pulse">
            <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
            In Progress
          </span>
        );
      case 'upcoming':
        return (
          <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded">
            Upcoming
          </span>
        );
      case 'missed':
        return (
          <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded">
            <AlertCircle className="h-3 w-3" />
            Missed
          </span>
        );
    }
  };

  const filteredVisits = visits.filter(() => {
    if (filter === 'today') return true;
    if (filter === 'week') return true;
    return true;
  });

  return (
    <MobileLayout title="My Visits">
      <div className="p-4 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'all', label: 'All' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">4</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">1</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-xs text-gray-600">Remaining</div>
            </div>
          </div>
        </div>

        {/* Visits List */}
        <div className="space-y-3">
          {filteredVisits.map((visit) => (
            <div
              key={visit.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {visit.clientName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{visit.time}</span>
                    </div>
                  </div>
                  {getStatusBadge(visit.status)}
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{visit.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a
                      href={`tel:${visit.clientPhone}`}
                      className="text-purple-600 font-medium"
                    >
                      {visit.clientPhone}
                    </a>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">{visit.type}</span>
                  {visit.distance && (
                    <span className="text-xs text-gray-500">{visit.distance} away</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {visit.status === 'upcoming' && (
                <div className="bg-gray-50 px-4 py-3 flex gap-2">
                  <Link
                    to={`/mobile/visits/${visit.id}/clock-in`}
                    className="flex-1 bg-purple-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Clock In
                  </Link>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(visit.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white text-gray-700 py-2 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <Navigation className="h-4 w-4" />
                    Navigate
                  </a>
                </div>
              )}
              {visit.status === 'in-progress' && (
                <div className="bg-gray-50 px-4 py-3 flex gap-2">
                  <Link
                    to={`/mobile/visits/${visit.id}/tasks`}
                    className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Tasks
                  </Link>
                  <Link
                    to={`/mobile/visits/${visit.id}/clock-out`}
                    className="flex-1 bg-gray-700 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    Clock Out
                  </Link>
                </div>
              )}
              {visit.status === 'completed' && (
                <div className="bg-gray-50 px-4 py-3">
                  <Link
                    to={`/mobile/visits/${visit.id}`}
                    className="block text-center text-sm text-gray-600 font-medium"
                  >
                    View Details
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};
