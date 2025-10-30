"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schedule_utils_1 = require("../schedule-utils");
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Schedule Utils', () => {
    (0, vitest_1.describe)('formatVisitDate', () => {
        (0, vitest_1.it)('should format today as "Today"', () => {
            const today = new Date();
            (0, vitest_1.expect)((0, schedule_utils_1.formatVisitDate)(today)).toBe('Today');
        });
        (0, vitest_1.it)('should format tomorrow as "Tomorrow"', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            (0, vitest_1.expect)((0, schedule_utils_1.formatVisitDate)(tomorrow)).toBe('Tomorrow');
        });
        (0, vitest_1.it)('should format yesterday as "Yesterday"', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            (0, vitest_1.expect)((0, schedule_utils_1.formatVisitDate)(yesterday)).toBe('Yesterday');
        });
        (0, vitest_1.it)('should format other dates in readable format', () => {
            const date = new Date(2024, 0, 15);
            (0, vitest_1.expect)((0, schedule_utils_1.formatVisitDate)(date)).toBe('Jan 15, 2024');
        });
    });
    (0, vitest_1.describe)('formatVisitTime', () => {
        (0, vitest_1.it)('should format time range in 12-hour format', () => {
            (0, vitest_1.expect)((0, schedule_utils_1.formatVisitTime)('09:00', '10:00')).toBe('9:00 AM - 10:00 AM');
            (0, vitest_1.expect)((0, schedule_utils_1.formatVisitTime)('13:30', '14:30')).toBe('1:30 PM - 2:30 PM');
            (0, vitest_1.expect)((0, schedule_utils_1.formatVisitTime)('23:45', '00:45')).toBe('11:45 PM - 12:45 AM');
        });
    });
    (0, vitest_1.describe)('getVisitDuration', () => {
        (0, vitest_1.it)('should calculate duration between start and end times', () => {
            (0, vitest_1.expect)((0, schedule_utils_1.getVisitDuration)('09:00', '10:30')).toBe(90);
            (0, vitest_1.expect)((0, schedule_utils_1.getVisitDuration)('14:15', '15:00')).toBe(45);
        });
    });
    (0, vitest_1.describe)('formatDuration', () => {
        (0, vitest_1.it)('should format minutes in readable format', () => {
            (0, vitest_1.expect)((0, schedule_utils_1.formatDuration)(30)).toBe('30 min');
            (0, vitest_1.expect)((0, schedule_utils_1.formatDuration)(60)).toBe('1 hour');
            (0, vitest_1.expect)((0, schedule_utils_1.formatDuration)(90)).toBe('1h 30m');
            (0, vitest_1.expect)((0, schedule_utils_1.formatDuration)(120)).toBe('2 hours');
        });
    });
    (0, vitest_1.describe)('calculateActualDuration', () => {
        (0, vitest_1.it)('should calculate actual visit duration', () => {
            const start = new Date('2024-01-15T09:00:00Z');
            const end = new Date('2024-01-15T10:30:00Z');
            (0, vitest_1.expect)((0, schedule_utils_1.calculateActualDuration)(start, end)).toBe(90);
        });
    });
    (0, vitest_1.describe)('getVisitStatusDisplay', () => {
        (0, vitest_1.it)('should return display info for visit status', () => {
            const display = (0, schedule_utils_1.getVisitStatusDisplay)('SCHEDULED');
            (0, vitest_1.expect)(display.label).toBe('Scheduled');
            (0, vitest_1.expect)(typeof display.color).toBe('string');
        });
    });
    (0, vitest_1.describe)('getVisitTypeDisplay', () => {
        (0, vitest_1.it)('should return display info for visit type', () => {
            const display = (0, schedule_utils_1.getVisitTypeDisplay)('REGULAR');
            (0, vitest_1.expect)(display.label).toBe('Regular Visit');
            (0, vitest_1.expect)(typeof display.description).toBe('string');
        });
    });
    (0, vitest_1.describe)('isUpcomingVisit', () => {
        (0, vitest_1.it)('should identify upcoming visits', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            const visit = {
                scheduledDate: futureDate,
                status: 'SCHEDULED'
            };
            (0, vitest_1.expect)((0, schedule_utils_1.isUpcomingVisit)(visit)).toBe(true);
        });
        (0, vitest_1.it)('should not identify past visits as upcoming', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            const visit = {
                scheduledDate: pastDate,
                status: 'SCHEDULED'
            };
            (0, vitest_1.expect)((0, schedule_utils_1.isUpcomingVisit)(visit)).toBe(false);
        });
    });
    (0, vitest_1.describe)('isVisitInProgress', () => {
        (0, vitest_1.it)('should identify visits in progress', () => {
            const visit = {
                status: 'IN_PROGRESS'
            };
            (0, vitest_1.expect)((0, schedule_utils_1.isVisitInProgress)(visit)).toBe(true);
        });
        (0, vitest_1.it)('should not identify completed visits as in progress', () => {
            const visit = {
                status: 'COMPLETED'
            };
            (0, vitest_1.expect)((0, schedule_utils_1.isVisitInProgress)(visit)).toBe(false);
        });
    });
    (0, vitest_1.describe)('isVisitCompleted', () => {
        (0, vitest_1.it)('should identify completed visits', () => {
            const visit = {
                status: 'COMPLETED'
            };
            (0, vitest_1.expect)((0, schedule_utils_1.isVisitCompleted)(visit)).toBe(true);
        });
        (0, vitest_1.it)('should not identify scheduled visits as completed', () => {
            const visit = {
                status: 'SCHEDULED'
            };
            (0, vitest_1.expect)((0, schedule_utils_1.isVisitCompleted)(visit)).toBe(false);
        });
    });
    (0, vitest_1.describe)('needsAttention', () => {
        (0, vitest_1.it)('should identify visits needing attention', () => {
            const visit = {
                status: 'UNASSIGNED',
                scheduledDate: new Date(),
                isUrgent: false,
                isPriority: false
            };
            (0, vitest_1.expect)((0, schedule_utils_1.needsAttention)(visit)).toBe(true);
        });
        (0, vitest_1.it)('should not identify normal visits as needing attention', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            const visit = {
                status: 'ASSIGNED',
                scheduledDate: futureDate,
                isUrgent: false,
                isPriority: false
            };
            (0, vitest_1.expect)((0, schedule_utils_1.needsAttention)(visit)).toBe(false);
        });
    });
    (0, vitest_1.describe)('hasTimeConflict', () => {
        (0, vitest_1.it)('should detect overlapping visits', () => {
            const visit1 = {
                scheduledDate: new Date('2024-01-15'),
                scheduledStartTime: '09:00',
                scheduledEndTime: '10:00'
            };
            const visit2 = {
                scheduledDate: new Date('2024-01-15'),
                scheduledStartTime: '09:30',
                scheduledEndTime: '10:30'
            };
            (0, vitest_1.expect)((0, schedule_utils_1.hasTimeConflict)(visit1, visit2)).toBe(true);
        });
        (0, vitest_1.it)('should not conflict with non-overlapping visits', () => {
            const visit1 = {
                scheduledDate: new Date('2024-01-15'),
                scheduledStartTime: '09:00',
                scheduledEndTime: '10:00'
            };
            const visit2 = {
                scheduledDate: new Date('2024-01-15'),
                scheduledStartTime: '10:00',
                scheduledEndTime: '11:00'
            };
            (0, vitest_1.expect)((0, schedule_utils_1.hasTimeConflict)(visit1, visit2)).toBe(false);
        });
    });
    (0, vitest_1.describe)('addMinutesToTime', () => {
        (0, vitest_1.it)('should add minutes to time', () => {
            (0, vitest_1.expect)((0, schedule_utils_1.addMinutesToTime)('09:00', 30)).toBe('09:30');
            (0, vitest_1.expect)((0, schedule_utils_1.addMinutesToTime)('23:30', 45)).toBe('00:15');
        });
    });
    (0, vitest_1.describe)('getPatternStatusDisplay', () => {
        (0, vitest_1.it)('should return display info for pattern status', () => {
            const display = (0, schedule_utils_1.getPatternStatusDisplay)('ACTIVE');
            (0, vitest_1.expect)(display.label).toBe('Active');
            (0, vitest_1.expect)(typeof display.color).toBe('string');
        });
    });
    (0, vitest_1.describe)('getDayOfWeek', () => {
        (0, vitest_1.it)('should return day of week', () => {
            const monday = new Date('2024-01-15');
            (0, vitest_1.expect)((0, schedule_utils_1.getDayOfWeek)(monday)).toBe('SUNDAY');
        });
    });
    (0, vitest_1.describe)('isPatternActiveOnDate', () => {
        (0, vitest_1.it)('should check if pattern is active on date', () => {
            const pattern = {
                effectiveFrom: new Date('2024-01-01'),
                effectiveTo: new Date('2024-12-31'),
                status: 'ACTIVE'
            };
            const testDate = new Date('2024-06-15');
            (0, vitest_1.expect)((0, schedule_utils_1.isPatternActiveOnDate)(pattern, testDate)).toBe(true);
        });
    });
    (0, vitest_1.describe)('getTimeOfDay', () => {
        (0, vitest_1.it)('should return time of day', () => {
            (0, vitest_1.expect)((0, schedule_utils_1.getTimeOfDay)('06:00')).toBe('EARLY_MORNING');
            (0, vitest_1.expect)((0, schedule_utils_1.getTimeOfDay)('10:00')).toBe('MORNING');
            (0, vitest_1.expect)((0, schedule_utils_1.getTimeOfDay)('14:00')).toBe('AFTERNOON');
            (0, vitest_1.expect)((0, schedule_utils_1.getTimeOfDay)('18:00')).toBe('EVENING');
            (0, vitest_1.expect)((0, schedule_utils_1.getTimeOfDay)('02:00')).toBe('NIGHT');
        });
    });
    (0, vitest_1.describe)('calculateVisitsPerWeek', () => {
        (0, vitest_1.it)('should calculate daily visits', () => {
            const pattern = {
                recurrence: {
                    frequency: 'DAILY',
                    interval: 1,
                    startTime: '09:00',
                    timezone: 'America/New_York',
                },
            };
            (0, vitest_1.expect)((0, schedule_utils_1.calculateVisitsPerWeek)(pattern)).toBe(7);
        });
        (0, vitest_1.it)('should calculate weekly visits', () => {
            const pattern = {
                recurrence: {
                    frequency: 'WEEKLY',
                    interval: 1,
                    daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
                    startTime: '09:00',
                    timezone: 'America/New_York',
                },
            };
            (0, vitest_1.expect)((0, schedule_utils_1.calculateVisitsPerWeek)(pattern)).toBe(3);
        });
    });
    (0, vitest_1.describe)('calculateHoursPerWeek', () => {
        (0, vitest_1.it)('should calculate weekly hours', () => {
            const pattern = {
                recurrence: {
                    frequency: 'WEEKLY',
                    interval: 1,
                    daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
                    startTime: '09:00',
                    timezone: 'America/New_York',
                },
                duration: 120,
            };
            (0, vitest_1.expect)((0, schedule_utils_1.calculateHoursPerWeek)(pattern)).toBe(6);
        });
    });
    (0, vitest_1.describe)('getAssignmentMethodDisplay', () => {
        (0, vitest_1.it)('should return display text for all methods', () => {
            const methods = ['MANUAL', 'AUTO_MATCH', 'SELF_ASSIGN', 'PREFERRED', 'OVERFLOW'];
            methods.forEach(method => {
                const display = (0, schedule_utils_1.getAssignmentMethodDisplay)(method);
                (0, vitest_1.expect)(typeof display).toBe('string');
                (0, vitest_1.expect)(display.length).toBeGreaterThan(0);
            });
        });
    });
    (0, vitest_1.describe)('formatAddress', () => {
        (0, vitest_1.it)('should format complete address', () => {
            const address = {
                line1: '123 Main St',
                line2: 'Apt 4B',
                city: 'Anytown',
                state: 'CA',
                postalCode: '12345',
                country: 'USA'
            };
            const formatted = (0, schedule_utils_1.formatAddress)(address);
            (0, vitest_1.expect)(formatted).toContain('123 Main St');
            (0, vitest_1.expect)(formatted).toContain('Anytown, CA 12345');
        });
    });
    (0, vitest_1.describe)('calculateTaskCompletionPercentage', () => {
        (0, vitest_1.it)('should calculate completion percentage', () => {
            (0, vitest_1.expect)((0, schedule_utils_1.calculateTaskCompletionPercentage)(8, 10)).toBe(80);
            (0, vitest_1.expect)((0, schedule_utils_1.calculateTaskCompletionPercentage)(0, 10)).toBe(0);
            (0, vitest_1.expect)((0, schedule_utils_1.calculateTaskCompletionPercentage)(10, 10)).toBe(100);
        });
        (0, vitest_1.it)('should handle zero total', () => {
            (0, vitest_1.expect)((0, schedule_utils_1.calculateTaskCompletionPercentage)(0, 0)).toBe(0);
        });
    });
    (0, vitest_1.describe)('sortVisitsByTime', () => {
        (0, vitest_1.it)('should sort visits by start time', () => {
            const today = new Date();
            const visits = [
                { scheduledDate: today, scheduledStartTime: '10:00' },
                { scheduledDate: today, scheduledStartTime: '08:00' },
                { scheduledDate: today, scheduledStartTime: '09:00' }
            ];
            const sorted = (0, schedule_utils_1.sortVisitsByTime)(visits);
            (0, vitest_1.expect)(sorted[0].scheduledStartTime).toBe('08:00');
            (0, vitest_1.expect)(sorted[1].scheduledStartTime).toBe('09:00');
            (0, vitest_1.expect)(sorted[2].scheduledStartTime).toBe('10:00');
        });
    });
    (0, vitest_1.describe)('groupVisitsByDate', () => {
        (0, vitest_1.it)('should group visits by date', () => {
            const date1 = new Date('2024-01-15');
            const date2 = new Date('2024-01-16');
            const visits = [
                { scheduledDate: date1, scheduledStartTime: '09:00' },
                { scheduledDate: date2, scheduledStartTime: '10:00' },
                { scheduledDate: date1, scheduledStartTime: '11:00' }
            ];
            const grouped = (0, schedule_utils_1.groupVisitsByDate)(visits);
            (0, vitest_1.expect)(Object.keys(grouped)).toHaveLength(2);
            (0, vitest_1.expect)(grouped['2024-01-14']).toHaveLength(2);
            (0, vitest_1.expect)(grouped['2024-01-15']).toHaveLength(1);
        });
    });
    (0, vitest_1.describe)('filterVisitsByStatus', () => {
        (0, vitest_1.it)('should filter visits by status', () => {
            const visits = [
                { status: 'SCHEDULED' },
                { status: 'COMPLETED' },
                { status: 'SCHEDULED' },
                { status: 'CANCELLED' }
            ];
            const scheduled = (0, schedule_utils_1.filterVisitsByStatus)(visits, ['SCHEDULED']);
            (0, vitest_1.expect)(scheduled).toHaveLength(2);
            const completed = (0, schedule_utils_1.filterVisitsByStatus)(visits, ['COMPLETED']);
            (0, vitest_1.expect)(completed).toHaveLength(1);
        });
    });
    (0, vitest_1.describe)('getTodaysVisits', () => {
        (0, vitest_1.it)('should return today\'s visits', () => {
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const visits = [
                { scheduledDate: today },
                { scheduledDate: tomorrow },
                { scheduledDate: today }
            ];
            const todays = (0, schedule_utils_1.getTodaysVisits)(visits);
            (0, vitest_1.expect)(todays).toHaveLength(2);
            (0, vitest_1.expect)(todays.every(v => v.scheduledDate === today)).toBe(true);
        });
    });
    (0, vitest_1.describe)('getUnassignedCount', () => {
        (0, vitest_1.it)('should count unassigned visits', () => {
            const visits = [
                { status: 'UNASSIGNED', assignedCaregiverId: undefined },
                { status: 'ASSIGNED', assignedCaregiverId: 'caregiver-1' },
                { status: 'SCHEDULED', assignedCaregiverId: undefined },
                { status: 'ASSIGNED', assignedCaregiverId: 'caregiver-2' }
            ];
            const count = (0, schedule_utils_1.getUnassignedCount)(visits);
            (0, vitest_1.expect)(count).toBe(2);
        });
    });
    (0, vitest_1.describe)('isVisitOverdue', () => {
        const pastTime = new Date();
        pastTime.setHours(pastTime.getHours() - 1);
        const futureTime = new Date();
        futureTime.setHours(futureTime.getHours() + 1);
        (0, vitest_1.it)('should identify overdue assigned visits', () => {
            const visit = {
                scheduledDate: pastTime,
                scheduledStartTime: pastTime.toTimeString().substring(0, 5),
                status: 'ASSIGNED'
            };
            (0, vitest_1.expect)((0, schedule_utils_1.isVisitOverdue)(visit)).toBe(true);
        });
        (0, vitest_1.it)('should not flag future visits as overdue', () => {
            const visit = {
                scheduledDate: futureTime,
                scheduledStartTime: futureTime.toTimeString().substring(0, 5),
                status: 'ASSIGNED'
            };
            (0, vitest_1.expect)((0, schedule_utils_1.isVisitOverdue)(visit)).toBe(false);
        });
        (0, vitest_1.it)('should not flag completed visits as overdue', () => {
            const visit = {
                scheduledDate: pastTime,
                scheduledStartTime: pastTime.toTimeString().substring(0, 5),
                status: 'COMPLETED'
            };
            (0, vitest_1.expect)((0, schedule_utils_1.isVisitOverdue)(visit)).toBe(false);
        });
    });
});
//# sourceMappingURL=schedule-utils.test.js.map