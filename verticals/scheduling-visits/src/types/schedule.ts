/**
 * Scheduling & Visit Management domain model
 * 
 * Definition of service episodes, recurring patterns, manual and rule-assisted
 * scheduling, real-time status during the day, exceptions handling, and calendar
 * views across roles.
 * 
 * Key concepts:
 * - Service Pattern: Template defining recurring service requirements
 * - Schedule: Instance of a pattern for a specific time period
 * - Visit: Single occurrence of a scheduled service
 * - Assignment: Caregiver assigned to a visit
 * - Visit Event: State transitions during visit lifecycle
 */

import {
  Entity,
  SoftDeletable,
  UUID,
  Timestamp,
} from '@care-commons/core';

/**
 * Service Pattern - Template for recurring services
 * 
 * Defines what services a client needs, how often, for how long,
 * and what skills/qualifications are required.
 */
export interface ServicePattern extends Entity, SoftDeletable {
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;

  // Pattern identity
  name: string;
  description?: string;
  patternType: PatternType;

  // Service definition
  serviceTypeId: UUID;
  serviceTypeName: string;
  taskTemplateIds?: UUID[]; // Tasks from care plan library

  // Scheduling rules
  recurrence: RecurrenceRule;
  duration: number; // Duration in minutes
  flexibilityWindow?: number; // Allowed variance in minutes

  // Requirements
  requiredSkills?: string[];
  requiredCertifications?: string[];
  preferredCaregivers?: UUID[];
  blockedCaregivers?: UUID[]; // Restricted from this client
  genderPreference?: 'MALE' | 'FEMALE' | 'NO_PREFERENCE';
  languagePreference?: string;

  // Timing preferences
  preferredTimeOfDay?: TimeOfDay;
  mustStartBy?: string; // HH:MM format
  mustEndBy?: string; // HH:MM format

  // Authorization
  authorizedHoursPerWeek?: number;
  authorizedVisitsPerWeek?: number;
  authorizationStartDate?: Date;
  authorizationEndDate?: Date;
  fundingSourceId?: UUID;

  // Operational
  travelTimeBefore?: number; // Minutes
  travelTimeAfter?: number; // Minutes
  allowBackToBack?: boolean; // Can schedule consecutive visits

  // Status
  status: PatternStatus;
  effectiveFrom: Date;
  effectiveTo?: Date;

  // Metadata
  notes?: string;
  clientInstructions?: string;
  caregiverInstructions?: string;
}

export type PatternType =
  | 'RECURRING' // Standard recurring pattern
  | 'ONE_TIME' // Single occurrence
  | 'AS_NEEDED' // PRN - scheduled on demand
  | 'RESPITE'; // Temporary respite care

export type PatternStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'COMPLETED'
  | 'CANCELLED';

export type TimeOfDay =
  | 'EARLY_MORNING' // 5am-8am
  | 'MORNING' // 8am-12pm
  | 'AFTERNOON' // 12pm-5pm
  | 'EVENING' // 5pm-9pm
  | 'NIGHT' // 9pm-5am
  | 'ANY';

/**
 * Recurrence Rule - Defines when services repeat
 */
export interface RecurrenceRule {
  frequency: Frequency;
  interval: number; // Every N days/weeks/months
  daysOfWeek?: DayOfWeek[]; // For weekly patterns
  datesOfMonth?: number[]; // For monthly patterns (1-31)
  startTime: string; // HH:MM format
  endTime?: string; // HH:MM format (if different from duration)
  timezone: string; // IANA timezone
}

export type Frequency =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'CUSTOM';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

/**
 * Schedule - Generated instances from a pattern
 * 
 * Represents the actual scheduled visits for a time period,
 * created from a service pattern.
 */
export interface Schedule extends Entity {
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;
  patternId: UUID;

  // Schedule period
  startDate: Date;
  endDate: Date;

  // Generation metadata
  generatedAt: Timestamp;
  generatedBy: UUID;
  generationMethod: 'AUTO' | 'MANUAL' | 'IMPORT';

  // Statistics
  totalVisits: number;
  scheduledVisits: number;
  unassignedVisits: number;
  completedVisits: number;

  // Status
  status: ScheduleStatus;
  notes?: string;
}

export type ScheduleStatus =
  | 'DRAFT' // Not yet published
  | 'PUBLISHED' // Active and visible
  | 'ARCHIVED'; // Historical record

/**
 * Visit - Single occurrence of a service
 * 
 * The fundamental unit of care delivery. Tracks lifecycle from
 * planned → assigned → in progress → completed/cancelled.
 */
export interface Visit extends Entity, SoftDeletable {
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;
  patternId?: UUID; // Null for ad-hoc visits
  scheduleId?: UUID; // Null for ad-hoc visits

  // Visit identity
  visitNumber: string; // Human-readable identifier
  visitType: VisitType;
  serviceTypeId: UUID;
  serviceTypeName: string;

  // Timing
  scheduledDate: Date;
  scheduledStartTime: string; // HH:MM format
  scheduledEndTime: string; // HH:MM format
  scheduledDuration: number; // Minutes
  timezone: string;

  // Actual timing (populated during visit)
  actualStartTime?: Timestamp;
  actualEndTime?: Timestamp;
  actualDuration?: number; // Minutes

  // Assignment
  assignedCaregiverId?: UUID;
  assignedAt?: Timestamp;
  assignedBy?: UUID;
  assignmentMethod: AssignmentMethod;

  // Location
  address: VisitAddress;
  locationVerification?: LocationVerification;

  // Tasks and requirements
  taskIds?: UUID[]; // From care plan
  requiredSkills?: string[];
  requiredCertifications?: string[];

  // Status tracking
  status: VisitStatus;
  statusHistory: VisitStatusChange[];

  // Flags and alerts
  isUrgent: boolean;
  isPriority: boolean;
  requiresSupervision: boolean;
  riskFlags?: string[];

  // Verification (for EVV compliance)
  verificationMethod?: VerificationMethod;
  verificationData?: VerificationData;

  // Completion
  completionNotes?: string;
  tasksCompleted?: number;
  tasksTotal?: number;
  incidentReported?: boolean;
  signatureRequired: boolean;
  signatureCaptured?: boolean;
  signatureData?: SignatureData;

  // Billing
  billableHours?: number;
  billingStatus?: BillingStatus;
  billingNotes?: string;

  // Metadata
  clientInstructions?: string;
  caregiverInstructions?: string;
  internalNotes?: string;
  tags?: string[];
}

export type VisitType =
  | 'REGULAR' // Standard scheduled visit
  | 'INITIAL' // First visit for new client
  | 'DISCHARGE' // Final visit
  | 'RESPITE' // Respite care
  | 'EMERGENCY' // Unscheduled emergency visit
  | 'MAKEUP' // Makeup for missed visit
  | 'SUPERVISION' // Supervisor visit
  | 'ASSESSMENT'; // Assessment or evaluation

export type AssignmentMethod =
  | 'MANUAL' // Manually assigned by scheduler
  | 'AUTO_MATCH' // System-matched based on rules
  | 'SELF_ASSIGN' // Caregiver self-assigned
  | 'PREFERRED' // Assigned to preferred caregiver
  | 'OVERFLOW'; // Assigned due to no other options

export type VisitStatus =
  | 'DRAFT' // Not yet published
  | 'SCHEDULED' // Published, waiting for date
  | 'UNASSIGNED' // Published but no caregiver assigned
  | 'ASSIGNED' // Caregiver assigned, before day of visit
  | 'CONFIRMED' // Caregiver confirmed the assignment
  | 'EN_ROUTE' // Caregiver traveling to client
  | 'ARRIVED' // Caregiver at client location
  | 'IN_PROGRESS' // Visit actively occurring
  | 'PAUSED' // Visit temporarily paused
  | 'COMPLETED' // Visit finished successfully
  | 'INCOMPLETE' // Visit ended but not all tasks done
  | 'CANCELLED' // Visit cancelled before start
  | 'NO_SHOW_CLIENT' // Client not available
  | 'NO_SHOW_CAREGIVER' // Caregiver didn't show
  | 'REJECTED'; // Caregiver rejected assignment

export type BillingStatus =
  | 'PENDING' // Not yet billed
  | 'READY' // Ready for billing
  | 'BILLED' // Invoice generated
  | 'PAID' // Payment received
  | 'DENIED' // Claim denied
  | 'ADJUSTED'; // Billing adjusted

export type VerificationMethod =
  | 'GPS' // GPS coordinates
  | 'PHONE' // Telephone verification
  | 'FACIAL' // Facial recognition
  | 'BIOMETRIC' // Fingerprint/biometric
  | 'MANUAL'; // Manual verification by supervisor

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
  accuracy?: number; // meters
  distanceFromAddress?: number; // meters
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
  capturedBy: UUID; // Usually client or family member
  signatureImageUrl?: string;
  signatureDataUrl?: string; // Base64 encoded signature
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
  automatic: boolean; // True if system-triggered
}

/**
 * Visit Assignment - Links caregiver to visit
 */
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

  // Match quality (for auto-assignments)
  matchScore?: number; // 0-100
  matchReasons?: string[];

  notes?: string;
}

export type AssignmentStatus =
  | 'PENDING' // Awaiting caregiver response
  | 'CONFIRMED' // Caregiver confirmed
  | 'REJECTED' // Caregiver rejected
  | 'CANCELLED' // Assignment cancelled
  | 'REPLACED'; // Caregiver replaced with another

/**
 * Visit Exception - Handles unexpected situations
 */
export interface VisitException extends Entity {
  visitId: UUID;
  clientId: UUID;
  caregiverId?: UUID;

  exceptionType: ExceptionType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  detectedAt: Timestamp;
  detectedBy?: UUID; // Null if system-detected
  automatic: boolean;

  description: string;
  resolution?: string;
  resolvedAt?: Timestamp;
  resolvedBy?: UUID;

  requiresFollowup: boolean;
  followupAssignedTo?: UUID;

  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
}

export type ExceptionType =
  | 'LATE_START' // Visit started late
  | 'EARLY_END' // Visit ended early
  | 'OVERTIME' // Visit went over scheduled time
  | 'NO_SHOW_CLIENT' // Client not available
  | 'NO_SHOW_CAREGIVER' // Caregiver didn't arrive
  | 'LOCATION_MISMATCH' // Clock in/out not at client location
  | 'MISSED_TASKS' // Required tasks not completed
  | 'SAFETY_CONCERN' // Safety issue during visit
  | 'EQUIPMENT_ISSUE' // Equipment problem
  | 'MEDICATION_ISSUE' // Medication-related problem
  | 'CLIENT_REFUSED' // Client refused service
  | 'EMERGENCY' // Emergency during visit
  | 'OTHER';

/**
 * Shift Template - Reusable shift definition
 * 
 * Used for creating open shifts that caregivers can claim.
 */
export interface ShiftTemplate extends Entity {
  organizationId: UUID;
  branchId: UUID;

  name: string;
  description?: string;
  shiftType: ShiftType;

  serviceTypeId: UUID;
  duration: number; // Minutes

  requiredSkills?: string[];
  requiredCertifications?: string[];

  payRate?: number;
  payRateType?: 'HOURLY' | 'FLAT';

  isActive: boolean;
}

export type ShiftType =
  | 'MORNING'
  | 'AFTERNOON'
  | 'EVENING'
  | 'OVERNIGHT'
  | 'WEEKEND'
  | 'HOLIDAY'
  | 'ON_CALL';

/**
 * Calendar View Settings - Per-user calendar preferences
 */
export interface CalendarViewSettings {
  userId: UUID;
  defaultView: CalendarView;
  defaultTimeRange: TimeRange;
  showUnassignedVisits: boolean;
  showCancelledVisits: boolean;
  colorBy: 'CLIENT' | 'CAREGIVER' | 'SERVICE_TYPE' | 'STATUS';
  filters?: CalendarFilters;
}

export type CalendarView =
  | 'DAY'
  | 'WEEK'
  | 'MONTH'
  | 'LIST'
  | 'MAP';

export type TimeRange =
  | 'TODAY'
  | 'TOMORROW'
  | 'THIS_WEEK'
  | 'NEXT_WEEK'
  | 'THIS_MONTH'
  | 'CUSTOM';

export interface CalendarFilters {
  branchIds?: UUID[];
  clientIds?: UUID[];
  caregiverIds?: UUID[];
  serviceTypeIds?: UUID[];
  statuses?: VisitStatus[];
  onlyUnassigned?: boolean;
  onlyUrgent?: boolean;
}

/**
 * Input types for creating/updating entities
 */

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

/**
 * Search and filter types
 */

export interface VisitSearchFilters {
  query?: string; // Visit number or client name
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
  autoAssign?: boolean; // Attempt automatic caregiver assignment
  respectHourlyLimits?: boolean; // Respect authorized hours
  skipHolidays?: boolean;
  holidayCalendarId?: UUID;
}

export interface CaregiverAvailabilityQuery {
  caregiverId: UUID;
  date: Date;
  startTime?: string;
  endTime?: string;
  duration?: number; // Minutes
  includeTravel?: boolean; // Include travel time
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  conflictingVisitIds?: UUID[];
  reason?: string;
}
