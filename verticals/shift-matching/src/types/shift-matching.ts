/**
 * Shift Matching & Assignment domain model
 * 
 * Intelligent matching of available caregivers to open shifts based on:
 * - Skills and certifications
 * - Preferences and history
 * - Proximity and travel constraints
 * - Availability and schedule conflicts
 * - Client requirements and restrictions
 * 
 * Key concepts:
 * - Open Shift: Unassigned visit needing caregiver assignment
 * - Match Candidate: Caregiver eligible for a shift with scored fit
 * - Match Score: Quantified suitability (0-100 scale)
 * - Assignment Proposal: System-generated suggestion awaiting action
 * - Bulk Match: Multi-shift optimization across time period
 */

import {
  Entity,
  SoftDeletable,
  UUID,
  Timestamp,
} from '@care-commons/core';

/**
 * Open Shift - Unassigned visit needing caregiver
 * 
 * Represents a visit that requires assignment, either newly created
 * or vacated due to caregiver unavailability, rejection, or reassignment.
 */
export interface OpenShift extends Entity {
  organizationId: UUID;
  branchId: UUID;
  
  // Visit reference
  visitId: UUID;
  clientId: UUID;
  
  // Shift details
  scheduledDate: Date;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  duration: number; // Minutes
  timezone: string;
  
  // Service requirements
  serviceTypeId: UUID;
  serviceTypeName: string;
  taskIds?: UUID[];
  requiredSkills?: string[];
  requiredCertifications?: string[];
  
  // Client preferences and restrictions
  preferredCaregivers?: UUID[];
  blockedCaregivers?: UUID[];
  genderPreference?: 'MALE' | 'FEMALE' | 'NO_PREFERENCE';
  languagePreference?: string;
  
  // Location
  address: ShiftAddress;
  latitude?: number;
  longitude?: number;
  
  // Priority and urgency
  priority: ShiftPriority;
  isUrgent: boolean;
  fillByDate?: Timestamp; // Must be assigned by this time
  
  // Matching metadata
  matchingStatus: MatchingStatus;
  lastMatchedAt?: Timestamp;
  matchAttempts: number;
  
  // Assignment tracking
  proposedAssignments?: UUID[]; // Assignment proposal IDs
  rejectedCaregivers?: UUID[]; // Caregivers who rejected this shift
  
  // Metadata
  clientInstructions?: string;
  internalNotes?: string;
  tags?: string[];
}

export type ShiftPriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'CRITICAL';

export type MatchingStatus =
  | 'NEW' // Just created, not yet matched
  | 'MATCHING' // Currently being processed
  | 'MATCHED' // Candidates found, proposals generated
  | 'PROPOSED' // Proposal sent to caregiver(s)
  | 'ASSIGNED' // Successfully assigned
  | 'NO_MATCH' // No eligible caregivers found
  | 'EXPIRED'; // Fill-by date passed

export interface ShiftAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  accessInstructions?: string;
}

/**
 * Match Candidate - Scored caregiver eligibility
 * 
 * Represents a caregiver evaluated for a specific shift with detailed
 * scoring across multiple dimensions. Not persisted - generated on-demand.
 */
export interface MatchCandidate {
  caregiverId: UUID;
  openShiftId: UUID;
  
  // Caregiver info snapshot
  caregiverName: string;
  caregiverPhone: string;
  employmentType: string;
  
  // Overall scoring
  overallScore: number; // 0-100, weighted composite
  matchQuality: MatchQuality;
  
  // Dimensional scores
  scores: MatchScores;
  
  // Eligibility checks
  isEligible: boolean;
  eligibilityIssues: EligibilityIssue[];
  warnings: string[];
  
  // Distance and travel
  distanceFromShift?: number; // Miles
  estimatedTravelTime?: number; // Minutes
  
  // Schedule analysis
  hasConflict: boolean;
  conflictingVisits?: ConflictingVisit[];
  availableHours: number; // Remaining available hours this week
  
  // History and relationship
  previousVisitsWithClient?: number;
  clientRating?: number; // 1-5 if rated by this client
  reliabilityScore?: number; // Overall reliability metric
  
  // Why this match
  matchReasons: MatchReason[];
  
  // Computed at
  computedAt: Timestamp;
}

export type MatchQuality =
  | 'EXCELLENT' // 85-100
  | 'GOOD' // 70-84
  | 'FAIR' // 50-69
  | 'POOR' // 0-49
  | 'INELIGIBLE'; // Cannot be assigned

/**
 * Match Scores - Dimensional scoring breakdown
 */
export interface MatchScores {
  skillMatch: number; // 0-100: Has required skills/certs
  availabilityMatch: number; // 0-100: Free during shift time
  proximityMatch: number; // 0-100: Distance to client
  preferenceMatch: number; // 0-100: Aligns with preferences
  experienceMatch: number; // 0-100: History with client/service
  reliabilityMatch: number; // 0-100: Historical performance
  complianceMatch: number; // 0-100: Credentials current
  capacityMatch: number; // 0-100: Not over hour limits
}

export interface EligibilityIssue {
  type: EligibilityIssueType;
  severity: 'BLOCKING' | 'WARNING';
  message: string;
  field?: string;
}

export type EligibilityIssueType =
  | 'MISSING_SKILL'
  | 'MISSING_CERTIFICATION'
  | 'EXPIRED_CREDENTIAL'
  | 'SCHEDULE_CONFLICT'
  | 'BLOCKED_BY_CLIENT'
  | 'DISTANCE_TOO_FAR'
  | 'OVER_HOUR_LIMIT'
  | 'UNAVAILABLE'
  | 'NOT_COMPLIANT'
  | 'GENDER_MISMATCH'
  | 'LANGUAGE_MISMATCH';

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

export type MatchReasonCategory =
  | 'SKILL'
  | 'EXPERIENCE'
  | 'PREFERENCE'
  | 'AVAILABILITY'
  | 'PROXIMITY'
  | 'RELIABILITY'
  | 'CLIENT_REQUEST'
  | 'SYSTEM_OPTIMIZED';

/**
 * Assignment Proposal - Suggested caregiver-shift pairing
 * 
 * Generated by matching algorithm, awaiting acceptance or rejection
 * by caregiver and/or scheduler.
 */
export interface AssignmentProposal extends Entity, SoftDeletable {
  organizationId: UUID;
  branchId: UUID;
  
  // Assignment details
  openShiftId: UUID;
  visitId: UUID;
  caregiverId: UUID;
  
  // Match quality
  matchScore: number;
  matchQuality: MatchQuality;
  matchReasons: MatchReason[];
  
  // Proposal lifecycle
  proposalStatus: ProposalStatus;
  proposedBy: UUID; // System or user ID
  proposedAt: Timestamp;
  proposalMethod: 'AUTOMATIC' | 'MANUAL' | 'CAREGIVER_SELF_SELECT';
  
  // Response tracking
  sentToCaregiver: boolean;
  sentAt?: Timestamp;
  notificationMethod?: NotificationMethod;
  
  viewedByCaregiver: boolean;
  viewedAt?: Timestamp;
  
  respondedAt?: Timestamp;
  responseMethod?: 'MOBILE' | 'WEB' | 'PHONE' | 'IN_PERSON';
  
  // Decision
  acceptedAt?: Timestamp;
  acceptedBy?: UUID; // Could be caregiver or scheduler
  
  rejectedAt?: Timestamp;
  rejectedBy?: UUID;
  rejectionReason?: string;
  rejectionCategory?: RejectionCategory;
  
  expiredAt?: Timestamp;
  
  // Priority for caregiver
  isPreferred: boolean; // Preferred by client or past history
  urgencyFlag: boolean; // Needs immediate response
  
  // Metadata
  notes?: string;
  internalNotes?: string;
}

export type ProposalStatus =
  | 'PENDING' // Waiting for response
  | 'SENT' // Notification sent to caregiver
  | 'VIEWED' // Caregiver viewed the proposal
  | 'ACCEPTED' // Caregiver accepted
  | 'REJECTED' // Caregiver rejected
  | 'EXPIRED' // Response window closed
  | 'SUPERSEDED' // Replaced by better match
  | 'WITHDRAWN'; // Scheduler withdrew proposal

export type NotificationMethod =
  | 'PUSH'
  | 'SMS'
  | 'EMAIL'
  | 'PHONE_CALL'
  | 'IN_APP';

export type RejectionCategory =
  | 'TOO_FAR'
  | 'TIME_CONFLICT'
  | 'PERSONAL_REASON'
  | 'PREFER_DIFFERENT_CLIENT'
  | 'RATE_TOO_LOW'
  | 'ALREADY_BOOKED'
  | 'NOT_INTERESTED'
  | 'OTHER';

/**
 * Matching Configuration - Rules and weights for scoring
 * 
 * Configurable per organization/branch to tune matching behavior.
 */
export interface MatchingConfiguration extends Entity {
  organizationId: UUID;
  branchId?: UUID; // Null for org-wide default
  
  name: string;
  description?: string;
  
  // Score weights (must sum to 100)
  weights: MatchWeights;
  
  // Constraints
  maxTravelDistance?: number; // Miles
  maxTravelTime?: number; // Minutes
  requireExactSkillMatch: boolean;
  requireActiveCertifications: boolean;
  respectGenderPreference: boolean;
  respectLanguagePreference: boolean;
  
  // Matching behavior
  autoAssignThreshold?: number; // Auto-assign if score >= this
  minScoreForProposal: number; // Don't propose below this score
  maxProposalsPerShift: number; // Limit concurrent proposals
  proposalExpirationMinutes: number; // How long caregiver has to respond
  
  // Optimization preferences
  optimizeFor: OptimizationGoal;
  considerCostEfficiency: boolean;
  balanceWorkloadAcrossCaregivers: boolean;
  prioritizeContinuityOfCare: boolean;
  
  // Advanced rules
  preferSameCaregiverForRecurring: boolean;
  penalizeFrequentRejections: boolean;
  boostReliablePerformers: boolean;
  
  // Active status
  isActive: boolean;
  isDefault: boolean;
  
  notes?: string;
}

export interface MatchWeights {
  skillMatch: number; // 0-100
  availabilityMatch: number;
  proximityMatch: number;
  preferenceMatch: number;
  experienceMatch: number;
  reliabilityMatch: number;
  complianceMatch: number;
  capacityMatch: number;
}

export type OptimizationGoal =
  | 'BEST_MATCH' // Highest score wins
  | 'FASTEST_FILL' // Fill shifts ASAP
  | 'COST_EFFICIENT' // Minimize labor cost
  | 'BALANCED_WORKLOAD' // Even distribution
  | 'CONTINUITY' // Same caregiver over time
  | 'CAREGIVER_SATISFACTION'; // Match preferences

/**
 * Bulk Match Request - Match multiple shifts at once
 * 
 * Optimize assignments across a set of shifts considering
 * conflicts, capacity, and global optimization goals.
 */
export interface BulkMatchRequest extends Entity {
  organizationId: UUID;
  branchId?: UUID;
  
  // Request scope
  dateFrom: Date;
  dateTo: Date;
  openShiftIds?: UUID[]; // Specific shifts, or all in range
  
  // Configuration
  configurationId?: UUID; // Use specific config
  optimizationGoal?: OptimizationGoal;
  
  // Processing
  requestedBy: UUID;
  requestedAt: Timestamp;
  status: BulkMatchStatus;
  
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  
  // Results
  totalShifts: number;
  matchedShifts: number;
  unmatchedShifts: number;
  proposalsGenerated: number;
  
  errorMessage?: string;
  
  notes?: string;
}

export type BulkMatchStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

/**
 * Match History - Audit log of matching decisions
 * 
 * Records all matching attempts for analysis and improvement.
 */
export interface MatchHistory extends Entity {
  openShiftId: UUID;
  visitId: UUID;
  caregiverId?: UUID;
  
  // Match attempt
  attemptNumber: number;
  matchedAt: Timestamp;
  matchedBy?: UUID; // Null if automatic
  
  matchScore?: number;
  matchQuality?: MatchQuality;
  
  // Outcome
  outcome: MatchOutcome;
  outcomeDeterminedAt?: Timestamp;
  
  // If assigned
  assignmentProposalId?: UUID;
  assignedSuccessfully: boolean;
  
  // If rejected
  rejectionReason?: string;
  
  // Configuration used
  configurationId?: UUID;
  configurationSnapshot?: Partial<MatchingConfiguration>;
  
  // Performance tracking
  responseTimeMinutes?: number; // Time for caregiver to respond
  
  notes?: string;
}

export type MatchOutcome =
  | 'PROPOSED' // Proposal sent
  | 'ACCEPTED' // Caregiver accepted
  | 'REJECTED' // Caregiver rejected
  | 'EXPIRED' // No response in time
  | 'SUPERSEDED' // Better match found
  | 'NO_CANDIDATES' // No eligible caregivers
  | 'MANUAL_OVERRIDE'; // Scheduler assigned manually

/**
 * Caregiver Preference Profile - Self-service preferences
 * 
 * Allows caregivers to indicate shift preferences for better matching.
 */
export interface CaregiverPreferenceProfile {
  id: UUID;
  caregiverId: UUID;
  organizationId: UUID;
  
  // Shift preferences
  preferredDaysOfWeek?: string[];
  preferredTimeRanges?: TimeRange[];
  preferredShiftTypes?: string[];
  
  // Client preferences
  preferredClientIds?: UUID[];
  preferredClientTypes?: string[];
  preferredServiceTypes?: UUID[];
  
  // Location preferences
  maxTravelDistance?: number; // Miles from home
  preferredZipCodes?: string[];
  avoidZipCodes?: string[];
  
  // Work-life balance
  maxShiftsPerDay?: number;
  maxShiftsPerWeek?: number;
  maxHoursPerWeek?: number;
  requireMinimumHoursBetweenShifts?: number;
  
  // Willingness
  willingToAcceptUrgentShifts: boolean;
  willingToWorkWeekends: boolean;
  willingToWorkHolidays: boolean;
  acceptAutoAssignment: boolean; // Auto-assign excellent matches
  
  // Notification preferences
  notificationMethods: NotificationMethod[];
  quietHoursStart?: string; // HH:MM
  quietHoursEnd?: string; // HH:MM
  
  // Audit fields
  lastUpdated: Timestamp;
  updatedBy: UUID;
  createdAt: Timestamp;
  createdBy: UUID;
  version: number;
}

export interface TimeRange {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

/**
 * Input types for operations
 */

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
  autoPropose?: boolean; // Auto-send proposals to top matches
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

/**
 * Search and query types
 */

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
  radius?: number; // Search radius in miles
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
  isExpiringSoon?: boolean; // Expiring within 1 hour
  matchQuality?: MatchQuality[];
}

/**
 * Analytics and reporting types
 */

export interface MatchingMetrics {
  periodStart: Date;
  periodEnd: Date;
  
  // Volume metrics
  totalOpenShifts: number;
  shiftsMatched: number;
  shiftsUnmatched: number;
  matchRate: number; // Percentage
  
  // Quality metrics
  averageMatchScore: number;
  averageCandidatesPerShift: number;
  
  // Response metrics
  averageResponseTimeMinutes: number;
  proposalAcceptanceRate: number;
  proposalRejectionRate: number;
  proposalExpirationRate: number;
  
  // Performance by quality tier
  excellentMatches: number;
  goodMatches: number;
  fairMatches: number;
  poorMatches: number;
  
  // Top rejection reasons
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
  
  // Proposal activity
  proposalsReceived: number;
  proposalsAccepted: number;
  proposalsRejected: number;
  proposalsExpired: number;
  
  acceptanceRate: number;
  averageResponseTimeMinutes: number;
  
  // Match quality
  averageMatchScore: number;
  shiftsCompleted: number;
  noShowCount: number;
  cancellationCount: number;
  
  reliabilityScore: number;
}
