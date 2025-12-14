/**
 * @folkcare/family-engagement - Grief & Bereavement Repository
 *
 * Data access layer for grief and bereavement resources,
 * support records, memorials, and interactions.
 */

import type { UUID } from '@folkcare/core';
import type {
  BereavementResource,
  BereavementSupport,
  SupportInteraction,
  Memorial,
  MemorialGuestbookEntry,
  BereavementSupportRequest,
  BereavementResourceFilters,
  BereavementSupportFilters
} from '../types/grief-bereavement.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Database = { query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }> };

// ============================================================================
// Bereavement Resource Repository
// ============================================================================

export class BereavementResourceRepository {
  constructor(private db: Database) {}

  async create(data: Partial<BereavementResource>): Promise<BereavementResource> {
    const result = await this.db.query(
      `INSERT INTO bereavement_resources (
        title, description, category, resource_type, status,
        content, external_url, file_url,
        contact_name, contact_phone, contact_email, address, hours_of_operation,
        grief_stage, tags, language, estimated_read_time,
        is_national, states_covered, religion_specific,
        is_featured, sort_order, organization_id,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING *`,
      [
        data.title,
        data.description,
        data.category,
        data.resourceType,
        data.status || 'ACTIVE',
        data.content,
        data.externalUrl,
        data.fileUrl,
        data.contactName,
        data.contactPhone,
        data.contactEmail,
        data.address,
        data.hoursOfOperation,
        data.griefStage || 'ANY',
        data.tags || [],
        data.language || 'en',
        data.estimatedReadTime,
        data.isNational ?? true,
        data.statesCovered,
        data.religionSpecific,
        data.isFeatured ?? false,
        data.sortOrder ?? 0,
        data.organizationId,
        data.createdBy,
        data.updatedBy
      ]
    );
    return this.mapToResource(result.rows[0]);
  }

  async findById(id: UUID): Promise<BereavementResource | null> {
    const result = await this.db.query(
      'SELECT * FROM bereavement_resources WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] ? this.mapToResource(result.rows[0]) : null;
  }

  async update(id: UUID, data: Partial<BereavementResource>): Promise<BereavementResource | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      category: 'category',
      resourceType: 'resource_type',
      status: 'status',
      content: 'content',
      externalUrl: 'external_url',
      fileUrl: 'file_url',
      contactName: 'contact_name',
      contactPhone: 'contact_phone',
      contactEmail: 'contact_email',
      address: 'address',
      hoursOfOperation: 'hours_of_operation',
      griefStage: 'grief_stage',
      tags: 'tags',
      language: 'language',
      estimatedReadTime: 'estimated_read_time',
      isNational: 'is_national',
      statesCovered: 'states_covered',
      religionSpecific: 'religion_specific',
      isFeatured: 'is_featured',
      sortOrder: 'sort_order',
      updatedBy: 'updated_by'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (data[key as keyof BereavementResource] !== undefined) {
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(data[key as keyof BereavementResource]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) return this.findById(id);

    setClauses.push(`updated_at = NOW()`);
    setClauses.push(`version = version + 1`);
    values.push(id);

    const result = await this.db.query(
      `UPDATE bereavement_resources SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND is_deleted = false RETURNING *`,
      values
    );
    return result.rows[0] ? this.mapToResource(result.rows[0]) : null;
  }

  async delete(id: UUID): Promise<boolean> {
    const result = await this.db.query(
      'UPDATE bereavement_resources SET is_deleted = true, updated_at = NOW() WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return (result.rows as unknown[]).length > 0 || true;
  }

  async findByFilters(filters: BereavementResourceFilters): Promise<BereavementResource[]> {
    const conditions: string[] = ['is_deleted = false'];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filters.category) {
      conditions.push(`category = $${paramIndex}`);
      values.push(filters.category);
      paramIndex++;
    }

    if (filters.resourceType) {
      conditions.push(`resource_type = $${paramIndex}`);
      values.push(filters.resourceType);
      paramIndex++;
    }

    if (filters.griefStage) {
      conditions.push(`(grief_stage = $${paramIndex} OR grief_stage = 'ANY')`);
      values.push(filters.griefStage);
      paramIndex++;
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.language) {
      conditions.push(`language = $${paramIndex}`);
      values.push(filters.language);
      paramIndex++;
    }

    if (filters.isFeatured !== undefined) {
      conditions.push(`is_featured = $${paramIndex}`);
      values.push(filters.isFeatured);
      paramIndex++;
    }

    if (filters.isNational !== undefined) {
      conditions.push(`is_national = $${paramIndex}`);
      values.push(filters.isNational);
      paramIndex++;
    }

    if (filters.state) {
      conditions.push(`(is_national = true OR $${paramIndex} = ANY(states_covered))`);
      values.push(filters.state);
      paramIndex++;
    }

    if (filters.organizationId) {
      conditions.push(`(organization_id IS NULL OR organization_id = $${paramIndex})`);
      values.push(filters.organizationId);
      paramIndex++;
    } else {
      conditions.push(`organization_id IS NULL`);
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(`tags && $${paramIndex}`);
      values.push(filters.tags);
      paramIndex++;
    }

    if (filters.searchQuery) {
      conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      values.push(`%${filters.searchQuery}%`);
      paramIndex++;
    }

    const result = await this.db.query(
      `SELECT * FROM bereavement_resources
       WHERE ${conditions.join(' AND ')}
       ORDER BY is_featured DESC, sort_order ASC, title ASC`,
      values
    );

    return result.rows.map((row) => this.mapToResource(row));
  }

  async incrementViewCount(id: UUID): Promise<void> {
    await this.db.query(
      'UPDATE bereavement_resources SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );
  }

  async incrementHelpfulCount(id: UUID): Promise<void> {
    await this.db.query(
      'UPDATE bereavement_resources SET helpful_count = helpful_count + 1 WHERE id = $1',
      [id]
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToResource(row: any): BereavementResource {
    return {
      id: row.id as UUID,
      title: row.title,
      description: row.description,
      category: row.category,
      resourceType: row.resource_type,
      status: row.status,
      content: row.content,
      externalUrl: row.external_url,
      fileUrl: row.file_url,
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
      contactEmail: row.contact_email,
      address: row.address,
      hoursOfOperation: row.hours_of_operation,
      griefStage: row.grief_stage,
      tags: row.tags || [],
      language: row.language,
      estimatedReadTime: row.estimated_read_time,
      isNational: row.is_national,
      statesCovered: row.states_covered,
      religionSpecific: row.religion_specific,
      isFeatured: row.is_featured,
      sortOrder: row.sort_order,
      viewCount: row.view_count,
      helpfulCount: row.helpful_count,
      lastReviewedAt: row.last_reviewed_at,
      reviewedBy: row.reviewed_by as UUID,
      organizationId: row.organization_id as UUID,
      createdAt: row.created_at,
      createdBy: row.created_by as UUID,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by as UUID,
      version: row.version ?? 1
    };
  }
}

// ============================================================================
// Bereavement Support Repository
// ============================================================================

export class BereavementSupportRepository {
  constructor(private db: Database) {}

  async create(data: Partial<BereavementSupport>): Promise<BereavementSupport> {
    const result = await this.db.query(
      `INSERT INTO bereavement_support (
        client_id, family_member_id, loss_type, date_of_loss, anticipated_date,
        status, start_date, assigned_coordinator_id,
        initial_assessment_notes, support_plan_notes, special_considerations,
        preferred_contact_method, contact_frequency,
        organization_id, branch_id, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        data.clientId,
        data.familyMemberId,
        data.lossType,
        data.dateOfLoss,
        data.anticipatedDate,
        data.status || 'ACTIVE',
        data.startDate || new Date().toISOString().split('T')[0],
        data.assignedCoordinatorId,
        data.initialAssessmentNotes,
        data.supportPlanNotes,
        data.specialConsiderations,
        data.preferredContactMethod,
        data.contactFrequency,
        data.organizationId,
        data.branchId,
        data.createdBy,
        data.updatedBy
      ]
    );
    return this.mapToSupport(result.rows[0]);
  }

  async findById(id: UUID): Promise<BereavementSupport | null> {
    const result = await this.db.query(
      'SELECT * FROM bereavement_support WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] ? this.mapToSupport(result.rows[0]) : null;
  }

  async findByClientId(clientId: UUID): Promise<BereavementSupport[]> {
    const result = await this.db.query(
      'SELECT * FROM bereavement_support WHERE client_id = $1 AND is_deleted = false ORDER BY created_at DESC',
      [clientId]
    );
    return result.rows.map((row) => this.mapToSupport(row));
  }

  async findByFamilyMemberId(familyMemberId: UUID): Promise<BereavementSupport[]> {
    const result = await this.db.query(
      'SELECT * FROM bereavement_support WHERE family_member_id = $1 AND is_deleted = false ORDER BY created_at DESC',
      [familyMemberId]
    );
    return result.rows.map((row) => this.mapToSupport(row));
  }

  async update(id: UUID, data: Partial<BereavementSupport>): Promise<BereavementSupport | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      status: 'status',
      dateOfLoss: 'date_of_loss',
      endDate: 'end_date',
      assignedCoordinatorId: 'assigned_coordinator_id',
      supportPlanNotes: 'support_plan_notes',
      specialConsiderations: 'special_considerations',
      preferredContactMethod: 'preferred_contact_method',
      contactFrequency: 'contact_frequency',
      doNotContactUntil: 'do_not_contact_until',
      nextFollowUpDate: 'next_follow_up_date',
      lastContactDate: 'last_contact_date',
      totalContacts: 'total_contacts',
      resourcesShared: 'resources_shared',
      memorialId: 'memorial_id',
      familyFeedback: 'family_feedback',
      updatedBy: 'updated_by'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (data[key as keyof BereavementSupport] !== undefined) {
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(data[key as keyof BereavementSupport]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) return this.findById(id);

    setClauses.push(`updated_at = NOW()`);
    setClauses.push(`version = version + 1`);
    values.push(id);

    const result = await this.db.query(
      `UPDATE bereavement_support SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND is_deleted = false RETURNING *`,
      values
    );
    return result.rows[0] ? this.mapToSupport(result.rows[0]) : null;
  }

  async findByFilters(filters: BereavementSupportFilters): Promise<BereavementSupport[]> {
    const conditions: string[] = ['is_deleted = false'];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filters.clientId) {
      conditions.push(`client_id = $${paramIndex}`);
      values.push(filters.clientId);
      paramIndex++;
    }

    if (filters.familyMemberId) {
      conditions.push(`family_member_id = $${paramIndex}`);
      values.push(filters.familyMemberId);
      paramIndex++;
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(`status = ANY($${paramIndex})`);
        values.push(filters.status);
      } else {
        conditions.push(`status = $${paramIndex}`);
        values.push(filters.status);
      }
      paramIndex++;
    }

    if (filters.lossType) {
      conditions.push(`loss_type = $${paramIndex}`);
      values.push(filters.lossType);
      paramIndex++;
    }

    if (filters.assignedCoordinatorId) {
      conditions.push(`assigned_coordinator_id = $${paramIndex}`);
      values.push(filters.assignedCoordinatorId);
      paramIndex++;
    }

    if (filters.requiresFollowUp) {
      conditions.push(`next_follow_up_date IS NOT NULL AND next_follow_up_date <= CURRENT_DATE`);
    }

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramIndex}`);
      values.push(filters.organizationId);
      paramIndex++;
    }

    if (filters.branchId) {
      conditions.push(`branch_id = $${paramIndex}`);
      values.push(filters.branchId);
      paramIndex++;
    }

    const result = await this.db.query(
      `SELECT * FROM bereavement_support WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
      values
    );
    return result.rows.map((row) => this.mapToSupport(row));
  }

  async findPendingFollowUps(coordinatorId?: UUID, organizationId?: UUID): Promise<BereavementSupport[]> {
    const conditions: string[] = [
      'is_deleted = false',
      "status = 'ACTIVE'",
      'next_follow_up_date IS NOT NULL',
      'next_follow_up_date <= CURRENT_DATE'
    ];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (coordinatorId) {
      conditions.push(`assigned_coordinator_id = $${paramIndex}`);
      values.push(coordinatorId);
      paramIndex++;
    }

    if (organizationId) {
      conditions.push(`organization_id = $${paramIndex}`);
      values.push(organizationId);
      paramIndex++;
    }

    const result = await this.db.query(
      `SELECT * FROM bereavement_support WHERE ${conditions.join(' AND ')} ORDER BY next_follow_up_date ASC`,
      values
    );
    return result.rows.map((row) => this.mapToSupport(row));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToSupport(row: any): BereavementSupport {
    return {
      id: row.id as UUID,
      clientId: row.client_id as UUID,
      familyMemberId: row.family_member_id as UUID,
      lossType: row.loss_type,
      dateOfLoss: row.date_of_loss,
      anticipatedDate: row.anticipated_date,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      assignedCoordinatorId: row.assigned_coordinator_id as UUID,
      initialAssessmentNotes: row.initial_assessment_notes,
      supportPlanNotes: row.support_plan_notes,
      specialConsiderations: row.special_considerations,
      preferredContactMethod: row.preferred_contact_method,
      contactFrequency: row.contact_frequency,
      doNotContactUntil: row.do_not_contact_until,
      nextFollowUpDate: row.next_follow_up_date,
      lastContactDate: row.last_contact_date,
      totalContacts: row.total_contacts,
      resourcesShared: row.resources_shared || [],
      memorialId: row.memorial_id as UUID,
      familyFeedback: row.family_feedback,
      organizationId: row.organization_id as UUID,
      branchId: row.branch_id as UUID,
      createdAt: row.created_at,
      createdBy: row.created_by as UUID,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by as UUID,
      version: row.version ?? 1
    };
  }
}

// ============================================================================
// Support Interaction Repository
// ============================================================================

export class SupportInteractionRepository {
  constructor(private db: Database) {}

  async create(data: Partial<SupportInteraction>): Promise<SupportInteraction> {
    const result = await this.db.query(
      `INSERT INTO bereavement_support_interactions (
        bereavement_support_id, client_id, interaction_type,
        interaction_date, interaction_time, duration_minutes,
        coordinator_id, family_member_ids, summary,
        emotional_state, concerns_raised, next_steps,
        resources_shared, referrals_made,
        requires_follow_up, follow_up_date, follow_up_notes,
        organization_id, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        data.bereavementSupportId,
        data.clientId,
        data.interactionType,
        data.interactionDate,
        data.interactionTime,
        data.durationMinutes,
        data.coordinatorId,
        data.familyMemberIds || [],
        data.summary,
        data.emotionalState,
        data.concernsRaised,
        data.nextSteps,
        data.resourcesShared || [],
        data.referralsMade || [],
        data.requiresFollowUp ?? false,
        data.followUpDate,
        data.followUpNotes,
        data.organizationId,
        data.createdBy,
        data.updatedBy
      ]
    );
    return this.mapToInteraction(result.rows[0]);
  }

  async findById(id: UUID): Promise<SupportInteraction | null> {
    const result = await this.db.query(
      'SELECT * FROM bereavement_support_interactions WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] ? this.mapToInteraction(result.rows[0]) : null;
  }

  async findBySupportId(supportId: UUID): Promise<SupportInteraction[]> {
    const result = await this.db.query(
      'SELECT * FROM bereavement_support_interactions WHERE bereavement_support_id = $1 AND is_deleted = false ORDER BY interaction_date DESC, interaction_time DESC',
      [supportId]
    );
    return result.rows.map((row) => this.mapToInteraction(row));
  }

  async findByClientId(clientId: UUID): Promise<SupportInteraction[]> {
    const result = await this.db.query(
      'SELECT * FROM bereavement_support_interactions WHERE client_id = $1 AND is_deleted = false ORDER BY interaction_date DESC',
      [clientId]
    );
    return result.rows.map((row) => this.mapToInteraction(row));
  }

  async findPendingFollowUps(coordinatorId?: UUID): Promise<SupportInteraction[]> {
    const conditions = [
      'is_deleted = false',
      'requires_follow_up = true',
      'follow_up_date IS NOT NULL',
      'follow_up_date <= CURRENT_DATE'
    ];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (coordinatorId) {
      conditions.push(`coordinator_id = $${paramIndex}`);
      values.push(coordinatorId);
      paramIndex++;
    }

    const result = await this.db.query(
      `SELECT * FROM bereavement_support_interactions WHERE ${conditions.join(' AND ')} ORDER BY follow_up_date ASC`,
      values
    );
    return result.rows.map((row) => this.mapToInteraction(row));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToInteraction(row: any): SupportInteraction {
    return {
      id: row.id as UUID,
      bereavementSupportId: row.bereavement_support_id as UUID,
      clientId: row.client_id as UUID,
      interactionType: row.interaction_type,
      interactionDate: row.interaction_date,
      interactionTime: row.interaction_time,
      durationMinutes: row.duration_minutes,
      coordinatorId: row.coordinator_id as UUID,
      familyMemberIds: row.family_member_ids || [],
      summary: row.summary,
      emotionalState: row.emotional_state,
      concernsRaised: row.concerns_raised,
      nextSteps: row.next_steps,
      resourcesShared: row.resources_shared || [],
      referralsMade: row.referrals_made || [],
      requiresFollowUp: row.requires_follow_up,
      followUpDate: row.follow_up_date,
      followUpNotes: row.follow_up_notes,
      organizationId: row.organization_id as UUID,
      createdAt: row.created_at,
      createdBy: row.created_by as UUID,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by as UUID,
      version: row.version ?? 1
    };
  }
}

// ============================================================================
// Memorial Repository
// ============================================================================

export class MemorialRepository {
  constructor(private db: Database) {}

  async create(data: Partial<Memorial>): Promise<Memorial> {
    const result = await this.db.query(
      `INSERT INTO memorials (
        client_id, title, biography, obituary,
        photo_url, additional_photos, video_url,
        birth_date, death_date, service_date, service_location,
        donation_info, allow_guestbook, allow_candles,
        privacy, access_code, is_published,
        created_by_family_member_id, family_admin_ids,
        organization_id, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        data.clientId,
        data.title,
        data.biography,
        data.obituary,
        data.photoUrl,
        data.additionalPhotos || [],
        data.videoUrl,
        data.birthDate,
        data.deathDate,
        data.serviceDate,
        data.serviceLocation,
        data.donationInfo ? JSON.stringify(data.donationInfo) : null,
        data.allowGuestbook ?? true,
        data.allowCandles ?? true,
        data.privacy || 'PRIVATE',
        data.accessCode,
        data.isPublished ?? false,
        data.createdByFamilyMemberId,
        data.familyAdminIds || [],
        data.organizationId,
        data.createdBy,
        data.updatedBy
      ]
    );
    return this.mapToMemorial(result.rows[0]);
  }

  async findById(id: UUID): Promise<Memorial | null> {
    const result = await this.db.query(
      'SELECT * FROM memorials WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] ? this.mapToMemorial(result.rows[0]) : null;
  }

  async findByClientId(clientId: UUID): Promise<Memorial | null> {
    const result = await this.db.query(
      'SELECT * FROM memorials WHERE client_id = $1 AND is_deleted = false',
      [clientId]
    );
    return result.rows[0] ? this.mapToMemorial(result.rows[0]) : null;
  }

  async findByAccessCode(accessCode: string): Promise<Memorial | null> {
    const result = await this.db.query(
      "SELECT * FROM memorials WHERE access_code = $1 AND is_deleted = false AND privacy = 'PRIVATE'",
      [accessCode]
    );
    return result.rows[0] ? this.mapToMemorial(result.rows[0]) : null;
  }

  async update(id: UUID, data: Partial<Memorial>): Promise<Memorial | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      title: 'title',
      biography: 'biography',
      obituary: 'obituary',
      photoUrl: 'photo_url',
      additionalPhotos: 'additional_photos',
      videoUrl: 'video_url',
      birthDate: 'birth_date',
      deathDate: 'death_date',
      serviceDate: 'service_date',
      serviceLocation: 'service_location',
      allowGuestbook: 'allow_guestbook',
      allowCandles: 'allow_candles',
      privacy: 'privacy',
      accessCode: 'access_code',
      isPublished: 'is_published',
      familyAdminIds: 'family_admin_ids',
      updatedBy: 'updated_by'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (data[key as keyof Memorial] !== undefined) {
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(data[key as keyof Memorial]);
        paramIndex++;
      }
    }

    if (data.donationInfo !== undefined) {
      setClauses.push(`donation_info = $${paramIndex}`);
      values.push(data.donationInfo ? JSON.stringify(data.donationInfo) : null);
      paramIndex++;
    }

    if (data.isPublished && !data.publishedAt) {
      setClauses.push(`published_at = NOW()`);
    }

    if (setClauses.length === 0) return this.findById(id);

    setClauses.push(`updated_at = NOW()`);
    setClauses.push(`version = version + 1`);
    values.push(id);

    const result = await this.db.query(
      `UPDATE memorials SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND is_deleted = false RETURNING *`,
      values
    );
    return result.rows[0] ? this.mapToMemorial(result.rows[0]) : null;
  }

  async delete(id: UUID): Promise<boolean> {
    const result = await this.db.query(
      'UPDATE memorials SET is_deleted = true, updated_at = NOW() WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return (result.rows as unknown[]).length > 0 || true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToMemorial(row: any): Memorial {
    return {
      id: row.id as UUID,
      clientId: row.client_id as UUID,
      title: row.title,
      biography: row.biography,
      obituary: row.obituary,
      photoUrl: row.photo_url,
      additionalPhotos: row.additional_photos || [],
      videoUrl: row.video_url,
      birthDate: row.birth_date,
      deathDate: row.death_date,
      serviceDate: row.service_date,
      serviceLocation: row.service_location,
      donationInfo: row.donation_info,
      allowGuestbook: row.allow_guestbook,
      allowCandles: row.allow_candles,
      privacy: row.privacy,
      accessCode: row.access_code,
      isPublished: row.is_published,
      publishedAt: row.published_at,
      createdByFamilyMemberId: row.created_by_family_member_id as UUID,
      familyAdminIds: row.family_admin_ids || [],
      organizationId: row.organization_id as UUID,
      createdAt: row.created_at,
      createdBy: row.created_by as UUID,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by as UUID,
      version: row.version ?? 1
    };
  }
}

// ============================================================================
// Memorial Guestbook Repository
// ============================================================================

export class MemorialGuestbookRepository {
  constructor(private db: Database) {}

  async create(data: Partial<MemorialGuestbookEntry>): Promise<MemorialGuestbookEntry> {
    const result = await this.db.query(
      `INSERT INTO memorial_guestbook_entries (
        memorial_id, author_name, author_email, author_relationship,
        message, is_candle, is_approved, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.memorialId,
        data.authorName,
        data.authorEmail,
        data.authorRelationship,
        data.message,
        data.isCandle ?? false,
        data.isApproved ?? false,
        data.createdBy
      ]
    );
    return this.mapToEntry(result.rows[0]);
  }

  async findById(id: UUID): Promise<MemorialGuestbookEntry | null> {
    const result = await this.db.query(
      'SELECT * FROM memorial_guestbook_entries WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] ? this.mapToEntry(result.rows[0]) : null;
  }

  async findByMemorialId(memorialId: UUID, approvedOnly: boolean = true): Promise<MemorialGuestbookEntry[]> {
    const conditions = ['memorial_id = $1', 'is_deleted = false'];
    if (approvedOnly) {
      conditions.push('is_approved = true');
    }
    const result = await this.db.query(
      `SELECT * FROM memorial_guestbook_entries WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
      [memorialId]
    );
    return result.rows.map((row) => this.mapToEntry(row));
  }

  async findPendingApproval(memorialId: UUID): Promise<MemorialGuestbookEntry[]> {
    const result = await this.db.query(
      'SELECT * FROM memorial_guestbook_entries WHERE memorial_id = $1 AND is_approved = false AND is_deleted = false ORDER BY created_at ASC',
      [memorialId]
    );
    return result.rows.map((row) => this.mapToEntry(row));
  }

  async approve(id: UUID, approvedBy: UUID): Promise<MemorialGuestbookEntry | null> {
    const result = await this.db.query(
      'UPDATE memorial_guestbook_entries SET is_approved = true, approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2 AND is_deleted = false RETURNING *',
      [approvedBy, id]
    );
    return result.rows[0] ? this.mapToEntry(result.rows[0]) : null;
  }

  async report(id: UUID, reason: string): Promise<MemorialGuestbookEntry | null> {
    const result = await this.db.query(
      'UPDATE memorial_guestbook_entries SET is_reported = true, report_reason = $1, updated_at = NOW() WHERE id = $2 AND is_deleted = false RETURNING *',
      [reason, id]
    );
    return result.rows[0] ? this.mapToEntry(result.rows[0]) : null;
  }

  async delete(id: UUID): Promise<boolean> {
    const result = await this.db.query(
      'UPDATE memorial_guestbook_entries SET is_deleted = true, updated_at = NOW() WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return (result.rows as unknown[]).length > 0 || true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToEntry(row: any): MemorialGuestbookEntry {
    return {
      id: row.id as UUID,
      memorialId: row.memorial_id as UUID,
      authorName: row.author_name,
      authorEmail: row.author_email,
      authorRelationship: row.author_relationship,
      message: row.message,
      isCandle: row.is_candle,
      isApproved: row.is_approved,
      approvedBy: row.approved_by as UUID,
      approvedAt: row.approved_at,
      isReported: row.is_reported,
      reportReason: row.report_reason,
      createdAt: row.created_at,
      createdBy: row.created_by as UUID,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by as UUID,
      version: row.version ?? 1
    };
  }
}

// ============================================================================
// Bereavement Support Request Repository
// ============================================================================

export class BereavementSupportRequestRepository {
  constructor(private db: Database) {}

  async create(data: Partial<BereavementSupportRequest>): Promise<BereavementSupportRequest> {
    const result = await this.db.query(
      `INSERT INTO bereavement_support_requests (
        bereavement_support_id, client_id, family_member_id,
        request_type, status, description, urgency,
        organization_id, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.bereavementSupportId,
        data.clientId,
        data.familyMemberId,
        data.requestType,
        data.status || 'PENDING',
        data.description,
        data.urgency || 'MEDIUM',
        data.organizationId,
        data.createdBy,
        data.updatedBy
      ]
    );
    return this.mapToRequest(result.rows[0]);
  }

  async findById(id: UUID): Promise<BereavementSupportRequest | null> {
    const result = await this.db.query(
      'SELECT * FROM bereavement_support_requests WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] ? this.mapToRequest(result.rows[0]) : null;
  }

  async findBySupportId(supportId: UUID): Promise<BereavementSupportRequest[]> {
    const result = await this.db.query(
      'SELECT * FROM bereavement_support_requests WHERE bereavement_support_id = $1 AND is_deleted = false ORDER BY created_at DESC',
      [supportId]
    );
    return result.rows.map((row) => this.mapToRequest(row));
  }

  async findPending(organizationId?: UUID): Promise<BereavementSupportRequest[]> {
    const conditions = ['is_deleted = false', "status = 'PENDING'"];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (organizationId) {
      conditions.push(`organization_id = $${paramIndex}`);
      values.push(organizationId);
      paramIndex++;
    }

    const result = await this.db.query(
      `SELECT * FROM bereavement_support_requests WHERE ${conditions.join(' AND ')} ORDER BY
        CASE urgency WHEN 'CRISIS' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
        created_at ASC`,
      values
    );
    return result.rows.map((row) => this.mapToRequest(row));
  }

  async update(id: UUID, data: Partial<BereavementSupportRequest>): Promise<BereavementSupportRequest | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      setClauses.push(`status = $${paramIndex}`);
      values.push(data.status);
      paramIndex++;
    }

    if (data.assignedTo !== undefined) {
      setClauses.push(`assigned_to = $${paramIndex}`);
      values.push(data.assignedTo);
      paramIndex++;
    }

    if (data.responseNotes !== undefined) {
      setClauses.push(`response_notes = $${paramIndex}`);
      values.push(data.responseNotes);
      paramIndex++;
    }

    if (data.status === 'COMPLETED') {
      setClauses.push(`completed_at = NOW()`);
    }

    if (data.updatedBy !== undefined) {
      setClauses.push(`updated_by = $${paramIndex}`);
      values.push(data.updatedBy);
      paramIndex++;
    }

    if (setClauses.length === 0) return this.findById(id);

    setClauses.push(`updated_at = NOW()`);
    setClauses.push(`version = version + 1`);
    values.push(id);

    const result = await this.db.query(
      `UPDATE bereavement_support_requests SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND is_deleted = false RETURNING *`,
      values
    );
    return result.rows[0] ? this.mapToRequest(result.rows[0]) : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToRequest(row: any): BereavementSupportRequest {
    return {
      id: row.id as UUID,
      bereavementSupportId: row.bereavement_support_id as UUID,
      clientId: row.client_id as UUID,
      familyMemberId: row.family_member_id as UUID,
      requestType: row.request_type,
      status: row.status,
      description: row.description,
      urgency: row.urgency,
      assignedTo: row.assigned_to as UUID,
      responseNotes: row.response_notes,
      completedAt: row.completed_at,
      organizationId: row.organization_id as UUID,
      createdAt: row.created_at,
      createdBy: row.created_by as UUID,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by as UUID,
      version: row.version ?? 1
    };
  }
}

// ============================================================================
// Saved Resources Repository
// ============================================================================

export interface SavedResource {
  id: UUID;
  familyMemberId: UUID;
  resourceId: UUID;
  wasHelpful?: boolean;
  notes?: string;
  createdAt: string;
}

export class SavedResourceRepository {
  constructor(private db: Database) {}

  async save(familyMemberId: UUID, resourceId: UUID): Promise<SavedResource> {
    const result = await this.db.query(
      `INSERT INTO bereavement_saved_resources (family_member_id, resource_id)
       VALUES ($1, $2)
       ON CONFLICT (family_member_id, resource_id) DO UPDATE SET is_deleted = false
       RETURNING *`,
      [familyMemberId, resourceId]
    );
    return this.mapToSaved(result.rows[0]);
  }

  async unsave(familyMemberId: UUID, resourceId: UUID): Promise<void> {
    await this.db.query(
      'UPDATE bereavement_saved_resources SET is_deleted = true WHERE family_member_id = $1 AND resource_id = $2',
      [familyMemberId, resourceId]
    );
  }

  async markHelpful(familyMemberId: UUID, resourceId: UUID, wasHelpful: boolean): Promise<void> {
    await this.db.query(
      'UPDATE bereavement_saved_resources SET was_helpful = $1 WHERE family_member_id = $2 AND resource_id = $3',
      [wasHelpful, familyMemberId, resourceId]
    );
  }

  async findByFamilyMember(familyMemberId: UUID): Promise<SavedResource[]> {
    const result = await this.db.query(
      'SELECT * FROM bereavement_saved_resources WHERE family_member_id = $1 AND is_deleted = false',
      [familyMemberId]
    );
    return result.rows.map((row) => this.mapToSaved(row));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToSaved(row: any): SavedResource {
    return {
      id: row.id as UUID,
      familyMemberId: row.family_member_id as UUID,
      resourceId: row.resource_id as UUID,
      wasHelpful: row.was_helpful,
      notes: row.notes,
      createdAt: row.created_at
    };
  }
}
