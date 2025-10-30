"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVVService = void 0;
const core_1 = require("@care-commons/core");
const evv_validator_1 = require("../validation/evv-validator");
const crypto_utils_1 = require("../utils/crypto-utils");
class EVVService {
    constructor(repository, integrationService, visitProvider, clientProvider, caregiverProvider, validator = new evv_validator_1.EVVValidator()) {
        this.repository = repository;
        this.integrationService = integrationService;
        this.visitProvider = visitProvider;
        this.clientProvider = clientProvider;
        this.caregiverProvider = caregiverProvider;
        this.validator = validator;
    }
    async clockIn(input, userContext) {
        this.validator.validateClockIn(input);
        if (!this.hasPermission(userContext, 'evv:clock_in')) {
            throw new core_1.PermissionError('User does not have permission to clock in');
        }
        if (input.caregiverId !== userContext.userId && !this.isSupervisor(userContext)) {
            throw new core_1.PermissionError('Cannot clock in for another caregiver');
        }
        const canClockIn = await this.visitProvider.canClockIn(input.visitId, input.caregiverId);
        if (!canClockIn) {
            throw new core_1.ValidationError('Cannot clock in for this visit', {
                visitId: input.visitId,
                caregiverId: input.caregiverId,
            });
        }
        const visitData = await this.visitProvider.getVisitForEVV(input.visitId);
        const client = await this.clientProvider.getClientForEVV(visitData.clientId);
        const caregiver = await this.caregiverProvider.getCaregiverForEVV(input.caregiverId);
        const authCheck = await this.caregiverProvider.canProvideService(input.caregiverId, visitData.serviceTypeCode, visitData.clientId);
        if (!authCheck.authorized) {
            throw new core_1.ValidationError(`Caregiver not authorized to provide service: ${authCheck.reason}`, {
                caregiverId: input.caregiverId,
                serviceTypeCode: visitData.serviceTypeCode,
                missingCredentials: authCheck.missingCredentials,
                blockedReasons: authCheck.blockedReasons,
            });
        }
        if (!visitData.serviceAddress.latitude || !visitData.serviceAddress.longitude) {
            throw new core_1.ValidationError('Visit address must have valid geocoded coordinates for EVV compliance', { visitId: input.visitId, address: visitData.serviceAddress });
        }
        const geofenceRadius = visitData.serviceAddress.geofenceRadius || 100;
        const geofence = await this.getOrCreateGeofence(visitData.serviceAddress.latitude, visitData.serviceAddress.longitude, geofenceRadius, visitData.organizationId, visitData.clientId, 'address-id-123', userContext);
        const geofenceCheck = this.validator.checkGeofence(input.location.latitude, input.location.longitude, input.location.accuracy, geofence.centerLatitude, geofence.centerLongitude, geofence.radiusMeters, geofence.allowedVariance || 0);
        await this.repository.updateGeofenceStats(geofence.id, geofenceCheck.isWithinGeofence, input.location.accuracy);
        const locationVerification = {
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
        const now = new Date();
        const timeEntry = await this.repository.createTimeEntry({
            visitId: input.visitId,
            evvRecordId: undefined,
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
            integrityChecksum: 'pending',
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
        await this.repository.updateTimeEntry(timeEntry.id, { evvRecordId: evvRecord.id }, userContext.userId);
        const verification = this.validator.performVerification(evvRecord, geofenceCheck);
        if (!verification.passed) {
            const exceptionEvent = {
                id: this.generateUUID(),
                occurredAt: now,
                exceptionType: 'GEOFENCE_EXIT',
                severity: 'HIGH',
                description: 'Clock-in verification issues detected',
                detectedBy: 'SYSTEM',
                automatic: true,
            };
        }
        return {
            evvRecord,
            timeEntry,
            verification,
        };
    }
    async clockOut(input, userContext) {
        this.validator.validateClockOut(input);
        if (!this.hasPermission(userContext, 'evv:clock_out')) {
            throw new core_1.PermissionError('User does not have permission to clock out');
        }
        if (input.caregiverId !== userContext.userId && !this.isSupervisor(userContext)) {
            throw new core_1.PermissionError('Cannot clock out for another caregiver');
        }
        const evvRecord = await this.repository.getEVVRecordById(input.evvRecordId);
        if (!evvRecord) {
            throw new core_1.NotFoundError('EVV record not found');
        }
        if (evvRecord.recordStatus !== 'PENDING') {
            throw new core_1.ValidationError('Visit has already been clocked out');
        }
        const geofence = await this.repository.getGeofenceByAddress('address-id-123');
        if (!geofence) {
            throw new core_1.NotFoundError('Geofence not found for visit location');
        }
        const geofenceCheck = this.validator.checkGeofence(input.location.latitude, input.location.longitude, input.location.accuracy, geofence.centerLatitude, geofence.centerLongitude, geofence.radiusMeters, geofence.allowedVariance || 0);
        await this.repository.updateGeofenceStats(geofence.id, geofenceCheck.isWithinGeofence, input.location.accuracy);
        const locationVerification = {
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
        const durationMs = now.getTime() - evvRecord.clockInTime.getTime();
        const durationMinutes = Math.round(durationMs / 60000);
        const updatedRecord = await this.repository.updateEVVRecord(evvRecord.id, {
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
        }, userContext.userId);
        if (input.clientSignature) {
            await this.repository.updateEVVRecord(evvRecord.id, {
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
            }, userContext.userId);
        }
        const verification = this.validator.performVerification(updatedRecord, geofenceCheck);
        if (!verification.passed) {
            await this.repository.updateEVVRecord(evvRecord.id, {
                verificationLevel: verification.verificationLevel,
                complianceFlags: verification.complianceFlags,
            }, userContext.userId);
        }
        return {
            evvRecord: updatedRecord,
            timeEntry,
            verification,
        };
    }
    async applyManualOverride(input, userContext) {
        if (!this.isSupervisor(userContext)) {
            throw new core_1.PermissionError('Only supervisors can apply manual overrides');
        }
        const timeEntry = await this.repository.getTimeEntryById(input.timeEntryId);
        if (!timeEntry) {
            throw new core_1.NotFoundError('Time entry not found');
        }
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
        return await this.repository.updateTimeEntry(input.timeEntryId, {
            status: 'OVERRIDDEN',
            verificationPassed: true,
            manualOverride,
        }, userContext.userId);
    }
    async createGeofence(input, userContext) {
        this.validator.validateGeofence(input);
        if (!this.hasPermission(userContext, 'geofences:create')) {
            throw new core_1.PermissionError('User does not have permission to create geofences');
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
    async getOrCreateGeofence(latitude, longitude, radius, organizationId, clientId, addressId, userContext) {
        let geofence = await this.repository.getGeofenceByAddress(addressId);
        if (!geofence) {
            geofence = await this.createGeofence({
                organizationId,
                clientId,
                addressId,
                centerLatitude: latitude,
                centerLongitude: longitude,
                radiusMeters: radius,
            }, userContext);
        }
        return geofence;
    }
    async getEVVRecordByVisit(visitId, userContext) {
        if (!this.hasPermission(userContext, 'evv:read')) {
            throw new core_1.PermissionError('User does not have permission to view EVV records');
        }
        return await this.repository.getEVVRecordByVisitId(visitId);
    }
    async getTimeEntriesByVisit(visitId, userContext) {
        if (!this.hasPermission(userContext, 'evv:read')) {
            throw new core_1.PermissionError('User does not have permission to view time entries');
        }
        return await this.repository.getTimeEntriesByVisitId(visitId);
    }
    async searchEVVRecords(filters, pagination, userContext) {
        if (!this.hasPermission(userContext, 'evv:read')) {
            throw new core_1.PermissionError('User does not have permission to search EVV records');
        }
        return await this.repository.searchEVVRecords(filters, pagination);
    }
    hasPermission(userContext, permission) {
        return userContext.permissions.includes(permission) || userContext.roles.includes('SUPER_ADMIN');
    }
    isSupervisor(userContext) {
        return (userContext.roles.includes('SUPER_ADMIN') ||
            userContext.roles.includes('ORG_ADMIN') ||
            userContext.roles.includes('BRANCH_ADMIN') ||
            userContext.roles.includes('COORDINATOR'));
    }
    generateUUID() {
        return crypto_utils_1.CryptoUtils.generateSecureId();
    }
    generateIntegrityHash(data) {
        return crypto_utils_1.CryptoUtils.generateIntegrityHash(data);
    }
    generateCoreDataHash(data) {
        return crypto_utils_1.CryptoUtils.generateIntegrityHash(data);
    }
    generateChecksum(data) {
        return crypto_utils_1.CryptoUtils.generateChecksum(data);
    }
}
exports.EVVService = EVVService;
//# sourceMappingURL=evv-service.js.map