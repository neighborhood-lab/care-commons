/**
 * Care Notes & Progress Reporting domain model
 *
 * Comprehensive documentation and reporting system:
 * - Visit notes and progress documentation
 * - Incident reports and change in condition
 * - Progress tracking and outcome measurement
 * - Report generation and analytics
 * - Compliance and regulatory reporting
 */

import {
  Entity,
  SoftDeletable,
  UUID,
  Timestamp,
} from '@care-commons/core';

/**
 * Care Note - Primary documentation of care activities
 */
export interface CareNote extends Entity, SoftDeletable {
  // References
  clientId: UUID;
  caregiverId: UUID;
  visitId?: UUID;
  carePlanId?: UUID;
  organizationId: UUID;
  branchId?: UUID;

  // Note identification
  noteNumber: string; // Human-readable identifier
  noteType: CareNoteType;
  priority: NotePriority;
  status: NoteStatus;

  // Timing
  visitDate: Date;
  visitStartTime?: string; // HH:MM
  visitEndTime?: string; // HH:MM
  noteDate: Timestamp;

  // Author information
  authorId: UUID;
  authorName: string;
  authorRole: CaregiverRole;
  authorSignature?: Signature;

  // Content
  title: string;
  content: string;
  structuredContent?: StructuredNoteContent;

  // Observations and assessments
  observations?: Observation[];
  vitalSigns?: VitalSigns;
  painAssessment?: PainAssessment;
  moodAssessment?: MoodAssessment;

  // Care activities performed
  activitiesPerformed?: ActivityPerformed[];
  tasksCompleted?: UUID[]; // Task IDs
  interventionsProvided?: UUID[]; // Intervention IDs

  // Client condition
  clientCondition?: ClientCondition;
  changeInCondition?: boolean;
  changeDescription?: string;

  // Concerns and alerts
  concerns?: Concern[];
  alerts?: Alert[];
  followUpRequired?: boolean;
  followUpInstructions?: string;

  // Medications
  medicationsAdministered?: MedicationRecord[];
  medicationChanges?: string[];

  // Communication
  familyCommunication?: FamilyCommunication[];
  physicianCommunication?: PhysicianCommunication[];

  // Goals and progress
  goalProgress?: GoalProgress[];
  progressSummary?: string;

  // Attachments and media
  attachments?: Attachment[];
  photos?: Photo[];

  // Review and approval
  reviewedBy?: UUID;
  reviewedAt?: Timestamp;
  reviewStatus: ReviewStatus;
  reviewComments?: string;
  approvedBy?: UUID;
  approvedAt?: Timestamp;

  // Compliance
  complianceCheckStatus: ComplianceStatus;
  requiredFields?: string[];
  missingFields?: string[];
  lastComplianceCheck?: Timestamp;

  // Additional metadata
  tags?: string[];
  categories?: string[];
  isPrivate?: boolean;
  isConfidential?: boolean;
  needsAttention?: boolean;
  customFields?: Record<string, unknown>;
}

export type CareNoteType =
  | 'VISIT_NOTE'
  | 'DAILY_NOTE'
  | 'SHIFT_NOTE'
  | 'INCIDENT_REPORT'
  | 'CHANGE_IN_CONDITION'
  | 'PROGRESS_NOTE'
  | 'ASSESSMENT_NOTE'
  | 'COMMUNICATION_NOTE'
  | 'ADMISSION_NOTE'
  | 'DISCHARGE_NOTE'
  | 'TRANSFER_NOTE'
  | 'MEDICATION_NOTE'
  | 'SAFETY_NOTE'
  | 'BEHAVIORAL_NOTE'
  | 'OTHER';

export type NotePriority =
  | 'ROUTINE'
  | 'IMPORTANT'
  | 'URGENT'
  | 'CRITICAL';

export type NoteStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'REVIEWED'
  | 'APPROVED'
  | 'REJECTED'
  | 'AMENDED'
  | 'LOCKED';

export type ReviewStatus =
  | 'NOT_REVIEWED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEEDS_REVISION';

export type ComplianceStatus =
  | 'COMPLIANT'
  | 'INCOMPLETE'
  | 'NON_COMPLIANT'
  | 'NEEDS_REVIEW';

export type CaregiverRole =
  | 'CAREGIVER'
  | 'CNA'
  | 'HHA'
  | 'LPN'
  | 'RN'
  | 'THERAPIST'
  | 'AIDE'
  | 'COORDINATOR'
  | 'SUPERVISOR'
  | 'OTHER';

/**
 * Structured Note Content - Template-based structured documentation
 */
export interface StructuredNoteContent {
  // ADL Assessment
  adlAssessment?: ADLAssessment;

  // IADL Assessment
  iadlAssessment?: IADLAssessment;

  // Physical assessment
  physicalAssessment?: PhysicalAssessment;

  // Cognitive assessment
  cognitiveAssessment?: CognitiveAssessment;

  // Safety assessment
  safetyAssessment?: SafetyAssessment;

  // Environmental assessment
  environmentalAssessment?: EnvironmentalAssessment;

  // Narrative sections
  narrative?: NarrativeSections;
}

export interface ADLAssessment {
  bathing?: AssessmentLevel;
  dressing?: AssessmentLevel;
  grooming?: AssessmentLevel;
  toileting?: AssessmentLevel;
  continence?: AssessmentLevel;
  feeding?: AssessmentLevel;
  mobility?: AssessmentLevel;
  transferring?: AssessmentLevel;
  notes?: string;
}

export interface IADLAssessment {
  mealPreparation?: AssessmentLevel;
  housekeeping?: AssessmentLevel;
  laundry?: AssessmentLevel;
  shopping?: AssessmentLevel;
  phoneUse?: AssessmentLevel;
  medicationManagement?: AssessmentLevel;
  financialManagement?: AssessmentLevel;
  transportation?: AssessmentLevel;
  notes?: string;
}

export type AssessmentLevel =
  | 'INDEPENDENT'
  | 'REQUIRES_CUEING'
  | 'REQUIRES_ASSISTANCE'
  | 'REQUIRES_SUPERVISION'
  | 'DEPENDENT'
  | 'NOT_ASSESSED'
  | 'NOT_APPLICABLE';

export interface PhysicalAssessment {
  overallAppearance?: string;
  skinCondition?: string;
  mobility?: string;
  balance?: string;
  strength?: string;
  coordination?: string;
  notes?: string;
}

export interface CognitiveAssessment {
  orientation?: OrientationLevel;
  memory?: MemoryLevel;
  communication?: CommunicationLevel;
  decisionMaking?: DecisionMakingLevel;
  followsDirections?: boolean;
  notes?: string;
}

export type OrientationLevel =
  | 'ORIENTED_X4' // Person, place, time, situation
  | 'ORIENTED_X3' // Person, place, time
  | 'ORIENTED_X2' // Person, place
  | 'ORIENTED_X1' // Person only
  | 'DISORIENTED';

export type MemoryLevel =
  | 'INTACT'
  | 'MILD_IMPAIRMENT'
  | 'MODERATE_IMPAIRMENT'
  | 'SEVERE_IMPAIRMENT';

export type CommunicationLevel =
  | 'CLEAR'
  | 'SOME_DIFFICULTY'
  | 'SIGNIFICANT_DIFFICULTY'
  | 'UNABLE_TO_COMMUNICATE';

export type DecisionMakingLevel =
  | 'INDEPENDENT'
  | 'REQUIRES_SUPPORT'
  | 'IMPAIRED'
  | 'UNABLE';

export interface SafetyAssessment {
  fallRisk?: RiskLevel;
  wanderingRisk?: RiskLevel;
  elopementRisk?: RiskLevel;
  selfHarmRisk?: RiskLevel;
  medicationSafetyRisk?: RiskLevel;
  environmentalHazards?: string[];
  safetyInterventions?: string[];
  notes?: string;
}

export type RiskLevel =
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'CRITICAL';

export interface EnvironmentalAssessment {
  homeCondition?: HomeCondition;
  cleanliness?: string;
  temperature?: number;
  lighting?: string;
  accessibility?: string;
  safetyHazards?: string[];
  notes?: string;
}

export type HomeCondition =
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'POOR'
  | 'UNSAFE';

export interface NarrativeSections {
  subjective?: string; // What the client reports
  objective?: string; // What the caregiver observes
  assessment?: string; // Caregiver's professional assessment
  plan?: string; // Plan of care modifications or recommendations
  education?: string; // Education provided to client/family
  response?: string; // Client response to care provided
}

/**
 * Observation - Specific observation during care
 */
export interface Observation {
  id: UUID;
  category: ObservationCategory;
  type: ObservationType;
  observation: string;
  severity?: Severity;
  timestamp: Timestamp;
  actionTaken?: string;
  followUpRequired?: boolean;
  reportedTo?: UUID[];
  notes?: string;
}

export type ObservationCategory =
  | 'PHYSICAL'
  | 'COGNITIVE'
  | 'EMOTIONAL'
  | 'BEHAVIORAL'
  | 'SOCIAL'
  | 'ENVIRONMENTAL'
  | 'SAFETY'
  | 'MEDICATION'
  | 'NUTRITION'
  | 'HYGIENE';

export type ObservationType =
  | 'NORMAL'
  | 'CHANGE'
  | 'CONCERN'
  | 'IMPROVEMENT'
  | 'DECLINE';

export type Severity =
  | 'NORMAL'
  | 'MILD'
  | 'MODERATE'
  | 'SEVERE'
  | 'CRITICAL';

/**
 * Vital Signs
 */
export interface VitalSigns {
  id?: UUID;
  takenAt: Timestamp;
  takenBy: UUID;

  // Measurements
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  temperatureUnit?: 'F' | 'C';
  oxygenSaturation?: number;
  bloodGlucose?: number;
  weight?: number;
  weightUnit?: 'LBS' | 'KG';
  height?: number;
  heightUnit?: 'IN' | 'CM';

  // Additional metrics
  bmi?: number;
  pain?: number; // 0-10 scale
  pulseRegularity?: 'REGULAR' | 'IRREGULAR';
  respirationQuality?: 'NORMAL' | 'LABORED' | 'SHALLOW';

  // Method and location
  bloodPressurePosition?: 'SITTING' | 'STANDING' | 'LYING';
  bloodPressureArm?: 'LEFT' | 'RIGHT';
  temperatureMethod?: 'ORAL' | 'TYMPANIC' | 'TEMPORAL' | 'AXILLARY' | 'RECTAL';

  // Notes and alerts
  notes?: string;
  alerts?: string[];
  outOfRange?: boolean;
  criticalValues?: string[];

  // Verification
  verifiedBy?: UUID;
  verifiedAt?: Timestamp;
}

/**
 * Pain Assessment
 */
export interface PainAssessment {
  painLevel: number; // 0-10 scale
  painLocation?: string[];
  painType?: PainType[];
  painFrequency?: PainFrequency;
  painDuration?: string;
  onsetDate?: Date;
  triggers?: string[];
  relievingFactors?: string[];
  currentMedications?: string[];
  interventionsTried?: string[];
  interventionsEffective?: boolean;
  impactOnADL?: string;
  impactOnSleep?: string;
  impactOnMood?: string;
  notes?: string;
}

export type PainType =
  | 'SHARP'
  | 'DULL'
  | 'ACHING'
  | 'BURNING'
  | 'STABBING'
  | 'THROBBING'
  | 'CRAMPING'
  | 'SHOOTING';

export type PainFrequency =
  | 'CONSTANT'
  | 'INTERMITTENT'
  | 'OCCASIONAL'
  | 'RARE';

/**
 * Mood Assessment
 */
export interface MoodAssessment {
  overallMood?: MoodType;
  anxietyLevel?: number; // 0-10 scale
  depressionIndicators?: boolean;
  agitationLevel?: number; // 0-10 scale
  cooperationLevel?: CooperationLevel;
  socialEngagement?: SocialEngagement;
  appetite?: AppetiteLevel;
  sleepQuality?: SleepQuality;
  concerningBehaviors?: string[];
  positiveObservations?: string[];
  interventionsUsed?: string[];
  notes?: string;
}

export type MoodType =
  | 'HAPPY'
  | 'CONTENT'
  | 'CALM'
  | 'NEUTRAL'
  | 'ANXIOUS'
  | 'SAD'
  | 'IRRITABLE'
  | 'AGITATED'
  | 'WITHDRAWN'
  | 'CONFUSED';

export type CooperationLevel =
  | 'FULLY_COOPERATIVE'
  | 'MOSTLY_COOPERATIVE'
  | 'SOMEWHAT_COOPERATIVE'
  | 'MINIMALLY_COOPERATIVE'
  | 'UNCOOPERATIVE';

export type SocialEngagement =
  | 'ENGAGED'
  | 'RESPONSIVE'
  | 'LIMITED'
  | 'WITHDRAWN'
  | 'ISOLATED';

export type AppetiteLevel =
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'POOR'
  | 'REFUSED';

export type SleepQuality =
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'POOR'
  | 'VERY_POOR';

/**
 * Activity Performed
 */
export interface ActivityPerformed {
  id: UUID;
  category: ActivityCategory;
  activity: string;
  startTime?: string;
  endTime?: string;
  duration?: number; // minutes
  completionStatus: CompletionStatus;
  clientParticipation?: ParticipationLevel;
  notes?: string;
}

export type ActivityCategory =
  | 'PERSONAL_CARE'
  | 'MEAL_PREPARATION'
  | 'FEEDING'
  | 'MEDICATION'
  | 'MOBILITY'
  | 'EXERCISE'
  | 'HOUSEKEEPING'
  | 'LAUNDRY'
  | 'SHOPPING'
  | 'TRANSPORTATION'
  | 'COMPANIONSHIP'
  | 'RECREATION'
  | 'THERAPY'
  | 'MONITORING'
  | 'OTHER';

export type CompletionStatus =
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'NOT_COMPLETED'
  | 'REFUSED'
  | 'UNABLE';

export type ParticipationLevel =
  | 'FULL_PARTICIPATION'
  | 'ACTIVE_PARTICIPATION'
  | 'PASSIVE_PARTICIPATION'
  | 'MINIMAL_PARTICIPATION'
  | 'NO_PARTICIPATION'
  | 'REFUSED';

/**
 * Client Condition
 */
export interface ClientCondition {
  overallCondition: OverallCondition;
  alertness?: Alertness;
  mobility?: Mobility;
  skinIntegrity?: SkinIntegrity;
  hydrationStatus?: HydrationStatus;
  nutritionStatus?: NutritionStatus;
  painManagement?: PainManagement;
  respiratoryStatus?: RespiratoryStatus;
  cardiovascularStatus?: string;
  musculoskeletalStatus?: string;
  gastrointestinalStatus?: string;
  genitourinaryStatus?: string;
  neurologicalStatus?: string;
  psychosocialStatus?: string;
  notes?: string;
}

export type OverallCondition =
  | 'STABLE'
  | 'IMPROVING'
  | 'DECLINING'
  | 'CRITICAL'
  | 'UNCHANGED';

export type Alertness =
  | 'ALERT'
  | 'DROWSY'
  | 'LETHARGIC'
  | 'OBTUNDED'
  | 'STUPOROUS'
  | 'COMATOSE';

export type Mobility =
  | 'AMBULATORY'
  | 'AMBULATORY_WITH_ASSIST'
  | 'WHEELCHAIR_DEPENDENT'
  | 'BEDBOUND'
  | 'LIMITED';

export type SkinIntegrity =
  | 'INTACT'
  | 'AT_RISK'
  | 'PRESSURE_INJURY_STAGE_1'
  | 'PRESSURE_INJURY_STAGE_2'
  | 'PRESSURE_INJURY_STAGE_3'
  | 'PRESSURE_INJURY_STAGE_4'
  | 'UNSTAGEABLE'
  | 'OTHER_WOUND';

export type HydrationStatus =
  | 'WELL_HYDRATED'
  | 'ADEQUATE'
  | 'AT_RISK'
  | 'DEHYDRATED';

export type NutritionStatus =
  | 'WELL_NOURISHED'
  | 'ADEQUATE'
  | 'AT_RISK'
  | 'MALNOURISHED';

export type PainManagement =
  | 'CONTROLLED'
  | 'WELL_MANAGED'
  | 'NEEDS_ADJUSTMENT'
  | 'UNCONTROLLED';

export type RespiratoryStatus =
  | 'NORMAL'
  | 'SHORTNESS_OF_BREATH'
  | 'LABORED'
  | 'OXYGEN_REQUIRED'
  | 'RESPIRATORY_DISTRESS';

/**
 * Concern - Issue requiring attention
 */
export interface Concern {
  id: UUID;
  type: ConcernType;
  severity: Severity;
  description: string;
  identifiedAt: Timestamp;
  identifiedBy: UUID;
  reportedTo?: UUID[];
  reportedAt?: Timestamp;
  actionTaken?: string;
  resolution?: string;
  resolvedAt?: Timestamp;
  status: ConcernStatus;
  followUpRequired?: boolean;
  followUpDate?: Date;
  notes?: string;
}

export type ConcernType =
  | 'MEDICAL'
  | 'SAFETY'
  | 'BEHAVIORAL'
  | 'MEDICATION'
  | 'NUTRITION'
  | 'HYGIENE'
  | 'ENVIRONMENTAL'
  | 'PSYCHOSOCIAL'
  | 'ABUSE_NEGLECT'
  | 'OTHER';

export type ConcernStatus =
  | 'NEW'
  | 'REPORTED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'ESCALATED';

/**
 * Alert - System or clinical alert
 */
export interface Alert {
  id: UUID;
  alertType: AlertType;
  severity: Severity;
  message: string;
  triggeredAt: Timestamp;
  acknowledgedBy?: UUID;
  acknowledgedAt?: Timestamp;
  dismissed?: boolean;
  dismissedBy?: UUID;
  dismissedAt?: Timestamp;
  actionRequired?: string;
  actionTaken?: string;
  notes?: string;
}

export type AlertType =
  | 'VITAL_SIGNS'
  | 'MEDICATION'
  | 'FALL'
  | 'CHANGE_IN_CONDITION'
  | 'MISSED_VISIT'
  | 'DOCUMENTATION'
  | 'COMPLIANCE'
  | 'SAFETY'
  | 'OTHER';

/**
 * Medication Record
 */
export interface MedicationRecord {
  id: UUID;
  medicationName: string;
  dosage: string;
  route: MedicationRoute;
  frequency: string;
  scheduledTime?: string;
  administeredAt: Timestamp;
  administeredBy: UUID;
  administeredByName: string;
  reason?: string;
  prn?: boolean; // As needed
  effectiveness?: string;
  sideEffects?: string;
  refused?: boolean;
  refusalReason?: string;
  notes?: string;
  signature?: Signature;
}

export type MedicationRoute =
  | 'ORAL'
  | 'SUBLINGUAL'
  | 'TOPICAL'
  | 'TRANSDERMAL'
  | 'INHALATION'
  | 'INJECTION_IM'
  | 'INJECTION_SC'
  | 'INJECTION_IV'
  | 'RECTAL'
  | 'OPHTHALMIC'
  | 'OTIC'
  | 'NASAL'
  | 'OTHER';

/**
 * Family Communication
 */
export interface FamilyCommunication {
  id: UUID;
  familyMemberId?: UUID;
  familyMemberName: string;
  relationship?: string;
  communicationMethod: CommunicationMethod;
  communicationDate: Timestamp;
  initiatedBy: InitiatedBy;
  topic: string;
  summary: string;
  concerns?: string[];
  questionsAsked?: string[];
  informationProvided?: string[];
  followUpNeeded?: boolean;
  followUpDate?: Date;
  notes?: string;
}

export type CommunicationMethod =
  | 'IN_PERSON'
  | 'PHONE'
  | 'EMAIL'
  | 'TEXT'
  | 'VIDEO_CALL'
  | 'PORTAL'
  | 'OTHER';

export type InitiatedBy =
  | 'FAMILY'
  | 'CAREGIVER'
  | 'COORDINATOR'
  | 'NURSE'
  | 'SUPERVISOR';

/**
 * Physician Communication
 */
export interface PhysicianCommunication {
  id: UUID;
  physicianId?: UUID;
  physicianName: string;
  communicationMethod: CommunicationMethod;
  communicationDate: Timestamp;
  initiatedBy: InitiatedBy;
  reason: string;
  summary: string;
  ordersReceived?: string[];
  recommendationsReceived?: string[];
  followUpRequired?: boolean;
  followUpDate?: Date;
  notes?: string;
}

/**
 * Goal Progress
 */
export interface GoalProgress {
  goalId: UUID;
  goalName: string;
  status: GoalStatus;
  progressDescription: string;
  progressPercentage?: number;
  measurementValue?: number;
  measurementUnit?: string;
  barriers?: string[];
  facilitators?: string[];
  interventionsWorking?: string[];
  interventionsNotWorking?: string[];
  nextSteps?: string[];
  targetDate?: Date;
  notes?: string;
}

export type GoalStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'ACHIEVED'
  | 'PARTIALLY_ACHIEVED'
  | 'NOT_ACHIEVED'
  | 'DISCONTINUED';

/**
 * Attachment
 */
export interface Attachment {
  id: UUID;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: UUID;
  uploadedAt: Timestamp;
  description?: string;
  category?: AttachmentCategory;
}

export type AttachmentCategory =
  | 'DOCUMENT'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'FORM'
  | 'REPORT'
  | 'OTHER';

/**
 * Photo
 */
export interface Photo {
  id: UUID;
  photoUrl: string;
  thumbnail?: string;
  caption?: string;
  category?: PhotoCategory;
  takenAt: Timestamp;
  takenBy: UUID;
  location?: string;
  requiresConsent?: boolean;
  consentObtained?: boolean;
}

export type PhotoCategory =
  | 'WOUND'
  | 'SKIN_CONDITION'
  | 'ENVIRONMENT'
  | 'SAFETY_HAZARD'
  | 'MEDICATION'
  | 'ACTIVITY'
  | 'EQUIPMENT'
  | 'OTHER';

/**
 * Signature
 */
export interface Signature {
  signatureData: string; // Base64 encoded signature image or digital signature
  signedBy: UUID;
  signedByName: string;
  signedByRole: string;
  signedAt: Timestamp;
  signatureType: SignatureType;
  ipAddress?: string;
  deviceInfo?: string;
  location?: GeoLocation;
}

export type SignatureType =
  | 'ELECTRONIC'
  | 'STYLUS'
  | 'TOUCHSCREEN'
  | 'DIGITAL_CERTIFICATE'
  | 'BIOMETRIC';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Timestamp;
}

/**
 * Input types for API
 */

export interface CreateCareNoteInput {
  clientId: UUID;
  caregiverId: UUID;
  visitId?: UUID;
  carePlanId?: UUID;
  organizationId: UUID;
  branchId?: UUID;
  noteType: CareNoteType;
  visitDate: Date;
  visitStartTime?: string;
  visitEndTime?: string;
  title: string;
  content: string;
  structuredContent?: StructuredNoteContent;
  observations?: Omit<Observation, 'id'>[];
  vitalSigns?: VitalSigns;
  activitiesPerformed?: Omit<ActivityPerformed, 'id'>[];
  concerns?: Omit<Concern, 'id'>[];
  signature?: Omit<Signature, 'signedAt'>;
}

export interface UpdateCareNoteInput {
  title?: string;
  content?: string;
  structuredContent?: StructuredNoteContent;
  observations?: Observation[];
  vitalSigns?: VitalSigns;
  activitiesPerformed?: ActivityPerformed[];
  concerns?: Concern[];
  status?: NoteStatus;
  tags?: string[];
}

export interface ReviewCareNoteInput {
  reviewStatus: ReviewStatus;
  reviewComments?: string;
}

export interface CreateIncidentReportInput extends CreateCareNoteInput {
  incidentType: IncidentType;
  incidentSeverity: Severity;
  incidentDate: Date;
  incidentTime: string;
  incidentLocation: string;
  incidentDescription: string;
  witnessIds?: UUID[];
  immediateActionTaken: string;
  notifiedParties: NotifiedParty[];
  injuryOccurred?: boolean;
  injuryDescription?: string;
  medicalAttentionRequired?: boolean;
  equipmentInvolved?: string;
  environmentalFactors?: string[];
  contributingFactors?: string[];
  preventionRecommendations?: string[];
}

export type IncidentType =
  | 'FALL'
  | 'MEDICATION_ERROR'
  | 'INJURY'
  | 'ELOPEMENT'
  | 'BEHAVIORAL'
  | 'EQUIPMENT_FAILURE'
  | 'PROPERTY_DAMAGE'
  | 'ABUSE_ALLEGATION'
  | 'NEGLECT_ALLEGATION'
  | 'ENVIRONMENTAL'
  | 'OTHER';

export interface NotifiedParty {
  role: string;
  name: string;
  id?: UUID;
  notifiedAt: Timestamp;
  notificationMethod: CommunicationMethod;
}

/**
 * Search and filter types
 */

export interface CareNoteSearchFilters {
  query?: string;
  clientId?: UUID;
  caregiverId?: UUID;
  organizationId?: UUID;
  branchId?: UUID;
  noteType?: CareNoteType[];
  status?: NoteStatus[];
  priority?: NotePriority[];
  reviewStatus?: ReviewStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  needsReview?: boolean;
  hasAlerts?: boolean;
  hasConcerns?: boolean;
  changeInCondition?: boolean;
  tags?: string[];
}

/**
 * Analytics and reporting types
 */

export interface CareNoteAnalytics {
  totalNotes: number;
  notesByType: Record<CareNoteType, number>;
  notesRequiringReview: number;
  averageNotesPerClient: number;
  averageNotesPerCaregiver: number;
  complianceRate: number;
  reviewCompletionRate: number;
  incidentCount: number;
  concernCount: number;
  alertCount: number;
  changeInConditionCount: number;
}

export interface ProgressReport {
  id: UUID;
  reportType: ProgressReportType;
  clientId: UUID;
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Timestamp;
  generatedBy: UUID;

  // Summary metrics
  totalVisits: number;
  totalHours: number;
  notesCount: number;
  goalsReviewed: number;

  // Progress summary
  overallProgress: string;
  goalProgress: GoalProgress[];
  keyAchievements?: string[];
  challenges?: string[];
  recommendations?: string[];

  // Assessments
  adlSummary?: string;
  healthStatusSummary?: string;
  behavioralSummary?: string;
  socialSummary?: string;

  // Concerns and alerts
  concernsSummary?: string;
  incidentsSummary?: string;

  // Plan updates
  planModifications?: string[];
  newGoals?: string[];
  discontinuedGoals?: string[];

  // Signatures
  preparedBySignature?: Signature;
  reviewedBySignature?: Signature;

  // Metadata
  reportData?: Record<string, unknown>;
  attachments?: Attachment[];
}

export type ProgressReportType =
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUAL'
  | 'AD_HOC'
  | 'REGULATORY'
  | 'PAYER'
  | 'FAMILY';
