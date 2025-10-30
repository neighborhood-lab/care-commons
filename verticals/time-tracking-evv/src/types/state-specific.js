"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStateEVVRules = getStateEVVRules;
exports.selectAggregator = selectAggregator;
function getStateEVVRules(state) {
    switch (state) {
        case 'TX':
            return {
                state: 'TX',
                geoFenceRadius: 100,
                geoFenceTolerance: 50,
                geoFenceToleranceReason: 'HHSC EVV Policy allows tolerance for GPS accuracy',
                maxClockInEarlyMinutes: 10,
                maxClockOutLateMinutes: 10,
                overtimeThresholdMinutes: 15,
                minimumGPSAccuracy: 100,
                requiresBiometric: false,
                requiresPhoto: false,
                requiresClientAttestation: false,
                allowManualOverride: true,
                manualOverrideRequiresSupervisor: true,
                manualOverrideReasonCodesRequired: [
                    'DEVICE_MALFUNCTION',
                    'GPS_UNAVAILABLE',
                    'SERVICE_LOCATION_CHANGE',
                    'EMERGENCY',
                    'RURAL_POOR_SIGNAL',
                    'OTHER_APPROVED',
                ],
                retentionYears: 6,
                immutableAfterDays: 30,
            };
        case 'FL':
            return {
                state: 'FL',
                geoFenceRadius: 150,
                geoFenceTolerance: 100,
                geoFenceToleranceReason: 'AHCA allows larger tolerance for diverse geography',
                maxClockInEarlyMinutes: 15,
                maxClockOutLateMinutes: 15,
                overtimeThresholdMinutes: 20,
                minimumGPSAccuracy: 150,
                requiresBiometric: false,
                requiresPhoto: false,
                requiresClientAttestation: false,
                allowManualOverride: true,
                manualOverrideRequiresSupervisor: true,
                manualOverrideReasonCodesRequired: [
                    'GPS_UNAVAILABLE',
                    'DEVICE_MALFUNCTION',
                    'CLIENT_LOCATION_CHANGE',
                    'EMERGENCY',
                    'TECHNICAL_ISSUE',
                    'OTHER',
                ],
                retentionYears: 6,
                immutableAfterDays: 45,
            };
        default:
            throw new Error(`Unsupported state: ${state}`);
    }
}
function selectAggregator(state, config, payerId, mcoId) {
    if (state === 'TX') {
        return config.aggregatorEntityId;
    }
    if (state === 'FL') {
        const flConfig = config;
        if (payerId || mcoId) {
            const matchedAgg = flConfig.aggregators.find(agg => agg.isActive &&
                (payerId && agg.assignedPayers.includes(payerId) ||
                    mcoId && agg.assignedMCOs.includes(mcoId)));
            if (matchedAgg) {
                return matchedAgg.id;
            }
        }
        return flConfig.defaultAggregator;
    }
    throw new Error(`Unsupported state: ${state}`);
}
//# sourceMappingURL=state-specific.js.map