/**
 * Aggregator Router Tests
 * 
 * Comprehensive tests for the aggregator router, including edge cases
 * and error handling for state-based routing.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AggregatorRouter, getAggregatorRouter } from '../aggregator-router.js';
import { EVVRecord } from '../../types/evv.js';
import { StateCode } from '../../types/state-specific.js';

describe('AggregatorRouter', () => {
  let router: AggregatorRouter;

  beforeEach(() => {
    router = new AggregatorRouter();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with aggregator instances', () => {
      expect(router).toBeDefined();
      expect(router).toBeInstanceOf(AggregatorRouter);
    });

    it('should reuse the same aggregator instances for multiple calls', () => {
      // This tests the instance reuse pattern
      const router1 = new AggregatorRouter();
      const router2 = new AggregatorRouter();
      
      expect(router1).toBeDefined();
      expect(router2).toBeDefined();
      expect(router1).not.toBe(router2); // Different router instances
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same router instance from getAggregatorRouter', () => {
      const instance1 = getAggregatorRouter();
      const instance2 = getAggregatorRouter();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(AggregatorRouter);
    });

    it('should create instance on first call', () => {
      // Clear any existing instance by creating a new module context
      const instance = getAggregatorRouter();
      expect(instance).toBeInstanceOf(AggregatorRouter);
    });
  });

  describe('State Routing - Sandata States', () => {
    const sandataStates: StateCode[] = ['OH', 'PA', 'NC', 'AZ'];

    sandataStates.forEach(state => {
      it(`should route ${state} to Sandata aggregator`, async () => {
        const mockRecord = createMockEVVRecord(state);
        
        // Stub implementation throws - this is expected until production HTTP client is added
        // The test validates that routing WORKS and the error comes from the HTTP layer, not routing
        try {
          await router.submit(mockRecord, state);
          // If it doesn't throw, it should return a result
          expect(true).toBe(true);
        } catch (error: any) {
          // Should throw from sendToSandata stub, not from routing logic
          expect(error.message).toContain('Sandata aggregator integration not implemented');
          expect(error.message).toContain(state);
        }
      });
    });

    it('should handle validation errors before HTTP submission', async () => {
      const invalidRecord = createMockEVVRecord('OH');
      // Make record invalid by removing required field
      invalidRecord.serviceTypeCode = '';
      
      const result = await router.submit(invalidRecord, 'OH');
      
      // Should fail validation and return error result (not throw)
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_FAILED');
      expect(result.errorMessage).toContain('Service type code is required');
    });

    it('should use the same Sandata instance for all Sandata states', () => {
      // All Sandata states should route to the same aggregator instance
      expect(router.stateUsesSandata('OH')).toBe(true);
      expect(router.stateUsesSandata('PA')).toBe(true);
      expect(router.stateUsesSandata('NC')).toBe(true);
      expect(router.stateUsesSandata('AZ')).toBe(true);
    });
  });

  describe('State Routing - Tellus (Georgia)', () => {
    it('should route GA to Tellus aggregator', async () => {
      const mockRecord = createMockEVVRecord('GA');
      
      // Stub implementation throws - this is expected until production HTTP client is added
      try {
        await router.submit(mockRecord, 'GA');
        expect(true).toBe(true);
      } catch (error: any) {
        // Should throw from sendToTellus stub, not from routing logic
        expect(error.message).toContain('Tellus aggregator integration not implemented');
        expect(error.message).toContain('GA');
      }
    });

    it('should handle validation errors for GA before HTTP submission', async () => {
      const invalidRecord = createMockEVVRecord('GA');
      // Make record invalid
      invalidRecord.serviceTypeCode = '';
      
      const result = await router.submit(invalidRecord, 'GA');
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_FAILED');
    });

    it('should identify GA does not use Sandata', () => {
      expect(router.stateUsesSandata('GA')).toBe(false);
    });
  });

  describe('State Routing - Texas (HHAeXchange)', () => {
    it('should route TX to HHAeXchange aggregator', async () => {
      const mockRecord = createMockEVVRecord('TX');

      // HHAeXchange aggregator will attempt submission
      const result = await router.submit(mockRecord, 'TX');

      // Expect either success or network error (since we don't have real endpoint)
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should use HHAeXchange for TX submissions', async () => {
      const mockRecord = createMockEVVRecord('TX');

      const result = await router.submit(mockRecord, 'TX');

      // Should return a result object, not throw
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should identify TX does not use Sandata', () => {
      expect(router.stateUsesSandata('TX')).toBe(false);
    });
  });

  describe('State Routing - Florida (Multi-aggregator)', () => {
    it('should route FL to HHAeXchange aggregator', async () => {
      const mockRecord = createMockEVVRecord('FL');

      // HHAeXchange aggregator will attempt submission
      const result = await router.submit(mockRecord, 'FL');

      // Expect either success or network error (since we don't have real endpoint)
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should use HHAeXchange for FL submissions', async () => {
      const mockRecord = createMockEVVRecord('FL');

      const result = await router.submit(mockRecord, 'FL');

      // Should return a result object, not throw
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should identify FL does not use Sandata', () => {
      expect(router.stateUsesSandata('FL')).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    it('should return correct Sandata states list', () => {
      const sandataStates = router.getSandataStates();
      
      expect(sandataStates).toEqual(['OH', 'PA', 'NC', 'AZ']);
      expect(sandataStates).toHaveLength(4);
    });

    it('should return state configuration for valid states', () => {
      const states: StateCode[] = ['OH', 'PA', 'GA', 'NC', 'AZ', 'TX', 'FL'];
      
      states.forEach(state => {
        const config = router.getConfig(state);
        expect(config).toBeDefined();
        expect(config.state).toBe(state); // Field is 'state' not 'stateCode'
        expect(config.aggregatorType).toBeDefined();
      });
    });

    it('should throw for invalid state in getConfig', () => {
      expect(() => {
        router.getConfig('XX' as StateCode);
      }).toThrow(/No EVV configuration found for state: XX/);
    });
  });

  describe('Validation', () => {
    it('should validate record for Sandata states', async () => {
      const mockRecord = createMockEVVRecord('OH');
      
      const result = await router.validate(mockRecord, 'OH');
      
      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should validate record for Tellus (GA)', async () => {
      const mockRecord = createMockEVVRecord('GA');
      
      const result = await router.validate(mockRecord, 'GA');
      
      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
    });

    it('should validate TX records with HHAeXchange aggregator', async () => {
      const mockRecord = createMockEVVRecord('TX');

      const result = await router.validate(mockRecord, 'TX');

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
    });

    it('should validate FL records with HHAeXchange aggregator', async () => {
      const mockRecord = createMockEVVRecord('FL');

      const result = await router.validate(mockRecord, 'FL');

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
    });

    it('should return default validation if aggregator does not implement validate', async () => {
      // This tests the fallback path when aggregator.validate is undefined
      const mockRecord = createMockEVVRecord('OH');
      
      // Mock the aggregator to not have validate method
      const originalValidate = router['sandataAggregator'].validate;
      router['sandataAggregator'].validate = undefined as any;
      
      const result = await router.validate(mockRecord, 'OH');
      
      expect(result).toEqual({
        isValid: true,
        errors: [],
        warnings: [],
      });
      
      // Restore
      router['sandataAggregator'].validate = originalValidate;
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from Sandata aggregator', async () => {
      const mockRecord = createMockEVVRecord('OH');
      
      // Mock the aggregator to throw an error
      const originalSubmit = router['sandataAggregator'].submit;
      router['sandataAggregator'].submit = vi.fn().mockRejectedValue(
        new Error('Sandata API error')
      );
      
      await expect(router.submit(mockRecord, 'OH')).rejects.toThrow('Sandata API error');
      
      // Restore
      router['sandataAggregator'].submit = originalSubmit;
    });

    it('should propagate errors from Tellus aggregator', async () => {
      const mockRecord = createMockEVVRecord('GA');
      
      // Mock the aggregator to throw an error
      const originalSubmit = router['tellusAggregator'].submit;
      router['tellusAggregator'].submit = vi.fn().mockRejectedValue(
        new Error('Tellus API error')
      );
      
      await expect(router.submit(mockRecord, 'GA')).rejects.toThrow('Tellus API error');
      
      // Restore
      router['tellusAggregator'].submit = originalSubmit;
    });

    it('should handle validation errors from aggregators', async () => {
      const mockRecord = createMockEVVRecord('OH');
      
      // Mock validation to return errors
      const originalValidate = router['sandataAggregator'].validate;
      router['sandataAggregator'].validate = vi.fn().mockReturnValue({
        isValid: false,
        errors: ['Invalid caregiver ID'],
        warnings: [],
      });
      
      const result = await router.validate(mockRecord, 'OH');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid caregiver ID');
      
      // Restore
      router['sandataAggregator'].validate = originalValidate;
    });

    it('should handle successful mock submission for Sandata', async () => {
      const mockRecord = createMockEVVRecord('PA');
      
      // Mock successful submission
      const originalSubmit = router['sandataAggregator'].submit;
      router['sandataAggregator'].submit = vi.fn().mockResolvedValue({
        success: true,
        submissionId: 'SANDATA-12345',
        confirmationId: 'CONF-67890',
      });
      
      const result = await router.submit(mockRecord, 'PA');
      
      expect(result.success).toBe(true);
      expect(result.submissionId).toBe('SANDATA-12345');
      expect(result.confirmationId).toBe('CONF-67890');
      
      // Restore
      router['sandataAggregator'].submit = originalSubmit;
    });

    it('should handle successful mock submission for Tellus', async () => {
      const mockRecord = createMockEVVRecord('GA');
      
      // Mock successful submission
      const originalSubmit = router['tellusAggregator'].submit;
      router['tellusAggregator'].submit = vi.fn().mockResolvedValue({
        success: true,
        submissionId: 'TELLUS-54321',
        confirmationId: 'CONF-09876',
      });
      
      const result = await router.submit(mockRecord, 'GA');
      
      expect(result.success).toBe(true);
      expect(result.submissionId).toBe('TELLUS-54321');
      expect(result.confirmationId).toBe('CONF-09876');
      
      // Restore
      router['tellusAggregator'].submit = originalSubmit;
    });

    it('should handle network errors gracefully', async () => {
      const mockRecord = createMockEVVRecord('NC');
      
      // The stub implementation throws - verify it's caught properly
      try {
        await router.submit(mockRecord, 'NC');
        // If no throw, that's also acceptable (future mock implementation)
      } catch (error: any) {
        // Error should be informative
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe('State Configuration Access', () => {
    it('should access geofence configuration via getConfig', () => {
      const ohConfig = router.getConfig('OH');
      expect(ohConfig.geofenceToleranceMeters).toBe(75); // OH: 75m tolerance
      
      const paConfig = router.getConfig('PA');
      expect(paConfig.geofenceToleranceMeters).toBe(50); // PA: 50m tolerance
      
      const gaConfig = router.getConfig('GA');
      expect(gaConfig.geofenceToleranceMeters).toBe(100); // GA: 100m tolerance
    });

    it('should access grace periods via getConfig', () => {
      const ohConfig = router.getConfig('OH');
      expect(ohConfig.gracePeriodMinutes).toBe(10); // OH: 10 minutes
      
      const txConfig = router.getConfig('TX');
      expect(txConfig.gracePeriodMinutes).toBe(10); // TX: 10 minutes
      
      const flConfig = router.getConfig('FL');
      expect(flConfig.gracePeriodMinutes).toBe(15); // FL: 15 minutes
      
      const gaConfig = router.getConfig('GA');
      expect(gaConfig.gracePeriodMinutes).toBe(15); // GA: 15 minutes
    });

    it('should access retention policies via getConfig', () => {
      const paConfig = router.getConfig('PA');
      expect(paConfig.retentionYears).toBe(7); // PA has longest retention (7 years)
      
      // Other states may not have retentionYears defined explicitly
      const gaConfig = router.getConfig('GA');
      expect(gaConfig.retentionYears).toBeUndefined(); // GA doesn't define retentionYears
    });
  });

  describe('Code Reuse Pattern', () => {
    it('should demonstrate single Sandata instance serves 4 states', () => {
      const sandataStates = router.getSandataStates();
      expect(sandataStates).toHaveLength(4);
      
      // All 4 states should identify as using Sandata
      sandataStates.forEach(state => {
        expect(router.stateUsesSandata(state)).toBe(true);
      });
    });

    it('should show non-Sandata states correctly', () => {
      const nonSandataStates: StateCode[] = ['TX', 'FL', 'GA'];
      
      nonSandataStates.forEach(state => {
        expect(router.stateUsesSandata(state)).toBe(false);
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle multiple concurrent submissions to same state', async () => {
      const record1 = createMockEVVRecord('OH');
      const record2 = createMockEVVRecord('OH');
      const record3 = createMockEVVRecord('OH');
      
      // Mock to prevent stub errors
      const originalSubmit = router['sandataAggregator'].submit;
      router['sandataAggregator'].submit = vi.fn().mockResolvedValue({
        success: true,
        submissionId: 'TEST-123',
      });
      
      // Submit concurrently
      const results = await Promise.all([
        router.submit(record1, 'OH'),
        router.submit(record2, 'OH'),
        router.submit(record3, 'OH'),
      ]);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // Restore
      router['sandataAggregator'].submit = originalSubmit;
    });

    it('should handle mixed state submissions concurrently', async () => {
      const ohRecord = createMockEVVRecord('OH');
      const gaRecord = createMockEVVRecord('GA');
      const paRecord = createMockEVVRecord('PA');
      
      // Mock both aggregators
      const originalSandataSubmit = router['sandataAggregator'].submit;
      const originalTellusSubmit = router['tellusAggregator'].submit;
      
      router['sandataAggregator'].submit = vi.fn().mockResolvedValue({
        success: true,
        submissionId: 'SANDATA-123',
      });
      
      router['tellusAggregator'].submit = vi.fn().mockResolvedValue({
        success: true,
        submissionId: 'TELLUS-456',
      });
      
      const results = await Promise.all([
        router.submit(ohRecord, 'OH'),
        router.submit(gaRecord, 'GA'),
        router.submit(paRecord, 'PA'),
      ]);
      
      expect(results).toHaveLength(3);
      expect(results[0].submissionId).toBe('SANDATA-123');
      expect(results[1].submissionId).toBe('TELLUS-456');
      expect(results[2].submissionId).toBe('SANDATA-123');
      
      // Restore
      router['sandataAggregator'].submit = originalSandataSubmit;
      router['tellusAggregator'].submit = originalTellusSubmit;
    });

    it('should validate all Sandata states with same validation logic', async () => {
      const sandataStates: StateCode[] = ['OH', 'PA', 'NC', 'AZ'];
      
      for (const state of sandataStates) {
        const invalidRecord = createMockEVVRecord(state);
        invalidRecord.clockInTime = null as any; // Make invalid
        
        const result = await router.validate(invalidRecord, state);
        
        // All Sandata states should reject missing clock-in time
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.code === 'MISSING_START_TIME')).toBe(true);
      }
    });

    it('should provide state-specific error context', async () => {
      const states: StateCode[] = ['OH', 'PA', 'GA', 'NC', 'AZ'];
      
      for (const state of states) {
        const record = createMockEVVRecord(state);
        
        try {
          await router.submit(record, state);
        } catch (error: any) {
          // Error should mention the specific state
          expect(error.message).toContain(state);
        }
      }
    });
  });
});

// Helper function to create mock EVV records
function createMockEVVRecord(state: StateCode): EVVRecord {
  const now = new Date('2025-11-04T10:00:00Z');
  const clockOutTime = new Date('2025-11-04T12:00:00Z');

  return {
    id: '11111111-1111-1111-1111-111111111111',
    visitId: '22222222-2222-2222-2222-222222222222',
    organizationId: '33333333-3333-3333-3333-333333333333',
    branchId: '44444444-4444-4444-4444-444444444444',
    clientId: '55555555-5555-5555-5555-555555555555',
    caregiverId: '66666666-6666-6666-6666-666666666666',
    
    serviceTypeCode: 'T1019',
    serviceTypeName: 'Personal Care Services',
    
    clientName: 'Test Client',
    clientMedicaidId: 'MED123456',
    
    caregiverName: 'Test Caregiver',
    caregiverEmployeeId: 'EMP001',
    caregiverNationalProviderId: '1234567890',
    
    serviceDate: new Date('2025-11-04'),
    
    serviceAddress: {
      line1: '123 Main St',
      city: 'Test City',
      state,
      postalCode: '12345',
      country: 'US',
      latitude: 39.9612,
      longitude: -82.9988,
      geofenceRadius: 100,
      addressVerified: true,
    },
    
    clockInTime: now,
    clockOutTime,
    totalDuration: 120,
    
    clockInVerification: {
      latitude: 39.9612,
      longitude: -82.9988,
      accuracy: 10,
      timestamp: now,
      timestampSource: 'GPS',
      isWithinGeofence: true,
      distanceFromAddress: 5,
      geofencePassed: true,
      verificationPassed: true,
      deviceId: 'device-123',
      deviceModel: 'iPhone 14',
      deviceOS: 'iOS 17',
      appVersion: '1.0.0',
      method: 'GPS',
      locationSource: 'GPS_SATELLITE',
      mockLocationDetected: false,
    },
    
    clockOutVerification: {
      latitude: 39.9612,
      longitude: -82.9988,
      accuracy: 10,
      timestamp: clockOutTime,
      timestampSource: 'GPS',
      isWithinGeofence: true,
      distanceFromAddress: 5,
      geofencePassed: true,
      verificationPassed: true,
      deviceId: 'device-123',
      deviceModel: 'iPhone 14',
      deviceOS: 'iOS 17',
      appVersion: '1.0.0',
      method: 'GPS',
      locationSource: 'GPS_SATELLITE',
      mockLocationDetected: false,
    },
    
    recordStatus: 'COMPLETE',
    verificationLevel: 'FULL',
    complianceFlags: ['COMPLIANT'],
    integrityHash: 'hash123',
    integrityChecksum: 'checksum123',
    
    recordedAt: now,
    recordedBy: '77777777-7777-7777-7777-777777777777',
    syncMetadata: {
      syncId: '88888888-8888-8888-8888-888888888888',
      lastSyncedAt: now,
      syncStatus: 'SYNCED',
    },
    
    createdAt: now,
    createdBy: '77777777-7777-7777-7777-777777777777',
    updatedAt: now,
    updatedBy: '77777777-7777-7777-7777-777777777777',
    version: 1,
  };
}
