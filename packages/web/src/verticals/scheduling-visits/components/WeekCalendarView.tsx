import React from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Clock, User } from 'lucide-react';
import { VisitStatusBadge } from './VisitStatusBadge';
import type { VisitWithDetails } from '../types';

interface WeekCalendarViewProps {
  visits: VisitWithDetails[];
  weekStart: Date;
  onVisitClick?: (visit: VisitWithDetails) => void;
  onAssignClick?: (visitId: string) => void;
}

export const WeekCalendarView: React.FC<WeekCalendarViewProps> = ({
  visits,
  weekStart,
  onVisitClick,
  onAssignClick,
}) => {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(weekStart), i));

  // Group visits by day
  const visitsByDay = weekDays.map((day) => ({
    date: day,
    visits: visits
      .filter((v) => isSameDay(new Date(v.scheduledDate), day))
      .sort((a, b) => a.scheduledStartTime.localeCompare(b.scheduledStartTime)),
  }));

  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${
              isToday(day) ? 'bg-primary-50' : 'bg-gray-50'
            }`}
          >
            <div className="text-xs font-medium text-gray-600 uppercase">
              {format(day, 'EEE')}
            </div>
            <div
              className={`text-2xl font-semibold mt-1 ${
                isToday(day) ? 'text-primary-600' : 'text-gray-900'
              }`}
            >
              {format(day, 'd')}
            </div>
            <div className="text-xs text-gray-500">{format(day, 'MMM')}</div>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {visitsByDay.map(({ date, visits: dayVisits }) => (
          <div
            key={date.toISOString()}
            className="border-r border-gray-200 last:border-r-0 min-h-[500px] p-2"
          >
            <div className="space-y-2">
              {dayVisits.length > 0 ? (
                dayVisits.map((visit) => (
                  <button
                    key={visit.id}
                    onClick={() => onVisitClick?.(visit)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all bg-white group"
                  >
                    <div className="space-y-2">
                      {/* Time */}
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">
                          {visit.scheduledStartTime.substring(0, 5)}
                        </span>
                        <span className="text-gray-400">
                          {visit.scheduledDuration}min
                        </span>
                      </div>

                      {/* Client */}
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {visit.clientName || 'Unknown Client'}
                      </div>

                      {/* Caregiver or Unassigned */}
                      {visit.assignedCaregiverId ? (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <User className="h-3 w-3" />
                          <span className="truncate">
                            {visit.caregiverName || 'Unknown'}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAssignClick?.(visit.id);
                          }}
                          className="text-xs text-orange-600 font-medium hover:text-orange-700 transition-colors"
                        >
                          + Assign Caregiver
                        </button>
                      )}

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <VisitStatusBadge status={visit.status} size="sm" />
                        {visit.isUrgent && (
                          <span className="text-xs text-red-600 font-medium">Urgent</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No visits scheduled
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
