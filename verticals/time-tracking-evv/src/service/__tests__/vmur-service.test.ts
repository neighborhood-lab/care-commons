/**
 * VMUR Service Tests
 * 
 * Tests for Texas Visit Maintenance Unlock Request workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VMURService } from '../vmur-service';
import type { Database } from '@care-commons/core';
import type { UserContext } from '@care-commons/core';
import { ValidationError, NotFoundError, PermissionError } from '@care-commons/core';

describe('VMURService', () => {
  let vmurService: VMURService;
  let mockDb: Database;
  let supervisorContext: UserContext;
  let regularContext: UserContext;

  beforeEach(() => {
    // Mock database
    mockDb = {
      query: vi.fn(),
    } as unknown as Database;

    vmurService = new VMURService(mockDb);

    // Supervisor user context
    supervisorContext = {
      userId: 'supervisor-123',
      organizationId: 'org-123',
      branchIds: ['branch-123'],
      roles: ['COORDINATOR'],
      permissions: ['evv:read', 'evv:write', 'vmur:approve'],
    };

    // Regular user context
    regularContext = {
      userId: 'user-123',
      organizationId: 'org-123',
      branchIds: ['branch-123'],
      roles: ['CAREGIVER'],
      permissions: ['evv:read'],
    };
  });

  describe('createVMUR', () => {
    it('should create VMUR for Texas record older than 30 days', async () => {
      const evvRecordId = 'evv-123';
      const visitId = 'visit-123';
      
      // Mock EVV record query - 40 days old
      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
      
      (mockDb.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          rows: [{
            id: evvRecordId,
            visit_id: visitId,
            organization_id: 'org-123',
            client_state: 'TX',
            recorded_at: fortyDaysAgo,
            clock_in_time: fortyDaysAgo,
            clock_out_time: new Date(fortyDaysAgo.getTime() + 7200000), // +2 hours
            clock_in_verification: { latitude: 30.27, longitude: -97.74, method: 'GPS' },
            clock_out_verification: { latitude: 30.27, longitude: -97.74, method: 'GPS' },
            total_duration: 120,
          }],
        })
        // Mock VMUR creation
        .mockResolvedValueOnce({
          rows: [{
            id: 'vmur-123',
            evv_record_id: evvRecordId,
            visit_id: visitId,
            requested_by: supervisorContext.userId,
            requested_by_name: supervisorContext.userId,
            requested_at: new Date(),
            request_reason: 'DEVICE_MALFUNCTION',
            request_reason_details: 'Caregiver phone died',
            approval_status: 'PENDING',
            original_data: {},
            corrected_data: {},
            changes_summary: [],
            submitted_to_aggregator: false,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            compliance_notes: 'VMUR created',
          }],
        });

      const result = await vmurService.createVMUR({
        evvRecordId,
        visitId,
        requestReason: 'DEVICE_MALFUNCTION',
        requestReasonDetails: 'Caregiver phone died',
        correctedData: {
          clockInTime: fortyDaysAgo,
          clockOutTime: new Date(fortyDaysAgo.getTime() + 7200000),
          clockInLatitude: 30.27,
          clockInLongitude: -97.74,
          clockOutLatitude: 30.27,
          clockOutLongitude: -97.74,
          clockMethod: 'MOBILE_GPS',
          totalDuration: 120,
        },
        justification: 'Device malfunction prevented accurate clock-in',
      }, supervisorContext);

      expect(result.id).toBe('vmur-123');
      expect(result.approvalStatus).toBe('PENDING');
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });

    it('should reject VMUR for record less than 30 days old', async () => {
      const evvRecordId = 'evv-123';
      const visitId = 'visit-123';
      
      // Mock EVV record query - only 15 days old
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      
      (mockDb.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        rows: [{
          id: evvRecordId,
          visit_id: visitId,
          organization_id: 'org-123',
          client_state: 'TX',
          recorded_at: fifteenDaysAgo,
          clock_in_time: fifteenDaysAgo,
        }],
      });

      await expect(vmurService.createVMUR({
        evvRecordId,
        visitId,
        requestReason: 'DEVICE_MALFUNCTION',
        requestReasonDetails: 'Caregiver phone died',
        correctedData: {
          clockInTime: fifteenDaysAgo,
          clockMethod: 'MOBILE_GPS',
        },
        justification: 'Device malfunction',
      }, supervisorContext)).rejects.toThrow(ValidationError);
    });

    it('should reject VMUR for non-Texas state', async () => {
      const evvRecordId = 'evv-123';
      const visitId = 'visit-123';
      
      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
      
      (mockDb.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        rows: [{
          id: evvRecordId,
          visit_id: visitId,
          organization_id: 'org-123',
          client_state: 'FL', // Florida, not Texas
          recorded_at: fortyDaysAgo,
        }],
      });

      await expect(vmurService.createVMUR({
        evvRecordId,
        visitId,
        requestReason: 'DEVICE_MALFUNCTION',
        requestReasonDetails: 'Caregiver phone died',
        correctedData: {
          clockInTime: fortyDaysAgo,
          clockMethod: 'MOBILE_GPS',
        },
        justification: 'Device malfunction',
      }, supervisorContext)).rejects.toThrow(ValidationError);
    });

    it('should reject invalid reason codes', async () => {
      const evvRecordId = 'evv-123';
      const visitId = 'visit-123';
      
      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
      
      (mockDb.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        rows: [{
          id: evvRecordId,
          visit_id: visitId,
          organization_id: 'org-123',
          client_state: 'TX',
          recorded_at: fortyDaysAgo,
          clock_in_time: fortyDaysAgo,
          clock_in_verification: { latitude: 30.27, longitude: -97.74, method: 'GPS' },
          total_duration: 120,
        }],
      });

      await expect(vmurService.createVMUR({
        evvRecordId,
        visitId,
        requestReason: 'INVALID_CODE' as any,
        requestReasonDetails: 'Invalid reason',
        correctedData: {
          clockInTime: fortyDaysAgo,
          clockMethod: 'MOBILE_GPS',
        },
        justification: 'Invalid',
      }, supervisorContext)).rejects.toThrow(ValidationError);
    });

    it('should reject if EVV record not found', async () => {
      (mockDb.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        rows: [],
      });

      await expect(vmurService.createVMUR({
        evvRecordId: 'nonexistent',
        visitId: 'visit-123',
        requestReason: 'DEVICE_MALFUNCTION',
        requestReasonDetails: 'Test',
        correctedData: {
          clockInTime: new Date(),
          clockMethod: 'MOBILE_GPS',
        },
        justification: 'Test',
      }, supervisorContext)).rejects.toThrow(NotFoundError);
    });
  });

  describe('approveVMUR', () => {
    it('should approve pending VMUR with supervisor role', async () => {
      const vmurId = 'vmur-123';
      const evvRecordId = 'evv-123';
      
      // Mock get VMUR query
      (mockDb.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          rows: [{
            id: vmurId,
            evv_record_id: evvRecordId,
            visit_id: 'visit-123',
            requested_by: 'user-123',
            requested_by_name: 'user-123',
            requested_at: new Date(),
            request_reason: 'DEVICE_MALFUNCTION',
            request_reason_details: 'Phone died',
            approval_status: 'PENDING',
            original_data: { clockInTime: new Date() },
            corrected_data: { clockInTime: new Date() },
            changes_summary: ['Clock-in time changed'],
            submitted_to_aggregator: false,
            expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
            compliance_notes: 'Created',
          }],
        })
        // Mock approval update
        .mockResolvedValueOnce({ rows: [] })
        // Mock apply corrections
        .mockResolvedValueOnce({ rows: [] })
        // Mock mark for submission
        .mockResolvedValueOnce({ rows: [] })
        // Mock final get VMUR
        .mockResolvedValueOnce({
          rows: [{
            id: vmurId,
            evv_record_id: evvRecordId,
            visit_id: 'visit-123',
            requested_by: 'user-123',
            requested_by_name: 'user-123',
            requested_at: new Date(),
            request_reason: 'DEVICE_MALFUNCTION',
            request_reason_details: 'Phone died',
            approval_status: 'APPROVED',
            approved_by: supervisorContext.userId,
            approved_by_name: supervisorContext.userId,
            approved_at: new Date(),
            original_data: { clockInTime: new Date() },
            corrected_data: { clockInTime: new Date() },
            changes_summary: ['Clock-in time changed'],
            submitted_to_aggregator: true,
            submitted_at: new Date(),
            expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            compliance_notes: 'Approved',
          }],
        });

      const result = await vmurService.approveVMUR({
        vmurId,
        approvalNotes: 'Approved for valid reason',
      }, supervisorContext);

      expect(result.approvalStatus).toBe('APPROVED');
      expect(result.approvedBy).toBe(supervisorContext.userId);
    });

    it('should reject approval from non-supervisor', async () => {
      await expect(vmurService.approveVMUR({
        vmurId: 'vmur-123',
      }, regularContext)).rejects.toThrow(PermissionError);
    });

    it('should reject approval of non-pending VMUR', async () => {
      const vmurId = 'vmur-123';
      
      (mockDb.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        rows: [{
          id: vmurId,
          approval_status: 'APPROVED', // Already approved
          expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        }],
      });

      await expect(vmurService.approveVMUR({
        vmurId,
      }, supervisorContext)).rejects.toThrow(ValidationError);
    });

    it('should reject approval of expired VMUR', async () => {
      const vmurId = 'vmur-123';
      
      (mockDb.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        rows: [{
          id: vmurId,
          approval_status: 'PENDING',
          expires_at: new Date(Date.now() - 1000), // Expired
        }],
      });

      await expect(vmurService.approveVMUR({
        vmurId,
      }, supervisorContext)).rejects.toThrow(ValidationError);
    });
  });

  describe('denyVMUR', () => {
    it('should deny pending VMUR with supervisor role', async () => {
      const vmurId = 'vmur-123';
      
      // Mock get VMUR query
      (mockDb.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          rows: [{
            id: vmurId,
            approval_status: 'PENDING',
            expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          }],
        })
        // Mock denial update
        .mockResolvedValueOnce({ rows: [] })
        // Mock final get VMUR
        .mockResolvedValueOnce({
          rows: [{
            id: vmurId,
            evv_record_id: 'evv-123',
            visit_id: 'visit-123',
            requested_by: 'user-123',
            requested_by_name: 'user-123',
            requested_at: new Date(),
            request_reason: 'DEVICE_MALFUNCTION',
            request_reason_details: 'Phone died',
            approval_status: 'DENIED',
            approved_by: supervisorContext.userId,
            approved_by_name: supervisorContext.userId,
            approved_at: new Date(),
            denial_reason: 'Insufficient justification',
            original_data: {},
            corrected_data: {},
            changes_summary: [],
            submitted_to_aggregator: false,
            expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          }],
        });

      const result = await vmurService.denyVMUR({
        vmurId,
        denialReason: 'Insufficient justification',
      }, supervisorContext);

      expect(result.approvalStatus).toBe('DENIED');
      expect(result.denialReason).toBe('Insufficient justification');
    });

    it('should reject denial from non-supervisor', async () => {
      await expect(vmurService.denyVMUR({
        vmurId: 'vmur-123',
        denialReason: 'Test',
      }, regularContext)).rejects.toThrow(PermissionError);
    });
  });

  describe('getVMUR', () => {
    it('should retrieve VMUR by ID', async () => {
      const vmurId = 'vmur-123';
      
      (mockDb.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        rows: [{
          id: vmurId,
          evv_record_id: 'evv-123',
          visit_id: 'visit-123',
          requested_by: 'user-123',
          requested_by_name: 'user-123',
          requested_at: new Date(),
          request_reason: 'DEVICE_MALFUNCTION',
          request_reason_details: 'Phone died',
          approval_status: 'PENDING',
          original_data: {},
          corrected_data: {},
          changes_summary: [],
          submitted_to_aggregator: false,
          expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        }],
      });

      const result = await vmurService.getVMUR(vmurId);

      expect(result.id).toBe(vmurId);
      expect(result.approvalStatus).toBe('PENDING');
    });

    it('should throw NotFoundError if VMUR does not exist', async () => {
      (mockDb.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        rows: [],
      });

      await expect(vmurService.getVMUR('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPendingVMURs', () => {
    it('should retrieve all pending VMURs for organization', async () => {
      const orgId = 'org-123';
      
      (mockDb.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        rows: [
          {
            id: 'vmur-1',
            evv_record_id: 'evv-1',
            visit_id: 'visit-1',
            requested_by: 'user-1',
            requested_by_name: 'user-1',
            requested_at: new Date(),
            request_reason: 'DEVICE_MALFUNCTION',
            request_reason_details: 'Test 1',
            approval_status: 'PENDING',
            original_data: {},
            corrected_data: {},
            changes_summary: [],
            submitted_to_aggregator: false,
            expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'vmur-2',
            evv_record_id: 'evv-2',
            visit_id: 'visit-2',
            requested_by: 'user-2',
            requested_by_name: 'user-2',
            requested_at: new Date(),
            request_reason: 'GPS_UNAVAILABLE',
            request_reason_details: 'Test 2',
            approval_status: 'PENDING',
            original_data: {},
            corrected_data: {},
            changes_summary: [],
            submitted_to_aggregator: false,
            expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          },
        ],
      });

      const results = await vmurService.getPendingVMURs(orgId);

      expect(results).toHaveLength(2);
      expect(results[0]?.id).toBe('vmur-1');
      expect(results[1]?.id).toBe('vmur-2');
    });
  });

  describe('expireOldVMURs', () => {
    it('should expire VMURs past their expiration date', async () => {
      (mockDb.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        rows: [
          { id: 'vmur-1' },
          { id: 'vmur-2' },
          { id: 'vmur-3' },
        ],
      });

      const expiredCount = await vmurService.expireOldVMURs();

      expect(expiredCount).toBe(3);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE texas_vmur')
      );
    });
  });
});
