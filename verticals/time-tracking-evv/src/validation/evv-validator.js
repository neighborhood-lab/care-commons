"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVVValidator = void 0;
const core_1 = require("@care-commons/core");
class EVVValidator {
    validateClockIn(input) {
        const errors = [];
        if (!input.visitId) {
            errors.push('visitId is required');
        }
        if (!input.caregiverId) {
            errors.push('caregiverId is required');
        }
        if (!input.location) {
            errors.push('location data is required');
        }
        else {
            this.validateLocation(input.location, errors);
        }
        if (!input.deviceInfo) {
            errors.push('deviceInfo is required');
        }
        else {
            this.validateDeviceInfo(input.deviceInfo, errors);
        }
        if (errors.length > 0) {
            throw new core_1.ValidationError('Invalid clock-in data', { errors });
        }
    }
    validateClockOut(input) {
        const errors = [];
        if (!input.visitId) {
            errors.push('visitId is required');
        }
        if (!input.evvRecordId) {
            errors.push('evvRecordId is required');
        }
        if (!input.caregiverId) {
            errors.push('caregiverId is required');
        }
        if (!input.location) {
            errors.push('location data is required');
        }
        else {
            this.validateLocation(input.location, errors);
        }
        if (!input.deviceInfo) {
            errors.push('deviceInfo is required');
        }
        else {
            this.validateDeviceInfo(input.deviceInfo, errors);
        }
        if (errors.length > 0) {
            throw new core_1.ValidationError('Invalid clock-out data', { errors });
        }
    }
    validateLocation(location, errors) {
        if (location.latitude < -90 || location.latitude > 90) {
            errors.push('latitude must be between -90 and 90');
        }
        if (location.longitude < -180 || location.longitude > 180) {
            errors.push('longitude must be between -180 and 180');
        }
        if (location.accuracy < 0) {
            errors.push('accuracy cannot be negative');
        }
        if (location.accuracy > 1000) {
            errors.push('accuracy over 1000 meters is too low for verification');
        }
        if (!location.timestamp) {
            errors.push('location timestamp is required');
        }
        else {
            const now = new Date();
            const locationTime = new Date(location.timestamp);
            const timeDiff = Math.abs(now.getTime() - locationTime.getTime()) / 1000;
            if (timeDiff > 300) {
                errors.push('location timestamp is too far from server time (clock skew detected)');
            }
        }
        if (!location.method) {
            errors.push('verification method is required');
        }
        if (location.mockLocationDetected) {
            errors.push('mock location/GPS spoofing detected - verification failed');
        }
    }
    validateDeviceInfo(deviceInfo, errors) {
        if (!deviceInfo.deviceId) {
            errors.push('deviceId is required');
        }
        if (!deviceInfo.deviceModel) {
            errors.push('deviceModel is required');
        }
        if (!deviceInfo.deviceOS) {
            errors.push('deviceOS is required');
        }
        if (!deviceInfo.appVersion) {
            errors.push('appVersion is required');
        }
        if (deviceInfo.isRooted || deviceInfo.isJailbroken) {
            errors.push('rooted/jailbroken devices are not allowed for EVV compliance');
        }
    }
    validateGeofence(input) {
        const errors = [];
        if (!input.organizationId) {
            errors.push('organizationId is required');
        }
        if (!input.clientId) {
            errors.push('clientId is required');
        }
        if (!input.addressId) {
            errors.push('addressId is required');
        }
        if (input.centerLatitude < -90 || input.centerLatitude > 90) {
            errors.push('centerLatitude must be between -90 and 90');
        }
        if (input.centerLongitude < -180 || input.centerLongitude > 180) {
            errors.push('centerLongitude must be between -180 and 180');
        }
        if (input.radiusMeters <= 0) {
            errors.push('radiusMeters must be positive');
        }
        if (input.radiusMeters < 10) {
            errors.push('radiusMeters too small - minimum is 10 meters');
        }
        if (input.radiusMeters > 500) {
            errors.push('radiusMeters too large - maximum is 500 meters');
        }
        if (input.shape === 'POLYGON') {
            if (!input.polygonPoints || input.polygonPoints.length < 3) {
                errors.push('polygon shape requires at least 3 points');
            }
        }
        if (errors.length > 0) {
            throw new core_1.ValidationError('Invalid geofence data', { errors });
        }
    }
    checkGeofence(locationLat, locationLon, locationAccuracy, geofenceLat, geofenceLon, geofenceRadius, allowedVariance = 0) {
        const distance = this.calculateDistance(locationLat, locationLon, geofenceLat, geofenceLon);
        const effectiveRadius = geofenceRadius + allowedVariance;
        const maxPossibleDistance = distance + locationAccuracy;
        const minPossibleDistance = Math.max(0, distance - locationAccuracy);
        const isWithinGeofence = minPossibleDistance <= effectiveRadius;
        const requiresManualReview = maxPossibleDistance > effectiveRadius && minPossibleDistance <= effectiveRadius;
        let reason;
        if (!isWithinGeofence) {
            if (distance > effectiveRadius + 50) {
                reason = 'Location is significantly outside geofence';
            }
            else {
                reason = 'Location is slightly outside geofence - may need manual review';
            }
        }
        else if (requiresManualReview) {
            reason = 'GPS accuracy makes verification uncertain - manual review recommended';
        }
        return {
            isWithinGeofence,
            distanceFromCenter: distance,
            distanceFromAddress: distance,
            accuracy: locationAccuracy,
            requiresManualReview,
            reason,
        };
    }
    verifyIntegrity(record) {
        const coreData = {
            visitId: record.visitId,
            clientId: record.clientId,
            caregiverId: record.caregiverId,
            serviceDate: record.serviceDate,
            clockInTime: record.clockInTime,
            clockOutTime: record.clockOutTime,
            serviceAddress: record.serviceAddress,
            clockInVerification: record.clockInVerification,
            clockOutVerification: record.clockOutVerification,
        };
        const computedHash = this.computeHash(JSON.stringify(coreData));
        const hashMatch = computedHash === record.integrityHash;
        const checksumData = JSON.stringify(record);
        const computedChecksum = this.computeChecksum(checksumData);
        const checksumMatch = computedChecksum === record.integrityChecksum;
        const tamperDetected = !hashMatch || !checksumMatch;
        const issues = [];
        if (!hashMatch) {
            issues.push('Integrity hash mismatch - core data may have been tampered with');
        }
        if (!checksumMatch) {
            issues.push('Checksum mismatch - record data may have been modified');
        }
        return {
            isValid: !tamperDetected,
            hashMatch,
            checksumMatch,
            tamperDetected,
            issues: issues.length > 0 ? issues : undefined,
        };
    }
    performVerification(evvRecord, geofenceCheck) {
        const issues = [];
        const complianceFlags = ['COMPLIANT'];
        let requiresSupervisorReview = false;
        if (!geofenceCheck.isWithinGeofence) {
            issues.push({
                issueType: 'GEOFENCE_VIOLATION',
                severity: 'HIGH',
                description: `Location verification failed - ${geofenceCheck.distanceFromAddress}m from address`,
                canBeOverridden: true,
                requiresSupervisor: true,
            });
            complianceFlags.push('GEOFENCE_VIOLATION');
            requiresSupervisorReview = true;
        }
        if (geofenceCheck.requiresManualReview) {
            issues.push({
                issueType: 'LOCATION_UNCERTAIN',
                severity: 'MEDIUM',
                description: 'GPS accuracy makes location uncertain',
                canBeOverridden: true,
                requiresSupervisor: true,
            });
            requiresSupervisorReview = true;
        }
        if (evvRecord.clockInVerification.accuracy > 100) {
            issues.push({
                issueType: 'LOW_GPS_ACCURACY',
                severity: 'MEDIUM',
                description: `GPS accuracy is low (${evvRecord.clockInVerification.accuracy}m)`,
                canBeOverridden: true,
                requiresSupervisor: false,
            });
        }
        if (evvRecord.clockInVerification.mockLocationDetected) {
            issues.push({
                issueType: 'GPS_SPOOFING',
                severity: 'CRITICAL',
                description: 'Mock location/GPS spoofing detected',
                canBeOverridden: true,
                requiresSupervisor: true,
            });
            complianceFlags.push('LOCATION_SUSPICIOUS');
            requiresSupervisorReview = true;
        }
        const deviceInfo = evvRecord.clockInVerification.deviceId;
        if (evvRecord.totalDuration) {
            if (evvRecord.totalDuration < 5) {
                issues.push({
                    issueType: 'VISIT_TOO_SHORT',
                    severity: 'HIGH',
                    description: 'Visit duration is suspiciously short',
                    canBeOverridden: true,
                    requiresSupervisor: true,
                });
                requiresSupervisorReview = true;
            }
            if (evvRecord.totalDuration > 720) {
                issues.push({
                    issueType: 'VISIT_TOO_LONG',
                    severity: 'MEDIUM',
                    description: 'Visit duration is unusually long',
                    canBeOverridden: true,
                    requiresSupervisor: true,
                });
                requiresSupervisorReview = true;
            }
        }
        if (!evvRecord.clockOutTime) {
            issues.push({
                issueType: 'MISSING_CLOCK_OUT',
                severity: 'HIGH',
                description: 'Visit has no clock-out time',
                canBeOverridden: true,
                requiresSupervisor: true,
            });
            requiresSupervisorReview = true;
        }
        if (evvRecord.pauseEvents && evvRecord.pauseEvents.length > 0) {
            const totalPauseTime = evvRecord.pauseEvents.reduce((sum, pause) => {
                return sum + (pause.duration || 0);
            }, 0);
            if (totalPauseTime > 120) {
                issues.push({
                    issueType: 'EXCESSIVE_PAUSE_TIME',
                    severity: 'MEDIUM',
                    description: `Total pause time (${totalPauseTime} minutes) is excessive`,
                    canBeOverridden: true,
                    requiresSupervisor: true,
                });
                complianceFlags.push('TIME_GAP');
                requiresSupervisorReview = true;
            }
        }
        let verificationLevel = 'FULL';
        if (issues.length > 0) {
            const hasCritical = issues.some(i => i.severity === 'CRITICAL');
            const hasHigh = issues.some(i => i.severity === 'HIGH');
            if (hasCritical) {
                verificationLevel = 'EXCEPTION';
            }
            else if (hasHigh) {
                verificationLevel = 'PARTIAL';
            }
        }
        if (complianceFlags.length > 1) {
            const index = complianceFlags.indexOf('COMPLIANT');
            if (index > -1) {
                complianceFlags.splice(index, 1);
            }
        }
        return {
            passed: issues.length === 0,
            verificationLevel,
            complianceFlags,
            issues,
            requiresSupervisorReview,
        };
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    computeHash(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
    computeChecksum(data) {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data.charCodeAt(i);
        }
        return sum.toString(16);
    }
}
exports.EVVValidator = EVVValidator;
//# sourceMappingURL=evv-validator.js.map