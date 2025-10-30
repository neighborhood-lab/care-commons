"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateSpecificClientValidator = void 0;
const zod_1 = require("zod");
const texasAuthorizedServiceSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    serviceCode: zod_1.z.string().min(1, 'Service code required'),
    serviceName: zod_1.z.string().min(1, 'Service name required'),
    authorizedUnits: zod_1.z.number().nonnegative('Authorized units must be non-negative'),
    usedUnits: zod_1.z.number().nonnegative('Used units must be non-negative'),
    unitType: zod_1.z.enum(['HOURS', 'VISITS', 'DAYS']),
    authorizationNumber: zod_1.z.string().min(1, 'Authorization number required'),
    effectiveDate: zod_1.z.date(),
    expirationDate: zod_1.z.date(),
    status: zod_1.z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED']),
    requiresEVV: zod_1.z.boolean(),
}).refine((data) => data.usedUnits <= data.authorizedUnits, { message: 'Used units cannot exceed authorized units' }).refine((data) => data.expirationDate > data.effectiveDate, { message: 'Expiration date must be after effective date' });
const texasEVVRequirementsSchema = zod_1.z.object({
    evvMandatory: zod_1.z.boolean(),
    approvedClockMethods: zod_1.z.array(zod_1.z.enum(['MOBILE', 'TELEPHONY', 'FIXED'])).min(1),
    geoPerimeterRadius: zod_1.z.number().positive().optional(),
    aggregatorSubmissionRequired: zod_1.z.boolean(),
    tmhpIntegration: zod_1.z.boolean(),
});
const texasClientDataSchema = zod_1.z.object({
    medicaidMemberId: zod_1.z.string().optional(),
    medicaidProgram: zod_1.z.enum(['STAR', 'STAR_PLUS', 'STAR_KIDS', 'STAR_HEALTH', 'PHC', 'CFC']).optional(),
    hhscClientId: zod_1.z.string().optional(),
    serviceDeliveryOption: zod_1.z.enum(['AGENCY', 'CDS']).optional(),
    planOfCareNumber: zod_1.z.string().optional(),
    authorizedServices: zod_1.z.array(texasAuthorizedServiceSchema).default([]),
    currentAuthorization: zod_1.z.any().optional(),
    evvEntityId: zod_1.z.string().optional(),
    evvRequirements: texasEVVRequirementsSchema.optional(),
    emergencyPlanOnFile: zod_1.z.boolean(),
    emergencyPlanDate: zod_1.z.date().optional(),
    disasterEvacuationPlan: zod_1.z.string().optional(),
    form1746Consent: zod_1.z.any().optional(),
    biometricDataConsent: zod_1.z.any().optional(),
    releaseOfInformation: zod_1.z.array(zod_1.z.any()).optional(),
    acuityLevel: zod_1.z.enum(['LOW', 'MODERATE', 'HIGH', 'COMPLEX']).optional(),
    starPlusWaiverServices: zod_1.z.array(zod_1.z.string()).optional(),
});
const floridaAuthorizedServiceSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    serviceCode: zod_1.z.string().min(1, 'Service code required'),
    serviceName: zod_1.z.string().min(1, 'Service name required'),
    authorizedUnits: zod_1.z.number().nonnegative('Authorized units must be non-negative'),
    usedUnits: zod_1.z.number().nonnegative('Used units must be non-negative'),
    unitType: zod_1.z.enum(['HOURS', 'VISITS', 'DAYS']),
    authorizationNumber: zod_1.z.string().min(1, 'Authorization number required'),
    effectiveDate: zod_1.z.date(),
    expirationDate: zod_1.z.date(),
    visitFrequency: zod_1.z.string().optional(),
    status: zod_1.z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED']),
    requiresEVV: zod_1.z.boolean(),
    requiresRNSupervision: zod_1.z.boolean(),
}).refine((data) => data.usedUnits <= data.authorizedUnits, { message: 'Used units cannot exceed authorized units' }).refine((data) => data.expirationDate > data.effectiveDate, { message: 'Expiration date must be after effective date' });
const floridaClientDataSchema = zod_1.z.object({
    medicaidRecipientId: zod_1.z.string().optional(),
    managedCarePlan: zod_1.z.enum(['SMMC_LTC', 'SMMC_MMA', 'PACE', 'FFS']).optional(),
    apdWaiverEnrollment: zod_1.z.any().optional(),
    doeaRiskClassification: zod_1.z.enum(['LOW', 'MODERATE', 'HIGH']).optional(),
    planOfCareId: zod_1.z.string().optional(),
    planOfCareReviewDate: zod_1.z.date().optional(),
    nextReviewDue: zod_1.z.date().optional(),
    authorizedServices: zod_1.z.array(floridaAuthorizedServiceSchema).default([]),
    evvAggregatorId: zod_1.z.string().optional(),
    evvSystemType: zod_1.z.enum(['HHAX', 'NETSMART', 'OTHER']).optional(),
    smmcProgramEnrollment: zod_1.z.boolean().optional(),
    ltcProgramEnrollment: zod_1.z.boolean().optional(),
    rnSupervisorId: zod_1.z.string().optional(),
    lastSupervisoryVisit: zod_1.z.date().optional(),
    nextSupervisoryVisitDue: zod_1.z.date().optional(),
    supervisoryVisitFrequency: zod_1.z.number().positive().optional(),
    hurricaneZone: zod_1.z.string().optional(),
    biomedicalWasteExposure: zod_1.z.array(zod_1.z.any()).optional(),
    ahcaLicenseVerification: zod_1.z.date().optional(),
    backgroundScreeningStatus: zod_1.z.enum(['COMPLIANT', 'PENDING', 'NON_COMPLIANT']).optional(),
});
const stateSpecificClientDataSchema = zod_1.z.object({
    state: zod_1.z.enum(['TX', 'FL']),
    texas: texasClientDataSchema.optional(),
    florida: floridaClientDataSchema.optional(),
}).refine((data) => {
    if (data.state === 'TX') {
        return data.texas !== undefined;
    }
    if (data.state === 'FL') {
        return data.florida !== undefined;
    }
    return true;
}, { message: 'State-specific data must be provided for the selected state' });
class StateSpecificClientValidator {
    validateStateSpecific(data) {
        try {
            stateSpecificClientDataSchema.parse(data);
            return { success: true };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return {
                    success: false,
                    errors: error.issues.map((e) => ({
                        path: e.path.join('.'),
                        message: e.message,
                    })),
                };
            }
            return {
                success: false,
                errors: [{ path: 'unknown', message: 'Validation failed' }],
            };
        }
    }
    validateTexasClient(data) {
        try {
            texasClientDataSchema.parse(data);
            const additionalErrors = [];
            if (data.medicaidProgram === 'STAR_PLUS' && !data.emergencyPlanOnFile) {
                additionalErrors.push({
                    path: 'emergencyPlanOnFile',
                    message: 'Emergency plan required for STAR+PLUS program',
                });
            }
            if (data.evvRequirements?.evvMandatory && !data.evvEntityId) {
                additionalErrors.push({
                    path: 'evvEntityId',
                    message: 'EVV entity ID required when EVV is mandatory',
                });
            }
            const now = new Date();
            const hasExpiredAuth = data.authorizedServices.some((svc) => svc.status === 'ACTIVE' && svc.expirationDate < now);
            if (hasExpiredAuth) {
                additionalErrors.push({
                    path: 'authorizedServices',
                    message: 'One or more authorizations have expired and need renewal',
                });
            }
            if (additionalErrors.length > 0) {
                return { success: false, errors: additionalErrors };
            }
            return { success: true };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return {
                    success: false,
                    errors: error.issues.map((e) => ({
                        path: e.path.join('.'),
                        message: e.message,
                    })),
                };
            }
            return {
                success: false,
                errors: [{ path: 'unknown', message: 'Validation failed' }],
            };
        }
    }
    validateFloridaClient(data) {
        try {
            floridaClientDataSchema.parse(data);
            const additionalErrors = [];
            const requiresRNSupervision = data.authorizedServices.some((svc) => svc.status === 'ACTIVE' && svc.requiresRNSupervision);
            if (requiresRNSupervision && !data.rnSupervisorId) {
                additionalErrors.push({
                    path: 'rnSupervisorId',
                    message: 'RN supervisor required for services requiring supervision (59A-8.0095)',
                });
            }
            if (data.nextSupervisoryVisitDue && data.nextSupervisoryVisitDue < new Date()) {
                additionalErrors.push({
                    path: 'nextSupervisoryVisitDue',
                    message: 'Supervisory visit is overdue',
                });
            }
            if (data.nextReviewDue && data.nextReviewDue < new Date()) {
                additionalErrors.push({
                    path: 'nextReviewDue',
                    message: 'Plan of care review is overdue (Florida Statute 400.487)',
                });
            }
            if ((data.smmcProgramEnrollment || data.ltcProgramEnrollment) && !data.evvAggregatorId) {
                additionalErrors.push({
                    path: 'evvAggregatorId',
                    message: 'EVV aggregator ID required for SMMC/LTC programs',
                });
            }
            if (additionalErrors.length > 0) {
                return { success: false, errors: additionalErrors };
            }
            return { success: true };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return {
                    success: false,
                    errors: error.issues.map((e) => ({
                        path: e.path.join('.'),
                        message: e.message,
                    })),
                };
            }
            return {
                success: false,
                errors: [{ path: 'unknown', message: 'Validation failed' }],
            };
        }
    }
    validateEVVEligibility(stateData, serviceCode) {
        const reasons = [];
        if (stateData.state === 'TX' && stateData.texas) {
            const tx = stateData.texas;
            const service = tx.authorizedServices.find((s) => s.serviceCode === serviceCode);
            if (!service) {
                return { eligible: false, reasons: ['Service not found in authorized services'] };
            }
            if (!service.requiresEVV) {
                return { eligible: true, reasons: ['EVV not required for this service'] };
            }
            if (!tx.evvEntityId) {
                reasons.push('EVV entity ID not configured');
            }
            if (tx.evvRequirements?.aggregatorSubmissionRequired && !tx.evvRequirements.tmhpIntegration) {
                reasons.push('TMHP integration not configured for EVV aggregator submission');
            }
            if (service.status !== 'ACTIVE') {
                reasons.push(`Service authorization status is ${service.status}`);
            }
            if (service.usedUnits >= service.authorizedUnits) {
                reasons.push('Authorized units exhausted');
            }
            if (service.expirationDate < new Date()) {
                reasons.push('Service authorization expired');
            }
        }
        else if (stateData.state === 'FL' && stateData.florida) {
            const fl = stateData.florida;
            const service = fl.authorizedServices.find((s) => s.serviceCode === serviceCode);
            if (!service) {
                return { eligible: false, reasons: ['Service not found in authorized services'] };
            }
            if (!service.requiresEVV) {
                return { eligible: true, reasons: ['EVV not required for this service'] };
            }
            if (!fl.evvAggregatorId) {
                reasons.push('EVV aggregator not configured');
            }
            if (!fl.evvSystemType) {
                reasons.push('EVV system type not specified');
            }
            if (service.requiresRNSupervision && !fl.rnSupervisorId) {
                reasons.push('RN supervisor not assigned (required per 59A-8.0095)');
            }
            if (service.status !== 'ACTIVE') {
                reasons.push(`Service authorization status is ${service.status}`);
            }
            if (service.usedUnits >= service.authorizedUnits) {
                reasons.push('Authorized units exhausted');
            }
            if (service.expirationDate < new Date()) {
                reasons.push('Service authorization expired');
            }
        }
        return {
            eligible: reasons.length === 0,
            reasons: reasons.length === 0 ? ['Eligible for EVV service delivery'] : reasons,
        };
    }
    calculateComplianceStatus(stateData) {
        const issues = [];
        if (stateData.state === 'TX' && stateData.texas) {
            const tx = stateData.texas;
            if (!tx.emergencyPlanOnFile) {
                issues.push({
                    severity: 'ERROR',
                    message: 'Emergency plan not on file (26 TAC §558 requirement)',
                });
            }
            const expiredAuths = tx.authorizedServices.filter((s) => s.status === 'ACTIVE' && s.expirationDate < new Date());
            if (expiredAuths.length > 0) {
                issues.push({
                    severity: 'ERROR',
                    message: `${expiredAuths.length} service authorization(s) expired`,
                });
            }
            if (tx.emergencyPlanDate) {
                const daysSincePlan = Math.floor((Date.now() - tx.emergencyPlanDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSincePlan > 365) {
                    issues.push({
                        severity: 'WARNING',
                        message: 'Emergency plan over 1 year old, review recommended',
                    });
                }
            }
            const expiringSoon = tx.authorizedServices.filter((s) => {
                if (s.status !== 'ACTIVE')
                    return false;
                const daysUntilExpiration = Math.floor((s.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return daysUntilExpiration > 0 && daysUntilExpiration <= 30;
            });
            if (expiringSoon.length > 0) {
                issues.push({
                    severity: 'WARNING',
                    message: `${expiringSoon.length} service authorization(s) expiring within 30 days`,
                });
            }
        }
        else if (stateData.state === 'FL' && stateData.florida) {
            const fl = stateData.florida;
            if (fl.backgroundScreeningStatus === 'NON_COMPLIANT') {
                issues.push({
                    severity: 'ERROR',
                    message: 'Background screening non-compliant',
                });
            }
            if (fl.nextReviewDue && fl.nextReviewDue < new Date()) {
                issues.push({
                    severity: 'ERROR',
                    message: 'Plan of care review overdue (Florida Statute 400.487)',
                });
            }
            if (fl.nextSupervisoryVisitDue && fl.nextSupervisoryVisitDue < new Date()) {
                issues.push({
                    severity: 'ERROR',
                    message: 'RN supervisory visit overdue (59A-8.0095)',
                });
            }
            const expiredAuths = fl.authorizedServices.filter((s) => s.status === 'ACTIVE' && s.expirationDate < new Date());
            if (expiredAuths.length > 0) {
                issues.push({
                    severity: 'ERROR',
                    message: `${expiredAuths.length} service authorization(s) expired`,
                });
            }
            if (fl.backgroundScreeningStatus === 'PENDING') {
                issues.push({
                    severity: 'WARNING',
                    message: 'Background screening pending',
                });
            }
            if (fl.ahcaLicenseVerification) {
                const daysSinceVerification = Math.floor((Date.now() - fl.ahcaLicenseVerification.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceVerification > 365) {
                    issues.push({
                        severity: 'WARNING',
                        message: 'AHCA license verification over 1 year old',
                    });
                }
            }
        }
        const hasErrors = issues.some((issue) => issue.severity === 'ERROR');
        return {
            compliant: !hasErrors,
            issues,
        };
    }
}
exports.StateSpecificClientValidator = StateSpecificClientValidator;
//# sourceMappingURL=state-specific-validator.js.map