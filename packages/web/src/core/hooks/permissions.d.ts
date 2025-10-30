export interface UsePermissionsReturn {
    can: (permission: string) => boolean;
    canAny: (permissions: string[]) => boolean;
    canAll: (permissions: string[]) => boolean;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
}
export declare const usePermissions: () => UsePermissionsReturn;
//# sourceMappingURL=permissions.d.ts.map