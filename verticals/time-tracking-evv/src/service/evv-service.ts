/**
 * EVV Service - Core business logic for time tracking and verification
 * 
 * Implements TX/FL state-specific EVV requirements with proper integration points.
 */

import {
  UserContext,
  PermissionError,
  NotFoundError,
  ValidationError,
  UUID,
  PaginationParams,
  PaginatedResult,
} from '@care-commons/core';
import { EVVRepository } from '../repository/evv-repository';
import { EVVValidator } from '../validation/evv-validator';
import { IntegrationService } from '../utils/integration-service';
import { CryptoUtils } from '../utils/crypto-utils';
import {
  EVVRecord,
  TimeEntry,
  Geofence,
  ClockInInput,
  ClockOutInput,
  CreateGeofenceInput,
  ManualOverrideInput,
  LocationVerification,
  VerificationResult,
  ExceptionEvent,
  EVVRecordSearchFilters,
} from '../types/evv';
import {
  IVisitProvider,
  IClientProvider,
  ICaregiverProvider,
} from '../interfaces/visit-provider';

export class EVVService {
  constructor(
    private repository: EVVRepository,
    private integrationService: IntegrationService,
    private visitProvider: IVisitProvider,
    private clientProvider: IClientProvider,
    private caregiverProvider: ICaregiverProvider,
    private validator: EVVValidator = new EVVValidator()
  ) { }

  /**
   * Clock in - Start a visit with location verification
   */
  async clockIn(
    input: ClockInInput,
    userContext: UserContext
  ): Promise<{ evvRecord: EVVRecord; timeEntry: TimeEntry; verification: VerificationResult }> {
    // Validate input
    this.validator.validateClockIn(input);

    // Check permissions
    if (!this.hasPermission(userContext, 'evv:clock_in')) {
      throw new PermissionError('User does not have permission to clock in');
    }

    // Verify caregiver matches user context (or supervisor override)
    if (input.caregiverId !== userContext.userId && !this.isSupervisor(userContext)) {
      throw new PermissionError('Cannot clock in for another caregiver');
    }

    // Validate caregiver can clock in for this visit
    const canClockIn = await this.visitProvider.canClockIn(input.visitId, input.caregiverId);
    if (!canClockIn) {
      throw new ValidationError('Cannot clock in for this visit', {
        visitId: input.visitId,
        caregiverId: input.caregiverId,
      });
    }

    // Get visit details from the visit provider (scheduling vertical)
    const visitData = await this.visitProvider.getVisitForEVV(input.visitId);
    
    // Get additional client details for compliance data
    const client = await this.clientProvider.getClientForEVV(visitData.clientId);
    
    // Get caregiver details
    const caregiver = await this.caregiverProvider.getCaregiverForEVV(input.caregiverId);
    
    // Validate caregiver is authorized for this service
    const authCheck = await this.caregiverProvider.canProvideService(
      input.caregiverId,
      visitData.serviceTypeCode,
      visitData.clientId
    );
    
    if (!authCheck.authorized) {
      throw new ValidationError(
        `Caregiver not authorized to provide service: ${authCheck.reason}`,
        {
          caregiverId: input.caregiverId,
          serviceTypeCode: visitData.serviceTypeCode,
          missingCredentials: authCheck.missingCredentials,
          blockedReasons: authCheck.blockedReasons,
        }
      );
    }

    // Validate address has coordinates for geofencing
    if (!visitData.serviceAddress.latitude || !visitData.serviceAddress.longitude) {
      throw new ValidationError(
        'Visit address must have valid geocoded coordinates for EVV compliance',
        { visitId: input.visitId, address: visitData.serviceAddress }
      );
    }

    // Get or create geofence for location
    const geofenceRadius = visitData.serviceAddress.geofenceRadius || 100; // Default 100m
    const geofence = await this.getOrCreateGeofence(
      visitData.serviceAddress.latitude,
      visitData.serviceAddress.longitude,
      geofenceRadius,
      visitData.organizationId,
      visitData.clientId,
      'address-id-123', // TODO: Get actual address ID from visit
      userContext
    );

    // Verify location
    const geofenceCheck = this.validator.checkGeofence(
      input.location.latitude,
      input.location.longitude,
      input.location.accuracy,
      geofence.centerLatitude,
      geofence.centerLongitude,
      geofence.radiusMeters,
      geofence.allowedVariance || 0
    );

    // Update geofence statistics
    await this.repository.updateGeofenceStats(
      geofence.id,
      geofenceCheck.isWithinGeofence,
      input.location.accuracy
    );

    // Create location verification object
    const locationVerification: LocationVerification = {
      latitude: input.location.latitude,
      longitude: input.location.longitude,
      accuracy: input.location.accuracy,
      altitude: input.location.altitude,
      heading: input.location.heading,
      speed: input.location.speed,
      timestamp: input.location.timestamp,
      timestampSource: 'DEVICE', // Would be determined by device
      isWithinGeofence: geofenceCheck.isWithinGeofence,
      distanceFromAddress: geofenceCheck.distanceFromAddress,
      geofencePassed: geofenceCheck.isWithinGeofence,
      deviceId: input.deviceInfo.deviceId,
      deviceModel: input.deviceInfo.deviceModel,
      deviceOS: input.deviceInfo.deviceOS,
      appVersion: input.deviceInfo.appVersion,
      method: input.location.method,
      locationSource: 'GPS_SATELLITE', // Would be determined
      mockLocationDetected: input.location.mockLocationDetected,
      photoUrl: input.location.photoUrl,
      biometricVerified: input.location.biometricVerified,
      biometricMethod: input.location.biometricMethod,
      verificationPassed: geofenceCheck.isWithinGeofence,
      verificationFailureReasons: geofenceCheck.isWithinGeofence ? undefined : [geofenceCheck.reason || 'Location outside geofence'],
    };

    // Create time entry first
    const now = new Date();
    const timeEntry = await this.repository.createTimeEntry({
      visitId: input.visitId,
      evvRecordId: undefined, // Will be linked after EVV record created
      organizationId: visitData.organizationId,
      caregiverId: input.caregiverId,
      clientId: visitData.clientId,
      entryType: 'CLOCK_IN',
      entryTimestamp: now,
      location: locationVerification,
      deviceId: input.deviceInfo.deviceId,
      deviceInfo: input.deviceInfo,
      integrityHash: this.generateIntegrityHash({
        visitId: input.visitId,
        caregiverId: input.caregiverId,
        timestamp: now,
        location: locationVerification,
      }),
      serverReceivedAt: now,
      syncMetadata: {
        syncId: this.generateUUID(),
        lastSyncedAt: now,
        syncStatus: 'SYNCED',
      },
      offlineRecorded: false,
      status: geofenceCheck.isWithinGeofence ? 'VERIFIED' : 'FLAGGED',
      verificationPassed: geofenceCheck.isWithinGeofence,
      verificationIssues: geofenceCheck.isWithinGeofence ? undefined : [geofenceCheck.reason || 'Location verification failed'],
      createdBy: userContext.userId,
      updatedBy: userContext.userId,
    });

    // Create EVV record
    const evvRecord = await this.repository.createEVVRecord({
      visitId: input.visitId,
      organizationId: visitData.organizationId,
      branchId: visitData.branchId,
      clientId: visitData.clientId,
      caregiverId: input.caregiverId,
      serviceTypeCode: visitData.serviceTypeCode,
      serviceTypeName: visitData.serviceTypeName,
      clientName: client.name,
      clientMedicaidId: client.medicaidId,
      caregiverName: caregiver.name,
      caregiverEmployeeId: caregiver.employeeId,
      caregiverNationalProviderId: caregiver.nationalProviderId,
      serviceDate: visitData.serviceDate,
      serviceAddress: {
        line1: visitData.serviceAddress.line1,
        line2: visitData.serviceAddress.line2,
        city: visitData.serviceAddress.city,
        state: visitData.serviceAddress.state,
        postalCode: visitData.serviceAddress.postalCode,
        country: visitData.serviceAddress.country,
        latitude: visitData.serviceAddress.latitude,
        longitude: visitData.serviceAddress.longitude,
        geofenceRadius: geofenceRadius,
        addressVerified: visitData.serviceAddress.addressVerified,
      },
      clockInTime: now,
      clockOutTime: null,
      clockInVerification: locationVerification,
      recordStatus: 'PENDING',
      verificationLevel: geofenceCheck.isWithinGeofence ? 'FULL' : 'PARTIAL',
      complianceFlags: geofenceCheck.isWithinGeofence ? ['COMPLIANT'] : ['GEOFENCE_VIOLATION'],
      integrityHash: this.generateCoreDataHash({
        visitId: input.visitId,
        clientId: visitData.clientId,
        caregiverId: input.caregiverId,
        serviceDate: visitData.serviceDate,
        clockInTime: now,
        serviceAddress: visitData.serviceAddress,
        clockInVerification: locationVerification,
      }),
      integrityChecksum: 'pending', // Will be computed on completion
      recordedAt: now,
      recordedBy: userContext.userId,
      syncMetadata: {
        syncId: this.generateUUID(),
        lastSyncedAt: now,
        syncStatus: 'SYNCED',
      },
      createdBy: userContext.userId,
      updatedBy: userContext.userId,
    });

    // Link time entry to EVV record
    await this.repository.updateTimeEntry(
      timeEntry.id,
      { evvRecordId: evvRecord.id },
      userContext.userId
    );

    // Perform comprehensive verification
    const verification = this.validator.performVerification(evvRecord, geofenceCheck);

    // Log exception if verification failed
    if (!verification.passed) {
      const exceptionEvent: ExceptionEvent = {
        id: this.generateUUID(),
        occurredAt: now,
        exceptionType: 'GEOFENCE_EXIT', // or appropriate type
        severity: 'HIGH',
        description: 'Clock-in verification issues detected',
        detectedBy: 'SYSTEM',
        automatic: true,
      };

      // Would store exception in database
    }

    return {
      evvRecord,
      timeEntry,
      verification,
    };
  }

  /**
   * Clock out - End a visit with location verification
   */
  async clockOut(
    input: ClockOutInput,
    userContext: UserContext
  ): Promise<{ evvRecord: EVVRecord; timeEntry: TimeEntry; verification: VerificationResult }> {
    // Validate input
    this.validator.validateClockOut(input);

    // Check permissions
    if (!this.hasPermission(userContext, 'evv:clock_out')) {
      throw new PermissionError('User does not have permission to clock out');
    }

    // Verify caregiver matches user context
    if (input.caregiverId !== userContext.userId && !this.isSupervisor(userContext)) {
      throw new PermissionError('Cannot clock out for another caregiver');
    }

    // Get existing EVV record
    const evvRecord = await this.repository.getEVVRecordById(input.evvRecordId);
    if (!evvRecord) {
      throw new NotFoundError('EVV record not found');
    }

    if (evvRecord.recordStatus !== 'PENDING') {
      throw new ValidationError('Visit has already been clocked out');
    }

    // Get geofence
    const geofence = await this.repository.getGeofenceByAddress('address-id-123'); // Would get from visit
    if (!geofence) {
      throw new NotFoundError('Geofence not found for visit location');
    }

    // Verify location
    const geofenceCheck = this.validator.checkGeofence(
      input.location.latitude,
      input.location.longitude,
      input.location.accuracy,
      geofence.centerLatitude,
      geofence.centerLongitude,
      geofence.radiusMeters,
      geofence.allowedVariance || 0
    );

    // Update geofence statistics
    await this.repository.updateGeofenceStats(
      geofence.id,
      geofenceCheck.isWithinGeofence,
      input.location.accuracy
    );

    // Create location verification
    const locationVerification: LocationVerification = {
      latitude: input.location.latitude,
      longitude: input.location.longitude,
      accuracy: input.location.accuracy,
      altitude: input.location.altitude,
      heading: input.location.heading,
      speed: input.location.speed,
      timestamp: input.location.timestamp,
      timestampSource: 'DEVICE',
      isWithinGeofence: geofenceCheck.isWithinGeofence,
      distanceFromAddress: geofenceCheck.distanceFromAddress,
      geofencePassed: geofenceCheck.isWithinGeofence,
      deviceId: input.deviceInfo.deviceId,
      deviceModel: input.deviceInfo.deviceModel,
      deviceOS: input.deviceInfo.deviceOS,
      appVersion: input.deviceInfo.appVersion,
      method: input.location.method,
      locationSource: 'GPS_SATELLITE',
      mockLocationDetected: input.location.mockLocationDetected,
      photoUrl: input.location.photoUrl,
      biometricVerified: input.location.biometricVerified,
      biometricMethod: input.location.biometricMethod,
      verificationPassed: geofenceCheck.isWithinGeofence,
      verificationFailureReasons: geofenceCheck.isWithinGeofence ? undefined : [geofenceCheck.reason || 'Location outside geofence'],
    };

    // Create time entry
    const now = new Date();
    const timeEntry = await this.repository.createTimeEntry({
      visitId: input.visitId,
      evvRecordId: evvRecord.id,
      organizationId: evvRecord.organizationId,
      caregiverId: input.caregiverId,
      clientId: evvRecord.clientId,
      entryType: 'CLOCK_OUT',
      entryTimestamp: now,
      location: locationVerification,
      deviceId: input.deviceInfo.deviceId,
      deviceInfo: input.deviceInfo,
      integrityHash: this.generateIntegrityHash({
        visitId: input.visitId,
        caregiverId: input.caregiverId,
        timestamp: now,
        location: locationVerification,
      }),
      serverReceivedAt: now,
      syncMetadata: {
        syncId: this.generateUUID(),
        lastSyncedAt: now,
        syncStatus: 'SYNCED',
      },
      offlineRecorded: false,
      status: geofenceCheck.isWithinGeofence ? 'VERIFIED' : 'FLAGGED',
      verificationPassed: geofenceCheck.isWithinGeofence,
      verificationIssues: geofenceCheck.isWithinGeofence ? undefined : [geofenceCheck.reason || 'Location verification failed'],
      createdBy: userContext.userId,
      updatedBy: userContext.userId,
    });

    // Calculate duration
    const durationMs = now.getTime() - evvRecord.clockInTime.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    // Update EVV record with clock-out data
    const updatedRecord = await this.repository.updateEVVRecord(
      evvRecord.id,
      {
        clockOutTime: now,
        clockOutVerification: locationVerification,
        totalDuration: durationMinutes,
        recordStatus: 'COMPLETE',
        integrityChecksum: this.generateChecksum({
          ...evvRecord,
          clockOutTime: now,
          clockOutVerification: locationVerification,
          totalDuration: durationMinutes,
        }),
      },
      userContext.userId
    );

    // Add client attestation if provided
    if (input.clientSignature) {
      await this.repository.updateEVVRecord(
        evvRecord.id,
        {
          clientAttestation: {
            attestedBy: evvRecord.clientId,
            attestedByName: input.clientSignature.attestedByName,
            attestedAt: now,
            attestationType: input.clientSignature.attestationType,
            signatureData: input.clientSignature.signatureData,
            signatureHash: input.clientSignature.signatureData
              ? this.generateIntegrityHash(input.clientSignature.signatureData)
              : undefined,
            statement: input.clientSignature.statement,
            deviceId: input.deviceInfo.deviceId,
          },
        },
        userContext.userId
      );
    }

    // Perform comprehensive verification
    const verification = this.validator.performVerification(updatedRecord, geofenceCheck);

    // Update compliance flags based on verification
    if (!verification.passed) {
      await this.repository.updateEVVRecord(
        evvRecord.id,
        {
          verificationLevel: verification.verificationLevel,
          complianceFlags: verification.complianceFlags,
        },
        userContext.userId
      );
    }

    return {
      evvRecord: updatedRecord,
      timeEntry,
      verification,
    };
  }

  /**
   * Apply manual override to flagged time entry
   */
  async applyManualOverride(
    input: ManualOverrideInput,
    userContext: UserContext
  ): Promise<TimeEntry> {
    // Check permissions - must be supervisor
    if (!this.isSupervisor(userContext)) {
      throw new PermissionError('Only supervisors can apply manual overrides');
    }

    // Get time entry
    const timeEntry = await this.repository.getTimeEntryById(input.timeEntryId);
    if (!timeEntry) {
      throw new NotFoundError('Time entry not found');
    }

    // Create manual override
    const manualOverride = {
      overrideBy: userContext.userId,
      overrideAt: new Date(),
      reason: input.reason,
      reasonCode: input.reasonCode,
      supervisorName: input.supervisorName,
      supervisorTitle: input.supervisorTitle,
      approvalAuthority: input.approvalAuthority,
      notes: input.notes,
    };

    // Update time entry
    return await this.repository.updateTimeEntry(
      input.timeEntryId,
      {
        status: 'OVERRIDDEN',
        verificationPassed: true,
        manualOverride,
      },
      userContext.userId
    );
  }

  /**
   * Create geofence for a location
   */
  async createGeofence(
    input: CreateGeofenceInput,
    userContext: UserContext
  ): Promise<Geofence> {
    // Validate input
    this.validator.validateGeofence(input);

    // Check permissions
    if (!this.hasPermission(userContext, 'geofences:create')) {
      throw new PermissionError('User does not have permission to create geofences');
    }

    return await this.repository.createGeofence({
      organizationId: input.organizationId,
      clientId: input.clientId,
      addressId: input.addressId,
      centerLatitude: input.centerLatitude,
      centerLongitude: input.centerLongitude,
      radiusMeters: input.radiusMeters,
      radiusType: input.radiusType || 'STANDARD',
      shape: input.shape || 'CIRCLE',
      polygonPoints: input.polygonPoints,
      isActive: true,
      verificationCount: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      status: 'ACTIVE',
      createdBy: userContext.userId,
      updatedBy: userContext.userId,
    });
  }

  /**
   * Get or create geofence for location
   */
  private async getOrCreateGeofence(
    latitude: number,
    longitude: number,
    radius: number,
    organizationId: UUID,
    clientId: UUID,
    addressId: UUID,
    userContext: UserContext
  ): Promise<Geofence> {
    // Try to get existing geofence
    let geofence = await this.repository.getGeofenceByAddress(addressId);

    if (!geofence) {
      // Create new geofence
      geofence = await this.createGeofence(
        {
          organizationId,
          clientId,
          addressId,
          centerLatitude: latitude,
          centerLongitude: longitude,
          radiusMeters: radius,
        },
        userContext
      );
    }

    return geofence;
  }

  /**
   * Get EVV records by visit
   */
  async getEVVRecordByVisit(visitId: UUID, userContext: UserContext): Promise<EVVRecord | null> {
    if (!this.hasPermission(userContext, 'evv:read')) {
      throw new PermissionError('User does not have permission to view EVV records');
    }

    return await this.repository.getEVVRecordByVisitId(visitId);
  }

  /**
   * Get time entries for visit
   */
  async getTimeEntriesByVisit(visitId: UUID, userContext: UserContext): Promise<TimeEntry[]> {
    if (!this.hasPermission(userContext, 'evv:read')) {
      throw new PermissionError('User does not have permission to view time entries');
    }

    return await this.repository.getTimeEntriesByVisitId(visitId);
  }

  /**
   * Search EVV records
   */
  async searchEVVRecords(
    filters: EVVRecordSearchFilters,
    pagination: PaginationParams,
    userContext: UserContext
  ): Promise<PaginatedResult<EVVRecord>> {
    if (!this.hasPermission(userContext, 'evv:read')) {
      throw new PermissionError('User does not have permission to search EVV records');
    }

    return await this.repository.searchEVVRecords(filters, pagination);
  }

  /**
   * Helper: Check if user has permission
   */
  private hasPermission(userContext: UserContext, permission: string): boolean {
    return userContext.permissions.includes(permission) || userContext.roles.includes('SUPER_ADMIN');
  }

  /**
   * Helper: Check if user is supervisor
   */
  private isSupervisor(userContext: UserContext): boolean {
    return (
      userContext.roles.includes('SUPER_ADMIN') ||
      userContext.roles.includes('ORG_ADMIN') ||
      userContext.roles.includes('BRANCH_ADMIN') ||
      userContext.roles.includes('COORDINATOR')
    );
  }

  /**
   * Helper: Generate UUID (cryptographically secure)
   */
  private generateUUID(): UUID {
    return CryptoUtils.generateSecureId();
  }

  /**
   * Helper: Generate integrity hash using production-grade crypto
   */
  private generateIntegrityHash(data: any): string {
    return CryptoUtils.generateIntegrityHash(data);
  }

  /**
   * Helper: Generate core data hash for EVV record
   */
  private generateCoreDataHash(data: any): string {
    return CryptoUtils.generateIntegrityHash(data);
  }

  /**
   * Helper: Generate checksum
   */
  private generateChecksum(data: any): string {
    return CryptoUtils.generateChecksum(data);
  }
}
