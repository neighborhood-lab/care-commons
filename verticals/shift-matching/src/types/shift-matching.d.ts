import { Entity, SoftDeletable, UUID, Timestamp } from '@care-commons/core';
export interface OpenShift extends Entity {
    organizationId: UUID;
    branchId: UUID;
    visitId: UUID;
    clientId: UUID;
    scheduledDate: Date;
    startTime: string;
    endTime: string;
    duration: number;
    timezone: string;
    serviceTypeId: UUID;
    serviceTypeName: string;
    taskIds?: UUID[];
    requiredSkills?: string[];
    requiredCertifications?: string[];
    preferredCaregivers?: UUID[];
    blockedCaregivers?: UUID[];
    genderPreference?: 'MALE' | 'FEMALE' | 'NO_PREFERENCE';
    languagePreference?: string;
    address: ShiftAddress;
    latitude?: number;
    longitude?: number;
    priority: ShiftPriority;
    isUrgent: boolean;
    fillByDate?: Timestamp;
    matchingStatus: MatchingStatus;
    lastMatchedAt?: Timestamp;
    matchAttempts: number;
    proposedAssignments?: UUID[];
    rejectedCaregivers?: UUID[];
    clientInstructions?: string;
    internalNotes?: string;
    tags?: string[];
}
export type ShiftPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type MatchingStatus = 'NEW' | 'MATCHING' | 'MATCHED' | 'PROPOSED' | 'ASSIGNED' | 'NO_MATCH' | 'EXPIRED';
export interface ShiftAddress {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    accessInstructions?: string;
}
export interface MatchCandidate {
    caregiverId: UUID;
    openShiftId: UUID;
    caregiverName: string;
    caregiverPhone: string;
    employmentType: string;
    overallScore: number;
    matchQuality: MatchQuality;
    scores: MatchScores;
    isEligible: boolean;
    eligibilityIssues: EligibilityIssue[];
    warnings: string[];
    distanceFromShift?: number;
    estimatedTravelTime?: number;
    hasConflict: boolean;
    conflictingVisits?: ConflictingVisit[];
    availableHours: number;
    previousVisitsWithClient?: number;
    clientRating?: number;
    reliabilityScore?: number;
    matchReasons: MatchReason[];
    computedAt: Timestamp;
}
export type MatchQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'INELIGIBLE';
export interface MatchScores {
    skillMatch: number;
    availabilityMatch: number;
    proximityMatch: number;
    preferenceMatch: number;
    experienceMatch: number;
    reliabilityMatch: number;
    complianceMatch: number;
    capacityMatch: number;
}
export interface EligibilityIssue {
    type: EligibilityIssueType;
    severity: 'BLOCKING' | 'WARNING';
    message: string;
    field?: string;
}
export type EligibilityIssueType = 'MISSING_SKILL' | 'MISSING_CERTIFICATION' | 'EXPIRED_CREDENTIAL' | 'SCHEDULE_CONFLICT' | 'BLOCKED_BY_CLIENT' | 'DISTANCE_TOO_FAR' | 'OVER_HOUR_LIMIT' | 'UNAVAILABLE' | 'NOT_COMPLIANT' | 'GENDER_MISMATCH' | 'LANGUAGE_MISMATCH';
export interface ConflictingVisit {
    visitId: UUID;
    clientName: string;
    startTime: string;
    endTime: string;
    includesTravel: boolean;
}
export interface MatchReason {
    category: MatchReasonCategory;
    description: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    weight: number;
}
export type MatchReasonCategory = 'SKILL' | 'EXPERIENCE' | 'PREFERENCE' | 'AVAILABILITY' | 'PROXIMITY' | 'RELIABILITY' | 'CLIENT_REQUEST' | 'SYSTEM_OPTIMIZED';
export interface AssignmentProposal extends Entity, SoftDeletable {
    organizationId: UUID;
    branchId: UUID;
    openShiftId: UUID;
    visitId: UUID;
    caregiverId: UUID;
    matchScore: number;
    matchQuality: MatchQuality;
    matchReasons: MatchReason[];
    proposalStatus: ProposalStatus;
    proposedBy: UUID;
    proposedAt: Timestamp;
    proposalMethod: 'AUTOMATIC' | 'MANUAL' | 'CAREGIVER_SELF_SELECT';
    sentToCaregiver: boolean;
    sentAt?: Timestamp;
    notificationMethod?: NotificationMethod;
    viewedByCaregiver: boolean;
    viewedAt?: Timestamp;
    respondedAt?: Timestamp;
    responseMethod?: 'MOBILE' | 'WEB' | 'PHONE' | 'IN_PERSON';
    acceptedAt?: Timestamp;
    acceptedBy?: UUID;
    rejectedAt?: Timestamp;
    rejectedBy?: UUID;
    rejectionReason?: string;
    rejectionCategory?: RejectionCategory;
    expiredAt?: Timestamp;
    isPreferred: boolean;
    urgencyFlag: boolean;
    notes?: string;
    internalNotes?: string;
}
export type ProposalStatus = 'PENDING' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'SUPERSEDED' | 'WITHDRAWN';
export type NotificationMethod = 'PUSH' | 'SMS' | 'EMAIL' | 'PHONE_CALL' | 'IN_APP';
export type RejectionCategory = 'TOO_FAR' | 'TIME_CONFLICT' | 'PERSONAL_REASON' | 'PREFER_DIFFERENT_CLIENT' | 'RATE_TOO_LOW' | 'ALREADY_BOOKED' | 'NOT_INTERESTED' | 'OTHER';
export interface MatchingConfiguration extends Entity {
    organizationId: UUID;
    branchId?: UUID;
    name: string;
    description?: string;
    weights: MatchWeights;
    maxTravelDistance?: number;
    maxTravelTime?: number;
    requireExactSkillMatch: boolean;
    requireActiveCertifications: boolean;
    respectGenderPreference: boolean;
    respectLanguagePreference: boolean;
    autoAssignThreshold?: number;
    minScoreForProposal: number;
    maxProposalsPerShift: number;
    proposalExpirationMinutes: number;
    optimizeFor: OptimizationGoal;
    considerCostEfficiency: boolean;
    balanceWorkloadAcrossCaregivers: boolean;
    prioritizeContinuityOfCare: boolean;
    preferSameCaregiverForRecurring: boolean;
    penalizeFrequentRejections: boolean;
    boostReliablePerformers: boolean;
    isActive: boolean;
    isDefault: boolean;
    notes?: string;
}
export interface MatchWeights {
    skillMatch: number;
    availabilityMatch: number;
    proximityMatch: number;
    preferenceMatch: number;
    experienceMatch: number;
    reliabilityMatch: number;
    complianceMatch: number;
    capacityMatch: number;
}
export type OptimizationGoal = 'BEST_MATCH' | 'FASTEST_FILL' | 'COST_EFFICIENT' | 'BALANCED_WORKLOAD' | 'CONTINUITY' | 'CAREGIVER_SATISFACTION';
export interface BulkMatchRequest extends Entity {
    organizationId: UUID;
    branchId?: UUID;
    dateFrom: Date;
    dateTo: Date;
    openShiftIds?: UUID[];
    configurationId?: UUID;
    optimizationGoal?: OptimizationGoal;
    requestedBy: UUID;
    requestedAt: Timestamp;
    status: BulkMatchStatus;
    startedAt?: Timestamp;
    completedAt?: Timestamp;
    totalShifts: number;
    matchedShifts: number;
    unmatchedShifts: number;
    proposalsGenerated: number;
    errorMessage?: string;
    notes?: string;
}
export type BulkMatchStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export interface MatchHistory extends Entity {
    openShiftId: UUID;
    visitId: UUID;
    caregiverId?: UUID;
    attemptNumber: number;
    matchedAt: Timestamp;
    matchedBy?: UUID;
    matchScore?: number;
    matchQuality?: MatchQuality;
    outcome: MatchOutcome;
    outcomeDeterminedAt?: Timestamp;
    assignmentProposalId?: UUID;
    assignedSuccessfully: boolean;
    rejectionReason?: string;
    configurationId?: UUID;
    configurationSnapshot?: Partial<MatchingConfiguration>;
    responseTimeMinutes?: number;
    notes?: string;
}
export type MatchOutcome = 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'SUPERSEDED' | 'NO_CANDIDATES' | 'MANUAL_OVERRIDE';
export interface CaregiverPreferenceProfile {
    id: UUID;
    caregiverId: UUID;
    organizationId: UUID;
    preferredDaysOfWeek?: string[];
    preferredTimeRanges?: TimeRange[];
    preferredShiftTypes?: string[];
    preferredClientIds?: UUID[];
    preferredClientTypes?: string[];
    preferredServiceTypes?: UUID[];
    maxTravelDistance?: number;
    preferredZipCodes?: string[];
    avoidZipCodes?: string[];
    maxShiftsPerDay?: number;
    maxShiftsPerWeek?: number;
    maxHoursPerWeek?: number;
    requireMinimumHoursBetweenShifts?: number;
    willingToAcceptUrgentShifts: boolean;
    willingToWorkWeekends: boolean;
    willingToWorkHolidays: boolean;
    acceptAutoAssignment: boolean;
    notificationMethods: NotificationMethod[];
    quietHoursStart?: string;
    quietHoursEnd?: string;
    lastUpdated: Timestamp;
    updatedBy: UUID;
    createdAt: Timestamp;
    createdBy: UUID;
    version: number;
}
export interface TimeRange {
    startTime: string;
    endTime: string;
}
export interface CreateOpenShiftInput {
    visitId: UUID;
    priority?: ShiftPriority;
    fillByDate?: Timestamp;
    internalNotes?: string;
}
export interface MatchShiftInput {
    openShiftId: UUID;
    configurationId?: UUID;
    maxCandidates?: number;
    autoPropose?: boolean;
}
export interface CreateProposalInput {
    openShiftId: UUID;
    caregiverId: UUID;
    proposalMethod: 'AUTOMATIC' | 'MANUAL' | 'CAREGIVER_SELF_SELECT';
    sendNotification?: boolean;
    notificationMethod?: NotificationMethod;
    urgencyFlag?: boolean;
    notes?: string;
}
export interface RespondToProposalInput {
    proposalId: UUID;
    accept: boolean;
    rejectionReason?: string;
    rejectionCategory?: RejectionCategory;
    responseMethod?: 'MOBILE' | 'WEB' | 'PHONE' | 'IN_PERSON';
    notes?: string;
}
export interface CreateBulkMatchInput {
    organizationId: UUID;
    branchId?: UUID;
    dateFrom: Date;
    dateTo: Date;
    openShiftIds?: UUID[];
    configurationId?: UUID;
    optimizationGoal?: OptimizationGoal;
    autoPropose?: boolean;
    notes?: string;
}
export interface UpdateMatchingConfigurationInput {
    name?: string;
    description?: string;
    weights?: Partial<MatchWeights>;
    maxTravelDistance?: number;
    requireExactSkillMatch?: boolean;
    autoAssignThreshold?: number;
    minScoreForProposal?: number;
    maxProposalsPerShift?: number;
    proposalExpirationMinutes?: number;
    optimizeFor?: OptimizationGoal;
    isActive?: boolean;
    isDefault?: boolean;
    notes?: string;
}
export interface UpdateCaregiverPreferencesInput {
    preferredDaysOfWeek?: string[];
    preferredTimeRanges?: TimeRange[];
    maxTravelDistance?: number;
    maxShiftsPerWeek?: number;
    maxHoursPerWeek?: number;
    willingToAcceptUrgentShifts?: boolean;
    willingToWorkWeekends?: boolean;
    willingToWorkHolidays?: boolean;
    acceptAutoAssignment?: boolean;
    notificationMethods?: NotificationMethod[];
    quietHoursStart?: string;
    quietHoursEnd?: string;
}
export interface OpenShiftFilters {
    organizationId?: UUID;
    branchId?: UUID;
    branchIds?: UUID[];
    clientId?: UUID;
    dateFrom?: Date;
    dateTo?: Date;
    priority?: ShiftPriority[];
    matchingStatus?: MatchingStatus[];
    isUrgent?: boolean;
    serviceTypeId?: UUID;
    requiredSkills?: string[];
    zipCode?: string;
    radius?: number;
}
export interface MatchCandidateFilters {
    minScore?: number;
    maxDistance?: number;
    hasRequiredSkills?: boolean;
    availableOnly?: boolean;
    complianceStatus?: string;
    experienceWithClient?: boolean;
}
export interface ProposalFilters {
    organizationId?: UUID;
    branchId?: UUID;
    caregiverId?: UUID;
    openShiftId?: UUID;
    proposalStatus?: ProposalStatus[];
    proposedDateFrom?: Date;
    proposedDateTo?: Date;
    isExpiringSoon?: boolean;
    matchQuality?: MatchQuality[];
}
export interface MatchingMetrics {
    periodStart: Date;
    periodEnd: Date;
    totalOpenShifts: number;
    shiftsMatched: number;
    shiftsUnmatched: number;
    matchRate: number;
    averageMatchScore: number;
    averageCandidatesPerShift: number;
    averageResponseTimeMinutes: number;
    proposalAcceptanceRate: number;
    proposalRejectionRate: number;
    proposalExpirationRate: number;
    excellentMatches: number;
    goodMatches: number;
    fairMatches: number;
    poorMatches: number;
    topRejectionReasons: Array<{
        category: RejectionCategory;
        count: number;
    }>;
}
export interface CaregiverMatchingPerformance {
    caregiverId: UUID;
    caregiverName: string;
    periodStart: Date;
    periodEnd: Date;
    proposalsReceived: number;
    proposalsAccepted: number;
    proposalsRejected: number;
    proposalsExpired: number;
    acceptanceRate: number;
    averageResponseTimeMinutes: number;
    averageMatchScore: number;
    shiftsCompleted: number;
    noShowCount: number;
    cancellationCount: number;
    reliabilityScore: number;
}
//# sourceMappingURL=shift-matching.d.ts.map