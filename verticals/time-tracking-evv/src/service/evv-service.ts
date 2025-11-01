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
  EVVRecordSearchFilters,
  ComplianceFlag,
  VerificationLevel,
} from '../types/evv';
import {
  IVisitProvider,
  IClientProvider,
  ICaregiverProvider,
} from '../interfaces/visit-provider';
import { TexasEVVProvider } from '../providers/texas-evv-provider';
import { FloridaEVVProvider } from '../providers/florida-evv-provider';
import { Database } from '@care-commons/core';

export class EVVService {
  private texasProvider?: TexasEVVProvider;
  private floridaProvider?: FloridaEVVProvider;

  constructor(
    private repository: EVVRepository,
    _integrationService: IntegrationService,
    private visitProvider: IVisitProvider,
    private clientProvider: IClientProvider,
    private caregiverProvider: ICaregiverProvider,
    private database: Database,
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
    const addressId = visitData.serviceAddress.addressId || this.generateFallbackAddressId(visitData.serviceAddress);
    const geofence = await this.getOrCreateGeofence(
      visitData.serviceAddress.latitude,
      visitData.serviceAddress.longitude,
      geofenceRadius,
      visitData.organizationId,
      visitData.clientId,
      addressId,
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
    const baseLocationVerification = {
      latitude: input.location.latitude,
      longitude: input.location.longitude,
      accuracy: input.location.accuracy,
      timestamp: input.location.timestamp,
      timestampSource: 'DEVICE' as const, // Would be determined by device
      isWithinGeofence: geofenceCheck.isWithinGeofence,
      distanceFromAddress: geofenceCheck.distanceFromAddress,
      geofencePassed: geofenceCheck.isWithinGeofence,
      deviceId: input.deviceInfo.deviceId,
      deviceModel: input.deviceInfo.deviceModel,
      deviceOS: input.deviceInfo.deviceOS,
      appVersion: input.deviceInfo.appVersion,
      method: input.location.method,
      locationSource: 'GPS_SATELLITE' as const, // Would be determined
      mockLocationDetected: input.location.mockLocationDetected,
      verificationPassed: geofenceCheck.isWithinGeofence,
    };

    const clockInOptionalFields = {
      altitude: input.location.altitude,
      heading: input.location.heading,
      speed: input.location.speed,
      photoUrl: input.location.photoUrl,
      biometricVerified: input.location.biometricVerified,
      biometricMethod: input.location.biometricMethod,
      verificationFailureReasons: geofenceCheck.isWithinGeofence ? undefined : [geofenceCheck.reason || 'Location outside geofence'],
    };

    const clockInFilteredOptional = Object.fromEntries(
      Object.entries(clockInOptionalFields).filter(([_, value]) => value !== undefined)
    );

    const locationVerification: LocationVerification = { ...baseLocationVerification, ...clockInFilteredOptional };

    // Create time entry first
    const now = new Date();
    const timeEntry = await this.repository.createTimeEntry({
      visitId: input.visitId,
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
      verificationIssues: geofenceCheck.isWithinGeofence ? [] : [geofenceCheck.reason || 'Location verification failed'],
      createdBy: userContext.userId,
      updatedBy: userContext.userId,
    });

    // Create EVV record
    const evvRecordBase = {
      visitId: input.visitId,
      organizationId: visitData.organizationId,
      branchId: visitData.branchId,
      clientId: visitData.clientId,
      caregiverId: input.caregiverId,
      serviceTypeCode: visitData.serviceTypeCode,
      serviceTypeName: visitData.serviceTypeName,
      clientName: client.name,
      caregiverName: caregiver.name,
      caregiverEmployeeId: caregiver.employeeId,
      serviceDate: visitData.serviceDate,
      serviceAddress: (() => {
        const baseAddress = {
          line1: visitData.serviceAddress.line1,
          city: visitData.serviceAddress.city,
          state: visitData.serviceAddress.state,
          postalCode: visitData.serviceAddress.postalCode,
          country: visitData.serviceAddress.country,
          latitude: visitData.serviceAddress.latitude,
          longitude: visitData.serviceAddress.longitude,
          geofenceRadius: geofenceRadius,
          addressVerified: visitData.serviceAddress.addressVerified,
        };

        const addressOptionalFields = {
          line2: visitData.serviceAddress.line2,
        };

        const addressFilteredOptional = Object.fromEntries(
          Object.entries(addressOptionalFields).filter(([_, value]) => value !== undefined)
        );

        return { ...baseAddress, ...addressFilteredOptional };
      })(),
      clockInTime: now,
      clockOutTime: null,
      clockInVerification: locationVerification,
      recordStatus: 'PENDING' as const,
      verificationLevel: (geofenceCheck.isWithinGeofence ? 'FULL' : 'PARTIAL') as VerificationLevel,
      complianceFlags: (geofenceCheck.isWithinGeofence ? ['COMPLIANT'] : ['GEOFENCE_VIOLATION']) as ComplianceFlag[],
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
        syncStatus: 'SYNCED' as const,
      },
      createdBy: userContext.userId,
      updatedBy: userContext.userId,
    };

    const evvRecordOptionalFields = {
      clientMedicaidId: client.medicaidId,
      caregiverNationalProviderId: caregiver.nationalProviderId,
    };

    const evvRecordFilteredOptional = Object.fromEntries(
      Object.entries(evvRecordOptionalFields).filter(([_, value]) => value !== undefined)
    );

    const evvRecord = await this.repository.createEVVRecord({
      ...evvRecordBase,
      ...evvRecordFilteredOptional,
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
      // Would store exception in database
      console.log('Clock-in verification issues detected', verification.issues);
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
    const baseLocationVerification = {
      latitude: input.location.latitude,
      longitude: input.location.longitude,
      accuracy: input.location.accuracy,
      timestamp: input.location.timestamp,
      timestampSource: 'DEVICE' as const,
      isWithinGeofence: geofenceCheck.isWithinGeofence,
      distanceFromAddress: geofenceCheck.distanceFromAddress,
      geofencePassed: geofenceCheck.isWithinGeofence,
      deviceId: input.deviceInfo.deviceId,
      deviceModel: input.deviceInfo.deviceModel,
      deviceOS: input.deviceInfo.deviceOS,
      appVersion: input.deviceInfo.appVersion,
      method: input.location.method,
      locationSource: 'GPS_SATELLITE' as const,
      mockLocationDetected: input.location.mockLocationDetected,
      verificationPassed: geofenceCheck.isWithinGeofence,
    };

    const clockOutOptionalFields = {
      altitude: input.location.altitude,
      heading: input.location.heading,
      speed: input.location.speed,
      photoUrl: input.location.photoUrl,
      biometricVerified: input.location.biometricVerified,
      biometricMethod: input.location.biometricMethod,
      verificationFailureReasons: geofenceCheck.isWithinGeofence ? undefined : [geofenceCheck.reason || 'Location outside geofence'],
    };

    const clockOutFilteredOptional = Object.fromEntries(
      Object.entries(clockOutOptionalFields).filter(([_, value]) => value !== undefined)
    );

    const locationVerification: LocationVerification = { ...baseLocationVerification, ...clockOutFilteredOptional };

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
      verificationIssues: geofenceCheck.isWithinGeofence ? [] : [geofenceCheck.reason || 'Location verification failed'],
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
      const baseAttestation = {
        attestedBy: evvRecord.clientId,
        attestedByName: input.clientSignature.attestedByName,
        attestedAt: now,
        attestationType: input.clientSignature.attestationType,
        statement: input.clientSignature.statement,
        deviceId: input.deviceInfo.deviceId,
      };

      const optionalFields = {
        signatureData: input.clientSignature.signatureData,
        signatureHash: input.clientSignature.signatureData
          ? this.generateIntegrityHash(input.clientSignature.signatureData)
          : undefined,
      };

      const filteredOptional = Object.fromEntries(
        Object.entries(optionalFields).filter(([_, value]) => value !== undefined)
      );

      const clientAttestation = { ...baseAttestation, ...filteredOptional };

      await this.repository.updateEVVRecord(
        evvRecord.id,
        { clientAttestation },
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
    const baseManualOverride = {
      overrideBy: userContext.userId,
      overrideAt: new Date(),
      reason: input.reason,
      reasonCode: input.reasonCode,
      supervisorName: input.supervisorName,
      supervisorTitle: input.supervisorTitle,
      approvalAuthority: input.approvalAuthority,
    };

    const optionalFields = {
      notes: input.notes,
    };

    const filteredOptional = Object.fromEntries(
      Object.entries(optionalFields).filter(([_, value]) => value !== undefined)
    );

    const manualOverride = { ...baseManualOverride, ...filteredOptional };

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

    const geofenceBase = {
      organizationId: input.organizationId,
      clientId: input.clientId,
      addressId: input.addressId,
      centerLatitude: input.centerLatitude,
      centerLongitude: input.centerLongitude,
      radiusMeters: input.radiusMeters,
      radiusType: input.radiusType || 'STANDARD',
      shape: input.shape || 'CIRCLE',
      isActive: true,
      verificationCount: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      status: 'ACTIVE' as const,
      createdBy: userContext.userId,
      updatedBy: userContext.userId,
    };

    const geofenceOptional = {
      polygonPoints: input.polygonPoints,
    };

    const geofenceFilteredOptional = Object.fromEntries(
      Object.entries(geofenceOptional).filter(([_, value]) => value !== undefined)
    );

    return await this.repository.createGeofence({
      ...geofenceBase,
      ...geofenceFilteredOptional,
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
   * Helper: Generate fallback address ID if not provided by visit
   */
  private generateFallbackAddressId(address: { line1: string; city: string; state: string; postalCode: string }): UUID {
    const addressString = `${address.line1}|${address.city}|${address.state}|${address.postalCode}`.toLowerCase();
    const hash = addressString.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    const hashStr = Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
    return `${hashStr.substring(0, 8)}-${hashStr.substring(8, 12)}-${hashStr.substring(12, 16)}-${hashStr.substring(16, 20)}-${hashStr.substring(20, 32)}` as UUID;
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
    * Submit EVV record to state aggregator(s)
    * SOLID: Open/Closed - extends functionality without modifying core clock-in/out
    */
  async submitToStateAggregator(
    evvRecordId: UUID,
    _userContext: UserContext
  ): Promise<SubmissionResult> {
    const evvRecord = await this.repository.getEVVRecordById(evvRecordId);
    if (!evvRecord) {
      throw new Error('EVV record not found');
    }

    // Get client's state
    const client = await this.database.query(`
      SELECT state FROM clients WHERE id = $1
    `, [evvRecord.clientId]);
    
    const state = client.rows[0]?.['state'];

    if (state === 'TX') {
      if (!this.texasProvider) {
        this.texasProvider = new TexasEVVProvider(this.database);
      }
      const submission = await this.texasProvider.submitToAggregator(evvRecord);
      return { submissions: [submission], state: 'TX' };
    }

    if (state === 'FL') {
      if (!this.floridaProvider) {
        this.floridaProvider = new FloridaEVVProvider(this.database);
      }
      const submissions = await this.floridaProvider.submitToAggregators(evvRecord);
      return { submissions, state: 'FL' };
    }

    throw new Error(`State ${state} does not have EVV aggregator configured`);
  }

  /**
    * Helper: Generate checksum
    */
  private generateChecksum(data: any): string {
    return CryptoUtils.generateChecksum(data);
  }
}

interface SubmissionResult {
  submissions: any[];
  state: string;
}
