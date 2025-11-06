import { Request, Response } from 'express';
import {
  asyncHandler,
  getUserContext,
  PaginationParams,
} from '@care-commons/core';
import { RBACService } from '../service/rbac-service';
import { SecurityAuditService } from '../service/security-audit-service';
import type {
  CreateRoleInput,
  UpdateRoleInput,
  CreatePermissionInput,
  AssignRoleInput,
  RevokeRoleInput,
  CheckPermissionInput,
  RoleSearchFilters,
  PermissionSearchFilters,
  SecurityAuditSearchFilters,
} from '../types/role';

/**
 * API handlers for RBAC operations
 */
export class RBACHandlers {
  constructor(
    private rbacService: RBACService,
    private auditService: SecurityAuditService
  ) {}

  // ============================================================================
  // ROLE ENDPOINTS
  // ============================================================================

  /**
   * POST /api/roles
   * Create a new role
   */
  createRole = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const input: CreateRoleInput = req.body;

    const role = await this.rbacService.createRole(input, context);

    res.status(201).json({ success: true, data: role });
  });

  /**
   * GET /api/roles/:id
   * Get role by ID
   */
  getRoleById = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    const role = await this.rbacService.getRoleById(id, context);

    res.json({ success: true, data: role });
  });

  /**
   * GET /api/roles
   * Search roles
   */
  searchRoles = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const filters = this.buildRoleSearchFilters(req);
    const pagination = this.buildPagination(req);

    const result = await this.rbacService.searchRoles(filters, pagination, context);

    res.json({ success: true, data: result });
  });

  /**
   * PATCH /api/roles/:id
   * Update role
   */
  updateRole = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;
    const input: UpdateRoleInput = req.body;

    const role = await this.rbacService.updateRole(id, input, context);

    res.json({ success: true, data: role });
  });

  /**
   * DELETE /api/roles/:id
   * Delete role
   */
  deleteRole = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    await this.rbacService.deleteRole(id, context);

    res.json({ success: true, message: 'Role deleted successfully' });
  });

  // ============================================================================
  // PERMISSION ENDPOINTS
  // ============================================================================

  /**
   * POST /api/permissions
   * Create a new permission
   */
  createPermission = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const input: CreatePermissionInput = req.body;

    const permission = await this.rbacService.createPermission(input, context);

    res.status(201).json({ success: true, data: permission });
  });

  /**
   * GET /api/permissions/:id
   * Get permission by ID
   */
  getPermissionById = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    const permission = await this.rbacService.getPermissionById(id, context);

    res.json({ success: true, data: permission });
  });

  /**
   * GET /api/permissions
   * Search permissions
   */
  searchPermissions = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const filters = this.buildPermissionSearchFilters(req);
    const pagination = this.buildPagination(req);

    const result = await this.rbacService.searchPermissions(filters, pagination, context);

    res.json({ success: true, data: result });
  });

  // ============================================================================
  // USER ROLE ASSIGNMENT ENDPOINTS
  // ============================================================================

  /**
   * POST /api/users/:userId/roles
   * Assign role to user
   */
  assignRole = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { userId } = req.params;
    const input: Omit<AssignRoleInput, 'userId'> = req.body;

    const userRole = await this.rbacService.assignRole(
      { ...input, userId },
      context
    );

    res.status(201).json({ success: true, data: userRole });
  });

  /**
   * DELETE /api/users/:userId/roles/:roleId
   * Revoke role from user
   */
  revokeRole = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { userId, roleId } = req.params;

    await this.rbacService.revokeRole({ userId, roleId }, context);

    res.json({ success: true, message: 'Role revoked successfully' });
  });

  /**
   * GET /api/users/:userId/roles
   * Get user's roles
   */
  getUserRoles = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { userId } = req.params;

    const roles = await this.rbacService.getUserRoles(userId, context);

    res.json({ success: true, data: roles });
  });

  // ============================================================================
  // PERMISSION CHECKING ENDPOINTS
  // ============================================================================

  /**
   * POST /api/permissions/check
   * Check if user has permission
   */
  checkPermission = asyncHandler(async (req: Request, res: Response) => {
    const input: CheckPermissionInput = req.body;

    const result = await this.rbacService.checkPermission(input);

    res.json({ success: true, data: result });
  });

  // ============================================================================
  // SECURITY AUDIT ENDPOINTS
  // ============================================================================

  /**
   * GET /api/audit-logs
   * Search audit logs
   */
  searchAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const filters = this.buildAuditSearchFilters(req);
    const pagination = this.buildPagination(req);

    const result = await this.auditService.searchAuditLogs(filters, pagination, context);

    res.json({ success: true, data: result });
  });

  /**
   * GET /api/users/:userId/audit-logs
   * Get user's audit logs
   */
  getUserAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { userId } = req.params;
    const pagination = this.buildPagination(req);

    const result = await this.auditService.getUserAuditLogs(userId, pagination, context);

    res.json({ success: true, data: result });
  });

  /**
   * GET /api/audit-logs/failed-logins
   * Get recent failed login attempts
   */
  getFailedLogins = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const hours = parseInt(req.query.hours as string) || 24;
    const pagination = this.buildPagination(req);

    const result = await this.auditService.getRecentFailedLogins(hours, pagination, context);

    res.json({ success: true, data: result });
  });

  /**
   * GET /api/audit-logs/suspicious
   * Get suspicious activity logs
   */
  getSuspiciousActivity = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const pagination = this.buildPagination(req);

    const result = await this.auditService.getSuspiciousActivity(pagination, context);

    res.json({ success: true, data: result });
  });

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private buildRoleSearchFilters(req: Request): RoleSearchFilters {
    const filters: RoleSearchFilters = {};

    if (req.query.query) {
      filters.query = req.query.query as string;
    }

    if (req.query.type) {
      const types = Array.isArray(req.query.type) ? req.query.type : [req.query.type];
      filters.type = types as any[];
    }

    if (req.query.organizationId) {
      filters.organizationId = req.query.organizationId as string;
    }

    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }

    if (req.query.isSystem !== undefined) {
      filters.isSystem = req.query.isSystem === 'true';
    }

    return filters;
  }

  private buildPermissionSearchFilters(req: Request): PermissionSearchFilters {
    const filters: PermissionSearchFilters = {};

    if (req.query.query) {
      filters.query = req.query.query as string;
    }

    if (req.query.resource) {
      const resources = Array.isArray(req.query.resource) ? req.query.resource : [req.query.resource];
      filters.resource = resources as any[];
    }

    if (req.query.action) {
      const actions = Array.isArray(req.query.action) ? req.query.action : [req.query.action];
      filters.action = actions as any[];
    }

    if (req.query.scope) {
      const scopes = Array.isArray(req.query.scope) ? req.query.scope : [req.query.scope];
      filters.scope = scopes as any[];
    }

    if (req.query.isSystem !== undefined) {
      filters.isSystem = req.query.isSystem === 'true';
    }

    return filters;
  }

  private buildAuditSearchFilters(req: Request): SecurityAuditSearchFilters {
    const filters: SecurityAuditSearchFilters = {};

    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }

    if (req.query.organizationId) {
      filters.organizationId = req.query.organizationId as string;
    }

    if (req.query.action) {
      const actions = Array.isArray(req.query.action) ? req.query.action : [req.query.action];
      filters.action = actions as any[];
    }

    if (req.query.resource) {
      const resources = Array.isArray(req.query.resource) ? req.query.resource : [req.query.resource];
      filters.resource = resources as any[];
    }

    if (req.query.success !== undefined) {
      filters.success = req.query.success === 'true';
    }

    if (req.query.startDate) {
      filters.startDate = req.query.startDate as string;
    }

    if (req.query.endDate) {
      filters.endDate = req.query.endDate as string;
    }

    if (req.query.ipAddress) {
      filters.ipAddress = req.query.ipAddress as string;
    }

    return filters;
  }

  private buildPagination(req: Request): PaginationParams {
    return {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };
  }
}
