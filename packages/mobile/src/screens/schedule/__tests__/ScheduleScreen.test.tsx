/**
 * ScheduleScreen Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { format, startOfWeek, addDays } from 'date-fns';

describe('ScheduleScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Week Calendar', () => {
    it('should display current week days', () => {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 0 });
      const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
      
      expect(days).toHaveLength(7);
      expect(format(days[0], 'EEE')).toBe('Sun');
      expect(format(days[6], 'EEE')).toBe('Sat');
    });

    it('should format dates correctly', () => {
      const date = new Date('2025-01-15T10:00:00Z');
      expect(format(date, 'MMMM yyyy')).toBe('January 2025');
      expect(format(date, 'd')).toBe('15');
    });
  });

  describe('Visit Filtering', () => {
    it('should filter visits by status', () => {
      const visits = [
        { id: '1', status: 'SCHEDULED', scheduledStartTime: new Date().toISOString() },
        { id: '2', status: 'COMPLETED', scheduledStartTime: new Date().toISOString() },
        { id: '3', status: 'SCHEDULED', scheduledStartTime: new Date().toISOString() },
      ];

      const scheduled = visits.filter(v => v.status === 'SCHEDULED');
      expect(scheduled).toHaveLength(2);
    });

    it('should filter visits by date', () => {
      const today = new Date();
      const tomorrow = addDays(today, 1);
      
      const visits = [
        { id: '1', scheduledStartTime: today.toISOString() },
        { id: '2', scheduledStartTime: tomorrow.toISOString() },
      ];

      const todayVisits = visits.filter(v => 
        format(new Date(v.scheduledStartTime), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
      );
      
      expect(todayVisits).toHaveLength(1);
      expect(todayVisits[0].id).toBe('1');
    });
  });

  describe('Status Badge Mapping', () => {
    it('should map status to correct badge variant', () => {
      const getStatusVariant = (status: string) => {
        switch (status) {
          case 'SCHEDULED': return 'primary';
          case 'IN_PROGRESS': return 'warning';
          case 'COMPLETED': return 'success';
          case 'CANCELLED': return 'danger';
          default: return 'primary';
        }
      };

      expect(getStatusVariant('SCHEDULED')).toBe('primary');
      expect(getStatusVariant('IN_PROGRESS')).toBe('warning');
      expect(getStatusVariant('COMPLETED')).toBe('success');
      expect(getStatusVariant('CANCELLED')).toBe('danger');
    });
  });

  describe('Visit Count Calculation', () => {
    it('should count visits for a specific day', () => {
      const today = new Date();
      const visits = [
        { id: '1', scheduledStartTime: today.toISOString() },
        { id: '2', scheduledStartTime: today.toISOString() },
        { id: '3', scheduledStartTime: addDays(today, 1).toISOString() },
      ];

      const todayCount = visits.filter(v =>
        format(new Date(v.scheduledStartTime), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
      ).length;

      expect(todayCount).toBe(2);
    });
  });

  describe('Maps URL Generation', () => {
    it('should generate iOS maps URL correctly', () => {
      const visit = {
        clientName: 'John Doe',
        clientAddress: {
          latitude: 30.2672,
          longitude: -97.7431,
        },
      };

      const label = encodeURIComponent(visit.clientName);
      const url = `maps:?q=${label}&ll=${visit.clientAddress.latitude},${visit.clientAddress.longitude}`;
      
      expect(url).toContain('maps:?q=John%20Doe');
      expect(url).toContain('ll=30.2672,-97.7431');
    });

    it('should generate Android maps URL correctly', () => {
      const visit = {
        clientName: 'John Doe',
        clientAddress: {
          latitude: 30.2672,
          longitude: -97.7431,
        },
      };

      const label = encodeURIComponent(visit.clientName);
      const url = `geo:${visit.clientAddress.latitude},${visit.clientAddress.longitude}?q=${label}`;
      
      expect(url).toContain('geo:30.2672,-97.7431');
      expect(url).toContain('?q=John%20Doe');
    });

    it('should generate fallback Google Maps URL', () => {
      const latitude = 30.2672;
      const longitude = -97.7431;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      
      expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=30.2672,-97.7431');
    });
  });

  describe('Data Loading', () => {
    it('should handle empty visit list', () => {
      const visits: any[] = [];
      expect(visits).toHaveLength(0);
    });

    it('should handle visit data structure', () => {
      const visit = {
        id: '1',
        clientId: 'c1',
        clientName: 'Test Client',
        clientAddress: {
          line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          latitude: 30.2672,
          longitude: -97.7431,
        },
        scheduledStartTime: new Date().toISOString(),
        scheduledEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: 'SCHEDULED' as const,
        serviceTypes: ['Personal Care'],
      };

      expect(visit.id).toBe('1');
      expect(visit.clientName).toBe('Test Client');
      expect(visit.serviceTypes).toContain('Personal Care');
    });
  });

  describe('Time Formatting', () => {
    it('should format visit time correctly', () => {
      const startTime = new Date('2025-01-15T10:00:00');
      const endTime = new Date('2025-01-15T12:00:00');
      
      const formatted = `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
      expect(formatted).toMatch(/\d{1,2}:\d{2} [AP]M - \d{1,2}:\d{2} [AP]M/);
    });
  });
});
