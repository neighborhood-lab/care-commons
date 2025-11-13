/**
 * State Compliance Configuration Tests
 * 
 * Validates all 50 US states + DC compliance configurations:
 * - Required fields present
 * - Data integrity
 * - Helper functions
 * - State-specific rules
 */

import { describe, it, expect } from 'vitest';
import {
  getStateConfig,
  getAllStateCodes,
  isValidStateCode,
  type StateCode,
} from '../index.js';

describe('State Compliance Configuration', () => {
  describe('Data Completeness', () => {
    it('should have configuration for all 51 jurisdictions (50 states + DC)', () => {
      const stateCodes = getAllStateCodes();
      expect(stateCodes).toHaveLength(51);
    });

    it('should have all required state codes', () => {
      const expectedStates: StateCode[] = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
        'DC'
      ];

      const stateCodes = getAllStateCodes();
      expectedStates.forEach(state => {
        expect(stateCodes).toContain(state);
      });
    });

    it('should have complete EVV configuration for all states', () => {
      const stateCodes = getAllStateCodes();
      stateCodes.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        expect(config.evv).toBeDefined();
        expect(config.evv.mandated).toBeDefined();
        expect(config.evv.aggregators).toBeDefined();
        expect(config.evv.aggregators.length).toBeGreaterThan(0);
        expect(config.evv.geofencing).toBeDefined();
        expect(config.evv.geofencing.baseRadiusMeters).toBeGreaterThan(0);
        expect(config.evv.gracePeriods).toBeDefined();
        expect(config.evv.gracePeriods.earlyClockInMinutes).toBeGreaterThanOrEqual(0);
        expect(config.evv.visitCorrection).toBeDefined();
      });
    });

    it('should have complete background screening configuration for all states', () => {
      const stateCodes = getAllStateCodes();
      stateCodes.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        expect(config.backgroundScreening).toBeDefined();
        expect(config.backgroundScreening.requiredScreenings).toBeDefined();
        expect(config.backgroundScreening.requiredScreenings.length).toBeGreaterThan(0);
        expect(config.backgroundScreening.validityMonths).toBeGreaterThan(0);
        expect(config.backgroundScreening.rescreeningFrequencyMonths).toBeGreaterThan(0);
        expect(config.backgroundScreening.stateRegistries).toBeDefined();
        expect(config.backgroundScreening.disqualifyingOffenses).toBeDefined();
      });
    });

    it('should have complete caregiver credentialing configuration for all states', () => {
      const stateCodes = getAllStateCodes();
      stateCodes.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        expect(config.caregiverCredentialing).toBeDefined();
        expect(config.caregiverCredentialing.minimumTrainingHours).toBeGreaterThan(0);
        expect(config.caregiverCredentialing.minimumTrainingHours).toBeGreaterThanOrEqual(75);
        expect(config.caregiverCredentialing.annualTrainingHours).toBeGreaterThanOrEqual(0);
        expect(config.caregiverCredentialing.requiredCertifications).toBeDefined();
      });
    });

    it('should have complete plan of care configuration for all states', () => {
      const stateCodes = getAllStateCodes();
      stateCodes.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        expect(config.planOfCare).toBeDefined();
        expect(config.planOfCare.skilledNursingReviewDays).toBeGreaterThan(0);
        expect(config.planOfCare.personalCareReviewDays).toBeGreaterThan(0);
        expect(config.planOfCare.physicianOrderRenewalDays).toBeGreaterThan(0);
        expect(config.planOfCare.faceToFaceRequired).toBeDefined();
      });
    });

    it('should have complete regulatory information for all states', () => {
      const stateCodes = getAllStateCodes();
      stateCodes.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        expect(config.regulatory).toBeDefined();
        expect(config.regulatory.primaryAgency).toBeDefined();
        expect(config.regulatory.agencyWebsite).toBeDefined();
        expect(config.regulatory.licenseTypes).toBeDefined();
        expect(config.regulatory.licenseTypes.length).toBeGreaterThan(0);
        expect(config.regulatory.keyRegulations).toBeDefined();
        expect(config.regulatory.medicaidWaiverPrograms).toBeDefined();
      });
    });

    it('should have lastUpdated date for all states', () => {
      const stateCodes = getAllStateCodes();
      stateCodes.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        expect(config.lastUpdated).toBeDefined();
        expect(config.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('Helper Functions', () => {
    it('getStateConfig should return valid configuration', () => {
      const txConfig = getStateConfig('TX');
      expect(txConfig).toBeDefined();
      expect(txConfig.state).toBe('TX');
      expect(txConfig.stateName).toBe('Texas');
    });

    it('getAllStateCodes should return array of StateCode', () => {
      const codes = getAllStateCodes();
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBe(51);
      expect(codes).toContain('TX');
      expect(codes).toContain('FL');
      expect(codes).toContain('CA');
    });

    it('isValidStateCode should validate state codes correctly', () => {
      expect(isValidStateCode('TX')).toBe(true);
      expect(isValidStateCode('FL')).toBe(true);
      expect(isValidStateCode('CA')).toBe(true);
      expect(isValidStateCode('DC')).toBe(true);
      expect(isValidStateCode('XX')).toBe(false);
      expect(isValidStateCode('ZZ')).toBe(false);
      expect(isValidStateCode('')).toBe(false);
    });
  });

  describe('Texas-Specific Rules', () => {
    it('should have correct Texas HHSC EVV configuration', () => {
      const tx = getStateConfig('TX');
      expect(tx.evv.mandated).toBe(true);
      expect(tx.evv.mandateEffectiveDate).toBe('2017-01-01'); // TX early adopter
      expect(tx.evv.aggregators).toContain('HHAeXchange'); // TX mandatory aggregator
      expect(tx.evv.geofencing.baseRadiusMeters).toBe(100);
      expect(tx.evv.geofencing.gpsAccuracyTolerance).toBe(50);
    });

    it('should have Texas Employee Misconduct Registry', () => {
      const tx = getStateConfig('TX');
      expect(tx.backgroundScreening.stateRegistries).toContain('TX Employee Misconduct Registry');
    });

    it('should note VMUR process for visit corrections', () => {
      const tx = getStateConfig('TX');
      expect(tx.evv.visitCorrection.requiresSupervisorApproval).toBe(true);
      expect(tx.notes).toContain('VMUR');
    });
  });

  describe('Florida-Specific Rules', () => {
    it('should have correct Florida AHCA EVV configuration', () => {
      const fl = getStateConfig('FL');
      expect(fl.evv.mandated).toBe(true);
      expect(fl.evv.mandateEffectiveDate).toBe('2019-01-01');
      expect(fl.evv.aggregators).toContain('HHAeXchange');
      expect(fl.evv.aggregators).toContain('Netsmart');
      expect(fl.evv.geofencing.baseRadiusMeters).toBe(150); // FL more lenient
    });

    it('should require Florida Level 2 background screening', () => {
      const fl = getStateConfig('FL');
      expect(fl.backgroundScreening.requiredScreenings).toContain('Level_2');
      expect(fl.backgroundScreening.requiresLiveScan).toBe(true);
    });

    it('should require RN supervision visits every 60 days', () => {
      const fl = getStateConfig('FL');
      expect(fl.planOfCare.rnSupervisionVisitDays).toBe(60);
    });
  });

  describe('California-Specific Rules', () => {
    it('should have California county-based EVV system', () => {
      const ca = getStateConfig('CA');
      expect(ca.evv.aggregators).toContain('Multiple');
      expect(ca.notes).toContain('county');
    });

    it('should require California Home Care Aide Registry', () => {
      const ca = getStateConfig('CA');
      expect(ca.caregiverCredentialing.nurseAideRegistryRequired).toBe(true);
      expect(ca.caregiverCredentialing.requiredCertifications).toContain('Home Care Aide Certificate');
    });

    it('should have strict medication delegation restrictions', () => {
      const ca = getStateConfig('CA');
      expect(ca.caregiverCredentialing.medicationDelegationAllowed).toBe(false);
    });

    it('should require live scan fingerprinting', () => {
      const ca = getStateConfig('CA');
      expect(ca.backgroundScreening.requiresLiveScan).toBe(true);
    });
  });

  describe('New York-Specific Rules', () => {
    it('should have New York Justice Center requirements', () => {
      const ny = getStateConfig('NY');
      expect(ny.backgroundScreening.stateRegistries).toContain('NY Justice Center Registry');
      expect(ny.notes).toContain('Justice Center');
    });

    it('should require higher training hours', () => {
      const ny = getStateConfig('NY');
      expect(ny.caregiverCredentialing.minimumTrainingHours).toBe(100);
    });

    it('should have strict medication delegation', () => {
      const ny = getStateConfig('NY');
      expect(ny.caregiverCredentialing.medicationDelegationAllowed).toBe(false);
    });
  });

  describe('Illinois-Specific Rules', () => {
    it('should require 120 hours of training', () => {
      const il = getStateConfig('IL');
      expect(il.caregiverCredentialing.minimumTrainingHours).toBe(120);
    });

    it('should have Health Care Worker Registry', () => {
      const il = getStateConfig('IL');
      expect(il.backgroundScreening.stateRegistries).toContain('IL Health Care Worker Registry');
    });
  });

  describe('Massachusetts-Specific Rules', () => {
    it('should require CORI checks', () => {
      const ma = getStateConfig('MA');
      expect(ma.backgroundScreening.stateRegistries).toContain('MA CORI');
      expect(ma.notes).toContain('CORI');
    });

    it('should have stricter rescreening frequency', () => {
      const ma = getStateConfig('MA');
      expect(ma.backgroundScreening.rescreeningFrequencyMonths).toBe(36);
    });
  });

  describe('Wisconsin-Specific Rules', () => {
    it('should require 120 hours of training', () => {
      const wi = getStateConfig('WI');
      expect(wi.caregiverCredentialing.minimumTrainingHours).toBe(120);
    });

    it('should have 48-month rescreening frequency', () => {
      const wi = getStateConfig('WI');
      expect(wi.backgroundScreening.rescreeningFrequencyMonths).toBe(48);
    });
  });

  describe('Rural State Accommodations', () => {
    const ruralStates: StateCode[] = ['AK', 'MT', 'ND', 'SD', 'VT', 'WY', 'ME'];

    it('should have flexible EVV geofencing for rural states', () => {
      ruralStates.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        // Rural states should have either:
        // 1. Geofencing not required, OR
        // 2. Larger radius with higher GPS tolerance
        if (!config.evv.geofencing.required) {
          expect(config.evv.geofencing.baseRadiusMeters).toBeGreaterThanOrEqual(150);
        }
      });
    });

    it('should allow longer grace periods for rural states', () => {
      ruralStates.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        if (!config.evv.geofencing.required) {
          expect(config.evv.gracePeriods.earlyClockInMinutes).toBeGreaterThanOrEqual(15);
        }
      });
    });

    it('should allow telehealth supervision for some rural states', () => {
      const telehealthAllowed = ruralStates.filter(stateCode => {
        const config = getStateConfig(stateCode);
        return config.planOfCare.telehealthSupervisionAllowed;
      });
      expect(telehealthAllowed.length).toBeGreaterThan(0);
    });
  });

  describe('EVV Early Adopters', () => {
    it('should identify early EVV adopter states', () => {
      const tx = getStateConfig('TX');
      const ar = getStateConfig('AR');
      const ca = getStateConfig('CA');
      const az = getStateConfig('AZ');

      // Texas - earliest adopter
      expect(tx.evv.mandateEffectiveDate).toBe('2017-01-01');
      
      // Arkansas - early adopter
      expect(ar.evv.mandateEffectiveDate).toBe('2019-01-01');
      
      // California - early adopter
      expect(ca.evv.mandateEffectiveDate).toBe('2019-01-01');
      
      // Arizona - early adopter
      expect(az.evv.mandateEffectiveDate).toBe('2020-01-01');
    });
  });

  describe('Data Validation', () => {
    it('should have reasonable training hour requirements (75-120)', () => {
      const stateCodes = getAllStateCodes();
      stateCodes.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        expect(config.caregiverCredentialing.minimumTrainingHours).toBeGreaterThanOrEqual(75);
        expect(config.caregiverCredentialing.minimumTrainingHours).toBeLessThanOrEqual(120);
      });
    });

    it('should have reasonable geofence radius (100-200m)', () => {
      const stateCodes = getAllStateCodes();
      stateCodes.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        expect(config.evv.geofencing.baseRadiusMeters).toBeGreaterThanOrEqual(100);
        expect(config.evv.geofencing.baseRadiusMeters).toBeLessThanOrEqual(200);
      });
    });

    it('should have reasonable grace periods (7-15 minutes)', () => {
      const stateCodes = getAllStateCodes();
      stateCodes.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        expect(config.evv.gracePeriods.earlyClockInMinutes).toBeGreaterThanOrEqual(7);
        expect(config.evv.gracePeriods.earlyClockInMinutes).toBeLessThanOrEqual(15);
      });
    });

    it('should have reasonable plan of care review frequencies', () => {
      const stateCodes = getAllStateCodes();
      stateCodes.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        // Skilled nursing: 60 days typical
        expect(config.planOfCare.skilledNursingReviewDays).toBe(60);
        // Personal care: 90-180 days
        expect(config.planOfCare.personalCareReviewDays).toBeGreaterThanOrEqual(90);
        expect(config.planOfCare.personalCareReviewDays).toBeLessThanOrEqual(180);
      });
    });

    it('should have rescreening frequency between 24-60 months', () => {
      const stateCodes = getAllStateCodes();
      stateCodes.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        expect(config.backgroundScreening.rescreeningFrequencyMonths).toBeGreaterThanOrEqual(24);
        expect(config.backgroundScreening.rescreeningFrequencyMonths).toBeLessThanOrEqual(60);
      });
    });
  });

  describe('Regulatory Agency Information', () => {
    it('should have valid agency websites', () => {
      const stateCodes = getAllStateCodes();
      stateCodes.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        expect(config.regulatory.agencyWebsite).toMatch(/^https?:\/\//);
      });
    });

    it('should have incident reporting timeframes', () => {
      const stateCodes = getAllStateCodes();
      stateCodes.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        expect(config.regulatory.incidentReportingHours).toBeGreaterThan(0);
        expect(config.regulatory.seriousIncidentReportingHours).toBeGreaterThan(0);
        expect(config.regulatory.seriousIncidentReportingHours).toBeLessThanOrEqual(
          config.regulatory.incidentReportingHours
        );
      });
    });

    it('should have at least one Medicaid waiver program per state', () => {
      const stateCodes = getAllStateCodes();
      stateCodes.forEach(stateCode => {
        const config = getStateConfig(stateCode);
        expect(config.regulatory.medicaidWaiverPrograms.length).toBeGreaterThan(0);
      });
    });
  });
});
