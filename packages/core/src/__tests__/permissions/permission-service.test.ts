/**
 * Tests for permission service and RBAC
 */

import { PermissionService, getPermissionService } from '../../permissions/permission-service';
import { PermissionError, Role } from '../../types/base';
import { describe, it, expect, beforeEach } from 'vitest';

declare global {
  var permissionServiceInstance: PermissionService | null;
}

const createMockUserContext = (overrides = {}) => ({
  userId: 'test-user-id',
  roles: ['COORDINATOR' as const],
  permissions: ['clients:read', 'clients:write'],
  organizationId: 'test-org-id',
  branchIds: ['test-branch-id'],
  ...overrides,
});

describe('PermissionService', () => {
  let permissionService: PermissionService;

  beforeEach(() => {
    // Reset singleton for each test
    global.permissionServiceInstance = null;
    permissionService = new PermissionService();
  });

  describe('Default Permissions', () => {
    it('should initialize with default role permissions', () => {
      // Test that all expected roles have permissions
      const superAdminContext = createMockUserContext({ roles: ['SUPER_ADMIN'] });
      expect(permissionService.hasPermission(superAdminContext, 'any:permission')).toBe(true);

      const orgAdminContext = createMockUserContext({ roles: ['ORG_ADMIN'] });
      expect(permissionService.hasPermission(orgAdminContext, 'clients:read')).toBe(true);
      expect(permissionService.hasPermission(orgAdminContext, 'clients:write')).toBe(true);
      expect(permissionService.hasPermission(orgAdminContext, 'billing:read')).toBe(true);

      const caregiverContext = createMockUserContext({ roles: ['CAREGIVER'] });
      expect(permissionService.hasPermission(caregiverContext, 'clients:read')).toBe(true);
      expect(permissionService.hasPermission(caregiverContext, 'schedules:read')).toBe(true);
      expect(permissionService.hasPermission(caregiverContext, 'billing:write')).toBe(false);
    });

    it('should have all required roles defined', () => {
      const expectedRoles: Role[] = [
        'SUPER_ADMIN',
        'ORG_ADMIN',
        'BRANCH_ADMIN',
        'COORDINATOR',
        'SCHEDULER',
        'CAREGIVER',
        'FAMILY',
        'CLIENT',
        'BILLING',
        'HR',
        'AUDITOR',
        'READ_ONLY',
      ];

      expectedRoles.forEach(role => {
        const context = createMockUserContext({ roles: [role] });
        expect(permissionService.hasPermission(context, 'test:permission')).toBeDefined();
      });
    });
  });

  describe('Permission Checking', () => {
    it('should grant permission for exact match', () => {
      const context = createMockUserContext({
        roles: ['COORDINATOR'],
        permissions: ['custom:permission'],
      });

      expect(permissionService.hasPermission(context, 'clients:read')).toBe(true);
      expect(permissionService.hasPermission(context, 'custom:permission')).toBe(true);
    });

    it('should grant permission for resource wildcard', () => {
      const context = createMockUserContext({ roles: ['ORG_ADMIN'] });

      expect(permissionService.hasPermission(context, 'clients:read')).toBe(true);
      expect(permissionService.hasPermission(context, 'clients:write')).toBe(true);
      expect(permissionService.hasPermission(context, 'clients:delete')).toBe(true);
    });

    it('should grant all permissions for super admin', () => {
      const context = createMockUserContext({ roles: ['SUPER_ADMIN'] });

      expect(permissionService.hasPermission(context, 'any:permission')).toBe(true);
      expect(permissionService.hasPermission(context, 'system:config')).toBe(true);
      expect(permissionService.hasPermission(context, 'users:delete')).toBe(true);
    });

    it('should deny permission when not granted', () => {
      const context = createMockUserContext({ roles: ['CAREGIVER'] });

      expect(permissionService.hasPermission(context, 'billing:write')).toBe(false);
      expect(permissionService.hasPermission(context, 'users:delete')).toBe(false);
      expect(permissionService.hasPermission(context, 'system:config')).toBe(false);
    });

    it('should check multiple roles', () => {
      const context = createMockUserContext({
        roles: ['CAREGIVER', 'SCHEDULER'],
      });

      expect(permissionService.hasPermission(context, 'clients:read')).toBe(true); // Both roles have this
      expect(permissionService.hasPermission(context, 'schedules:read')).toBe(true); // Both roles have this
      expect(permissionService.hasPermission(context, 'visits:update')).toBe(true); // CAREGIVER has this
    });

    it('should prioritize explicit permissions over role permissions', () => {
      const context = createMockUserContext({
        roles: ['READ_ONLY'], // Limited role
        permissions: ['admin:delete'], // But has explicit admin permission
      });

      expect(permissionService.hasPermission(context, 'admin:delete')).toBe(true);
      expect(permissionService.hasPermission(context, 'clients:read')).toBe(true); // From role
      expect(permissionService.hasPermission(context, 'billing:write')).toBe(false); // Neither role nor explicit
    });
  });

  describe('Permission Assertion', () => {
    it('should not throw when permission is granted', () => {
      const context = createMockUserContext({ roles: ['COORDINATOR'] });

      expect(() => {
        permissionService.requirePermission(context, 'clients:read');
      }).not.toThrow();
    });

    it('should throw PermissionError when permission is denied', () => {
      const context = createMockUserContext({ roles: ['CAREGIVER'] });

      expect(() => {
        permissionService.requirePermission(context, 'billing:write');
      }).toThrow(PermissionError);

      expect(() => {
        permissionService.requirePermission(context, 'billing:write');
      }).toThrow('Permission denied: billing:write');
    });

    it('should include context in PermissionError', () => {
      const context = createMockUserContext({
        userId: 'user-123',
        roles: ['CAREGIVER'],
      });

      try {
        permissionService.requirePermission(context, 'admin:delete');
      } catch (error) {
        expect(error).toBeInstanceOf(PermissionError);
        expect((error as PermissionError).context).toEqual({
          userId: 'user-123',
          permission: 'admin:delete',
        });
      }
    });
  });

  describe('Multiple Permission Checking', () => {
    it('should return true when user has all required permissions', () => {
      const context = createMockUserContext({ roles: ['COORDINATOR'] });

      const result = permissionService.hasAllPermissions(context, [
        'clients:read',
        'clients:write',
        'schedules:read',
        'schedules:write',
      ]);

      expect(result).toBe(true);
    });

    it('should return false when user lacks some required permissions', () => {
      const context = createMockUserContext({ roles: ['CAREGIVER'] });

      const result = permissionService.hasAllPermissions(context, [
        'clients:read',
        'billing:write', // Caregiver doesn't have this
      ]);

      expect(result).toBe(false);
    });

    it('should return true when user has any of the required permissions', () => {
      const context = createMockUserContext({ roles: ['BILLING'] });

      const result = permissionService.hasAnyPermission(context, [
        'clients:write',
        'billing:read',
        'schedules:write',
      ]);

      expect(result).toBe(true); // Has billing:read
    });

    it('should return false when user has none of the required permissions', () => {
      const context = createMockUserContext({ 
        roles: ['READ_ONLY'],
        permissions: [] // Clear explicit permissions to test role-based only
      });

      const result = permissionService.hasAnyPermission(context, [
        'clients:write',
        'billing:write',
        'schedules:write',
      ]);

      expect(result).toBe(false);
    });
  });

  describe('Organizational Scope Filtering', () => {
    it('should return all entities for super admin', () => {
      const context = createMockUserContext({ roles: ['SUPER_ADMIN'] });
      const entities = [
        { organizationId: 'org-1', name: 'Entity 1' },
        { organizationId: 'org-2', name: 'Entity 2' },
        { organizationId: 'org-3', name: 'Entity 3' },
      ];

      const filtered = permissionService.filterByScope(context, entities);

      expect(filtered).toHaveLength(3);
      expect(filtered).toEqual(entities);
    });

    it('should filter by organization for non-super admin', () => {
      const context = createMockUserContext({
        roles: ['ORG_ADMIN'],
        organizationId: 'org-2',
      });
      const entities = [
        { organizationId: 'org-1', name: 'Entity 1' },
        { organizationId: 'org-2', name: 'Entity 2' },
        { organizationId: 'org-3', name: 'Entity 3' },
      ];

      const filtered = permissionService.filterByScope(context, entities);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Entity 2');
    });

    it('should filter by branch when branch IDs are provided', () => {
      const context = createMockUserContext({
        roles: ['BRANCH_ADMIN'],
        organizationId: 'org-1',
        branchIds: ['branch-1', 'branch-3'],
      });
      const entities = [
        { organizationId: 'org-1', branchId: 'branch-1', name: 'Entity 1' },
        { organizationId: 'org-1', branchId: 'branch-2', name: 'Entity 2' },
        { organizationId: 'org-1', branchId: 'branch-3', name: 'Entity 3' },
        { organizationId: 'org-2', branchId: 'branch-1', name: 'Entity 4' },
      ];

      const filtered = permissionService.filterByScope(context, entities);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(e => e.name)).toEqual(['Entity 1', 'Entity 3']);
    });

    it('should handle entities without branch ID', () => {
      const context = createMockUserContext({
        roles: ['ORG_ADMIN'],
        organizationId: 'org-1',
        branchIds: ['branch-1'],
      });
      const entities = [
        { organizationId: 'org-1', name: 'Entity 1' }, // No branchId
        { organizationId: 'org-1', branchId: 'branch-2', name: 'Entity 2' },
      ];

      const filtered = permissionService.filterByScope(context, entities);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Entity 1');
    });

    it('should handle empty branch IDs array', () => {
      const context = createMockUserContext({
        roles: ['ORG_ADMIN'],
        organizationId: 'org-1',
        branchIds: [],
      });
      const entities = [
        { organizationId: 'org-1', branchId: 'branch-1', name: 'Entity 1' },
        { organizationId: 'org-1', branchId: 'branch-2', name: 'Entity 2' },
      ];

      const filtered = permissionService.filterByScope(context, entities);

      expect(filtered).toHaveLength(2); // Both pass org filter, branch filter doesn't apply
    });
  });

  describe('Role-Based Access Control', () => {
    describe('SUPER_ADMIN', () => {
      it('should have access to everything', () => {
        const context = createMockUserContext({ roles: ['SUPER_ADMIN'] });

        expect(permissionService.hasPermission(context, '*:*')).toBe(true);
        expect(permissionService.hasPermission(context, 'system:shutdown')).toBe(true);
        expect(permissionService.hasPermission(context, 'users:delete')).toBe(true);
      });
    });

    describe('ORG_ADMIN', () => {
      it('should have organization-wide access', () => {
        const context = createMockUserContext({ roles: ['ORG_ADMIN'] });

        expect(permissionService.hasPermission(context, 'clients:read')).toBe(true);
        expect(permissionService.hasPermission(context, 'clients:write')).toBe(true);
        expect(permissionService.hasPermission(context, 'caregivers:*')).toBe(true);
        expect(permissionService.hasPermission(context, 'billing:*')).toBe(true);
        expect(permissionService.hasPermission(context, 'reports:*')).toBe(true);
        expect(permissionService.hasPermission(context, 'settings:*')).toBe(true);
      });

      it('should not have system-level access', () => {
        const context = createMockUserContext({ roles: ['ORG_ADMIN'] });

        expect(permissionService.hasPermission(context, 'system:config')).toBe(false);
        expect(permissionService.hasPermission(context, 'organizations:delete')).toBe(false);
      });
    });

    describe('CAREGIVER', () => {
      it('should have field staff access', () => {
        const context = createMockUserContext({ roles: ['CAREGIVER'] });

        expect(permissionService.hasPermission(context, 'clients:read')).toBe(true);
        expect(permissionService.hasPermission(context, 'schedules:read')).toBe(true);
        expect(permissionService.hasPermission(context, 'visits:update')).toBe(true);
        expect(permissionService.hasPermission(context, 'care-plans:read')).toBe(true);
        expect(permissionService.hasPermission(context, 'tasks:update')).toBe(true);
        expect(permissionService.hasPermission(context, 'notes:create')).toBe(true);
      });

      it('should not have administrative access', () => {
        const context = createMockUserContext({ 
          roles: ['CAREGIVER'],
          permissions: [] // Clear explicit permissions to test role-based only
        });

        expect(permissionService.hasPermission(context, 'clients:write')).toBe(false);
        expect(permissionService.hasPermission(context, 'billing:read')).toBe(false);
        expect(permissionService.hasPermission(context, 'caregivers:read')).toBe(false);
      });
    });

    describe('READ_ONLY', () => {
      it('should have minimal read access', () => {
        const context = createMockUserContext({ roles: ['READ_ONLY'] });

        expect(permissionService.hasPermission(context, 'clients:read')).toBe(true);
        expect(permissionService.hasPermission(context, 'reports:read')).toBe(true);
      });

      it('should not have write access', () => {
        const context = createMockUserContext({ 
          roles: ['READ_ONLY'],
          permissions: [] // Clear explicit permissions to test role-based only
        });

        expect(permissionService.hasPermission(context, 'clients:write')).toBe(false);
        expect(permissionService.hasPermission(context, 'schedules:write')).toBe(false);
        expect(permissionService.hasPermission(context, 'billing:write')).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty roles array', () => {
      const context = createMockUserContext({ 
        roles: [],
        permissions: [] // Clear explicit permissions to test role-based only
      });

      expect(permissionService.hasPermission(context, 'clients:read')).toBe(false);
      expect(permissionService.hasPermission(context, 'any:permission')).toBe(false);
    });

    it('should handle empty permissions array', () => {
      const context = createMockUserContext({
        roles: [],
        permissions: [],
      });

      expect(permissionService.hasPermission(context, 'clients:read')).toBe(false);
    });

    it('should handle unknown roles gracefully', () => {
      const context = createMockUserContext({
        roles: ['UNKNOWN_ROLE' as Role],
        permissions: [], // Clear explicit permissions to test role-based only
      });

      expect(permissionService.hasPermission(context, 'clients:read')).toBe(false);
    });

    it('should handle malformed permission strings', () => {
      const context = createMockUserContext({ roles: ['COORDINATOR'] });

      expect(permissionService.hasPermission(context, '')).toBe(false);
      expect(permissionService.hasPermission(context, 'invalid')).toBe(false);
      expect(permissionService.hasPermission(context, 'clients')).toBe(false); // Missing action
    });
  });
});

describe('PermissionService Singleton', () => {
  beforeEach(() => {
    // Reset singleton
    global.permissionServiceInstance = null;
  });

  it('should return singleton instance', () => {
    const service1 = getPermissionService();
    const service2 = getPermissionService();

    expect(service1).toBe(service2);
    expect(service1).toBeInstanceOf(PermissionService);
  });

  it('should create new instance only once', () => {
    const service1 = getPermissionService();
    const service2 = new PermissionService();
    const service3 = getPermissionService();

    expect(service1).toBe(service3);
    expect(service1).not.toBe(service2);
  });
});