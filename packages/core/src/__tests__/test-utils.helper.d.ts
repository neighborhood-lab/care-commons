export declare const createMockUserContext: (overrides?: {}) => {
    userId: string;
    roles: "COORDINATOR"[];
    permissions: string[];
    organizationId: string;
    branchIds: string[];
};
export declare const createMockDatabase: () => {
    query: import("vitest").Mock<(...args: any[]) => any>;
    getClient: import("vitest").Mock<(...args: any[]) => any>;
    close: import("vitest").Mock<(...args: any[]) => any>;
    healthCheck: import("vitest").Mock<(...args: any[]) => any>;
};
export declare const createMockAuditService: () => {
    logEvent: import("vitest").Mock<(...args: any[]) => any>;
    getAuditTrail: import("vitest").Mock<(...args: any[]) => any>;
};
export declare const createMockPermissionService: () => {
    checkPermission: import("vitest").Mock<(...args: any[]) => any>;
    hasRole: import("vitest").Mock<(...args: any[]) => any>;
    getUserPermissions: import("vitest").Mock<(...args: any[]) => any>;
};
export declare const createMockDatabaseConfig: () => {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl: boolean;
    max: number;
    idleTimeoutMillis: number;
};
//# sourceMappingURL=test-utils.helper.d.ts.map