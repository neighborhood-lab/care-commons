"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = void 0;
exports.getPermissionService = getPermissionService;
const base_1 = require("../types/base");
class PermissionService {
    constructor() {
        this.rolePermissions = new Map();
        this.initializeDefaultPermissions();
    }
    initializeDefaultPermissions() {
        this.rolePermissions.set('SUPER_ADMIN', new Set(['*:*']));
        this.rolePermissions.set('ORG_ADMIN', new Set([
            'clients:*',
            'caregivers:*',
            'staff:*',
            'schedules:*',
            'billing:*',
            'reports:*',
            'settings:*',
        ]));
        this.rolePermissions.set('BRANCH_ADMIN', new Set([
            'clients:read',
            'clients:update',
            'caregivers:*',
            'staff:read',
            'schedules:*',
            'reports:read',
        ]));
        this.rolePermissions.set('COORDINATOR', new Set([
            'clients:read',
            'clients:update',
            'caregivers:read',
            'schedules:*',
            'visits:*',
            'care-plans:*',
        ]));
        this.rolePermissions.set('SCHEDULER', new Set([
            'clients:read',
            'caregivers:read',
            'schedules:*',
            'visits:read',
        ]));
        this.rolePermissions.set('CAREGIVER', new Set([
            'clients:read',
            'schedules:read',
            'visits:update',
            'care-plans:read',
            'tasks:update',
            'notes:create',
        ]));
        this.rolePermissions.set('FAMILY', new Set(['clients:read', 'care-plans:read', 'notes:read', 'visits:read']));
        this.rolePermissions.set('BILLING', new Set([
            'clients:read',
            'visits:read',
            'billing:*',
            'invoices:*',
            'reports:read',
        ]));
        this.rolePermissions.set('HR', new Set([
            'staff:*',
            'caregivers:*',
            'training:*',
            'certifications:*',
            'payroll:*',
        ]));
        this.rolePermissions.set('AUDITOR', new Set([
            'clients:read',
            'caregivers:read',
            'visits:read',
            'compliance:read',
            'audit-logs:read',
            'reports:read',
        ]));
        this.rolePermissions.set('READ_ONLY', new Set(['clients:read', 'reports:read']));
    }
    hasPermission(context, permission) {
        if (context.permissions.includes(permission)) {
            return true;
        }
        for (const role of context.roles) {
            const rolePerms = this.rolePermissions.get(role);
            if (!rolePerms)
                continue;
            if (rolePerms.has('*:*')) {
                return true;
            }
            if (rolePerms.has(permission)) {
                return true;
            }
            const [resource] = permission.split(':');
            if (rolePerms.has(`${resource}:*`)) {
                return true;
            }
        }
        return false;
    }
    requirePermission(context, permission) {
        if (!this.hasPermission(context, permission)) {
            throw new base_1.PermissionError(`Permission denied: ${permission}`, { userId: context.userId, permission });
        }
    }
    hasAllPermissions(context, permissions) {
        return permissions.every((p) => this.hasPermission(context, p));
    }
    hasAnyPermission(context, permissions) {
        return permissions.some((p) => this.hasPermission(context, p));
    }
    filterByScope(context, entities) {
        if (context.roles.includes('SUPER_ADMIN')) {
            return entities;
        }
        return entities.filter((entity) => {
            if (entity.organizationId !== context.organizationId) {
                return false;
            }
            if (entity.branchId && context.branchIds.length > 0) {
                return context.branchIds.includes(entity.branchId);
            }
            return true;
        });
    }
}
exports.PermissionService = PermissionService;
let permissionServiceInstance = null;
function getPermissionService() {
    if (!permissionServiceInstance) {
        permissionServiceInstance = new PermissionService();
    }
    return permissionServiceInstance;
}
//# sourceMappingURL=permission-service.js.map