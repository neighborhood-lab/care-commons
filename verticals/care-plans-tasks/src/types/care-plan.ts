/**
 * Care Plans & Tasks Library domain model
 * 
 * Structured plan of care:
 * - Goals, interventions, per-visit tasks
 * - "done/not done" tracking
 * - Required notes or attachments
 * - Signature capture
 * - Validation that documented work aligns with authorized services
 */

import {
  Entity,
  SoftDeletable,
  UUID,
  Timestamp,
} from '@care-commons/core';

/**
 * Care Plan - Comprehensive care strategy for a client
 */
export interface CarePlan extends Entity, SoftDeletable {
  // Plan identification
  planNumber: string; // Human-readable identifier
  name: string;
  
  // Associations
  clientId: UUID;
  organizationId: UUID;
  branchId?: UUID;
  
  // Plan metadata
  planType: CarePlanType;
  status: CarePlanStatus;
  priority: Priority;
  
  // Dates
  effectiveDate: Date;
  expirationDate?: Date;
  reviewDate?: Date;
  lastReviewedDate?: Date;
  
  // Care team
  primaryCaregiverId?: UUID;
  coordinatorId?: UUID;
  supervisorId?: UUID;
  physicianId?: UUID;
  
  // Plan content
  assessmentSummary?: string;
  medicalDiagnosis?: string[];
  functionalLimitations?: string[];
  goals: CarePlanGoal[];
  interventions: Intervention[];
  taskTemplates: TaskTemplate[];
  
  // Frequency and schedule
  serviceFrequency?: ServiceFrequency;
  estimatedHoursPerWeek?: number;
  
  // Authorization
  authorizedBy?: UUID;
  authorizedDate?: Date;
  authorizationNumber?: string;
  payerSource?: PayerSource;
  authorizationHours?: number;
  authorizationStartDate?: Date;
  authorizationEndDate?: Date;
  
  // Documentation requirements
  requiredDocumentation?: DocumentRequirement[];
  signatureRequirements?: SignatureRequirement[];
  
  // Restrictions and precautions
  restrictions?: string[];
  precautions?: string[];
  allergies?: Allergy[];
  contraindications?: string[];
  
  // Progress and outcomes
  progressNotes?: ProgressNote[];
  outcomesMeasured?: OutcomeMeasure[];
  
  // Compliance
  regulatoryRequirements?: string[];
  complianceStatus: ComplianceStatus;
  lastComplianceCheck?: Date;
  
  // Modifications
  modificationHistory?: PlanModification[];
  
  // Metadata
  notes?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export type CarePlanType =
  | 'PERSONAL_CARE'
  | 'COMPANION'
  | 'SKILLED_NURSING'
  | 'THERAPY'
  | 'HOSPICE'
  | 'RESPITE'
  | 'LIVE_IN'
  | 'CUSTOM';

export type CarePlanStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'EXPIRED'
  | 'DISCONTINUED'
  | 'COMPLETED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplianceStatus =
  | 'COMPLIANT'
  | 'PENDING_REVIEW'
  | 'EXPIRED'
  | 'NON_COMPLIANT';

/**
 * Care Plan Goal - Specific, measurable objective
 */
export interface CarePlanGoal {
  id: UUID;
  name: string;
  description: string;
  category: GoalCategory;
  targetDate?: Date;
  status: GoalStatus;
  priority: Priority;
  
  // Measurable criteria
  measurementType?: 'QUANTITATIVE' | 'QUALITATIVE' | 'BINARY';
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  
  // Progress tracking
  milestones?: Milestone[];
  progressPercentage?: number;
  lastAssessedDate?: Date;
  
  // Related items
  interventionIds?: UUID[];
  taskIds?: UUID[];
  
  // Outcomes
  achievedDate?: Date;
  outcome?: string;
  notes?: string;
}

export type GoalCategory =
  | 'MOBILITY'
  | 'ADL' // Activities of Daily Living
  | 'IADL' // Instrumental ADL
  | 'NUTRITION'
  | 'MEDICATION_MANAGEMENT'
  | 'SAFETY'
  | 'SOCIAL_ENGAGEMENT'
  | 'COGNITIVE'
  | 'EMOTIONAL_WELLBEING'
  | 'PAIN_MANAGEMENT'
  | 'WOUND_CARE'
  | 'CHRONIC_DISEASE_MANAGEMENT'
  | 'OTHER';

export type GoalStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'ACHIEVED'
  | 'PARTIALLY_ACHIEVED'
  | 'NOT_ACHIEVED'
  | 'DISCONTINUED';

export interface Milestone {
  id: UUID;
  name: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'PENDING' | 'COMPLETED' | 'MISSED';
  notes?: string;
}

/**
 * Intervention - Specific action to address a goal
 */
export interface Intervention {
  id: UUID;
  name: string;
  description: string;
  category: InterventionCategory;
  goalIds: UUID[]; // Goals this intervention supports
  
  // Implementation details
  frequency: Frequency;
  duration?: number; // minutes per occurrence
  instructions: string;
  precautions?: string[];
  
  // Responsibility
  performedBy: PerformerType[];
  requiresSupervision?: boolean;
  supervisorRole?: string;
  
  // Equipment and supplies
  requiredEquipment?: string[];
  requiredSupplies?: string[];
  
  // Documentation requirements
  requiresDocumentation: boolean;
  documentationTemplate?: string;
  
  // Status
  status: 'ACTIVE' | 'SUSPENDED' | 'DISCONTINUED';
  startDate: Date;
  endDate?: Date;
  
  // Outcomes
  expectedOutcome?: string;
  contraindications?: string[];
  
  notes?: string;
}

export type InterventionCategory =
  | 'ASSISTANCE_WITH_ADL'
  | 'ASSISTANCE_WITH_IADL'
  | 'MEDICATION_ADMINISTRATION'
  | 'MEDICATION_REMINDER'
  | 'VITAL_SIGNS_MONITORING'
  | 'WOUND_CARE'
  | 'RANGE_OF_MOTION'
  | 'AMBULATION_ASSISTANCE'
  | 'TRANSFER_ASSISTANCE'
  | 'FALL_PREVENTION'
  | 'NUTRITION_MEAL_PREP'
  | 'FEEDING_ASSISTANCE'
  | 'HYDRATION_MONITORING'
  | 'INCONTINENCE_CARE'
  | 'SKIN_CARE'
  | 'COGNITIVE_STIMULATION'
  | 'COMPANIONSHIP'
  | 'SAFETY_MONITORING'
  | 'TRANSPORTATION'
  | 'RESPITE_CARE'
  | 'OTHER';

export type PerformerType =
  | 'CAREGIVER'
  | 'CNA'
  | 'HHA'
  | 'RN'
  | 'LPN'
  | 'THERAPIST'
  | 'FAMILY'
  | 'CLIENT';

/**
 * Task Template - Reusable task definition
 */
export interface TaskTemplate {
  id: UUID;
  name: string;
  description: string;
  category: TaskCategory;
  
  // Assignment
  interventionIds?: UUID[]; // Interventions this task supports
  
  // Timing
  frequency: Frequency;
  estimatedDuration?: number; // minutes
  timeOfDay?: TimeOfDay[];
  
  // Instructions
  instructions: string;
  steps?: TaskStep[];
  
  // Requirements
  requiresSignature: boolean;
  requiresNote: boolean;
  requiresPhoto?: boolean;
  requiresVitals?: boolean;
  requiredFields?: CustomField[];
  
  // Options
  isOptional: boolean;
  allowSkip: boolean;
  skipReasons?: string[];
  
  // Verification
  verificationType?: VerificationType;
  qualityChecks?: QualityCheck[];
  
  // Status
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  
  notes?: string;
  tags?: string[];
}

export type TaskCategory =
  | 'PERSONAL_HYGIENE'
  | 'BATHING'
  | 'DRESSING'
  | 'GROOMING'
  | 'TOILETING'
  | 'MOBILITY'
  | 'TRANSFERRING'
  | 'AMBULATION'
  | 'MEDICATION'
  | 'MEAL_PREPARATION'
  | 'FEEDING'
  | 'HOUSEKEEPING'
  | 'LAUNDRY'
  | 'SHOPPING'
  | 'TRANSPORTATION'
  | 'COMPANIONSHIP'
  | 'MONITORING'
  | 'DOCUMENTATION'
  | 'OTHER';

export type TimeOfDay =
  | 'EARLY_MORNING' // 6am-9am
  | 'MORNING' // 9am-12pm
  | 'AFTERNOON' // 12pm-5pm
  | 'EVENING' // 5pm-9pm
  | 'NIGHT' // 9pm-12am
  | 'OVERNIGHT' // 12am-6am
  | 'ANY';

export interface TaskStep {
  stepNumber: number;
  description: string;
  isRequired: boolean;
  estimatedDuration?: number; // minutes
  safetyNotes?: string;
}

export type VerificationType =
  | 'NONE'
  | 'CHECKBOX'
  | 'SIGNATURE'
  | 'PHOTO'
  | 'GPS'
  | 'BARCODE_SCAN'
  | 'VITAL_SIGNS'
  | 'CUSTOM';

export interface QualityCheck {
  id: UUID;
  question: string;
  checkType: 'YES_NO' | 'SCALE' | 'TEXT' | 'CHECKLIST';
  required: boolean;
  options?: string[];
}

/**
 * Task Instance - Actual task to be performed during a visit
 */
export interface TaskInstance extends Entity {
  // References
  carePlanId: UUID;
  templateId?: UUID; // Reference to template if created from one
  visitId?: UUID; // Associated visit
  clientId: UUID;
  assignedCaregiverId?: UUID;
  
  // Task details (copied from template or custom)
  name: string;
  description: string;
  category: TaskCategory;
  instructions: string;
  
  // Scheduling
  scheduledDate: Date;
  scheduledTime?: string; // HH:MM
  timeOfDay?: TimeOfDay;
  estimatedDuration?: number;
  
  // Completion
  status: TaskStatus;
  completedAt?: Timestamp;
  completedBy?: UUID;
  completionNote?: string;
  completionSignature?: Signature;
  completionPhoto?: string[];
  
  // Verification
  verificationData?: VerificationData;
  qualityCheckResponses?: QualityCheckResponse[];
  
  // Skipping
  skippedAt?: Timestamp;
  skippedBy?: UUID;
  skipReason?: string;
  skipNote?: string;
  
  // Issues
  issueReported?: boolean;
  issueDescription?: string;
  issueReportedAt?: Timestamp;
  issueReportedBy?: UUID;
  
  // Required data
  requiredSignature: boolean;
  requiredNote: boolean;
  customFieldValues?: Record<string, unknown>;
  
  notes?: string;
}

export type TaskStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'MISSED'
  | 'CANCELLED'
  | 'ISSUE_REPORTED';

export interface Signature {
  signatureData: string; // Base64 encoded signature image
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
  pain?: number; // 0-10 scale
  notes?: string;
}

export interface QualityCheckResponse {
  checkId: UUID;
  question: string;
  response: string | number | boolean | string[];
  notes?: string;
}

/**
 * Service Frequency
 */
export interface ServiceFrequency {
  pattern: FrequencyPattern;
  timesPerWeek?: number;
  timesPerMonth?: number;
  specificDays?: DayOfWeek[];
  customSchedule?: string;
}

export type FrequencyPattern =
  | 'DAILY'
  | 'WEEKLY'
  | 'BI_WEEKLY'
  | 'MONTHLY'
  | 'AS_NEEDED'
  | 'CUSTOM';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface Frequency {
  pattern: FrequencyPattern;
  interval?: number; // e.g., every 2 days, every 3 hours
  unit?: FrequencyUnit;
  timesPerDay?: number;
  timesPerWeek?: number;
  specificTimes?: string[]; // HH:MM format
  specificDays?: DayOfWeek[];
}

export type FrequencyUnit =
  | 'MINUTES'
  | 'HOURS'
  | 'DAYS'
  | 'WEEKS'
  | 'MONTHS';

/**
 * Documentation requirements
 */
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

export type DocumentType =
  | 'CARE_PLAN_REVIEW'
  | 'PROGRESS_NOTE'
  | 'INCIDENT_REPORT'
  | 'MEDICATION_LOG'
  | 'VITAL_SIGNS_LOG'
  | 'PHYSICIAN_ORDERS'
  | 'ASSESSMENT'
  | 'CONSENT_FORM'
  | 'OTHER';

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

export type SignerRole =
  | 'CLIENT'
  | 'FAMILY_MEMBER'
  | 'CAREGIVER'
  | 'NURSE'
  | 'PHYSICIAN'
  | 'COORDINATOR'
  | 'SUPERVISOR';

/**
 * Progress Notes
 */
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
  
  // Structured data
  goalProgress?: GoalProgress[];
  observations?: Observation[];
  concerns?: string[];
  recommendations?: string[];
  
  // Review and approval
  reviewedBy?: UUID;
  reviewedAt?: Timestamp;
  approved?: boolean;
  
  // Attachments
  attachments?: string[];
  
  // Signature
  signature?: Signature;
  
  tags?: string[];
  isPrivate?: boolean;
}

export type ProgressNoteType =
  | 'VISIT_NOTE'
  | 'WEEKLY_SUMMARY'
  | 'MONTHLY_SUMMARY'
  | 'CARE_PLAN_REVIEW'
  | 'INCIDENT'
  | 'CHANGE_IN_CONDITION'
  | 'COMMUNICATION'
  | 'OTHER';

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

export type ObservationCategory =
  | 'PHYSICAL'
  | 'COGNITIVE'
  | 'EMOTIONAL'
  | 'BEHAVIORAL'
  | 'SOCIAL'
  | 'ENVIRONMENTAL'
  | 'SAFETY';

/**
 * Outcome Measurement
 */
export interface OutcomeMeasure {
  id: UUID;
  name: string;
  measureType: MeasureType;
  category: string;
  
  // Measurement
  baselineValue?: number;
  baselineDate?: Date;
  targetValue?: number;
  currentValue?: number;
  currentDate?: Date;
  unit?: string;
  
  // Assessment schedule
  frequency: Frequency;
  nextAssessmentDate?: Date;
  
  // History
  measurements?: Measurement[];
  
  // Analysis
  trend?: 'IMPROVING' | 'STABLE' | 'DECLINING';
  varianceFromTarget?: number;
  
  notes?: string;
}

export type MeasureType =
  | 'FUNCTIONAL_STATUS'
  | 'QUALITY_OF_LIFE'
  | 'SATISFACTION'
  | 'CLINICAL_OUTCOME'
  | 'SAFETY'
  | 'CUSTOM';

export interface Measurement {
  date: Date;
  value: number;
  recordedBy: UUID;
  notes?: string;
}

/**
 * Allergy information
 */
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

export type AllergyType =
  | 'MEDICATION'
  | 'FOOD'
  | 'ENVIRONMENTAL'
  | 'LATEX'
  | 'OTHER';

export type AllergySeverity =
  | 'MILD'
  | 'MODERATE'
  | 'SEVERE'
  | 'LIFE_THREATENING';

/**
 * Payer source for authorization
 */
export interface PayerSource {
  payerType: PayerType;
  payerName: string;
  policyNumber?: string;
  groupNumber?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
}

export type PayerType =
  | 'MEDICARE'
  | 'MEDICAID'
  | 'PRIVATE_INSURANCE'
  | 'PRIVATE_PAY'
  | 'VA'
  | 'WORKERS_COMP'
  | 'OTHER';

/**
 * Plan modification tracking
 */
export interface PlanModification {
  id: UUID;
  modifiedAt: Timestamp;
  modifiedBy: UUID;
  modificationType: ModificationType;
  reason: string;
  description: string;
  changesApplied: Record<string, { from: unknown; to: unknown }>;
  approvedBy?: UUID;
  approvedAt?: Timestamp;
}

export type ModificationType =
  | 'GOAL_ADDED'
  | 'GOAL_MODIFIED'
  | 'GOAL_REMOVED'
  | 'INTERVENTION_ADDED'
  | 'INTERVENTION_MODIFIED'
  | 'INTERVENTION_REMOVED'
  | 'TASK_ADDED'
  | 'TASK_MODIFIED'
  | 'TASK_REMOVED'
  | 'FREQUENCY_CHANGED'
  | 'AUTHORIZATION_UPDATED'
  | 'PLAN_RENEWED'
  | 'PLAN_DISCONTINUED'
  | 'OTHER';

/**
 * Custom field definition
 */
export interface CustomField {
  id: UUID;
  name: string;
  fieldType: CustomFieldType;
  required: boolean;
  options?: string[]; // For select/radio/checkbox
  validation?: FieldValidation;
  defaultValue?: unknown;
  helpText?: string;
}

export type CustomFieldType =
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'TIME'
  | 'BOOLEAN'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'TEXTAREA'
  | 'RADIO'
  | 'CHECKBOX';

export interface FieldValidation {
  pattern?: string; // Regex pattern
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  customValidator?: string;
}

/**
 * Input types for API
 */

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

/**
 * Search and filter types
 */

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

/**
 * Analytics and reporting types
 */

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
  averageCompletionTime: number; // minutes
  tasksByCategory: Record<TaskCategory, number>;
  issuesReported: number;
}
