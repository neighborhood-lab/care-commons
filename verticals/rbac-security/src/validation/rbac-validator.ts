import { z } from 'zod';
import type {
  CreateRoleInput,
  UpdateRoleInput,
  CreatePermissionInput,
  UpdatePermissionInput,
  AssignRoleInput,
  RevokeRoleInput,
} from '../types/role';

/**
 * Validation result
 */
export interface ValidationResult {
  success: boolean;
  errors?: Record<string, string[]>;
}

/**
 * Validator for RBAC operations
 */
export class RBACValidator {
  // Schema definitions
  private createRoleSchema = z.object({
    name: z.string().min(1).max(100),
    type: z.enum([
      'SYSTEM_ADMIN',
      'ORGANIZATION_ADMIN',
      'MANAGER',
      'SUPERVISOR',
      'COORDINATOR',
      'CAREGIVER',
      'BILLING_STAFF',
      'SCHEDULER',
      'VIEWER',
      'CUSTOM',
    ]),
    description: z.string().max(500).optional(),
    organizationId: z.string().uuid().optional(),
    permissions: z.array(z.string().uuid()).min(1),
    isActive: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
  });

  private updateRoleSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    permissions: z.array(z.string().uuid()).min(1).optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
  });

  private createPermissionSchema = z.object({
    code: z.string().min(1).max(100).regex(/^[a-z0-9_:]+$/),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    resource: z.enum([
      'CLIENTS',
      'CAREGIVERS',
      'CARE_PLANS',
      'TASKS',
      'VISITS',
      'SCHEDULES',
      'SHIFTS',
      'TIME_TRACKING',
      'BILLING',
      'INVOICES',
      'PAYROLL',
      'REPORTS',
      'ANALYTICS',
      'USERS',
      'ROLES',
      'PERMISSIONS',
      'ORGANIZATIONS',
      'SETTINGS',
      'AUDIT_LOGS',
    ]),
    action: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXECUTE', 'MANAGE']),
    scope: z.enum(['GLOBAL', 'ORGANIZATION', 'DEPARTMENT', 'TEAM', 'INDIVIDUAL']),
    conditions: z
      .array(
        z.object({
          field: z.string(),
          operator: z.enum(['EQUALS', 'NOT_EQUALS', 'IN', 'NOT_IN', 'CONTAINS', 'GREATER_THAN', 'LESS_THAN']),
          value: z.union([z.string(), z.array(z.string()), z.number(), z.boolean()]),
        })
      )
      .optional(),
  });

  private updatePermissionSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    conditions: z
      .array(
        z.object({
          field: z.string(),
          operator: z.enum(['EQUALS', 'NOT_EQUALS', 'IN', 'NOT_IN', 'CONTAINS', 'GREATER_THAN', 'LESS_THAN']),
          value: z.union([z.string(), z.array(z.string()), z.number(), z.boolean()]),
        })
      )
      .optional(),
  });

  private assignRoleSchema = z.object({
    userId: z.string().uuid(),
    roleId: z.string().uuid(),
    organizationId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
    expiresAt: z.string().datetime().optional(),
  });

  private revokeRoleSchema = z.object({
    userId: z.string().uuid(),
    roleId: z.string().uuid(),
    organizationId: z.string().uuid().optional(),
  });

  // Validation methods
  validateCreateRole(input: CreateRoleInput): ValidationResult {
    return this.validate(this.createRoleSchema, input);
  }

  validateUpdateRole(input: UpdateRoleInput): ValidationResult {
    return this.validate(this.updateRoleSchema, input);
  }

  validateCreatePermission(input: CreatePermissionInput): ValidationResult {
    return this.validate(this.createPermissionSchema, input);
  }

  validateUpdatePermission(input: UpdatePermissionInput): ValidationResult {
    return this.validate(this.updatePermissionSchema, input);
  }

  validateAssignRole(input: AssignRoleInput): ValidationResult {
    return this.validate(this.assignRoleSchema, input);
  }

  validateRevokeRole(input: RevokeRoleInput): ValidationResult {
    return this.validate(this.revokeRoleSchema, input);
  }

  // Helper method to validate using Zod schemas
  private validate(schema: z.ZodSchema, input: unknown): ValidationResult {
    const result = schema.safeParse(input);

    if (result.success) {
      return { success: true };
    }

    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }

    return { success: false, errors };
  }
}
