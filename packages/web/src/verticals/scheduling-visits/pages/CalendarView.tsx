import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer, View, SlotInfo } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useCalendarVisits, useVisitApi, useCaregiverAvailability } from '../hooks/useVisits';
import { useAuth } from '@/core/hooks';
import type { Visit } from '../types';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

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

export const CalendarView: React.FC = () => {
  const { user } = useAuth();
  const visitApi = useVisitApi();
  const queryClient = useQueryClient();

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('week');
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  // Calculate date range for calendar based on current view
  const { startDate, endDate } = useMemo(() => {
    const start = moment(currentDate).startOf(view === 'month' ? 'month' : 'week').toDate();
    const end = moment(currentDate).endOf(view === 'month' ? 'month' : 'week').toDate();
    return { startDate: start, endDate: end };
  }, [currentDate, view]);

  // Fetch visits for calendar
  const branchIds = selectedBranches.length > 0 ? selectedBranches : user?.branchIds;
  const { data: visits = [], isLoading, error, refetch } = useCalendarVisits(
    startDate,
    endDate,
    branchIds
  );

  // Fetch caregiver availability
  const { data: caregiverAvailability = [] } = useCaregiverAvailability(
    currentDate,
    branchIds
  );

  // Create a color map for caregivers
  const caregiverColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueCaregiverIds = new Set<string>();

    visits.forEach(visit => {
      if (visit.assignedCaregiverId != null) {
        uniqueCaregiverIds.add(visit.assignedCaregiverId);
      }
    });

    Array.from(uniqueCaregiverIds).forEach((caregiverId, index) => {
      map.set(caregiverId, CAREGIVER_COLORS[index % CAREGIVER_COLORS.length]!);
    });

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
  const handleEventDrop = useCallback(async ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    try {
      const visit = event.resource;

      // TODO: For now, we'll just show a toast
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
  const handleEventResize = useCallback(async ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    try {
      // TODO: Implement time adjustment
      toast.error('Time adjustment not yet implemented');
    } catch (error) {
      console.error('Error resizing event:', error);
      toast.error('Failed to resize event');
    }
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    const visit = event.resource;
    // TODO: Open visit detail modal or sidebar
    toast(`Visit: ${event.title}`, {
      duration: 2000,
    });
  }, []);

  // Handle slot selection (creating new visit)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    // TODO: Open create visit modal
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

  if (error != null) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Calendar</h3>
          <p className="text-red-600">Failed to load visits. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scheduling Calendar</h1>
            <p className="text-sm text-gray-600 mt-1">
              Drag and drop visits to reassign caregivers
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Availability Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showAvailability}
                onChange={(e) => setShowAvailability(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Show Availability</span>
            </label>

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
              disabled={isLoading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Legend */}
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
      </div>

      {/* Calendar */}
      <div className="flex-1 p-6 bg-gray-50">
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
            draggableAccessor={(event) => {
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
          </div>
        </div>
      )}
    </div>
  );
};
