/**
 * @folkcare/family-engagement - Grief & Bereavement Types
 *
 * Grief and Bereavement Resources
 *
 * Types for sensitive handling of end-of-life situations with appropriate
 * resources, counseling referrals, and memorial features for families.
 */

import type { Entity, UUID, Timestamp } from '@folkcare/core';

// ============================================================================
// Resource Types
// ============================================================================

/**
 * Category of bereavement resource
 */
export type BereavementResourceCategory =
  | 'EMOTIONAL_SUPPORT'     // Grief counseling, support groups
  | 'PRACTICAL_GUIDANCE'    // What to do immediately after loss
  | 'FINANCIAL_LEGAL'       // Estate, benefits, insurance
  | 'SPIRITUAL_RELIGIOUS'   // Faith-based support, chaplain services
  | 'MEMORIAL_SERVICES'     // Funeral homes, cremation, memorial planning
  | 'CHILDREN_FAMILY'       // Helping children cope, family therapy
  | 'SELF_CARE'             // Caregiver wellness, burnout recovery
  | 'COMMUNITY_CONNECTIONS' // Local support groups, peer support
  | 'READING_MATERIALS'     // Books, articles, educational content
  | 'CRISIS_SUPPORT';       // Emergency mental health, suicide prevention

/**
 * Type of resource content
 */
export type BereavementResourceType =
  | 'ARTICLE'           // Informational article
  | 'GUIDE'             // Step-by-step guide
  | 'VIDEO'             // Video content
  | 'AUDIO'             // Podcast or audio recording
  | 'SUPPORT_GROUP'     // Support group meeting info
  | 'COUNSELING_SERVICE'// Professional counseling referral
  | 'HOTLINE'           // Crisis or support hotline
  | 'LOCAL_SERVICE'     // Local service provider
  | 'BOOK'              // Book recommendation
  | 'TEMPLATE'          // Document template (letters, forms)
  | 'CHECKLIST'         // Actionable checklist
  | 'EXTERNAL_LINK';    // External website resource

/**
 * Stage of grief this resource is most appropriate for
 */
export type GriefStage =
  | 'ANTICIPATORY'      // Before death (terminal diagnosis)
  | 'IMMEDIATE'         // First days after loss
  | 'ACUTE'             // First weeks/months
  | 'INTEGRATED'        // Long-term grief work
  | 'ANY';              // Applicable at any stage

/**
 * Status of a bereavement resource
 */
export type BereavementResourceStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'UNDER_REVIEW';

/**
 * Bereavement resource available to families
 */
export interface BereavementResource extends Entity {
  // Resource identification
  title: string;
  description: string;
  category: BereavementResourceCategory;
  resourceType: BereavementResourceType;
  status: BereavementResourceStatus;

  // Content
  content?: string;            // For articles/guides (markdown)
  externalUrl?: string;        // For external links
  fileUrl?: string;            // For downloadable files

  // Contact info (for services)
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  hoursOfOperation?: string;

  // Metadata
  griefStage: GriefStage;
  tags: string[];              // For search/filtering
  language: string;            // ISO language code
  estimatedReadTime?: number;  // In minutes

  // Applicability
  isNational: boolean;         // Available nationwide
  statesCovered?: string[];    // State codes if regional
  religionSpecific?: string;   // If faith-specific

  // Quality/curation
  isFeatured: boolean;
  sortOrder: number;
  viewCount: number;
  helpfulCount: number;        // "Was this helpful?" votes
  lastReviewedAt?: Timestamp;
  reviewedBy?: UUID;

  // Organization scope
  organizationId?: UUID;       // null = system-wide resource
}

// ============================================================================
// Family Support Record Types
// ============================================================================

/**
 * Status of bereavement support for a family
 */
export type BereavementSupportStatus =
  | 'ACTIVE'            // Currently receiving support
  | 'ON_HOLD'           // Paused at family request
  | 'COMPLETED'         // Support period concluded
  | 'DECLINED';         // Family declined support

/**
 * Type of loss
 */
export type LossType =
  | 'CLIENT_DEATH'      // The care client passed away
  | 'FAMILY_MEMBER'     // A family member passed away
  | 'ANTICIPATORY';     // Terminal diagnosis, preparing for loss

/**
 * Bereavement support record for a family
 */
export interface BereavementSupport extends Entity {
  // Family context
  clientId: UUID;              // The client (may be deceased)
  familyMemberId: UUID;        // Primary family contact receiving support

  // Loss details
  lossType: LossType;
  dateOfLoss?: string;         // ISO date YYYY-MM-DD
  anticipatedDate?: string;    // For anticipatory grief

  // Support status
  status: BereavementSupportStatus;
  startDate: string;           // When support began
  endDate?: string;            // When support concluded

  // Assigned support
  assignedCoordinatorId?: UUID;

  // Support plan
  initialAssessmentNotes?: string;
  supportPlanNotes?: string;
  specialConsiderations?: string; // Cultural, religious, etc.

  // Communication preferences
  preferredContactMethod?: 'PHONE' | 'EMAIL' | 'IN_PERSON' | 'NO_CONTACT';
  contactFrequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'AS_NEEDED';
  doNotContactUntil?: string;  // Family requested no contact until date

  // Follow-up tracking
  nextFollowUpDate?: string;
  lastContactDate?: string;
  totalContacts: number;

  // Resources shared
  resourcesShared: UUID[];     // Resource IDs shared with family

  // Memorial info
  memorialId?: UUID;           // Link to memorial if created

  // Family feedback
  familyFeedback?: string;

  // Organization context
  organizationId: UUID;
  branchId: UUID;
}

// ============================================================================
// Support Interaction Types
// ============================================================================

/**
 * Type of support interaction
 */
export type SupportInteractionType =
  | 'INITIAL_OUTREACH'      // First contact after loss
  | 'CHECK_IN_CALL'         // Regular check-in
  | 'CHECK_IN_EMAIL'        // Email check-in
  | 'IN_PERSON_VISIT'       // In-person visit
  | 'RESOURCE_SHARED'       // Shared a resource
  | 'REFERRAL_MADE'         // Referred to external service
  | 'CONDOLENCE_SENT'       // Card/flowers/gift sent
  | 'MEMORIAL_ASSISTANCE'   // Helped with memorial planning
  | 'FAMILY_REQUEST'        // Family initiated contact
  | 'CRISIS_INTERVENTION';  // Emergency support provided

/**
 * Record of a support interaction
 */
export interface SupportInteraction extends Entity {
  bereavementSupportId: UUID;
  clientId: UUID;

  // Interaction details
  interactionType: SupportInteractionType;
  interactionDate: string;     // ISO date
  interactionTime?: string;    // HH:MM
  durationMinutes?: number;

  // Participants
  coordinatorId: UUID;
  familyMemberIds: UUID[];     // Family members involved

  // Notes
  summary: string;
  emotionalState?: string;     // Observed emotional state
  concernsRaised?: string;     // Any concerns noted
  nextSteps?: string;

  // Resources/referrals
  resourcesShared?: UUID[];    // Resource IDs
  referralsMade?: string[];    // External referrals

  // Follow-up
  requiresFollowUp: boolean;
  followUpDate?: string;
  followUpNotes?: string;

  // Organization context
  organizationId: UUID;
}

// ============================================================================
// Memorial Types
// ============================================================================

/**
 * Privacy level for memorial
 */
export type MemorialPrivacy =
  | 'PRIVATE'          // Only family members
  | 'ORGANIZATION'     // Organization staff and family
  | 'PUBLIC';          // Anyone with link

/**
 * Memorial page for a deceased client
 */
export interface Memorial extends Entity {
  clientId: UUID;

  // Memorial content
  title: string;               // Memorial title
  biography?: string;          // Life story (markdown)
  obituary?: string;           // Formal obituary

  // Media
  photoUrl?: string;           // Primary photo
  additionalPhotos?: string[]; // Gallery photos
  videoUrl?: string;           // Memorial video

  // Key dates
  birthDate?: string;
  deathDate?: string;
  serviceDate?: string;        // Memorial service date
  serviceLocation?: string;

  // Donations
  donationInfo?: {
    organizationName: string;
    url?: string;
    instructions?: string;
  };

  // Guestbook
  allowGuestbook: boolean;
  allowCandles: boolean;       // Virtual candle lighting

  // Privacy and access
  privacy: MemorialPrivacy;
  accessCode?: string;         // For private memorials
  isPublished: boolean;
  publishedAt?: Timestamp;

  // Family management
  createdByFamilyMemberId: UUID;
  familyAdminIds: UUID[];      // Family members who can edit

  // Organization context
  organizationId: UUID;
}

/**
 * Guestbook entry on a memorial
 */
export interface MemorialGuestbookEntry extends Entity {
  memorialId: UUID;

  // Author info
  authorName: string;
  authorEmail?: string;
  authorRelationship?: string;

  // Content
  message: string;
  isCandle: boolean;           // Virtual candle vs. message

  // Moderation
  isApproved: boolean;
  approvedBy?: UUID;
  approvedAt?: Timestamp;
  isReported: boolean;
  reportReason?: string;
}

// ============================================================================
// Support Request Types
// ============================================================================

/**
 * Type of support requested
 */
export type SupportRequestType =
  | 'COUNSELING_REFERRAL'      // Want counseling services
  | 'SUPPORT_GROUP'            // Want to join support group
  | 'PRACTICAL_HELP'           // Need help with practical matters
  | 'RESOURCE_REQUEST'         // Need specific resources
  | 'TALK_TO_SOMEONE'          // Just need someone to talk to
  | 'MEMORIAL_HELP'            // Help creating memorial
  | 'OTHER';

/**
 * Status of support request
 */
export type SupportRequestStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * Request for bereavement support from family
 */
export interface BereavementSupportRequest extends Entity {
  bereavementSupportId?: UUID;  // May be before support record exists
  clientId: UUID;
  familyMemberId: UUID;

  // Request details
  requestType: SupportRequestType;
  status: SupportRequestStatus;
  description: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRISIS';

  // Response
  assignedTo?: UUID;
  responseNotes?: string;
  completedAt?: Timestamp;

  // Organization context
  organizationId: UUID;
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * Input for creating bereavement support record
 */
export interface CreateBereavementSupportInput {
  clientId: UUID;
  familyMemberId: UUID;
  lossType: LossType;
  dateOfLoss?: string;
  anticipatedDate?: string;
  assignedCoordinatorId?: UUID;
  initialAssessmentNotes?: string;
  specialConsiderations?: string;
  preferredContactMethod?: 'PHONE' | 'EMAIL' | 'IN_PERSON' | 'NO_CONTACT';
  contactFrequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'AS_NEEDED';
  organizationId: UUID;
  branchId: UUID;
}

/**
 * Input for updating bereavement support record
 */
export interface UpdateBereavementSupportInput {
  status?: BereavementSupportStatus;
  dateOfLoss?: string;
  assignedCoordinatorId?: UUID;
  supportPlanNotes?: string;
  specialConsiderations?: string;
  preferredContactMethod?: 'PHONE' | 'EMAIL' | 'IN_PERSON' | 'NO_CONTACT';
  contactFrequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'AS_NEEDED';
  doNotContactUntil?: string;
  nextFollowUpDate?: string;
}

/**
 * Input for logging support interaction
 */
export interface LogSupportInteractionInput {
  bereavementSupportId: UUID;
  clientId: UUID;
  interactionType: SupportInteractionType;
  interactionDate: string;
  interactionTime?: string;
  durationMinutes?: number;
  familyMemberIds?: UUID[];
  summary: string;
  emotionalState?: string;
  concernsRaised?: string;
  nextSteps?: string;
  resourcesShared?: UUID[];
  referralsMade?: string[];
  requiresFollowUp?: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  organizationId: UUID;
}

/**
 * Input for creating memorial
 */
export interface CreateMemorialInput {
  clientId: UUID;
  title: string;
  biography?: string;
  obituary?: string;
  photoUrl?: string;
  birthDate?: string;
  deathDate?: string;
  serviceDate?: string;
  serviceLocation?: string;
  donationInfo?: {
    organizationName: string;
    url?: string;
    instructions?: string;
  };
  allowGuestbook?: boolean;
  allowCandles?: boolean;
  privacy?: MemorialPrivacy;
  accessCode?: string;
  familyMemberId: UUID;
  organizationId: UUID;
}

/**
 * Input for updating memorial
 */
export interface UpdateMemorialInput {
  title?: string;
  biography?: string;
  obituary?: string;
  photoUrl?: string;
  additionalPhotos?: string[];
  videoUrl?: string;
  birthDate?: string;
  deathDate?: string;
  serviceDate?: string;
  serviceLocation?: string;
  donationInfo?: {
    organizationName: string;
    url?: string;
    instructions?: string;
  };
  allowGuestbook?: boolean;
  allowCandles?: boolean;
  privacy?: MemorialPrivacy;
  accessCode?: string;
  isPublished?: boolean;
}

/**
 * Input for adding guestbook entry
 */
export interface AddGuestbookEntryInput {
  memorialId: UUID;
  authorName: string;
  authorEmail?: string;
  authorRelationship?: string;
  message: string;
  isCandle?: boolean;
}

/**
 * Input for creating bereavement resource
 */
export interface CreateBereavementResourceInput {
  title: string;
  description: string;
  category: BereavementResourceCategory;
  resourceType: BereavementResourceType;
  content?: string;
  externalUrl?: string;
  fileUrl?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  hoursOfOperation?: string;
  griefStage?: GriefStage;
  tags?: string[];
  language?: string;
  estimatedReadTime?: number;
  isNational?: boolean;
  statesCovered?: string[];
  religionSpecific?: string;
  isFeatured?: boolean;
  sortOrder?: number;
  organizationId?: UUID;
}

/**
 * Input for submitting support request
 */
export interface SubmitSupportRequestInput {
  bereavementSupportId?: UUID;
  clientId: UUID;
  familyMemberId: UUID;
  requestType: SupportRequestType;
  description: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRISIS';
  organizationId: UUID;
}

// ============================================================================
// Query Types
// ============================================================================

/**
 * Filters for querying bereavement resources
 */
export interface BereavementResourceFilters {
  category?: BereavementResourceCategory;
  resourceType?: BereavementResourceType;
  griefStage?: GriefStage;
  status?: BereavementResourceStatus;
  language?: string;
  tags?: string[];
  isFeatured?: boolean;
  isNational?: boolean;
  state?: string;
  organizationId?: UUID;
  searchQuery?: string;
}

/**
 * Filters for querying bereavement support records
 */
export interface BereavementSupportFilters {
  clientId?: UUID;
  familyMemberId?: UUID;
  status?: BereavementSupportStatus | BereavementSupportStatus[];
  lossType?: LossType;
  assignedCoordinatorId?: UUID;
  requiresFollowUp?: boolean;
  organizationId?: UUID;
  branchId?: UUID;
}

// ============================================================================
// Dashboard Types
// ============================================================================

/**
 * Support coordinator dashboard data
 */
export interface BereavementDashboard {
  // Active cases
  activeCases: number;
  pendingFollowUps: number;
  crisisRequests: number;

  // Follow-up schedule
  todayFollowUps: Array<{
    supportId: UUID;
    clientName: string;
    familyMemberName: string;
    lastContactDate: string;
    daysWithoutContact: number;
  }>;

  // Recent activity
  recentInteractions: Array<{
    supportId: UUID;
    clientName: string;
    interactionType: SupportInteractionType;
    interactionDate: string;
    summary: string;
  }>;

  // Pending requests
  pendingRequests: Array<{
    requestId: UUID;
    familyMemberName: string;
    requestType: SupportRequestType;
    urgency: string;
    createdAt: Timestamp;
  }>;

  // Statistics
  statistics: {
    totalSupported: number;
    averageSupportDuration: number;
    resourcesSharedThisMonth: number;
    referralsMadeThisMonth: number;
  };
}

/**
 * Family bereavement support view
 */
export interface FamilyBereavementView {
  support?: BereavementSupport;
  memorial?: Memorial;

  // Available resources by category
  resourcesByCategory: Record<BereavementResourceCategory, BereavementResource[]>;

  // Recent interactions (for transparency)
  recentInteractions: Array<{
    date: string;
    type: string;
    summary: string;
  }>;

  // Pending requests
  pendingRequests: BereavementSupportRequest[];

  // Helpful resources the family marked
  savedResources: BereavementResource[];
}
