/**
 * Permission evaluation service for role-based access control
 */

import { UserContext, /* Permission, */ PermissionError } from '../types/base';

export interface PermissionRule {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  conditions?: PermissionCondition[];
}

 

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'in' | 'contains';
  value: unknown;
}

/**
 * Permission evaluation service
 */
export class PermissionService {
  private rolePermissions: Map<string, Set<string>>;

  constructor() {
    this.rolePermissions = new Map();
    this.initializeDefaultPermissions();
  }

  /**
   * Initialize default role-permission mappings
   */
  private initializeDefaultPermissions(): void {
    // Super Admin - full access
    this.rolePermissions.set('SUPER_ADMIN', new Set(['*:*']));

    // Org Admin - organization-wide access
    this.rolePermissions.set(
      'ORG_ADMIN',
      new Set([
        'clients:*',
        'caregivers:*',
        'staff:*',
        'schedules:*',
        'billing:*',
        'reports:*',
        'settings:*',
      ])
    );

    // Branch Admin - branch-level access
    this.rolePermissions.set(
      'BRANCH_ADMIN',
      new Set([
        'clients:read',
        'clients:update',
        'caregivers:*',
        'staff:read',
        'schedules:*',
        'reports:read',
      ])
    );

    // Coordinator - operational access
    this.rolePermissions.set(
      'COORDINATOR',
      new Set([
        'clients:read',
        'clients:update',
        'caregivers:read',
        'schedules:*',
        'visits:*',
        'care-plans:*',
      ])
    );

    // Scheduler - scheduling focus
    this.rolePermissions.set(
      'SCHEDULER',
      new Set([
        'clients:read',
        'caregivers:read',
        'schedules:*',
        'visits:read',
      ])
    );

    // Caregiver - field staff access
    this.rolePermissions.set(
      'CAREGIVER',
      new Set([
        'clients:read',
        'schedules:read',
        'visits:update',
        'care-plans:read',
        'tasks:update',
        'notes:create',
      ])
    );

    // Family - limited client access
    this.rolePermissions.set(
      'FAMILY',
      new Set(['clients:read', 'care-plans:read', 'notes:read', 'visits:read'])
    );

    // Billing - financial access
    this.rolePermissions.set(
      'BILLING',
      new Set([
        'clients:read',
        'visits:read',
        'billing:*',
        'invoices:*',
        'reports:read',
      ])
    );

    // HR - personnel access
    this.rolePermissions.set(
      'HR',
      new Set([
        'staff:*',
        'caregivers:*',
        'training:*',
        'certifications:*',
        'payroll:*',
      ])
    );

    // Auditor - read-only compliance access
    this.rolePermissions.set(
      'AUDITOR',
      new Set([
        'clients:read',
        'caregivers:read',
        'visits:read',
        'compliance:read',
        'audit-logs:read',
        'reports:read',
      ])
    );

    // Read-only - minimal access
    this.rolePermissions.set(
      'READ_ONLY',
      new Set(['clients:read', 'reports:read'])
    );
  }

  /**
   * Check if user has permission
   */
  hasPermission(context: UserContext, permission: string): boolean {
    // Check explicit permissions
    if (context.permissions.includes(permission)) {
      return true;
    }

    // Check role-based permissions
    for (const role of context.roles) {
      const rolePerms = this.rolePermissions.get(role);
      if (rolePerms === undefined) continue;

      // Wildcard check
      if (rolePerms.has('*:*')) {
        return true;
      }

      // Exact match
      if (rolePerms.has(permission)) {
        return true;
      }

      // Resource wildcard (e.g., "clients:*" matches "clients:read")
      const [resource] = permission.split(':');
      if (rolePerms.has(`${resource}:*`)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Assert permission or throw error
   */
  requirePermission(context: UserContext, permission: string): void {
    if (!this.hasPermission(context, permission)) {
      throw new PermissionError(
        `Permission denied: ${permission}`,
        { userId: context.userId, permission }
      );
    }
  }

  /**
   * Check multiple permissions (all required)
   */
  hasAllPermissions(context: UserContext, permissions: string[]): boolean {
    return permissions.every((p) => this.hasPermission(context, p));
  }

  /**
   * Check multiple permissions (any required)
   */
  hasAnyPermission(context: UserContext, permissions: string[]): boolean {
    return permissions.some((p) => this.hasPermission(context, p));
  }

  /**
   * Filter entities based on organizational scope
   */
  filterByScope<T extends { organizationId?: string; branchId?: string }>(
    context: UserContext,
    entities: T[]
  ): T[] {
    // Super admins see everything
    if (context.roles.includes('SUPER_ADMIN')) {
      return entities;
    }

    // Filter by organization
    return entities.filter((entity) => {
      if (entity.organizationId !== context.organizationId) {
        return false;
      }

      // Branch-level filtering
      if (
        entity.branchId !== undefined &&
        entity.branchId.length > 0 &&
        context.branchIds.length > 0
      ) {
        return context.branchIds.includes(entity.branchId);
      }

      return true;
    });
  }
}

/**
 * Singleton instance
 */
let permissionServiceInstance: PermissionService | null = null;

export function getPermissionService(): PermissionService {
  permissionServiceInstance ??= new PermissionService();
  return permissionServiceInstance;
}
