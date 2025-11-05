import React, { useState } from 'react';
import { MobileLayout } from '../../components/MobileLayout';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Heart,
  ChevronRight,
  Search,
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  age: number;
  address: string;
  phone: string;
  nextVisit?: string;
  carePlan: string;
  conditions: string[];
  status: 'active' | 'inactive';
}

export const MobileClientsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const clients: Client[] = [
    {
      id: '1',
      name: 'Dorothy Chen',
      age: 78,
      address: '123 Main St, Austin, TX',
      phone: '(512) 555-0123',
      nextVisit: 'Today at 2:00 PM',
      carePlan: 'Personal Care',
      conditions: ['Diabetes', 'Hypertension'],
      status: 'active',
    },
    {
      id: '2',
      name: 'Robert Martinez',
      age: 72,
      address: '456 Oak Ave, Austin, TX',
      phone: '(512) 555-0124',
      nextVisit: 'Today at 4:00 PM',
      carePlan: 'Companionship',
      conditions: ['Dementia'],
      status: 'active',
    },
    {
      id: '3',
      name: 'Margaret Thompson',
      age: 85,
      address: '789 Pine Rd, Austin, TX',
      phone: '(512) 555-0125',
      nextVisit: 'Today at 6:00 PM',
      carePlan: 'Personal Care',
      conditions: ['Arthritis', 'Heart Disease'],
      status: 'active',
    },
    {
      id: '4',
      name: 'James Wilson',
      age: 68,
      address: '321 Elm St, Austin, TX',
      phone: '(512) 555-0126',
      carePlan: 'Medication Management',
      conditions: ['COPD'],
      status: 'active',
    },
  ];

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MobileLayout title="My Clients">
      <div className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
              <div className="text-xs text-gray-600">Total Clients</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {clients.filter((c) => c.status === 'active').length}
              </div>
              <div className="text-xs text-gray-600">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {clients.filter((c) => c.nextVisit).length}
              </div>
              <div className="text-xs text-gray-600">Today</div>
            </div>
          </div>
        </div>

        {/* Clients List */}
        <div className="space-y-3">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{client.name}</h3>
                      <p className="text-sm text-gray-600">Age {client.age}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>

                {/* Client Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{client.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <a
                      href={`tel:${client.phone}`}
                      className="text-purple-600 font-medium"
                    >
                      {client.phone}
                    </a>
                  </div>
                  {client.nextVisit && (
                    <div className="flex items-center gap-2 text-purple-600">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{client.nextVisit}</span>
                    </div>
                  )}
                </div>

                {/* Care Plan & Conditions */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{client.carePlan}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Heart className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {client.conditions.map((condition, index) => (
                        <span
                          key={index}
                          className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded"
                        >
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              {client.nextVisit && (
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex gap-2">
                  <a
                    href={`tel:${client.phone}`}
                    className="flex-1 bg-white text-gray-700 text-center py-2 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
                  >
                    Call
                  </a>
                  <button className="flex-1 bg-purple-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm">
                    View Details
                  </button>
                </div>
              )}
            </div>
          ))}

          {filteredClients.length === 0 && (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No clients found</p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};
