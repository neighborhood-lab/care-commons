/**
 * Physician Communication Service
 *
 * Manages secure messaging between clinical staff and physicians
 * for patient care coordination.
 */

import { Pool } from 'pg';
import { UUID } from '@folkcare/core';
import { format } from 'date-fns';

// Enums
export type CommunicationType =
  | 'ORDER_REQUEST'
  | 'STATUS_UPDATE'
  | 'ABNORMAL_FINDING'
  | 'MEDICATION_QUESTION'
  | 'CARE_PLAN_CHANGE'
  | 'WOUND_UPDATE'
  | 'VITAL_SIGN_ALERT'
  | 'LAB_RESULT_NOTIFICATION'
  | 'GENERAL_INQUIRY'
  | 'OTHER';

export type CommunicationUrgency = 'ROUTINE' | 'URGENT' | 'STAT';

export type ContactMethod =
  | 'PHONE'
  | 'FAX'
  | 'EMAIL'
  | 'SECURE_MESSAGE'
  | 'PORTAL'
  | 'IN_PERSON';

export type CommunicationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'RESPONSE_RECEIVED'
  | 'FAILED'
  | 'CANCELLED';

export type PreferredContact = 'PHONE' | 'FAX' | 'EMAIL' | 'SECURE_MESSAGE' | 'PORTAL';

export type RelationshipType =
  | 'PRIMARY_CARE'
  | 'SPECIALIST'
  | 'HOSPITALIST'
  | 'SURGEON'
  | 'PSYCHIATRIST'
  | 'OTHER';

// Types
export interface Physician {
  id: UUID;
  organizationId: UUID;
  firstName: string;
  lastName: string;
  credentials?: string;
  specialty?: string;
  npi?: string;
  phone?: string;
  fax?: string;
  email?: string;
  secureEmail?: string;
  practiceName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  preferredContact: PreferredContact;
  acceptsSecureMessages: boolean;
  portalUrl?: string;
  contactNotes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientPhysician {
  id: UUID;
  clientId: UUID;
  physicianId: UUID;
  relationshipType: RelationshipType;
  specialtyNotes?: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  physician?: Physician;
}

export interface PhysicianCommunication {
  id: UUID;
  organizationId: UUID;
  branchId?: UUID;
  clientId: UUID;
  physicianId: UUID;
  visitId?: UUID;
  communicationType: CommunicationType;
  urgency: CommunicationUrgency;
  subject: string;
  message: string;
  clinicalContext?: string;
  attachments?: unknown[];
  contactMethod: ContactMethod;
  contactNotes?: string;
  sentBy: UUID;
  sentByName: string;
  sentByCredentials?: string;
  sentAt: Date;
  status: CommunicationStatus;
  deliveredAt?: Date;
  readAt?: Date;
  requiresResponse: boolean;
  responseDueBy?: Date;
  physicianResponse?: string;
  responseReceivedAt?: Date;
  respondedVia?: string;
  requiresFollowUp: boolean;
  followUpNotes?: string;
  followUpBy?: UUID;
  followUpByName?: string;
  followUpCompletedAt?: Date;
  ordersReceived?: string;
  ordersEntered: boolean;
  ordersEnteredAt?: Date;
  ordersEnteredBy?: UUID;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  // Joined fields
  physician?: Physician;
}

export interface CommunicationTemplate {
  id: UUID;
  organizationId: UUID;
  name: string;
  communicationType: CommunicationType;
  subjectTemplate: string;
  messageTemplate: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Input types
export interface CreatePhysicianInput {
  organizationId: UUID;
  firstName: string;
  lastName: string;
  credentials?: string;
  specialty?: string;
  npi?: string;
  phone?: string;
  fax?: string;
  email?: string;
  secureEmail?: string;
  practiceName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  preferredContact?: PreferredContact;
  acceptsSecureMessages?: boolean;
  portalUrl?: string;
  contactNotes?: string;
}

export interface UpdatePhysicianInput {
  id: UUID;
  firstName?: string;
  lastName?: string;
  credentials?: string;
  specialty?: string;
  npi?: string;
  phone?: string;
  fax?: string;
  email?: string;
  secureEmail?: string;
  practiceName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  preferredContact?: PreferredContact;
  acceptsSecureMessages?: boolean;
  portalUrl?: string;
  contactNotes?: string;
}

export interface AddClientPhysicianInput {
  clientId: UUID;
  physicianId: UUID;
  relationshipType: RelationshipType;
  specialtyNotes?: string;
  isPrimary?: boolean;
}

export interface CreateCommunicationInput {
  organizationId: UUID;
  branchId?: UUID;
  clientId: UUID;
  physicianId: UUID;
  visitId?: UUID;
  communicationType: CommunicationType;
  urgency?: CommunicationUrgency;
  subject: string;
  message: string;
  clinicalContext?: string;
  attachments?: unknown[];
  contactMethod: ContactMethod;
  contactNotes?: string;
  sentBy: UUID;
  sentByName: string;
  sentByCredentials?: string;
  requiresResponse?: boolean;
  responseDueBy?: string;
}

export interface RecordResponseInput {
  id: UUID;
  physicianResponse: string;
  respondedVia?: string;
  ordersReceived?: string;
}

export interface CommunicationSummary {
  totalCommunications: number;
  pendingResponse: number;
  urgentPending: number;
  sentThisWeek: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

// Row types
interface PhysicianRow {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  credentials: string | null;
  specialty: string | null;
  npi: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  secure_email: string | null;
  practice_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  preferred_contact: PreferredContact;
  accepts_secure_messages: boolean;
  portal_url: string | null;
  contact_notes: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface ClientPhysicianRow {
  id: string;
  client_id: string;
  physician_id: string;
  relationship_type: RelationshipType;
  specialty_notes: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface CommunicationRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  client_id: string;
  physician_id: string;
  visit_id: string | null;
  communication_type: CommunicationType;
  urgency: CommunicationUrgency;
  subject: string;
  message: string;
  clinical_context: string | null;
  attachments: unknown[] | null;
  contact_method: ContactMethod;
  contact_notes: string | null;
  sent_by: string;
  sent_by_name: string;
  sent_by_credentials: string | null;
  sent_at: Date;
  status: CommunicationStatus;
  delivered_at: Date | null;
  read_at: Date | null;
  requires_response: boolean;
  response_due_by: Date | null;
  physician_response: string | null;
  response_received_at: Date | null;
  responded_via: string | null;
  requires_follow_up: boolean;
  follow_up_notes: string | null;
  follow_up_by: string | null;
  follow_up_by_name: string | null;
  follow_up_completed_at: Date | null;
  orders_received: string | null;
  orders_entered: boolean;
  orders_entered_at: Date | null;
  orders_entered_by: string | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

interface TemplateRow {
  id: string;
  organization_id: string;
  name: string;
  communication_type: CommunicationType;
  subject_template: string;
  message_template: string;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export class PhysicianCommunicationService {
  constructor(private pool: Pool) {}

  // ==================== PHYSICIANS ====================

  /**
   * Get all physicians for an organization
   */
  async getPhysicians(
    organizationId: UUID,
    options?: { activeOnly?: boolean; search?: string }
  ): Promise<Physician[]> {
    const activeOnly = options?.activeOnly !== false;
    const conditions = ['organization_id = $1'];
    const values: unknown[] = [organizationId];

    if (activeOnly) {
      conditions.push('is_active = true');
    }

    if (options?.search) {
      conditions.push(
        `(LOWER(first_name) LIKE $${conditions.length + 1} OR LOWER(last_name) LIKE $${conditions.length + 1} OR LOWER(practice_name) LIKE $${conditions.length + 1})`
      );
      values.push(`%${options.search.toLowerCase()}%`);
    }

    // Conditions are from hardcoded strings, safe for dynamic SQL
    // eslint-disable-next-line sonarjs/sql-queries
    const result = await this.pool.query<PhysicianRow>(
      `SELECT * FROM physicians WHERE ${conditions.join(' AND ')} ORDER BY last_name, first_name`,
      values
    );
    return result.rows.map(this.mapPhysician);
  }

  /**
   * Get physician by ID
   */
  async getPhysicianById(id: UUID): Promise<Physician | null> {
    const result = await this.pool.query<PhysicianRow>(
      `SELECT * FROM physicians WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? this.mapPhysician(result.rows[0]) : null;
  }

  /**
   * Create a new physician
   */
  async createPhysician(input: CreatePhysicianInput): Promise<Physician> {
    const result = await this.pool.query<PhysicianRow>(
      `INSERT INTO physicians (
        organization_id, first_name, last_name, credentials, specialty, npi,
        phone, fax, email, secure_email, practice_name,
        address_line1, address_line2, city, state, zip,
        preferred_contact, accepts_secure_messages, portal_url, contact_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        input.organizationId,
        input.firstName,
        input.lastName,
        input.credentials ?? null,
        input.specialty ?? null,
        input.npi ?? null,
        input.phone ?? null,
        input.fax ?? null,
        input.email ?? null,
        input.secureEmail ?? null,
        input.practiceName ?? null,
        input.addressLine1 ?? null,
        input.addressLine2 ?? null,
        input.city ?? null,
        input.state ?? null,
        input.zip ?? null,
        input.preferredContact ?? 'PHONE',
        input.acceptsSecureMessages ?? false,
        input.portalUrl ?? null,
        input.contactNotes ?? null,
      ]
    );
    // INSERT RETURNING always returns the inserted row
    return this.mapPhysician(result.rows[0]!);
  }

  /**
   * Update a physician
   */
  async updatePhysician(input: UpdatePhysicianInput): Promise<Physician> {
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [];
    let paramCount = 0;

    const fieldMap: Record<string, keyof UpdatePhysicianInput> = {
      first_name: 'firstName',
      last_name: 'lastName',
      credentials: 'credentials',
      specialty: 'specialty',
      npi: 'npi',
      phone: 'phone',
      fax: 'fax',
      email: 'email',
      secure_email: 'secureEmail',
      practice_name: 'practiceName',
      address_line1: 'addressLine1',
      address_line2: 'addressLine2',
      city: 'city',
      state: 'state',
      zip: 'zip',
      preferred_contact: 'preferredContact',
      accepts_secure_messages: 'acceptsSecureMessages',
      portal_url: 'portalUrl',
      contact_notes: 'contactNotes',
    };

    for (const [column, field] of Object.entries(fieldMap)) {
      if (input[field] !== undefined) {
        paramCount++;
        setClauses.push(`${column} = $${paramCount}`);
        values.push(input[field]);
      }
    }

    paramCount++;
    values.push(input.id);

    // Column names are from hardcoded field map, safe for dynamic SQL
    // eslint-disable-next-line sonarjs/sql-queries
    const result = await this.pool.query<PhysicianRow>(
      `UPDATE physicians SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      throw new Error('Physician not found');
    }
    return this.mapPhysician(result.rows[0]);
  }

  /**
   * Deactivate a physician
   */
  async deactivatePhysician(id: UUID): Promise<void> {
    await this.pool.query(
      `UPDATE physicians SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  // ==================== CLIENT-PHYSICIAN RELATIONSHIPS ====================

  /**
   * Get physicians for a client
   */
  async getClientPhysicians(clientId: UUID): Promise<ClientPhysician[]> {
    const result = await this.pool.query<ClientPhysicianRow & PhysicianRow>(
      `SELECT cp.*, p.first_name, p.last_name, p.credentials, p.specialty,
              p.phone, p.fax, p.email, p.secure_email, p.practice_name,
              p.preferred_contact, p.accepts_secure_messages, p.portal_url, p.contact_notes
       FROM client_physicians cp
       JOIN physicians p ON cp.physician_id = p.id
       WHERE cp.client_id = $1 AND cp.is_active = true AND p.is_active = true
       ORDER BY cp.is_primary DESC, p.last_name, p.first_name`,
      [clientId]
    );

    return result.rows.map((row) => ({
      ...this.mapClientPhysician(row),
      physician: this.mapPhysician(row),
    }));
  }

  /**
   * Add a physician to a client
   */
  async addClientPhysician(input: AddClientPhysicianInput): Promise<ClientPhysician> {
    // If setting as primary, unset other primaries first
    if (input.isPrimary) {
      await this.pool.query(
        `UPDATE client_physicians SET is_primary = false WHERE client_id = $1`,
        [input.clientId]
      );
    }

    const result = await this.pool.query<ClientPhysicianRow>(
      `INSERT INTO client_physicians (client_id, physician_id, relationship_type, specialty_notes, is_primary)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (client_id, physician_id) DO UPDATE SET
         relationship_type = EXCLUDED.relationship_type,
         specialty_notes = EXCLUDED.specialty_notes,
         is_primary = EXCLUDED.is_primary,
         is_active = true,
         updated_at = NOW()
       RETURNING *`,
      [
        input.clientId,
        input.physicianId,
        input.relationshipType,
        input.specialtyNotes ?? null,
        input.isPrimary ?? false,
      ]
    );

    // UPSERT RETURNING always returns a row
    return this.mapClientPhysician(result.rows[0]!);
  }

  /**
   * Remove a physician from a client (soft delete)
   */
  async removeClientPhysician(clientId: UUID, physicianId: UUID): Promise<void> {
    await this.pool.query(
      `UPDATE client_physicians SET is_active = false, updated_at = NOW()
       WHERE client_id = $1 AND physician_id = $2`,
      [clientId, physicianId]
    );
  }

  /**
   * Set primary physician for a client
   */
  async setPrimaryPhysician(clientId: UUID, physicianId: UUID): Promise<void> {
    await this.pool.query(
      `UPDATE client_physicians SET is_primary = false WHERE client_id = $1`,
      [clientId]
    );
    await this.pool.query(
      `UPDATE client_physicians SET is_primary = true, updated_at = NOW()
       WHERE client_id = $1 AND physician_id = $2`,
      [clientId, physicianId]
    );
  }

  // ==================== COMMUNICATIONS ====================

  /**
   * Create a new communication
   */
  async createCommunication(input: CreateCommunicationInput): Promise<PhysicianCommunication> {
    const result = await this.pool.query<CommunicationRow>(
      `INSERT INTO physician_communications (
        organization_id, branch_id, client_id, physician_id, visit_id,
        communication_type, urgency, subject, message, clinical_context,
        attachments, contact_method, contact_notes,
        sent_by, sent_by_name, sent_by_credentials,
        status, requires_response, response_due_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        input.organizationId,
        input.branchId ?? null,
        input.clientId,
        input.physicianId,
        input.visitId ?? null,
        input.communicationType,
        input.urgency ?? 'ROUTINE',
        input.subject,
        input.message,
        input.clinicalContext ?? null,
        input.attachments ? JSON.stringify(input.attachments) : null,
        input.contactMethod,
        input.contactNotes ?? null,
        input.sentBy,
        input.sentByName,
        input.sentByCredentials ?? null,
        'SENT',
        input.requiresResponse ?? true,
        input.responseDueBy ?? null,
      ]
    );

    // INSERT RETURNING always returns the inserted row
    return this.mapCommunication(result.rows[0]!);
  }

  /**
   * Get communication by ID
   */
  async getCommunicationById(id: UUID): Promise<PhysicianCommunication | null> {
    const result = await this.pool.query<CommunicationRow>(
      `SELECT * FROM physician_communications WHERE id = $1 AND is_deleted = false`,
      [id]
    );
    return result.rows[0] ? this.mapCommunication(result.rows[0]) : null;
  }

  /**
   * Get communications for a client
   */
  async getClientCommunications(
    clientId: UUID,
    options?: { physicianId?: UUID; limit?: number; offset?: number }
  ): Promise<PhysicianCommunication[]> {
    const conditions = ['pc.client_id = $1', 'pc.is_deleted = false'];
    const values: unknown[] = [clientId];
    let paramCount = 1;

    if (options?.physicianId) {
      paramCount++;
      conditions.push(`pc.physician_id = $${paramCount}`);
      values.push(options.physicianId);
    }

    let query = `
      SELECT pc.*, p.first_name, p.last_name, p.credentials, p.specialty, p.practice_name
      FROM physician_communications pc
      JOIN physicians p ON pc.physician_id = p.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY pc.sent_at DESC
    `;

    if (options?.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(options.limit);
    }

    if (options?.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(options.offset);
    }

    const result = await this.pool.query<CommunicationRow & PhysicianRow>(query, values);
    return result.rows.map((row) => ({
      ...this.mapCommunication(row),
      physician: this.mapPhysician(row),
    }));
  }

  /**
   * Get pending response communications
   */
  async getPendingResponses(organizationId: UUID): Promise<PhysicianCommunication[]> {
    const result = await this.pool.query<CommunicationRow & PhysicianRow>(
      `SELECT pc.*, p.first_name, p.last_name, p.credentials, p.specialty, p.practice_name
       FROM physician_communications pc
       JOIN physicians p ON pc.physician_id = p.id
       WHERE pc.organization_id = $1
         AND pc.requires_response = true
         AND pc.status NOT IN ('RESPONSE_RECEIVED', 'CANCELLED')
         AND pc.is_deleted = false
       ORDER BY pc.urgency DESC, pc.sent_at ASC`,
      [organizationId]
    );
    return result.rows.map((row) => ({
      ...this.mapCommunication(row),
      physician: this.mapPhysician(row),
    }));
  }

  /**
   * Get urgent communications
   */
  async getUrgentCommunications(organizationId: UUID): Promise<PhysicianCommunication[]> {
    const result = await this.pool.query<CommunicationRow & PhysicianRow>(
      `SELECT pc.*, p.first_name, p.last_name, p.credentials, p.specialty, p.practice_name
       FROM physician_communications pc
       JOIN physicians p ON pc.physician_id = p.id
       WHERE pc.organization_id = $1
         AND pc.urgency IN ('URGENT', 'STAT')
         AND pc.status NOT IN ('RESPONSE_RECEIVED', 'CANCELLED')
         AND pc.is_deleted = false
       ORDER BY
         CASE WHEN pc.urgency = 'STAT' THEN 0 ELSE 1 END,
         pc.sent_at ASC`,
      [organizationId]
    );
    return result.rows.map((row) => ({
      ...this.mapCommunication(row),
      physician: this.mapPhysician(row),
    }));
  }

  /**
   * Update communication status
   */
  async updateStatus(id: UUID, status: CommunicationStatus): Promise<PhysicianCommunication> {
    const extraFields: string[] = [];
    if (status === 'DELIVERED') {
      extraFields.push('delivered_at = NOW()');
    } else if (status === 'READ') {
      extraFields.push('read_at = NOW()');
    }

    const setClause = [`status = $2`, 'updated_at = NOW()', ...extraFields].join(', ');

    // Set clause uses hardcoded field names only, safe for dynamic SQL
    // eslint-disable-next-line sonarjs/sql-queries
    const result = await this.pool.query<CommunicationRow>(
      `UPDATE physician_communications SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, status]
    );

    if (!result.rows[0]) {
      throw new Error('Communication not found');
    }
    return this.mapCommunication(result.rows[0]);
  }

  /**
   * Record a physician response
   */
  async recordResponse(input: RecordResponseInput): Promise<PhysicianCommunication> {
    const result = await this.pool.query<CommunicationRow>(
      `UPDATE physician_communications SET
        status = 'RESPONSE_RECEIVED',
        physician_response = $2,
        response_received_at = NOW(),
        responded_via = $3,
        orders_received = $4,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [input.id, input.physicianResponse, input.respondedVia ?? null, input.ordersReceived ?? null]
    );

    if (!result.rows[0]) {
      throw new Error('Communication not found');
    }
    return this.mapCommunication(result.rows[0]);
  }

  /**
   * Mark orders as entered
   */
  async markOrdersEntered(
    id: UUID,
    enteredBy: UUID,
    _enteredByName: string
  ): Promise<PhysicianCommunication> {
    const result = await this.pool.query<CommunicationRow>(
      `UPDATE physician_communications SET
        orders_entered = true,
        orders_entered_at = NOW(),
        orders_entered_by = $2,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, enteredBy]
    );

    if (!result.rows[0]) {
      throw new Error('Communication not found');
    }
    return this.mapCommunication(result.rows[0]);
  }

  /**
   * Mark follow-up required
   */
  async markRequiresFollowUp(id: UUID, notes: string): Promise<PhysicianCommunication> {
    const result = await this.pool.query<CommunicationRow>(
      `UPDATE physician_communications SET
        requires_follow_up = true,
        follow_up_notes = $2,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, notes]
    );

    if (!result.rows[0]) {
      throw new Error('Communication not found');
    }
    return this.mapCommunication(result.rows[0]);
  }

  /**
   * Complete follow-up
   */
  async completeFollowUp(
    id: UUID,
    completedBy: UUID,
    completedByName: string
  ): Promise<PhysicianCommunication> {
    const result = await this.pool.query<CommunicationRow>(
      `UPDATE physician_communications SET
        follow_up_completed_at = NOW(),
        follow_up_by = $2,
        follow_up_by_name = $3,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, completedBy, completedByName]
    );

    if (!result.rows[0]) {
      throw new Error('Communication not found');
    }
    return this.mapCommunication(result.rows[0]);
  }

  /**
   * Soft delete a communication
   */
  async deleteCommunication(id: UUID): Promise<void> {
    await this.pool.query(
      `UPDATE physician_communications SET is_deleted = true, updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  // ==================== TEMPLATES ====================

  /**
   * Get communication templates
   */
  async getTemplates(
    organizationId: UUID,
    communicationType?: CommunicationType
  ): Promise<CommunicationTemplate[]> {
    if (communicationType) {
      const result = await this.pool.query<TemplateRow>(
        `SELECT * FROM physician_communication_templates
         WHERE organization_id = $1 AND communication_type = $2 AND is_active = true
         ORDER BY display_order, name`,
        [organizationId, communicationType]
      );
      return result.rows.map(this.mapTemplate);
    }

    const result = await this.pool.query<TemplateRow>(
      `SELECT * FROM physician_communication_templates
       WHERE organization_id = $1 AND is_active = true
       ORDER BY communication_type, display_order, name`,
      [organizationId]
    );
    return result.rows.map(this.mapTemplate);
  }

  /**
   * Create a template
   */
  async createTemplate(input: {
    organizationId: UUID;
    name: string;
    communicationType: CommunicationType;
    subjectTemplate: string;
    messageTemplate: string;
    displayOrder?: number;
  }): Promise<CommunicationTemplate> {
    const result = await this.pool.query<TemplateRow>(
      `INSERT INTO physician_communication_templates
         (organization_id, name, communication_type, subject_template, message_template, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.communicationType,
        input.subjectTemplate,
        input.messageTemplate,
        input.displayOrder ?? 0,
      ]
    );
    // INSERT RETURNING always returns the inserted row
    return this.mapTemplate(result.rows[0]!);
  }

  // ==================== SUMMARY ====================

  /**
   * Get communication summary for organization
   */
  async getCommunicationSummary(organizationId: UUID): Promise<CommunicationSummary> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Total communications
    const totalResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM physician_communications
       WHERE organization_id = $1 AND is_deleted = false`,
      [organizationId]
    );

    // Pending response
    const pendingResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM physician_communications
       WHERE organization_id = $1 AND is_deleted = false
         AND requires_response = true
         AND status NOT IN ('RESPONSE_RECEIVED', 'CANCELLED')`,
      [organizationId]
    );

    // Urgent pending
    const urgentResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM physician_communications
       WHERE organization_id = $1 AND is_deleted = false
         AND urgency IN ('URGENT', 'STAT')
         AND status NOT IN ('RESPONSE_RECEIVED', 'CANCELLED')`,
      [organizationId]
    );

    // Sent this week
    const weekResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM physician_communications
       WHERE organization_id = $1 AND is_deleted = false
         AND sent_at >= $2`,
      [organizationId, weekAgo]
    );

    // By type
    const typeResult = await this.pool.query<{ communication_type: string; count: string }>(
      `SELECT communication_type, COUNT(*) as count FROM physician_communications
       WHERE organization_id = $1 AND is_deleted = false
       GROUP BY communication_type`,
      [organizationId]
    );

    // By status
    const statusResult = await this.pool.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count FROM physician_communications
       WHERE organization_id = $1 AND is_deleted = false
       GROUP BY status`,
      [organizationId]
    );

    const byType: Record<string, number> = {};
    for (const row of typeResult.rows) {
      byType[row.communication_type] = parseInt(row.count, 10);
    }

    const byStatus: Record<string, number> = {};
    for (const row of statusResult.rows) {
      byStatus[row.status] = parseInt(row.count, 10);
    }

    // COUNT(*) queries always return a row
    return {
      totalCommunications: parseInt(totalResult.rows[0]!.count, 10),
      pendingResponse: parseInt(pendingResult.rows[0]!.count, 10),
      urgentPending: parseInt(urgentResult.rows[0]!.count, 10),
      sentThisWeek: parseInt(weekResult.rows[0]!.count, 10),
      byType,
      byStatus,
    };
  }

  /**
   * Generate printable communication log
   */
  generateCommunicationLog(communications: PhysicianCommunication[]): string {
    const lines: string[] = [];
    lines.push('='.repeat(60));
    lines.push('PHYSICIAN COMMUNICATION LOG');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`);
    lines.push('');

    if (communications.length === 0) {
      lines.push('No communications on file.');
      return lines.join('\n');
    }

    for (const comm of communications) {
      lines.push('-'.repeat(60));
      lines.push(`Date: ${format(comm.sentAt, 'MMM d, yyyy h:mm a')}`);
      lines.push(`Type: ${comm.communicationType.replace(/_/g, ' ')}`);
      lines.push(`Urgency: ${comm.urgency}`);
      lines.push(`Status: ${comm.status.replace(/_/g, ' ')}`);
      lines.push('');
      lines.push(`Subject: ${comm.subject}`);
      lines.push('');
      lines.push(`Message:`);
      lines.push(comm.message);
      lines.push('');
      const credentialsSuffix = comm.sentByCredentials ? `, ${comm.sentByCredentials}` : '';
      lines.push(`Sent by: ${comm.sentByName}${credentialsSuffix}`);
      lines.push(`Contact Method: ${comm.contactMethod.replace(/_/g, ' ')}`);

      if (comm.physicianResponse) {
        lines.push('');
        lines.push(`Response received: ${comm.responseReceivedAt ? format(comm.responseReceivedAt, 'MMM d, yyyy h:mm a') : 'Unknown'}`);
        lines.push(`Response: ${comm.physicianResponse}`);
      }

      if (comm.ordersReceived) {
        lines.push('');
        lines.push(`Orders received: ${comm.ordersReceived}`);
        lines.push(`Orders entered: ${comm.ordersEntered ? 'Yes' : 'No'}`);
      }

      lines.push('');
    }

    lines.push('='.repeat(60));
    lines.push('END OF LOG');
    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  // ==================== MAPPING ====================

  private mapPhysician(row: PhysicianRow): Physician {
    return {
      id: row.id,
      organizationId: row.organization_id,
      firstName: row.first_name,
      lastName: row.last_name,
      credentials: row.credentials ?? undefined,
      specialty: row.specialty ?? undefined,
      npi: row.npi ?? undefined,
      phone: row.phone ?? undefined,
      fax: row.fax ?? undefined,
      email: row.email ?? undefined,
      secureEmail: row.secure_email ?? undefined,
      practiceName: row.practice_name ?? undefined,
      addressLine1: row.address_line1 ?? undefined,
      addressLine2: row.address_line2 ?? undefined,
      city: row.city ?? undefined,
      state: row.state ?? undefined,
      zip: row.zip ?? undefined,
      preferredContact: row.preferred_contact,
      acceptsSecureMessages: row.accepts_secure_messages,
      portalUrl: row.portal_url ?? undefined,
      contactNotes: row.contact_notes ?? undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapClientPhysician(row: ClientPhysicianRow): ClientPhysician {
    return {
      id: row.id,
      clientId: row.client_id,
      physicianId: row.physician_id,
      relationshipType: row.relationship_type,
      specialtyNotes: row.specialty_notes ?? undefined,
      isPrimary: row.is_primary,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapCommunication(row: CommunicationRow): PhysicianCommunication {
    return {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id ?? undefined,
      clientId: row.client_id,
      physicianId: row.physician_id,
      visitId: row.visit_id ?? undefined,
      communicationType: row.communication_type,
      urgency: row.urgency,
      subject: row.subject,
      message: row.message,
      clinicalContext: row.clinical_context ?? undefined,
      attachments: row.attachments ?? undefined,
      contactMethod: row.contact_method,
      contactNotes: row.contact_notes ?? undefined,
      sentBy: row.sent_by,
      sentByName: row.sent_by_name,
      sentByCredentials: row.sent_by_credentials ?? undefined,
      sentAt: row.sent_at,
      status: row.status,
      deliveredAt: row.delivered_at ?? undefined,
      readAt: row.read_at ?? undefined,
      requiresResponse: row.requires_response,
      responseDueBy: row.response_due_by ?? undefined,
      physicianResponse: row.physician_response ?? undefined,
      responseReceivedAt: row.response_received_at ?? undefined,
      respondedVia: row.responded_via ?? undefined,
      requiresFollowUp: row.requires_follow_up,
      followUpNotes: row.follow_up_notes ?? undefined,
      followUpBy: row.follow_up_by ?? undefined,
      followUpByName: row.follow_up_by_name ?? undefined,
      followUpCompletedAt: row.follow_up_completed_at ?? undefined,
      ordersReceived: row.orders_received ?? undefined,
      ordersEntered: row.orders_entered,
      ordersEnteredAt: row.orders_entered_at ?? undefined,
      ordersEnteredBy: row.orders_entered_by ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted,
    };
  }

  private mapTemplate(row: TemplateRow): CommunicationTemplate {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      communicationType: row.communication_type,
      subjectTemplate: row.subject_template,
      messageTemplate: row.message_template,
      isActive: row.is_active,
      displayOrder: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
