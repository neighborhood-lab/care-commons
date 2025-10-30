"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockDatabaseConfig = exports.createMockPermissionService = exports.createMockAuditService = exports.createMockDatabase = exports.createMockUserContext = void 0;
const vitest_1 = require("vitest");
vitest_1.vi.mock('uuid', () => ({
    v4: vitest_1.vi.fn(() => 'test-uuid-1234-5678-9012'),
}));
global.console = {
    ...console,
    log: vitest_1.vi.fn(),
    debug: vitest_1.vi.fn(),
    info: vitest_1.vi.fn(),
    warn: vitest_1.vi.fn(),
    error: vitest_1.vi.fn(),
};
const createMockUserContext = (overrides = {}) => ({
    userId: 'test-user-id',
    roles: ['COORDINATOR'],
    permissions: ['clients:read', 'clients:write'],
    organizationId: 'test-org-id',
    branchIds: ['test-branch-id'],
    ...overrides,
});
exports.createMockUserContext = createMockUserContext;
const createMockDatabase = () => ({
    query: vitest_1.vi.fn(),
    getClient: vitest_1.vi.fn(),
    close: vitest_1.vi.fn(),
    healthCheck: vitest_1.vi.fn(),
});
exports.createMockDatabase = createMockDatabase;
const createMockAuditService = () => ({
    logEvent: vitest_1.vi.fn(),
    getAuditTrail: vitest_1.vi.fn(),
});
exports.createMockAuditService = createMockAuditService;
const createMockPermissionService = () => ({
    checkPermission: vitest_1.vi.fn(),
    hasRole: vitest_1.vi.fn(),
    getUserPermissions: vitest_1.vi.fn(),
});
exports.createMockPermissionService = createMockPermissionService;
const createMockDatabaseConfig = () => ({
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    user: 'test_user',
    password: 'test_password',
    ssl: false,
    max: 5,
    idleTimeoutMillis: 1000,
});
exports.createMockDatabaseConfig = createMockDatabaseConfig;
//# sourceMappingURL=test-utils.helper.js.map