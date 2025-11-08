/**
 * Visit Timeline Component
 *
 * Display real-time timeline of visit events (check-in, tasks, check-out)
 */

import React from 'react';
import { CheckCircle, Clock, AlertCircle, Circle } from 'lucide-react';
import type { VisitSummary } from '@care-commons/family-engagement';

interface VisitTimelineProps {
  visit: VisitSummary;
}

interface TimelineEvent {
  time?: Date | string;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  completed: boolean;
}

export const VisitTimeline: React.FC<VisitTimelineProps> = ({ visit }) => {
  const events: TimelineEvent[] = [];

  // Check-in event
  if (visit.actualStartTime) {
    events.push({
      time: visit.actualStartTime,
      label: 'Checked In',
      description: `${visit.caregiverName} arrived and started the visit`,
      icon: CheckCircle,
      iconColor: 'text-green-500',
      completed: true,
    });
  } else if (visit.status === 'SCHEDULED') {
    events.push({
      time: visit.scheduledStartTime,
      label: 'Scheduled to Start',
      description: `${visit.caregiverName} is scheduled to arrive`,
      icon: Circle,
      iconColor: 'text-gray-400',
      completed: false,
    });
  }

  // Tasks completion events
  if (visit.tasksCompleted && visit.tasksCompleted.length > 0) {
    const completedTasks = visit.tasksCompleted.filter(t => t.status === 'COMPLETED');
    const skippedTasks = visit.tasksCompleted.filter(t => t.status === 'SKIPPED');
    const totalTasks = visit.tasksCompleted.length;

    if (completedTasks.length > 0) {
      events.push({
        time: completedTasks[completedTasks.length - 1]?.completedAt,
        label: 'Tasks Completed',
        description: `${completedTasks.length} of ${totalTasks} care tasks completed`,
        icon: CheckCircle,
        iconColor: 'text-blue-500',
        completed: true,
      });
    }

    if (skippedTasks.length > 0) {
      events.push({
        time: skippedTasks[0]?.completedAt,
        label: 'Tasks Skipped',
        description: `${skippedTasks.length} task(s) skipped`,
        icon: AlertCircle,
        iconColor: 'text-orange-500',
        completed: true,
      });
    }
  }

  // Check-out event
  if (visit.actualEndTime) {
    events.push({
      time: visit.actualEndTime,
      label: 'Checked Out',
      description: 'Visit completed successfully',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      completed: true,
    });
  } else if (visit.status === 'IN_PROGRESS') {
    events.push({
      label: 'In Progress',
      description: 'Visit is currently ongoing',
      icon: Clock,
      iconColor: 'text-blue-500',
      completed: false,
    });
  } else if (visit.status === 'SCHEDULED') {
    events.push({
      time: visit.scheduledEndTime,
      label: 'Scheduled to End',
      description: 'Expected completion time',
      icon: Circle,
      iconColor: 'text-gray-400',
      completed: false,
    });
  }

  // Cancelled/No-show status
  if (visit.status === 'CANCELLED' || visit.status === 'NO_SHOW') {
    events.push({
      time: visit.createdAt,
      label: visit.status === 'CANCELLED' ? 'Visit Cancelled' : 'No Show',
      description: visit.cancellationReason || 'Visit did not occur',
      icon: AlertCircle,
      iconColor: 'text-red-500',
      completed: true,
    });
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No timeline events available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {events.map((event, index) => {
        const Icon = event.icon;
        const isLast = index === events.length - 1;

        return (
          <div key={index} className="flex items-start gap-4">
            {/* Timeline line and icon */}
            <div className="relative flex flex-col items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                event.completed ? 'bg-white border-2 border-current' : 'bg-gray-100'
              } ${event.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              {!isLast && (
                <div className={`w-0.5 h-full min-h-[2rem] mt-2 ${
                  event.completed ? 'bg-gray-300' : 'bg-gray-200'
                }`} />
              )}
            </div>

            {/* Event details */}
            <div className="flex-1 pb-6">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900">{event.label}</h4>
                {event.time && (
                  <span className="text-xs text-gray-500">
                    {new Date(event.time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{event.description}</p>

              {/* Task details for completed tasks */}
              {event.label === 'Tasks Completed' && visit.tasksCompleted && (
                <div className="mt-3 space-y-2">
                  {visit.tasksCompleted
                    .filter(t => t.status === 'COMPLETED')
                    .slice(0, 3)
                    .map(task => (
                      <div
                        key={task.taskId}
                        className="flex items-center gap-2 text-xs text-gray-600 pl-4 border-l-2 border-gray-200"
                      >
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{task.taskName}</span>
                      </div>
                    ))}
                  {visit.tasksCompleted.filter(t => t.status === 'COMPLETED').length > 3 && (
                    <div className="text-xs text-gray-500 pl-4">
                      + {visit.tasksCompleted.filter(t => t.status === 'COMPLETED').length - 3} more
                    </div>
                  )}
                </div>
              )}

              {/* Skipped task details */}
              {event.label === 'Tasks Skipped' && visit.tasksCompleted && (
                <div className="mt-3 space-y-2">
                  {visit.tasksCompleted
                    .filter(t => t.status === 'SKIPPED')
                    .map(task => (
                      <div
                        key={task.taskId}
                        className="flex items-start gap-2 text-xs pl-4 border-l-2 border-orange-200"
                      >
                        <AlertCircle className="h-3 w-3 text-orange-500 mt-0.5" />
                        <div>
                          <div className="text-gray-700">{task.taskName}</div>
                          {task.skipReason && (
                            <div className="text-gray-500 mt-1">Reason: {task.skipReason}</div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
