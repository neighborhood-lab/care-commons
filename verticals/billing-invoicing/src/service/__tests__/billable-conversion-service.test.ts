/**
 * Unit tests for BillableConversionService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BillableConversionService } from '../billable-conversion-service';

describe('BillableConversionService', () => {
  let service: BillableConversionService;
  let mockRepository: any;
  let mockVisitProvider: any;
  let mockClientProvider: any;
  let mockRateScheduleService: any;

  beforeEach(() => {
    mockRepository = {
      // Add mock methods
    };

    mockVisitProvider = {
      getVisit: vi.fn(),
    };

    mockClientProvider = {
      getClient: vi.fn(),
    };

    mockRateScheduleService = {
      getRateSchedule: vi.fn(),
    };

    service = new BillableConversionService(
      mockRepository,
      mockVisitProvider,
      mockClientProvider,
      mockRateScheduleService
    );
  });

  describe('calculateBillableUnits', () => {
    it('should calculate units correctly for 1.5 hour visit', () => {
      // 1.5 hours = 90 minutes = 6 units of 15 minutes
      const units = service.calculateBillableUnits(
        new Date('2025-01-01T09:00:00'),
        new Date('2025-01-01T10:30:00'),
        15
      );
      expect(units).toBe(6);
    });

    it('should return minimum 1 unit for very short visits', () => {
      const units = service.calculateBillableUnits(
        new Date('2025-01-01T09:00:00'),
        new Date('2025-01-01T09:05:00'),
        15
      );
      expect(units).toBe(1);
    });

    it('should round to nearest increment', () => {
      // 22 minutes should round to 1.5 units (22/15 = 1.47, rounds to 1)
      const units = service.calculateBillableUnits(
        new Date('2025-01-01T09:00:00'),
        new Date('2025-01-01T09:22:00'),
        15
      );
      expect(units).toBe(1);
    });
  });

  describe('determineModifiers', () => {
    it('should apply weekend modifier for Saturday', () => {
      const visit = {
        id: 1,
        clientId: 'client-1',
        serviceId: 'service-1',
        scheduledStartTime: new Date('2025-01-04T09:00:00'), // Saturday
        actualStartTime: new Date('2025-01-04T09:00:00'),
        actualEndTime: new Date('2025-01-04T10:00:00'),
        status: 'completed',
      };

      const modifiers = service.determineModifiers(visit);
      expect(modifiers).toContain('U3');
    });

    it('should apply weekend modifier for Sunday', () => {
      const visit = {
        id: 1,
        clientId: 'client-1',
        serviceId: 'service-1',
        scheduledStartTime: new Date('2025-01-05T09:00:00'), // Sunday
        actualStartTime: new Date('2025-01-05T09:00:00'),
        actualEndTime: new Date('2025-01-05T10:00:00'),
        status: 'completed',
      };

      const modifiers = service.determineModifiers(visit);
      expect(modifiers).toContain('U3');
    });

    it('should not apply weekend modifier for weekday', () => {
      const visit = {
        id: 1,
        clientId: 'client-1',
        serviceId: 'service-1',
        scheduledStartTime: new Date('2025-01-06T09:00:00'), // Monday
        actualStartTime: new Date('2025-01-06T09:00:00'),
        actualEndTime: new Date('2025-01-06T10:00:00'),
        status: 'completed',
      };

      const modifiers = service.determineModifiers(visit);
      expect(modifiers).not.toContain('U3');
    });

    it('should apply after hours modifier for early morning', () => {
      const visit = {
        id: 1,
        clientId: 'client-1',
        serviceId: 'service-1',
        scheduledStartTime: new Date('2025-01-06T06:00:00'),
        actualStartTime: new Date('2025-01-06T06:00:00'),
        actualEndTime: new Date('2025-01-06T07:00:00'),
        status: 'completed',
      };

      const modifiers = service.determineModifiers(visit);
      expect(modifiers).toContain('U4');
    });

    it('should apply after hours modifier for evening', () => {
      const visit = {
        id: 1,
        clientId: 'client-1',
        serviceId: 'service-1',
        scheduledStartTime: new Date('2025-01-06T19:00:00'),
        actualStartTime: new Date('2025-01-06T19:00:00'),
        actualEndTime: new Date('2025-01-06T20:00:00'),
        status: 'completed',
      };

      const modifiers = service.determineModifiers(visit);
      expect(modifiers).toContain('U4');
    });

    it('should apply live-in modifier', () => {
      const visit = {
        id: 1,
        clientId: 'client-1',
        serviceId: 'service-1',
        scheduledStartTime: new Date('2025-01-06T09:00:00'),
        actualStartTime: new Date('2025-01-06T09:00:00'),
        actualEndTime: new Date('2025-01-06T10:00:00'),
        status: 'completed',
        isLiveIn: true,
      };

      const modifiers = service.determineModifiers(visit);
      expect(modifiers).toContain('U7');
    });

    it('should apply multiple caregivers modifier', () => {
      const visit = {
        id: 1,
        clientId: 'client-1',
        serviceId: 'service-1',
        scheduledStartTime: new Date('2025-01-06T09:00:00'),
        actualStartTime: new Date('2025-01-06T09:00:00'),
        actualEndTime: new Date('2025-01-06T10:00:00'),
        status: 'completed',
        multipleCaregivers: true,
      };

      const modifiers = service.determineModifiers(visit);
      expect(modifiers).toContain('U1');
    });
  });

  describe('applyModifierAdjustments', () => {
    it('should apply percentage modifier correctly', () => {
      const rateSchedule = {
        id: 'rate-1',
        billing_code: 'T1019',
        billing_increment: 15,
        rate_per_unit: 20,
        modifier_rates: {
          U3: { type: 'percentage' as const, value: 10 }, // 10% increase
        },
      };

      const adjustedAmount = service.applyModifierAdjustments(
        100,
        ['U3'],
        rateSchedule
      );

      expect(adjustedAmount).toBe(110); // 100 + 10%
    });

    it('should apply flat modifier correctly', () => {
      const rateSchedule = {
        id: 'rate-1',
        billing_code: 'T1019',
        billing_increment: 15,
        rate_per_unit: 20,
        modifier_rates: {
          U4: { type: 'flat' as const, value: 15 }, // $15 flat
        },
      };

      const adjustedAmount = service.applyModifierAdjustments(
        100,
        ['U4'],
        rateSchedule
      );

      expect(adjustedAmount).toBe(115); // 100 + $15
    });

    it('should apply multiple modifiers correctly', () => {
      const rateSchedule = {
        id: 'rate-1',
        billing_code: 'T1019',
        billing_increment: 15,
        rate_per_unit: 20,
        modifier_rates: {
          U3: { type: 'percentage' as const, value: 10 }, // 10% increase
          U4: { type: 'flat' as const, value: 15 }, // $15 flat
        },
      };

      const adjustedAmount = service.applyModifierAdjustments(
        100,
        ['U3', 'U4'],
        rateSchedule
      );

      expect(adjustedAmount).toBe(125); // (100 * 1.10) + 15 = 110 + 15 = 125
    });

    it('should not change amount if no modifiers defined in rate schedule', () => {
      const rateSchedule = {
        id: 'rate-1',
        billing_code: 'T1019',
        billing_increment: 15,
        rate_per_unit: 20,
        modifier_rates: {},
      };

      const adjustedAmount = service.applyModifierAdjustments(
        100,
        ['U3', 'U4'],
        rateSchedule
      );

      expect(adjustedAmount).toBe(100);
    });
  });
});
