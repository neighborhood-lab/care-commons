/**
 * Family Schedule Page
 *
 * Shows upcoming care visits and appointments with detailed timeline
 */

import React, { useState } from 'react';
import { Card } from '@/core/components';
import { useFamilyDashboard } from '../hooks';
import { useAuth } from '@/core/hooks';
import { VisitCard, VisitTimeline } from '../components';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { UUID } from '@care-commons/core/browser';
import type { VisitSummary } from '@care-commons/family-engagement';

export const SchedulePage: React.FC = () => {
  const { user } = useAuth();
  const familyMemberId = user?.id as UUID | null;
  const { data: dashboardData, isLoading } = useFamilyDashboard(familyMemberId);

  const [selectedVisit, setSelectedVisit] = useState<VisitSummary | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const visits = dashboardData?.upcomingVisits || [];
  const clientName = dashboardData?.client?.name || 'your loved one';

  // Group visits by date
  const groupedVisits = visits.reduce((acc, visit) => {
    const date = new Date(visit.scheduledStartTime).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(visit);
    return acc;
  }, {} as Record<string, VisitSummary[]>);

  const sortedDates = Object.keys(groupedVisits).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-gray-200 rounded-lg" />
        <div className="h-96 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Care Schedule</h1>
          <p className="text-gray-600 mt-1">
            Upcoming visits and appointments for {clientName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">This Week</span>
          </button>
          <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode('week')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'week'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Week View
        </button>
        <button
          onClick={() => setViewMode('month')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'month'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Month View
        </button>
      </div>

      {visits.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Upcoming Visits
            </h3>
            <p className="text-gray-600">
              There are no scheduled visits at this time.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visits List */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Upcoming Visits ({visits.length})
            </h2>

            {sortedDates.map((date) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="space-y-3">
                  {groupedVisits[date]?.map((visit) => (
                    <div
                      key={visit.id}
                      onClick={() => setSelectedVisit(visit)}
                      className={`transition-all ${
                        selectedVisit?.id === visit.id ? 'ring-2 ring-primary-500 rounded-lg' : ''
                      }`}
                    >
                      <VisitCard visit={visit} onClick={() => setSelectedVisit(visit)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Visit Details / Timeline */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card padding="lg">
              {selectedVisit ? (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Visit Details
                  </h3>

                  {/* Visit Info */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      {selectedVisit.caregiverPhotoUrl ? (
                        <img
                          src={selectedVisit.caregiverPhotoUrl}
                          alt={selectedVisit.caregiverName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
                          {selectedVisit.caregiverName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">
                          {selectedVisit.caregiverName}
                        </div>
                        <div className="text-sm text-gray-600">Caregiver</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      <div className="flex items-center justify-between py-2 border-t border-gray-200">
                        <span className="text-gray-600">Date</span>
                        <span className="font-medium">
                          {new Date(selectedVisit.scheduledStartTime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-t border-gray-200">
                        <span className="text-gray-600">Time</span>
                        <span className="font-medium">
                          {new Date(selectedVisit.scheduledStartTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {new Date(selectedVisit.scheduledEndTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-t border-gray-200">
                        <span className="text-gray-600">Status</span>
                        <span className="font-medium capitalize">
                          {selectedVisit.status.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visit Timeline */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Visit Timeline</h4>
                    <VisitTimeline visit={selectedVisit} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">
                    Select a visit to view details
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
