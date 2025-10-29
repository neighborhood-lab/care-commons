/**
 * Test setup utilities and mocks
 */

import { jest } from '@jest/globals';

// Mock UUID generation for consistent tests
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234-5678-9012'),
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Test utilities
export const createMockUserContext = (overrides = {}) => ({
  userId: 'test-user-id',
  roles: ['COORDINATOR' as const],
  permissions: ['clients:read', 'clients:write'],
  organizationId: 'test-org-id',
  branchIds: ['test-branch-id'],
  ...overrides,
});

export const createMockDatabase = () => ({
  query: jest.fn(),
  getClient: jest.fn(),
  close: jest.fn(),
  healthCheck: jest.fn(),
});

export const createMockAuditService = () => ({
  logEvent: jest.fn(),
  getAuditTrail: jest.fn(),
});

export const createMockPermissionService = () => ({
  checkPermission: jest.fn(),
  hasRole: jest.fn(),
  getUserPermissions: jest.fn(),
});

export const createMockDatabaseConfig = () => ({
  host: 'localhost',
  port: 5432,
  database: 'test_db',
  user: 'test_user',
  password: 'test_password',
  ssl: false,
  max: 5,
  idleTimeoutMillis: 1000,
});