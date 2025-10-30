import { Visit, VisitStatus, ServicePattern, DayOfWeek, TimeOfDay, AssignmentMethod, VisitType, PatternStatus } from '../types/schedule';
export declare function formatVisitDate(date: Date | string): string;
export declare function formatVisitTime(startTime: string, endTime: string): string;
export declare function getVisitDuration(startTime: string, endTime: string): number;
export declare function formatDuration(minutes: number): string;
export declare function calculateActualDuration(startTime: Date | string, endTime: Date | string): number;
export declare function getVisitStatusDisplay(status: VisitStatus): {
    label: string;
    color: 'blue' | 'yellow' | 'green' | 'red' | 'gray' | 'purple';
    icon: string;
    description: string;
};
export declare function getVisitTypeDisplay(type: VisitType): {
    label: string;
    description: string;
};
export declare function isUpcomingVisit(visit: Pick<Visit, 'scheduledDate' | 'status'>): boolean;
export declare function isVisitInProgress(visit: Pick<Visit, 'status'>): boolean;
export declare function isVisitCompleted(visit: Pick<Visit, 'status'>): boolean;
export declare function needsAttention(visit: Pick<Visit, 'status' | 'isUrgent' | 'isPriority' | 'scheduledDate'>): boolean;
export declare function getTimeUntilVisit(date: Date | string, startTime: string): string;
export declare function hasTimeConflict(visit1: Pick<Visit, 'scheduledDate' | 'scheduledStartTime' | 'scheduledEndTime'>, visit2: Pick<Visit, 'scheduledDate' | 'scheduledStartTime' | 'scheduledEndTime'>): boolean;
export declare function addMinutesToTime(time: string, minutesToAdd: number): string;
export declare function getPatternStatusDisplay(status: PatternStatus): {
    label: string;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
    description: string;
};
export declare function getDayOfWeek(date: Date | string): DayOfWeek;
export declare function isPatternActiveOnDate(pattern: Pick<ServicePattern, 'effectiveFrom' | 'effectiveTo' | 'status'>, date: Date | string): boolean;
export declare function getTimeOfDay(time: string): TimeOfDay;
export declare function calculateVisitsPerWeek(pattern: Pick<ServicePattern, 'recurrence'>): number;
export declare function calculateHoursPerWeek(pattern: Pick<ServicePattern, 'recurrence' | 'duration'>): number;
export declare function getAssignmentMethodDisplay(method: AssignmentMethod): string;
export declare function formatAddress(address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
}): string;
export declare function formatShortAddress(address: {
    city: string;
    state: string;
}): string;
export declare function calculateTaskCompletionPercentage(tasksCompleted?: number, tasksTotal?: number): number;
export declare function sortVisitsByTime(visits: Pick<Visit, 'scheduledDate' | 'scheduledStartTime'>[]): typeof visits;
export declare function groupVisitsByDate<T extends Pick<Visit, 'scheduledDate' | 'scheduledStartTime'>>(visits: T[]): Record<string, T[]>;
export declare function filterVisitsByStatus(visits: Pick<Visit, 'status'>[], statuses: VisitStatus[]): typeof visits;
export declare function getTodaysVisits(visits: Pick<Visit, 'scheduledDate'>[]): typeof visits;
export declare function getUnassignedCount(visits: Pick<Visit, 'status' | 'assignedCaregiverId'>[]): number;
export declare function isVisitOverdue(visit: Pick<Visit, 'scheduledDate' | 'scheduledStartTime' | 'status'>): boolean;
//# sourceMappingURL=schedule-utils.d.ts.map