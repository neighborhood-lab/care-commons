import {
  Repository,
  UUID,
  PaginationParams,
  PaginatedResult,
  buildPaginationQuery,
} from '@care-commons/core';
import type {
  Role,
  Permission,
  UserRole,
  SecurityAuditLog,
  RoleSearchFilters,
  PermissionSearchFilters,
  UserRoleSearchFilters,
  SecurityAuditSearchFilters,
} from '../types/role';

/**
 * Repository for RBAC & Security data access
 */
export class RBACRepository extends Repository {
  // ============================================================================
  // ROLE OPERATIONS
  // ============================================================================

  async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    const query = `
      INSERT INTO roles (
        id, name, type, description, organization_id, permissions,
        is_system, is_active, metadata, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      this.generateId(),
      role.name,
      role.type,
      role.description || null,
      role.organizationId || null,
      JSON.stringify(role.permissions),
      role.isSystem,
      role.isActive,
      role.metadata ? JSON.stringify(role.metadata) : null,
    ];

    const result = await this.db.query<Role>(query, values);
    return this.mapRoleFromDb(result.rows[0]);
  }

  async getRoleById(id: UUID): Promise<Role | null> {
    const query = 'SELECT * FROM roles WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.db.query<Role>(query, [id]);
    return result.rows[0] ? this.mapRoleFromDb(result.rows[0]) : null;
  }

  async updateRole(id: UUID, updates: Partial<Role>): Promise<Role> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.permissions !== undefined) {
      setClauses.push(`permissions = $${paramCount++}`);
      values.push(JSON.stringify(updates.permissions));
    }
    if (updates.isActive !== undefined) {
      setClauses.push(`is_active = $${paramCount++}`);
      values.push(updates.isActive);
    }
    if (updates.metadata !== undefined) {
      setClauses.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(updates.metadata));
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE roles
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.db.query<Role>(query, values);
    if (!result.rows[0]) {
      throw new Error('Role not found or already deleted');
    }
    return this.mapRoleFromDb(result.rows[0]);
  }

  async deleteRole(id: UUID): Promise<void> {
    const query = `
      UPDATE roles
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL AND is_system = false
    `;
    await this.db.query(query, [id]);
  }

  async searchRoles(
    filters: RoleSearchFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<Role>> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const values: unknown[] = [];
    let paramCount = 1;

    if (filters.query) {
      conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      values.push(`%${filters.query}%`);
      paramCount++;
    }

    if (filters.type && filters.type.length > 0) {
      conditions.push(`type = ANY($${paramCount})`);
      values.push(filters.type);
      paramCount++;
    }

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramCount}`);
      values.push(filters.organizationId);
      paramCount++;
    }

    if (filters.isActive !== undefined) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(filters.isActive);
      paramCount++;
    }

    if (filters.isSystem !== undefined) {
      conditions.push(`is_system = $${paramCount}`);
      values.push(filters.isSystem);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return buildPaginationQuery(
      this.db,
      'roles',
      whereClause,
      values,
      pagination,
      this.mapRoleFromDb.bind(this)
    );
  }

  // ============================================================================
  // PERMISSION OPERATIONS
  // ============================================================================

  async createPermission(permission: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>): Promise<Permission> {
    const query = `
      INSERT INTO permissions (
        id, code, name, description, resource, action, scope,
        conditions, is_system, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      this.generateId(),
      permission.code,
      permission.name,
      permission.description || null,
      permission.resource,
      permission.action,
      permission.scope,
      permission.conditions ? JSON.stringify(permission.conditions) : null,
      permission.isSystem,
    ];

    const result = await this.db.query<Permission>(query, values);
    return this.mapPermissionFromDb(result.rows[0]);
  }

  async getPermissionById(id: UUID): Promise<Permission | null> {
    const query = 'SELECT * FROM permissions WHERE id = $1';
    const result = await this.db.query<Permission>(query, [id]);
    return result.rows[0] ? this.mapPermissionFromDb(result.rows[0]) : null;
  }

  async getPermissionByCode(code: string): Promise<Permission | null> {
    const query = 'SELECT * FROM permissions WHERE code = $1';
    const result = await this.db.query<Permission>(query, [code]);
    return result.rows[0] ? this.mapPermissionFromDb(result.rows[0]) : null;
  }

  async searchPermissions(
    filters: PermissionSearchFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<Permission>> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (filters.query) {
      conditions.push(`(code ILIKE $${paramCount} OR name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      values.push(`%${filters.query}%`);
      paramCount++;
    }

    if (filters.resource && filters.resource.length > 0) {
      conditions.push(`resource = ANY($${paramCount})`);
      values.push(filters.resource);
      paramCount++;
    }

    if (filters.action && filters.action.length > 0) {
      conditions.push(`action = ANY($${paramCount})`);
      values.push(filters.action);
      paramCount++;
    }

    if (filters.scope && filters.scope.length > 0) {
      conditions.push(`scope = ANY($${paramCount})`);
      values.push(filters.scope);
      paramCount++;
    }

    if (filters.isSystem !== undefined) {
      conditions.push(`is_system = $${paramCount}`);
      values.push(filters.isSystem);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return buildPaginationQuery(
      this.db,
      'permissions',
      whereClause,
      values,
      pagination,
      this.mapPermissionFromDb.bind(this)
    );
  }

  // ============================================================================
  // USER ROLE OPERATIONS
  // ============================================================================

  async assignUserRole(userRole: Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserRole> {
    const query = `
      INSERT INTO user_roles (
        id, user_id, role_id, organization_id, department_id, team_id,
        granted_by, granted_at, expires_at, is_active, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      this.generateId(),
      userRole.userId,
      userRole.roleId,
      userRole.organizationId || null,
      userRole.departmentId || null,
      userRole.teamId || null,
      userRole.grantedBy,
      userRole.grantedAt,
      userRole.expiresAt || null,
      userRole.isActive,
    ];

    const result = await this.db.query<UserRole>(query, values);
    return this.mapUserRoleFromDb(result.rows[0]);
  }

  async getUserRoles(userId: UUID): Promise<UserRole[]> {
    const query = `
      SELECT * FROM user_roles
      WHERE user_id = $1
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
    `;
    const result = await this.db.query<UserRole>(query, [userId]);
    return result.rows.map(this.mapUserRoleFromDb.bind(this));
  }

  async revokeUserRole(userId: UUID, roleId: UUID): Promise<void> {
    const query = `
      UPDATE user_roles
      SET is_active = false, updated_at = NOW()
      WHERE user_id = $1 AND role_id = $2 AND is_active = true
    `;
    await this.db.query(query, [userId, roleId]);
  }

  // ============================================================================
  // SECURITY AUDIT OPERATIONS
  // ============================================================================

  async createAuditLog(log: Omit<SecurityAuditLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityAuditLog> {
    const query = `
      INSERT INTO security_audit_logs (
        id, user_id, organization_id, action, resource, resource_id,
        ip_address, user_agent, success, failure_reason, metadata, timestamp, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      this.generateId(),
      log.userId || null,
      log.organizationId || null,
      log.action,
      log.resource,
      log.resourceId || null,
      log.ipAddress || null,
      log.userAgent || null,
      log.success,
      log.failureReason || null,
      log.metadata ? JSON.stringify(log.metadata) : null,
      log.timestamp,
    ];

    const result = await this.db.query<SecurityAuditLog>(query, values);
    return this.mapAuditLogFromDb(result.rows[0]);
  }

  async searchAuditLogs(
    filters: SecurityAuditSearchFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<SecurityAuditLog>> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (filters.userId) {
      conditions.push(`user_id = $${paramCount}`);
      values.push(filters.userId);
      paramCount++;
    }

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramCount}`);
      values.push(filters.organizationId);
      paramCount++;
    }

    if (filters.action && filters.action.length > 0) {
      conditions.push(`action = ANY($${paramCount})`);
      values.push(filters.action);
      paramCount++;
    }

    if (filters.resource && filters.resource.length > 0) {
      conditions.push(`resource = ANY($${paramCount})`);
      values.push(filters.resource);
      paramCount++;
    }

    if (filters.success !== undefined) {
      conditions.push(`success = $${paramCount}`);
      values.push(filters.success);
      paramCount++;
    }

    if (filters.startDate) {
      conditions.push(`timestamp >= $${paramCount}`);
      values.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      conditions.push(`timestamp <= $${paramCount}`);
      values.push(filters.endDate);
      paramCount++;
    }

    if (filters.ipAddress) {
      conditions.push(`ip_address = $${paramCount}`);
      values.push(filters.ipAddress);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return buildPaginationQuery(
      this.db,
      'security_audit_logs',
      whereClause,
      values,
      pagination,
      this.mapAuditLogFromDb.bind(this)
    );
  }

  // ============================================================================
  // MAPPING HELPERS
  // ============================================================================

  private mapRoleFromDb(row: any): Role {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      organizationId: row.organization_id,
      permissions: JSON.parse(row.permissions || '[]'),
      isSystem: row.is_system,
      isActive: row.is_active,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }

  private mapPermissionFromDb(row: any): Permission {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      resource: row.resource,
      action: row.action,
      scope: row.scope,
      conditions: row.conditions ? JSON.parse(row.conditions) : undefined,
      isSystem: row.is_system,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapUserRoleFromDb(row: any): UserRole {
    return {
      id: row.id,
      userId: row.user_id,
      roleId: row.role_id,
      organizationId: row.organization_id,
      departmentId: row.department_id,
      teamId: row.team_id,
      grantedBy: row.granted_by,
      grantedAt: row.granted_at,
      expiresAt: row.expires_at,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapAuditLogFromDb(row: any): SecurityAuditLog {
    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      action: row.action,
      resource: row.resource,
      resourceId: row.resource_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      success: row.success,
      failureReason: row.failure_reason,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      timestamp: row.timestamp,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
