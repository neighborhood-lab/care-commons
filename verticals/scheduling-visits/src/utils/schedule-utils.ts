/**
 * Scheduling & Visit utility functions
 * Helper functions for working with visits, schedules, and availability
 */

import {
  differenceInMinutes,
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  startOfDay,
  endOfDay,
  isWithinInterval,
  isBefore,
  isAfter,
} from 'date-fns';
import {
  Visit,
  VisitStatus,
  ServicePattern,
  DayOfWeek,
  TimeOfDay,
  AssignmentMethod,
  VisitType,
  PatternStatus,
} from '../types/schedule';

/**
 * Format visit date for display
 */
export function formatVisitDate(date: Date | string): string {
  const visitDate = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(visitDate)) {
    return 'Today';
  } else if (isTomorrow(visitDate)) {
    return 'Tomorrow';
  } else if (isYesterday(visitDate)) {
    return 'Yesterday';
  }
  
  return format(visitDate, 'MMM d, yyyy');
}

/**
 * Format time for display
 */
export function formatVisitTime(startTime: string, endTime: string): string {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const formatTime = (hour: number, min: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
  };
  
  return `${formatTime(startHour, startMin)} - ${formatTime(endHour, endMin)}`;
}

/**
 * Get visit duration in minutes
 */
export function getVisitDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  
  return `${hours}h ${mins}m`;
}

/**
 * Calculate actual visit duration from timestamps
 */
export function calculateActualDuration(
  startTime: Date | string,
  endTime: Date | string
): number {
  const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
  const end = typeof endTime === 'string' ? parseISO(endTime) : endTime;
  
  return differenceInMinutes(end, start);
}

/**
 * Get visit status display information
 */
export function getVisitStatusDisplay(status: VisitStatus): {
  label: string;
  color: 'blue' | 'yellow' | 'green' | 'red' | 'gray' | 'purple';
  icon: string;
  description: string;
} {
  const statusMap: Record<VisitStatus, ReturnType<typeof getVisitStatusDisplay>> = {
    DRAFT: {
      label: 'Draft',
      color: 'gray',
      icon: '📝',
      description: 'Visit not yet published',
    },
    SCHEDULED: {
      label: 'Scheduled',
      color: 'blue',
      icon: '📅',
      description: 'Visit scheduled, awaiting assignment',
    },
    UNASSIGNED: {
      label: 'Unassigned',
      color: 'yellow',
      icon: '⚠️',
      description: 'Visit needs caregiver assignment',
    },
    ASSIGNED: {
      label: 'Assigned',
      color: 'blue',
      icon: '👤',
      description: 'Caregiver assigned',
    },
    CONFIRMED: {
      label: 'Confirmed',
      color: 'green',
      icon: '✓',
      description: 'Caregiver confirmed assignment',
    },
    EN_ROUTE: {
      label: 'En Route',
      color: 'purple',
      icon: '🚗',
      description: 'Caregiver traveling to client',
    },
    ARRIVED: {
      label: 'Arrived',
      color: 'purple',
      icon: '📍',
      description: 'Caregiver at client location',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      color: 'green',
      icon: '▶️',
      description: 'Visit actively occurring',
    },
    PAUSED: {
      label: 'Paused',
      color: 'yellow',
      icon: '⏸️',
      description: 'Visit temporarily paused',
    },
    COMPLETED: {
      label: 'Completed',
      color: 'green',
      icon: '✅',
      description: 'Visit finished successfully',
    },
    INCOMPLETE: {
      label: 'Incomplete',
      color: 'yellow',
      icon: '⚠️',
      description: 'Visit ended but not all tasks completed',
    },
    CANCELLED: {
      label: 'Cancelled',
      color: 'red',
      icon: '❌',
      description: 'Visit cancelled',
    },
    NO_SHOW_CLIENT: {
      label: 'No Show (Client)',
      color: 'red',
      icon: '🚫',
      description: 'Client not available',
    },
    NO_SHOW_CAREGIVER: {
      label: 'No Show (Caregiver)',
      color: 'red',
      icon: '🚫',
      description: 'Caregiver did not show',
    },
    REJECTED: {
      label: 'Rejected',
      color: 'red',
      icon: '✖️',
      description: 'Caregiver rejected assignment',
    },
  };
  
  return statusMap[status];
}

/**
 * Get visit type display information
 */
export function getVisitTypeDisplay(type: VisitType): {
  label: string;
  description: string;
} {
  const typeMap: Record<VisitType, ReturnType<typeof getVisitTypeDisplay>> = {
    REGULAR: {
      label: 'Regular Visit',
      description: 'Standard scheduled visit',
    },
    INITIAL: {
      label: 'Initial Visit',
      description: 'First visit for new client',
    },
    DISCHARGE: {
      label: 'Discharge Visit',
      description: 'Final visit before discharge',
    },
    RESPITE: {
      label: 'Respite Care',
      description: 'Temporary respite care',
    },
    EMERGENCY: {
      label: 'Emergency Visit',
      description: 'Unscheduled emergency visit',
    },
    MAKEUP: {
      label: 'Makeup Visit',
      description: 'Makeup for missed visit',
    },
    SUPERVISION: {
      label: 'Supervision',
      description: 'Supervisor visit',
    },
    ASSESSMENT: {
      label: 'Assessment',
      description: 'Client assessment or evaluation',
    },
  };
  
  return typeMap[type];
}

/**
 * Check if visit is upcoming (scheduled for future)
 */
export function isUpcomingVisit(visit: Pick<Visit, 'scheduledDate' | 'status'>): boolean {
  const visitDate = typeof visit.scheduledDate === 'string' 
    ? parseISO(visit.scheduledDate) 
    : visit.scheduledDate;
    
  return (
    isAfter(visitDate, new Date()) &&
    ['SCHEDULED', 'UNASSIGNED', 'ASSIGNED', 'CONFIRMED'].includes(visit.status)
  );
}

/**
 * Check if visit is in progress
 */
export function isVisitInProgress(visit: Pick<Visit, 'status'>): boolean {
  return ['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'PAUSED'].includes(visit.status);
}

/**
 * Check if visit is completed
 */
export function isVisitCompleted(visit: Pick<Visit, 'status'>): boolean {
  return ['COMPLETED', 'INCOMPLETE'].includes(visit.status);
}

/**
 * Check if visit needs attention (urgent or problems)
 */
export function needsAttention(
  visit: Pick<Visit, 'status' | 'isUrgent' | 'isPriority' | 'scheduledDate'>
): boolean {
  // Urgent or priority visits
  if (visit.isUrgent || visit.isPriority) {
    return true;
  }
  
  // Unassigned visits
  if (visit.status === 'UNASSIGNED') {
    return true;
  }
  
  // Problem statuses
  if (['NO_SHOW_CLIENT', 'NO_SHOW_CAREGIVER', 'REJECTED', 'INCOMPLETE'].includes(visit.status)) {
    return true;
  }
  
  // Visit scheduled for today but not confirmed
  const visitDate = typeof visit.scheduledDate === 'string'
    ? parseISO(visit.scheduledDate)
    : visit.scheduledDate;
    
  if (
    isToday(visitDate) &&
    ['SCHEDULED', 'UNASSIGNED', 'ASSIGNED'].includes(visit.status)
  ) {
    return true;
  }
  
  return false;
}

/**
 * Get time until visit starts
 */
export function getTimeUntilVisit(
  date: Date | string,
  startTime: string
): string {
  const visitDate = typeof date === 'string' ? parseISO(date) : date;
  const [hours, minutes] = startTime.split(':').map(Number);
  
  const visitDateTime = new Date(visitDate);
  visitDateTime.setHours(hours, minutes, 0, 0);
  
  return formatDistanceToNow(visitDateTime, { addSuffix: true });
}

/**
 * Check if visit time conflicts with another visit
 */
export function hasTimeConflict(
  visit1: Pick<Visit, 'scheduledDate' | 'scheduledStartTime' | 'scheduledEndTime'>,
  visit2: Pick<Visit, 'scheduledDate' | 'scheduledStartTime' | 'scheduledEndTime'>
): boolean {
  // Check if same day
  const date1 = typeof visit1.scheduledDate === 'string' 
    ? parseISO(visit1.scheduledDate) 
    : visit1.scheduledDate;
  const date2 = typeof visit2.scheduledDate === 'string'
    ? parseISO(visit2.scheduledDate)
    : visit2.scheduledDate;
    
  if (!isWithinInterval(date1, { start: startOfDay(date2), end: endOfDay(date2) })) {
    return false;
  }
  
  // Check time overlap
  const start1 = timeToMinutes(visit1.scheduledStartTime);
  const end1 = timeToMinutes(visit1.scheduledEndTime);
  const start2 = timeToMinutes(visit2.scheduledStartTime);
  const end2 = timeToMinutes(visit2.scheduledEndTime);
  
  return (
    (start1 >= start2 && start1 < end2) ||
    (end1 > start2 && end1 <= end2) ||
    (start1 <= start2 && end1 >= end2)
  );
}

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

/**
 * Add minutes to a time string
 */
export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutesToAdd;
  
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

/**
 * Get pattern status display
 */
export function getPatternStatusDisplay(status: PatternStatus): {
  label: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  description: string;
} {
  const statusMap: Record<PatternStatus, ReturnType<typeof getPatternStatusDisplay>> = {
    DRAFT: {
      label: 'Draft',
      color: 'gray',
      description: 'Pattern not yet active',
    },
    ACTIVE: {
      label: 'Active',
      color: 'green',
      description: 'Pattern actively generating visits',
    },
    SUSPENDED: {
      label: 'Suspended',
      color: 'yellow',
      description: 'Pattern temporarily suspended',
    },
    COMPLETED: {
      label: 'Completed',
      color: 'gray',
      description: 'Pattern completed',
    },
    CANCELLED: {
      label: 'Cancelled',
      color: 'red',
      description: 'Pattern cancelled',
    },
  };
  
  return statusMap[status];
}

/**
 * Get day of week from date
 */
export function getDayOfWeek(date: Date | string): DayOfWeek {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const days: DayOfWeek[] = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  return days[d.getDay()];
}

/**
 * Check if pattern is active for a given date
 */
export function isPatternActiveOnDate(
  pattern: Pick<ServicePattern, 'effectiveFrom' | 'effectiveTo' | 'status'>,
  date: Date | string
): boolean {
  if (pattern.status !== 'ACTIVE') {
    return false;
  }
  
  const checkDate = typeof date === 'string' ? parseISO(date) : date;
  const effectiveFrom = typeof pattern.effectiveFrom === 'string'
    ? parseISO(pattern.effectiveFrom)
    : pattern.effectiveFrom;
    
  if (isBefore(checkDate, effectiveFrom)) {
    return false;
  }
  
  if (pattern.effectiveTo) {
    const effectiveTo = typeof pattern.effectiveTo === 'string'
      ? parseISO(pattern.effectiveTo)
      : pattern.effectiveTo;
      
    if (isAfter(checkDate, effectiveTo)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get time of day from time string
 */
export function getTimeOfDay(time: string): TimeOfDay {
  const hour = parseInt(time.split(':')[0]);
  
  if (hour >= 5 && hour < 8) {
    return 'EARLY_MORNING';
  } else if (hour >= 8 && hour < 12) {
    return 'MORNING';
  } else if (hour >= 12 && hour < 17) {
    return 'AFTERNOON';
  } else if (hour >= 17 && hour < 21) {
    return 'EVENING';
  } else {
    return 'NIGHT';
  }
}

/**
 * Calculate visits per week from pattern
 */
export function calculateVisitsPerWeek(pattern: Pick<ServicePattern, 'recurrence'>): number {
  const { frequency, daysOfWeek, interval } = pattern.recurrence;
  
  switch (frequency) {
    case 'DAILY':
      return 7 / interval;
    case 'WEEKLY':
      return (daysOfWeek?.length || 1) / interval;
    case 'BIWEEKLY':
      return (daysOfWeek?.length || 1) / (2 * interval);
    case 'MONTHLY':
      return 1 / (4 * interval); // Approximate
    default:
      return 0;
  }
}

/**
 * Calculate hours per week from pattern
 */
export function calculateHoursPerWeek(
  pattern: Pick<ServicePattern, 'recurrence' | 'duration'>
): number {
  const visitsPerWeek = calculateVisitsPerWeek(pattern);
  const hoursPerVisit = pattern.duration / 60;
  
  return visitsPerWeek * hoursPerVisit;
}

/**
 * Get assignment method display
 */
export function getAssignmentMethodDisplay(method: AssignmentMethod): string {
  const methodMap: Record<AssignmentMethod, string> = {
    MANUAL: 'Manually assigned',
    AUTO_MATCH: 'Auto-matched by system',
    SELF_ASSIGN: 'Self-assigned by caregiver',
    PREFERRED: 'Assigned to preferred caregiver',
    OVERFLOW: 'Overflow assignment',
  };
  
  return methodMap[method];
}

/**
 * Format visit address for display
 */
export function formatAddress(address: {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
}): string {
  const parts = [address.line1];
  
  if (address.line2) {
    parts.push(address.line2);
  }
  
  parts.push(`${address.city}, ${address.state} ${address.postalCode}`);
  
  return parts.join(', ');
}

/**
 * Format short address (city, state)
 */
export function formatShortAddress(address: {
  city: string;
  state: string;
}): string {
  return `${address.city}, ${address.state}`;
}

/**
 * Calculate task completion percentage
 */
export function calculateTaskCompletionPercentage(
  tasksCompleted?: number,
  tasksTotal?: number
): number {
  if (!tasksTotal || tasksTotal === 0) {
    return 0;
  }
  
  return Math.round(((tasksCompleted || 0) / tasksTotal) * 100);
}

/**
 * Sort visits by scheduled time
 */
export function sortVisitsByTime(
  visits: Pick<Visit, 'scheduledDate' | 'scheduledStartTime'>[]
): typeof visits {
  return [...visits].sort((a, b) => {
    // First compare dates
    const dateA = typeof a.scheduledDate === 'string' ? parseISO(a.scheduledDate) : a.scheduledDate;
    const dateB = typeof b.scheduledDate === 'string' ? parseISO(b.scheduledDate) : b.scheduledDate;
    
    const dateDiff = dateA.getTime() - dateB.getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }
    
    // Then compare times
    const timeA = timeToMinutes(a.scheduledStartTime);
    const timeB = timeToMinutes(b.scheduledStartTime);
    
    return timeA - timeB;
  });
}

/**
 * Group visits by date
 */
export function groupVisitsByDate<T extends Pick<Visit, 'scheduledDate' | 'scheduledStartTime'>>(
  visits: T[]
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  
  visits.forEach(visit => {
    const date = typeof visit.scheduledDate === 'string'
      ? visit.scheduledDate
      : format(visit.scheduledDate, 'yyyy-MM-dd');
      
    if (!groups[date]) {
      groups[date] = [];
    }
    
    groups[date].push(visit);
  });
  
  // Sort each group by time
  Object.keys(groups).forEach(date => {
    groups[date] = sortVisitsByTime(groups[date]) as T[];
  });
  
  return groups;
}

/**
 * Filter visits by status
 */
export function filterVisitsByStatus(
  visits: Pick<Visit, 'status'>[],
  statuses: VisitStatus[]
): typeof visits {
  return visits.filter(visit => statuses.includes(visit.status));
}

/**
 * Get visits for today
 */
export function getTodaysVisits(
  visits: Pick<Visit, 'scheduledDate'>[]
): typeof visits {
  return visits.filter(visit => {
    const visitDate = typeof visit.scheduledDate === 'string'
      ? parseISO(visit.scheduledDate)
      : visit.scheduledDate;
    return isToday(visitDate);
  });
}

/**
 * Get unassigned visits count
 */
export function getUnassignedCount(
  visits: Pick<Visit, 'status' | 'assignedCaregiverId'>[]
): number {
  return visits.filter(
    v => v.status === 'UNASSIGNED' || !v.assignedCaregiverId
  ).length;
}

/**
 * Check if visit is overdue (should have started but hasn't)
 */
export function isVisitOverdue(
  visit: Pick<Visit, 'scheduledDate' | 'scheduledStartTime' | 'status'>
): boolean {
  if (!['ASSIGNED', 'CONFIRMED'].includes(visit.status)) {
    return false;
  }
  
  const visitDate = typeof visit.scheduledDate === 'string'
    ? parseISO(visit.scheduledDate)
    : visit.scheduledDate;
    
  const [hours, minutes] = visit.scheduledStartTime.split(':').map(Number);
  const scheduledStart = new Date(visitDate);
  scheduledStart.setHours(hours, minutes, 0, 0);
  
  return isBefore(scheduledStart, new Date());
}
