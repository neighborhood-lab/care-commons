"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVVAggregatorService = void 0;
const core_1 = require("@care-commons/core");
class EVVAggregatorService {
    constructor(configRepository, submissionRepository) {
        this.configRepository = configRepository;
        this.submissionRepository = submissionRepository;
    }
    async submitToAggregator(evvRecord) {
        this.validateEVVRecord(evvRecord);
        const stateCode = this.extractStateCode(evvRecord);
        const config = await this.configRepository.getStateConfig(evvRecord.organizationId, evvRecord.branchId, stateCode);
        if (!config) {
            throw new core_1.NotFoundError(`Aggregator configuration not found for state ${stateCode}`, {
                organizationId: evvRecord.organizationId,
                branchId: evvRecord.branchId,
                stateCode,
            });
        }
        if (config.state === 'TX') {
            return await this.submitToTexasAggregator(evvRecord, config);
        }
        else if (config.state === 'FL') {
            return await this.submitToFloridaAggregators(evvRecord, config);
        }
        throw new core_1.ValidationError(`Unsupported state code: ${stateCode}`);
    }
    async submitToTexasAggregator(evvRecord, config) {
        const payload = this.buildHHAeXchangePayload(evvRecord, 'TX');
        const submission = await this.submissionRepository.createSubmission({
            state: 'TX',
            evvRecordId: evvRecord.id,
            aggregatorId: config.aggregatorEntityId,
            aggregatorType: config.aggregatorType,
            submissionPayload: payload,
            submissionFormat: 'JSON',
            submittedAt: new Date(),
            submittedBy: evvRecord.recordedBy,
            submissionStatus: 'PENDING',
            retryCount: 0,
            maxRetries: 3,
        });
        try {
            const response = await this.sendToHHAeXchange(config.aggregatorSubmissionEndpoint, payload, config.aggregatorApiKey);
            if (response.success) {
                await this.submissionRepository.updateSubmission(submission.id, {
                    submissionStatus: 'ACCEPTED',
                    aggregatorResponse: response,
                    aggregatorConfirmationId: response.confirmationId,
                    aggregatorReceivedAt: new Date(),
                });
            }
            else {
                await this.submissionRepository.updateSubmission(submission.id, {
                    submissionStatus: response.requiresRetry ? 'RETRY' : 'REJECTED',
                    errorCode: response.errorCode,
                    errorMessage: response.errorMessage,
                    errorDetails: response,
                    retryCount: 0,
                    nextRetryAt: response.requiresRetry ? this.calculateNextRetry(0) : undefined,
                });
            }
        }
        catch (error) {
            await this.submissionRepository.updateSubmission(submission.id, {
                submissionStatus: 'RETRY',
                errorCode: 'NETWORK_ERROR',
                errorMessage: error.message,
                retryCount: 0,
                nextRetryAt: this.calculateNextRetry(0),
            });
        }
        return [submission];
    }
    async submitToFloridaAggregators(evvRecord, config) {
        const submissions = [];
        const aggregatorConfig = config.aggregators.find(agg => agg.id === config.defaultAggregator && agg.isActive);
        if (!aggregatorConfig) {
            throw new core_1.NotFoundError(`No active aggregator found for Florida`, { organizationId: evvRecord.organizationId });
        }
        const payload = this.buildHHAeXchangePayload(evvRecord, 'FL');
        const submission = await this.submissionRepository.createSubmission({
            state: 'FL',
            evvRecordId: evvRecord.id,
            aggregatorId: aggregatorConfig.id,
            aggregatorType: aggregatorConfig.type,
            submissionPayload: payload,
            submissionFormat: 'JSON',
            submittedAt: new Date(),
            submittedBy: evvRecord.recordedBy,
            submissionStatus: 'PENDING',
            retryCount: 0,
            maxRetries: 3,
        });
        try {
            const response = await this.sendToHHAeXchange(aggregatorConfig.endpoint, payload, aggregatorConfig.apiKey);
            if (response.success) {
                await this.submissionRepository.updateSubmission(submission.id, {
                    submissionStatus: 'ACCEPTED',
                    aggregatorResponse: response,
                    aggregatorConfirmationId: response.confirmationId,
                    aggregatorReceivedAt: new Date(),
                });
            }
            else {
                await this.submissionRepository.updateSubmission(submission.id, {
                    submissionStatus: response.requiresRetry ? 'RETRY' : 'REJECTED',
                    errorCode: response.errorCode,
                    errorMessage: response.errorMessage,
                    errorDetails: response,
                    retryCount: 0,
                    nextRetryAt: response.requiresRetry ? this.calculateNextRetry(0) : undefined,
                });
            }
        }
        catch (error) {
            await this.submissionRepository.updateSubmission(submission.id, {
                submissionStatus: 'RETRY',
                errorCode: 'NETWORK_ERROR',
                errorMessage: error.message,
                retryCount: 0,
                nextRetryAt: this.calculateNextRetry(0),
            });
        }
        submissions.push(submission);
        return submissions;
    }
    async retryPendingSubmissions() {
        const pending = await this.submissionRepository.getPendingRetries();
        for (const submission of pending) {
            if (submission.retryCount >= submission.maxRetries) {
                await this.submissionRepository.updateSubmission(submission.id, {
                    submissionStatus: 'REJECTED',
                    errorMessage: 'Max retries exceeded',
                });
                continue;
            }
        }
    }
    buildHHAeXchangePayload(evvRecord, stateCode) {
        return {
            visitId: evvRecord.visitId,
            memberId: evvRecord.clientMedicaidId || evvRecord.clientId,
            memberName: evvRecord.clientName,
            providerId: evvRecord.caregiverEmployeeId,
            providerName: evvRecord.caregiverName,
            serviceCode: evvRecord.serviceTypeCode,
            serviceDate: evvRecord.serviceDate.toISOString().split('T')[0],
            clockInTime: evvRecord.clockInTime.toISOString(),
            clockOutTime: evvRecord.clockOutTime?.toISOString(),
            clockInLatitude: evvRecord.clockInVerification.latitude,
            clockInLongitude: evvRecord.clockInVerification.longitude,
            clockOutLatitude: evvRecord.clockOutVerification?.latitude,
            clockOutLongitude: evvRecord.clockOutVerification?.longitude,
            clockMethod: evvRecord.clockInVerification.method,
            duration: evvRecord.totalDuration,
            verificationStatus: this.mapVerificationStatus(evvRecord),
        };
    }
    async sendToHHAeXchange(endpoint, _payload, _apiKey) {
        throw new Error('HHAeXchange integration not implemented. ' +
            'Production implementation must include proper HTTP client with ' +
            'authentication, SSL/TLS verification, retries, and logging. ' +
            `Endpoint: ${endpoint}`);
    }
    validateEVVRecord(evvRecord) {
        const errors = [];
        if (!evvRecord.clockInTime) {
            errors.push('clockInTime is required');
        }
        if (!evvRecord.clockOutTime) {
            errors.push('clockOutTime is required - record must be complete');
        }
        if (!evvRecord.clockInVerification) {
            errors.push('clockInVerification is required');
        }
        if (!evvRecord.clockOutVerification) {
            errors.push('clockOutVerification is required');
        }
        if (!evvRecord.clientMedicaidId && !evvRecord.clientId) {
            errors.push('clientMedicaidId or clientId is required');
        }
        if (!evvRecord.serviceTypeCode) {
            errors.push('serviceTypeCode is required');
        }
        if (errors.length > 0) {
            throw new core_1.ValidationError('EVV record incomplete for aggregator submission', { errors, evvRecordId: evvRecord.id });
        }
    }
    extractStateCode(evvRecord) {
        const stateAbbr = evvRecord.serviceAddress.state;
        if (stateAbbr === 'TX')
            return 'TX';
        if (stateAbbr === 'FL')
            return 'FL';
        throw new core_1.ValidationError(`Unsupported state for EVV aggregator: ${stateAbbr}`, { state: stateAbbr, evvRecordId: evvRecord.id });
    }
    mapVerificationStatus(evvRecord) {
        switch (evvRecord.verificationLevel) {
            case 'FULL':
                return 'VERIFIED';
            case 'PARTIAL':
                return 'PARTIAL';
            case 'MANUAL':
                return 'MANUAL_OVERRIDE';
            case 'EXCEPTION':
                return 'EXCEPTION';
            default:
                return 'UNKNOWN';
        }
    }
    calculateNextRetry(retryCount) {
        const delays = [60, 300, 1800];
        const delay = delays[Math.min(retryCount, delays.length - 1)];
        return new Date(Date.now() + delay * 1000);
    }
}
exports.EVVAggregatorService = EVVAggregatorService;
//# sourceMappingURL=evv-aggregator-service.js.map