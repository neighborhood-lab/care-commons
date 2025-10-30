"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateSpecificCaregiverValidator = void 0;
const zod_1 = require("zod");
const registryCheckSchema = zod_1.z.object({
    checkDate: zod_1.z.date(),
    expirationDate: zod_1.z.date(),
    status: zod_1.z.enum(['CLEAR', 'PENDING', 'LISTED', 'EXPIRED']),
    registryType: zod_1.z.enum(['EMPLOYEE_MISCONDUCT', 'NURSE_AIDE', 'OTHER']),
    confirmationNumber: zod_1.z.string().optional(),
    performedBy: zod_1.z.string().uuid(),
    documentPath: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    listingDetails: zod_1.z.object({
        listedDate: zod_1.z.date().optional(),
        violationType: zod_1.z.string().optional(),
        disposition: zod_1.z.string().optional(),
        ineligibleForHire: zod_1.z.boolean(),
    }).optional(),
}).refine((data) => data.expirationDate > data.checkDate, { message: 'Expiration date must be after check date' });
const texasMandatoryTrainingSchema = zod_1.z.object({
    abuseNeglectReporting: zod_1.z.boolean(),
    abuseNeglectReportingDate: zod_1.z.date().optional(),
    clientRights: zod_1.z.boolean(),
    clientRightsDate: zod_1.z.date().optional(),
    infectionControl: zod_1.z.boolean(),
    infectionControlDate: zod_1.z.date().optional(),
    emergencyProcedures: zod_1.z.boolean(),
    emergencyProceduresDate: zod_1.z.date().optional(),
    mandatedReporterTraining: zod_1.z.boolean(),
    mandatedReporterDate: zod_1.z.date().optional(),
});
const texasCaregiverDataSchema = zod_1.z.object({
    employeeMisconductRegistryCheck: registryCheckSchema.optional(),
    nurseAideRegistryCheck: registryCheckSchema.optional(),
    dpsFingerprinting: zod_1.z.any().optional(),
    tbScreening: zod_1.z.any().optional(),
    tbScreeningRequired: zod_1.z.boolean(),
    hhscOrientationComplete: zod_1.z.boolean(),
    hhscOrientationDate: zod_1.z.date().optional(),
    hhscOrientationTopics: zod_1.z.array(zod_1.z.string()).optional(),
    mandatoryTraining: texasMandatoryTrainingSchema.optional(),
    evvAttendantId: zod_1.z.string().optional(),
    evvSystemEnrolled: zod_1.z.boolean(),
    evvEnrollmentDate: zod_1.z.date().optional(),
    delegationRecords: zod_1.z.array(zod_1.z.any()).optional(),
    rnDelegationSupervisor: zod_1.z.string().uuid().optional(),
    eVerifyCompleted: zod_1.z.boolean(),
    eVerifyDate: zod_1.z.date().optional(),
    i9FormOnFile: zod_1.z.boolean(),
    i9ExpirationDate: zod_1.z.date().optional(),
    qualifiedForCDS: zod_1.z.boolean(),
    qualifiedForPAS: zod_1.z.boolean(),
    qualifiedForHAB: zod_1.z.boolean(),
    registryCheckStatus: zod_1.z.enum(['CLEAR', 'PENDING', 'FLAGGED', 'INELIGIBLE']),
    lastComplianceReview: zod_1.z.date().optional(),
    nextComplianceReview: zod_1.z.date().optional(),
});
const floridaBackgroundScreeningSchema = zod_1.z.object({
    screeningDate: zod_1.z.date(),
    screeningType: zod_1.z.enum(['INITIAL', 'FIVE_YEAR_RESCREEN', 'UPDATE']),
    clearanceDate: zod_1.z.date().optional(),
    expirationDate: zod_1.z.date(),
    status: zod_1.z.enum(['CLEARED', 'PENDING', 'CONDITIONAL', 'DISQUALIFIED']),
    clearinghouseId: zod_1.z.string().optional(),
    ahcaClearanceNumber: zod_1.z.string().optional(),
    exemptionGranted: zod_1.z.boolean().optional(),
    exemptionReason: zod_1.z.string().optional(),
    disqualifyingOffenses: zod_1.z.array(zod_1.z.any()).optional(),
    documentPath: zod_1.z.string().optional(),
}).refine((data) => data.expirationDate > data.screeningDate, { message: 'Expiration date must be after screening date' });
const floridaCaregiverDataSchema = zod_1.z.object({
    level2BackgroundScreening: floridaBackgroundScreeningSchema.optional(),
    ahcaClearinghouseId: zod_1.z.string().optional(),
    screeningStatus: zod_1.z.enum(['CLEARED', 'PENDING', 'CONDITIONAL', 'DISQUALIFIED']),
    flLicenseNumber: zod_1.z.string().optional(),
    flLicenseType: zod_1.z.enum(['RN', 'LPN', 'ARNP', 'CNA', 'HHA', 'PT', 'OT', 'ST', 'NONE']).optional(),
    flLicenseStatus: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED']).optional(),
    flLicenseExpiration: zod_1.z.date().optional(),
    mqaVerificationDate: zod_1.z.date().optional(),
    cnaRegistrationNumber: zod_1.z.string().optional(),
    hhaRegistrationNumber: zod_1.z.string().optional(),
    registrationExpiration: zod_1.z.date().optional(),
    requiresRNSupervision: zod_1.z.boolean(),
    assignedRNSupervisor: zod_1.z.string().uuid().optional(),
    supervisoryRelationship: zod_1.z.any().optional(),
    hivAidsTrainingComplete: zod_1.z.boolean(),
    hivAidsTrainingDate: zod_1.z.date().optional(),
    oshaBloodbornePathogenTraining: zod_1.z.date().optional(),
    tbScreening: zod_1.z.any().optional(),
    scopeOfPractice: zod_1.z.array(zod_1.z.string()).optional(),
    delegatedTasks: zod_1.z.array(zod_1.z.any()).optional(),
    rnDelegationAuthorization: zod_1.z.array(zod_1.z.any()).optional(),
    medicaidProviderId: zod_1.z.string().optional(),
    ahcaProviderId: zod_1.z.string().optional(),
    evvSystemIds: zod_1.z.array(zod_1.z.any()).optional(),
    hurricaneRedeploymentZone: zod_1.z.string().optional(),
    emergencyCredentialing: zod_1.z.array(zod_1.z.any()).optional(),
    ahcaComplianceStatus: zod_1.z.enum(['COMPLIANT', 'PENDING', 'NON_COMPLIANT']),
    lastAHCAVerification: zod_1.z.date().optional(),
    nextRescreenDue: zod_1.z.date().optional(),
});
const stateSpecificCaregiverDataSchema = zod_1.z.object({
    state: zod_1.z.enum(['TX', 'FL']),
    texas: texasCaregiverDataSchema.optional(),
    florida: floridaCaregiverDataSchema.optional(),
}).refine((data) => {
    if (data.state === 'TX') {
        return data.texas !== undefined;
    }
    if (data.state === 'FL') {
        return data.florida !== undefined;
    }
    return true;
}, { message: 'State-specific data must be provided for the selected state' });
class StateSpecificCaregiverValidator {
    validateStateSpecific(data) {
        try {
            stateSpecificCaregiverDataSchema.parse(data);
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
    validateTexasCaregiver(data, role) {
        try {
            texasCaregiverDataSchema.parse(data);
            const additionalErrors = [];
            if (this.isDirectCareRole(role)) {
                if (!data.employeeMisconductRegistryCheck) {
                    additionalErrors.push({
                        path: 'employeeMisconductRegistryCheck',
                        message: 'Employee Misconduct Registry check required for direct care roles (26 TAC §558)',
                    });
                }
                else if (data.employeeMisconductRegistryCheck.status === 'EXPIRED') {
                    additionalErrors.push({
                        path: 'employeeMisconductRegistryCheck',
                        message: 'Employee Misconduct Registry check expired',
                    });
                }
                else if (data.employeeMisconductRegistryCheck.listingDetails?.ineligibleForHire) {
                    additionalErrors.push({
                        path: 'employeeMisconductRegistryCheck',
                        message: 'Caregiver listed on Employee Misconduct Registry - ineligible for hire',
                    });
                }
            }
            if (role === 'CERTIFIED_NURSING_ASSISTANT') {
                if (!data.nurseAideRegistryCheck) {
                    additionalErrors.push({
                        path: 'nurseAideRegistryCheck',
                        message: 'Nurse Aide Registry check required for CNA role',
                    });
                }
                else if (data.nurseAideRegistryCheck.status === 'EXPIRED') {
                    additionalErrors.push({
                        path: 'nurseAideRegistryCheck',
                        message: 'Nurse Aide Registry check expired',
                    });
                }
            }
            if (!data.hhscOrientationComplete) {
                additionalErrors.push({
                    path: 'hhscOrientationComplete',
                    message: 'HHSC orientation required per 26 TAC §558.259',
                });
            }
            if (data.mandatoryTraining) {
                const training = data.mandatoryTraining;
                if (!training.abuseNeglectReporting) {
                    additionalErrors.push({
                        path: 'mandatoryTraining.abuseNeglectReporting',
                        message: 'Abuse/neglect reporting training required',
                    });
                }
                if (!training.clientRights) {
                    additionalErrors.push({
                        path: 'mandatoryTraining.clientRights',
                        message: 'Client rights training required',
                    });
                }
            }
            if (!data.eVerifyCompleted) {
                additionalErrors.push({
                    path: 'eVerifyCompleted',
                    message: 'E-Verify completion required',
                });
            }
            if (!data.i9FormOnFile) {
                additionalErrors.push({
                    path: 'i9FormOnFile',
                    message: 'I-9 form must be on file',
                });
            }
            if (data.tbScreeningRequired && !data.tbScreening) {
                additionalErrors.push({
                    path: 'tbScreening',
                    message: 'TB screening required per DSHS requirements',
                });
            }
            if (this.isDirectCareRole(role) && !data.evvSystemEnrolled) {
                additionalErrors.push({
                    path: 'evvSystemEnrolled',
                    message: 'EVV system enrollment required for direct care roles',
                });
            }
            if (data.registryCheckStatus === 'FLAGGED' || data.registryCheckStatus === 'INELIGIBLE') {
                additionalErrors.push({
                    path: 'registryCheckStatus',
                    message: `Registry check status is ${data.registryCheckStatus} - further review required`,
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
    validateFloridaCaregiver(data, role) {
        try {
            floridaCaregiverDataSchema.parse(data);
            const additionalErrors = [];
            if (this.isDirectCareRole(role)) {
                if (!data.level2BackgroundScreening) {
                    additionalErrors.push({
                        path: 'level2BackgroundScreening',
                        message: 'Level 2 background screening required (AHCA requirement)',
                    });
                }
                else {
                    const screening = data.level2BackgroundScreening;
                    if (screening.status === 'DISQUALIFIED') {
                        additionalErrors.push({
                            path: 'level2BackgroundScreening.status',
                            message: 'Caregiver disqualified from Level 2 background screening',
                        });
                    }
                    if (screening.status === 'PENDING') {
                        additionalErrors.push({
                            path: 'level2BackgroundScreening.status',
                            message: 'Level 2 background screening pending clearance',
                        });
                    }
                    if (screening.expirationDate < new Date()) {
                        additionalErrors.push({
                            path: 'level2BackgroundScreening.expirationDate',
                            message: 'Level 2 background screening expired - 5-year rescreen required',
                        });
                    }
                    const daysUntilExpiration = Math.floor((screening.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    if (daysUntilExpiration > 0 && daysUntilExpiration <= 90) {
                        additionalErrors.push({
                            path: 'level2BackgroundScreening.expirationDate',
                            message: `Level 2 background screening expiring in ${daysUntilExpiration} days - initiate rescreen`,
                        });
                    }
                }
            }
            if (this.requiresFloridaLicense(role)) {
                if (!data.flLicenseNumber) {
                    additionalErrors.push({
                        path: 'flLicenseNumber',
                        message: `Florida professional license required for ${role}`,
                    });
                }
                else {
                    if (data.flLicenseStatus === 'INACTIVE') {
                        additionalErrors.push({
                            path: 'flLicenseStatus',
                            message: `Florida license status is ${data.flLicenseStatus}`,
                        });
                    }
                    if (data.flLicenseStatus === 'SUSPENDED' || data.flLicenseStatus === 'REVOKED') {
                        additionalErrors.push({
                            path: 'flLicenseStatus',
                            message: `Florida license ${data.flLicenseStatus} - ineligible to practice`,
                        });
                    }
                    if (data.flLicenseExpiration && data.flLicenseExpiration < new Date()) {
                        additionalErrors.push({
                            path: 'flLicenseExpiration',
                            message: 'Florida professional license expired',
                        });
                    }
                }
            }
            if (role === 'CERTIFIED_NURSING_ASSISTANT' && !data.cnaRegistrationNumber) {
                additionalErrors.push({
                    path: 'cnaRegistrationNumber',
                    message: 'CNA registration number required (59A-8.0095)',
                });
            }
            if (role === 'HOME_HEALTH_AIDE' && !data.hhaRegistrationNumber) {
                additionalErrors.push({
                    path: 'hhaRegistrationNumber',
                    message: 'HHA registration number required (59A-8.0095)',
                });
            }
            if (data.requiresRNSupervision && !data.assignedRNSupervisor) {
                additionalErrors.push({
                    path: 'assignedRNSupervisor',
                    message: 'RN supervisor assignment required per 59A-8.0095',
                });
            }
            if (!data.hivAidsTrainingComplete) {
                additionalErrors.push({
                    path: 'hivAidsTrainingComplete',
                    message: 'HIV/AIDS training required per 59A-8.0095',
                });
            }
            if (!data.oshaBloodbornePathogenTraining) {
                additionalErrors.push({
                    path: 'oshaBloodbornePathogenTraining',
                    message: 'OSHA bloodborne pathogen training required',
                });
            }
            if (this.isDirectCareRole(role) && !data.medicaidProviderId) {
                additionalErrors.push({
                    path: 'medicaidProviderId',
                    message: 'Medicaid provider ID required for service billing',
                });
            }
            if (data.nextRescreenDue && data.nextRescreenDue < new Date()) {
                additionalErrors.push({
                    path: 'nextRescreenDue',
                    message: '5-year background rescreen overdue',
                });
            }
            if (data.ahcaComplianceStatus === 'NON_COMPLIANT') {
                additionalErrors.push({
                    path: 'ahcaComplianceStatus',
                    message: 'AHCA compliance status is non-compliant - resolve issues before assignment',
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
    validateCredentialCompliance(stateData, role) {
        const issues = [];
        if (stateData.state === 'TX' && stateData.texas) {
            const tx = stateData.texas;
            if (tx.registryCheckStatus === 'INELIGIBLE') {
                issues.push({
                    severity: 'CRITICAL',
                    message: 'Listed on registry - INELIGIBLE FOR HIRE',
                });
            }
            if (tx.employeeMisconductRegistryCheck?.listingDetails?.ineligibleForHire) {
                issues.push({
                    severity: 'CRITICAL',
                    message: 'Listed on Employee Misconduct Registry - cannot be assigned',
                });
            }
            if (!tx.hhscOrientationComplete) {
                issues.push({
                    severity: 'ERROR',
                    message: 'HHSC orientation not complete (26 TAC §558.259)',
                });
            }
            if (!tx.eVerifyCompleted || !tx.i9FormOnFile) {
                issues.push({
                    severity: 'ERROR',
                    message: 'E-Verify and I-9 requirements not complete',
                });
            }
            if (this.isDirectCareRole(role) && !tx.evvSystemEnrolled) {
                issues.push({
                    severity: 'ERROR',
                    message: 'Not enrolled in EVV system - required for direct care',
                });
            }
            if (tx.employeeMisconductRegistryCheck?.status === 'EXPIRED') {
                issues.push({
                    severity: 'WARNING',
                    message: 'Employee Misconduct Registry check expired - renewal needed',
                });
            }
            if (tx.nextComplianceReview && tx.nextComplianceReview < new Date()) {
                issues.push({
                    severity: 'WARNING',
                    message: 'Compliance review overdue',
                });
            }
        }
        else if (stateData.state === 'FL' && stateData.florida) {
            const fl = stateData.florida;
            if (fl.screeningStatus === 'DISQUALIFIED') {
                issues.push({
                    severity: 'CRITICAL',
                    message: 'Disqualified from Level 2 background screening - INELIGIBLE',
                });
            }
            if (fl.flLicenseStatus === 'REVOKED' || fl.flLicenseStatus === 'SUSPENDED') {
                issues.push({
                    severity: 'CRITICAL',
                    message: `Professional license ${fl.flLicenseStatus} - cannot practice`,
                });
            }
            if (fl.screeningStatus !== 'CLEARED') {
                issues.push({
                    severity: 'ERROR',
                    message: `Level 2 background screening status: ${fl.screeningStatus}`,
                });
            }
            if (!fl.hivAidsTrainingComplete) {
                issues.push({
                    severity: 'ERROR',
                    message: 'HIV/AIDS training not complete (59A-8.0095 requirement)',
                });
            }
            if (fl.requiresRNSupervision && !fl.assignedRNSupervisor) {
                issues.push({
                    severity: 'ERROR',
                    message: 'RN supervisor not assigned (59A-8.0095 requirement)',
                });
            }
            if (this.requiresFloridaLicense(role) && (!fl.flLicenseNumber || fl.flLicenseStatus !== 'ACTIVE')) {
                issues.push({
                    severity: 'ERROR',
                    message: 'Valid Florida professional license required',
                });
            }
            if (fl.nextRescreenDue && fl.nextRescreenDue < new Date()) {
                issues.push({
                    severity: 'WARNING',
                    message: '5-year background rescreen overdue',
                });
            }
            if (fl.level2BackgroundScreening) {
                const daysUntilExpiration = Math.floor((fl.level2BackgroundScreening.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (daysUntilExpiration > 0 && daysUntilExpiration <= 90) {
                    issues.push({
                        severity: 'WARNING',
                        message: `Level 2 screening expiring in ${daysUntilExpiration} days`,
                    });
                }
            }
            if (fl.ahcaComplianceStatus !== 'COMPLIANT') {
                issues.push({
                    severity: 'WARNING',
                    message: `AHCA compliance status: ${fl.ahcaComplianceStatus}`,
                });
            }
        }
        const hasCritical = issues.some((i) => i.severity === 'CRITICAL');
        const hasErrors = issues.some((i) => i.severity === 'ERROR');
        return {
            compliant: !hasErrors && !hasCritical,
            eligibleForAssignment: !hasCritical,
            issues,
        };
    }
    isDirectCareRole(role) {
        return [
            'CAREGIVER',
            'SENIOR_CAREGIVER',
            'CERTIFIED_NURSING_ASSISTANT',
            'HOME_HEALTH_AIDE',
            'PERSONAL_CARE_AIDE',
            'COMPANION',
            'NURSE_RN',
            'NURSE_LPN',
        ].includes(role);
    }
    requiresFloridaLicense(role) {
        return [
            'NURSE_RN',
            'NURSE_LPN',
            'THERAPIST',
            'CERTIFIED_NURSING_ASSISTANT',
        ].includes(role);
    }
}
exports.StateSpecificCaregiverValidator = StateSpecificCaregiverValidator;
//# sourceMappingURL=state-specific-validator.js.map