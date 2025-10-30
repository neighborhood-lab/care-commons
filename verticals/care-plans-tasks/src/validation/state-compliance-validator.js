"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateComplianceValidator = void 0;
class StateComplianceValidator {
    static validateCarePlanCompliance(carePlan, stateJurisdiction) {
        const errors = [];
        const warnings = [];
        if (stateJurisdiction === 'TX') {
            this.validateTexasRequirements(carePlan, errors, warnings);
        }
        else if (stateJurisdiction === 'FL') {
            this.validateFloridaRequirements(carePlan, errors, warnings);
        }
        return {
            isCompliant: errors.filter((e) => e.severity === 'BLOCKING').length === 0,
            errors,
            warnings,
            stateJurisdiction,
        };
    }
    static validateTexasRequirements(carePlan, errors, warnings) {
        if (!carePlan.orderingProviderName || !carePlan.orderDate) {
            errors.push({
                code: 'TX_MISSING_PHYSICIAN_ORDER',
                field: 'orderingProviderName',
                message: 'Plan of care must be ordered by physician or authorized professional',
                requirement: '26 TAC §558.287',
                severity: 'BLOCKING',
            });
        }
        if (carePlan.orderingProviderName && !carePlan.orderingProviderLicense) {
            errors.push({
                code: 'TX_MISSING_PROVIDER_LICENSE',
                field: 'orderingProviderLicense',
                message: 'Ordering provider license number is required',
                requirement: '26 TAC §558.287',
                severity: 'BLOCKING',
            });
        }
        if (carePlan.orderSource === 'VERBAL' && !carePlan.verbalOrderAuthenticatedAt) {
            errors.push({
                code: 'TX_VERBAL_ORDER_NOT_AUTHENTICATED',
                field: 'verbalOrderAuthenticatedAt',
                message: 'Verbal orders must be authenticated by physician within required timeframe',
                requirement: '26 TAC §558.287',
                severity: 'CRITICAL',
            });
        }
        if (carePlan.medicaidProgram && !carePlan.serviceAuthorizationForm) {
            errors.push({
                code: 'TX_MISSING_SERVICE_AUTHORIZATION',
                field: 'serviceAuthorizationForm',
                message: 'Service authorization (HHSC Form 4100 series) required for Medicaid services',
                requirement: 'HHSC Medicaid Provider Agreement',
                severity: 'BLOCKING',
            });
        }
        const reviewIntervalDays = carePlan.planReviewIntervalDays || 60;
        if (reviewIntervalDays > 60) {
            warnings.push({
                code: 'TX_REVIEW_INTERVAL_EXCEEDS_STANDARD',
                field: 'planReviewIntervalDays',
                message: 'Plan review interval exceeds standard 60-day requirement',
                requirement: '26 TAC §558.287',
                severity: 'WARNING',
            });
        }
        if (carePlan.status === 'ACTIVE' && !carePlan.nextReviewDue) {
            warnings.push({
                code: 'TX_MISSING_NEXT_REVIEW_DATE',
                field: 'nextReviewDue',
                message: 'Next review due date should be established for active plans',
                requirement: '26 TAC §558.287',
                severity: 'WARNING',
            });
        }
        if (!carePlan.disasterPlanOnFile) {
            warnings.push({
                code: 'TX_MISSING_DISASTER_PLAN',
                field: 'disasterPlanOnFile',
                message: 'Emergency preparedness plan should be documented',
                requirement: '26 TAC §558 Emergency Preparedness',
                severity: 'WARNING',
            });
        }
        if (carePlan.isCdsModel) {
            if (!carePlan.employerAuthorityId) {
                errors.push({
                    code: 'TX_CDS_MISSING_EMPLOYER_AUTHORITY',
                    field: 'employerAuthorityId',
                    message: 'Consumer Directed Services requires documented employer authority',
                    requirement: 'HHSC CDS Program Requirements',
                    severity: 'BLOCKING',
                });
            }
            if (!carePlan.financialManagementServiceId) {
                errors.push({
                    code: 'TX_CDS_MISSING_FMS',
                    field: 'financialManagementServiceId',
                    message: 'Consumer Directed Services requires Financial Management Service provider',
                    requirement: 'HHSC CDS Program Requirements',
                    severity: 'BLOCKING',
                });
            }
        }
        if (!carePlan.goals || carePlan.goals.length === 0) {
            errors.push({
                code: 'TX_MISSING_GOALS',
                field: 'goals',
                message: 'Care plan must include measurable goals',
                requirement: '26 TAC §558.287',
                severity: 'BLOCKING',
            });
        }
        if (!carePlan.interventions || carePlan.interventions.length === 0) {
            errors.push({
                code: 'TX_MISSING_INTERVENTIONS',
                field: 'interventions',
                message: 'Care plan must include specific interventions',
                requirement: '26 TAC §558.287',
                severity: 'BLOCKING',
            });
        }
    }
    static validateFloridaRequirements(carePlan, errors, warnings) {
        if (!carePlan.orderingProviderName || !carePlan.orderDate) {
            errors.push({
                code: 'FL_MISSING_PHYSICIAN_ORDERS',
                field: 'orderingProviderName',
                message: 'Physician orders required for home health services',
                requirement: 'Florida Statute 400.487',
                severity: 'BLOCKING',
            });
        }
        const requiresRnSupervision = ['SKILLED_NURSING', 'THERAPY'].includes(carePlan.planType);
        if (requiresRnSupervision && !carePlan.rnSupervisorId) {
            errors.push({
                code: 'FL_MISSING_RN_SUPERVISOR',
                field: 'rnSupervisorId',
                message: 'RN supervisor required for skilled nursing and therapy services',
                requirement: 'AHCA 59A-8.0095',
                severity: 'BLOCKING',
            });
        }
        if (requiresRnSupervision && carePlan.status === 'ACTIVE') {
            if (!carePlan.lastSupervisoryVisitDate) {
                warnings.push({
                    code: 'FL_MISSING_SUPERVISORY_VISIT_DATE',
                    field: 'lastSupervisoryVisitDate',
                    message: 'RN supervisory visit date should be documented for active plans',
                    requirement: 'AHCA 59A-8.0095',
                    severity: 'WARNING',
                });
            }
            if (!carePlan.nextSupervisoryVisitDue) {
                warnings.push({
                    code: 'FL_MISSING_NEXT_SUPERVISORY_VISIT',
                    field: 'nextSupervisoryVisitDue',
                    message: 'Next RN supervisory visit due date should be established',
                    requirement: 'AHCA 59A-8.0095',
                    severity: 'WARNING',
                });
            }
            if (carePlan.nextSupervisoryVisitDue &&
                new Date(carePlan.nextSupervisoryVisitDue) < new Date()) {
                errors.push({
                    code: 'FL_SUPERVISORY_VISIT_OVERDUE',
                    field: 'nextSupervisoryVisitDue',
                    message: 'RN supervisory visit is overdue',
                    requirement: 'AHCA 59A-8.0095',
                    severity: 'CRITICAL',
                });
            }
        }
        const hasDelegatedTasks = carePlan.interventions?.some((intervention) => ['MEDICATION_ADMINISTRATION', 'WOUND_CARE', 'VITAL_SIGNS_MONITORING'].includes(intervention.category));
        if (hasDelegatedTasks && !carePlan.rnDelegationId) {
            errors.push({
                code: 'FL_MISSING_RN_DELEGATION',
                field: 'rnDelegationId',
                message: 'RN delegation required for nursing tasks performed by non-licensed personnel',
                requirement: 'AHCA 59A-8.0216',
                severity: 'BLOCKING',
            });
        }
        const reviewIntervalDays = carePlan.planReviewIntervalDays || 60;
        if (reviewIntervalDays > 60) {
            warnings.push({
                code: 'FL_REVIEW_INTERVAL_EXCEEDS_STANDARD',
                field: 'planReviewIntervalDays',
                message: 'Plan review interval exceeds standard 60-day requirement',
                requirement: 'AHCA 59A-8.0215',
                severity: 'WARNING',
            });
        }
        if (!carePlan.assessmentSummary || carePlan.assessmentSummary.trim().length < 50) {
            errors.push({
                code: 'FL_INCOMPLETE_ASSESSMENT',
                field: 'assessmentSummary',
                message: 'Comprehensive assessment summary required',
                requirement: 'AHCA 59A-8.0215',
                severity: 'BLOCKING',
            });
        }
        if (!carePlan.goals || carePlan.goals.length === 0) {
            errors.push({
                code: 'FL_MISSING_GOALS',
                field: 'goals',
                message: 'Care plan must include specific, measurable goals',
                requirement: 'AHCA 59A-8.0215',
                severity: 'BLOCKING',
            });
        }
        if (!carePlan.interventions || carePlan.interventions.length === 0) {
            errors.push({
                code: 'FL_MISSING_INTERVENTIONS',
                field: 'interventions',
                message: 'Care plan must include planned interventions',
                requirement: 'AHCA 59A-8.0215',
                severity: 'BLOCKING',
            });
        }
        if (!carePlan.planOfCareFormNumber) {
            warnings.push({
                code: 'FL_MISSING_FORM_NUMBER',
                field: 'planOfCareFormNumber',
                message: 'AHCA Form 484 or equivalent plan of care form number should be documented',
                requirement: 'AHCA 59A-8.0215',
                severity: 'WARNING',
            });
        }
        if (!carePlan.infectionControlPlanReviewed) {
            warnings.push({
                code: 'FL_INFECTION_CONTROL_NOT_REVIEWED',
                field: 'infectionControlPlanReviewed',
                message: 'Infection control plan review should be documented',
                requirement: 'AHCA 59A-8',
                severity: 'INFO',
            });
        }
    }
    static validateActivation(carePlan, stateJurisdiction) {
        const errors = [];
        const warnings = [];
        const jurisdiction = stateJurisdiction || carePlan.stateJurisdiction || 'OTHER';
        const stateValidation = this.validateCarePlanCompliance(carePlan, jurisdiction);
        errors.push(...stateValidation.errors);
        warnings.push(...stateValidation.warnings);
        if (!carePlan.coordinatorId) {
            errors.push({
                code: 'MISSING_COORDINATOR',
                field: 'coordinatorId',
                message: 'Care coordinator must be assigned before activation',
                requirement: 'General Requirement',
                severity: 'BLOCKING',
            });
        }
        if (!carePlan.effectiveDate) {
            errors.push({
                code: 'MISSING_EFFECTIVE_DATE',
                field: 'effectiveDate',
                message: 'Effective date must be set before activation',
                requirement: 'General Requirement',
                severity: 'BLOCKING',
            });
        }
        if (carePlan.effectiveDate && carePlan.effectiveDate > new Date()) {
            errors.push({
                code: 'FUTURE_EFFECTIVE_DATE',
                field: 'effectiveDate',
                message: 'Cannot activate plan with future effective date',
                requirement: 'General Requirement',
                severity: 'BLOCKING',
            });
        }
        return {
            isCompliant: errors.filter((e) => e.severity === 'BLOCKING').length === 0,
            errors,
            warnings,
            stateJurisdiction: jurisdiction,
        };
    }
    static getTexasRequirements() {
        return {
            requiresPhysicianOrder: true,
            requiresRnAssessment: true,
            requiresEmergencyPlan: true,
            maxDaysBetweenReviews: 60,
            requiredForms: ['Form 485', 'HHSC Form 1746', 'HHSC Form 8606'],
            requiresServiceAuthorization: true,
            authorizationForm: 'HHSC Form 4100 series',
            isCdsModel: false,
        };
    }
    static getFloridaRequirements() {
        return {
            requiresPhysicianOrders: true,
            requiresComprehensiveAssessment: true,
            requiresRnSupervision: true,
            maxDaysBetweenReviews: 60,
            maxDaysBetweenSupervisoryVisits: 30,
            requiredForms: ['AHCA Form 484', 'AHCA Form 1823'],
            requiresRnDelegation: true,
            requiresCompetencyEvaluation: true,
            requiresOngoingSupervision: true,
            minimumStaffingRatios: {
                RN: 1,
                LPN: 0,
                HHA: 2,
            },
            requiredTraining: [
                'OSHA Bloodborne Pathogens',
                'TB Screening',
                'HIV/AIDS (4 hours)',
                'Infection Control',
                'Client Rights',
            ],
        };
    }
}
exports.StateComplianceValidator = StateComplianceValidator;
//# sourceMappingURL=state-compliance-validator.js.map