"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const permission_service_1 = require("../../permissions/permission-service");
const base_1 = require("../../types/base");
const vitest_1 = require("vitest");
const createMockUserContext = (overrides = {}) => ({
    userId: 'test-user-id',
    roles: ['COORDINATOR'],
    permissions: ['clients:read', 'clients:write'],
    organizationId: 'test-org-id',
    branchIds: ['test-branch-id'],
    ...overrides,
});
(0, vitest_1.describe)('PermissionService', () => {
    let permissionService;
    (0, vitest_1.beforeEach)(() => {
        global.permissionServiceInstance = null;
        permissionService = new permission_service_1.PermissionService();
    });
    (0, vitest_1.describe)('Default Permissions', () => {
        (0, vitest_1.it)('should initialize with default role permissions', () => {
            const superAdminContext = createMockUserContext({ roles: ['SUPER_ADMIN'] });
            (0, vitest_1.expect)(permissionService.hasPermission(superAdminContext, 'any:permission')).toBe(true);
            const orgAdminContext = createMockUserContext({ roles: ['ORG_ADMIN'] });
            (0, vitest_1.expect)(permissionService.hasPermission(orgAdminContext, 'clients:read')).toBe(true);
            (0, vitest_1.expect)(permissionService.hasPermission(orgAdminContext, 'clients:write')).toBe(true);
            (0, vitest_1.expect)(permissionService.hasPermission(orgAdminContext, 'billing:read')).toBe(true);
            const caregiverContext = createMockUserContext({ roles: ['CAREGIVER'] });
            (0, vitest_1.expect)(permissionService.hasPermission(caregiverContext, 'clients:read')).toBe(true);
            (0, vitest_1.expect)(permissionService.hasPermission(caregiverContext, 'schedules:read')).toBe(true);
            (0, vitest_1.expect)(permissionService.hasPermission(caregiverContext, 'billing:write')).toBe(false);
        });
        (0, vitest_1.it)('should have all required roles defined', () => {
            const expectedRoles = [
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
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'test:permission')).toBeDefined();
            });
        });
    });
    (0, vitest_1.describe)('Permission Checking', () => {
        (0, vitest_1.it)('should grant permission for exact match', () => {
            const context = createMockUserContext({
                roles: ['COORDINATOR'],
                permissions: ['custom:permission'],
            });
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients:read')).toBe(true);
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'custom:permission')).toBe(true);
        });
        (0, vitest_1.it)('should grant permission for resource wildcard', () => {
            const context = createMockUserContext({ roles: ['ORG_ADMIN'] });
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients:read')).toBe(true);
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients:write')).toBe(true);
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients:delete')).toBe(true);
        });
        (0, vitest_1.it)('should grant all permissions for super admin', () => {
            const context = createMockUserContext({ roles: ['SUPER_ADMIN'] });
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'any:permission')).toBe(true);
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'system:config')).toBe(true);
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'users:delete')).toBe(true);
        });
        (0, vitest_1.it)('should deny permission when not granted', () => {
            const context = createMockUserContext({ roles: ['CAREGIVER'] });
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'billing:write')).toBe(false);
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'users:delete')).toBe(false);
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'system:config')).toBe(false);
        });
        (0, vitest_1.it)('should check multiple roles', () => {
            const context = createMockUserContext({
                roles: ['CAREGIVER', 'SCHEDULER'],
            });
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients:read')).toBe(true);
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'schedules:read')).toBe(true);
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'visits:update')).toBe(true);
        });
        (0, vitest_1.it)('should prioritize explicit permissions over role permissions', () => {
            const context = createMockUserContext({
                roles: ['READ_ONLY'],
                permissions: ['admin:delete'],
            });
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'admin:delete')).toBe(true);
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients:read')).toBe(true);
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'billing:write')).toBe(false);
        });
    });
    (0, vitest_1.describe)('Permission Assertion', () => {
        (0, vitest_1.it)('should not throw when permission is granted', () => {
            const context = createMockUserContext({ roles: ['COORDINATOR'] });
            (0, vitest_1.expect)(() => {
                permissionService.requirePermission(context, 'clients:read');
            }).not.toThrow();
        });
        (0, vitest_1.it)('should throw PermissionError when permission is denied', () => {
            const context = createMockUserContext({ roles: ['CAREGIVER'] });
            (0, vitest_1.expect)(() => {
                permissionService.requirePermission(context, 'billing:write');
            }).toThrow(base_1.PermissionError);
            (0, vitest_1.expect)(() => {
                permissionService.requirePermission(context, 'billing:write');
            }).toThrow('Permission denied: billing:write');
        });
        (0, vitest_1.it)('should include context in PermissionError', () => {
            const context = createMockUserContext({
                userId: 'user-123',
                roles: ['CAREGIVER'],
            });
            try {
                permissionService.requirePermission(context, 'admin:delete');
            }
            catch (error) {
                (0, vitest_1.expect)(error).toBeInstanceOf(base_1.PermissionError);
                (0, vitest_1.expect)(error.context).toEqual({
                    userId: 'user-123',
                    permission: 'admin:delete',
                });
            }
        });
    });
    (0, vitest_1.describe)('Multiple Permission Checking', () => {
        (0, vitest_1.it)('should return true when user has all required permissions', () => {
            const context = createMockUserContext({ roles: ['COORDINATOR'] });
            const result = permissionService.hasAllPermissions(context, [
                'clients:read',
                'clients:write',
                'schedules:read',
                'schedules:write',
            ]);
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return false when user lacks some required permissions', () => {
            const context = createMockUserContext({ roles: ['CAREGIVER'] });
            const result = permissionService.hasAllPermissions(context, [
                'clients:read',
                'billing:write',
            ]);
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should return true when user has any of the required permissions', () => {
            const context = createMockUserContext({ roles: ['BILLING'] });
            const result = permissionService.hasAnyPermission(context, [
                'clients:write',
                'billing:read',
                'schedules:write',
            ]);
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return false when user has none of the required permissions', () => {
            const context = createMockUserContext({
                roles: ['READ_ONLY'],
                permissions: []
            });
            const result = permissionService.hasAnyPermission(context, [
                'clients:write',
                'billing:write',
                'schedules:write',
            ]);
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('Organizational Scope Filtering', () => {
        (0, vitest_1.it)('should return all entities for super admin', () => {
            const context = createMockUserContext({ roles: ['SUPER_ADMIN'] });
            const entities = [
                { organizationId: 'org-1', name: 'Entity 1' },
                { organizationId: 'org-2', name: 'Entity 2' },
                { organizationId: 'org-3', name: 'Entity 3' },
            ];
            const filtered = permissionService.filterByScope(context, entities);
            (0, vitest_1.expect)(filtered).toHaveLength(3);
            (0, vitest_1.expect)(filtered).toEqual(entities);
        });
        (0, vitest_1.it)('should filter by organization for non-super admin', () => {
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
            (0, vitest_1.expect)(filtered).toHaveLength(1);
            (0, vitest_1.expect)(filtered[0].name).toBe('Entity 2');
        });
        (0, vitest_1.it)('should filter by branch when branch IDs are provided', () => {
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
            (0, vitest_1.expect)(filtered).toHaveLength(2);
            (0, vitest_1.expect)(filtered.map(e => e.name)).toEqual(['Entity 1', 'Entity 3']);
        });
        (0, vitest_1.it)('should handle entities without branch ID', () => {
            const context = createMockUserContext({
                roles: ['ORG_ADMIN'],
                organizationId: 'org-1',
                branchIds: ['branch-1'],
            });
            const entities = [
                { organizationId: 'org-1', name: 'Entity 1' },
                { organizationId: 'org-1', branchId: 'branch-2', name: 'Entity 2' },
            ];
            const filtered = permissionService.filterByScope(context, entities);
            (0, vitest_1.expect)(filtered).toHaveLength(1);
            (0, vitest_1.expect)(filtered[0].name).toBe('Entity 1');
        });
        (0, vitest_1.it)('should handle empty branch IDs array', () => {
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
            (0, vitest_1.expect)(filtered).toHaveLength(2);
        });
    });
    (0, vitest_1.describe)('Role-Based Access Control', () => {
        (0, vitest_1.describe)('SUPER_ADMIN', () => {
            (0, vitest_1.it)('should have access to everything', () => {
                const context = createMockUserContext({ roles: ['SUPER_ADMIN'] });
                (0, vitest_1.expect)(permissionService.hasPermission(context, '*:*')).toBe(true);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'system:shutdown')).toBe(true);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'users:delete')).toBe(true);
            });
        });
        (0, vitest_1.describe)('ORG_ADMIN', () => {
            (0, vitest_1.it)('should have organization-wide access', () => {
                const context = createMockUserContext({ roles: ['ORG_ADMIN'] });
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients:read')).toBe(true);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients:write')).toBe(true);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'caregivers:*')).toBe(true);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'billing:*')).toBe(true);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'reports:*')).toBe(true);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'settings:*')).toBe(true);
            });
            (0, vitest_1.it)('should not have system-level access', () => {
                const context = createMockUserContext({ roles: ['ORG_ADMIN'] });
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'system:config')).toBe(false);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'organizations:delete')).toBe(false);
            });
        });
        (0, vitest_1.describe)('CAREGIVER', () => {
            (0, vitest_1.it)('should have field staff access', () => {
                const context = createMockUserContext({ roles: ['CAREGIVER'] });
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients:read')).toBe(true);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'schedules:read')).toBe(true);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'visits:update')).toBe(true);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'care-plans:read')).toBe(true);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'tasks:update')).toBe(true);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'notes:create')).toBe(true);
            });
            (0, vitest_1.it)('should not have administrative access', () => {
                const context = createMockUserContext({
                    roles: ['CAREGIVER'],
                    permissions: []
                });
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients:write')).toBe(false);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'billing:read')).toBe(false);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'caregivers:read')).toBe(false);
            });
        });
        (0, vitest_1.describe)('READ_ONLY', () => {
            (0, vitest_1.it)('should have minimal read access', () => {
                const context = createMockUserContext({ roles: ['READ_ONLY'] });
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients:read')).toBe(true);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'reports:read')).toBe(true);
            });
            (0, vitest_1.it)('should not have write access', () => {
                const context = createMockUserContext({
                    roles: ['READ_ONLY'],
                    permissions: []
                });
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients:write')).toBe(false);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'schedules:write')).toBe(false);
                (0, vitest_1.expect)(permissionService.hasPermission(context, 'billing:write')).toBe(false);
            });
        });
    });
    (0, vitest_1.describe)('Edge Cases', () => {
        (0, vitest_1.it)('should handle empty roles array', () => {
            const context = createMockUserContext({
                roles: [],
                permissions: []
            });
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients:read')).toBe(false);
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'any:permission')).toBe(false);
        });
        (0, vitest_1.it)('should handle empty permissions array', () => {
            const context = createMockUserContext({
                roles: [],
                permissions: [],
            });
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients:read')).toBe(false);
        });
        (0, vitest_1.it)('should handle unknown roles gracefully', () => {
            const context = createMockUserContext({
                roles: ['UNKNOWN_ROLE'],
                permissions: [],
            });
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients:read')).toBe(false);
        });
        (0, vitest_1.it)('should handle malformed permission strings', () => {
            const context = createMockUserContext({ roles: ['COORDINATOR'] });
            (0, vitest_1.expect)(permissionService.hasPermission(context, '')).toBe(false);
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'invalid')).toBe(false);
            (0, vitest_1.expect)(permissionService.hasPermission(context, 'clients')).toBe(false);
        });
    });
});
(0, vitest_1.describe)('PermissionService Singleton', () => {
    (0, vitest_1.beforeEach)(() => {
        global.permissionServiceInstance = null;
    });
    (0, vitest_1.it)('should return singleton instance', () => {
        const service1 = (0, permission_service_1.getPermissionService)();
        const service2 = (0, permission_service_1.getPermissionService)();
        (0, vitest_1.expect)(service1).toBe(service2);
        (0, vitest_1.expect)(service1).toBeInstanceOf(permission_service_1.PermissionService);
    });
    (0, vitest_1.it)('should create new instance only once', () => {
        const service1 = (0, permission_service_1.getPermissionService)();
        const service2 = new permission_service_1.PermissionService();
        const service3 = (0, permission_service_1.getPermissionService)();
        (0, vitest_1.expect)(service1).toBe(service3);
        (0, vitest_1.expect)(service1).not.toBe(service2);
    });
});
//# sourceMappingURL=permission-service.test.js.map