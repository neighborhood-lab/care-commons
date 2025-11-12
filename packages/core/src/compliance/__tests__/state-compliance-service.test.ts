/**
 * Tests for State Compliance Service
 *
 * Comprehensive test coverage for state-specific compliance validation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StateComplianceService } from '../state-compliance-service.js';
import type {
  VisitData,
  CaregiverComplianceData,
  PlanOfCareData,
} from '../state-compliance-service.js';

describe('StateComplianceService', () => {
  let service: StateComplianceService;

  beforeEach(() => {
    service = new StateComplianceService();
  });

  describe('getStateConfig', () => {
    it('should return configuration for valid state', () => {
      const config = service.getStateConfig('TX');
      expect(config.state).toBe('TX');
      expect(config.stateName).toBe('Texas');
    });
  });

  describe('validateEVVForState - Texas (Strict)', () => {
    const baseVisitData: VisitData = {
      clientLatitude: 30.2672,
      clientLongitude: -97.7431,
      clockInLatitude: 30.2672,
      clockInLongitude: -97.7431,
      clockInTime: new Date('2025-01-15T08:00:00'),
      scheduledStartTime: new Date('2025-01-15T08:00:00'),
      gpsAccuracy: 10,
    };

    it('should pass validation for compliant visit', () => {
      const result = service.validateEVVForState('TX', baseVisitData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail geofence validation when too far from client', () => {
      const visitData: VisitData = {
        ...baseVisitData,
        clockInLatitude: 30.2680, // ~89 meters away
        clockInLongitude: -97.7440, // Combined with lat change, exceeds 100m + 10m accuracy
      };

      const result = service.validateEVVForState('TX', visitData);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('GEOFENCE_VIOLATION');
      expect(result.errors[0]?.field).toBe('clockInLocation');
    });

    it('should fail when clocking in too early', () => {
      const visitData: VisitData = {
        ...baseVisitData,
        clockInTime: new Date('2025-01-15T07:40:00'), // 20 minutes early (TX allows 10 min)
      };

      const result = service.validateEVVForState('TX', visitData);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('EARLY_CLOCK_IN');
    });

    it('should pass when clocking in within grace period', () => {
      const visitData: VisitData = {
        ...baseVisitData,
        clockInTime: new Date('2025-01-15T07:55:00'), // 5 minutes early (within 10 min grace)
      };

      const result = service.validateEVVForState('TX', visitData);
      expect(result.valid).toBe(true);
    });

    it('should validate clock-out timing', () => {
      const visitData: VisitData = {
        ...baseVisitData,
        clockOutTime: new Date('2025-01-15T09:30:00'), // 30 minutes late
        scheduledEndTime: new Date('2025-01-15T09:00:00'),
        clockOutLatitude: 30.2672,
        clockOutLongitude: -97.7431,
      };

      const result = service.validateEVVForState('TX', visitData);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('LATE_CLOCK_OUT');
    });
  });

  describe('validateEVVForState - Florida (Moderate)', () => {
    it('should allow larger geofence radius', () => {
      const visitData: VisitData = {
        clientLatitude: 28.5383,
        clientLongitude: -81.3792,
        clockInLatitude: 28.5393, // ~111 meters away
        clockInLongitude: -81.3792,
        clockInTime: new Date('2025-01-15T08:00:00'),
        scheduledStartTime: new Date('2025-01-15T08:00:00'),
        gpsAccuracy: 50,
      };

      // Florida: 150m base + 50m accuracy = 200m allowed
      // This should pass since distance is ~111m
      const result = service.validateEVVForState('FL', visitData);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateEVVForState - Montana (Rural/Flexible)', () => {
    it('should allow flexible geofencing for rural state', () => {
      const visitData: VisitData = {
        clientLatitude: 46.5891,
        clientLongitude: -112.0391,
        clockInLatitude: 46.5900, // ~100 meters away
        clockInLongitude: -112.0391,
        clockInTime: new Date('2025-01-15T08:00:00'),
        scheduledStartTime: new Date('2025-01-15T08:00:00'),
        gpsAccuracy: 100,
      };

      // Montana: 200m base + 100m accuracy = 300m allowed
      const result = service.validateEVVForState('MT', visitData);
      expect(result.valid).toBe(true);
    });

    it('should allow longer grace periods', () => {
      const visitData: VisitData = {
        clientLatitude: 46.5891,
        clientLongitude: -112.0391,
        clockInLatitude: 46.5891,
        clockInLongitude: -112.0391,
        clockInTime: new Date('2025-01-15T07:50:00'), // 10 minutes early
        scheduledStartTime: new Date('2025-01-15T08:00:00'),
        gpsAccuracy: 50,
      };

      // Montana allows 15 minutes early clock-in
      const result = service.validateEVVForState('MT', visitData);
      expect(result.valid).toBe(true);
    });
  });

  describe('getGeofenceRadius', () => {
    it('should return correct radius for Texas', () => {
      const radius = service.getGeofenceRadius('TX', 15);
      expect(radius).toBe(115); // 100 base + 15 accuracy
    });

    it('should return correct radius for Florida', () => {
      const radius = service.getGeofenceRadius('FL', 20);
      expect(radius).toBe(170); // 150 base + 20 accuracy
    });

    it('should use default GPS accuracy if not provided', () => {
      const radius = service.getGeofenceRadius('TX');
      expect(radius).toBe(150); // 100 base + 50 default tolerance
    });
  });

  describe('checkBackgroundScreeningValid', () => {
    it('should validate based on expiration date if provided', () => {
      const caregiver: CaregiverComplianceData = {
        backgroundScreeningExpiration: new Date('2026-12-31'),
        trainingHoursCompleted: 80,
        annualTrainingHours: 12,
        certificationsHeld: ['CPR', 'First Aid'],
      };

      const isValid = service.checkBackgroundScreeningValid('TX', caregiver);
      expect(isValid).toBe(true);
    });

    it('should return false for expired screening', () => {
      const caregiver: CaregiverComplianceData = {
        backgroundScreeningExpiration: new Date('2020-01-01'),
        trainingHoursCompleted: 80,
        annualTrainingHours: 12,
        certificationsHeld: ['CPR', 'First Aid'],
      };

      const isValid = service.checkBackgroundScreeningValid('TX', caregiver);
      expect(isValid).toBe(false);
    });

    it('should calculate expiration from screening date (TX - biennial)', () => {
      const screeningDate = new Date('2024-01-01');
      const caregiver: CaregiverComplianceData = {
        backgroundScreeningDate: screeningDate,
        trainingHoursCompleted: 80,
        annualTrainingHours: 12,
        certificationsHeld: ['CPR', 'First Aid'],
      };

      // Texas requires biennial (24 months) rescreening
      // Screening from 2024-01-01 should still be valid as of test date
      const isValid = service.checkBackgroundScreeningValid('TX', caregiver);
      expect(isValid).toBe(true);
    });

    it('should handle different validity periods by state', () => {
      const screeningDate = new Date('2020-01-01');
      const caregiver: CaregiverComplianceData = {
        backgroundScreeningDate: screeningDate,
        trainingHoursCompleted: 75,
        annualTrainingHours: 12,
        certificationsHeld: ['CPR', 'First Aid'],
      };

      // Alabama has 60-month (5-year) validity
      const isValid = service.checkBackgroundScreeningValid('AL', caregiver);
      expect(isValid).toBe(false); // 2020 screening is expired
    });
  });

  describe('getBackgroundScreeningRescreeningDate', () => {
    it('should calculate rescreening date for Texas (5-year)', () => {
      const lastScreening = new Date('2024-01-01');
      const rescreeningDate = service.getBackgroundScreeningRescreeningDate('TX', lastScreening);

      const expected = new Date('2029-01-01'); // 60 months later
      expect(rescreeningDate.toISOString()).toBe(expected.toISOString());
    });

    it('should calculate rescreening date for Florida (5-year)', () => {
      const lastScreening = new Date('2020-01-01');
      const rescreeningDate = service.getBackgroundScreeningRescreeningDate('FL', lastScreening);

      const expected = new Date('2025-01-01'); // 60 months later
      expect(rescreeningDate.toISOString()).toBe(expected.toISOString());
    });
  });

  describe('checkCaregiverCredentialingValid', () => {
    it('should return false if nurse aide registry required but missing', () => {
      const caregiver: CaregiverComplianceData = {
        // nurseAideRegistryNumber missing
        trainingHoursCompleted: 80,
        annualTrainingHours: 12,
        certificationsHeld: ['CPR', 'First Aid'],
      };

      const isValid = service.checkCaregiverCredentialingValid('TX', caregiver);
      expect(isValid).toBe(false);
    });

    it('should return false if insufficient training hours', () => {
      const caregiver: CaregiverComplianceData = {
        nurseAideRegistryNumber: 'TX12345',
        trainingHoursCompleted: 40, // TX requires 75
        annualTrainingHours: 12,
        certificationsHeld: ['CPR', 'First Aid'],
      };

      const isValid = service.checkCaregiverCredentialingValid('TX', caregiver);
      expect(isValid).toBe(false);
    });

    it('should return false if missing required certifications', () => {
      const caregiver: CaregiverComplianceData = {
        nurseAideRegistryNumber: 'TX12345',
        trainingHoursCompleted: 80,
        annualTrainingHours: 12,
        certificationsHeld: ['CPR'], // Missing First Aid
      };

      const isValid = service.checkCaregiverCredentialingValid('TX', caregiver);
      expect(isValid).toBe(false);
    });

    it('should return false if insufficient annual training', () => {
      const caregiver: CaregiverComplianceData = {
        nurseAideRegistryNumber: 'TX12345',
        trainingHoursCompleted: 80,
        annualTrainingHours: 8, // TX requires 12
        certificationsHeld: ['CPR', 'First Aid'],
      };

      const isValid = service.checkCaregiverCredentialingValid('TX', caregiver);
      expect(isValid).toBe(false);
    });

    it('should return true when all requirements met', () => {
      const caregiver: CaregiverComplianceData = {
        nurseAideRegistryNumber: 'TX12345',
        trainingHoursCompleted: 80,
        annualTrainingHours: 12,
        certificationsHeld: ['CPR', 'First Aid'],
      };

      const isValid = service.checkCaregiverCredentialingValid('TX', caregiver);
      expect(isValid).toBe(true);
    });
  });

  describe('getPlanOfCareReviewDue', () => {
    it('should calculate review due date for skilled nursing (TX - 60 days)', () => {
      const lastReview = new Date('2025-01-01');
      const dueDate = service.getPlanOfCareReviewDue('TX', 'SKILLED_NURSING', lastReview);

      const expected = new Date('2025-03-02'); // 60 days later
      expect(dueDate.toISOString()).toBe(expected.toISOString());
    });

    it('should calculate review due date for personal care (TX - 90 days)', () => {
      const lastReview = new Date('2025-01-01T00:00:00.000Z');
      const dueDate = service.getPlanOfCareReviewDue('TX', 'PERSONAL_CARE', lastReview);

      // 90 days from Jan 1, 2025
      const expected = new Date(lastReview);
      expected.setUTCDate(expected.getUTCDate() + 90);
      expect(dueDate.toISOString()).toBe(expected.toISOString());
    });

    it('should use state-specific review frequencies', () => {
      const lastReview = new Date('2025-01-01T00:00:00.000Z');

      // Florida: 60 days for skilled, 90 days for personal care
      const flSkilledDue = service.getPlanOfCareReviewDue('FL', 'SKILLED_NURSING', lastReview);
      const flPersonalDue = service.getPlanOfCareReviewDue('FL', 'PERSONAL_CARE', lastReview);

      const expectedSkilled = new Date(lastReview);
      expectedSkilled.setUTCDate(expectedSkilled.getUTCDate() + 60);
      const expectedPersonal = new Date(lastReview);
      expectedPersonal.setUTCDate(expectedPersonal.getUTCDate() + 90);

      expect(flSkilledDue.toISOString()).toBe(expectedSkilled.toISOString()); // 60 days
      expect(flPersonalDue.toISOString()).toBe(expectedPersonal.toISOString()); // 90 days
    });
  });

  describe('getRNSupervisionDue', () => {
    it('should calculate RN supervision due date when required', () => {
      const lastSupervision = new Date('2025-01-01');
      const dueDate = service.getRNSupervisionDue('FL', lastSupervision);

      const expected = new Date('2025-03-02'); // 60 days later for FL
      expect(dueDate).toEqual(expected);
    });

    it('should return undefined when not required by state', () => {
      const lastSupervision = new Date('2025-01-01');
      const dueDate = service.getRNSupervisionDue('AK', lastSupervision);

      expect(dueDate).toBeUndefined();
    });
  });

  describe('isPlanOfCareReviewDue', () => {
    it('should return true when review is overdue', () => {
      const planOfCare: PlanOfCareData = {
        serviceType: 'SKILLED_NURSING',
        lastReviewDate: new Date('2020-01-01'), // Very old
        physicianOrderDate: new Date('2020-01-01'),
      };

      const isDue = service.isPlanOfCareReviewDue('TX', planOfCare);
      expect(isDue).toBe(true);
    });

    it('should return true when review is due within 7 days', () => {
      const now = new Date();
      const lastReview = new Date(now);
      lastReview.setDate(lastReview.getDate() - 56); // 56 days ago (TX requires 60-day reviews)

      const planOfCare: PlanOfCareData = {
        serviceType: 'SKILLED_NURSING',
        lastReviewDate: lastReview,
        physicianOrderDate: lastReview,
      };

      const isDue = service.isPlanOfCareReviewDue('TX', planOfCare);
      expect(isDue).toBe(true);
    });

    it('should return false when review is not yet due', () => {
      const now = new Date();
      const lastReview = new Date(now);
      lastReview.setDate(lastReview.getDate() - 10); // 10 days ago

      const planOfCare: PlanOfCareData = {
        serviceType: 'SKILLED_NURSING',
        lastReviewDate: lastReview,
        physicianOrderDate: lastReview,
      };

      const isDue = service.isPlanOfCareReviewDue('TX', planOfCare);
      expect(isDue).toBe(false);
    });
  });

  describe('isRNSupervisionDue', () => {
    it('should return true when supervision is overdue', () => {
      const lastSupervision = new Date('2020-01-01');
      const isDue = service.isRNSupervisionDue('FL', lastSupervision);
      expect(isDue).toBe(true);
    });

    it('should return false when supervision is not yet due', () => {
      const now = new Date();
      const lastSupervision = new Date(now);
      lastSupervision.setDate(lastSupervision.getDate() - 10);

      const isDue = service.isRNSupervisionDue('FL', lastSupervision);
      expect(isDue).toBe(false);
    });

    it('should return false when not required by state', () => {
      const lastSupervision = new Date('2020-01-01');
      const isDue = service.isRNSupervisionDue('AK', lastSupervision);
      expect(isDue).toBe(false);
    });
  });

  describe('canCaregiverCorrectVisit', () => {
    it('should return false when caregiver corrections not allowed', () => {
      const visitTime = new Date();
      visitTime.setHours(visitTime.getHours() - 1); // 1 hour ago

      // Alabama doesn't allow caregiver self-correction
      const canCorrect = service.canCaregiverCorrectVisit('AL', visitTime);
      expect(canCorrect).toBe(false);
    });

    it('should return true when within correction window', () => {
      const visitTime = new Date();
      visitTime.setHours(visitTime.getHours() - 10); // 10 hours ago

      // Montana allows caregiver corrections within 48 hours
      const canCorrect = service.canCaregiverCorrectVisit('MT', visitTime);
      expect(canCorrect).toBe(true);
    });

    it('should return false when outside correction window', () => {
      const visitTime = new Date();
      visitTime.setHours(visitTime.getHours() - 50); // 50 hours ago

      // Montana allows corrections within 48 hours
      const canCorrect = service.canCaregiverCorrectVisit('MT', visitTime);
      expect(canCorrect).toBe(false);
    });
  });

  describe('getVisitCorrectionRequirements', () => {
    it('should return Texas correction requirements (strict)', () => {
      const requirements = service.getVisitCorrectionRequirements('TX');

      expect(requirements.caregiverCanCorrect).toBe(false);
      expect(requirements.requiresSupervisorApproval).toBe(true);
      expect(requirements.correctionWindowHours).toBe(24);
    });

    it('should return Montana correction requirements (flexible)', () => {
      const requirements = service.getVisitCorrectionRequirements('MT');

      expect(requirements.caregiverCanCorrect).toBe(true);
      expect(requirements.correctionWindowHours).toBe(48);
    });
  });

  describe('getEVVAggregators', () => {
    it('should return Texas aggregator (HHAeXchange)', () => {
      const aggregators = service.getEVVAggregators('TX');
      expect(aggregators).toContain('HHAeXchange');
    });

    it('should return Florida aggregators (multiple)', () => {
      const aggregators = service.getEVVAggregators('FL');
      expect(aggregators).toContain('HHAeXchange');
      expect(aggregators).toContain('Netsmart');
    });
  });

  describe('getGracePeriods', () => {
    it('should return Texas grace periods', () => {
      const gracePeriods = service.getGracePeriods('TX');
      expect(gracePeriods.earlyClockInMinutes).toBe(10);
      expect(gracePeriods.lateClockOutMinutes).toBe(10);
    });

    it('should return Montana grace periods (more flexible)', () => {
      const gracePeriods = service.getGracePeriods('MT');
      expect(gracePeriods.earlyClockInMinutes).toBe(15);
      expect(gracePeriods.lateClockOutMinutes).toBe(15);
    });
  });
});
