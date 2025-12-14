/**
 * @folkcare/family-engagement - Care Transition Types
 *
 * Transition of Care Support
 *
 * Types for supporting families when patients are hospitalized,
 * move to facilities, or undergo other care transitions.
 */

import type { Entity, UUID, Timestamp } from '@folkcare/core';

// ============================================================================
// Care Transition Types
// ============================================================================

/**
 * Type of care transition
 */
export type CareTransitionType =
  | 'HOSPITALIZATION'      // Patient admitted to hospital
  | 'HOSPITAL_DISCHARGE'   // Returning from hospital
  | 'SKILLED_NURSING'      // Moving to skilled nursing facility
  | 'ASSISTED_LIVING'      // Moving to assisted living
  | 'MEMORY_CARE'          // Moving to memory care facility
  | 'REHABILITATION'       // Moving to rehab facility
  | 'HOSPICE'              // Transitioning to hospice care
  | 'HOME_RETURN'          // Returning home from facility
  | 'CARE_LEVEL_CHANGE';   // Change in home care level

/**
 * Status of a care transition
 */
export type CareTransitionStatus =
  | 'PENDING'       // Transition anticipated
  | 'IN_PROGRESS'   // Transition actively occurring
  | 'COMPLETED'     // Transition completed
  | 'CANCELLED';    // Transition cancelled

/**
 * Urgency level for transitions
 */
export type CareTransitionUrgency =
  | 'PLANNED'       // Scheduled transition
  | 'URGENT'        // Unexpected but not emergency
  | 'EMERGENCY';    // Emergency transition

/**
 * Support resource type
 */
export type SupportResourceType =
  | 'CHECKLIST'           // Transition checklist
  | 'GUIDE'               // Information guide
  | 'CONTACT'             // Important contact
  | 'FAQ'                 // Frequently asked questions
  | 'VIDEO'               // Educational video
  | 'DOCUMENT'            // Downloadable document
  | 'EXTERNAL_LINK';      // External resource link

/**
 * Main care transition record
 */
export interface CareTransition extends Entity {
  clientId: UUID;
  familyMemberId: UUID;          // Primary family contact for transition

  // Transition details
  transitionType: CareTransitionType;
  status: CareTransitionStatus;
  urgency: CareTransitionUrgency;

  // Timing
  anticipatedDate?: string;       // When transition expected (ISO date)
  actualStartDate?: string;       // When transition began
  actualEndDate?: string;         // When transition completed

  // Location details
  fromLocation: TransitionLocation;
  toLocation: TransitionLocation;

  // Reason and notes
  reason: string;                 // Why the transition is happening
  diagnosisRelated?: string;      // Related diagnosis if applicable
  coordinatorNotes?: string;      // Internal notes for staff
  familyVisibleNotes?: string;    // Notes visible to family

  // Care coordination
  assignedCoordinatorId?: UUID;   // Staff member managing transition
  primaryPhysician?: string;      // Name of primary physician
  dischargeManager?: string;      // Hospital/facility discharge manager

  // Follow-up
  followUpRequired: boolean;
  followUpDate?: string;
  followUpNotes?: string;

  // Organization context
  organizationId: UUID;
  branchId: UUID;
}

/**
 * Location details for transition
 */
export interface TransitionLocation {
  type: 'HOME' | 'HOSPITAL' | 'SKILLED_NURSING' | 'ASSISTED_LIVING' | 'REHAB' | 'HOSPICE' | 'OTHER';
  name?: string;                  // Facility name if applicable
  address?: string;
  phone?: string;
  contactPerson?: string;
  roomNumber?: string;            // Room/unit number
}

/**
 * Checklist item for care transition
 */
export interface TransitionChecklistItem extends Entity {
  transitionId: UUID;
  clientId: UUID;

  // Item details
  category: TransitionChecklistCategory;
  title: string;
  description?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';

  // Completion
  isCompleted: boolean;
  completedAt?: Timestamp;
  completedBy?: UUID;
  completionNotes?: string;

  // Deadlines
  dueDate?: string;
  isOverdue: boolean;

  // Assignment
  assignedTo?: 'FAMILY' | 'COORDINATOR' | 'CAREGIVER' | 'OTHER';
  assignedUserId?: UUID;

  // Order
  sortOrder: number;

  organizationId: UUID;
}

/**
 * Category of checklist item
 */
export type TransitionChecklistCategory =
  | 'MEDICAL'              // Medical tasks
  | 'MEDICATION'           // Medication management
  | 'EQUIPMENT'            // Medical equipment
  | 'DOCUMENTATION'        // Paperwork and forms
  | 'INSURANCE'            // Insurance coordination
  | 'HOME_PREPARATION'     // Preparing home for return
  | 'CARE_COORDINATION'    // Coordinating care providers
  | 'FAMILY_SUPPORT'       // Family preparation
  | 'FOLLOW_UP';           // Follow-up appointments

/**
 * Support resource for transitions
 */
export interface TransitionSupportResource extends Entity {
  transitionType: CareTransitionType;
  resourceType: SupportResourceType;

  // Content
  title: string;
  description?: string;
  content?: string;               // Full content for guides/FAQs
  url?: string;                   // External URL
  fileUrl?: string;               // Uploaded document URL

  // Contact info for CONTACT type
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactRole?: string;

  // Display
  sortOrder: number;
  isActive: boolean;

  // Targeting
  availableForAllOrgs: boolean;
  organizationId?: UUID;
}

/**
 * Family communication during transition
 */
export interface TransitionCommunication extends Entity {
  transitionId: UUID;
  clientId: UUID;
  familyMemberId: UUID;

  // Communication details
  communicationType: 'CALL' | 'EMAIL' | 'SMS' | 'IN_PERSON' | 'PORTAL_MESSAGE';
  subject: string;
  summary: string;

  // Direction
  direction: 'INBOUND' | 'OUTBOUND';

  // Staff involved
  staffUserId: UUID;
  staffName: string;

  // Outcome
  outcome?: string;
  followUpRequired: boolean;
  followUpDate?: string;

  organizationId: UUID;
}

/**
 * Transition update for activity feed
 */
export interface TransitionUpdate extends Entity {
  transitionId: UUID;
  clientId: UUID;

  // Update details
  updateType: TransitionUpdateType;
  title: string;
  description: string;

  // Visibility
  isPublic: boolean;              // Visible to family

  // Author
  authorUserId: UUID;
  authorName: string;

  organizationId: UUID;
}

/**
 * Type of transition update
 */
export type TransitionUpdateType =
  | 'STATUS_CHANGE'        // Transition status changed
  | 'CHECKLIST_UPDATE'     // Checklist item completed
  | 'COMMUNICATION'        // Communication with family
  | 'LOCATION_UPDATE'      // Location information updated
  | 'CARE_PLAN_CHANGE'     // Care plan modifications
  | 'GENERAL_UPDATE';      // General update

// ============================================================================
// Service Layer Input/Output Types
// ============================================================================

/**
 * Input for creating a care transition
 */
export interface CreateCareTransitionInput {
  clientId: UUID;
  familyMemberId: UUID;
  transitionType: CareTransitionType;
  urgency: CareTransitionUrgency;
  anticipatedDate?: string;
  fromLocation: TransitionLocation;
  toLocation: TransitionLocation;
  reason: string;
  diagnosisRelated?: string;
  familyVisibleNotes?: string;
  assignedCoordinatorId?: UUID;
  primaryPhysician?: string;
  organizationId: UUID;
  branchId: UUID;
}

/**
 * Input for updating a care transition
 */
export interface UpdateCareTransitionInput {
  status?: CareTransitionStatus;
  urgency?: CareTransitionUrgency;
  anticipatedDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  fromLocation?: TransitionLocation;
  toLocation?: TransitionLocation;
  reason?: string;
  diagnosisRelated?: string;
  coordinatorNotes?: string;
  familyVisibleNotes?: string;
  assignedCoordinatorId?: UUID;
  primaryPhysician?: string;
  dischargeManager?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  followUpNotes?: string;
}

/**
 * Input for creating checklist item
 */
export interface CreateChecklistItemInput {
  transitionId: UUID;
  clientId: UUID;
  category: TransitionChecklistCategory;
  title: string;
  description?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string;
  assignedTo?: 'FAMILY' | 'COORDINATOR' | 'CAREGIVER' | 'OTHER';
  assignedUserId?: UUID;
  sortOrder?: number;
  organizationId: UUID;
}

/**
 * Input for completing checklist item
 */
export interface CompleteChecklistItemInput {
  completionNotes?: string;
}

/**
 * Input for logging communication
 */
export interface LogTransitionCommunicationInput {
  transitionId: UUID;
  clientId: UUID;
  familyMemberId: UUID;
  communicationType: 'CALL' | 'EMAIL' | 'SMS' | 'IN_PERSON' | 'PORTAL_MESSAGE';
  direction: 'INBOUND' | 'OUTBOUND';
  subject: string;
  summary: string;
  outcome?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  organizationId: UUID;
}

/**
 * Input for posting transition update
 */
export interface PostTransitionUpdateInput {
  transitionId: UUID;
  clientId: UUID;
  updateType: TransitionUpdateType;
  title: string;
  description: string;
  isPublic: boolean;
  organizationId: UUID;
}

/**
 * Filter options for querying transitions
 */
export interface CareTransitionFilters {
  clientId?: UUID;
  familyMemberId?: UUID;
  transitionType?: CareTransitionType;
  status?: CareTransitionStatus | CareTransitionStatus[];
  urgency?: CareTransitionUrgency;
  assignedCoordinatorId?: UUID;
  fromDate?: string;
  toDate?: string;
  organizationId?: UUID;
  branchId?: UUID;
}

// ============================================================================
// Query Result Types
// ============================================================================

/**
 * Transition with full details for display
 */
export interface CareTransitionWithDetails extends CareTransition {
  // Related data
  clientName: string;
  familyMemberName: string;
  coordinatorName?: string;

  // Progress
  checklistTotal: number;
  checklistCompleted: number;
  checklistOverdue: number;

  // Recent activity
  lastUpdateAt?: Timestamp;
  communicationCount: number;

  // Formatted display
  transitionTypeDisplay: string;
  statusDisplay: string;
  urgencyDisplay: string;
}

/**
 * Checklist progress summary
 */
export interface ChecklistProgressSummary {
  transitionId: UUID;
  total: number;
  completed: number;
  overdue: number;
  byCategory: Record<TransitionChecklistCategory, { total: number; completed: number }>;
}

/**
 * Family transition dashboard data
 */
export interface FamilyTransitionDashboard {
  activeTransitions: CareTransitionWithDetails[];
  recentUpdates: TransitionUpdate[];
  pendingChecklistItems: TransitionChecklistItem[];
  supportResources: TransitionSupportResource[];
  upcomingFollowUps: Array<{
    transitionId: UUID;
    transitionType: CareTransitionType;
    followUpDate: string;
    notes?: string;
  }>;
}

/**
 * Transition analytics for reporting
 */
export interface TransitionAnalytics {
  periodStart: string;
  periodEnd: string;
  totalTransitions: number;
  byType: Record<CareTransitionType, number>;
  byStatus: Record<CareTransitionStatus, number>;
  avgDaysToComplete: number;
  checklistCompletionRate: number;
  followUpCompletionRate: number;
}
