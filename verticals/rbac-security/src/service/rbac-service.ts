import {
  UserContext,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UUID,
  PaginationParams,
  PaginatedResult,
  getPermissionService,
} from '@care-commons/core';
import { RBACRepository } from '../repository/rbac-repository';
import { RBACValidator } from '../validation/rbac-validator';
import { SecurityAuditService } from './security-audit-service';
import type {
  Role,
  Permission,
  UserRole,
  PermissionCheckResult,
  CreateRoleInput,
  UpdateRoleInput,
  CreatePermissionInput,
  UpdatePermissionInput,
  AssignRoleInput,
  RevokeRoleInput,
  CheckPermissionInput,
  RoleSearchFilters,
  PermissionSearchFilters,
  UserRoleSearchFilters,
} from '../types/role';

/**
 * Service for Role-Based Access Control operations
 */
export class RBACService {
  private repository: RBACRepository;
  private validator: RBACValidator;
  private auditService: SecurityAuditService;
  private permissionService = getPermissionService();

  constructor(
    repository: RBACRepository,
    auditService?: SecurityAuditService
  ) {
    this.repository = repository;
    this.validator = new RBACValidator();
    this.auditService = auditService || new SecurityAuditService(repository);
  }

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  async createRole(input: CreateRoleInput, context: UserContext): Promise<Role> {
    // Check permissions
    this.permissionService.requirePermission(context, 'roles:create');

    // Validate input
    const validation = this.validator.validateCreateRole(input);
    if (!validation.success) {
      throw new ValidationError('Invalid role data', { errors: validation.errors });
    }

    // Verify all permissions exist
    for (const permissionId of input.permissions) {
      const permission = await this.repository.getPermissionById(permissionId);
      if (!permission) {
        throw new ValidationError(`Permission ${permissionId} not found`);
      }
    }

    // Create role
    const role = await this.repository.createRole({
      name: input.name,
      type: input.type,
      description: input.description,
      organizationId: input.organizationId || context.organizationId,
      permissions: input.permissions,
      isSystem: false,
      isActive: input.isActive !== undefined ? input.isActive : true,
      metadata: input.metadata,
    });

    // Audit log
    await this.auditService.logSecurityEvent({
      userId: context.userId,
      organizationId: context.organizationId,
      action: 'ROLE_ASSIGNED',
      resource: 'ROLES',
      resourceId: role.id,
      success: true,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return role;
  }

  async getRoleById(id: UUID, context: UserContext): Promise<Role> {
    this.permissionService.requirePermission(context, 'roles:read');

    const role = await this.repository.getRoleById(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Check organization access
    if (role.organizationId && role.organizationId !== context.organizationId) {
      throw new ForbiddenError('Access denied to this role');
    }

    return role;
  }

  async updateRole(id: UUID, input: UpdateRoleInput, context: UserContext): Promise<Role> {
    this.permissionService.requirePermission(context, 'roles:update');

    // Get existing role
    const existingRole = await this.repository.getRoleById(id);
    if (!existingRole) {
      throw new NotFoundError('Role not found');
    }

    // Cannot modify system roles
    if (existingRole.isSystem) {
      throw new ForbiddenError('Cannot modify system roles');
    }

    // Check organization access
    if (existingRole.organizationId && existingRole.organizationId !== context.organizationId) {
      throw new ForbiddenError('Access denied to this role');
    }

    // Validate input
    const validation = this.validator.validateUpdateRole(input);
    if (!validation.success) {
      throw new ValidationError('Invalid role data', { errors: validation.errors });
    }

    // Verify permissions if provided
    if (input.permissions) {
      for (const permissionId of input.permissions) {
        const permission = await this.repository.getPermissionById(permissionId);
        if (!permission) {
          throw new ValidationError(`Permission ${permissionId} not found`);
        }
      }
    }

    // Update role
    const updatedRole = await this.repository.updateRole(id, input);

    // Audit log
    await this.auditService.logSecurityEvent({
      userId: context.userId,
      organizationId: context.organizationId,
      action: 'SETTINGS_CHANGED',
      resource: 'ROLES',
      resourceId: id,
      success: true,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { changes: input },
    });

    return updatedRole;
  }

  async deleteRole(id: UUID, context: UserContext): Promise<void> {
    this.permissionService.requirePermission(context, 'roles:delete');

    // Get existing role
    const role = await this.repository.getRoleById(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Cannot delete system roles
    if (role.isSystem) {
      throw new ForbiddenError('Cannot delete system roles');
    }

    // Check organization access
    if (role.organizationId && role.organizationId !== context.organizationId) {
      throw new ForbiddenError('Access denied to this role');
    }

    await this.repository.deleteRole(id);

    // Audit log
    await this.auditService.logSecurityEvent({
      userId: context.userId,
      organizationId: context.organizationId,
      action: 'ROLE_REVOKED',
      resource: 'ROLES',
      resourceId: id,
      success: true,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  async searchRoles(
    filters: RoleSearchFilters,
    pagination: PaginationParams,
    context: UserContext
  ): Promise<PaginatedResult<Role>> {
    this.permissionService.requirePermission(context, 'roles:read');

    // Filter by organization if not system admin
    if (!this.permissionService.hasPermission(context, 'system:admin')) {
      filters.organizationId = context.organizationId;
    }

    return this.repository.searchRoles(filters, pagination);
  }

  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================

  async createPermission(input: CreatePermissionInput, context: UserContext): Promise<Permission> {
    this.permissionService.requirePermission(context, 'permissions:create');

    // Validate input
    const validation = this.validator.validateCreatePermission(input);
    if (!validation.success) {
      throw new ValidationError('Invalid permission data', { errors: validation.errors });
    }

    // Check for duplicate code
    const existing = await this.repository.getPermissionByCode(input.code);
    if (existing) {
      throw new ValidationError('Permission code already exists');
    }

    const permission = await this.repository.createPermission({
      code: input.code,
      name: input.name,
      description: input.description,
      resource: input.resource,
      action: input.action,
      scope: input.scope,
      conditions: input.conditions,
      isSystem: false,
    });

    // Audit log
    await this.auditService.logSecurityEvent({
      userId: context.userId,
      organizationId: context.organizationId,
      action: 'PERMISSION_GRANTED',
      resource: 'PERMISSIONS',
      resourceId: permission.id,
      success: true,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return permission;
  }

  async getPermissionById(id: UUID, context: UserContext): Promise<Permission> {
    this.permissionService.requirePermission(context, 'permissions:read');

    const permission = await this.repository.getPermissionById(id);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    return permission;
  }

  async searchPermissions(
    filters: PermissionSearchFilters,
    pagination: PaginationParams,
    context: UserContext
  ): Promise<PaginatedResult<Permission>> {
    this.permissionService.requirePermission(context, 'permissions:read');

    return this.repository.searchPermissions(filters, pagination);
  }

  // ============================================================================
  // USER ROLE ASSIGNMENT
  // ============================================================================

  async assignRole(input: AssignRoleInput, context: UserContext): Promise<UserRole> {
    this.permissionService.requirePermission(context, 'roles:assign');

    // Validate input
    const validation = this.validator.validateAssignRole(input);
    if (!validation.success) {
      throw new ValidationError('Invalid role assignment', { errors: validation.errors });
    }

    // Verify role exists
    const role = await this.repository.getRoleById(input.roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Check organization access
    if (role.organizationId && role.organizationId !== context.organizationId) {
      throw new ForbiddenError('Cannot assign roles from other organizations');
    }

    const userRole = await this.repository.assignUserRole({
      userId: input.userId,
      roleId: input.roleId,
      organizationId: input.organizationId || context.organizationId,
      departmentId: input.departmentId,
      teamId: input.teamId,
      grantedBy: context.userId,
      grantedAt: new Date().toISOString(),
      expiresAt: input.expiresAt,
      isActive: true,
    });

    // Audit log
    await this.auditService.logSecurityEvent({
      userId: context.userId,
      organizationId: context.organizationId,
      action: 'ROLE_ASSIGNED',
      resource: 'USERS',
      resourceId: input.userId,
      success: true,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { roleId: input.roleId },
    });

    return userRole;
  }

  async revokeRole(input: RevokeRoleInput, context: UserContext): Promise<void> {
    this.permissionService.requirePermission(context, 'roles:revoke');

    await this.repository.revokeUserRole(input.userId, input.roleId);

    // Audit log
    await this.auditService.logSecurityEvent({
      userId: context.userId,
      organizationId: context.organizationId,
      action: 'ROLE_REVOKED',
      resource: 'USERS',
      resourceId: input.userId,
      success: true,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { roleId: input.roleId },
    });
  }

  async getUserRoles(userId: UUID, context: UserContext): Promise<UserRole[]> {
    this.permissionService.requirePermission(context, 'roles:read');

    // Users can view their own roles, or admins can view any user's roles
    if (userId !== context.userId && !this.permissionService.hasPermission(context, 'roles:manage')) {
      throw new ForbiddenError('Access denied');
    }

    return this.repository.getUserRoles(userId);
  }

  // ============================================================================
  // PERMISSION CHECKING
  // ============================================================================

  async checkPermission(input: CheckPermissionInput): Promise<PermissionCheckResult> {
    // Get user roles
    const userRoles = await this.repository.getUserRoles(input.userId);

    if (userRoles.length === 0) {
      return {
        granted: false,
        reason: 'No roles assigned to user',
        permissions: [],
      };
    }

    // Collect all permissions from roles
    const allPermissions: Permission[] = [];
    for (const userRole of userRoles) {
      const role = await this.repository.getRoleById(userRole.roleId);
      if (role && role.isActive) {
        for (const permissionId of role.permissions) {
          const permission = await this.repository.getPermissionById(permissionId);
          if (permission) {
            allPermissions.push(permission);
          }
        }
      }
    }

    // Check if any permission matches the requested code
    const matchingPermissions = allPermissions.filter(p => p.code === input.permissionCode);

    if (matchingPermissions.length === 0) {
      return {
        granted: false,
        reason: 'Permission not found in user roles',
        permissions: [],
      };
    }

    // TODO: Apply permission conditions based on context
    // For now, we grant access if permission exists

    return {
      granted: true,
      permissions: matchingPermissions,
    };
  }
}
