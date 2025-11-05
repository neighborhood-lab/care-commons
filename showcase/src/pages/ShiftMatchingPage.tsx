import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShowcaseLayout } from '../components/ShowcaseLayout';
import { useShiftMatchingProvider } from '@/core/providers/context';
import { Calendar, Clock, DollarSign, Users, Award } from 'lucide-react';
import { format } from 'date-fns';
import type { ShiftListing } from '../types/showcase-types.js';

export const ShiftMatchingPage: React.FC = () => {
  const shiftProvider = useShiftMatchingProvider();

  const { data, isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => shiftProvider.getShiftListings({}),
  });

  return (
    <ShowcaseLayout
      title="Shift Matching"
      description="Smart shift matching connecting caregivers with client needs"
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Total Shifts</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{data?.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Open</p>
          <p className="mt-1 text-2xl font-semibold text-blue-600">
            {data?.items.filter((s: ShiftListing) => s.status === 'OPEN').length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Filled</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">
            {data?.items.filter((s: ShiftListing) => s.status === 'FILLED').length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Applications</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {data?.items.reduce((sum: number, s: ShiftListing) => sum + (s.applicationCount || 0), 0) || 0}
          </p>
        </div>
      </div>

      {/* Shifts List */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-4">
          {data.items.map((shift: ShiftListing) => (
            <div
              key={shift.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{shift.title}</h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        shift.status === 'OPEN'
                          ? 'bg-blue-100 text-blue-800'
                          : shift.status === 'FILLED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {shift.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{shift.description}</p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{format(new Date(shift.startTime), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>
                        {format(new Date(shift.startTime), 'h:mm a')} -{' '}
                        {format(new Date(shift.endTime), 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span>${shift.hourlyRate}/hour</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{shift.applicationCount} applications</span>
                    </div>
                  </div>
                </div>
              </div>

              {shift.requiredCertifications && shift.requiredCertifications.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-gray-400" />
                    <p className="text-xs font-medium text-gray-700">Required Certifications</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {shift.requiredCertifications.map((cert: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {shift.preferredSpecializations && shift.preferredSpecializations.length > 0 && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Preferred Specializations</p>
                  <div className="flex flex-wrap gap-1">
                    {shift.preferredSpecializations.map((spec: string, idx: number) => (
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
