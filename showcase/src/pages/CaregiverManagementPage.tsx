import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShowcaseLayout } from '../components/ShowcaseLayout';
import { useCaregiverProvider } from '@/core/providers/context';
import { Search, Award, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { Certification } from '../types/showcase-types.js';

export const CaregiverManagementPage: React.FC = () => {
  const caregiverProvider = useCaregiverProvider();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['caregivers', { query: searchQuery }],
    queryFn: () => caregiverProvider.getCaregivers({ query: searchQuery }),
  });

  return (
    <ShowcaseLayout
      title="Caregiver Management"
      description="Manage caregiver profiles, certifications, and specializations"
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search caregivers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Total Caregivers</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{data?.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Active</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">
            {data?.items.filter(c => c.status === 'ACTIVE').length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Avg. Rate</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            ${data?.items.length
              ? (data.items.reduce((sum, c) => sum + (c.hourlyRate || 0), 0) / data.items.length).toFixed(2)
              : '0.00'}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Certifications</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {data?.items.reduce((sum, c) => sum + (c.certifications?.length || 0), 0) || 0}
          </p>
        </div>
      </div>

      {/* Caregivers List */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((caregiver) => (
            <div
              key={caregiver.id}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {caregiver.firstName} {caregiver.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{caregiver.email}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  {caregiver.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>${caregiver.hourlyRate}/hr</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Since {format(new Date(caregiver.hireDate), 'MMM yyyy')}</span>
                </div>
              </div>

              {caregiver.certifications && caregiver.certifications.length > 0 && (
                <div className="border-t border-gray-100 pt-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-gray-400" />
                    <p className="text-xs font-medium text-gray-700">Certifications</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {caregiver.certifications.map((cert: Certification, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                      >
                        {cert.type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {caregiver.specializations && caregiver.specializations.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Specializations</p>
                  <div className="flex flex-wrap gap-1">
                    {caregiver.specializations.map((spec: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                      >
                        {spec.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ShowcaseLayout>
  );
};
