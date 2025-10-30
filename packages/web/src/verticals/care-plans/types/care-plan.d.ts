export type CarePlanType = 'PERSONAL_CARE' | 'COMPANION' | 'SKILLED_NURSING' | 'THERAPY' | 'HOSPICE' | 'RESPITE' | 'LIVE_IN' | 'CUSTOM';
export type CarePlanStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'ON_HOLD' | 'EXPIRED' | 'DISCONTINUED' | 'COMPLETED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ComplianceStatus = 'COMPLIANT' | 'PENDING_REVIEW' | 'EXPIRED' | 'NON_COMPLIANT';
export type GoalCategory = 'MOBILITY' | 'ADL' | 'IADL' | 'NUTRITION' | 'MEDICATION_MANAGEMENT' | 'SAFETY' | 'SOCIAL_ENGAGEMENT' | 'COGNITIVE' | 'EMOTIONAL_WELLBEING' | 'PAIN_MANAGEMENT' | 'WOUND_CARE' | 'CHRONIC_DISEASE_MANAGEMENT' | 'OTHER';
export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_TRACK' | 'AT_RISK' | 'ACHIEVED' | 'PARTIALLY_ACHIEVED' | 'NOT_ACHIEVED' | 'DISCONTINUED';
export type InterventionCategory = 'ASSISTANCE_WITH_ADL' | 'ASSISTANCE_WITH_IADL' | 'MEDICATION_ADMINISTRATION' | 'MEDICATION_REMINDER' | 'VITAL_SIGNS_MONITORING' | 'WOUND_CARE' | 'RANGE_OF_MOTION' | 'AMBULATION_ASSISTANCE' | 'TRANSFER_ASSISTANCE' | 'FALL_PREVENTION' | 'NUTRITION_MEAL_PREP' | 'FEEDING_ASSISTANCE' | 'HYDRATION_MONITORING' | 'INCONTINENCE_CARE' | 'SKIN_CARE' | 'COGNITIVE_STIMULATION' | 'COMPANIONSHIP' | 'SAFETY_MONITORING' | 'TRANSPORTATION' | 'RESPITE_CARE' | 'OTHER';
export type TaskCategory = 'PERSONAL_HYGIENE' | 'BATHING' | 'DRESSING' | 'GROOMING' | 'TOILETING' | 'MOBILITY' | 'TRANSFERRING' | 'AMBULATION' | 'MEDICATION' | 'MEAL_PREPARATION' | 'FEEDING' | 'HOUSEKEEPING' | 'LAUNDRY' | 'SHOPPING' | 'TRANSPORTATION' | 'COMPANIONSHIP' | 'MONITORING' | 'DOCUMENTATION' | 'OTHER';
export type TaskStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'MISSED' | 'CANCELLED' | 'ISSUE_REPORTED';
export type ProgressNoteType = 'VISIT_NOTE' | 'WEEKLY_SUMMARY' | 'MONTHLY_SUMMARY' | 'CARE_PLAN_REVIEW' | 'INCIDENT' | 'CHANGE_IN_CONDITION' | 'COMMUNICATION' | 'OTHER';
export interface CarePlanGoal {
    id: string;
    name: string;
    description: string;
    category: GoalCategory;
    targetDate?: string;
    status: GoalStatus;
    priority: Priority;
    progressPercentage?: number;
    lastAssessedDate?: string;
    achievedDate?: string;
    outcome?: string;
    notes?: string;
}
export interface Intervention {
    id: string;
    name: string;
    description: string;
    category: InterventionCategory;
    instructions: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'DISCONTINUED';
    startDate: string;
    endDate?: string;
    notes?: string;
}
export interface TaskTemplate {
    id: string;
    name: string;
    description: string;
    category: TaskCategory;
    instructions: string;
    requiresSignature: boolean;
    requiresNote: boolean;
    isOptional: boolean;
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    notes?: string;
}
export interface TaskInstance {
    id: string;
    carePlanId: string;
    templateId?: string;
    visitId?: string;
    clientId: string;
    assignedCaregiverId?: string;
    name: string;
    description: string;
    category: TaskCategory;
    instructions: string;
    scheduledDate: string;
    scheduledTime?: string;
    estimatedDuration?: number;
    status: TaskStatus;
    completedAt?: string;
    completedBy?: string;
    completionNote?: string;
    requiredSignature: boolean;
    requiredNote: boolean;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
export interface ProgressNote {
    id: string;
    carePlanId: string;
    clientId: string;
    visitId?: string;
    noteType: ProgressNoteType;
    noteDate: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    content: string;
    reviewedBy?: string;
    reviewedAt?: string;
    approved?: boolean;
    tags?: string[];
    isPrivate?: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface CarePlan {
    id: string;
    planNumber: string;
    name: string;
    clientId: string;
    organizationId: string;
    branchId?: string;
    planType: CarePlanType;
    status: CarePlanStatus;
    priority: Priority;
    effectiveDate: string;
    expirationDate?: string;
    reviewDate?: string;
    lastReviewedDate?: string;
    primaryCaregiverId?: string;
    coordinatorId?: string;
    supervisorId?: string;
    physicianId?: string;
    assessmentSummary?: string;
    medicalDiagnosis?: string[];
    functionalLimitations?: string[];
    goals: CarePlanGoal[];
    interventions: Intervention[];
    taskTemplates: TaskTemplate[];
    estimatedHoursPerWeek?: number;
    authorizedBy?: string;
    authorizedDate?: string;
    authorizationNumber?: string;
    authorizationHours?: number;
    authorizationStartDate?: string;
    authorizationEndDate?: string;
    restrictions?: string[];
    precautions?: string[];
    progressNotes?: ProgressNote[];
    regulatoryRequirements?: string[];
    complianceStatus: ComplianceStatus;
    lastComplianceCheck?: string;
    notes?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}
export interface CreateCarePlanInput {
    clientId: string;
    organizationId: string;
    branchId?: string;
    name: string;
    planType: CarePlanType;
    effectiveDate: string;
    expirationDate?: string;
    goals: Omit<CarePlanGoal, 'id'>[];
    interventions: Omit<Intervention, 'id'>[];
    taskTemplates?: Omit<TaskTemplate, 'id'>[];
    coordinatorId?: string;
    notes?: string;
}
export interface UpdateCarePlanInput {
    name?: string;
    status?: CarePlanStatus;
    priority?: Priority;
    expirationDate?: string;
    reviewDate?: string;
    goals?: CarePlanGoal[];
    interventions?: Intervention[];
    taskTemplates?: TaskTemplate[];
    notes?: string;
}
export interface CompleteTaskInput {
    completionNote?: string;
    customFieldValues?: Record<string, unknown>;
}
export interface CarePlanSearchFilters {
    query?: string;
    clientId?: string;
    organizationId?: string;
    branchId?: string;
    status?: CarePlanStatus[];
    planType?: CarePlanType[];
    coordinatorId?: string;
    expiringWithinDays?: number;
    needsReview?: boolean;
    complianceStatus?: ComplianceStatus[];
}
export interface TaskInstanceSearchFilters {
    carePlanId?: string;
    clientId?: string;
    assignedCaregiverId?: string;
    visitId?: string;
    status?: TaskStatus[];
    category?: TaskCategory[];
    scheduledDateFrom?: string;
    scheduledDateTo?: string;
    overdue?: boolean;
    requiresSignature?: boolean;
}
//# sourceMappingURL=care-plan.d.ts.map