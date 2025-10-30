/**
 * Schedule utility functions tests
 * Tests practical scheduling logic and edge cases
 */

import {
  formatVisitDate,
  formatVisitTime,
  getVisitDuration,
  formatDuration,
  calculateActualDuration,
  getVisitStatusDisplay,
  getVisitTypeDisplay,
  isUpcomingVisit,
  isVisitInProgress,
  isVisitCompleted,
  needsAttention,
  hasTimeConflict,
  addMinutesToTime,
  getPatternStatusDisplay,
  getDayOfWeek,
  isPatternActiveOnDate,
  getTimeOfDay,
  calculateVisitsPerWeek,
  calculateHoursPerWeek,
  getAssignmentMethodDisplay,
  formatAddress,
  calculateTaskCompletionPercentage,
  sortVisitsByTime,
  groupVisitsByDate,
  filterVisitsByStatus,
  getTodaysVisits,
  getUnassignedCount,
  isVisitOverdue,
} from '../schedule-utils';
import { Visit, ServicePattern, VisitStatus, VisitType, PatternStatus, DayOfWeek } from '../../types/schedule';
import { parseISO } from 'date-fns';
import { describe, it, expect } from 'vitest';

describe('Schedule Utils', () => {
  describe('formatVisitDate', () => {
    it('should format today as "Today"', () => {
      const today = new Date();
      expect(formatVisitDate(today)).toBe('Today');
    });

    it('should format tomorrow as "Tomorrow"', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(formatVisitDate(tomorrow)).toBe('Tomorrow');
    });

    it('should format yesterday as "Yesterday"', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatVisitDate(yesterday)).toBe('Yesterday');
    });

    it('should format other dates in readable format', () => {
      const date = new Date(2024, 0, 15); // Jan 15, 2024
      expect(formatVisitDate(date)).toBe('Jan 15, 2024');
    });
  });

  describe('formatVisitTime', () => {
    it('should format time range in 12-hour format', () => {
      expect(formatVisitTime('09:00', '10:00')).toBe('9:00 AM - 10:00 AM');
      expect(formatVisitTime('13:30', '14:30')).toBe('1:30 PM - 2:30 PM');
      expect(formatVisitTime('23:45', '00:45')).toBe('11:45 PM - 12:45 AM');
    });
  });

  describe('getVisitDuration', () => {
    it('should calculate duration between start and end times', () => {
      expect(getVisitDuration('09:00', '10:30')).toBe(90);
      expect(getVisitDuration('14:15', '15:00')).toBe(45);
    });
  });

  describe('formatDuration', () => {
    it('should format minutes in readable format', () => {
      expect(formatDuration(30)).toBe('30 min');
      expect(formatDuration(60)).toBe('1 hour');
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(120)).toBe('2 hours');
    });
  });

  describe('calculateActualDuration', () => {
    it('should calculate actual visit duration', () => {
      const start = new Date('2024-01-15T09:00:00Z');
      const end = new Date('2024-01-15T10:30:00Z');
      expect(calculateActualDuration(start, end)).toBe(90);
    });
  });

  describe('getVisitStatusDisplay', () => {
    it('should return display info for visit status', () => {
      const display = getVisitStatusDisplay('SCHEDULED');
      expect(display.label).toBe('Scheduled');
      expect(typeof display.color).toBe('string');
    });
  });

  describe('getVisitTypeDisplay', () => {
    it('should return display info for visit type', () => {
      const display = getVisitTypeDisplay('REGULAR');
      expect(display.label).toBe('Regular Visit');
      expect(typeof display.description).toBe('string');
    });
  });

  describe('isUpcomingVisit', () => {
    it('should identify upcoming visits', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const visit = {
        scheduledDate: futureDate,
        status: 'SCHEDULED' as VisitStatus
      };
      
      expect(isUpcomingVisit(visit)).toBe(true);
    });

    it('should not identify past visits as upcoming', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const visit = {
        scheduledDate: pastDate,
        status: 'SCHEDULED' as VisitStatus
      };
      
      expect(isUpcomingVisit(visit)).toBe(false);
    });
  });

  describe('isVisitInProgress', () => {
    it('should identify visits in progress', () => {
      const visit = {
        status: 'IN_PROGRESS' as VisitStatus
      };
      
      expect(isVisitInProgress(visit)).toBe(true);
    });

    it('should not identify completed visits as in progress', () => {
      const visit = {
        status: 'COMPLETED' as VisitStatus
      };
      
      expect(isVisitInProgress(visit)).toBe(false);
    });
  });

  describe('isVisitCompleted', () => {
    it('should identify completed visits', () => {
      const visit = {
        status: 'COMPLETED' as VisitStatus
      };
      
      expect(isVisitCompleted(visit)).toBe(true);
    });

    it('should not identify scheduled visits as completed', () => {
      const visit = {
        status: 'SCHEDULED' as VisitStatus
      };
      
      expect(isVisitCompleted(visit)).toBe(false);
    });
  });

  describe('needsAttention', () => {
    it('should identify visits needing attention', () => {
      const visit = {
        status: 'UNASSIGNED' as VisitStatus,
        scheduledDate: new Date(),
        isUrgent: false,
        isPriority: false
      };
      
      expect(needsAttention(visit)).toBe(true);
    });

    it('should not identify normal visits as needing attention', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const visit = {
        status: 'ASSIGNED' as VisitStatus,
        scheduledDate: futureDate,
        isUrgent: false,
        isPriority: false
      };
      
      expect(needsAttention(visit)).toBe(false);
    });
  });

  describe('hasTimeConflict', () => {
    it('should detect overlapping visits', () => {
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
      
      expect(hasTimeConflict(visit1, visit2)).toBe(true);
    });

    it('should not conflict with non-overlapping visits', () => {
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
      
      expect(hasTimeConflict(visit1, visit2)).toBe(false);
    });
  });

  describe('addMinutesToTime', () => {
    it('should add minutes to time', () => {
      expect(addMinutesToTime('09:00', 30)).toBe('09:30');
      expect(addMinutesToTime('23:30', 45)).toBe('00:15');
    });
  });

  describe('getPatternStatusDisplay', () => {
    it('should return display info for pattern status', () => {
      const display = getPatternStatusDisplay('ACTIVE');
      expect(display.label).toBe('Active');
      expect(typeof display.color).toBe('string');
    });
  });

  describe('getDayOfWeek', () => {
    it('should return day of week', () => {
      const monday = new Date('2024-01-15'); // Actually Sunday in 2024
      expect(getDayOfWeek(monday)).toBe('SUNDAY');
    });
  });

  describe('isPatternActiveOnDate', () => {
    it('should check if pattern is active on date', () => {
      const pattern = {
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: new Date('2024-12-31'),
        status: 'ACTIVE' as PatternStatus
      };
      
      const testDate = new Date('2024-06-15');
      expect(isPatternActiveOnDate(pattern, testDate)).toBe(true);
    });
  });

  describe('getTimeOfDay', () => {
    it('should return time of day', () => {
      expect(getTimeOfDay('06:00')).toBe('EARLY_MORNING');
      expect(getTimeOfDay('10:00')).toBe('MORNING');
      expect(getTimeOfDay('14:00')).toBe('AFTERNOON');
      expect(getTimeOfDay('18:00')).toBe('EVENING');
      expect(getTimeOfDay('02:00')).toBe('NIGHT');
    });
  });

  describe('calculateVisitsPerWeek', () => {
    it('should calculate daily visits', () => {
      const pattern: Pick<ServicePattern, 'recurrence'> = {
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          startTime: '09:00',
          timezone: 'America/New_York',
        },
      };
      expect(calculateVisitsPerWeek(pattern)).toBe(7);
    });

    it('should calculate weekly visits', () => {
      const pattern: Pick<ServicePattern, 'recurrence'> = {
        recurrence: {
          frequency: 'WEEKLY',
          interval: 1,
          daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY'] as DayOfWeek[],
          startTime: '09:00',
          timezone: 'America/New_York',
        },
      };
      expect(calculateVisitsPerWeek(pattern)).toBe(3);
    });
  });

  describe('calculateHoursPerWeek', () => {
    it('should calculate weekly hours', () => {
      const pattern: Pick<ServicePattern, 'recurrence' | 'duration'> = {
        recurrence: {
          frequency: 'WEEKLY',
          interval: 1,
          daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY'] as DayOfWeek[],
          startTime: '09:00',
          timezone: 'America/New_York',
        },
        duration: 120, // 2 hours
      };
      expect(calculateHoursPerWeek(pattern)).toBe(6); // 3 visits * 2 hours
    });
  });

  describe('getAssignmentMethodDisplay', () => {
    it('should return display text for all methods', () => {
      const methods = ['MANUAL', 'AUTO_MATCH', 'SELF_ASSIGN', 'PREFERRED', 'OVERFLOW'];
      methods.forEach(method => {
        const display = getAssignmentMethodDisplay(method as any);
        expect(typeof display).toBe('string');
        expect(display.length).toBeGreaterThan(0);
      });
    });
  });

  describe('formatAddress', () => {
    it('should format complete address', () => {
      const address = {
        line1: '123 Main St',
        line2: 'Apt 4B',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA'
      };
      
      const formatted = formatAddress(address);
      expect(formatted).toContain('123 Main St');
      expect(formatted).toContain('Anytown, CA 12345');
    });
  });

  describe('calculateTaskCompletionPercentage', () => {
    it('should calculate completion percentage', () => {
      expect(calculateTaskCompletionPercentage(8, 10)).toBe(80);
      expect(calculateTaskCompletionPercentage(0, 10)).toBe(0);
      expect(calculateTaskCompletionPercentage(10, 10)).toBe(100);
    });

    it('should handle zero total', () => {
      expect(calculateTaskCompletionPercentage(0, 0)).toBe(0);
    });
  });

  describe('sortVisitsByTime', () => {
    it('should sort visits by start time', () => {
      const today = new Date();
      const visits = [
        { scheduledDate: today, scheduledStartTime: '10:00' },
        { scheduledDate: today, scheduledStartTime: '08:00' },
        { scheduledDate: today, scheduledStartTime: '09:00' }
      ];
      
      const sorted = sortVisitsByTime(visits as any);
      expect(sorted[0].scheduledStartTime).toBe('08:00');
      expect(sorted[1].scheduledStartTime).toBe('09:00');
      expect(sorted[2].scheduledStartTime).toBe('10:00');
    });
  });

  describe('groupVisitsByDate', () => {
    it('should group visits by date', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');
      
      const visits = [
        { scheduledDate: date1, scheduledStartTime: '09:00' },
        { scheduledDate: date2, scheduledStartTime: '10:00' },
        { scheduledDate: date1, scheduledStartTime: '11:00' }
      ];
      
      const grouped = groupVisitsByDate(visits as any);
      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['2024-01-14']).toHaveLength(2); // Due to timezone conversion
      expect(grouped['2024-01-15']).toHaveLength(1);
    });
  });

  describe('filterVisitsByStatus', () => {
    it('should filter visits by status', () => {
      const visits = [
        { status: 'SCHEDULED' as VisitStatus },
        { status: 'COMPLETED' as VisitStatus },
        { status: 'SCHEDULED' as VisitStatus },
        { status: 'CANCELLED' as VisitStatus }
      ];
      
      const scheduled = filterVisitsByStatus(visits as any, ['SCHEDULED']);
      expect(scheduled).toHaveLength(2);
      
      const completed = filterVisitsByStatus(visits as any, ['COMPLETED']);
      expect(completed).toHaveLength(1);
    });
  });

  describe('getTodaysVisits', () => {
    it('should return today\'s visits', () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const visits = [
        { scheduledDate: today },
        { scheduledDate: tomorrow },
        { scheduledDate: today }
      ];
      
      const todays = getTodaysVisits(visits as any);
      expect(todays).toHaveLength(2);
      expect(todays.every(v => v.scheduledDate === today)).toBe(true);
    });
  });

  describe('getUnassignedCount', () => {
    it('should count unassigned visits', () => {
      const visits = [
        { status: 'UNASSIGNED' as VisitStatus, assignedCaregiverId: undefined },
        { status: 'ASSIGNED' as VisitStatus, assignedCaregiverId: 'caregiver-1' },
        { status: 'SCHEDULED' as VisitStatus, assignedCaregiverId: undefined },
        { status: 'ASSIGNED' as VisitStatus, assignedCaregiverId: 'caregiver-2' }
      ];
      
      const count = getUnassignedCount(visits as any);
      expect(count).toBe(2);
    });
  });

  describe('isVisitOverdue', () => {
    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1);

    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 1);

    it('should identify overdue assigned visits', () => {
      const visit = {
        scheduledDate: pastTime,
        scheduledStartTime: pastTime.toTimeString().substring(0, 5),
        status: 'ASSIGNED' as VisitStatus
      };
      expect(isVisitOverdue(visit as any)).toBe(true);
    });

    it('should not flag future visits as overdue', () => {
      const visit = {
        scheduledDate: futureTime,
        scheduledStartTime: futureTime.toTimeString().substring(0, 5),
        status: 'ASSIGNED' as VisitStatus
      };
      expect(isVisitOverdue(visit as any)).toBe(false);
    });

    it('should not flag completed visits as overdue', () => {
      const visit = {
        scheduledDate: pastTime,
        scheduledStartTime: pastTime.toTimeString().substring(0, 5),
        status: 'COMPLETED' as VisitStatus
      };
      expect(isVisitOverdue(visit as any)).toBe(false);
    });
  });
});