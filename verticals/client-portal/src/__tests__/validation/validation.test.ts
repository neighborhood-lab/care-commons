/**
 * Validation schema tests
 */

import { describe, it, expect } from 'vitest';
import {
  inviteClientToPortalSchema,
  activatePortalAccessSchema,
  createVisitRatingSchema,
  updateVisitRatingSchema,
  createScheduleChangeRequestSchema,
  reviewScheduleChangeRequestSchema,
  scheduleVideoCallSchema,
  rateVideoCallSchema,
  updateAccessibilityPreferencesSchema,
  updateNotificationPreferencesSchema,
  visitRatingFiltersSchema,
  scheduleChangeRequestFiltersSchema,
  videoCallSessionFiltersSchema,
  paginationSchema,
  uuidSchema,
  dateRangeSchema,
} from '../../validation/index';

describe('Validation Schemas', () => {
  describe('inviteClientToPortalSchema', () => {
    it('should validate valid invite input', () => {
      const input = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        expiresInDays: 7,
      };

      const result = inviteClientToPortalSchema.parse(input);
      expect(result.clientId).toBe(input.clientId);
      expect(result.expiresInDays).toBe(7);
    });

    it('should apply defaults', () => {
      const input = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = inviteClientToPortalSchema.parse(input);
      expect(result.expiresInDays).toBe(7);
    });

    it('should reject invalid UUID', () => {
      const input = {
        clientId: 'not-a-uuid',
      };

      expect(() => inviteClientToPortalSchema.parse(input)).toThrow();
    });

    it('should reject expires days outside range', () => {
      const input = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        expiresInDays: 31,
      };

      expect(() => inviteClientToPortalSchema.parse(input)).toThrow();
    });
  });

  describe('activatePortalAccessSchema', () => {
    it('should validate valid activation input', () => {
      const input = {
        invitationCode: 'a'.repeat(32),
        password: 'ValidPass123!',
        acceptTerms: true,
      };

      const result = activatePortalAccessSchema.parse(input);
      expect(result.invitationCode).toBe(input.invitationCode);
      expect(result.password).toBe(input.password);
      expect(result.acceptTerms).toBe(true);
    });

    it('should reject weak password', () => {
      const input = {
        invitationCode: 'a'.repeat(32),
        password: 'weak',
        acceptTerms: true,
      };

      expect(() => activatePortalAccessSchema.parse(input)).toThrow();
    });

    it('should reject password without uppercase', () => {
      const input = {
        invitationCode: 'a'.repeat(32),
        password: 'validpass123!',
        acceptTerms: true,
      };

      expect(() => activatePortalAccessSchema.parse(input)).toThrow();
    });

    it('should reject password without special character', () => {
      const input = {
        invitationCode: 'a'.repeat(32),
        password: 'ValidPass123',
        acceptTerms: true,
      };

      expect(() => activatePortalAccessSchema.parse(input)).toThrow();
    });

    it('should reject when terms not accepted', () => {
      const input = {
        invitationCode: 'a'.repeat(32),
        password: 'ValidPass123!',
        acceptTerms: false,
      };

      expect(() => activatePortalAccessSchema.parse(input)).toThrow();
    });
  });

  describe('createVisitRatingSchema', () => {
    it('should validate valid rating input', () => {
      const input = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        overallRating: 5,
        professionalismRating: 5,
        positiveFeedback: 'Great care!',
      };

      const result = createVisitRatingSchema.parse(input);
      expect(result.overallRating).toBe(5);
      expect(result.isAnonymous).toBe(false);
    });

    it('should reject rating outside 1-5 range', () => {
      const input = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        overallRating: 6,
      };

      expect(() => createVisitRatingSchema.parse(input)).toThrow();
    });

    it('should reject rating of 0', () => {
      const input = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        overallRating: 0,
      };

      expect(() => createVisitRatingSchema.parse(input)).toThrow();
    });

    it('should allow optional fields to be omitted', () => {
      const input = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        overallRating: 4,
      };

      const result = createVisitRatingSchema.parse(input);
      expect(result.professionalismRating).toBeUndefined();
    });
  });

  describe('createScheduleChangeRequestSchema', () => {
    it('should validate RESCHEDULE request', () => {
      const input = {
        requestType: 'RESCHEDULE' as const,
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        requestedStartTime: new Date('2025-12-01T10:00:00Z'),
        requestedEndTime: new Date('2025-12-01T12:00:00Z'),
        requestedReason: 'Doctor appointment conflict',
      };

      const result = createScheduleChangeRequestSchema.parse(input);
      expect(result.requestType).toBe('RESCHEDULE');
      expect(result.priority).toBe(1);
    });

    it('should validate CANCEL request', () => {
      const input = {
        requestType: 'CANCEL' as const,
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        requestedReason: 'Traveling out of town',
      };

      const result = createScheduleChangeRequestSchema.parse(input);
      expect(result.requestType).toBe('CANCEL');
    });

    it('should require visitId for RESCHEDULE', () => {
      const input = {
        requestType: 'RESCHEDULE' as const,
        requestedStartTime: new Date('2025-12-01T10:00:00Z'),
        requestedEndTime: new Date('2025-12-01T12:00:00Z'),
        requestedReason: 'Doctor appointment conflict',
      };

      expect(() => createScheduleChangeRequestSchema.parse(input)).toThrow();
    });

    it('should require times for ADD request', () => {
      const input = {
        requestType: 'ADD' as const,
        requestedReason: 'Need extra help this week',
      };

      expect(() => createScheduleChangeRequestSchema.parse(input)).toThrow();
    });

    it('should reject end time before start time', () => {
      const input = {
        requestType: 'RESCHEDULE' as const,
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        requestedStartTime: new Date('2025-12-01T12:00:00Z'),
        requestedEndTime: new Date('2025-12-01T10:00:00Z'),
        requestedReason: 'Doctor appointment conflict',
      };

      expect(() => createScheduleChangeRequestSchema.parse(input)).toThrow();
    });

    it('should reject short reason', () => {
      const input = {
        requestType: 'CANCEL' as const,
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        requestedReason: 'short',
      };

      expect(() => createScheduleChangeRequestSchema.parse(input)).toThrow();
    });
  });

  describe('reviewScheduleChangeRequestSchema', () => {
    it('should validate APPROVED review', () => {
      const input = {
        status: 'APPROVED' as const,
        reviewNotes: 'Approved and rescheduled',
        newVisitId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = reviewScheduleChangeRequestSchema.parse(input);
      expect(result.status).toBe('APPROVED');
    });

    it('should require denial reason when DENIED', () => {
      const input = {
        status: 'DENIED' as const,
      };

      expect(() => reviewScheduleChangeRequestSchema.parse(input)).toThrow();
    });

    it('should validate DENIED review with reason', () => {
      const input = {
        status: 'DENIED' as const,
        denialReason: 'No availability for requested time',
      };

      const result = reviewScheduleChangeRequestSchema.parse(input);
      expect(result.status).toBe('DENIED');
    });
  });

  describe('scheduleVideoCallSchema', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const laterDate = new Date(futureDate.getTime() + 30 * 60 * 1000);

    it('should validate SCHEDULED call', () => {
      const input = {
        coordinatorId: '123e4567-e89b-12d3-a456-426614174000',
        callType: 'SCHEDULED' as const,
        scheduledStart: futureDate,
        scheduledEnd: laterDate,
        callPurpose: 'Monthly check-in',
      };

      const result = scheduleVideoCallSchema.parse(input);
      expect(result.callType).toBe('SCHEDULED');
      expect(result.captionsEnabled).toBe(false);
    });

    it('should reject end time before start time', () => {
      const input = {
        coordinatorId: '123e4567-e89b-12d3-a456-426614174000',
        callType: 'SCHEDULED' as const,
        scheduledStart: laterDate,
        scheduledEnd: futureDate,
      };

      expect(() => scheduleVideoCallSchema.parse(input)).toThrow();
    });

    it('should reject duration over 2 hours', () => {
      const threeHoursLater = new Date(futureDate.getTime() + 3 * 60 * 60 * 1000);
      const input = {
        coordinatorId: '123e4567-e89b-12d3-a456-426614174000',
        callType: 'SCHEDULED' as const,
        scheduledStart: futureDate,
        scheduledEnd: threeHoursLater,
      };

      expect(() => scheduleVideoCallSchema.parse(input)).toThrow();
    });

    it('should allow ON_DEMAND call in past', () => {
      const input = {
        coordinatorId: '123e4567-e89b-12d3-a456-426614174000',
        callType: 'ON_DEMAND' as const,
        scheduledStart: new Date(),
        scheduledEnd: new Date(Date.now() + 30 * 60 * 1000),
      };

      const result = scheduleVideoCallSchema.parse(input);
      expect(result.callType).toBe('ON_DEMAND');
    });
  });

  describe('rateVideoCallSchema', () => {
    it('should validate valid rating', () => {
      const input = {
        clientRating: 5,
        clientFeedback: 'Great call, very helpful',
        qualityMetrics: {
          audioQuality: 5,
          videoQuality: 4,
          connectionStable: true,
        },
      };

      const result = rateVideoCallSchema.parse(input);
      expect(result.clientRating).toBe(5);
    });

    it('should reject rating outside 1-5 range', () => {
      const input = {
        clientRating: 6,
      };

      expect(() => rateVideoCallSchema.parse(input)).toThrow();
    });
  });

  describe('paginationSchema', () => {
    it('should apply defaults', () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortOrder).toBe('desc');
    });

    it('should validate custom values', () => {
      const input = {
        page: 2,
        limit: 50,
        sortBy: 'created_at',
        sortOrder: 'asc' as const,
      };

      const result = paginationSchema.parse(input);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should reject limit over 100', () => {
      const input = {
        limit: 101,
      };

      expect(() => paginationSchema.parse(input)).toThrow();
    });

    it('should reject page less than 1', () => {
      const input = {
        page: 0,
      };

      expect(() => paginationSchema.parse(input)).toThrow();
    });
  });

  describe('uuidSchema', () => {
    it('should validate valid UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = uuidSchema.parse(uuid);
      expect(result).toBe(uuid);
    });

    it('should reject invalid UUID', () => {
      expect(() => uuidSchema.parse('not-a-uuid')).toThrow();
    });
  });

  describe('dateRangeSchema', () => {
    it('should validate valid date range', () => {
      const input = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      const result = dateRangeSchema.parse(input);
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it('should reject end before start', () => {
      const input = {
        startDate: new Date('2025-12-31'),
        endDate: new Date('2025-01-01'),
      };

      expect(() => dateRangeSchema.parse(input)).toThrow();
    });
  });

  describe('visitRatingFiltersSchema', () => {
    it('should validate filters', () => {
      const input = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        minRating: 3,
        flaggedOnly: true,
      };

      const result = visitRatingFiltersSchema.parse(input);
      expect(result.clientId).toBe(input.clientId);
      expect(result.minRating).toBe(3);
    });

    it('should allow all fields to be optional', () => {
      const result = visitRatingFiltersSchema.parse({});
      expect(result).toBeDefined();
    });
  });

  describe('scheduleChangeRequestFiltersSchema', () => {
    it('should validate filters', () => {
      const input = {
        status: ['PENDING', 'APPROVED'],
        requestType: ['RESCHEDULE'],
      };

      const result = scheduleChangeRequestFiltersSchema.parse(input);
      expect(result.status).toHaveLength(2);
    });
  });

  describe('videoCallSessionFiltersSchema', () => {
    it('should validate filters', () => {
      const input = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        status: ['SCHEDULED', 'COMPLETED'],
        callType: ['SCHEDULED'],
      };

      const result = videoCallSessionFiltersSchema.parse(input);
      expect(result.clientId).toBe(input.clientId);
    });
  });

  describe('updateAccessibilityPreferencesSchema', () => {
    it('should validate partial updates', () => {
      const input = {
        fontSize: 'LARGE' as const,
        theme: 'HIGH_CONTRAST' as const,
      };

      const result = updateAccessibilityPreferencesSchema.parse(input);
      expect(result.fontSize).toBe('LARGE');
      expect(result.theme).toBe('HIGH_CONTRAST');
    });

    it('should allow empty object', () => {
      const result = updateAccessibilityPreferencesSchema.parse({});
      expect(result).toBeDefined();
    });
  });

  describe('updateNotificationPreferencesSchema', () => {
    it('should validate partial updates', () => {
      const input = {
        emailEnabled: false,
        visitReminders: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      };

      const result = updateNotificationPreferencesSchema.parse(input);
      expect(result.emailEnabled).toBe(false);
      expect(result.quietHoursStart).toBe('22:00');
    });

    it('should reject invalid time format', () => {
      const input = {
        quietHoursStart: '25:00',
      };

      expect(() => updateNotificationPreferencesSchema.parse(input)).toThrow();
    });
  });
});
