import { UUID, Role } from '../types/base';
import {
  InviteToken,
  InviteTokenStatus,
  CreateInviteRequest,
  InviteDetails,
} from '../types/organization';
import { Database } from '../db/connection';
import { randomBytes } from 'node:crypto';

export interface User {
  id: UUID;
  organizationId: UUID;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  roles: Role[];
  branchIds: UUID[];
  status: string;
}

export interface CreateUserRequest {
  organizationId: UUID;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: Role[];
  branchIds?: UUID[];
  createdBy: UUID;
}

export interface IUserRepository {
  getUserById(id: UUID): Promise<User | null>;
  getUsersByIds(ids: UUID[]): Promise<User[]>;
  getUserByEmail(email: string, organizationId: UUID): Promise<User | null>;
  createUser(request: CreateUserRequest): Promise<User>;

  // Invitation methods
  createInviteToken(
    organizationId: UUID,
    request: CreateInviteRequest,
    createdBy: UUID
  ): Promise<InviteToken>;
  getInviteByToken(token: string): Promise<InviteToken | null>;
  validateInviteToken(token: string): Promise<InviteDetails | null>;
  acceptInviteToken(token: string, userId: UUID): Promise<void>;
  revokeInviteToken(token: string, revokedBy: UUID): Promise<void>;
  getOrganizationInvites(organizationId: UUID): Promise<InviteToken[]>;
}

export class UserRepository implements IUserRepository {
  constructor(private db: Database) {}

  async getUserById(id: UUID): Promise<User | null> {
    const query = `
      SELECT 
        id, organization_id, first_name, last_name, email, username,
        roles, branch_ids, status
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query<{
      id: string;
      organization_id: string;
      first_name: string;
      last_name: string;
      email: string;
      username: string;
      roles: string[];
      branch_ids: string[];
      status: string;
    }>(query, [id]);

    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }

    return {
      id: row.id,
      organizationId: row.organization_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      username: row.username,
      roles: row.roles as Role[],
      branchIds: row.branch_ids,
      status: row.status,
    };
  }

  async getUsersByIds(ids: UUID[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }

    const query = `
      SELECT 
        id, organization_id, first_name, last_name, email, username,
        roles, branch_ids, status
      FROM users
      WHERE id = ANY($1) AND deleted_at IS NULL
      ORDER BY last_name, first_name
    `;

    const result = await this.db.query<{
      id: string;
      organization_id: string;
      first_name: string;
      last_name: string;
      email: string;
      username: string;
      roles: string[];
      branch_ids: string[];
      status: string;
    }>(query, [ids]);

    return result.rows.map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      username: row.username,
      roles: row.roles as Role[],
      branchIds: row.branch_ids,
      status: row.status,
    }));
  }

  async getUserByEmail(email: string, organizationId: UUID): Promise<User | null> {
    const query = `
      SELECT 
        id, organization_id, first_name, last_name, email, username,
        roles, branch_ids, status
      FROM users
      WHERE email = $1 AND organization_id = $2 AND deleted_at IS NULL
    `;

    const result = await this.db.query<{
      id: string;
      organization_id: string;
      first_name: string;
      last_name: string;
      email: string;
      username: string;
      roles: string[];
      branch_ids: string[];
      status: string;
    }>(query, [email, organizationId]);

    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }

    return {
      id: row.id,
      organizationId: row.organization_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      username: row.username,
      roles: row.roles as Role[],
      branchIds: row.branch_ids,
      status: row.status,
    };
  }

  async createUser(request: CreateUserRequest): Promise<User> {
    const query = `
      INSERT INTO users (
        organization_id, username, email, password_hash, first_name, last_name,
        phone, roles, branch_ids, status, created_by, updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE', $10, $10)
      RETURNING 
        id, organization_id, first_name, last_name, email, username,
        roles, branch_ids, status
    `;

    const result = await this.db.query<{
      id: string;
      organization_id: string;
      first_name: string;
      last_name: string;
      email: string;
      username: string;
      roles: string[];
      branch_ids: string[];
      status: string;
    }>(query, [
      request.organizationId,
      request.username,
      request.email,
      request.passwordHash,
      request.firstName,
      request.lastName,
      request.phone ?? null,
      request.roles,
      request.branchIds ?? [],
      request.createdBy,
    ]);

    const row = result.rows[0];
    if (row === undefined) {
      throw new Error('Failed to create user');
    }

    return {
      id: row.id,
      organizationId: row.organization_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      username: row.username,
      roles: row.roles as Role[],
      branchIds: row.branch_ids,
      status: row.status,
    };
  }

  // Invitation methods

  /**
   * Generate a cryptographically secure invitation token
   */
  private generateInviteToken(): string {
    return randomBytes(32).toString('base64url');
  }

  async createInviteToken(
    organizationId: UUID,
    request: CreateInviteRequest,
    createdBy: UUID
  ): Promise<InviteToken> {
    const token = this.generateInviteToken();
    const expiresInDays = request.expiresInDays ?? 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const query = `
      INSERT INTO invite_tokens (
        token, organization_id, email, first_name, last_name,
        roles, branch_ids, expires_at, status, created_by, updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9, $9)
      RETURNING 
        id, token, organization_id, email, first_name, last_name,
        roles, branch_ids, expires_at, status, accepted_user_id, accepted_at,
        created_at, created_by, updated_at, updated_by
    `;

    const result = await this.db.query<{
      id: string;
      token: string;
      organization_id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      roles: string[];
      branch_ids: string[];
      expires_at: Date;
      status: InviteTokenStatus;
      accepted_user_id: string | null;
      accepted_at: Date | null;
      created_at: Date;
      created_by: string;
      updated_at: Date;
      updated_by: string;
    }>(query, [
      token,
      organizationId,
      request.email.toLowerCase(),
      request.firstName ?? null,
      request.lastName ?? null,
      request.roles,
      request.branchIds ?? [],
      expiresAt,
      createdBy,
    ]);

    const row = result.rows[0];
    if (row === undefined) {
      throw new Error('Failed to create invite token');
    }

    return {
      id: row.id,
      token: row.token,
      organizationId: row.organization_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      roles: row.roles as Role[],
      branchIds: row.branch_ids,
      expiresAt: row.expires_at,
      status: row.status,
      acceptedUserId: row.accepted_user_id,
      acceptedAt: row.accepted_at,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: 1,
    };
  }

  async getInviteByToken(token: string): Promise<InviteToken | null> {
    const query = `
      SELECT 
        id, token, organization_id, email, first_name, last_name,
        roles, branch_ids, expires_at, status, accepted_user_id, accepted_at,
        created_at, created_by, updated_at, updated_by
      FROM invite_tokens
      WHERE token = $1
    `;

    const result = await this.db.query<{
      id: string;
      token: string;
      organization_id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      roles: string[];
      branch_ids: string[];
      expires_at: Date;
      status: InviteTokenStatus;
      accepted_user_id: string | null;
      accepted_at: Date | null;
      created_at: Date;
      created_by: string;
      updated_at: Date;
      updated_by: string;
    }>(query, [token]);

    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }

    return {
      id: row.id,
      token: row.token,
      organizationId: row.organization_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      roles: row.roles as Role[],
      branchIds: row.branch_ids,
      expiresAt: row.expires_at,
      status: row.status,
      acceptedUserId: row.accepted_user_id,
      acceptedAt: row.accepted_at,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: 1,
    };
  }

  async validateInviteToken(token: string): Promise<InviteDetails | null> {
    const query = `
      SELECT 
        it.token, it.email, it.first_name, it.last_name, it.roles,
        it.expires_at, it.status, o.id as organization_id, o.name as organization_name
      FROM invite_tokens it
      JOIN organizations o ON it.organization_id = o.id
      WHERE it.token = $1
    `;

    const result = await this.db.query<{
      token: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      roles: string[];
      expires_at: Date;
      status: InviteTokenStatus;
      organization_id: string;
      organization_name: string;
    }>(query, [token]);

    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }

    const now = new Date();
    const isValid = row.status === 'PENDING' && new Date(row.expires_at) > now;

    return {
      token: row.token,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      organizationName: row.organization_name,
      organizationId: row.organization_id,
      roles: row.roles as Role[],
      expiresAt: row.expires_at,
      isValid,
    };
  }

  async acceptInviteToken(token: string, userId: UUID): Promise<void> {
    const query = `
      UPDATE invite_tokens
      SET 
        status = 'ACCEPTED',
        accepted_user_id = $2,
        accepted_at = NOW(),
        updated_by = $2
      WHERE token = $1 AND status = 'PENDING'
    `;

    await this.db.query(query, [token, userId]);
  }

  async revokeInviteToken(token: string, revokedBy: UUID): Promise<void> {
    const query = `
      UPDATE invite_tokens
      SET 
        status = 'REVOKED',
        updated_by = $2
      WHERE token = $1 AND status = 'PENDING'
    `;

    await this.db.query(query, [token, revokedBy]);
  }

  async getOrganizationInvites(organizationId: UUID): Promise<InviteToken[]> {
    const query = `
      SELECT 
        id, token, organization_id, email, first_name, last_name,
        roles, branch_ids, expires_at, status, accepted_user_id, accepted_at,
        created_at, created_by, updated_at, updated_by
      FROM invite_tokens
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.db.query<{
      id: string;
      token: string;
      organization_id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      roles: string[];
      branch_ids: string[];
      expires_at: Date;
      status: InviteTokenStatus;
      accepted_user_id: string | null;
      accepted_at: Date | null;
      created_at: Date;
      created_by: string;
      updated_at: Date;
      updated_by: string;
    }>(query, [organizationId]);

    return result.rows.map((row) => ({
      id: row.id,
      token: row.token,
      organizationId: row.organization_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      roles: row.roles as Role[],
      branchIds: row.branch_ids,
      expiresAt: row.expires_at,
      status: row.status,
      acceptedUserId: row.accepted_user_id,
      acceptedAt: row.accepted_at,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: 1,
    }));
  }
}
