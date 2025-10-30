import { Entity, SoftDeletable, UUID, Timestamp } from '@care-commons/core';
export interface ServicePattern extends Entity, SoftDeletable {
    organizationId: UUID;
    branchId: UUID;
    clientId: UUID;
    name: string;
    description?: string;
    patternType: PatternType;
    serviceTypeId: UUID;
    serviceTypeName: string;
    taskTemplateIds?: UUID[];
    recurrence: RecurrenceRule;
    duration: number;
    flexibilityWindow?: number;
    requiredSkills?: string[];
    requiredCertifications?: string[];
    preferredCaregivers?: UUID[];
    blockedCaregivers?: UUID[];
    genderPreference?: 'MALE' | 'FEMALE' | 'NO_PREFERENCE';
    languagePreference?: string;
    preferredTimeOfDay?: TimeOfDay;
    mustStartBy?: string;
    mustEndBy?: string;
    authorizedHoursPerWeek?: number;
    authorizedVisitsPerWeek?: number;
    authorizationStartDate?: Date;
    authorizationEndDate?: Date;
    fundingSourceId?: UUID;
    travelTimeBefore?: number;
    travelTimeAfter?: number;
    allowBackToBack?: boolean;
    status: PatternStatus;
    effectiveFrom: Date;
    effectiveTo?: Date;
    notes?: string;
    clientInstructions?: string;
    caregiverInstructions?: string;
}
export type PatternType = 'RECURRING' | 'ONE_TIME' | 'AS_NEEDED' | 'RESPITE';
export type PatternStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'CANCELLED';
export type TimeOfDay = 'EARLY_MORNING' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'ANY';
export interface RecurrenceRule {
    frequency: Frequency;
    interval: number;
    daysOfWeek?: DayOfWeek[];
    datesOfMonth?: number[];
    startTime: string;
    endTime?: string;
    timezone: string;
}
export type Frequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export interface Schedule extends Entity {
    organizationId: UUID;
    branchId: UUID;
    clientId: UUID;
    patternId: UUID;
    startDate: Date;
    endDate: Date;
    generatedAt: Timestamp;
    generatedBy: UUID;
    generationMethod: 'AUTO' | 'MANUAL' | 'IMPORT';
    totalVisits: number;
    scheduledVisits: number;
    unassignedVisits: number;
    completedVisits: number;
    status: ScheduleStatus;
    notes?: string;
}
export type ScheduleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export interface Visit extends Entity, SoftDeletable {
    organizationId: UUID;
    branchId: UUID;
    clientId: UUID;
    patternId?: UUID;
    scheduleId?: UUID;
    visitNumber: string;
    visitType: VisitType;
    serviceTypeId: UUID;
    serviceTypeName: string;
    scheduledDate: Date;
    scheduledStartTime: string;
    scheduledEndTime: string;
    scheduledDuration: number;
    timezone: string;
    actualStartTime?: Timestamp;
    actualEndTime?: Timestamp;
    actualDuration?: number;
    assignedCaregiverId?: UUID;
    assignedAt?: Timestamp;
    assignedBy?: UUID;
    assignmentMethod: AssignmentMethod;
    address: VisitAddress;
    locationVerification?: LocationVerification;
    taskIds?: UUID[];
    requiredSkills?: string[];
    requiredCertifications?: string[];
    status: VisitStatus;
    statusHistory: VisitStatusChange[];
    isUrgent: boolean;
    isPriority: boolean;
    requiresSupervision: boolean;
    riskFlags?: string[];
    verificationMethod?: VerificationMethod;
    verificationData?: VerificationData;
    completionNotes?: string;
    tasksCompleted?: number;
    tasksTotal?: number;
    incidentReported?: boolean;
    signatureRequired: boolean;
    signatureCaptured?: boolean;
    signatureData?: SignatureData;
    billableHours?: number;
    billingStatus?: BillingStatus;
    billingNotes?: string;
    clientInstructions?: string;
    caregiverInstructions?: string;
    internalNotes?: string;
    tags?: string[];
}
export type VisitType = 'REGULAR' | 'INITIAL' | 'DISCHARGE' | 'RESPITE' | 'EMERGENCY' | 'MAKEUP' | 'SUPERVISION' | 'ASSESSMENT';
export type AssignmentMethod = 'MANUAL' | 'AUTO_MATCH' | 'SELF_ASSIGN' | 'PREFERRED' | 'OVERFLOW';
export type VisitStatus = 'DRAFT' | 'SCHEDULED' | 'UNASSIGNED' | 'ASSIGNED' | 'CONFIRMED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'INCOMPLETE' | 'CANCELLED' | 'NO_SHOW_CLIENT' | 'NO_SHOW_CAREGIVER' | 'REJECTED';
export type BillingStatus = 'PENDING' | 'READY' | 'BILLED' | 'PAID' | 'DENIED' | 'ADJUSTED';
export type VerificationMethod = 'GPS' | 'PHONE' | 'FACIAL' | 'BIOMETRIC' | 'MANUAL';
export interface VisitAddress {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
    accessInstructions?: string;
}
export interface LocationVerification {
    method: VerificationMethod;
    timestamp: Timestamp;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    distanceFromAddress?: number;
    isWithinGeofence: boolean;
    deviceId?: string;
}
export interface VerificationData {
    clockInVerification?: LocationVerification;
    clockOutVerification?: LocationVerification;
    midVisitChecks?: LocationVerification[];
}
export interface SignatureData {
    capturedAt: Timestamp;
    capturedBy: UUID;
    signatureImageUrl?: string;
    signatureDataUrl?: string;
    deviceId?: string;
    ipAddress?: string;
}
export interface VisitStatusChange {
    id: UUID;
    fromStatus: VisitStatus | null;
    toStatus: VisitStatus;
    timestamp: Timestamp;
    changedBy: UUID;
    reason?: string;
    notes?: string;
    automatic: boolean;
}
export interface VisitAssignment extends Entity {
    visitId: UUID;
    caregiverId: UUID;
    assignedBy: UUID;
    assignedAt: Timestamp;
    assignmentMethod: AssignmentMethod;
    status: AssignmentStatus;
    confirmedAt?: Timestamp;
    rejectedAt?: Timestamp;
    rejectionReason?: string;
    matchScore?: number;
    matchReasons?: string[];
    notes?: string;
}
export type AssignmentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'REPLACED';
export interface VisitException extends Entity {
    visitId: UUID;
    clientId: UUID;
    caregiverId?: UUID;
    exceptionType: ExceptionType;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    detectedAt: Timestamp;
    detectedBy?: UUID;
    automatic: boolean;
    description: string;
    resolution?: string;
    resolvedAt?: Timestamp;
    resolvedBy?: UUID;
    requiresFollowup: boolean;
    followupAssignedTo?: UUID;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
}
export type ExceptionType = 'LATE_START' | 'EARLY_END' | 'OVERTIME' | 'NO_SHOW_CLIENT' | 'NO_SHOW_CAREGIVER' | 'LOCATION_MISMATCH' | 'MISSED_TASKS' | 'SAFETY_CONCERN' | 'EQUIPMENT_ISSUE' | 'MEDICATION_ISSUE' | 'CLIENT_REFUSED' | 'EMERGENCY' | 'OTHER';
export interface ShiftTemplate extends Entity {
    organizationId: UUID;
    branchId: UUID;
    name: string;
    description?: string;
    shiftType: ShiftType;
    serviceTypeId: UUID;
    duration: number;
    requiredSkills?: string[];
    requiredCertifications?: string[];
    payRate?: number;
    payRateType?: 'HOURLY' | 'FLAT';
    isActive: boolean;
}
export type ShiftType = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'OVERNIGHT' | 'WEEKEND' | 'HOLIDAY' | 'ON_CALL';
export interface CalendarViewSettings {
    userId: UUID;
    defaultView: CalendarView;
    defaultTimeRange: TimeRange;
    showUnassignedVisits: boolean;
    showCancelledVisits: boolean;
    colorBy: 'CLIENT' | 'CAREGIVER' | 'SERVICE_TYPE' | 'STATUS';
    filters?: CalendarFilters;
}
export type CalendarView = 'DAY' | 'WEEK' | 'MONTH' | 'LIST' | 'MAP';
export type TimeRange = 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'NEXT_WEEK' | 'THIS_MONTH' | 'CUSTOM';
export interface CalendarFilters {
    branchIds?: UUID[];
    clientIds?: UUID[];
    caregiverIds?: UUID[];
    serviceTypeIds?: UUID[];
    statuses?: VisitStatus[];
    onlyUnassigned?: boolean;
    onlyUrgent?: boolean;
}
export interface CreateServicePatternInput {
    organizationId: UUID;
    branchId: UUID;
    clientId: UUID;
    name: string;
    description?: string;
    patternType: PatternType;
    serviceTypeId: UUID;
    serviceTypeName: string;
    recurrence: RecurrenceRule;
    duration: number;
    flexibilityWindow?: number;
    requiredSkills?: string[];
    requiredCertifications?: string[];
    preferredCaregivers?: UUID[];
    blockedCaregivers?: UUID[];
    genderPreference?: 'MALE' | 'FEMALE' | 'NO_PREFERENCE';
    languagePreference?: string;
    preferredTimeOfDay?: TimeOfDay;
    mustStartBy?: string;
    mustEndBy?: string;
    authorizedHoursPerWeek?: number;
    authorizedVisitsPerWeek?: number;
    authorizationStartDate?: Date;
    authorizationEndDate?: Date;
    fundingSourceId?: UUID;
    travelTimeBefore?: number;
    travelTimeAfter?: number;
    allowBackToBack?: boolean;
    effectiveFrom: Date;
    effectiveTo?: Date;
    notes?: string;
    clientInstructions?: string;
    caregiverInstructions?: string;
}
export interface UpdateServicePatternInput {
    name?: string;
    description?: string;
    recurrence?: RecurrenceRule;
    duration?: number;
    requiredSkills?: string[];
    preferredCaregivers?: string[];
    status?: PatternStatus;
    effectiveTo?: Date;
}
export interface CreateVisitInput {
    organizationId: UUID;
    branchId: UUID;
    clientId: UUID;
    patternId?: UUID;
    visitType: VisitType;
    serviceTypeId: UUID;
    serviceTypeName: string;
    scheduledDate: Date;
    scheduledStartTime: string;
    scheduledEndTime: string;
    address: VisitAddress;
    taskIds?: UUID[];
    requiredSkills?: string[];
    requiredCertifications?: string[];
    isUrgent?: boolean;
    isPriority?: boolean;
    requiresSupervision?: boolean;
    riskFlags?: string[];
    clientInstructions?: string;
    caregiverInstructions?: string;
    internalNotes?: string;
}
export interface AssignVisitInput {
    visitId: UUID;
    caregiverId: UUID;
    assignmentMethod: AssignmentMethod;
    notes?: string;
}
export interface UpdateVisitStatusInput {
    visitId: UUID;
    newStatus: VisitStatus;
    notes?: string;
    reason?: string;
    locationVerification?: LocationVerification;
}
export interface CompleteVisitInput {
    visitId: UUID;
    actualEndTime: Timestamp;
    completionNotes?: string;
    tasksCompleted: number;
    tasksTotal: number;
    signatureData?: SignatureData;
    locationVerification: LocationVerification;
}
export interface VisitSearchFilters {
    query?: string;
    organizationId?: UUID;
    branchId?: UUID;
    branchIds?: UUID[];
    clientId?: UUID;
    clientIds?: UUID[];
    caregiverId?: UUID;
    caregiverIds?: UUID[];
    patternId?: UUID;
    status?: VisitStatus[];
    visitType?: VisitType[];
    dateFrom?: Date;
    dateTo?: Date;
    isUnassigned?: boolean;
    isUrgent?: boolean;
    requiresSupervision?: boolean;
    hasExceptions?: boolean;
}
export interface ScheduleGenerationOptions {
    patternId: UUID;
    startDate: Date;
    endDate: Date;
    autoAssign?: boolean;
    respectHourlyLimits?: boolean;
    skipHolidays?: boolean;
    holidayCalendarId?: UUID;
}
export interface CaregiverAvailabilityQuery {
    caregiverId: UUID;
    date: Date;
    startTime?: string;
    endTime?: string;
    duration?: number;
    includeTravel?: boolean;
}
export interface AvailabilitySlot {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    conflictingVisitIds?: UUID[];
    reason?: string;
}
//# sourceMappingURL=schedule.d.ts.map