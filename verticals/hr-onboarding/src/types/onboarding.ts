/**
 * HR & Onboarding Types
 *
 * Defines types for employee onboarding, document management,
 * training, certifications, and compliance tracking.
 */

/**
 * Onboarding stages in the employee journey
 */
export enum OnboardingStage {
  NOT_STARTED = 'not_started',
  APPLICATION_SUBMITTED = 'application_submitted',
  BACKGROUND_CHECK_INITIATED = 'background_check_initiated',
  BACKGROUND_CHECK_COMPLETED = 'background_check_completed',
  DOCUMENTS_PENDING = 'documents_pending',
  DOCUMENTS_VERIFIED = 'documents_verified',
  TRAINING_SCHEDULED = 'training_scheduled',
  TRAINING_IN_PROGRESS = 'training_in_progress',
  TRAINING_COMPLETED = 'training_completed',
  ORIENTATION_SCHEDULED = 'orientation_scheduled',
  ORIENTATION_COMPLETED = 'orientation_completed',
  EQUIPMENT_PROVISIONING = 'equipment_provisioning',
  SYSTEM_ACCESS_SETUP = 'system_access_setup',
  ONBOARDING_COMPLETE = 'onboarding_complete',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled'
}

/**
 * Document types required for onboarding
 */
export enum DocumentType {
  // Identity & Eligibility
  GOVERNMENT_ID = 'government_id',
  SOCIAL_SECURITY_CARD = 'social_security_card',
  WORK_AUTHORIZATION = 'work_authorization',
  I9_FORM = 'i9_form',
  W4_FORM = 'w4_form',

  // Professional Credentials
  NURSING_LICENSE = 'nursing_license',
  CERTIFICATION = 'certification',
  PROFESSIONAL_REFERENCE = 'professional_reference',
  RESUME = 'resume',

  // Compliance & Background
  BACKGROUND_CHECK = 'background_check',
  DRUG_TEST = 'drug_test',
  TB_TEST = 'tb_test',
  IMMUNIZATION_RECORD = 'immunization_record',

  // Training
  TRAINING_CERTIFICATE = 'training_certificate',
  CPR_CERTIFICATION = 'cpr_certification',
  FIRST_AID = 'first_aid',

  // Banking & Payroll
  DIRECT_DEPOSIT_FORM = 'direct_deposit_form',

  // Company Policies
  HANDBOOK_ACKNOWLEDGMENT = 'handbook_acknowledgment',
  CONFIDENTIALITY_AGREEMENT = 'confidentiality_agreement',
  CODE_OF_CONDUCT = 'code_of_conduct',
  HIPAA_TRAINING = 'hipaa_training',

  // Emergency
  EMERGENCY_CONTACT = 'emergency_contact',

  // Other
  OTHER = 'other'
}

/**
 * Document verification status
 */
export enum DocumentStatus {
  NOT_SUBMITTED = 'not_submitted',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

/**
 * Background check types
 */
export enum BackgroundCheckType {
  CRIMINAL = 'criminal',
  EMPLOYMENT = 'employment',
  EDUCATION = 'education',
  CREDIT = 'credit',
  PROFESSIONAL_LICENSE = 'professional_license',
  REFERENCE = 'reference',
  DRUG_SCREENING = 'drug_screening',
  HEALTH_SCREENING = 'health_screening'
}

/**
 * Background check status
 */
export enum BackgroundCheckStatus {
  NOT_STARTED = 'not_started',
  INITIATED = 'initiated',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CLEARED = 'cleared',
  FLAGGED = 'flagged',
  FAILED = 'failed'
}

/**
 * Training types
 */
export enum TrainingType {
  ORIENTATION = 'orientation',
  COMPLIANCE = 'compliance',
  TECHNICAL = 'technical',
  SAFETY = 'safety',
  CLINICAL = 'clinical',
  SOFT_SKILLS = 'soft_skills',
  PRODUCT = 'product',
  SYSTEM = 'system',
  SPECIALTY = 'specialty',
  CONTINUING_EDUCATION = 'continuing_education'
}

/**
 * Training status
 */
export enum TrainingStatus {
  NOT_STARTED = 'not_started',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PASSED = 'passed',
  FAILED = 'failed',
  WAIVED = 'waived',
  EXPIRED = 'expired'
}

/**
 * Equipment/access provision status
 */
export enum ProvisionStatus {
  NOT_REQUIRED = 'not_required',
  REQUIRED = 'required',
  ORDERED = 'ordered',
  PROVISIONED = 'provisioned',
  SETUP_COMPLETE = 'setup_complete'
}

/**
 * Document record
 */
export interface OnboardingDocument {
  id: string;
  onboardingId: string;
  employeeId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  status: DocumentStatus;
  uploadedAt: Date;
  uploadedBy: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  expiresAt?: Date;
  rejectionReason?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Background check record
 */
export interface BackgroundCheck {
  id: string;
  onboardingId: string;
  employeeId: string;
  checkType: BackgroundCheckType;
  status: BackgroundCheckStatus;
  provider?: string;
  referenceNumber?: string;
  initiatedAt?: Date;
  initiatedBy?: string;
  completedAt?: Date;
  result?: 'clear' | 'flagged' | 'failed';
  findings?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Training record
 */
export interface Training {
  id: string;
  onboardingId: string;
  employeeId: string;
  trainingType: TrainingType;
  title: string;
  description?: string;
  provider?: string;
  status: TrainingStatus;
  required: boolean;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  score?: number;
  passingScore?: number;
  certificateUrl?: string;
  instructorId?: string;
  durationMinutes?: number;
  location?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Equipment provision record
 */
export interface EquipmentProvision {
  id: string;
  onboardingId: string;
  employeeId: string;
  itemType: string;
  itemName: string;
  description?: string;
  serialNumber?: string;
  status: ProvisionStatus;
  orderedAt?: Date;
  provisionedAt?: Date;
  returnRequired: boolean;
  returnedAt?: Date;
  assignedBy?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * System access record
 */
export interface SystemAccess {
  id: string;
  onboardingId: string;
  employeeId: string;
  systemName: string;
  accessLevel: string;
  status: ProvisionStatus;
  username?: string;
  requestedAt?: Date;
  grantedAt?: Date;
  grantedBy?: string;
  expiresAt?: Date;
  revokedAt?: Date;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Onboarding task
 */
export interface OnboardingTask {
  id: string;
  onboardingId: string;
  title: string;
  description?: string;
  category: 'document' | 'training' | 'background' | 'equipment' | 'access' | 'orientation' | 'other';
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: string;
  order: number;
  required: boolean;
  dependsOn?: string[]; // IDs of tasks that must be completed first
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Main onboarding record
 */
export interface OnboardingRecord {
  id: string;
  employeeId: string;
  caregiverId?: string; // Link to caregiver-staff vertical if applicable
  stage: OnboardingStage;
  startDate: Date;
  targetCompletionDate?: Date;
  actualCompletionDate?: Date;
  position: string;
  department?: string;
  hiringManager?: string;
  hrContact?: string;
  buddy?: string; // Onboarding buddy/mentor
  currentStageStartedAt?: Date;

  // Progress tracking
  documentsProgress: {
    total: number;
    submitted: number;
    verified: number;
  };
  backgroundChecksProgress: {
    total: number;
    completed: number;
    cleared: number;
  };
  trainingsProgress: {
    total: number;
    completed: number;
    passed: number;
  };
  tasksProgress: {
    total: number;
    completed: number;
  };
  overallProgress: number; // 0-100

  // Status flags
  isOnTrack: boolean;
  hasBlockers: boolean;
  blockers?: string[];

  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

/**
 * Onboarding template for different positions
 */
export interface OnboardingTemplate {
  id: string;
  name: string;
  position: string;
  department?: string;
  description?: string;
  isActive: boolean;

  // Required items
  requiredDocuments: DocumentType[];
  requiredBackgroundChecks: BackgroundCheckType[];
  requiredTrainings: {
    type: TrainingType;
    title: string;
    durationDays?: number;
  }[];

  // Equipment and access
  requiredEquipment: {
    itemType: string;
    itemName: string;
  }[];
  requiredSystemAccess: {
    systemName: string;
    accessLevel: string;
  }[];

  // Timeline
  targetDurationDays: number;

  // Tasks
  tasks: {
    title: string;
    description?: string;
    category: OnboardingTask['category'];
    dayOffset: number; // Days from start
    order: number;
    required: boolean;
  }[];

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Input types for creating records
 */
export interface CreateOnboardingRecordInput {
  employeeId: string;
  caregiverId?: string;
  position: string;
  department?: string;
  startDate: Date;
  targetCompletionDate?: Date;
  hiringManager?: string;
  hrContact?: string;
  buddy?: string;
  templateId?: string; // Optional template to use
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateOnboardingRecordInput {
  stage?: OnboardingStage;
  targetCompletionDate?: Date;
  actualCompletionDate?: Date;
  hiringManager?: string;
  hrContact?: string;
  buddy?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateDocumentInput {
  onboardingId: string;
  employeeId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  expiresAt?: Date;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateBackgroundCheckInput {
  onboardingId: string;
  employeeId: string;
  checkType: BackgroundCheckType;
  provider?: string;
  referenceNumber?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateTrainingInput {
  onboardingId: string;
  employeeId: string;
  trainingType: TrainingType;
  title: string;
  description?: string;
  provider?: string;
  required: boolean;
  scheduledAt?: Date;
  durationMinutes?: number;
  passingScore?: number;
  location?: string;
  instructorId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateTaskInput {
  onboardingId: string;
  title: string;
  description?: string;
  category: OnboardingTask['category'];
  assignedTo?: string;
  dueDate?: Date;
  order: number;
  required: boolean;
  dependsOn?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
}
