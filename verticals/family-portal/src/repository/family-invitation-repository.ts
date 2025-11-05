/**
 * Family Invitation Repository
 *
 * Data access layer for family invitations
 */

import { Repository, Database, UUID } from '@care-commons/core';
import type { FamilyInvitation, InvitationStatus } from '../types/index.js';

export class FamilyInvitationRepository extends Repository<FamilyInvitation> {
  constructor(database: Database) {
    super({ tableName: 'family_invitations', database, enableAudit: false, enableSoftDelete: false });
  }

  protected mapRowToEntity(row: any): FamilyInvitation {
    return {
      id: row.id,
      organizationId: row.organization_id,
      clientId: row.client_id,
      authorizedContactId: row.authorized_contact_id,
      email: row.email,
      token: row.token,
      expiresAt: row.expires_at,
      status: row.status,
      sentAt: row.sent_at,
      acceptedAt: row.accepted_at,
      revokedAt: row.revoked_at,
      proposedPermissions: row.proposed_permissions || [],
      proposedAccessLevel: row.proposed_access_level,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
    };
  }

  protected mapEntityToRow(entity: Partial<FamilyInvitation>): Record<string, any> {
    const row: Record<string, any> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.authorizedContactId !== undefined) row.authorized_contact_id = entity.authorizedContactId;
    if (entity.email !== undefined) row.email = entity.email;
    if (entity.token !== undefined) row.token = entity.token;
    if (entity.expiresAt !== undefined) row.expires_at = entity.expiresAt;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.sentAt !== undefined) row.sent_at = entity.sentAt;
    if (entity.acceptedAt !== undefined) row.accepted_at = entity.acceptedAt;
    if (entity.revokedAt !== undefined) row.revoked_at = entity.revokedAt;
    if (entity.proposedPermissions !== undefined) row.proposed_permissions = entity.proposedPermissions;
    if (entity.proposedAccessLevel !== undefined) row.proposed_access_level = entity.proposedAccessLevel;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.createdBy !== undefined) row.created_by = entity.createdBy;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;

    return row;
  }

  async findByToken(token: string): Promise<FamilyInvitation | null> {
    const row = await this.database.knex(this.tableName)
      .where({ token })
      .where('expires_at', '>', new Date())
      .first();

    return row ? this.mapRowToEntity(row) : null;
  }

  async findByEmail(email: string): Promise<FamilyInvitation[]> {
    const rows = await this.database.knex(this.tableName)
      .where({ email })
      .orderBy('created_at', 'desc');

    return rows.map((row) => this.mapRowToEntity(row));
  }

  async findByClientId(clientId: UUID): Promise<FamilyInvitation[]> {
    const rows = await this.database.knex(this.tableName)
      .where({ client_id: clientId })
      .orderBy('created_at', 'desc');

    return rows.map((row) => this.mapRowToEntity(row));
  }

  async findPendingInvitations(clientId?: UUID): Promise<FamilyInvitation[]> {
    let query = this.database.knex(this.tableName)
      .where('status', 'PENDING')
      .where('expires_at', '>', new Date());

    if (clientId) {
      query = query.where('client_id', clientId);
    }

    const rows = await query.orderBy('created_at', 'desc');
    return rows.map((row) => this.mapRowToEntity(row));
  }

  async updateStatus(id: UUID, status: InvitationStatus, timestamp?: Date): Promise<void> {
    const updates: Record<string, any> = { status, updated_at: new Date() };

    if (status === 'SENT' && timestamp) {
      updates.sent_at = timestamp;
    } else if (status === 'ACCEPTED' && timestamp) {
      updates.accepted_at = timestamp;
    } else if (status === 'REVOKED' && timestamp) {
      updates.revoked_at = timestamp;
    }

    await this.database.knex(this.tableName).where({ id }).update(updates);
  }
}
