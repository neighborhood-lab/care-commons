"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatVisitDate = formatVisitDate;
exports.formatVisitTime = formatVisitTime;
exports.getVisitDuration = getVisitDuration;
exports.formatDuration = formatDuration;
exports.calculateActualDuration = calculateActualDuration;
exports.getVisitStatusDisplay = getVisitStatusDisplay;
exports.getVisitTypeDisplay = getVisitTypeDisplay;
exports.isUpcomingVisit = isUpcomingVisit;
exports.isVisitInProgress = isVisitInProgress;
exports.isVisitCompleted = isVisitCompleted;
exports.needsAttention = needsAttention;
exports.getTimeUntilVisit = getTimeUntilVisit;
exports.hasTimeConflict = hasTimeConflict;
exports.addMinutesToTime = addMinutesToTime;
exports.getPatternStatusDisplay = getPatternStatusDisplay;
exports.getDayOfWeek = getDayOfWeek;
exports.isPatternActiveOnDate = isPatternActiveOnDate;
exports.getTimeOfDay = getTimeOfDay;
exports.calculateVisitsPerWeek = calculateVisitsPerWeek;
exports.calculateHoursPerWeek = calculateHoursPerWeek;
exports.getAssignmentMethodDisplay = getAssignmentMethodDisplay;
exports.formatAddress = formatAddress;
exports.formatShortAddress = formatShortAddress;
exports.calculateTaskCompletionPercentage = calculateTaskCompletionPercentage;
exports.sortVisitsByTime = sortVisitsByTime;
exports.groupVisitsByDate = groupVisitsByDate;
exports.filterVisitsByStatus = filterVisitsByStatus;
exports.getTodaysVisits = getTodaysVisits;
exports.getUnassignedCount = getUnassignedCount;
exports.isVisitOverdue = isVisitOverdue;
const date_fns_1 = require("date-fns");
function formatVisitDate(date) {
    const visitDate = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
    if ((0, date_fns_1.isToday)(visitDate)) {
        return 'Today';
    }
    else if ((0, date_fns_1.isTomorrow)(visitDate)) {
        return 'Tomorrow';
    }
    else if ((0, date_fns_1.isYesterday)(visitDate)) {
        return 'Yesterday';
    }
    return (0, date_fns_1.format)(visitDate, 'MMM d, yyyy');
}
function formatVisitTime(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const formatTime = (hour, min) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
    };
    return `${formatTime(startHour, startMin)} - ${formatTime(endHour, endMin)}`;
}
function getVisitDuration(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes - startMinutes;
}
function formatDuration(minutes) {
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
function calculateActualDuration(startTime, endTime) {
    const start = typeof startTime === 'string' ? (0, date_fns_1.parseISO)(startTime) : startTime;
    const end = typeof endTime === 'string' ? (0, date_fns_1.parseISO)(endTime) : endTime;
    return (0, date_fns_1.differenceInMinutes)(end, start);
}
function getVisitStatusDisplay(status) {
    const statusMap = {
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
function getVisitTypeDisplay(type) {
    const typeMap = {
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
function isUpcomingVisit(visit) {
    const visitDate = typeof visit.scheduledDate === 'string'
        ? (0, date_fns_1.parseISO)(visit.scheduledDate)
        : visit.scheduledDate;
    return ((0, date_fns_1.isAfter)(visitDate, new Date()) &&
        ['SCHEDULED', 'UNASSIGNED', 'ASSIGNED', 'CONFIRMED'].includes(visit.status));
}
function isVisitInProgress(visit) {
    return ['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'PAUSED'].includes(visit.status);
}
function isVisitCompleted(visit) {
    return ['COMPLETED', 'INCOMPLETE'].includes(visit.status);
}
function needsAttention(visit) {
    if (visit.isUrgent || visit.isPriority) {
        return true;
    }
    if (visit.status === 'UNASSIGNED') {
        return true;
    }
    if (['NO_SHOW_CLIENT', 'NO_SHOW_CAREGIVER', 'REJECTED', 'INCOMPLETE'].includes(visit.status)) {
        return true;
    }
    const visitDate = typeof visit.scheduledDate === 'string'
        ? (0, date_fns_1.parseISO)(visit.scheduledDate)
        : visit.scheduledDate;
    if ((0, date_fns_1.isToday)(visitDate) &&
        ['SCHEDULED', 'UNASSIGNED', 'ASSIGNED'].includes(visit.status)) {
        return true;
    }
    return false;
}
function getTimeUntilVisit(date, startTime) {
    const visitDate = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
    const [hours, minutes] = startTime.split(':').map(Number);
    const visitDateTime = new Date(visitDate);
    visitDateTime.setHours(hours, minutes, 0, 0);
    return (0, date_fns_1.formatDistanceToNow)(visitDateTime, { addSuffix: true });
}
function hasTimeConflict(visit1, visit2) {
    const date1 = typeof visit1.scheduledDate === 'string'
        ? (0, date_fns_1.parseISO)(visit1.scheduledDate)
        : visit1.scheduledDate;
    const date2 = typeof visit2.scheduledDate === 'string'
        ? (0, date_fns_1.parseISO)(visit2.scheduledDate)
        : visit2.scheduledDate;
    if (!(0, date_fns_1.isWithinInterval)(date1, { start: (0, date_fns_1.startOfDay)(date2), end: (0, date_fns_1.endOfDay)(date2) })) {
        return false;
    }
    const start1 = timeToMinutes(visit1.scheduledStartTime);
    const end1 = timeToMinutes(visit1.scheduledEndTime);
    const start2 = timeToMinutes(visit2.scheduledStartTime);
    const end2 = timeToMinutes(visit2.scheduledEndTime);
    return ((start1 >= start2 && start1 < end2) ||
        (end1 > start2 && end1 <= end2) ||
        (start1 <= start2 && end1 >= end2));
}
function timeToMinutes(time) {
    const [hours, mins] = time.split(':').map(Number);
    return hours * 60 + mins;
}
function addMinutesToTime(time, minutesToAdd) {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutesToAdd;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}
function getPatternStatusDisplay(status) {
    const statusMap = {
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
function getDayOfWeek(date) {
    const d = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
    const days = [
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
function isPatternActiveOnDate(pattern, date) {
    if (pattern.status !== 'ACTIVE') {
        return false;
    }
    const checkDate = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
    const effectiveFrom = typeof pattern.effectiveFrom === 'string'
        ? (0, date_fns_1.parseISO)(pattern.effectiveFrom)
        : pattern.effectiveFrom;
    if ((0, date_fns_1.isBefore)(checkDate, effectiveFrom)) {
        return false;
    }
    if (pattern.effectiveTo) {
        const effectiveTo = typeof pattern.effectiveTo === 'string'
            ? (0, date_fns_1.parseISO)(pattern.effectiveTo)
            : pattern.effectiveTo;
        if ((0, date_fns_1.isAfter)(checkDate, effectiveTo)) {
            return false;
        }
    }
    return true;
}
function getTimeOfDay(time) {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 5 && hour < 8) {
        return 'EARLY_MORNING';
    }
    else if (hour >= 8 && hour < 12) {
        return 'MORNING';
    }
    else if (hour >= 12 && hour < 17) {
        return 'AFTERNOON';
    }
    else if (hour >= 17 && hour < 21) {
        return 'EVENING';
    }
    else {
        return 'NIGHT';
    }
}
function calculateVisitsPerWeek(pattern) {
    const { frequency, daysOfWeek, interval } = pattern.recurrence;
    switch (frequency) {
        case 'DAILY':
            return 7 / interval;
        case 'WEEKLY':
            return (daysOfWeek?.length || 1) / interval;
        case 'BIWEEKLY':
            return (daysOfWeek?.length || 1) / (2 * interval);
        case 'MONTHLY':
            return 1 / (4 * interval);
        default:
            return 0;
    }
}
function calculateHoursPerWeek(pattern) {
    const visitsPerWeek = calculateVisitsPerWeek(pattern);
    const hoursPerVisit = pattern.duration / 60;
    return visitsPerWeek * hoursPerVisit;
}
function getAssignmentMethodDisplay(method) {
    const methodMap = {
        MANUAL: 'Manually assigned',
        AUTO_MATCH: 'Auto-matched by system',
        SELF_ASSIGN: 'Self-assigned by caregiver',
        PREFERRED: 'Assigned to preferred caregiver',
        OVERFLOW: 'Overflow assignment',
    };
    return methodMap[method];
}
function formatAddress(address) {
    const parts = [address.line1];
    if (address.line2) {
        parts.push(address.line2);
    }
    parts.push(`${address.city}, ${address.state} ${address.postalCode}`);
    return parts.join(', ');
}
function formatShortAddress(address) {
    return `${address.city}, ${address.state}`;
}
function calculateTaskCompletionPercentage(tasksCompleted, tasksTotal) {
    if (!tasksTotal || tasksTotal === 0) {
        return 0;
    }
    return Math.round(((tasksCompleted || 0) / tasksTotal) * 100);
}
function sortVisitsByTime(visits) {
    return [...visits].sort((a, b) => {
        const dateA = typeof a.scheduledDate === 'string' ? (0, date_fns_1.parseISO)(a.scheduledDate) : a.scheduledDate;
        const dateB = typeof b.scheduledDate === 'string' ? (0, date_fns_1.parseISO)(b.scheduledDate) : b.scheduledDate;
        const dateDiff = dateA.getTime() - dateB.getTime();
        if (dateDiff !== 0) {
            return dateDiff;
        }
        const timeA = timeToMinutes(a.scheduledStartTime);
        const timeB = timeToMinutes(b.scheduledStartTime);
        return timeA - timeB;
    });
}
function groupVisitsByDate(visits) {
    const groups = {};
    visits.forEach(visit => {
        const date = typeof visit.scheduledDate === 'string'
            ? visit.scheduledDate
            : (0, date_fns_1.format)(visit.scheduledDate, 'yyyy-MM-dd');
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(visit);
    });
    Object.keys(groups).forEach(date => {
        groups[date] = sortVisitsByTime(groups[date]);
    });
    return groups;
}
function filterVisitsByStatus(visits, statuses) {
    return visits.filter(visit => statuses.includes(visit.status));
}
function getTodaysVisits(visits) {
    return visits.filter(visit => {
        const visitDate = typeof visit.scheduledDate === 'string'
            ? (0, date_fns_1.parseISO)(visit.scheduledDate)
            : visit.scheduledDate;
        return (0, date_fns_1.isToday)(visitDate);
    });
}
function getUnassignedCount(visits) {
    return visits.filter(v => v.status === 'UNASSIGNED' || !v.assignedCaregiverId).length;
}
function isVisitOverdue(visit) {
    if (!['ASSIGNED', 'CONFIRMED'].includes(visit.status)) {
        return false;
    }
    const visitDate = typeof visit.scheduledDate === 'string'
        ? (0, date_fns_1.parseISO)(visit.scheduledDate)
        : visit.scheduledDate;
    const [hours, minutes] = visit.scheduledStartTime.split(':').map(Number);
    const scheduledStart = new Date(visitDate);
    scheduledStart.setHours(hours, minutes, 0, 0);
    return (0, date_fns_1.isBefore)(scheduledStart, new Date());
}
//# sourceMappingURL=schedule-utils.js.map