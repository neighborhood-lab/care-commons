import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShowcaseLayout } from '../components/ShowcaseLayout';
import { useClientProvider } from '@/core/providers/context';
import { Plus, Search, Mail, Phone, MapPin } from 'lucide-react';
import type { Client } from '@/verticals/client-demographics/types';

export const ClientDemographicsPage: React.FC = () => {
  const clientProvider = useClientProvider();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['clients', { query: searchQuery }],
    queryFn: () => clientProvider.getClients({ query: searchQuery }),
  });

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ShowcaseLayout
      title="Client Demographics"
      description="Comprehensive client profiles with demographics, contact information, and medical details"
    >
      {/* Search and Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Total Clients</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{data?.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Active</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">
            {data?.items.filter(c => c.status === 'ACTIVE').length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Avg. Age</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {data?.items.length
              ? Math.round(
                  data.items.reduce((sum, c) => sum + calculateAge(c.dateOfBirth), 0) /
                    data.items.length
                )
              : 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Cities</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {data?.items.length
              ? new Set(data.items.map(c => c.primaryAddress.city)).size
              : 0}
          </p>
        </div>
      </div>

      {/* Client List */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading clients...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">Failed to load clients. Please try again.</p>
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No clients found</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {client.firstName} {client.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Age {calculateAge(client.dateOfBirth)} • {client.gender}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                    client.status
                  )}`}
                >
                  {client.status}
                </span>
              </div>

              <div className="space-y-2">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="truncate">
                    {client.primaryAddress.city}, {client.primaryAddress.stateCode}
                  </span>
                </div>
              </div>

              {(client.medicaidNumber || client.medicareNumber) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    {client.medicaidNumber && <span>Medicaid: {client.medicaidNumber}</span>}
                    {client.medicaidNumber && client.medicareNumber && <span> • </span>}
                    {client.medicareNumber && <span>Medicare: {client.medicareNumber}</span>}
                  </p>
                </div>
              )}

              {client.emergencyContacts && client.emergencyContacts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-700 mb-1">Emergency Contact</p>
                  <p className="text-xs text-gray-600">
                    {client.emergencyContacts[0].name} ({client.emergencyContacts[0].relationship})
                    <br />
                    {client.emergencyContacts[0].phone}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ShowcaseLayout>
  );
};
