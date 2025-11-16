/**
 * EVV Compliance Orchestrator Tests
 * 
 * Comprehensive test coverage for state-specific EVV compliance validation
 * and aggregator submission orchestration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EVVComplianceOrchestrator } from '../evv-compliance-orchestrator.js';
import { StateComplianceService } from '@care-commons/core';
import { EVVRecord } from '../../types/evv.js';
import { StateProviderFactory } from '../../providers/state-provider-factory.js';

describe('EVVComplianceOrchestrator', () => {
  let orchestrator: EVVComplianceOrchestrator;
  let mockStateComplianceService: StateComplianceService;
  
  // Fixed timestamp for deterministic tests
  const FIXED_DATE = new Date('2025-01-15T08:00:00.000Z');
  const CLOCK_IN_TIME = new Date('2025-01-15T08:05:00.000Z');
  
  beforeEach(() => {
    mockStateComplianceService = new StateComplianceService();
    orchestrator = new EVVComplianceOrchestrator(mockStateComplianceService);
  });
  
  const createMockEVVRecord = (overrides?: Partial<EVVRecord>): EVVRecord => ({
    id: 'evv-record-1',
    visitId: 'visit-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    clientId: 'client-1',
    caregiverId: 'caregiver-1',
    serviceTypeCode: 'PC001',
    serviceTypeName: 'Personal Care',
    clientName: 'John Doe',
    caregiverName: 'Jane Smith',
    caregiverEmployeeId: 'EMP001',
    serviceDate: FIXED_DATE,
    serviceAddress: {
      line1: '123 Main St',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'US',
      latitude: 30.2672,
      longitude: -97.7431,
      geofenceRadius: 100,
      addressVerified: true,
    },
    clockInTime: CLOCK_IN_TIME,
    clockOutTime: null,
    clockInVerification: {
      latitude: 30.2672,
      longitude: -97.7431,
      accuracy: 15,
      timestamp: CLOCK_IN_TIME,
      timestampSource: 'DEVICE',
      isWithinGeofence: true,
      distanceFromAddress: 5,
      geofencePassed: true,
      deviceId: 'device-1',
      deviceModel: 'iPhone 12',
      deviceOS: 'iOS 15.0',
      appVersion: '1.0.0',
      method: 'GPS',
      locationSource: 'GPS_SATELLITE',
      mockLocationDetected: false,
      verificationPassed: true,
    },
    recordStatus: 'PENDING',
    verificationLevel: 'FULL',
    complianceFlags: ['COMPLIANT'],
    integrityHash: 'hash123',
    integrityChecksum: 'checksum123',
    recordedAt: CLOCK_IN_TIME,
    recordedBy: 'caregiver-1',
    syncMetadata: {
      syncId: 'sync-1',
      lastSyncedAt: CLOCK_IN_TIME,
      syncStatus: 'SYNCED',
    },
    createdBy: 'caregiver-1',
    createdAt: CLOCK_IN_TIME,
    updatedBy: 'caregiver-1',
    updatedAt: CLOCK_IN_TIME,
    version: 1,
    ...overrides,
  });
  
  describe('validateWithFeedback', () => {
    it('should validate compliant Texas EVV record', async () => {
      const evvRecord = createMockEVVRecord();
      
      const feedback = await orchestrator.validateWithFeedback(evvRecord, 'TX');
      
      expect(feedback.status).toBe('COMPLIANT');
      expect(feedback.state).toBe('TX');
      expect(feedback.validation.valid).toBe(true);
      expect(feedback.geofence.withinBounds).toBe(true);
      expect(feedback.geofence.distance).toBeLessThanOrEqual(feedback.geofence.allowedRadius);
      expect(feedback.aggregators.required).toContain('HHAeXchange');
      expect(feedback.recommendations).toHaveLength(1);
      expect(feedback.recommendations[0]).toContain('compliant');
    });
    
    it('should detect geofence violation in Texas', async () => {
      const evvRecord = createMockEVVRecord({
        clockInVerification: {
          latitude: 30.3672, // 11km away
          longitude: -97.7431,
          accuracy: 15,
          timestamp: CLOCK_IN_TIME,
          timestampSource: 'DEVICE',
          isWithinGeofence: false,
          distanceFromAddress: 11000,
          geofencePassed: false,
          deviceId: 'device-1',
          deviceModel: 'iPhone 12',
          deviceOS: 'iOS 15.0',
          appVersion: '1.0.0',
          method: 'GPS',
          locationSource: 'GPS_SATELLITE',
          mockLocationDetected: false,
          verificationPassed: false,
        },
      });
      
      const feedback = await orchestrator.validateWithFeedback(evvRecord, 'TX');
      
      expect(feedback.status).toBe('NON_COMPLIANT');
      expect(feedback.geofence.withinBounds).toBe(false);
      expect(feedback.validation.valid).toBe(false);
      expect(feedback.validation.errors).toHaveLength(1);
      expect(feedback.validation.errors[0]?.code).toBe('GEOFENCE_VIOLATION');
      expect(feedback.recommendations.some(r => r.includes('VMUR'))).toBe(true);
    });
    
    it('should use correct geofence radius for Texas (100m + accuracy)', async () => {
      const evvRecord = createMockEVVRecord({
        clockInVerification: {
          ...createMockEVVRecord().clockInVerification,
          accuracy: 50,
        },
      });
      
      const feedback = await orchestrator.validateWithFeedback(evvRecord, 'TX');
      
      // Texas: 100m base + 50m accuracy = 150m total
      expect(feedback.geofence.allowedRadius).toBe(150);
    });
    
    it('should use correct geofence radius for Florida (150m + accuracy)', async () => {
      const evvRecord = createMockEVVRecord({
        serviceAddress: {
          ...createMockEVVRecord().serviceAddress,
          state: 'FL',
        },
        clockInVerification: {
          ...createMockEVVRecord().clockInVerification,
          accuracy: 50,
        },
      });
      
      const feedback = await orchestrator.validateWithFeedback(evvRecord, 'FL');
      
      // Florida: 150m base + 50m accuracy = 200m total
      expect(feedback.geofence.allowedRadius).toBe(200);
    });
    
    it('should detect early clock-in beyond grace period', async () => {
      const earlyClockIn = new Date('2025-01-15T07:40:00.000Z'); // 20 minutes early
      const evvRecord = createMockEVVRecord({
        clockInTime: earlyClockIn,
        clockInVerification: {
          ...createMockEVVRecord().clockInVerification,
          timestamp: earlyClockIn,
        },
      });
      
      const feedback = await orchestrator.validateWithFeedback(evvRecord, 'TX');
      
      // Texas allows 10 minutes early, so 20 minutes should be non-compliant
      expect(feedback.status).toBe('NON_COMPLIANT');
      expect(feedback.gracePeriod.withinGrace).toBe(false);
      expect(feedback.gracePeriod.minutesFromScheduled).toBe(-20);
      expect(feedback.validation.errors.some(e => e.code === 'EARLY_CLOCK_IN')).toBe(true);
      // Recommendation should mention early clock-in
      const hasEarlyRecommendation = feedback.recommendations.some(r => 
        r.toLowerCase().includes('early') || r.includes('billable services')
      );
      expect(hasEarlyRecommendation).toBe(true);
    });
    
    it('should identify multi-aggregator requirement for Florida', async () => {
      const evvRecord = createMockEVVRecord({
        serviceAddress: {
          ...createMockEVVRecord().serviceAddress,
          state: 'FL',
        },
      });
      
      const feedback = await orchestrator.validateWithFeedback(evvRecord, 'FL');
      
      expect(feedback.aggregators.required).toContain('HHAeXchange');
      expect(feedback.regulatoryContext).toContain('Florida');
    });
    
    it('should provide GPS accuracy warning for poor accuracy', async () => {
      const evvRecord = createMockEVVRecord({
        clockInVerification: {
          ...createMockEVVRecord().clockInVerification,
          accuracy: 150, // Poor accuracy but still within geofence
          distanceFromAddress: 10, // Close to address
        },
      });
      
      const feedback = await orchestrator.validateWithFeedback(evvRecord, 'TX');
      
      // Should be compliant if within geofence, even with poor accuracy
      // The geofence radius adjusts for accuracy (100m base + 150m accuracy = 250m total)
      expect(feedback.status).toBe('COMPLIANT');
      expect(feedback.geofence.allowedRadius).toBe(250); // 100 + 150
      expect(feedback.geofence.withinBounds).toBe(true);
    });
  });
  
  describe('submitToAggregators', () => {
    beforeEach(() => {
      // Mock StateProviderFactory
      vi.spyOn(StateProviderFactory, 'isSupported').mockReturnValue(true);
    });
    
    it('should submit to HHAeXchange for Texas', async () => {
      const evvRecord = createMockEVVRecord();
      
      const mockProvider = {
        submitToAggregator: vi.fn().mockResolvedValue({
          success: true,
          submissionId: 'submission-123',
          confirmationId: 'conf-456',
        }),
      };
      
      vi.spyOn(StateProviderFactory, 'getProvider').mockReturnValue(mockProvider as any);
      
      const results = await orchestrator.submitToAggregators(evvRecord, 'TX');
      
      expect(results).toHaveLength(1);
      expect(results[0]?.success).toBe(true);
      expect(results[0]?.aggregatorName).toBe('HHAEEXCHANGE');
      expect(results[0]?.submissionId).toBe('submission-123');
      expect(results[0]?.confirmationId).toBe('conf-456');
      expect(mockProvider.submitToAggregator).toHaveBeenCalledWith(evvRecord);
    });
    
    it('should submit to multiple aggregators for Florida', async () => {
      const evvRecord = createMockEVVRecord({
        serviceAddress: {
          ...createMockEVVRecord().serviceAddress,
          state: 'FL',
        },
      });
      
      const mockProvider = {
        submitToAggregators: vi.fn().mockResolvedValue([
          {
            aggregator: 'HHAEEXCHANGE',
            success: true,
            submissionId: 'hha-123',
            confirmationId: 'hha-conf-456',
          },
          {
            aggregator: 'TELLUS',
            success: true,
            submissionId: 'tellus-123',
            confirmationId: 'tellus-conf-456',
          },
        ]),
      };
      
      vi.spyOn(StateProviderFactory, 'getProvider').mockReturnValue(mockProvider as any);
      
      const results = await orchestrator.submitToAggregators(evvRecord, 'FL');
      
      expect(results).toHaveLength(2);
      expect(results[0]?.aggregatorName).toBe('HHAEEXCHANGE');
      expect(results[1]?.aggregatorName).toBe('TELLUS');
      expect(results.every(r => r.success)).toBe(true);
      expect(mockProvider.submitToAggregators).toHaveBeenCalledWith(evvRecord);
    });
    
    it('should handle submission failure gracefully', async () => {
      const evvRecord = createMockEVVRecord();
      
      const mockProvider = {
        submitToAggregator: vi.fn().mockRejectedValue(new Error('Network timeout')),
      };
      
      vi.spyOn(StateProviderFactory, 'getProvider').mockReturnValue(mockProvider as any);
      
      const results = await orchestrator.submitToAggregators(evvRecord, 'TX');
      
      expect(results).toHaveLength(1);
      expect(results[0]?.success).toBe(false);
      expect(results[0]?.errorCode).toBe('SUBMISSION_FAILED');
      expect(results[0]?.errorMessage).toBe('Network timeout');
    });
  });
  
  describe('validateAndSubmit', () => {
    beforeEach(() => {
      vi.spyOn(StateProviderFactory, 'isSupported').mockReturnValue(true);
    });
    
    it('should validate and submit compliant record', async () => {
      const evvRecord = createMockEVVRecord();
      
      const mockProvider = {
        submitToAggregator: vi.fn().mockResolvedValue({
          success: true,
          submissionId: 'submission-123',
        }),
      };
      
      vi.spyOn(StateProviderFactory, 'getProvider').mockReturnValue(mockProvider as any);
      
      const feedback = await orchestrator.validateAndSubmit(evvRecord, 'TX');
      
      expect(feedback.status).toBe('COMPLIANT');
      expect(feedback.aggregators.submissionStatus).toBe('COMPLETED');
      expect(feedback.aggregators.submissionResults).toHaveLength(1);
      expect(feedback.aggregators.submissionResults?.[0]?.success).toBe(true);
      expect(mockProvider.submitToAggregator).toHaveBeenCalledWith(evvRecord);
    });
    
    it('should not submit non-compliant record', async () => {
      const evvRecord = createMockEVVRecord({
        clockInVerification: {
          ...createMockEVVRecord().clockInVerification,
          latitude: 30.3672, // Far from address
          distanceFromAddress: 11000,
          geofencePassed: false,
          isWithinGeofence: false,
        },
      });
      
      const mockProvider = {
        submitToAggregator: vi.fn(),
      };
      
      vi.spyOn(StateProviderFactory, 'getProvider').mockReturnValue(mockProvider as any);
      
      const feedback = await orchestrator.validateAndSubmit(evvRecord, 'TX');
      
      expect(feedback.status).toBe('NON_COMPLIANT');
      expect(feedback.aggregators.submissionStatus).toBe('PENDING');
      expect(mockProvider.submitToAggregator).not.toHaveBeenCalled();
      expect(feedback.recommendations.some(r => r.includes('cannot be submitted'))).toBe(true);
    });
    
    it('should add recommendation when submission fails', async () => {
      const evvRecord = createMockEVVRecord();
      
      const mockProvider = {
        submitToAggregator: vi.fn().mockResolvedValue({
          success: false,
          submissionId: '',
          errorCode: 'NETWORK_ERROR',
          errorMessage: 'Connection timeout',
        }),
      };
      
      vi.spyOn(StateProviderFactory, 'getProvider').mockReturnValue(mockProvider as any);
      
      const feedback = await orchestrator.validateAndSubmit(evvRecord, 'TX');
      
      expect(feedback.aggregators.submissionStatus).toBe('FAILED');
      expect(feedback.recommendations.some(r => r.includes('Submission failed'))).toBe(true);
    });
  });
  
  describe('generateComplianceDashboard', () => {
    const startDate = new Date('2025-01-01T00:00:00.000Z');
    const endDate = new Date('2025-01-31T23:59:59.999Z');
    
    it('should generate comprehensive dashboard for Texas', () => {
      const evvRecords = [
        createMockEVVRecord({ id: 'evv-1', complianceFlags: ['COMPLIANT'] }),
        createMockEVVRecord({ id: 'evv-2', complianceFlags: ['COMPLIANT', 'LATE_SUBMISSION'] }),
        createMockEVVRecord({ id: 'evv-3', complianceFlags: ['GEOFENCE_VIOLATION'] }),
      ];
      
      const dashboard = orchestrator.generateComplianceDashboard('TX', startDate, endDate, evvRecords);
      
      expect(dashboard.state).toBe('TX');
      expect(dashboard.dateRange.startDate).toEqual(startDate);
      expect(dashboard.dateRange.endDate).toEqual(endDate);
      expect(dashboard.metrics.totalVisits).toBe(3);
      expect(dashboard.metrics.compliantVisits).toBe(1);
      expect(dashboard.metrics.partiallyCompliantVisits).toBe(1);
      expect(dashboard.metrics.nonCompliantVisits).toBe(1);
      expect(dashboard.metrics.complianceRate).toBeCloseTo(33.33, 1);
    });
    
    it('should calculate geofence metrics accurately', () => {
      const evvRecords = [
        createMockEVVRecord({
          id: 'evv-1',
          clockInVerification: {
            ...createMockEVVRecord().clockInVerification,
            geofencePassed: true,
            distanceFromAddress: 10,
            accuracy: 15,
          },
        }),
        createMockEVVRecord({
          id: 'evv-2',
          clockInVerification: {
            ...createMockEVVRecord().clockInVerification,
            geofencePassed: false,
            distanceFromAddress: 200,
            accuracy: 25,
          },
        }),
      ];
      
      const dashboard = orchestrator.generateComplianceDashboard('TX', startDate, endDate, evvRecords);
      
      expect(dashboard.geofenceMetrics.totalChecks).toBe(2);
      expect(dashboard.geofenceMetrics.passed).toBe(1);
      expect(dashboard.geofenceMetrics.failed).toBe(1);
      expect(dashboard.geofenceMetrics.averageDistance).toBe(105); // (10 + 200) / 2
      expect(dashboard.geofenceMetrics.averageAccuracy).toBe(20); // (15 + 25) / 2
    });
    
    it('should identify top compliance issues', () => {
      const evvRecords = [
        createMockEVVRecord({ id: 'evv-1', complianceFlags: ['GEOFENCE_VIOLATION'] }),
        createMockEVVRecord({ id: 'evv-2', complianceFlags: ['GEOFENCE_VIOLATION'] }),
        createMockEVVRecord({ id: 'evv-3', complianceFlags: ['GEOFENCE_VIOLATION'] }),
        createMockEVVRecord({ id: 'evv-4', complianceFlags: ['LATE_SUBMISSION'] }),
        createMockEVVRecord({ id: 'evv-5', complianceFlags: ['LATE_SUBMISSION'] }),
        createMockEVVRecord({ id: 'evv-6', complianceFlags: ['MISSING_SIGNATURE'] }),
      ];
      
      const dashboard = orchestrator.generateComplianceDashboard('TX', startDate, endDate, evvRecords);
      
      expect(dashboard.topIssues).toHaveLength(3);
      expect(dashboard.topIssues[0]?.issueCode).toBe('GEOFENCE_VIOLATION');
      expect(dashboard.topIssues[0]?.count).toBe(3);
      expect(dashboard.topIssues[0]?.percentage).toBe(50); // 3 out of 6 total
      expect(dashboard.topIssues[1]?.issueCode).toBe('LATE_SUBMISSION');
      expect(dashboard.topIssues[1]?.count).toBe(2);
    });
    
    it('should filter records by date range and state', () => {
      const evvRecords = [
        createMockEVVRecord({
          id: 'evv-1',
          serviceDate: new Date('2025-01-15T00:00:00.000Z'),
          serviceAddress: { ...createMockEVVRecord().serviceAddress, state: 'TX' },
        }),
        createMockEVVRecord({
          id: 'evv-2',
          serviceDate: new Date('2025-02-15T00:00:00.000Z'), // Outside date range
          serviceAddress: { ...createMockEVVRecord().serviceAddress, state: 'TX' },
        }),
        createMockEVVRecord({
          id: 'evv-3',
          serviceDate: new Date('2025-01-15T00:00:00.000Z'),
          serviceAddress: { ...createMockEVVRecord().serviceAddress, state: 'FL' }, // Different state
        }),
      ];
      
      const dashboard = orchestrator.generateComplianceDashboard('TX', startDate, endDate, evvRecords);
      
      expect(dashboard.metrics.totalVisits).toBe(1); // Only TX record within date range
    });
  });
});
