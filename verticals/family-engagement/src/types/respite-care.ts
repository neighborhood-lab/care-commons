/**
 * @folkcare/family-engagement - Respite Care Types
 *
 * Family Respite Care Coordination
 *
 * Types for enabling family caregivers to request and coordinate
 * respite care coverage from professional caregivers.
 */

import type { Entity, UUID, Timestamp } from '@folkcare/core';

// ============================================================================
// Respite Request Types
// ============================================================================

/**
 * Status of a respite care request
 */
export type RespiteRequestStatus =
  | 'DRAFT'        // Family started but hasn't submitted
  | 'SUBMITTED'    // Awaiting coordinator review
  | 'APPROVED'     // Approved, awaiting caregiver assignment
  | 'SCHEDULED'    // Caregiver assigned and visit scheduled
  | 'IN_PROGRESS'  // Respite care currently being provided
  | 'COMPLETED'    // Successfully completed
  | 'CANCELLED'    // Cancelled by family or coordinator
  | 'DECLINED';    // Declined by coordinator

/**
 * Priority level for respite request
 */
export type RespitePriority =
  | 'ROUTINE'      // Standard scheduling
  | 'PREFERRED'    // Family has preferred date/time
  | 'URGENT';      // Immediate need (emergency respite)

/**
 * Gender preference for caregiver
 */
export type RespiteGenderPreference =
  | 'MALE'
  | 'FEMALE'
  | 'NO_PREFERENCE';

/**
 * Reason categories for requesting respite
 */
export type RespiteReasonCategory =
  | 'APPOINTMENT'      // Medical/personal appointment
  | 'WORK'             // Employment obligations
  | 'FAMILY_EVENT'     // Family gathering, ceremony
  | 'SELF_CARE'        // Rest, mental health break
  | 'VACATION'         // Extended time away
  | 'EMERGENCY'        // Unexpected urgent need
  | 'OTHER';           // Other reason

/**
 * Respite care request from a family member
 */
export interface RespiteRequest extends Entity {
  // Client & family context
  clientId: UUID;
  familyMemberId: UUID;        // Family caregiver requesting respite

  // Request details
  status: RespiteRequestStatus;
  priority: RespitePriority;
  reasonCategory: RespiteReasonCategory;
  reasonDescription?: string;   // Optional detailed explanation

  // Requested time window
  requestedStartDate: string;   // ISO date YYYY-MM-DD
  requestedStartTime: string;   // HH:MM 24-hour format
  requestedEndDate: string;     // ISO date YYYY-MM-DD
  requestedEndTime: string;     // HH:MM 24-hour format
  requestedDurationMinutes: number;
  flexibleTiming: boolean;      // Can coordinator adjust times?

  // Caregiver preferences
  preferredCaregiverId?: UUID;
  acceptAnyCaregiver: boolean;
  genderPreference?: RespiteGenderPreference;
  requiredSkills?: string[];    // Specific skills needed

  // Care instructions
  specialInstructions?: string; // Care notes for respite caregiver
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };

  // Approval workflow
  submittedAt?: Timestamp;
  reviewedBy?: UUID;            // Coordinator who reviewed
  reviewedAt?: Timestamp;
  approvalNotes?: string;
  declineReason?: string;

  // Assignment
  assignedCaregiverId?: UUID;
  assignedAt?: Timestamp;
  scheduledVisitId?: UUID;      // Link to actual visit

  // Completion
  completedAt?: Timestamp;
  completionNotes?: string;
  familyRating?: number;        // 1-5 rating
  familyFeedback?: string;

  // Organization context
  organizationId: UUID;
  branchId: UUID;
}

// ============================================================================
// Input Types for Creating/Updating Respite Requests
// ============================================================================

/**
 * Input for creating a new respite request
 */
export interface CreateRespiteRequestInput {
  clientId: UUID;
  familyMemberId: UUID;

  // Request details
  priority?: RespitePriority;
  reasonCategory: RespiteReasonCategory;
  reasonDescription?: string;

  // Requested time
  requestedStartDate: string;
  requestedStartTime: string;
  requestedEndDate: string;
  requestedEndTime: string;
  flexibleTiming?: boolean;

  // Preferences
  preferredCaregiverId?: UUID;
  acceptAnyCaregiver?: boolean;
  genderPreference?: RespiteGenderPreference;
  requiredSkills?: string[];

  // Instructions
  specialInstructions?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };

  // Organization context
  organizationId: UUID;
  branchId: UUID;
}

/**
 * Input for updating a respite request
 */
export interface UpdateRespiteRequestInput {
  // Request details (can update before submission)
  priority?: RespitePriority;
  reasonCategory?: RespiteReasonCategory;
  reasonDescription?: string;

  // Requested time
  requestedStartDate?: string;
  requestedStartTime?: string;
  requestedEndDate?: string;
  requestedEndTime?: string;
  flexibleTiming?: boolean;

  // Preferences
  preferredCaregiverId?: UUID;
  acceptAnyCaregiver?: boolean;
  genderPreference?: RespiteGenderPreference;
  requiredSkills?: string[];

  // Instructions
  specialInstructions?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

/**
 * Input for approving a respite request
 */
export interface ApproveRespiteRequestInput {
  approvalNotes?: string;
}

/**
 * Input for declining a respite request
 */
export interface DeclineRespiteRequestInput {
  declineReason: string;
}

/**
 * Input for assigning a caregiver to respite
 */
export interface AssignRespiteCaregiverInput {
  caregiverId: UUID;
  actualStartDate?: string;     // Can differ from requested
  actualStartTime?: string;
  actualEndDate?: string;
  actualEndTime?: string;
}

/**
 * Input for completing respite with feedback
 */
export interface CompleteRespiteRequestInput {
  completionNotes?: string;
  familyRating?: number;
  familyFeedback?: string;
}

// ============================================================================
// Query Types
// ============================================================================

/**
 * Filters for querying respite requests
 */
export interface RespiteRequestFilters {
  clientId?: UUID;
  familyMemberId?: UUID;
  status?: RespiteRequestStatus | RespiteRequestStatus[];
  priority?: RespitePriority;
  startDateFrom?: string;
  startDateTo?: string;
  assignedCaregiverId?: UUID;
  organizationId?: UUID;
  branchId?: UUID;
}

/**
 * Available caregiver for respite assignment
 */
export interface AvailableRespiteCaregiver {
  caregiverId: UUID;
  firstName: string;
  lastName: string;
  matchScore: number;           // 0-100 based on skills/preferences
  isPreferred: boolean;         // Matches family preference
  hasRequiredSkills: boolean;
  matchingSkills: string[];
  availableFrom: string;
  availableTo: string;
  hourlyRate?: number;
  distanceFromClient?: number;  // In miles
}

// ============================================================================
// Dashboard & Summary Types
// ============================================================================

/**
 * Summary of family's respite usage
 */
export interface RespiteUsageSummary {
  familyMemberId: UUID;
  clientId: UUID;

  // Current period (month)
  currentPeriod: {
    startDate: string;
    endDate: string;
    hoursUsed: number;
    hoursRemaining?: number;    // If there's an allocation
    requestsSubmitted: number;
    requestsCompleted: number;
  };

  // Year to date
  yearToDate: {
    totalHoursUsed: number;
    totalRequestsCompleted: number;
    averageRating: number;
  };

  // Upcoming
  upcomingRequests: Array<{
    id: UUID;
    status: RespiteRequestStatus;
    requestedStartDate: string;
    requestedStartTime: string;
    durationMinutes: number;
    assignedCaregiverName?: string;
  }>;
}

/**
 * Respite request with related details for display
 */
export interface RespiteRequestWithDetails extends RespiteRequest {
  // Related entities
  clientName: string;
  familyMemberName: string;
  assignedCaregiverName?: string;
  reviewerName?: string;

  // Computed values
  durationDisplay: string;      // e.g., "4 hours"
  statusDisplay: string;        // Human-readable status
  dateTimeDisplay: string;      // Formatted date/time range
}
