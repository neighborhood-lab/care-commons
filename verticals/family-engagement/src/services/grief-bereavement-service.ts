/**
 * @folkcare/family-engagement - Grief & Bereavement Service
 *
 * Business logic for grief and bereavement support,
 * resources, memorials, and family interactions.
 */

import type { PermissionService, UUID, UserContext } from '@folkcare/core';
import type {
  BereavementResource,
  BereavementSupport,
  SupportInteraction,
  Memorial,
  MemorialGuestbookEntry,
  BereavementSupportRequest,
  BereavementResourceFilters,
  BereavementSupportFilters,
  CreateBereavementSupportInput,
  UpdateBereavementSupportInput,
  LogSupportInteractionInput,
  CreateMemorialInput,
  UpdateMemorialInput,
  AddGuestbookEntryInput,
  CreateBereavementResourceInput,
  SubmitSupportRequestInput,
  BereavementDashboard,
  FamilyBereavementView,
  BereavementResourceCategory
} from '../types/grief-bereavement.js';
import type {
  BereavementResourceRepository,
  BereavementSupportRepository,
  SupportInteractionRepository,
  MemorialRepository,
  MemorialGuestbookRepository,
  BereavementSupportRequestRepository,
  SavedResourceRepository
} from '../repositories/grief-bereavement-repository.js';
import type { FamilyMemberRepository } from '../repositories/family-engagement-repository.js';

export class GriefBereavementService {
  constructor(
    private resourceRepo: BereavementResourceRepository,
    private supportRepo: BereavementSupportRepository,
    private interactionRepo: SupportInteractionRepository,
    private memorialRepo: MemorialRepository,
    private guestbookRepo: MemorialGuestbookRepository,
    private requestRepo: BereavementSupportRequestRepository,
    private savedResourceRepo: SavedResourceRepository,
    private familyMemberRepo: FamilyMemberRepository,
    private permissions: PermissionService
  ) {}

  // ============================================================================
  // Bereavement Resource Management
  // ============================================================================

  async createResource(
    input: CreateBereavementResourceInput,
    context: UserContext
  ): Promise<BereavementResource> {
    this.permissions.requirePermission(context, 'bereavement_resources:create');

    return this.resourceRepo.create({
      ...input,
      griefStage: input.griefStage || 'ANY',
      tags: input.tags || [],
      language: input.language || 'en',
      isNational: input.isNational ?? true,
      isFeatured: input.isFeatured ?? false,
      sortOrder: input.sortOrder ?? 0,
      createdBy: context.userId,
      updatedBy: context.userId
    });
  }

  async getResource(id: UUID, _context: UserContext): Promise<BereavementResource> {
    const resource = await this.resourceRepo.findById(id);
    if (!resource) {
      throw new Error('Resource not found');
    }

    // Track view count
    await this.resourceRepo.incrementViewCount(id);

    return resource;
  }

  async updateResource(
    id: UUID,
    input: Partial<BereavementResource>,
    context: UserContext
  ): Promise<BereavementResource> {
    this.permissions.requirePermission(context, 'bereavement_resources:update');

    const resource = await this.resourceRepo.update(id, {
      ...input,
      updatedBy: context.userId
    });

    if (!resource) {
      throw new Error('Resource not found');
    }

    return resource;
  }

  async deleteResource(id: UUID, context: UserContext): Promise<void> {
    this.permissions.requirePermission(context, 'bereavement_resources:delete');

    await this.resourceRepo.delete(id);
  }

  async searchResources(
    filters: BereavementResourceFilters,
    context: UserContext
  ): Promise<BereavementResource[]> {
    // Add organization context if not admin
    const effectiveFilters = { ...filters };
    if (!effectiveFilters.organizationId && context.organizationId) {
      effectiveFilters.organizationId = context.organizationId;
    }

    return this.resourceRepo.findByFilters(effectiveFilters);
  }

  async markResourceHelpful(
    resourceId: UUID,
    familyMemberId: UUID,
    wasHelpful: boolean,
    _context: UserContext
  ): Promise<void> {
    if (wasHelpful) {
      await this.resourceRepo.incrementHelpfulCount(resourceId);
    }
    await this.savedResourceRepo.markHelpful(familyMemberId, resourceId, wasHelpful);
  }

  async saveResource(
    resourceId: UUID,
    familyMemberId: UUID,
    _context: UserContext
  ): Promise<void> {
    await this.savedResourceRepo.save(familyMemberId, resourceId);
  }

  async unsaveResource(
    resourceId: UUID,
    familyMemberId: UUID,
    _context: UserContext
  ): Promise<void> {
    await this.savedResourceRepo.unsave(familyMemberId, resourceId);
  }

  // ============================================================================
  // Bereavement Support Management
  // ============================================================================

  async createSupport(
    input: CreateBereavementSupportInput,
    context: UserContext
  ): Promise<BereavementSupport> {
    this.permissions.requirePermission(context, 'bereavement_support:create');

    return this.supportRepo.create({
      ...input,
      status: 'ACTIVE',
      startDate: new Date().toISOString().split('T')[0],
      totalContacts: 0,
      resourcesShared: [],
      createdBy: context.userId,
      updatedBy: context.userId
    });
  }

  async getSupport(id: UUID, _context: UserContext): Promise<BereavementSupport> {
    const support = await this.supportRepo.findById(id);
    if (!support) {
      throw new Error('Bereavement support record not found');
    }

    return support;
  }

  async updateSupport(
    id: UUID,
    input: UpdateBereavementSupportInput,
    context: UserContext
  ): Promise<BereavementSupport> {
    this.permissions.requirePermission(context, 'bereavement_support:update');

    const support = await this.supportRepo.update(id, {
      ...input,
      updatedBy: context.userId
    });

    if (!support) {
      throw new Error('Bereavement support record not found');
    }

    return support;
  }

  async getSupportByClient(clientId: UUID, _context: UserContext): Promise<BereavementSupport[]> {
    return this.supportRepo.findByClientId(clientId);
  }

  async getSupportByFamilyMember(familyMemberId: UUID, _context: UserContext): Promise<BereavementSupport[]> {
    return this.supportRepo.findByFamilyMemberId(familyMemberId);
  }

  async querySupport(
    filters: BereavementSupportFilters,
    _context: UserContext
  ): Promise<BereavementSupport[]> {
    return this.supportRepo.findByFilters(filters);
  }

  async completeSupport(id: UUID, context: UserContext): Promise<BereavementSupport> {
    this.permissions.requirePermission(context, 'bereavement_support:update');

    const support = await this.supportRepo.update(id, {
      status: 'COMPLETED',
      endDate: new Date().toISOString().split('T')[0],
      updatedBy: context.userId
    });

    if (!support) {
      throw new Error('Bereavement support record not found');
    }

    return support;
  }

  // ============================================================================
  // Support Interactions
  // ============================================================================

  async logInteraction(
    input: LogSupportInteractionInput,
    context: UserContext
  ): Promise<SupportInteraction> {
    this.permissions.requirePermission(context, 'bereavement_support:update');

    // Create interaction
    const interaction = await this.interactionRepo.create({
      ...input,
      coordinatorId: context.userId,
      requiresFollowUp: input.requiresFollowUp ?? false,
      createdBy: context.userId,
      updatedBy: context.userId
    });

    // Update support record with last contact and increment count
    await this.supportRepo.update(input.bereavementSupportId, {
      lastContactDate: input.interactionDate,
      nextFollowUpDate: input.followUpDate,
      updatedBy: context.userId
    });

    // If resources were shared, add them to support record
    if (input.resourcesShared && input.resourcesShared.length > 0) {
      const support = await this.supportRepo.findById(input.bereavementSupportId);
      if (support) {
        const allResources = [...new Set([...(support.resourcesShared || []), ...input.resourcesShared])];
        await this.supportRepo.update(input.bereavementSupportId, {
          resourcesShared: allResources,
          updatedBy: context.userId
        });
      }
    }

    return interaction;
  }

  async getInteractions(supportId: UUID, _context: UserContext): Promise<SupportInteraction[]> {
    return this.interactionRepo.findBySupportId(supportId);
  }

  async getInteractionsByClient(clientId: UUID, _context: UserContext): Promise<SupportInteraction[]> {
    return this.interactionRepo.findByClientId(clientId);
  }

  // ============================================================================
  // Memorial Management
  // ============================================================================

  async createMemorial(
    input: CreateMemorialInput,
    context: UserContext
  ): Promise<Memorial> {
    // Verify family member has access to this client
    const familyMember = await this.familyMemberRepo.findById(input.familyMemberId);
    if (!familyMember || familyMember.clientId !== input.clientId) {
      throw new Error('Invalid family member for this client');
    }

    return this.memorialRepo.create({
      ...input,
      createdByFamilyMemberId: input.familyMemberId,
      familyAdminIds: [input.familyMemberId],
      allowGuestbook: input.allowGuestbook ?? true,
      allowCandles: input.allowCandles ?? true,
      privacy: input.privacy || 'PRIVATE',
      isPublished: false,
      createdBy: context.userId,
      updatedBy: context.userId
    });
  }

  async getMemorial(id: UUID, _context: UserContext): Promise<Memorial> {
    const memorial = await this.memorialRepo.findById(id);
    if (!memorial) {
      throw new Error('Memorial not found');
    }

    return memorial;
  }

  async getMemorialByClient(clientId: UUID, _context: UserContext): Promise<Memorial | null> {
    return this.memorialRepo.findByClientId(clientId);
  }

  async getMemorialByAccessCode(accessCode: string): Promise<Memorial | null> {
    return this.memorialRepo.findByAccessCode(accessCode);
  }

  async updateMemorial(
    id: UUID,
    input: UpdateMemorialInput,
    context: UserContext
  ): Promise<Memorial> {
    const memorial = await this.memorialRepo.findById(id);
    if (!memorial) {
      throw new Error('Memorial not found');
    }

    // Verify user has permission to edit
    const canEdit = memorial.familyAdminIds.includes(context.userId) ||
                    this.hasOrgPermission(context, 'bereavement_support:update');

    if (!canEdit) {
      throw new Error('Not authorized to edit this memorial');
    }

    const updated = await this.memorialRepo.update(id, {
      ...input,
      updatedBy: context.userId
    });

    if (!updated) {
      throw new Error('Failed to update memorial');
    }

    return updated;
  }

  async publishMemorial(id: UUID, context: UserContext): Promise<Memorial> {
    return this.updateMemorial(id, { isPublished: true }, context);
  }

  async unpublishMemorial(id: UUID, context: UserContext): Promise<Memorial> {
    return this.updateMemorial(id, { isPublished: false }, context);
  }

  async deleteMemorial(id: UUID, context: UserContext): Promise<void> {
    const memorial = await this.memorialRepo.findById(id);
    if (!memorial) {
      throw new Error('Memorial not found');
    }

    // Only creator or org admin can delete
    const canDelete = memorial.createdByFamilyMemberId === context.userId ||
                      this.hasOrgPermission(context, 'bereavement_support:delete');

    if (!canDelete) {
      throw new Error('Not authorized to delete this memorial');
    }

    await this.memorialRepo.delete(id);
  }

  // ============================================================================
  // Guestbook Management
  // ============================================================================

  async addGuestbookEntry(
    input: AddGuestbookEntryInput,
    context: UserContext
  ): Promise<MemorialGuestbookEntry> {
    const memorial = await this.memorialRepo.findById(input.memorialId);
    if (!memorial) {
      throw new Error('Memorial not found');
    }

    if (!memorial.allowGuestbook) {
      throw new Error('Guestbook is not enabled for this memorial');
    }

    if (input.isCandle && !memorial.allowCandles) {
      throw new Error('Virtual candles are not enabled for this memorial');
    }

    return this.guestbookRepo.create({
      ...input,
      isCandle: input.isCandle ?? false,
      isApproved: false, // Requires moderation
      createdBy: context.userId
    });
  }

  async getGuestbookEntries(
    memorialId: UUID,
    approvedOnly: boolean = true,
    _context: UserContext
  ): Promise<MemorialGuestbookEntry[]> {
    return this.guestbookRepo.findByMemorialId(memorialId, approvedOnly);
  }

  async getPendingGuestbookEntries(
    memorialId: UUID,
    context: UserContext
  ): Promise<MemorialGuestbookEntry[]> {
    const memorial = await this.memorialRepo.findById(memorialId);
    if (!memorial) {
      throw new Error('Memorial not found');
    }

    // Only family admins can see pending entries
    if (!memorial.familyAdminIds.includes(context.userId)) {
      throw new Error('Not authorized to view pending entries');
    }

    return this.guestbookRepo.findPendingApproval(memorialId);
  }

  async approveGuestbookEntry(
    entryId: UUID,
    context: UserContext
  ): Promise<MemorialGuestbookEntry> {
    const entry = await this.guestbookRepo.findById(entryId);
    if (!entry) {
      throw new Error('Guestbook entry not found');
    }

    const memorial = await this.memorialRepo.findById(entry.memorialId);
    if (!memorial || !memorial.familyAdminIds.includes(context.userId)) {
      throw new Error('Not authorized to approve entries');
    }

    const approved = await this.guestbookRepo.approve(entryId, context.userId);
    if (!approved) {
      throw new Error('Failed to approve entry');
    }

    return approved;
  }

  async reportGuestbookEntry(
    entryId: UUID,
    reason: string,
    _context: UserContext
  ): Promise<MemorialGuestbookEntry> {
    const reported = await this.guestbookRepo.report(entryId, reason);
    if (!reported) {
      throw new Error('Guestbook entry not found');
    }

    return reported;
  }

  async deleteGuestbookEntry(entryId: UUID, context: UserContext): Promise<void> {
    const entry = await this.guestbookRepo.findById(entryId);
    if (!entry) {
      throw new Error('Guestbook entry not found');
    }

    const memorial = await this.memorialRepo.findById(entry.memorialId);
    if (!memorial || !memorial.familyAdminIds.includes(context.userId)) {
      throw new Error('Not authorized to delete entries');
    }

    await this.guestbookRepo.delete(entryId);
  }

  // ============================================================================
  // Support Requests
  // ============================================================================

  async submitSupportRequest(
    input: SubmitSupportRequestInput,
    context: UserContext
  ): Promise<BereavementSupportRequest> {
    return this.requestRepo.create({
      ...input,
      status: 'PENDING',
      urgency: input.urgency || 'MEDIUM',
      createdBy: context.userId,
      updatedBy: context.userId
    });
  }

  async getSupportRequests(supportId: UUID, _context: UserContext): Promise<BereavementSupportRequest[]> {
    return this.requestRepo.findBySupportId(supportId);
  }

  async getPendingSupportRequests(
    organizationId: UUID | undefined,
    context: UserContext
  ): Promise<BereavementSupportRequest[]> {
    this.permissions.requirePermission(context, 'bereavement_support:read');

    return this.requestRepo.findPending(organizationId || context.organizationId);
  }

  async assignSupportRequest(
    requestId: UUID,
    assignedTo: UUID,
    context: UserContext
  ): Promise<BereavementSupportRequest> {
    this.permissions.requirePermission(context, 'bereavement_support:update');

    const request = await this.requestRepo.update(requestId, {
      assignedTo,
      status: 'IN_PROGRESS',
      updatedBy: context.userId
    });

    if (!request) {
      throw new Error('Support request not found');
    }

    return request;
  }

  async completeSupportRequest(
    requestId: UUID,
    responseNotes: string,
    context: UserContext
  ): Promise<BereavementSupportRequest> {
    this.permissions.requirePermission(context, 'bereavement_support:update');

    const request = await this.requestRepo.update(requestId, {
      status: 'COMPLETED',
      responseNotes,
      updatedBy: context.userId
    });

    if (!request) {
      throw new Error('Support request not found');
    }

    return request;
  }

  // ============================================================================
  // Dashboard & Views
  // ============================================================================

  async getCoordinatorDashboard(
    context: UserContext
  ): Promise<BereavementDashboard> {
    this.permissions.requirePermission(context, 'bereavement_support:read');

    // Get active cases
    const activeCases = await this.supportRepo.findByFilters({
      status: 'ACTIVE',
      organizationId: context.organizationId
    });

    // Get pending follow-ups
    const pendingFollowUps = await this.supportRepo.findPendingFollowUps(
      context.userId,
      context.organizationId
    );

    // Get pending requests
    const pendingRequests = await this.requestRepo.findPending(context.organizationId);
    const crisisRequests = pendingRequests.filter(r => r.urgency === 'CRISIS');

    // Get recent interactions
    const recentInteractions = await this.interactionRepo.findPendingFollowUps(context.userId);

    return {
      activeCases: activeCases.length,
      pendingFollowUps: pendingFollowUps.length,
      crisisRequests: crisisRequests.length,
      todayFollowUps: pendingFollowUps.slice(0, 10).map(s => ({
        supportId: s.id,
        clientName: 'Client', // Would need to join with clients table
        familyMemberName: 'Family Member', // Would need to join
        lastContactDate: s.lastContactDate || '',
        daysWithoutContact: s.lastContactDate
          ? Math.floor((Date.now() - new Date(s.lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0
      })),
      recentInteractions: recentInteractions.slice(0, 10).map(i => ({
        supportId: i.bereavementSupportId,
        clientName: 'Client',
        interactionType: i.interactionType,
        interactionDate: i.interactionDate,
        summary: i.summary
      })),
      pendingRequests: pendingRequests.slice(0, 10).map(r => ({
        requestId: r.id,
        familyMemberName: 'Family Member',
        requestType: r.requestType,
        urgency: r.urgency,
        createdAt: r.createdAt
      })),
      statistics: {
        totalSupported: activeCases.length,
        averageSupportDuration: 0, // Would need calculation
        resourcesSharedThisMonth: 0, // Would need calculation
        referralsMadeThisMonth: 0 // Would need calculation
      }
    };
  }

  async getFamilyBereavementView(
    clientId: UUID,
    familyMemberId: UUID,
    _context: UserContext
  ): Promise<FamilyBereavementView> {
    // Get support record if exists
    const supportRecords = await this.supportRepo.findByClientId(clientId);
    const support = supportRecords.find(s => s.familyMemberId === familyMemberId);

    // Get memorial if exists
    const memorial = await this.memorialRepo.findByClientId(clientId);

    // Get resources by category
    const allResources = await this.resourceRepo.findByFilters({
      status: 'ACTIVE'
    });

    const resourcesByCategory: Record<BereavementResourceCategory, BereavementResource[]> = {
      EMOTIONAL_SUPPORT: [],
      PRACTICAL_GUIDANCE: [],
      FINANCIAL_LEGAL: [],
      SPIRITUAL_RELIGIOUS: [],
      MEMORIAL_SERVICES: [],
      CHILDREN_FAMILY: [],
      SELF_CARE: [],
      COMMUNITY_CONNECTIONS: [],
      READING_MATERIALS: [],
      CRISIS_SUPPORT: []
    };

    for (const resource of allResources) {
      if (resourcesByCategory[resource.category]) {
        resourcesByCategory[resource.category].push(resource);
      }
    }

    // Get recent interactions (public facing)
    let recentInteractions: Array<{ date: string; type: string; summary: string }> = [];
    if (support) {
      const interactions = await this.interactionRepo.findBySupportId(support.id);
      recentInteractions = interactions.slice(0, 5).map(i => ({
        date: i.interactionDate,
        type: i.interactionType,
        summary: i.summary.substring(0, 100) + (i.summary.length > 100 ? '...' : '')
      }));
    }

    // Get pending requests
    let pendingRequests: BereavementSupportRequest[] = [];
    if (support) {
      const allRequests = await this.requestRepo.findBySupportId(support.id);
      pendingRequests = allRequests.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');
    }

    // Get saved resources
    const savedResourceLinks = await this.savedResourceRepo.findByFamilyMember(familyMemberId);
    const savedResources: BereavementResource[] = [];
    for (const link of savedResourceLinks) {
      const resource = await this.resourceRepo.findById(link.resourceId);
      if (resource) {
        savedResources.push(resource);
      }
    }

    return {
      support,
      memorial: memorial || undefined,
      resourcesByCategory,
      recentInteractions,
      pendingRequests,
      savedResources
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private hasOrgPermission(
    context: UserContext,
    permission: string
  ): boolean {
    try {
      this.permissions.requirePermission(context, permission);
      return true;
    } catch {
      return false;
    }
  }
}
