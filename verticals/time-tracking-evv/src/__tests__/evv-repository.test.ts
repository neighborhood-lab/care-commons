/**
 * Tests for EVV Repository - Data access layer for time tracking and verification
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EVVRepository } from '../repository/evv-repository';
import {
  EVVRecordSearchFilters,
} from '../types/evv';
import { UUID } from '@care-commons/core';

describe('EVVRepository', () => {
  let repository: EVVRepository;
  let mockDatabase: any;

  beforeEach(() => {
    const mockQuery = vi.fn();
    mockDatabase = {
      query: mockQuery,
    };

    repository = new EVVRepository(mockDatabase);
  });

  describe('createEVVRecord', () => {
    const mockEVVRecord = {
      visitId: 'visit-123' as UUID,
      organizationId: 'org-123' as UUID,
      branchId: 'branch-123' as UUID,
      clientId: 'client-123' as UUID,
      caregiverId: 'caregiver-123' as UUID,
      serviceTypeCode: 'HCBS',
      serviceTypeName: 'Home Care',
      clientName: 'John Doe',
      caregiverName: 'Jane Smith',
      caregiverEmployeeId: 'EMP123',
      serviceDate: new Date(),
      serviceAddress: {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        latitude: 40.7128,
        longitude: -74.0060,
        geofenceRadius: 100,
        addressVerified: true,
      },
      clockInTime: new Date(),
      clockOutTime: null,
      clockInVerification: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: new Date(),
        timestampSource: 'DEVICE' as any,
        isWithinGeofence: true,
        distanceFromAddress: 5,
        geofencePassed: true,
        deviceId: 'device-123',
        method: 'GPS' as any,
        locationSource: 'GPS_SATELLITE' as any,
        mockLocationDetected: false,
        verificationPassed: true,
      },
      recordStatus: 'PENDING' as const,
      verificationLevel: 'FULL' as const,
      complianceFlags: ['COMPLIANT' as any],
      integrityHash: 'hash123',
      integrityChecksum: 'checksum123',
      recordedAt: new Date(),
      recordedBy: 'user-123' as UUID,
      syncMetadata: {
        syncId: 'sync-123',
        lastSyncedAt: new Date(),
        syncStatus: 'SYNCED' as any,
      },
      createdBy: 'user-123' as UUID,
      updatedBy: 'user-123' as UUID,
    };

    it('should create EVV record successfully', async () => {
      const expectedRecord = {
        id: 'evv-123',
        visit_id: 'visit-123',
        organization_id: 'org-123',
        branch_id: 'branch-123',
        client_id: 'client-123',
        caregiver_id: 'caregiver-123',
        service_type_code: 'HCBS',
        service_type_name: 'Home Care',
        client_name: 'John Doe',
        client_medicaid_id: null,
        caregiver_name: 'Jane Smith',
        caregiver_employee_id: 'EMP123',
        caregiver_npi: null,
        service_date: new Date(),
        service_address: JSON.stringify(mockEVVRecord.serviceAddress),
        clock_in_time: new Date(),
        clock_out_time: null,
        total_duration: null,
        clock_in_verification: JSON.stringify(mockEVVRecord.clockInVerification),
        clock_out_verification: null,
        mid_visit_checks: null,
        pause_events: null,
        exception_events: null,
        record_status: 'PENDING',
        verification_level: 'FULL',
        compliance_flags: JSON.stringify(mockEVVRecord.complianceFlags),
        integrity_hash: 'hash123',
        integrity_checksum: 'checksum123',
        recorded_at: new Date(),
        recorded_by: 'user-123',
        sync_metadata: JSON.stringify(mockEVVRecord.syncMetadata),
        submitted_to_payor: null,
        payor_approval_status: null,
        state_specific_data: null,
        caregiver_attestation: null,
        client_attestation: null,
        supervisor_review: null,
        created_at: new Date(),
        created_by: 'user-123',
        updated_at: new Date(),
        updated_by: 'user-123',
        version: 1,
      };

      mockDatabase.query = vi.fn().mockResolvedValue({
        rows: [expectedRecord],
      });

      const result = await repository.createEVVRecord(mockEVVRecord);

      expect(result).toEqual(expect.objectContaining({
        id: 'evv-123',
        visitId: 'visit-123',
        recordStatus: 'PENDING',
        verificationLevel: 'FULL',
      }));

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO evv_records'),
        expect.arrayContaining([
          'visit-123',
          'org-123',
          'branch-123',
          'client-123',
          'caregiver-123',
          'HCBS',
          'Home Care',
          'John Doe',
          null, // clientMedicaidId
          'Jane Smith',
          'EMP123',
          null, // caregiverNPI
          expect.any(Date), // serviceDate
          expect.stringContaining('123 Main St'), // serviceAddress JSON
          expect.any(Date), // clockInTime
          null, // clockOutTime
          null, // totalDuration
          expect.stringContaining('latitude'), // clockInVerification JSON
          null, // clockOutVerification
          null, // midVisitChecks
          null, // pauseEvents
          null, // exceptionEvents
          'PENDING',
          'FULL',
          expect.stringContaining('COMPLIANT'), // complianceFlags JSON
          'hash123',
          'checksum123',
          expect.any(Date), // recordedAt
          'user-123',
          expect.stringContaining('sync-123'), // syncMetadata JSON
          null, // submittedToPayor
          null, // payorApprovalStatus
          null, // stateSpecificData
          null, // caregiverAttestation
          null, // clientAttestation
          null, // supervisorReview
          'user-123',
          'user-123',
        ])
      );
    });

    it('should handle optional fields correctly', async () => {
      const recordWithOptions = {
        ...mockEVVRecord,
        clientMedicaidId: 'MED123',
        caregiverNationalProviderId: 'NPI123',
        clockOutTime: new Date(),
        totalDuration: 120,
        clockOutVerification: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
          timestamp: new Date(),
          timestampSource: 'DEVICE' as any,
          isWithinGeofence: true,
          distanceFromAddress: 5,
          geofencePassed: true,
          deviceId: 'device-123',
          method: 'GPS' as any,
          locationSource: 'GPS_SATELLITE' as any,
          mockLocationDetected: false,
          verificationPassed: true,
        },
        midVisitChecks: [],
        pauseEvents: [],
        exceptionEvents: [],
        submittedToPayor: new Date(),
        payorApprovalStatus: 'APPROVED' as const,
        stateSpecificData: { customField: 'value' },
        caregiverAttestation: {
          attestedBy: 'caregiver-123',
          attestedByName: 'Jane Smith',
          attestedAt: new Date(),
          attestationType: 'SIGNATURE' as const,
          statement: 'I confirm services were provided',
        },
        clientAttestation: {
          attestedBy: 'client-123',
          attestedByName: 'John Doe',
          attestedAt: new Date(),
          attestationType: 'SIGNATURE' as const,
          statement: 'Services were provided',
        },
        supervisorReview: {
          reviewedBy: 'supervisor-123',
          reviewedByName: 'Supervisor Smith',
          reviewedAt: new Date(),
          reviewStatus: 'APPROVED' as const,
        },
      };

      const expectedRecord = {
        id: 'evv-123',
        visit_id: 'visit-123',
        organization_id: 'org-123',
        branch_id: 'branch-123',
        client_id: 'client-123',
        caregiver_id: 'caregiver-123',
        service_type_code: 'HCBS',
        service_type_name: 'Home Care',
        client_name: 'John Doe',
        client_medicaid_id: 'MED123',
        caregiver_name: 'Jane Smith',
        caregiver_employee_id: 'EMP123',
        caregiver_npi: 'NPI123',
        service_date: new Date(),
        service_address: JSON.stringify(recordWithOptions.serviceAddress),
        clock_in_time: new Date(),
        clock_out_time: recordWithOptions.clockOutTime,
        total_duration: 120,
        clock_in_verification: JSON.stringify(recordWithOptions.clockInVerification),
        clock_out_verification: JSON.stringify(recordWithOptions.clockOutVerification),
        mid_visit_checks: JSON.stringify(recordWithOptions.midVisitChecks),
        pause_events: JSON.stringify(recordWithOptions.pauseEvents),
        exception_events: JSON.stringify(recordWithOptions.exceptionEvents),
        record_status: 'COMPLETE',
        verification_level: 'FULL',
        compliance_flags: JSON.stringify(recordWithOptions.complianceFlags),
        integrity_hash: 'hash123',
        integrity_checksum: 'checksum123',
        recorded_at: new Date(),
        recorded_by: 'user-123',
        sync_metadata: JSON.stringify(recordWithOptions.syncMetadata),
        submitted_to_payor: recordWithOptions.submittedToPayor,
        payor_approval_status: 'APPROVED',
        state_specific_data: JSON.stringify(recordWithOptions.stateSpecificData),
        caregiver_attestation: JSON.stringify(recordWithOptions.caregiverAttestation),
        client_attestation: JSON.stringify(recordWithOptions.clientAttestation),
        supervisor_review: JSON.stringify(recordWithOptions.supervisorReview),
        created_at: new Date(),
        created_by: 'user-123',
        updated_at: new Date(),
        updated_by: 'user-123',
        version: 1,
      };

      mockDatabase.query = vi.fn().mockResolvedValue({
        rows: [expectedRecord],
      });

      const result = await repository.createEVVRecord(recordWithOptions);

      expect(result.clientMedicaidId).toBe('MED123');
      expect(result.caregiverNationalProviderId).toBe('NPI123');
      expect(result.clockOutTime).toBeDefined();
      expect(result.totalDuration).toBe(120);
      expect(result.submittedToPayor).toBeDefined();
      expect(result.payorApprovalStatus).toBe('APPROVED');
    });
  });

  describe('getEVVRecordById', () => {
    it('should return EVV record when found', async () => {
      const mockRecord = {
        id: 'evv-123',
        visit_id: 'visit-123',
        organization_id: 'org-123',
        branch_id: 'branch-123',
        client_id: 'client-123',
        caregiver_id: 'caregiver-123',
        service_type_code: 'HCBS',
        service_type_name: 'Home Care',
        client_name: 'John Doe',
        client_medicaid_id: null,
        caregiver_name: 'Jane Smith',
        caregiver_employee_id: 'EMP123',
        caregiver_npi: null,
        service_date: new Date(),
        service_address: JSON.stringify({
          line1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
          latitude: 40.7128,
          longitude: -74.0060,
          geofenceRadius: 100,
          addressVerified: true,
        }),
        clock_in_time: new Date(),
        clock_out_time: null,
        total_duration: null,
        clock_in_verification: JSON.stringify({
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
          timestamp: new Date(),
          timestampSource: 'DEVICE' as any,
          isWithinGeofence: true,
          distanceFromAddress: 5,
          geofencePassed: true,
          deviceId: 'device-123',
          method: 'GPS' as any,
          locationSource: 'GPS_SATELLITE' as any,
          mockLocationDetected: false,
          verificationPassed: true,
        }),
        clock_out_verification: null,
        mid_visit_checks: null,
        pause_events: null,
        exception_events: null,
        record_status: 'PENDING',
        verification_level: 'FULL',
        compliance_flags: JSON.stringify(['COMPLIANT']),
        integrity_hash: 'hash123',
        integrity_checksum: 'checksum123',
        recorded_at: new Date(),
        recorded_by: 'user-123',
        sync_metadata: JSON.stringify({
          syncId: 'sync-123',
          lastSyncedAt: new Date(),
          syncStatus: 'SYNCED' as any,
        }),
        submitted_to_payor: null,
        payor_approval_status: null,
        state_specific_data: null,
        caregiver_attestation: null,
        client_attestation: null,
        supervisor_review: null,
        created_at: new Date(),
        created_by: 'user-123',
        updated_at: new Date(),
        updated_by: 'user-123',
        version: 1,
      };

      mockDatabase.query = vi.fn().mockResolvedValue({
        rows: [mockRecord],
      });

      const result = await repository.getEVVRecordById('evv-123');

      expect(result).toEqual(expect.objectContaining({
        id: 'evv-123',
        visitId: 'visit-123',
        organizationId: 'org-123',
        recordStatus: 'PENDING',
        verificationLevel: 'FULL',
        complianceFlags: ['COMPLIANT' as any],
      }));

      expect(mockDatabase.query).toHaveBeenCalledWith(
        'SELECT * FROM evv_records WHERE id = $1',
        ['evv-123']
      );
    });

    it('should return null when record not found', async () => {
      mockDatabase.query = vi.fn().mockResolvedValue({
        rows: [],
      });

      const result = await repository.getEVVRecordById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getEVVRecordByVisitId', () => {
    it('should return EVV record for visit ID', async () => {
      const mockRecord = {
        id: 'evv-123',
        visit_id: 'visit-123',
        organization_id: 'org-123',
        branch_id: 'branch-123',
        client_id: 'client-123',
        caregiver_id: 'caregiver-123',
        service_type_code: 'HCBS',
        service_type_name: 'Home Care',
        client_name: 'John Doe',
        client_medicaid_id: null,
        caregiver_name: 'Jane Smith',
        caregiver_employee_id: 'EMP123',
        caregiver_npi: null,
        service_date: new Date(),
        service_address: JSON.stringify({ line1: '123 Main St' }),
        clock_in_time: new Date(),
        clock_out_time: null,
        total_duration: null,
        clock_in_verification: JSON.stringify({ latitude: 40.7128 }),
        clock_out_verification: null,
        mid_visit_checks: null,
        pause_events: null,
        exception_events: null,
        record_status: 'PENDING',
        verification_level: 'FULL',
        compliance_flags: JSON.stringify(['COMPLIANT']),
        integrity_hash: 'hash123',
        integrity_checksum: 'checksum123',
        recorded_at: new Date(),
        recorded_by: 'user-123',
        sync_metadata: JSON.stringify({ syncId: 'sync-1' }),
        submitted_to_payor: null,
        payor_approval_status: null,
        state_specific_data: null,
        caregiver_attestation: null,
        client_attestation: null,
        supervisor_review: null,
        created_at: new Date(),
        created_by: 'user-123',
        updated_at: new Date(),
        updated_by: 'user-123',
        version: 1,
      };

      mockDatabase.query = vi.fn().mockResolvedValue({
        rows: [mockRecord],
      });

      const result = await repository.getEVVRecordByVisitId('visit-123');

      expect(result).toBeDefined();
      expect(result?.visitId).toBe('visit-123');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        'SELECT * FROM evv_records WHERE visit_id = $1',
        ['visit-123']
      );
    });

    it('should return null when no record for visit ID', async () => {
      mockDatabase.query = vi.fn().mockResolvedValue({
        rows: [],
      });

      const result = await repository.getEVVRecordByVisitId('visit-456');

      expect(result).toBeNull();
    });
  });

  describe('updateEVVRecord', () => {
    it('should update EVV record successfully', async () => {
      const updates = {
        clockOutTime: new Date(),
        totalDuration: 120,
        recordStatus: 'COMPLETE' as const,
        verificationLevel: 'FULL' as const,
      };

      const updatedRecord = {
        id: 'evv-123',
        visit_id: 'visit-123',
        organization_id: 'org-123',
        branch_id: 'branch-123',
        client_id: 'client-123',
        caregiver_id: 'caregiver-123',
        service_type_code: 'HCBS',
        service_type_name: 'Home Care',
        client_name: 'John Doe',
        client_medicaid_id: null,
        caregiver_name: 'Jane Smith',
        caregiver_employee_id: 'EMP123',
        caregiver_npi: null,
        service_date: new Date(),
        service_address: JSON.stringify({ line1: '123 Main St' }),
        clock_in_time: new Date(),
        clock_out_time: updates.clockOutTime,
        total_duration: updates.totalDuration,
        clock_in_verification: JSON.stringify({ latitude: 40.7128 }),
        clock_out_verification: null,
        mid_visit_checks: null,
        pause_events: null,
        exception_events: null,
        record_status: updates.recordStatus,
        verification_level: updates.verificationLevel,
        compliance_flags: JSON.stringify(['COMPLIANT']),
        integrity_hash: 'hash123',
        integrity_checksum: 'checksum123',
        recorded_at: new Date(),
        recorded_by: 'user-123',
        sync_metadata: JSON.stringify({ syncId: 'sync-1' }),
        submitted_to_payor: null,
        payor_approval_status: null,
        state_specific_data: null,
        caregiver_attestation: null,
        client_attestation: null,
        supervisor_review: null,
        created_at: new Date(),
        created_by: 'user-123',
        updated_at: new Date(),
        updated_by: 'user-123',
        version: 2,
      };

      mockDatabase.query = vi.fn().mockResolvedValue({
        rows: [updatedRecord],
      });

      const result = await repository.updateEVVRecord('evv-123', updates, 'user-123');

      expect(result.clockOutTime).toEqual(updates.clockOutTime);
      expect(result.totalDuration).toBe(updates.totalDuration);
      expect(result.recordStatus).toBe(updates.recordStatus);
      expect(result.version).toBe(2);

      const queryCalls = mockDatabase.query.mock.calls;
      expect(queryCalls.length).toBeGreaterThan(0);
      const [queryString, params] = queryCalls[0];
      
      expect(queryString).toContain('UPDATE evv_records');
      expect(queryString).toContain('SET clock_out_time');
      expect(params).toEqual(
        expect.arrayContaining([
          'COMPLETE',
          'FULL',
          'user-123',
          'evv-123',
        ])
      );
    });

    it('should throw error when record not found', async () => {
      mockDatabase.query = vi.fn().mockResolvedValue({
        rows: [],
      });

      await expect(repository.updateEVVRecord('nonexistent', {}, 'user-123'))
        .rejects.toThrow('EVV record nonexistent not found');
    });
  });

  describe('searchEVVRecords', () => {
    it('should search with basic filters', async () => {
      const filters: EVVRecordSearchFilters = {
        organizationId: 'org-123' as UUID,
        clientId: 'client-123' as UUID,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
      };

      const pagination = {
        page: 1,
        limit: 10,
        sortBy: 'serviceDate',
        sortOrder: 'desc' as const,
      };

      const mockRecords = [
        {
          id: 'evv-1',
          visit_id: 'visit-1',
          organization_id: 'org-123',
          branch_id: 'branch-123',
          client_id: 'client-123',
          caregiver_id: 'caregiver-123',
          service_type_code: 'HCBS',
          service_type_name: 'Home Care',
          client_name: 'John Doe',
          client_medicaid_id: null,
          caregiver_name: 'Jane Smith',
          caregiver_employee_id: 'EMP123',
          caregiver_npi: null,
          service_date: new Date('2023-06-01'),
          service_address: JSON.stringify({ line1: '123 Main St' }),
          clock_in_time: new Date(),
          clock_out_time: null,
          total_duration: null,
          clock_in_verification: JSON.stringify({ latitude: 40.7128 }),
          clock_out_verification: null,
          mid_visit_checks: null,
          pause_events: null,
          exception_events: null,
          record_status: 'PENDING',
          verification_level: 'FULL',
          compliance_flags: JSON.stringify(['COMPLIANT']),
          integrity_hash: 'hash123',
          integrity_checksum: 'checksum123',
          recorded_at: new Date(),
          recorded_by: 'user-123',
          sync_metadata: JSON.stringify({ syncId: 'sync-1' }),
          submitted_to_payor: null,
          payor_approval_status: null,
          state_specific_data: null,
          caregiver_attestation: null,
          client_attestation: null,
          supervisor_review: null,
          created_at: new Date(),
          created_by: 'user-123',
          updated_at: new Date(),
          updated_by: 'user-123',
          version: 1,
        },
        {
          id: 'evv-2',
          visit_id: 'visit-2',
          organization_id: 'org-123',
          branch_id: 'branch-123',
          client_id: 'client-123',
          caregiver_id: 'caregiver-123',
          service_type_code: 'HCBS',
          service_type_name: 'Home Care',
          client_name: 'John Doe',
          client_medicaid_id: null,
          caregiver_name: 'Jane Smith',
          caregiver_employee_id: 'EMP123',
          caregiver_npi: null,
          service_date: new Date('2023-06-02'),
          service_address: JSON.stringify({ line1: '123 Main St' }),
          clock_in_time: new Date(),
          clock_out_time: null,
          total_duration: null,
          clock_in_verification: JSON.stringify({ latitude: 40.7128 }),
          clock_out_verification: null,
          mid_visit_checks: null,
          pause_events: null,
          exception_events: null,
          record_status: 'PENDING',
          verification_level: 'FULL',
          compliance_flags: JSON.stringify(['COMPLIANT']),
          integrity_hash: 'hash123',
          integrity_checksum: 'checksum123',
          recorded_at: new Date(),
          recorded_by: 'user-123',
          sync_metadata: JSON.stringify({ syncId: 'sync-2' }),
          submitted_to_payor: null,
          payor_approval_status: null,
          state_specific_data: null,
          caregiver_attestation: null,
          client_attestation: null,
          supervisor_review: null,
          created_at: new Date(),
          created_by: 'user-123',
          updated_at: new Date(),
          updated_by: 'user-123',
          version: 1,
        },
      ];

      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // Count query
        .mockResolvedValueOnce({ rows: mockRecords }); // Data query

      const result = await repository.searchEVVRecords(filters, pagination);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);

      expect(mockDatabase.query).toHaveBeenCalledTimes(2);
      expect(mockDatabase.query).toHaveBeenNthCalledWith(1,
        expect.stringContaining('SELECT COUNT(*) FROM evv_records'),
        expect.arrayContaining(['org-123', 'client-123', expect.any(Date), expect.any(Date)])
      );
    });

    it('should search with status filter', async () => {
      const filters: EVVRecordSearchFilters = {
        organizationId: 'org-123' as UUID,
        status: ['PENDING', 'COMPLETE'],
      };

      const pagination = { page: 1, limit: 10 };

      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{
          id: 'evv-1',
          visit_id: 'visit-1',
          organization_id: 'org-123',
          service_date: new Date(),
          service_address: JSON.stringify({ line1: '123 Main St' }),
          clock_in_verification: JSON.stringify({ latitude: 40.7128 }),
          compliance_flags: JSON.stringify(['COMPLIANT']),
          sync_metadata: JSON.stringify({ syncId: 'sync-1' }),
          created_at: new Date(),
          updated_at: new Date(),
        }] });

      await repository.searchEVVRecords(filters, pagination);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('record_status = ANY($'),
        expect.arrayContaining(['org-123', ['PENDING', 'COMPLETE']])
      );
    });

    it('should search with compliance flags filter', async () => {
      const filters: EVVRecordSearchFilters = {
        organizationId: 'org-123' as UUID,
        complianceFlags: ['GEOFENCE_VIOLATION'],
      };

      const pagination = { page: 1, limit: 10 };

      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{
          id: 'evv-1',
          visit_id: 'visit-1',
          organization_id: 'org-123',
          service_date: new Date(),
          service_address: JSON.stringify({ line1: '123 Main St' }),
          clock_in_verification: JSON.stringify({ latitude: 40.7128 }),
          compliance_flags: JSON.stringify(['GEOFENCE_VIOLATION']),
          sync_metadata: JSON.stringify({ syncId: 'sync-1' }),
          created_at: new Date(),
          updated_at: new Date(),
        }] });

      await repository.searchEVVRecords(filters, pagination);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('compliance_flags ?| $'),
        expect.arrayContaining(['org-123', ['GEOFENCE_VIOLATION']])
      );
    });

    it('should handle empty search results', async () => {
      const filters: EVVRecordSearchFilters = {
        organizationId: 'org-123' as UUID,
      };

      const pagination = { page: 1, limit: 10 };

      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await repository.searchEVVRecords(filters, pagination);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('createTimeEntry', () => {
    const mockTimeEntry = {
      visitId: 'visit-123' as UUID,
      evvRecordId: 'evv-123' as UUID,
      organizationId: 'org-123' as UUID,
      caregiverId: 'caregiver-123' as UUID,
      clientId: 'client-123' as UUID,
      entryType: 'CLOCK_IN' as const,
      entryTimestamp: new Date(),
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: new Date(),
        timestampSource: 'DEVICE' as any,
        isWithinGeofence: true,
        distanceFromAddress: 5,
        geofencePassed: true,
        deviceId: 'device-123',
        method: 'GPS' as any,
        locationSource: 'GPS_SATELLITE' as any,
        mockLocationDetected: false,
        verificationPassed: true,
      },
      deviceId: 'device-123',
      deviceInfo: {
        deviceId: 'device-123',
        deviceModel: 'iPhone 14',
        deviceOS: 'iOS',
        osVersion: '16.0',
        appVersion: '1.0.0',
      },
      integrityHash: 'hash123',
      serverReceivedAt: new Date(),
      syncMetadata: {
        syncId: 'sync-123',
        lastSyncedAt: new Date(),
        syncStatus: 'SYNCED' as any,
      },
      offlineRecorded: false,
      status: 'VERIFIED' as const,
      verificationPassed: true,
      // verificationIssues and manualOverride are optional and will be set to defaults
      createdBy: 'user-123' as UUID,
      updatedBy: 'user-123' as UUID,
    };

    it('should create time entry successfully', async () => {
      const expectedEntry = {
        id: 'time-entry-123',
        visit_id: 'visit-123',
        evv_record_id: 'evv-123',
        organization_id: 'org-123',
        caregiver_id: 'caregiver-123',
        client_id: 'client-123',
        entry_type: 'CLOCK_IN',
        entry_timestamp: new Date(),
        location: JSON.stringify(mockTimeEntry.location),
        device_id: 'device-123',
        device_info: JSON.stringify(mockTimeEntry.deviceInfo),
        integrity_hash: 'hash123',
        server_received_at: new Date(),
        sync_metadata: JSON.stringify(mockTimeEntry.syncMetadata),
        offline_recorded: false,
        manual_override_reason: null,
        status: 'VERIFIED',
        verification_passed: true,
        verification_issues: null,
        created_at: new Date(),
        created_by: 'user-123',
        updated_at: new Date(),
        updated_by: 'user-123',
        version: 1,
      };

      mockDatabase.query = vi.fn().mockResolvedValue({
        rows: [expectedEntry],
      });

      const result = await repository.createTimeEntry(mockTimeEntry);

      expect(result).toEqual(expect.objectContaining({
        id: 'time-entry-123',
        visitId: 'visit-123',
        entryType: 'CLOCK_IN',
        status: 'VERIFIED',
        verificationPassed: true,
      }));

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO time_entries'),
        expect.arrayContaining([
          'visit-123',
          'evv-123',
          'org-123',
          'caregiver-123',
          'client-123',
          'CLOCK_IN',
          expect.any(Date),
          expect.stringContaining('latitude'), // location JSON
          'device-123',
          expect.stringContaining('deviceModel'), // deviceInfo JSON
          'hash123',
          expect.any(Date),
          expect.stringContaining('sync-123'), // syncMetadata JSON
          false,
          null,
          'VERIFIED',
          true,
          null,
          null,
          'user-123',
          'user-123',
        ])
      );
    });
  });

  describe('getTimeEntriesByVisitId', () => {
    it('should return time entries for visit ordered by timestamp', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          visit_id: 'visit-123',
          entry_type: 'CLOCK_IN',
          entry_timestamp: new Date('2023-06-01T09:00:00Z'),
          location: JSON.stringify({ latitude: 40.7128 }),
          device_info: JSON.stringify({ deviceId: 'device-123' }),
          sync_metadata: JSON.stringify({ syncId: 'sync-1' }),
          status: 'VERIFIED',
          verification_passed: true,
          created_at: new Date(),
          created_by: 'user-123',
          updated_at: new Date(),
          updated_by: 'user-123',
          version: 1,
        },
        {
          id: 'entry-2',
          visit_id: 'visit-123',
          entry_type: 'CLOCK_OUT',
          entry_timestamp: new Date('2023-06-01T11:00:00Z'),
          location: JSON.stringify({ latitude: 40.7128 }),
          device_info: JSON.stringify({ deviceId: 'device-123' }),
          sync_metadata: JSON.stringify({ syncId: 'sync-2' }),
          status: 'VERIFIED',
          verification_passed: true,
          created_at: new Date(),
          created_by: 'user-123',
          updated_at: new Date(),
          updated_by: 'user-123',
          version: 1,
        },
      ];

      mockDatabase.query = vi.fn().mockResolvedValue({
        rows: mockEntries,
      });

      const result = await repository.getTimeEntriesByVisitId('visit-123');

      expect(result).toHaveLength(2);
      expect(result[0]!.entryType).toBe('CLOCK_IN');
      expect(result[1]!.entryType).toBe('CLOCK_OUT');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT \* FROM time_entries\s+WHERE visit_id = \$1\s+ORDER BY entry_timestamp ASC/),
        ['visit-123']
      );
    });

    it('should return empty array when no entries for visit', async () => {
      mockDatabase.query = vi.fn().mockResolvedValue({
        rows: [],
      });

      const result = await repository.getTimeEntriesByVisitId('visit-456');

      expect(result).toHaveLength(0);
    });
  });

  describe('createGeofence', () => {
    const mockGeofence = {
      organizationId: 'org-123' as UUID,
      clientId: 'client-123' as UUID,
      addressId: 'address-123' as UUID,
      centerLatitude: 40.7128,
      centerLongitude: -74.0060,
      radiusMeters: 100,
      radiusType: 'STANDARD' as const,
      shape: 'CIRCLE' as const,
      isActive: true,
      verificationCount: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      status: 'ACTIVE' as const,
      createdBy: 'user-123' as UUID,
      updatedBy: 'user-123' as UUID,
    };

    it('should create geofence successfully', async () => {
      const expectedGeofence = {
        id: 'geofence-123',
        organization_id: 'org-123',
        client_id: 'client-123',
        address_id: 'address-123',
        center_latitude: 40.7128,
        center_longitude: -74.0060,
        radius_meters: 100,
        radius_type: 'STANDARD',
        shape: 'CIRCLE',
        polygon_points: null,
        is_active: true,
        allowed_variance: null,
        calibrated_at: null,
        calibrated_by: null,
        calibration_method: null,
        calibration_notes: null,
        verification_count: 0,
        successful_verifications: 0,
        failed_verifications: 0,
        average_accuracy: null,
        status: 'ACTIVE',
        created_at: new Date(),
        created_by: 'user-123',
        updated_at: new Date(),
        updated_by: 'user-123',
        version: 1,
      };

      mockDatabase.query = vi.fn().mockResolvedValue({
        rows: [expectedGeofence],
      });

      const result = await repository.createGeofence(mockGeofence);

      expect(result).toEqual(expect.objectContaining({
        id: 'geofence-123',
        centerLatitude: 40.7128,
        centerLongitude: -74.0060,
        radiusMeters: 100,
        isActive: true,
        status: 'ACTIVE',
      }));

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO geofences'),
        expect.arrayContaining([
          'org-123',
          'client-123',
          'address-123',
          40.7128,
          -74.0060,
          100,
          'STANDARD',
          'CIRCLE',
          null, // polygonPoints
          true,
          undefined, // allowedVariance
          undefined, // calibratedAt
          undefined, // calibratedBy
          undefined, // calibrationMethod
          undefined, // calibrationNotes
          0, // verificationCount
          0, // successfulVerifications
          0, // failedVerifications
          undefined, // averageAccuracy
          'ACTIVE',
          'user-123',
          'user-123',
        ])
      );
    });

    it('should create polygon geofence with points', async () => {
      const polygonGeofence = {
        ...mockGeofence,
        shape: 'POLYGON' as const,
        polygonPoints: [
          { latitude: 40.7128, longitude: -74.0060 },
          { latitude: 40.7138, longitude: -74.0060 },
          { latitude: 40.7138, longitude: -74.0070 },
          { latitude: 40.7128, longitude: -74.0070 },
        ],
      };

      const expectedGeofence = {
        id: 'geofence-456',
        organization_id: 'org-123',
        client_id: 'client-123',
        address_id: 'address-123',
        center_latitude: 40.7128,
        center_longitude: -74.0060,
        radius_meters: 100,
        radius_type: 'STANDARD',
        shape: 'POLYGON',
        polygon_points: JSON.stringify(polygonGeofence.polygonPoints),
        is_active: true,
        allowed_variance: null,
        calibrated_at: null,
        calibrated_by: null,
        calibration_method: null,
        calibration_notes: null,
        verification_count: 0,
        successful_verifications: 0,
        failed_verifications: 0,
        average_accuracy: null,
        status: 'ACTIVE',
        created_at: new Date(),
        created_by: 'user-123',
        updated_at: new Date(),
        updated_by: 'user-123',
        version: 1,
      };

      mockDatabase.query = vi.fn().mockResolvedValue({
        rows: [expectedGeofence],
      });

      const result = await repository.createGeofence(polygonGeofence);

      expect(result.shape).toBe('POLYGON');
      expect(result.polygonPoints).toHaveLength(4);

      const queryCalls = mockDatabase.query.mock.calls;
      expect(queryCalls.length).toBeGreaterThan(0);
      const [queryString, params] = queryCalls[0];
      
      expect(queryString).toContain('INSERT INTO geofences');
      expect(params[0]).toBe('org-123');
      expect(params[1]).toBe('client-123');
      expect(params[2]).toBe('address-123');
      expect(params[7]).toBe('POLYGON');
      expect(params[8]).toContain('latitude'); // polygon_points JSON
      expect(params[9]).toBe(true);
    });
  });

  describe('getGeofenceByAddress', () => {
    it('should return active geofence for address', async () => {
      const mockGeofence = {
        id: 'geofence-123',
        organization_id: 'org-123',
        client_id: 'client-123',
        address_id: 'address-123',
        center_latitude: 40.7128,
        center_longitude: -74.0060,
        radius_meters: 100,
        is_active: true,
        status: 'ACTIVE',
        created_at: new Date(),
        created_by: 'user-123',
        updated_at: new Date(),
        updated_by: 'user-123',
        version: 1,
      };

      mockDatabase.query = vi.fn().mockResolvedValue({
        rows: [mockGeofence],
      });

      const result = await repository.getGeofenceByAddress('address-123');

      expect(result).toEqual(expect.objectContaining({
        id: 'geofence-123',
        centerLatitude: 40.7128,
        centerLongitude: -74.0060,
        radiusMeters: 100,
        isActive: true,
        status: 'ACTIVE',
      }));

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT \* FROM geofences\s+WHERE address_id = \$1 AND is_active = true AND status = 'ACTIVE'\s+ORDER BY created_at DESC\s+LIMIT 1/),
        ['address-123']
      );
    });

    it('should return null when no active geofence for address', async () => {
      mockDatabase.query = vi.fn().mockResolvedValue({
        rows: [],
      });

      const result = await repository.getGeofenceByAddress('address-456');

      expect(result).toBeNull();
    });
  });

  describe('updateGeofenceStats', () => {
    it('should update geofence statistics for successful verification', async () => {
      mockDatabase.query = vi.fn().mockResolvedValue({});

      await repository.updateGeofenceStats('geofence-123', true, 15);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE geofences\s+SET verification_count = verification_count \+ 1/),
        [
          1, // successful increment
          0, // failed increment
          15, // accuracy
          'geofence-123',
        ]
      );
    });

    it('should update geofence statistics for failed verification', async () => {
      mockDatabase.query = vi.fn().mockResolvedValue({});

      await repository.updateGeofenceStats('geofence-123', false, 25);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE geofences\s+SET verification_count = verification_count \+ 1/),
        [
          0, // successful increment
          1, // failed increment
          25, // accuracy
          'geofence-123',
        ]
      );
    });
  });
});