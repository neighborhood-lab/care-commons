import { UUID, Timestamp } from '@care-commons/core';
export type StateJurisdiction = 'TX' | 'FL' | 'OTHER';
export interface ServiceAuthorization {
    id: UUID;
    carePlanId: UUID;
    clientId: UUID;
    organizationId: UUID;
    stateJurisdiction: StateJurisdiction;
    authorizationType: string;
    authorizationNumber: string;
    payerName: string;
    payerId?: string;
    serviceCodes: string[];
    authorizedUnits: number;
    unitType: 'HOURS' | 'VISITS' | 'DAYS';
    ratePerUnit?: number;
    effectiveDate: Date;
    expirationDate: Date;
    unitsUsed: number;
    unitsRemaining: number;
    lastUsageDate?: Date;
    formNumber?: string;
    mcoId?: string;
    ahcaProviderNumber?: string;
    smmcPlanName?: string;
    status: AuthorizationStatus;
    notes?: string;
    stateSpecificData?: Record<string, unknown>;
    createdAt: Timestamp;
    createdBy: UUID;
    updatedAt: Timestamp;
    updatedBy: UUID;
    version: number;
}
export type AuthorizationStatus = 'PENDING' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'SUSPENDED' | 'TERMINATED';
export interface RNDelegation {
    id: UUID;
    carePlanId: UUID;
    clientId: UUID;
    organizationId: UUID;
    branchId?: UUID;
    delegatingRnId: UUID;
    delegatingRnName: string;
    delegatingRnLicense: string;
    delegatedToCaregiverId?: UUID;
    delegatedToCaregiverName: string;
    delegatedToCredentialType: string;
    delegatedToCredentialNumber?: string;
    taskCategory: string;
    taskDescription: string;
    specificSkillsDelegated: string[];
    limitations?: string[];
    trainingProvided: boolean;
    trainingDate?: Date;
    trainingMethod?: string;
    competencyEvaluated: boolean;
    competencyEvaluationDate?: Date;
    competencyEvaluatorId?: UUID;
    evaluationResult?: 'COMPETENT' | 'NEEDS_IMPROVEMENT' | 'NOT_COMPETENT' | 'PENDING';
    effectiveDate: Date;
    expirationDate?: Date;
    supervisionFrequency: string;
    lastSupervisionDate?: Date;
    nextSupervisionDue?: Date;
    status: DelegationStatus;
    revocationReason?: string;
    revokedBy?: UUID;
    revokedAt?: Timestamp;
    ahcaDelegationFormNumber?: string;
    stateSpecificData?: Record<string, unknown>;
    notes?: string;
    createdAt: Timestamp;
    createdBy: UUID;
    updatedAt: Timestamp;
    updatedBy: UUID;
    version: number;
}
export type DelegationStatus = 'PENDING_TRAINING' | 'PENDING_EVALUATION' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'EXPIRED';
export interface StateSpecificCarePlanData {
    stateJurisdiction?: StateJurisdiction;
    orderSource?: string;
    orderingProviderId?: UUID;
    orderingProviderName?: string;
    orderingProviderLicense?: string;
    orderingProviderNpi?: string;
    orderDate?: Timestamp;
    verbalOrderAuthenticatedBy?: UUID;
    verbalOrderAuthenticatedAt?: Timestamp;
    rnDelegationId?: UUID;
    rnSupervisorId?: UUID;
    rnSupervisorName?: string;
    rnSupervisorLicense?: string;
    lastSupervisoryVisitDate?: Date;
    nextSupervisoryVisitDue?: Date;
    planReviewIntervalDays?: number;
    nextReviewDue?: Date;
    lastReviewCompletedDate?: Date;
    lastReviewCompletedBy?: UUID;
    medicaidProgram?: string;
    medicaidWaiver?: string;
    serviceAuthorizationForm?: string;
    serviceAuthorizationUnits?: number;
    serviceAuthorizationPeriodStart?: Date;
    serviceAuthorizationPeriodEnd?: Date;
    isCdsModel?: boolean;
    employerAuthorityId?: UUID;
    financialManagementServiceId?: UUID;
    planOfCareFormNumber?: string;
    disasterPlanOnFile?: boolean;
    infectionControlPlanReviewed?: boolean;
    stateSpecificData?: Record<string, unknown>;
}
export interface StateSpecificTaskData {
    requiresSupervision?: boolean;
    supervisorReviewRequired?: boolean;
    supervisorReviewedBy?: UUID;
    supervisorReviewedAt?: Timestamp;
    delegationAuthorityId?: UUID;
    skillLevelRequired?: SkillLevel;
    stateSpecificData?: Record<string, unknown>;
}
export type SkillLevel = 'CAREGIVER' | 'CNA' | 'HHA' | 'LPN' | 'RN' | 'THERAPIST' | 'OTHER';
export interface StateComplianceValidation {
    isCompliant: boolean;
    errors: StateComplianceError[];
    warnings: StateComplianceWarning[];
    stateJurisdiction: StateJurisdiction;
}
export interface StateComplianceError {
    code: string;
    field: string;
    message: string;
    requirement: string;
    severity: 'BLOCKING' | 'CRITICAL';
}
export interface StateComplianceWarning {
    code: string;
    field: string;
    message: string;
    requirement: string;
    severity: 'WARNING' | 'INFO';
}
export interface TexasCarePlanRequirements {
    requiresPhysicianOrder: boolean;
    requiresRnAssessment: boolean;
    requiresEmergencyPlan: boolean;
    maxDaysBetweenReviews: number;
    requiredForms: string[];
    requiresServiceAuthorization: boolean;
    authorizationForm: string;
    isCdsModel: boolean;
    requiresEmployerAuthority?: boolean;
    requiresFmsProvider?: boolean;
}
export interface FloridaCarePlanRequirements {
    requiresPhysicianOrders: boolean;
    requiresComprehensiveAssessment: boolean;
    requiresRnSupervision: boolean;
    maxDaysBetweenReviews: number;
    maxDaysBetweenSupervisoryVisits: number;
    requiredForms: string[];
    requiresRnDelegation: boolean;
    requiresCompetencyEvaluation: boolean;
    requiresOngoingSupervision: boolean;
    minimumStaffingRatios?: Record<string, number>;
    requiredTraining: string[];
}
export interface CreateServiceAuthorizationInput {
    carePlanId: UUID;
    clientId: UUID;
    organizationId: UUID;
    stateJurisdiction: StateJurisdiction;
    authorizationType: string;
    authorizationNumber: string;
    payerName: string;
    payerId?: string;
    serviceCodes: string[];
    authorizedUnits: number;
    unitType: 'HOURS' | 'VISITS' | 'DAYS';
    ratePerUnit?: number;
    effectiveDate: Date;
    expirationDate: Date;
    formNumber?: string;
    mcoId?: string;
    ahcaProviderNumber?: string;
    smmcPlanName?: string;
    notes?: string;
    stateSpecificData?: Record<string, unknown>;
}
export interface CreateRNDelegationInput {
    carePlanId: UUID;
    clientId: UUID;
    organizationId: UUID;
    branchId?: UUID;
    delegatingRnId: UUID;
    delegatingRnName: string;
    delegatingRnLicense: string;
    delegatedToCaregiverId?: UUID;
    delegatedToCaregiverName: string;
    delegatedToCredentialType: string;
    delegatedToCredentialNumber?: string;
    taskCategory: string;
    taskDescription: string;
    specificSkillsDelegated: string[];
    limitations?: string[];
    trainingProvided: boolean;
    trainingDate?: Date;
    trainingMethod?: string;
    effectiveDate: Date;
    expirationDate?: Date;
    supervisionFrequency: string;
    ahcaDelegationFormNumber?: string;
    notes?: string;
}
export interface ServiceAuthorizationFilters {
    organizationId?: UUID;
    clientId?: UUID;
    carePlanId?: UUID;
    stateJurisdiction?: StateJurisdiction;
    status?: AuthorizationStatus[];
    expiringSoon?: boolean;
    payerName?: string;
    authorizationType?: string;
}
export interface RNDelegationFilters {
    organizationId?: UUID;
    clientId?: UUID;
    carePlanId?: UUID;
    delegatingRnId?: UUID;
    delegatedToCaregiverId?: UUID;
    status?: DelegationStatus[];
    taskCategory?: string;
    needsSupervision?: boolean;
    competencyPending?: boolean;
}
//# sourceMappingURL=state-specific.d.ts.map