/**
 * Six Elements Validator Tests
 *
 * Tests for federal and Texas EVV six required elements validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SixElementsValidator,
  createFederalValidator,
  createTexasValidator,
  type EVVDataInput,
} from '../six-elements-validator';

describe('SixElementsValidator', () => {
  let federalValidator: SixElementsValidator;
  let texasValidator: SixElementsValidator;

  // Complete valid EVV data
  const validEVVData: EVVDataInput = {
    // Element 1: Service Type
    serviceTypeCode: 'T1019',
    serviceTypeName: 'Personal Care Services',

    // Element 2: Client
    clientId: 'client-123',
    clientName: 'John Doe',
    clientMedicaidId: 'TX-MED-12345',

    // Element 3: Caregiver
    caregiverId: 'caregiver-456',
    caregiverName: 'Jane Smith',
    caregiverEmployeeId: 'EMP-789',
    caregiverNPI: '1234567890',

    // Element 4: Service Date
    serviceDate: new Date('2025-11-14'),

    // Element 5: Location
    serviceLocationLatitude: 30.2672,
    serviceLocationLongitude: -97.7431,
    serviceLocationAddress: '123 Main St, Austin, TX 78701',
    locationVerificationMethod: 'GPS',

    // Element 6: Time
    clockInTime: new Date('2025-11-14T09:00:00Z'),
    clockOutTime: new Date('2025-11-14T13:00:00Z'),
    totalDuration: 240,
  };

  beforeEach(() => {
    federalValidator = createFederalValidator();
    texasValidator = createTexasValidator();
  });

  describe('Federal Validator (Basic Six Elements)', () => {
    it('should validate complete federal EVV data as COMPLIANT', () => {
      const result = federalValidator.validate(validEVVData);

      expect(result.isValid).toBe(true);
      expect(result.allElementsPresent).toBe(true);
      expect(result.missingElements).toHaveLength(0);
      expect(result.complianceLevel).toBe('COMPLIANT');
      expect(result.federalCompliant).toBe(true);
    });

    it('should validate all six element results individually', () => {
      const result = federalValidator.validate(validEVVData);

      expect(result.elementResults).toHaveLength(6);

      const serviceType = result.elementResults.find(r => r.element === 'SERVICE_TYPE');
      expect(serviceType?.isPresent).toBe(true);
      expect(serviceType?.isValid).toBe(true);
      expect(serviceType?.value).toBe('T1019');

      const client = result.elementResults.find(r => r.element === 'CLIENT');
      expect(client?.isPresent).toBe(true);
      expect(client?.isValid).toBe(true);

      const caregiver = result.elementResults.find(r => r.element === 'CAREGIVER');
      expect(caregiver?.isPresent).toBe(true);
      expect(caregiver?.isValid).toBe(true);

      const serviceDate = result.elementResults.find(r => r.element === 'SERVICE_DATE');
      expect(serviceDate?.isPresent).toBe(true);
      expect(serviceDate?.isValid).toBe(true);

      const location = result.elementResults.find(r => r.element === 'SERVICE_LOCATION');
      expect(location?.isPresent).toBe(true);
      expect(location?.isValid).toBe(true);

      const time = result.elementResults.find(r => r.element === 'SERVICE_TIME');
      expect(time?.isPresent).toBe(true);
      expect(time?.isValid).toBe(true);
    });

    it('should accept data without Texas enhancements (no NPI, no Medicaid ID)', () => {
      const federalMinimum: EVVDataInput = {
        ...validEVVData,
        clientMedicaidId: undefined, // Not required federally
        caregiverNPI: undefined, // Not required federally
        locationVerificationMethod: undefined, // Not required federally
      };

      const result = federalValidator.validate(federalMinimum);

      expect(result.federalCompliant).toBe(true);
      expect(result.isValid).toBe(true);
    });

    it('should accept in-progress visits (no clock-out)', () => {
      const inProgress: EVVDataInput = {
        ...validEVVData,
        clockOutTime: undefined,
        totalDuration: undefined,
      };

      const result = federalValidator.validate(inProgress);

      expect(result.isValid).toBe(true);
      const timeElement = result.elementResults.find(r => r.element === 'SERVICE_TIME');
      expect(timeElement?.validationMessage).toContain('in progress');
    });
  });

  describe('Texas Validator (Enhanced Requirements)', () => {
    it('should validate complete Texas EVV data as COMPLIANT', () => {
      const result = texasValidator.validate(validEVVData);

      expect(result.isValid).toBe(true);
      expect(result.allElementsPresent).toBe(true);
      expect(result.complianceLevel).toBe('COMPLIANT');
      expect(result.federalCompliant).toBe(true);
      expect(result.texasCompliant).toBe(true);
    });

    it('should require Medicaid ID for Texas compliance', () => {
      const noMedicaidId: EVVDataInput = {
        ...validEVVData,
        clientMedicaidId: undefined,
      };

      const result = texasValidator.validate(noMedicaidId);

      expect(result.texasCompliant).toBe(false);
      const clientElement = result.elementResults.find(r => r.element === 'CLIENT');
      expect(clientElement?.isValid).toBe(false);
      expect(clientElement?.validationMessage).toContain('Medicaid ID');
      expect(clientElement?.texasEnhanced).toBe(true);
    });

    it('should require NPI for Texas compliance', () => {
      const noNPI: EVVDataInput = {
        ...validEVVData,
        caregiverNPI: undefined,
      };

      const result = texasValidator.validate(noNPI);

      expect(result.texasCompliant).toBe(false);
      const caregiverElement = result.elementResults.find(r => r.element === 'CAREGIVER');
      expect(caregiverElement?.isValid).toBe(false);
      expect(caregiverElement?.validationMessage).toContain('NPI');
      expect(caregiverElement?.texasEnhanced).toBe(true);
    });

    it('should require GPS coordinates for Texas compliance', () => {
      const noGPS: EVVDataInput = {
        ...validEVVData,
        serviceLocationLatitude: undefined,
        serviceLocationLongitude: undefined,
      };

      const result = texasValidator.validate(noGPS);

      expect(result.texasCompliant).toBe(false);
      const locationElement = result.elementResults.find(r => r.element === 'SERVICE_LOCATION');
      expect(locationElement?.isValid).toBe(false);
      expect(locationElement?.validationMessage).toContain('GPS coordinates');
      expect(locationElement?.texasEnhanced).toBe(true);
    });

    it('should require location verification method for Texas', () => {
      const noVerification: EVVDataInput = {
        ...validEVVData,
        locationVerificationMethod: undefined,
      };

      const result = texasValidator.validate(noVerification);

      expect(result.texasCompliant).toBe(false);
      const locationElement = result.elementResults.find(r => r.element === 'SERVICE_LOCATION');
      expect(locationElement?.isValid).toBe(false);
      expect(locationElement?.validationMessage).toContain('verification method');
    });
  });

  describe('Missing Elements', () => {
    it('should identify missing service type code', () => {
      const data: EVVDataInput = {
        ...validEVVData,
        serviceTypeCode: undefined,
      };

      const result = federalValidator.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.missingElements).toContain('SERVICE_TYPE');
      expect(result.complianceLevel).toBe('NON_COMPLIANT');
    });

    it('should identify missing client ID', () => {
      const data: EVVDataInput = {
        ...validEVVData,
        clientId: undefined,
      };

      const result = federalValidator.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.missingElements).toContain('CLIENT');
    });

    it('should identify missing caregiver information', () => {
      const data: EVVDataInput = {
        ...validEVVData,
        caregiverId: undefined,
        caregiverEmployeeId: undefined,
      };

      const result = federalValidator.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.missingElements).toContain('CAREGIVER');
    });

    it('should identify missing service date', () => {
      const data: EVVDataInput = {
        ...validEVVData,
        serviceDate: undefined,
      };

      const result = federalValidator.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.missingElements).toContain('SERVICE_DATE');
    });

    it('should identify missing location', () => {
      const data: EVVDataInput = {
        ...validEVVData,
        serviceLocationAddress: undefined,
        serviceLocationLatitude: undefined,
        serviceLocationLongitude: undefined,
      };

      const result = federalValidator.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.missingElements).toContain('SERVICE_LOCATION');
    });

    it('should identify missing clock-in time', () => {
      const data: EVVDataInput = {
        ...validEVVData,
        clockInTime: undefined,
      };

      const result = federalValidator.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.missingElements).toContain('SERVICE_TIME');
    });

    it('should identify multiple missing elements', () => {
      const data: EVVDataInput = {
        serviceTypeCode: undefined,
        clientId: undefined,
        caregiverId: undefined,
      };

      const result = federalValidator.validate(data);

      expect(result.missingElements).toHaveLength(3);
      expect(result.missingElements).toContain('SERVICE_TYPE');
      expect(result.missingElements).toContain('CLIENT');
      expect(result.missingElements).toContain('CAREGIVER');
      expect(result.complianceLevel).toBe('NON_COMPLIANT');
    });
  });

  describe('Invalid Data', () => {
    it('should reject empty service type code', () => {
      const data: EVVDataInput = {
        ...validEVVData,
        serviceTypeCode: '',
      };

      const result = federalValidator.validate(data);

      expect(result.isValid).toBe(false);
      const element = result.elementResults.find(r => r.element === 'SERVICE_TYPE');
      expect(element?.isValid).toBe(false);
    });

    it('should reject invalid service date', () => {
      const data: EVVDataInput = {
        ...validEVVData,
        serviceDate: new Date('invalid'),
      };

      const result = federalValidator.validate(data);

      expect(result.isValid).toBe(false);
      const element = result.elementResults.find(r => r.element === 'SERVICE_DATE');
      expect(element?.isValid).toBe(false);
      expect(element?.validationMessage).toContain('Valid service date is required');
    });

    it('should reject invalid clock-in time', () => {
      const data: EVVDataInput = {
        ...validEVVData,
        clockInTime: new Date('invalid'),
      };

      const result = federalValidator.validate(data);

      expect(result.isValid).toBe(false);
      const element = result.elementResults.find(r => r.element === 'SERVICE_TIME');
      expect(element?.isValid).toBe(false);
    });
  });

  describe('Compliance Level Classification', () => {
    it('should classify as COMPLIANT when all elements valid', () => {
      const result = federalValidator.validate(validEVVData);

      expect(result.complianceLevel).toBe('COMPLIANT');
      expect(result.message).toContain('all six required EVV elements');
    });

    it('should classify as PARTIAL when elements present but invalid', () => {
      const data: EVVDataInput = {
        ...validEVVData,
        serviceDate: new Date('invalid'),
      };

      const result = federalValidator.validate(data);

      // All elements are present, but one is invalid
      expect(result.allElementsPresent).toBe(true);
      expect(result.complianceLevel).toBe('PARTIAL');
    });

    it('should classify as NON_COMPLIANT when elements missing', () => {
      const data: EVVDataInput = {
        serviceTypeCode: undefined,
        clientId: undefined,
      };

      const result = federalValidator.validate(data);

      expect(result.complianceLevel).toBe('NON_COMPLIANT');
      expect(result.message).toContain('Missing elements');
    });
  });

  describe('Validation Messages', () => {
    it('should provide helpful messages for each element', () => {
      const result = federalValidator.validate(validEVVData);

      const serviceType = result.elementResults.find(r => r.element === 'SERVICE_TYPE');
      expect(serviceType?.validationMessage).toContain('T1019');
      expect(serviceType?.validationMessage).toContain('Personal Care Services');

      const client = result.elementResults.find(r => r.element === 'CLIENT');
      expect(client?.validationMessage).toContain('John Doe');

      const caregiver = result.elementResults.find(r => r.element === 'CAREGIVER');
      expect(caregiver?.validationMessage).toContain('Jane Smith');

      const location = result.elementResults.find(r => r.element === 'SERVICE_LOCATION');
      expect(location?.validationMessage).toContain('123 Main St');
    });

    it('should generate overall success message', () => {
      const result = federalValidator.validate(validEVVData);

      expect(result.message).toContain('all six required EVV elements');
      expect(result.message).toContain('Federal compliant');
    });

    it('should generate detailed error message', () => {
      const data: EVVDataInput = {
        ...validEVVData,
        serviceTypeCode: undefined,
        clientId: undefined,
      };

      const result = federalValidator.validate(data);

      expect(result.message).toContain('Missing elements');
      expect(result.message).toContain('SERVICE_TYPE');
      expect(result.message).toContain('CLIENT');
    });

    it('should indicate Texas compliance in message', () => {
      const result = texasValidator.validate(validEVVData);

      expect(result.message).toContain('Texas HHSC compliant');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should validate complete visit with all details', () => {
      const completeVisit: EVVDataInput = {
        serviceTypeCode: 'T1019',
        serviceTypeName: 'Personal Care - Bathing, Dressing, Grooming',
        clientId: 'client-abc-123',
        clientName: 'Mary Johnson',
        clientMedicaidId: 'TX-MED-98765',
        caregiverId: 'caregiver-xyz-456',
        caregiverName: 'Sarah Williams',
        caregiverEmployeeId: 'EMP-2024-001',
        caregiverNPI: '9876543210',
        serviceDate: new Date('2025-11-14'),
        serviceLocationLatitude: 30.2672,
        serviceLocationLongitude: -97.7431,
        serviceLocationAddress: '456 Oak Ave, Austin, TX 78704',
        locationVerificationMethod: 'GPS',
        clockInTime: new Date('2025-11-14T10:00:00Z'),
        clockOutTime: new Date('2025-11-14T12:00:00Z'),
        totalDuration: 120,
      };

      const result = texasValidator.validate(completeVisit);

      expect(result.isValid).toBe(true);
      expect(result.federalCompliant).toBe(true);
      expect(result.texasCompliant).toBe(true);
    });

    it('should validate in-progress visit (no clock-out yet)', () => {
      const inProgress: EVVDataInput = {
        ...validEVVData,
        clockOutTime: undefined,
        totalDuration: undefined,
      };

      const result = texasValidator.validate(inProgress);

      expect(result.isValid).toBe(true);
      const timeElement = result.elementResults.find(r => r.element === 'SERVICE_TIME');
      expect(timeElement?.validationMessage).toContain('in progress');
    });

    it('should handle address-only location (no GPS)', () => {
      const addressOnly: EVVDataInput = {
        ...validEVVData,
        serviceLocationLatitude: undefined,
        serviceLocationLongitude: undefined,
        locationVerificationMethod: undefined,
      };

      // Federal validator should accept address
      const federalResult = federalValidator.validate(addressOnly);
      expect(federalResult.federalCompliant).toBe(true);

      // Texas validator should reject without GPS
      const texasResult = texasValidator.validate(addressOnly);
      expect(texasResult.texasCompliant).toBe(false);
    });

    it('should validate minimum federal data', () => {
      const federalMinimum: EVVDataInput = {
        serviceTypeCode: 'T1019',
        clientId: 'client-123',
        caregiverId: 'caregiver-456',
        caregiverEmployeeId: 'EMP-789',
        serviceDate: new Date('2025-11-14'),
        serviceLocationAddress: '123 Main St, Austin, TX 78701',
        clockInTime: new Date('2025-11-14T09:00:00Z'),
      };

      const result = federalValidator.validate(federalMinimum);

      expect(result.federalCompliant).toBe(true);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should use federal configuration', () => {
      const config = federalValidator.getConfig();

      expect(config.requireTexasEnhancements).toBe(false);
      expect(config.requireNPI).toBe(false);
      expect(config.requireMedicaidId).toBe(false);
      expect(config.requireGPSVerification).toBe(false);
    });

    it('should use Texas configuration', () => {
      const config = texasValidator.getConfig();

      expect(config.requireTexasEnhancements).toBe(true);
      expect(config.requireNPI).toBe(true);
      expect(config.requireMedicaidId).toBe(true);
      expect(config.requireGPSVerification).toBe(true);
    });

    it('should allow custom configuration', () => {
      const customValidator = createTexasValidator({
        requireCompletedVisit: true,
      });

      const inProgress: EVVDataInput = {
        ...validEVVData,
        clockOutTime: undefined,
      };

      const result = customValidator.validate(inProgress);

      expect(result.isValid).toBe(false);
      const timeElement = result.elementResults.find(r => r.element === 'SERVICE_TIME');
      expect(timeElement?.validationMessage).toContain('Clock-out time is required');
    });
  });
});
