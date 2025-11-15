import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer, View, SlotInfo } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus, List, Layout } from 'lucide-react';
import { useCalendarVisits, useVisitApi, useCaregiverAvailability } from '../hooks/useVisits';
import { useAuth } from '@/core/hooks';
import { EmptyState } from '@/core/components/feedback/EmptyState';
import { MiniCalendar, VisitStatusLegend } from '../components';
import type { Visit } from '../types';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// Color palette for caregivers (reusable across visits)
const CAREGIVER_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#84CC16', // lime
  '#6366F1', // indigo
];

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Visit;
  color: string;
}

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop<CalendarEvent>(Calendar);

export const CalendarView: React.FC = () => {
  const { user } = useAuth();
  const visitApi = useVisitApi();
  const queryClient = useQueryClient();

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('week');
  const [showAvailability, setShowAvailability] = useState(false);
  const [showMiniCalendar, setShowMiniCalendar] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedBranches] = useState<string[]>([]);

  // Calculate date range for calendar based on current view
  const { startDate, endDate } = useMemo(() => {
    const start = moment(currentDate).startOf(view === 'month' ? 'month' : 'week').toDate();
    const end = moment(currentDate).endOf(view === 'month' ? 'month' : 'week').toDate();
    return { startDate: start, endDate: end };
  }, [currentDate, view]);

  // Fetch visits for calendar
  const branchIds = selectedBranches.length > 0 ? selectedBranches : undefined;
  const {
    data: visits = [],
    isLoading,
    error,
    refetch,
    isRefetching,
    failureCount,
  } = useCalendarVisits(startDate, endDate, branchIds);

  // Fetch caregiver availability (gracefully handle failures)
  const {
    data: caregiverAvailability = [],
    isLoading: isLoadingAvailability,
    error: availabilityError,
  } = useCaregiverAvailability(currentDate, branchIds);

  // Calculate days with visits for mini calendar
  const daysWithVisits = useMemo(() => {
    const days = new Set<string>();
    for (const visit of visits) {
      const dateKey = moment(visit.scheduledDate).format('YYYY-MM-DD');
      days.add(dateKey);
    }
    return days;
  }, [visits]);

  // Calculate weekly visit count
  const weeklyVisitCount = useMemo(() => {
    const weekStart = moment(currentDate).startOf('week');
    const weekEnd = moment(currentDate).endOf('week');
    
    return visits.filter(visit => {
      const visitDate = moment(visit.scheduledDate);
      return visitDate.isSameOrAfter(weekStart) && visitDate.isSameOrBefore(weekEnd);
    }).length;
  }, [visits, currentDate]);

  // Create a color map for caregivers
  const caregiverColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueCaregiverIds = new Set<string>();

    for (const visit of visits) {
      if (visit.assignedCaregiverId != null) {
        uniqueCaregiverIds.add(visit.assignedCaregiverId);
      }
    }

    for (const [index, caregiverId] of Array.from(uniqueCaregiverIds).entries()) {
      map.set(caregiverId, CAREGIVER_COLORS[index % CAREGIVER_COLORS.length]!);
    }

    return map;
  }, [visits]);

  // Convert visits to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return visits.map(visit => {
      const scheduledDate = typeof visit.scheduledDate === 'string'
        ? new Date(visit.scheduledDate)
        : visit.scheduledDate;

      // Parse time strings (HH:MM) and combine with date
      const [startHour, startMinute] = visit.scheduledStartTime.split(':').map(Number);
      const [endHour, endMinute] = visit.scheduledEndTime.split(':').map(Number);

      const start = new Date(scheduledDate);
      start.setHours(startHour ?? 0, startMinute ?? 0, 0, 0);

      const end = new Date(scheduledDate);
      end.setHours(endHour ?? 0, endMinute ?? 0, 0, 0);

      // Determine color based on caregiver or status
      let color = '#6B7280'; // default gray for unassigned
      if (visit.assignedCaregiverId != null) {
        color = caregiverColorMap.get(visit.assignedCaregiverId) ?? '#6B7280';
      } else if (visit.status === 'UNASSIGNED') {
        color = '#F59E0B'; // amber for unassigned
      }

      const clientName = visit.clientFirstName != null && visit.clientLastName != null
        ? `${visit.clientFirstName} ${visit.clientLastName}`
        : 'Unknown Client';

      return {
        id: visit.id,
        title: `${clientName} - ${visit.serviceTypeName}`,
        start,
        end,
        resource: visit,
        color,
      };
    });
  }, [visits, caregiverColorMap]);

  // Handle event drop (drag and drop reassignment)
  const handleEventDrop = useCallback(async () => {
    try {
      // Note: Time adjustment via drag-and-drop not yet implemented
      // In a full implementation, we'd update the visit time
      toast.error('Time adjustment not yet implemented. Use drag between caregivers for reassignment.');

      // Refresh data
      await refetch();
    } catch (error) {
      console.error('Error updating visit:', error);
      toast.error('Failed to update visit');
    }
  }, [refetch]);

  // Handle event resize
  const handleEventResize = useCallback(async () => {
    try {
      // Note: Implement time adjustment in future iteration
      toast.error('Time adjustment not yet implemented');
    } catch (error) {
      console.error('Error resizing event:', error);
      toast.error('Failed to resize event');
    }
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    // Note: Visit detail modal to be implemented in future iteration
    toast(`Visit: ${event.title}`, {
      duration: 2000,
    });
  }, []);

  // Handle slot selection (creating new visit)
  const handleSelectSlot = useCallback((_slotInfo: SlotInfo) => {
    // Note: Create visit modal to be implemented in future iteration
    toast('Create visit not yet implemented', { duration: 2000 });
  }, []);

  // Custom event style getter (for color-coding)
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        borderColor: event.color,
        color: '#FFFFFF',
        borderRadius: '4px',
        opacity: event.resource.status === 'CANCELLED' ? 0.5 : 1,
        border: event.resource.status === 'UNASSIGNED' ? '2px dashed' : '1px solid',
      },
    };
  }, []);

  // Check for conflicts when assigning
  const checkAndAssignCaregiver = useCallback(async (visitId: string, caregiverId: string) => {
    try {
      // Check for conflicts
      const conflictResult = await visitApi.checkConflicts(visitId, caregiverId);

      if (conflictResult.hasConflicts) {
        const conflictMessages = conflictResult.conflicts.map(c =>
          `${c.scheduled_start_time} - ${c.scheduled_end_time}: ${c.client_first_name} ${c.client_last_name}`
        ).join('\n');

        const proceed = window.confirm(
          `Scheduling conflicts detected:\n\n${conflictMessages}\n\nDo you want to assign anyway?`
        );

        if (!proceed) {
          return false;
        }
      }

      // Assign caregiver
      await visitApi.assignCaregiver(visitId, caregiverId, false);
      toast.success('Caregiver assigned successfully');

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['visits'] });

      return true;
    } catch (error) {
      console.error('Error assigning caregiver:', error);
      toast.error('Failed to assign caregiver');
      return false;
    }
  }, [visitApi, queryClient]);

  // Expose for future use
  console.log('checkAndAssignCaregiver available', checkAndAssignCaregiver);

  // Enhanced error handling with differentiated error types and better UX
  if (error != null && !isLoading && visits.length === 0) {
    // Detect error types
    const isRateLimitError =
      typeof error === 'object' &&
      error != null &&
      ('status' in error
        ? error.status === 429
        : 'code' in error && (error.code === '429' || error.code === 429));

    const isAuthError =
      typeof error === 'object' &&
      error != null &&
      'status' in error &&
      (error.status === 401 || error.status === 403);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const isNetworkError = errorMessage.toLowerCase().includes('network') ||
                           errorMessage.toLowerCase().includes('fetch');

    // Determine error title and message based on type
    let errorTitle = 'Error Loading Calendar';
    let errorDescription = 'Failed to load calendar data. This might be a temporary issue.';

    if (isRateLimitError) {
      errorTitle = 'Rate Limit Exceeded';
      errorDescription = 'Too many requests. Please wait a moment and try again. The system is automatically retrying...';
    } else if (isAuthError) {
      errorTitle = 'Authentication Error';
      errorDescription = 'You are not authorized to view this calendar. Please check your permissions or log in again.';
    } else if (isNetworkError) {
      errorTitle = 'Network Connection Issue';
      errorDescription = 'Unable to connect to the server. Please check your internet connection.';
    }

    // Color scheme based on error type
    const errorBgClass = isRateLimitError ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
    const errorTextClass = isRateLimitError ? 'text-yellow-800' : 'text-red-800';
    const errorDescClass = isRateLimitError ? 'text-yellow-700' : 'text-red-700';
    const iconColorClass = isRateLimitError ? 'text-yellow-400' : 'text-red-400';
    const buttonClass = isRateLimitError ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700';
    const borderClass = isRateLimitError ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' : 'border-red-300 text-red-700 hover:bg-red-50';

    return (
      <div className="p-6">
        <div className={`border rounded-lg p-6 ${errorBgClass}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className={`h-6 w-6 ${iconColorClass}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-lg font-semibold mb-2 ${errorTextClass}`}>
                {errorTitle}
              </h3>
              <div className={`text-sm mb-4 ${errorDescClass}`}>
                <p className="mb-2">{errorDescription}</p>
                {failureCount > 0 && (
                  <p className={`text-xs ${errorTextClass}`}>
                    Attempted {failureCount} time{failureCount > 1 ? 's' : ''} to reconnect.
                  </p>
                )}
                {errorMessage && (
                  <details className="mt-2">
                    <summary className={`cursor-pointer text-xs ${errorTextClass} hover:opacity-80`}>
                      Technical details
                    </summary>
                    <pre className={`mt-1 text-xs ${isRateLimitError ? 'bg-yellow-100' : 'bg-red-100'} p-2 rounded overflow-auto`}>
                      {errorMessage}
                    </pre>
                  </details>
                )}
              </div>
              <div className="flex gap-3">
                {!isAuthError && (
                  <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className={`px-4 py-2 text-white rounded-md ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium`}
                  >
                    {isRefetching ? 'Retrying...' : 'Retry Now'}
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className={`px-4 py-2 bg-white border rounded-md text-sm font-medium ${borderClass}`}
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading skeleton for initial load
  if (isLoading && visits.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Header Skeleton */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Calendar Skeleton */}
        <div className="flex-1 p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow-sm h-full p-4">
            <div className="h-full flex flex-col gap-4">
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex-1 grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        {/* Loading indicator */}
        {(isLoading || isRefetching) && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-800">
              {isLoading ? 'Loading calendar data...' : 'Refreshing calendar...'}
            </span>
          </div>
        )}

        {/* Partial data warning */}
        {error != null && visits.length > 0 && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg
                className="h-5 w-5 text-yellow-600 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-yellow-800">
                  Some calendar data may be incomplete. Showing cached data.
                </p>
              </div>
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                className="text-xs text-yellow-700 hover:text-yellow-900 underline"
              >
                {isRefetching ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        )}

        {/* Availability error notice */}
        {availabilityError != null && showAvailability && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              Unable to load caregiver availability. Calendar view is still functional.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Scheduling Calendar</h1>
              {view === 'week' && (
                <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {weeklyVisitCount} {weeklyVisitCount === 1 ? 'visit' : 'visits'} this week
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {visits.length === 0 ? 'No visits scheduled' : 'Drag and drop visits to reassign caregivers'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Toggle Controls */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMiniCalendar}
                  onChange={(e) => setShowMiniCalendar(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <CalendarDays className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Mini Calendar</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLegend}
                  onChange={(e) => setShowLegend(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <Layout className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Legend</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAvailability}
                  onChange={(e) => setShowAvailability(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <List className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Availability</span>
              </label>
            </div>

            {/* View Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  view === 'week'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('day')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  view === 'day'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  view === 'month'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(isLoading || isRefetching) && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
              )}
              {isLoading || isRefetching ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Compact Legend */}
        {showLegend && (
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500 border-2 border-dashed border-amber-600"></div>
              <span className="text-xs text-gray-600">Unassigned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-xs text-gray-600">Assigned (Color per caregiver)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-400 opacity-50"></div>
              <span className="text-xs text-gray-600">Cancelled</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with Mini Calendar and Legend */}
        {(showMiniCalendar || showLegend) && (
          <div className="w-80 bg-gray-50 border-r p-4 overflow-y-auto space-y-4">
            {showMiniCalendar && (
              <MiniCalendar
                currentDate={currentDate}
                daysWithVisits={daysWithVisits}
                onDateSelect={(date) => {
                  setCurrentDate(date);
                  setView('day');
                }}
                onMonthChange={setCurrentDate}
              />
            )}
            {showLegend && <VisitStatusLegend />}
          </div>
        )}

        {/* Calendar */}
        <div className="flex-1 p-6 bg-gray-50 overflow-auto">
          {!isLoading && visits.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-16 w-16" />}
              title="No visits scheduled for this period"
              description={
                view === 'day'
                  ? `No visits are scheduled for ${moment(currentDate).format('MMMM D, YYYY')}. Add a new visit or select a different date.`
                  : view === 'week'
                  ? `No visits are scheduled for the week of ${moment(currentDate).startOf('week').format('MMMM D')} - ${moment(currentDate).endOf('week').format('MMMM D, YYYY')}.`
                  : `No visits are scheduled for ${moment(currentDate).format('MMMM YYYY')}.`
              }
              metadata={
                weeklyVisitCount > 0 && view !== 'week' ? (
                  <div className="text-sm text-gray-500">
                    You have <span className="font-semibold text-gray-700">{weeklyVisitCount}</span> {weeklyVisitCount === 1 ? 'visit' : 'visits'} scheduled this week
                  </div>
                ) : undefined
              }
              action={
                <button
                  onClick={() => toast('Create visit not yet implemented', { duration: 2000 })}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
                >
                  <Plus className="h-5 w-5" />
                  Add Visit
                </button>
              }
              secondaryAction={
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Go to Today
                </button>
              }
              size="lg"
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm h-full p-4">
              <DragAndDropCalendar
                localizer={localizer}
                events={events}
                view={view}
                onView={setView}
                date={currentDate}
                onNavigate={setCurrentDate}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                eventPropGetter={eventStyleGetter}
                selectable
                resizable
                draggableAccessor={(_event) => {
                  // Only allow dragging for coordinators and admins
                  return user?.roles.some(role => ['COORDINATOR', 'ORG_ADMIN', 'SUPER_ADMIN'].includes(role)) ?? false;
                }}
                style={{ height: '100%' }}
                step={15}
                timeslots={4}
                defaultView="week"
                views={['month', 'week', 'day']}
                min={new Date(2025, 0, 1, 6, 0)} // Start at 6 AM
                max={new Date(2025, 0, 1, 22, 0)} // End at 10 PM
                messages={{
                  next: 'Next',
                  previous: 'Previous',
                  today: 'Today',
                  month: 'Month',
                  week: 'Week',
                  day: 'Day',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Availability Sidebar */}
      {showAvailability && (
        <div className="fixed right-0 top-16 bottom-0 w-80 bg-white border-l shadow-lg overflow-y-auto z-10">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Caregiver Availability
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {moment(currentDate).format('MMMM D, YYYY')}
            </p>

            {isLoadingAvailability && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {availabilityError != null && !isLoadingAvailability && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">Failed to load availability data</p>
              </div>
            )}

            {!isLoadingAvailability && availabilityError == null && caregiverAvailability.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No caregivers available</p>
              </div>
            )}

            {!isLoadingAvailability && availabilityError == null && caregiverAvailability.length > 0 && (
              <div className="space-y-3">
                {caregiverAvailability.map(caregiver => {
                const color = caregiverColorMap.get(caregiver.caregiver_id) ?? '#6B7280';
                const totalHours = caregiver.visits.reduce((acc, visit) => {
                  const start = moment(visit.scheduled_start_time, 'HH:mm');
                  const end = moment(visit.scheduled_end_time, 'HH:mm');
                  return acc + end.diff(start, 'hours', true);
                }, 0);

                return (
                  <div
                    key={caregiver.caregiver_id}
                    className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="font-medium text-gray-900">
                        {caregiver.first_name} {caregiver.last_name}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 mb-2">
                      {caregiver.visits.length} visits • {totalHours.toFixed(1)}h scheduled
                    </div>

                    {caregiver.visits.length > 0 && (
                      <div className="space-y-1">
                        {caregiver.visits.map(visit => (
                          <div key={visit.id} className="text-xs bg-gray-50 rounded p-1.5">
                            <div className="font-medium text-gray-700">
                              {visit.scheduled_start_time} - {visit.scheduled_end_time}
                            </div>
                            <div className="text-gray-500">{visit.client_name}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {caregiver.visits.length === 0 && (
                      <div className="text-xs text-gray-500 italic">No visits scheduled</div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
