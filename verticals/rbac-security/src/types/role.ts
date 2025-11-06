import { Entity, SoftDeletable, UUID } from '@care-commons/core';

/**
 * Role types in the system
 */
export type RoleType =
  | 'SYSTEM_ADMIN'      // Full system access
  | 'ORGANIZATION_ADMIN' // Organization-wide admin
  | 'MANAGER'           // Department/team manager
  | 'SUPERVISOR'        // Staff supervisor
  | 'COORDINATOR'       // Care coordinator
  | 'CAREGIVER'         // Direct care provider
  | 'BILLING_STAFF'     // Billing and invoicing
  | 'SCHEDULER'         // Scheduling staff
  | 'VIEWER'            // Read-only access
  | 'CUSTOM';           // Custom role

/**
 * Permission scopes
 */
export type PermissionScope =
  | 'GLOBAL'            // System-wide
  | 'ORGANIZATION'      // Organization level
  | 'DEPARTMENT'        // Department level
  | 'TEAM'              // Team level
  | 'INDIVIDUAL';       // Individual level

/**
 * Permission actions
 */
export type PermissionAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'EXECUTE'
  | 'MANAGE';

/**
 * Resource types that can have permissions
 */
export type ResourceType =
  | 'CLIENTS'
  | 'CAREGIVERS'
  | 'CARE_PLANS'
  | 'TASKS'
  | 'VISITS'
  | 'SCHEDULES'
  | 'SHIFTS'
  | 'TIME_TRACKING'
  | 'BILLING'
  | 'INVOICES'
  | 'PAYROLL'
  | 'REPORTS'
  | 'ANALYTICS'
  | 'USERS'
  | 'ROLES'
  | 'PERMISSIONS'
  | 'ORGANIZATIONS'
  | 'SETTINGS'
  | 'AUDIT_LOGS';

/**
 * Permission definition
 */
export interface Permission extends Entity {
  code: string;                    // e.g., "clients:create", "billing:read"
  name: string;                    // Human-readable name
  description?: string;            // Description of permission
  resource: ResourceType;          // Resource this permission applies to
  action: PermissionAction;        // Action allowed
  scope: PermissionScope;          // Scope of permission
  conditions?: PermissionCondition[]; // Optional conditions
  isSystem: boolean;               // System permission (cannot be deleted)
}

/**
 * Permission condition for fine-grained access control
 */
export interface PermissionCondition {
  field: string;                   // Field to check (e.g., "organizationId", "departmentId")
  operator: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'NOT_IN' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN';
  value: string | string[] | number | boolean;
}

/**
 * Role definition
 */
export interface Role extends Entity, SoftDeletable {
  name: string;                    // Role name
  type: RoleType;                  // Role type
  description?: string;            // Role description
  organizationId?: UUID;           // Organization (null for system roles)
  permissions: UUID[];             // Permission IDs
  isSystem: boolean;               // System role (cannot be deleted)
  isActive: boolean;               // Active status
  metadata?: Record<string, unknown>; // Additional metadata
}

/**
 * User role assignment
 */
export interface UserRole extends Entity {
  userId: UUID;                    // User ID
  roleId: UUID;                    // Role ID
  organizationId?: UUID;           // Organization context
  departmentId?: UUID;             // Department context
  teamId?: UUID;                   // Team context
  grantedBy: UUID;                 // Who granted this role
  grantedAt: string;               // When granted (ISO 8601)
  expiresAt?: string;              // Optional expiration (ISO 8601)
  isActive: boolean;               // Active status
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;                 // Reason if denied
  permissions: Permission[];       // Matching permissions
}

/**
 * Audit log for security events
 */
export interface SecurityAuditLog extends Entity {
  userId?: UUID;                   // User who performed action
  organizationId?: UUID;           // Organization context
  action: SecurityAction;          // Security action
  resource: ResourceType;          // Resource affected
  resourceId?: UUID;               // Specific resource ID
  ipAddress?: string;              // IP address
  userAgent?: string;              // User agent
  success: boolean;                // Success status
  failureReason?: string;          // Reason for failure
  metadata?: Record<string, unknown>; // Additional context
  timestamp: string;               // Timestamp (ISO 8601)
}

/**
 * Security actions for audit logging
 */
export type SecurityAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'ROLE_ASSIGNED'
  | 'ROLE_REVOKED'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  | 'ACCESS_DENIED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'DATA_EXPORT'
  | 'SETTINGS_CHANGED';

/**
 * Input DTOs
 */

export interface CreateRoleInput {
  name: string;
  type: RoleType;
  description?: string;
  organizationId?: UUID;
  permissions: UUID[];
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: UUID[];
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreatePermissionInput {
  code: string;
  name: string;
  description?: string;
  resource: ResourceType;
  action: PermissionAction;
  scope: PermissionScope;
  conditions?: PermissionCondition[];
}

export interface UpdatePermissionInput {
  name?: string;
  description?: string;
  conditions?: PermissionCondition[];
}

export interface AssignRoleInput {
  userId: UUID;
  roleId: UUID;
  organizationId?: UUID;
  departmentId?: UUID;
  teamId?: UUID;
  expiresAt?: string;
}

export interface RevokeRoleInput {
  userId: UUID;
  roleId: UUID;
  organizationId?: UUID;
}

export interface CheckPermissionInput {
  userId: UUID;
  permissionCode: string;
  resourceId?: UUID;
  context?: Record<string, unknown>;
}

/**
 * Search filters
 */

export interface RoleSearchFilters {
  query?: string;
  type?: RoleType[];
  organizationId?: UUID;
  isActive?: boolean;
  isSystem?: boolean;
}

export interface PermissionSearchFilters {
  query?: string;
  resource?: ResourceType[];
  action?: PermissionAction[];
  scope?: PermissionScope[];
  isSystem?: boolean;
}

export interface UserRoleSearchFilters {
  userId?: UUID;
  roleId?: UUID;
  organizationId?: UUID;
  isActive?: boolean;
  includeExpired?: boolean;
}

export interface SecurityAuditSearchFilters {
  userId?: UUID;
  organizationId?: UUID;
  action?: SecurityAction[];
  resource?: ResourceType[];
  success?: boolean;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
}
