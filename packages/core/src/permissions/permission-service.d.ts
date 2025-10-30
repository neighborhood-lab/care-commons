import { UserContext } from '../types/base';
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
export declare class PermissionService {
    private rolePermissions;
    constructor();
    private initializeDefaultPermissions;
    hasPermission(context: UserContext, permission: string): boolean;
    requirePermission(context: UserContext, permission: string): void;
    hasAllPermissions(context: UserContext, permissions: string[]): boolean;
    hasAnyPermission(context: UserContext, permissions: string[]): boolean;
    filterByScope<T extends {
        organizationId?: string;
        branchId?: string;
    }>(context: UserContext, entities: T[]): T[];
}
export declare function getPermissionService(): PermissionService;
//# sourceMappingURL=permission-service.d.ts.map