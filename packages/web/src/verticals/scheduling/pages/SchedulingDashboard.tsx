/**
 * SchedulingDashboard - main page for visit scheduling workflow
 */

import React, { useState } from 'react';
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import { LoadingSpinner, ErrorMessage, Card } from '@/core/components';
import { useVisits, useUnassignedVisits } from '../hooks';
import { UnassignedVisitsPanel, VisitAssignmentModal, VisitCard } from '../components';
import type { VisitSearchFilters } from '../types';

export const SchedulingDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [assigningVisitId, setAssigningVisitId] = useState<string | null>(null);

  // Calculate date range for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const filters: VisitSearchFilters = {
    dateFrom: today,
    dateTo: tomorrow,
  };

  const { data: visitsData, isLoading, error, refetch } = useVisits(filters, 1, 100);
  const { data: unassignedVisits } = useUnassignedVisits(
    undefined,
    today,
    tomorrow
  );

  const handleAssignVisit = (visitId: string) => {
    setAssigningVisitId(visitId);
  };

  const handleCloseModal = () => {
    setAssigningVisitId(null);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={(error as Error).message || 'Failed to load visits'}
        retry={refetch}
      />
    );
  }

  const visits = visitsData?.items || [];
  const assignedVisits = visits.filter((v) => v.assignedCaregiverId);
  const completedVisits = visits.filter((v) => v.status === 'COMPLETED');
  const inProgressVisits = visits.filter((v) => v.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visit Scheduling</h1>
        <p className="text-gray-600 mt-1">
          Manage and assign visits to caregivers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Visits</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {visits.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">For today</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unassigned</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {unassignedVisits?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Need caregiver</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {inProgressVisits.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Ongoing visits</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {completedVisits.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {visits.length > 0
                ? `${Math.round((completedVisits.length / visits.length) * 100)}% done`
                : 'No visits'}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Unassigned Visits */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-6">
              <UnassignedVisitsPanel
                dateFrom={today}
                dateTo={tomorrow}
                onAssignVisit={handleAssignVisit}
              />
            </div>
          </Card>
        </div>

        {/* Right Column - Today's Schedule */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Today's Schedule
                </h2>
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {visits.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No visits scheduled</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Visits for today will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group visits by status */}
                  {inProgressVisits.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        In Progress ({inProgressVisits.length})
                      </h3>
                      <div className="space-y-3">
                        {inProgressVisits.map((visit) => (
                          <VisitCard
                            key={visit.id}
                            visit={visit}
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {assignedVisits.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Assigned ({assignedVisits.length})
                      </h3>
                      <div className="space-y-3">
                        {assignedVisits
                          .filter((v) => v.status !== 'IN_PROGRESS' && v.status !== 'COMPLETED')
                          .map((visit) => (
                            <VisitCard
                              key={visit.id}
                              visit={visit}
                              compact
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {completedVisits.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Completed ({completedVisits.length})
                      </h3>
                      <div className="space-y-3">
                        {completedVisits.map((visit) => (
                          <VisitCard
                            key={visit.id}
                            visit={visit}
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Assignment Modal */}
      {assigningVisitId && (
        <VisitAssignmentModal
          visitId={assigningVisitId}
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};
