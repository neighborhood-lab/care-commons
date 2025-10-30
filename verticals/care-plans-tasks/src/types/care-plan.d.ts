import { Entity, SoftDeletable, UUID, Timestamp } from '@care-commons/core';
export interface CarePlan extends Entity, SoftDeletable {
    planNumber: string;
    name: string;
    clientId: UUID;
    organizationId: UUID;
    branchId?: UUID;
    planType: CarePlanType;
    status: CarePlanStatus;
    priority: Priority;
    effectiveDate: Date;
    expirationDate?: Date;
    reviewDate?: Date;
    lastReviewedDate?: Date;
    primaryCaregiverId?: UUID;
    coordinatorId?: UUID;
    supervisorId?: UUID;
    physicianId?: UUID;
    assessmentSummary?: string;
    medicalDiagnosis?: string[];
    functionalLimitations?: string[];
    goals: CarePlanGoal[];
    interventions: Intervention[];
    taskTemplates: TaskTemplate[];
    serviceFrequency?: ServiceFrequency;
    estimatedHoursPerWeek?: number;
    authorizedBy?: UUID;
    authorizedDate?: Date;
    authorizationNumber?: string;
    payerSource?: PayerSource;
    authorizationHours?: number;
    authorizationStartDate?: Date;
    authorizationEndDate?: Date;
    requiredDocumentation?: DocumentRequirement[];
    signatureRequirements?: SignatureRequirement[];
    restrictions?: string[];
    precautions?: string[];
    allergies?: Allergy[];
    contraindications?: string[];
    progressNotes?: ProgressNote[];
    outcomesMeasured?: OutcomeMeasure[];
    regulatoryRequirements?: string[];
    complianceStatus: ComplianceStatus;
    lastComplianceCheck?: Date;
    modificationHistory?: PlanModification[];
    notes?: string;
    tags?: string[];
    customFields?: Record<string, unknown>;
}
export type CarePlanType = 'PERSONAL_CARE' | 'COMPANION' | 'SKILLED_NURSING' | 'THERAPY' | 'HOSPICE' | 'RESPITE' | 'LIVE_IN' | 'CUSTOM';
export type CarePlanStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'ON_HOLD' | 'EXPIRED' | 'DISCONTINUED' | 'COMPLETED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ComplianceStatus = 'COMPLIANT' | 'PENDING_REVIEW' | 'EXPIRED' | 'NON_COMPLIANT';
export interface CarePlanGoal {
    id: UUID;
    name: string;
    description: string;
    category: GoalCategory;
    targetDate?: Date;
    status: GoalStatus;
    priority: Priority;
    measurementType?: 'QUANTITATIVE' | 'QUALITATIVE' | 'BINARY';
    targetValue?: number;
    currentValue?: number;
    unit?: string;
    milestones?: Milestone[];
    progressPercentage?: number;
    lastAssessedDate?: Date;
    interventionIds?: UUID[];
    taskIds?: UUID[];
    achievedDate?: Date;
    outcome?: string;
    notes?: string;
}
export type GoalCategory = 'MOBILITY' | 'ADL' | 'IADL' | 'NUTRITION' | 'MEDICATION_MANAGEMENT' | 'SAFETY' | 'SOCIAL_ENGAGEMENT' | 'COGNITIVE' | 'EMOTIONAL_WELLBEING' | 'PAIN_MANAGEMENT' | 'WOUND_CARE' | 'CHRONIC_DISEASE_MANAGEMENT' | 'OTHER';
export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_TRACK' | 'AT_RISK' | 'ACHIEVED' | 'PARTIALLY_ACHIEVED' | 'NOT_ACHIEVED' | 'DISCONTINUED';
export interface Milestone {
    id: UUID;
    name: string;
    targetDate: Date;
    completedDate?: Date;
    status: 'PENDING' | 'COMPLETED' | 'MISSED';
    notes?: string;
}
export interface Intervention {
    id: UUID;
    name: string;
    description: string;
    category: InterventionCategory;
    goalIds: UUID[];
    frequency: Frequency;
    duration?: number;
    instructions: string;
    precautions?: string[];
    performedBy: PerformerType[];
    requiresSupervision?: boolean;
    supervisorRole?: string;
    requiredEquipment?: string[];
    requiredSupplies?: string[];
    requiresDocumentation: boolean;
    documentationTemplate?: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'DISCONTINUED';
    startDate: Date;
    endDate?: Date;
    expectedOutcome?: string;
    contraindications?: string[];
    notes?: string;
}
export type InterventionCategory = 'ASSISTANCE_WITH_ADL' | 'ASSISTANCE_WITH_IADL' | 'MEDICATION_ADMINISTRATION' | 'MEDICATION_REMINDER' | 'VITAL_SIGNS_MONITORING' | 'WOUND_CARE' | 'RANGE_OF_MOTION' | 'AMBULATION_ASSISTANCE' | 'TRANSFER_ASSISTANCE' | 'FALL_PREVENTION' | 'NUTRITION_MEAL_PREP' | 'FEEDING_ASSISTANCE' | 'HYDRATION_MONITORING' | 'INCONTINENCE_CARE' | 'SKIN_CARE' | 'COGNITIVE_STIMULATION' | 'COMPANIONSHIP' | 'SAFETY_MONITORING' | 'TRANSPORTATION' | 'RESPITE_CARE' | 'OTHER';
export type PerformerType = 'CAREGIVER' | 'CNA' | 'HHA' | 'RN' | 'LPN' | 'THERAPIST' | 'FAMILY' | 'CLIENT';
export interface TaskTemplate {
    id: UUID;
    name: string;
    description: string;
    category: TaskCategory;
    interventionIds?: UUID[];
    frequency: Frequency;
    estimatedDuration?: number;
    timeOfDay?: TimeOfDay[];
    instructions: string;
    steps?: TaskStep[];
    requiresSignature: boolean;
    requiresNote: boolean;
    requiresPhoto?: boolean;
    requiresVitals?: boolean;
    requiredFields?: CustomField[];
    isOptional: boolean;
    allowSkip: boolean;
    skipReasons?: string[];
    verificationType?: VerificationType;
    qualityChecks?: QualityCheck[];
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    notes?: string;
    tags?: string[];
}
export type TaskCategory = 'PERSONAL_HYGIENE' | 'BATHING' | 'DRESSING' | 'GROOMING' | 'TOILETING' | 'MOBILITY' | 'TRANSFERRING' | 'AMBULATION' | 'MEDICATION' | 'MEAL_PREPARATION' | 'FEEDING' | 'HOUSEKEEPING' | 'LAUNDRY' | 'SHOPPING' | 'TRANSPORTATION' | 'COMPANIONSHIP' | 'MONITORING' | 'DOCUMENTATION' | 'OTHER';
export type TimeOfDay = 'EARLY_MORNING' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'OVERNIGHT' | 'ANY';
export interface TaskStep {
    stepNumber: number;
    description: string;
    isRequired: boolean;
    estimatedDuration?: number;
    safetyNotes?: string;
}
export type VerificationType = 'NONE' | 'CHECKBOX' | 'SIGNATURE' | 'PHOTO' | 'GPS' | 'BARCODE_SCAN' | 'VITAL_SIGNS' | 'CUSTOM';
export interface QualityCheck {
    id: UUID;
    question: string;
    checkType: 'YES_NO' | 'SCALE' | 'TEXT' | 'CHECKLIST';
    required: boolean;
    options?: string[];
}
export interface TaskInstance extends Entity {
    carePlanId: UUID;
    templateId?: UUID;
    visitId?: UUID;
    clientId: UUID;
    assignedCaregiverId?: UUID;
    name: string;
    description: string;
    category: TaskCategory;
    instructions: string;
    scheduledDate: Date;
    scheduledTime?: string;
    timeOfDay?: TimeOfDay;
    estimatedDuration?: number;
    status: TaskStatus;
    completedAt?: Timestamp;
    completedBy?: UUID;
    completionNote?: string;
    completionSignature?: Signature;
    completionPhoto?: string[];
    verificationData?: VerificationData;
    qualityCheckResponses?: QualityCheckResponse[];
    skippedAt?: Timestamp;
    skippedBy?: UUID;
    skipReason?: string;
    skipNote?: string;
    issueReported?: boolean;
    issueDescription?: string;
    issueReportedAt?: Timestamp;
    issueReportedBy?: UUID;
    requiredSignature: boolean;
    requiredNote: boolean;
    customFieldValues?: Record<string, unknown>;
    notes?: string;
}
export type TaskStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'MISSED' | 'CANCELLED' | 'ISSUE_REPORTED';
export interface Signature {
    signatureData: string;
    signedBy: UUID;
    signedByName: string;
    signedAt: Timestamp;
    signatureType: 'ELECTRONIC' | 'STYLUS' | 'TOUCHSCREEN';
    ipAddress?: string;
    deviceInfo?: string;
}
export interface VerificationData {
    verificationType: VerificationType;
    verifiedAt: Timestamp;
    verifiedBy: UUID;
    gpsLocation?: GeoLocation;
    photoUrls?: string[];
    barcodeData?: string;
    vitalSigns?: VitalSigns;
    customData?: Record<string, unknown>;
}
export interface GeoLocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: Timestamp;
}
export interface VitalSigns {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    temperature?: number;
    temperatureUnit?: 'F' | 'C';
    oxygenSaturation?: number;
    respiratoryRate?: number;
    bloodGlucose?: number;
    weight?: number;
    weightUnit?: 'LBS' | 'KG';
    pain?: number;
    notes?: string;
}
export interface QualityCheckResponse {
    checkId: UUID;
    question: string;
    response: string | number | boolean | string[];
    notes?: string;
}
export interface ServiceFrequency {
    pattern: FrequencyPattern;
    timesPerWeek?: number;
    timesPerMonth?: number;
    specificDays?: DayOfWeek[];
    customSchedule?: string;
}
export type FrequencyPattern = 'DAILY' | 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'AS_NEEDED' | 'CUSTOM';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export interface Frequency {
    pattern: FrequencyPattern;
    interval?: number;
    unit?: FrequencyUnit;
    timesPerDay?: number;
    timesPerWeek?: number;
    specificTimes?: string[];
    specificDays?: DayOfWeek[];
}
export type FrequencyUnit = 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
export interface DocumentRequirement {
    id: UUID;
    type: DocumentType;
    name: string;
    description: string;
    frequency: Frequency;
    required: boolean;
    template?: string;
    dueDate?: Date;
    lastCompleted?: Date;
    status: 'CURRENT' | 'DUE' | 'OVERDUE' | 'NOT_APPLICABLE';
}
export type DocumentType = 'CARE_PLAN_REVIEW' | 'PROGRESS_NOTE' | 'INCIDENT_REPORT' | 'MEDICATION_LOG' | 'VITAL_SIGNS_LOG' | 'PHYSICIAN_ORDERS' | 'ASSESSMENT' | 'CONSENT_FORM' | 'OTHER';
export interface SignatureRequirement {
    id: UUID;
    signerRole: SignerRole;
    signerName?: string;
    signerId?: UUID;
    purpose: string;
    required: boolean;
    frequency?: Frequency;
    lastSigned?: Date;
    signature?: Signature;
}
export type SignerRole = 'CLIENT' | 'FAMILY_MEMBER' | 'CAREGIVER' | 'NURSE' | 'PHYSICIAN' | 'COORDINATOR' | 'SUPERVISOR';
export interface ProgressNote extends Entity {
    carePlanId: UUID;
    clientId: UUID;
    visitId?: UUID;
    noteType: ProgressNoteType;
    noteDate: Date;
    authorId: UUID;
    authorName: string;
    authorRole: string;
    content: string;
    goalProgress?: GoalProgress[];
    observations?: Observation[];
    concerns?: string[];
    recommendations?: string[];
    reviewedBy?: UUID;
    reviewedAt?: Timestamp;
    approved?: boolean;
    attachments?: string[];
    signature?: Signature;
    tags?: string[];
    isPrivate?: boolean;
}
export type ProgressNoteType = 'VISIT_NOTE' | 'WEEKLY_SUMMARY' | 'MONTHLY_SUMMARY' | 'CARE_PLAN_REVIEW' | 'INCIDENT' | 'CHANGE_IN_CONDITION' | 'COMMUNICATION' | 'OTHER';
export interface GoalProgress {
    goalId: UUID;
    goalName: string;
    status: GoalStatus;
    progressDescription: string;
    progressPercentage?: number;
    barriers?: string[];
    nextSteps?: string[];
}
export interface Observation {
    category: ObservationCategory;
    observation: string;
    severity?: 'NORMAL' | 'ATTENTION' | 'URGENT';
    timestamp: Timestamp;
}
export type ObservationCategory = 'PHYSICAL' | 'COGNITIVE' | 'EMOTIONAL' | 'BEHAVIORAL' | 'SOCIAL' | 'ENVIRONMENTAL' | 'SAFETY';
export interface OutcomeMeasure {
    id: UUID;
    name: string;
    measureType: MeasureType;
    category: string;
    baselineValue?: number;
    baselineDate?: Date;
    targetValue?: number;
    currentValue?: number;
    currentDate?: Date;
    unit?: string;
    frequency: Frequency;
    nextAssessmentDate?: Date;
    measurements?: Measurement[];
    trend?: 'IMPROVING' | 'STABLE' | 'DECLINING';
    varianceFromTarget?: number;
    notes?: string;
}
export type MeasureType = 'FUNCTIONAL_STATUS' | 'QUALITY_OF_LIFE' | 'SATISFACTION' | 'CLINICAL_OUTCOME' | 'SAFETY' | 'CUSTOM';
export interface Measurement {
    date: Date;
    value: number;
    recordedBy: UUID;
    notes?: string;
}
export interface Allergy {
    id: UUID;
    allergen: string;
    allergyType: AllergyType;
    reaction: string;
    severity: AllergySeverity;
    onsetDate?: Date;
    verifiedDate?: Date;
    status: 'ACTIVE' | 'RESOLVED' | 'SUSPECTED';
    notes?: string;
}
export type AllergyType = 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL' | 'LATEX' | 'OTHER';
export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
export interface PayerSource {
    payerType: PayerType;
    payerName: string;
    policyNumber?: string;
    groupNumber?: string;
    effectiveDate?: Date;
    expirationDate?: Date;
}
export type PayerType = 'MEDICARE' | 'MEDICAID' | 'PRIVATE_INSURANCE' | 'PRIVATE_PAY' | 'VA' | 'WORKERS_COMP' | 'OTHER';
export interface PlanModification {
    id: UUID;
    modifiedAt: Timestamp;
    modifiedBy: UUID;
    modificationType: ModificationType;
    reason: string;
    description: string;
    changesApplied: Record<string, {
        from: unknown;
        to: unknown;
    }>;
    approvedBy?: UUID;
    approvedAt?: Timestamp;
}
export type ModificationType = 'GOAL_ADDED' | 'GOAL_MODIFIED' | 'GOAL_REMOVED' | 'INTERVENTION_ADDED' | 'INTERVENTION_MODIFIED' | 'INTERVENTION_REMOVED' | 'TASK_ADDED' | 'TASK_MODIFIED' | 'TASK_REMOVED' | 'FREQUENCY_CHANGED' | 'AUTHORIZATION_UPDATED' | 'PLAN_RENEWED' | 'PLAN_DISCONTINUED' | 'OTHER';
export interface CustomField {
    id: UUID;
    name: string;
    fieldType: CustomFieldType;
    required: boolean;
    options?: string[];
    validation?: FieldValidation;
    defaultValue?: unknown;
    helpText?: string;
}
export type CustomFieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'TIME' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT' | 'TEXTAREA' | 'RADIO' | 'CHECKBOX';
export interface FieldValidation {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    customValidator?: string;
}
export interface CreateCarePlanInput {
    clientId: UUID;
    organizationId: UUID;
    branchId?: UUID;
    name: string;
    planType: CarePlanType;
    effectiveDate: Date;
    expirationDate?: Date;
    goals: Omit<CarePlanGoal, 'id'>[];
    interventions: Omit<Intervention, 'id'>[];
    taskTemplates?: Omit<TaskTemplate, 'id'>[];
    serviceFrequency?: ServiceFrequency;
    coordinatorId?: UUID;
    notes?: string;
}
export interface UpdateCarePlanInput {
    name?: string;
    status?: CarePlanStatus;
    priority?: Priority;
    expirationDate?: Date;
    reviewDate?: Date;
    goals?: CarePlanGoal[];
    interventions?: Intervention[];
    taskTemplates?: TaskTemplate[];
    serviceFrequency?: ServiceFrequency;
    notes?: string;
}
export interface CreateTaskInstanceInput {
    carePlanId: UUID;
    templateId?: UUID;
    visitId?: UUID;
    clientId: UUID;
    assignedCaregiverId?: UUID;
    name: string;
    description: string;
    category: TaskCategory;
    instructions: string;
    scheduledDate: Date;
    scheduledTime?: string;
    requiredSignature: boolean;
    requiredNote: boolean;
}
export interface CompleteTaskInput {
    completionNote?: string;
    signature?: Omit<Signature, 'signedAt'>;
    verificationData?: Omit<VerificationData, 'verifiedAt'>;
    qualityCheckResponses?: QualityCheckResponse[];
    customFieldValues?: Record<string, unknown>;
}
export interface CreateProgressNoteInput {
    carePlanId: UUID;
    clientId: UUID;
    visitId?: UUID;
    noteType: ProgressNoteType;
    content: string;
    goalProgress?: GoalProgress[];
    observations?: Observation[];
    concerns?: string[];
    recommendations?: string[];
    signature?: Omit<Signature, 'signedAt'>;
}
export interface CarePlanSearchFilters {
    query?: string;
    clientId?: UUID;
    organizationId?: UUID;
    branchId?: UUID;
    status?: CarePlanStatus[];
    planType?: CarePlanType[];
    coordinatorId?: UUID;
    expiringWithinDays?: number;
    needsReview?: boolean;
    complianceStatus?: ComplianceStatus[];
}
export interface TaskInstanceSearchFilters {
    carePlanId?: UUID;
    clientId?: UUID;
    assignedCaregiverId?: UUID;
    visitId?: UUID;
    status?: TaskStatus[];
    category?: TaskCategory[];
    scheduledDateFrom?: Date;
    scheduledDateTo?: Date;
    overdue?: boolean;
    requiresSignature?: boolean;
}
export interface CarePlanAnalytics {
    totalPlans: number;
    activePlans: number;
    expiringPlans: number;
    goalCompletionRate: number;
    taskCompletionRate: number;
    averageGoalsPerPlan: number;
    averageTasksPerVisit: number;
    complianceRate: number;
}
export interface TaskCompletionMetrics {
    totalTasks: number;
    completedTasks: number;
    skippedTasks: number;
    missedTasks: number;
    completionRate: number;
    averageCompletionTime: number;
    tasksByCategory: Record<TaskCategory, number>;
    issuesReported: number;
}
//# sourceMappingURL=care-plan.d.ts.map