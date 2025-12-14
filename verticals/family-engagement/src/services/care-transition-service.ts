/**
 * Care Transition Service
 *
 * Business logic for transition of care support
 */

import type { UserContext, UUID } from '@folkcare/core';
import { PermissionService } from '@folkcare/core';
import type {
  CareTransition,
  CreateCareTransitionInput,
  UpdateCareTransitionInput,
  CareTransitionFilters,
  TransitionChecklistItem,
  CreateChecklistItemInput,
  CompleteChecklistItemInput,
  TransitionCommunication,
  LogTransitionCommunicationInput,
  TransitionUpdate,
  PostTransitionUpdateInput,
  TransitionSupportResource,
  CareTransitionWithDetails,
  FamilyTransitionDashboard,
  ChecklistProgressSummary,
  TransitionChecklistCategory
} from '../types/care-transition.js';
import {
  CareTransitionRepository,
  TransitionChecklistRepository,
  TransitionCommunicationRepository,
  TransitionUpdateRepository,
  TransitionSupportResourceRepository
} from '../repositories/care-transition-repository.js';
import { FamilyMemberRepository } from '../repositories/family-engagement-repository.js';

/**
 * Error classes for care transition operations
 */
class TransitionNotFoundError extends Error {
  constructor(id: UUID) {
    super(`Care transition not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

class TransitionPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

class TransitionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Display labels for transition types
 */
const TRANSITION_TYPE_LABELS: Record<string, string> = {
  HOSPITALIZATION: 'Hospitalization',
  HOSPITAL_DISCHARGE: 'Hospital Discharge',
  SKILLED_NURSING: 'Skilled Nursing Facility',
  ASSISTED_LIVING: 'Assisted Living',
  MEMORY_CARE: 'Memory Care',
  REHABILITATION: 'Rehabilitation',
  HOSPICE: 'Hospice Care',
  HOME_RETURN: 'Return Home',
  CARE_LEVEL_CHANGE: 'Care Level Change'
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

const URGENCY_LABELS: Record<string, string> = {
  PLANNED: 'Planned',
  URGENT: 'Urgent',
  EMERGENCY: 'Emergency'
};

/**
 * Service for managing care transitions
 */
export class CareTransitionService {
  constructor(
    private transitionRepo: CareTransitionRepository,
    private checklistRepo: TransitionChecklistRepository,
    private communicationRepo: TransitionCommunicationRepository,
    private updateRepo: TransitionUpdateRepository,
    private resourceRepo: TransitionSupportResourceRepository,
    private familyMemberRepo: FamilyMemberRepository,
    private permissions: PermissionService
  ) {}

  // ============================================================================
  // Transition Management
  // ============================================================================

  /**
   * Create a new care transition
   */
  async createTransition(
    input: CreateCareTransitionInput,
    context: UserContext
  ): Promise<CareTransition> {
    // Check permission
    if (!this.permissions.hasPermission(context, 'transitions:create')) {
      throw new TransitionPermissionError('Insufficient permissions to create transitions');
    }

    // Validate family member exists
    const familyMember = await this.familyMemberRepo.findById(input.familyMemberId);
    if (familyMember === null || familyMember === undefined) {
      throw new TransitionValidationError('Family member not found');
    }

    // Create the transition
    const transition = await this.transitionRepo.createTransition({
      ...input,
      createdBy: context.userId
    });

    // Create audit revision
    await this.transitionRepo.recordRevision(
      transition.id,
      'CREATE',
      null,
      transition,
      Object.keys(input),
      context.userId,
      'Initial creation'
    );

    // Post initial update visible to family
    await this.updateRepo.postUpdate({
      transitionId: transition.id,
      clientId: transition.clientId,
      updateType: 'STATUS_CHANGE',
      title: 'Care Transition Initiated',
      description: `A ${TRANSITION_TYPE_LABELS[transition.transitionType] ?? transition.transitionType} transition has been initiated.`,
      isPublic: true,
      organizationId: transition.organizationId,
      authorUserId: context.userId,
      authorName: 'System',
      createdBy: context.userId
    });

    // Create default checklist items based on transition type
    await this.createDefaultChecklistItems(transition, context);

    return transition;
  }

  /**
   * Update a care transition
   */
  async updateTransition(
    id: UUID,
    input: UpdateCareTransitionInput,
    context: UserContext
  ): Promise<CareTransition> {
    const existing = await this.transitionRepo.findById(id);
    if (existing === null || existing === undefined) {
      throw new TransitionNotFoundError(id);
    }

    // Check permission
    if (!this.permissions.hasPermission(context, 'transitions:update')) {
      throw new TransitionPermissionError('Insufficient permissions to update transitions');
    }

    const updated = await this.transitionRepo.updateTransition(id, input, context.userId);
    if (updated === null || updated === undefined) {
      throw new TransitionNotFoundError(id);
    }

    // Create audit revision
    const changedFields = Object.keys(input).filter(key => input[key as keyof UpdateCareTransitionInput] !== undefined);
    await this.transitionRepo.recordRevision(
      id,
      'UPDATE',
      existing,
      updated,
      changedFields,
      context.userId,
      'Updated transition'
    );

    return updated;
  }

  /**
   * Start a transition
   */
  async startTransition(id: UUID, context: UserContext): Promise<CareTransition> {
    const existing = await this.transitionRepo.findById(id);
    if (existing === null || existing === undefined) {
      throw new TransitionNotFoundError(id);
    }

    if (existing.status !== 'PENDING') {
      throw new TransitionValidationError('Only pending transitions can be started');
    }

    const started = await this.transitionRepo.startTransition(id, context.userId);
    if (started === null || started === undefined) {
      throw new TransitionNotFoundError(id);
    }

    // Create audit revision
    await this.transitionRepo.recordRevision(
      id,
      'STATUS_CHANGE',
      existing,
      started,
      ['status', 'actualStartDate'],
      context.userId,
      'Started transition'
    );

    // Post update
    await this.updateRepo.postUpdate({
      transitionId: id,
      clientId: started.clientId,
      updateType: 'STATUS_CHANGE',
      title: 'Transition Started',
      description: 'The care transition is now in progress.',
      isPublic: true,
      organizationId: started.organizationId,
      authorUserId: context.userId,
      authorName: 'System',
      createdBy: context.userId
    });

    return started;
  }

  /**
   * Complete a transition
   */
  async completeTransition(id: UUID, context: UserContext): Promise<CareTransition> {
    const existing = await this.transitionRepo.findById(id);
    if (existing === null || existing === undefined) {
      throw new TransitionNotFoundError(id);
    }

    if (existing.status !== 'IN_PROGRESS') {
      throw new TransitionValidationError('Only in-progress transitions can be completed');
    }

    const completed = await this.transitionRepo.completeTransition(id, context.userId);
    if (completed === null || completed === undefined) {
      throw new TransitionNotFoundError(id);
    }

    // Create audit revision
    await this.transitionRepo.recordRevision(
      id,
      'STATUS_CHANGE',
      existing,
      completed,
      ['status', 'actualEndDate'],
      context.userId,
      'Completed transition'
    );

    // Post update
    await this.updateRepo.postUpdate({
      transitionId: id,
      clientId: completed.clientId,
      updateType: 'STATUS_CHANGE',
      title: 'Transition Completed',
      description: 'The care transition has been successfully completed.',
      isPublic: true,
      organizationId: completed.organizationId,
      authorUserId: context.userId,
      authorName: 'System',
      createdBy: context.userId
    });

    return completed;
  }

  /**
   * Cancel a transition
   */
  async cancelTransition(id: UUID, context: UserContext): Promise<CareTransition> {
    const existing = await this.transitionRepo.findById(id);
    if (existing === null || existing === undefined) {
      throw new TransitionNotFoundError(id);
    }

    const cancelled = await this.transitionRepo.cancelTransition(id, context.userId);
    if (cancelled === null || cancelled === undefined) {
      throw new TransitionValidationError('Transition cannot be cancelled in its current state');
    }

    // Create audit revision
    await this.transitionRepo.recordRevision(
      id,
      'STATUS_CHANGE',
      existing,
      cancelled,
      ['status'],
      context.userId,
      'Cancelled transition'
    );

    // Post update
    await this.updateRepo.postUpdate({
      transitionId: id,
      clientId: cancelled.clientId,
      updateType: 'STATUS_CHANGE',
      title: 'Transition Cancelled',
      description: 'The care transition has been cancelled.',
      isPublic: true,
      organizationId: cancelled.organizationId,
      authorUserId: context.userId,
      authorName: 'System',
      createdBy: context.userId
    });

    return cancelled;
  }

  // ============================================================================
  // Checklist Management
  // ============================================================================

  /**
   * Add a checklist item to a transition
   */
  async addChecklistItem(
    input: CreateChecklistItemInput,
    context: UserContext
  ): Promise<TransitionChecklistItem> {
    const transition = await this.transitionRepo.findById(input.transitionId);
    if (transition === null || transition === undefined) {
      throw new TransitionNotFoundError(input.transitionId);
    }

    return this.checklistRepo.createItem({
      ...input,
      createdBy: context.userId
    });
  }

  /**
   * Complete a checklist item
   */
  async completeChecklistItem(
    id: UUID,
    input: CompleteChecklistItemInput,
    context: UserContext
  ): Promise<TransitionChecklistItem> {
    const item = await this.checklistRepo.completeItem(id, context.userId, input.completionNotes);
    if (item === null || item === undefined) {
      throw new TransitionValidationError('Checklist item not found');
    }

    // Post update
    await this.updateRepo.postUpdate({
      transitionId: item.transitionId,
      clientId: item.clientId,
      updateType: 'CHECKLIST_UPDATE',
      title: 'Checklist Item Completed',
      description: `"${item.title}" has been completed.`,
      isPublic: true,
      organizationId: item.organizationId,
      authorUserId: context.userId,
      authorName: 'System',
      createdBy: context.userId
    });

    return item;
  }

  /**
   * Uncomplete a checklist item
   */
  async uncompleteChecklistItem(id: UUID, context: UserContext): Promise<TransitionChecklistItem> {
    const item = await this.checklistRepo.uncompleteItem(id, context.userId);
    if (item === null || item === undefined) {
      throw new TransitionValidationError('Checklist item not found');
    }
    return item;
  }

  /**
   * Get checklist items for a transition
   */
  async getChecklistItems(
    transitionId: UUID,
    _context: UserContext
  ): Promise<TransitionChecklistItem[]> {
    return this.checklistRepo.findByTransition(transitionId);
  }

  /**
   * Get checklist progress summary
   */
  async getChecklistProgress(
    transitionId: UUID,
    _context: UserContext
  ): Promise<ChecklistProgressSummary> {
    return this.checklistRepo.getProgressSummary(transitionId);
  }

  // ============================================================================
  // Communication Logging
  // ============================================================================

  /**
   * Log a communication with family
   */
  async logCommunication(
    input: LogTransitionCommunicationInput,
    context: UserContext
  ): Promise<TransitionCommunication> {
    const transition = await this.transitionRepo.findById(input.transitionId);
    if (transition === null || transition === undefined) {
      throw new TransitionNotFoundError(input.transitionId);
    }

    const communication = await this.communicationRepo.logCommunication({
      ...input,
      staffUserId: context.userId,
      staffName: 'System',
      createdBy: context.userId
    });

    // Post update
    await this.updateRepo.postUpdate({
      transitionId: input.transitionId,
      clientId: input.clientId,
      updateType: 'COMMUNICATION',
      title: 'Communication Logged',
      description: `${input.communicationType} communication: ${input.subject}`,
      isPublic: false, // Internal only
      organizationId: input.organizationId,
      authorUserId: context.userId,
      authorName: 'System',
      createdBy: context.userId
    });

    return communication;
  }

  /**
   * Get communications for a transition
   */
  async getCommunications(
    transitionId: UUID,
    _context: UserContext
  ): Promise<TransitionCommunication[]> {
    return this.communicationRepo.findByTransition(transitionId);
  }

  // ============================================================================
  // Updates and Activity
  // ============================================================================

  /**
   * Post an update to a transition
   */
  async postUpdate(
    input: PostTransitionUpdateInput,
    context: UserContext
  ): Promise<TransitionUpdate> {
    const transition = await this.transitionRepo.findById(input.transitionId);
    if (transition === null || transition === undefined) {
      throw new TransitionNotFoundError(input.transitionId);
    }

    return this.updateRepo.postUpdate({
      ...input,
      authorUserId: context.userId,
      authorName: 'System',
      createdBy: context.userId
    });
  }

  /**
   * Get updates for a transition
   */
  async getUpdates(
    transitionId: UUID,
    publicOnly: boolean,
    _context: UserContext
  ): Promise<TransitionUpdate[]> {
    return this.updateRepo.findByTransition(transitionId, publicOnly);
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  /**
   * Get a transition by ID
   */
  async getTransition(id: UUID, _context: UserContext): Promise<CareTransition> {
    const transition = await this.transitionRepo.findById(id);
    if (transition === null || transition === undefined) {
      throw new TransitionNotFoundError(id);
    }
    return transition;
  }

  /**
   * Get a transition with full details
   */
  async getTransitionWithDetails(
    id: UUID,
    _context: UserContext
  ): Promise<CareTransitionWithDetails> {
    const transition = await this.transitionRepo.findById(id);
    if (transition === null || transition === undefined) {
      throw new TransitionNotFoundError(id);
    }

    // Get family member info
    const familyMember = await this.familyMemberRepo.findById(transition.familyMemberId);

    // Get checklist progress
    const checklistProgress = await this.checklistRepo.getProgressSummary(id);

    // Get communications count
    const communications = await this.communicationRepo.findByTransition(id);

    // Get last update
    const updates = await this.updateRepo.findByTransition(id, false);
    const lastUpdate = updates.length > 0 ? updates[0] : undefined;

    return {
      ...transition,
      clientName: '', // Would need to fetch from clients table
      familyMemberName: familyMember !== null && familyMember !== undefined
        ? `${familyMember.firstName} ${familyMember.lastName}`
        : 'Unknown',
      coordinatorName: undefined, // Would need to fetch from users table
      checklistTotal: checklistProgress.total,
      checklistCompleted: checklistProgress.completed,
      checklistOverdue: checklistProgress.overdue,
      lastUpdateAt: lastUpdate?.createdAt,
      communicationCount: communications.length,
      transitionTypeDisplay: TRANSITION_TYPE_LABELS[transition.transitionType] ?? transition.transitionType,
      statusDisplay: STATUS_LABELS[transition.status] ?? transition.status,
      urgencyDisplay: URGENCY_LABELS[transition.urgency] ?? transition.urgency
    };
  }

  /**
   * Get transitions by client
   */
  async getTransitionsByClient(
    clientId: UUID,
    _context: UserContext
  ): Promise<CareTransition[]> {
    return this.transitionRepo.findByClient(clientId);
  }

  /**
   * Get active transitions for client
   */
  async getActiveTransitionsByClient(
    clientId: UUID,
    _context: UserContext
  ): Promise<CareTransition[]> {
    return this.transitionRepo.findActiveByClient(clientId);
  }

  /**
   * Query transitions with filters
   */
  async queryTransitions(
    filters: CareTransitionFilters,
    _context: UserContext
  ): Promise<CareTransition[]> {
    return this.transitionRepo.findWithFilters(filters);
  }

  /**
   * Get support resources for a transition type
   */
  async getSupportResources(
    transitionType: string,
    organizationId?: UUID,
    _context?: UserContext
  ): Promise<TransitionSupportResource[]> {
    return this.resourceRepo.findByTransitionType(transitionType, organizationId);
  }

  /**
   * Get family transition dashboard data
   */
  async getFamilyDashboard(
    clientId: UUID,
    _context: UserContext
  ): Promise<FamilyTransitionDashboard> {
    // Get active transitions with details
    const activeTransitions = await this.transitionRepo.findActiveByClient(clientId);
    const transitionsWithDetails: CareTransitionWithDetails[] = [];

    for (const transition of activeTransitions) {
      const familyMember = await this.familyMemberRepo.findById(transition.familyMemberId);
      const checklistProgress = await this.checklistRepo.getProgressSummary(transition.id);
      const communications = await this.communicationRepo.findByTransition(transition.id);
      const updates = await this.updateRepo.findByTransition(transition.id, false);

      transitionsWithDetails.push({
        ...transition,
        clientName: '',
        familyMemberName: familyMember !== null && familyMember !== undefined
          ? `${familyMember.firstName} ${familyMember.lastName}`
          : 'Unknown',
        coordinatorName: undefined,
        checklistTotal: checklistProgress.total,
        checklistCompleted: checklistProgress.completed,
        checklistOverdue: checklistProgress.overdue,
        lastUpdateAt: updates.length > 0 ? updates[0]?.createdAt : undefined,
        communicationCount: communications.length,
        transitionTypeDisplay: TRANSITION_TYPE_LABELS[transition.transitionType] ?? transition.transitionType,
        statusDisplay: STATUS_LABELS[transition.status] ?? transition.status,
        urgencyDisplay: URGENCY_LABELS[transition.urgency] ?? transition.urgency
      });
    }

    // Get recent public updates
    const recentUpdates = await this.updateRepo.findRecentPublicByClient(clientId, 10);

    // Get pending checklist items across all active transitions
    const pendingItems: TransitionChecklistItem[] = [];
    for (const transition of activeTransitions) {
      const items = await this.checklistRepo.findIncompleteByTransition(transition.id);
      pendingItems.push(...items);
    }

    // Get support resources for first active transition type
    let supportResources: TransitionSupportResource[] = [];
    if (activeTransitions.length > 0) {
      const firstTransition = activeTransitions[0];
      if (firstTransition !== undefined) {
        supportResources = await this.resourceRepo.findByTransitionType(
          firstTransition.transitionType,
          firstTransition.organizationId
        );
      }
    }

    // Get upcoming follow-ups
    const upcomingFollowUps = activeTransitions
      .filter(t => t.followUpRequired && t.followUpDate !== undefined)
      .map(t => ({
        transitionId: t.id,
        transitionType: t.transitionType,
        followUpDate: t.followUpDate!,
        notes: t.followUpNotes
      }))
      .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));

    return {
      activeTransitions: transitionsWithDetails,
      recentUpdates,
      pendingChecklistItems: pendingItems.slice(0, 10),
      supportResources,
      upcomingFollowUps
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Create default checklist items based on transition type
   */
  private async createDefaultChecklistItems(
    transition: CareTransition,
    context: UserContext
  ): Promise<void> {
    const defaultItems = this.getDefaultChecklistItems(transition.transitionType);

    for (const item of defaultItems) {
      await this.checklistRepo.createItem({
        transitionId: transition.id,
        clientId: transition.clientId,
        category: item.category,
        title: item.title,
        description: item.description,
        priority: item.priority,
        assignedTo: item.assignedTo,
        sortOrder: item.sortOrder,
        organizationId: transition.organizationId,
        createdBy: context.userId
      });
    }
  }

  private getDefaultChecklistItems(transitionType: string): Array<{
    category: TransitionChecklistCategory;
    title: string;
    description?: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    assignedTo: 'FAMILY' | 'COORDINATOR' | 'CAREGIVER' | 'OTHER';
    sortOrder: number;
  }> {
    const commonItems: Array<{
      category: TransitionChecklistCategory;
      title: string;
      description?: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      assignedTo: 'FAMILY' | 'COORDINATOR' | 'CAREGIVER' | 'OTHER';
      sortOrder: number;
    }> = [
      { category: 'DOCUMENTATION', title: 'Update emergency contact information', priority: 'HIGH', assignedTo: 'FAMILY', sortOrder: 1 },
      { category: 'CARE_COORDINATION', title: 'Notify current care team', priority: 'HIGH', assignedTo: 'COORDINATOR', sortOrder: 2 },
      { category: 'MEDICATION', title: 'Review and reconcile medications', priority: 'HIGH', assignedTo: 'COORDINATOR', sortOrder: 3 }
    ];

    switch (transitionType) {
      case 'HOSPITALIZATION':
        return [
          ...commonItems,
          { category: 'DOCUMENTATION' as TransitionChecklistCategory, title: 'Obtain hospital admission paperwork', priority: 'HIGH' as const, assignedTo: 'FAMILY' as const, sortOrder: 4 },
          { category: 'CARE_COORDINATION' as TransitionChecklistCategory, title: 'Pause scheduled home care visits', priority: 'HIGH' as const, assignedTo: 'COORDINATOR' as const, sortOrder: 5 },
          { category: 'FAMILY_SUPPORT' as TransitionChecklistCategory, title: 'Provide hospital visitation guidelines', priority: 'MEDIUM' as const, assignedTo: 'COORDINATOR' as const, sortOrder: 6 }
        ];

      case 'HOSPITAL_DISCHARGE':
        return [
          ...commonItems,
          { category: 'DOCUMENTATION' as TransitionChecklistCategory, title: 'Obtain discharge summary', priority: 'HIGH' as const, assignedTo: 'FAMILY' as const, sortOrder: 4 },
          { category: 'HOME_PREPARATION' as TransitionChecklistCategory, title: 'Prepare home for patient return', priority: 'HIGH' as const, assignedTo: 'FAMILY' as const, sortOrder: 5 },
          { category: 'EQUIPMENT' as TransitionChecklistCategory, title: 'Arrange necessary medical equipment', priority: 'HIGH' as const, assignedTo: 'COORDINATOR' as const, sortOrder: 6 },
          { category: 'FOLLOW_UP' as TransitionChecklistCategory, title: 'Schedule follow-up appointments', priority: 'HIGH' as const, assignedTo: 'COORDINATOR' as const, sortOrder: 7 },
          { category: 'CARE_COORDINATION' as TransitionChecklistCategory, title: 'Resume home care schedule', priority: 'HIGH' as const, assignedTo: 'COORDINATOR' as const, sortOrder: 8 }
        ];

      case 'SKILLED_NURSING':
      case 'ASSISTED_LIVING':
      case 'MEMORY_CARE':
        return [
          ...commonItems,
          { category: 'DOCUMENTATION' as TransitionChecklistCategory, title: 'Complete facility admission paperwork', priority: 'HIGH' as const, assignedTo: 'FAMILY' as const, sortOrder: 4 },
          { category: 'DOCUMENTATION' as TransitionChecklistCategory, title: 'Transfer medical records', priority: 'HIGH' as const, assignedTo: 'COORDINATOR' as const, sortOrder: 5 },
          { category: 'FAMILY_SUPPORT' as TransitionChecklistCategory, title: 'Tour facility with family', priority: 'MEDIUM' as const, assignedTo: 'COORDINATOR' as const, sortOrder: 6 },
          { category: 'CARE_COORDINATION' as TransitionChecklistCategory, title: 'Coordinate with facility care team', priority: 'HIGH' as const, assignedTo: 'COORDINATOR' as const, sortOrder: 7 }
        ];

      case 'HOSPICE':
        return [
          ...commonItems,
          { category: 'DOCUMENTATION' as TransitionChecklistCategory, title: 'Complete hospice enrollment paperwork', priority: 'HIGH' as const, assignedTo: 'FAMILY' as const, sortOrder: 4 },
          { category: 'FAMILY_SUPPORT' as TransitionChecklistCategory, title: 'Provide grief and support resources', priority: 'HIGH' as const, assignedTo: 'COORDINATOR' as const, sortOrder: 5 },
          { category: 'CARE_COORDINATION' as TransitionChecklistCategory, title: 'Coordinate with hospice team', priority: 'HIGH' as const, assignedTo: 'COORDINATOR' as const, sortOrder: 6 },
          { category: 'EQUIPMENT' as TransitionChecklistCategory, title: 'Arrange comfort care equipment', priority: 'HIGH' as const, assignedTo: 'COORDINATOR' as const, sortOrder: 7 }
        ];

      default:
        return commonItems;
    }
  }
}
