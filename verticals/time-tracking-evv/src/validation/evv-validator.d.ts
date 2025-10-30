import { ClockInInput, ClockOutInput, LocationVerificationInput, CreateGeofenceInput, GeofenceCheckResult, IntegrityCheckResult, VerificationResult, EVVRecord } from '../types/evv';
export declare class EVVValidator {
    validateClockIn(input: ClockInInput): void;
    validateClockOut(input: ClockOutInput): void;
    validateLocation(location: LocationVerificationInput, errors: string[]): void;
    validateDeviceInfo(deviceInfo: any, errors: string[]): void;
    validateGeofence(input: CreateGeofenceInput): void;
    checkGeofence(locationLat: number, locationLon: number, locationAccuracy: number, geofenceLat: number, geofenceLon: number, geofenceRadius: number, allowedVariance?: number): GeofenceCheckResult;
    verifyIntegrity(record: EVVRecord): IntegrityCheckResult;
    performVerification(evvRecord: EVVRecord, geofenceCheck: GeofenceCheckResult): VerificationResult;
    private calculateDistance;
    private computeHash;
    private computeChecksum;
}
//# sourceMappingURL=evv-validator.d.ts.map