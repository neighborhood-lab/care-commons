/**
 * Care Note Service
 *
 * Business logic for care notes and progress reporting
 */

import {
  UserContext,
  PaginationParams,
  PaginatedResult,
  UUID,
  NotFoundError,
  ValidationError,
  PermissionError,
} from '@care-commons/core';
import { PermissionService } from '@care-commons/core';
import {
  CareNote,
  CreateCareNoteInput,
  UpdateCareNoteInput,
  ReviewCareNoteInput,
  CareNoteSearchFilters,
  ProgressReport,
  ProgressReportType,
  CareNoteAnalytics,
} from '../types/care-note.js';
import { CareNoteRepository } from '../repository/care-note-repository.js';

export class CareNoteService {
  private repository: CareNoteRepository;
  private permissions: PermissionService;

  constructor(
    repository: CareNoteRepository,
    permissions: PermissionService
  ) {
    this.repository = repository;
    this.permissions = permissions;
  }

  /**
   * Create a new care note
   */
  async createCareNote(
    input: CreateCareNoteInput,
    context: UserContext
  ): Promise<CareNote> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-notes:create')) {
      throw new PermissionError(
        'Insufficient permissions to create care notes'
      );
    }

    // Validate organization access
    if (input.organizationId !== context.organizationId) {
      throw new PermissionError(
        'Cannot create care note for another organization'
      );
    }

    // Generate note number
    const noteNumber = await this.generateNoteNumber(input.organizationId);

    // Create care note
    const careNote = await this.repository.createCareNote({
      ...input,
      noteNumber,
      createdBy: context.userId,
      authorName: 'Caregiver', // FUTURE: Fetch from caregiver service
      authorRole: context.roles[0] || 'CAREGIVER',
    });

    return careNote;
  }

  /**
   * Get care note by ID
   */
  async getCareNoteById(id: UUID, context: UserContext): Promise<CareNote> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-notes:read')) {
      throw new PermissionError('Insufficient permissions to read care notes');
    }

    const careNote = await this.repository.getCareNoteById(id);
    if (!careNote) {
      throw new NotFoundError('Care note not found', { id });
    }

    // Check organization access
    if (careNote.organizationId !== context.organizationId) {
      throw new PermissionError(
        'Cannot access care note from another organization'
      );
    }

    // Check privacy restrictions
    if (
      careNote.isPrivate &&
      careNote.authorId !== context.userId &&
      !this.permissions.hasPermission(context, 'care-notes:read:private')
    ) {
      throw new PermissionError('Cannot access private care note');
    }

    return careNote;
  }

  /**
   * Update care note
   */
  async updateCareNote(
    id: UUID,
    input: UpdateCareNoteInput,
    context: UserContext
  ): Promise<CareNote> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-notes:update')) {
      throw new PermissionError(
        'Insufficient permissions to update care notes'
      );
    }

    // Get existing care note
    const existing = await this.getCareNoteById(id, context);

    // Prevent updates to locked or approved notes without proper permissions
    if (
      existing.status === 'LOCKED' &&
      !this.permissions.hasPermission(context, 'care-notes:update:locked')
    ) {
      throw new PermissionError('Cannot update locked care notes');
    }

    if (
      existing.status === 'APPROVED' &&
      !this.permissions.hasPermission(context, 'care-notes:update:approved')
    ) {
      throw new PermissionError('Cannot update approved care notes');
    }

    // Update care note
    const updated = await this.repository.updateCareNote(
      id,
      input,
      context.userId
    );

    return updated;
  }

  /**
   * Search care notes
   */
  async searchCareNotes(
    filters: CareNoteSearchFilters,
    context: UserContext,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<CareNote>> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-notes:read')) {
      throw new PermissionError('Insufficient permissions to read care notes');
    }

    // Force organization filter
    const orgFilters = {
      ...filters,
      organizationId: context.organizationId,
    };

    return this.repository.searchCareNotes(orgFilters, pagination);
  }

  /**
   * Get care notes by client ID
   */
  async getCareNotesByClientId(
    clientId: UUID,
    context: UserContext,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<CareNote>> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-notes:read')) {
      throw new PermissionError('Insufficient permissions to read care notes');
    }

    return this.repository.getCareNotesByClientId(clientId, pagination);
  }

  /**
   * Get care notes requiring review
   */
  async getCareNotesRequiringReview(
    context: UserContext,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<CareNote>> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-notes:review')) {
      throw new PermissionError(
        'Insufficient permissions to review care notes'
      );
    }

    return this.repository.getCareNotesRequiringReview(
      context.organizationId,
      pagination
    );
  }

  /**
   * Review care note
   */
  async reviewCareNote(
    id: UUID,
    input: ReviewCareNoteInput,
    context: UserContext
  ): Promise<CareNote> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-notes:review')) {
      throw new PermissionError(
        'Insufficient permissions to review care notes'
      );
    }

    // Get existing care note
    const existing = await this.getCareNoteById(id, context);

    // Validate review status transition
    if (existing.reviewStatus === 'APPROVED') {
      throw new ValidationError(
        'Cannot review already approved care note',
        {}
      );
    }

    return this.repository.reviewCareNote(
      id,
      context.userId,
      input.reviewStatus,
      input.reviewComments
    );
  }

  /**
   * Approve care note
   */
  async approveCareNote(id: UUID, context: UserContext): Promise<CareNote> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-notes:approve')) {
      throw new PermissionError(
        'Insufficient permissions to approve care notes'
      );
    }

    // Get existing care note
    await this.getCareNoteById(id, context);

    return this.repository.approveCareNote(id, context.userId);
  }

  /**
   * Delete care note (soft delete)
   */
  async deleteCareNote(id: UUID, context: UserContext): Promise<void> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-notes:delete')) {
      throw new PermissionError(
        'Insufficient permissions to delete care notes'
      );
    }

    // Get existing care note
    const existing = await this.getCareNoteById(id, context);

    // Prevent deletion of approved notes without proper permissions
    if (
      existing.status === 'APPROVED' &&
      !this.permissions.hasPermission(context, 'care-notes:delete:approved')
    ) {
      throw new PermissionError('Cannot delete approved care notes');
    }

    await this.repository.delete(id, context);
  }

  /**
   * Generate progress report
   */
  async generateProgressReport(
    clientId: UUID,
    reportType: ProgressReportType,
    periodStart: Date,
    periodEnd: Date,
    context: UserContext
  ): Promise<ProgressReport> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'progress-reports:create')) {
      throw new PermissionError(
        'Insufficient permissions to generate progress reports'
      );
    }

    // Generate report
    const report = await this.repository.generateProgressReport(
      clientId,
      reportType,
      periodStart,
      periodEnd,
      context.userId
    );

    return report;
  }

  /**
   * Get care note analytics
   */
  async getCareNoteAnalytics(
    context: UserContext,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<CareNoteAnalytics> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-notes:analytics')) {
      throw new PermissionError(
        'Insufficient permissions to view care note analytics'
      );
    }

    // Build filters
    const filters: CareNoteSearchFilters = {
      organizationId: context.organizationId,
      dateFrom,
      dateTo,
    };

    // Get all notes for analysis (with high limit)
    const result = await this.repository.searchCareNotes(filters, {
      page: 1,
      limit: 10000,
    });

    // Calculate analytics
    const analytics: CareNoteAnalytics = {
      totalNotes: result.total,
      notesByType: this.groupNotesByType(result.items),
      notesRequiringReview: result.items.filter(
        (n: CareNote) => n.reviewStatus === 'NOT_REVIEWED'
      ).length,
      averageNotesPerClient: 0, // Would need additional queries
      averageNotesPerCaregiver: 0, // Would need additional queries
      complianceRate: this.calculateComplianceRate(result.items),
      reviewCompletionRate: this.calculateReviewCompletionRate(result.items),
      incidentCount: result.items.filter(
        (n: CareNote) => n.noteType === 'INCIDENT_REPORT'
      ).length,
      concernCount: result.items.reduce(
        (sum: number, n: CareNote) => sum + (n.concerns?.length || 0),
        0
      ),
      alertCount: result.items.reduce(
        (sum: number, n: CareNote) => sum + (n.alerts?.length || 0),
        0
      ),
      changeInConditionCount: result.items.filter(
        (n: CareNote) => n.changeInCondition
      ).length,
    };

    return analytics;
  }

  /**
   * Generate note number
   */
  private async generateNoteNumber(_organizationId: UUID): Promise<string> {
    // Simple implementation - can be enhanced with sequential numbering
    // FUTURE: Use organizationId for sequential numbering per organization
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `CN-${year}${month}-${random}`;
  }

  /**
   * Group notes by type
   */
  private groupNotesByType(
    notes: CareNote[]
  ): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const note of notes) {
      grouped[note.noteType] = (grouped[note.noteType] || 0) + 1;
    }
    return grouped;
  }

  /**
   * Calculate compliance rate
   */
  private calculateComplianceRate(notes: CareNote[]): number {
    if (notes.length === 0) return 0;
    const compliant = notes.filter(
      (n) => n.complianceCheckStatus === 'COMPLIANT'
    ).length;
    return (compliant / notes.length) * 100;
  }

  /**
   * Calculate review completion rate
   */
  private calculateReviewCompletionRate(notes: CareNote[]): number {
    if (notes.length === 0) return 0;
    const reviewed = notes.filter((n) =>
      ['REVIEWED', 'APPROVED'].includes(n.reviewStatus)
    ).length;
    return (reviewed / notes.length) * 100;
  }
}
