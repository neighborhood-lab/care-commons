import { test as base, Page } from '@playwright/test';
import { TestDatabase } from '../setup/test-database.js';
import { JWTUtils, TokenPayload } from '../../packages/core/src/utils/jwt-utils.js';
import { E2E_UUIDS } from './test-data.js';

/**
 * Authenticated User Type
 */
export type AuthenticatedUser = {
  userId: string;
  email: string;
  organizationId: string;
  branchId: string;
  roles: string[];
  permissions: string[];
  token?: string;
};

/**
 * Auth Fixtures for E2E Tests
 *
 * Provides pre-configured user contexts for different roles:
 * - adminUser: Super admin with all permissions
 * - coordinatorUser: Care coordinator with scheduling/EVV permissions
 * - caregiverUser: Caregiver with visit and task permissions
 * - authenticatedPage: Page with authentication headers set
 */
export type AuthFixtures = {
  authenticatedPage: Page;
  adminUser: AuthenticatedUser;
  coordinatorUser: AuthenticatedUser;
  caregiverUser: AuthenticatedUser;
  orgAdminUser: AuthenticatedUser;
};

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Super Admin User - Full access to all resources
   */
  adminUser: async ({}, use) => {
    const user: AuthenticatedUser = {
      userId: E2E_UUIDS.ADMIN_USER,
      email: 'admin@e2e-test.com',
      organizationId: E2E_UUIDS.ORG_E2E,
      branchId: E2E_UUIDS.BRANCH_E2E,
      roles: ['SUPER_ADMIN'],
      permissions: ['*:*'], // Wildcard permission
    };

    // Generate JWT token
    const tokenPayload: TokenPayload = {
      userId: user.userId,
      email: user.email,
      organizationId: user.organizationId,
      roles: user.roles,
      permissions: user.permissions,
      tokenVersion: 1,
    };
    user.token = JWTUtils.generateTokenPair(tokenPayload).accessToken;

    await use(user);
  },

  /**
   * Organization Admin User - Full access within organization
   */
  orgAdminUser: async ({}, use) => {
    const user: AuthenticatedUser = {
      userId: E2E_UUIDS.ORG_ADMIN_USER,
      email: 'orgadmin@e2e-test.com',
      organizationId: E2E_UUIDS.ORG_E2E,
      branchId: E2E_UUIDS.BRANCH_E2E,
      roles: ['ORG_ADMIN'],
      permissions: [
        'organizations:read',
        'organizations:write',
        'branches:read',
        'branches:write',
        'users:read',
        'users:write',
        'clients:*',
        'caregivers:*',
        'visits:*',
        'evv:*',
        'billing:*',
        'payroll:*',
      ],
    };

    const tokenPayload: TokenPayload = {
      userId: user.userId,
      email: user.email,
      organizationId: user.organizationId,
      roles: user.roles,
      permissions: user.permissions,
      tokenVersion: 1,
    };
    user.token = JWTUtils.generateTokenPair(tokenPayload).accessToken;

    await use(user);
  },

  /**
   * Care Coordinator User - Scheduling, assignment, EVV management
   */
  coordinatorUser: async ({}, use) => {
    const user: AuthenticatedUser = {
      userId: E2E_UUIDS.COORDINATOR_USER,
      email: 'coordinator@e2e-test.com',
      organizationId: E2E_UUIDS.ORG_E2E,
      branchId: E2E_UUIDS.BRANCH_E2E,
      roles: ['COORDINATOR'],
      permissions: [
        'clients:read',
        'clients:write',
        'caregivers:read',
        'caregivers:write',
        'visits:read',
        'visits:write',
        'evv:read',
        'evv:write',
        'care-plans:read',
        'care-plans:write',
        'tasks:read',
        'tasks:write',
        'scheduling:read',
        'scheduling:write',
        'billing:read',
      ],
    };

    const tokenPayload: TokenPayload = {
      userId: user.userId,
      email: user.email,
      organizationId: user.organizationId,
      roles: user.roles,
      permissions: user.permissions,
      tokenVersion: 1,
    };
    user.token = JWTUtils.generateTokenPair(tokenPayload).accessToken;

    await use(user);
  },

  /**
   * Caregiver User - Limited to own visits and tasks
   */
  caregiverUser: async ({}, use) => {
    const user: AuthenticatedUser = {
      userId: E2E_UUIDS.CAREGIVER_USER,
      email: 'caregiver@e2e-test.com',
      organizationId: E2E_UUIDS.ORG_E2E,
      branchId: E2E_UUIDS.BRANCH_E2E,
      roles: ['CAREGIVER'],
      permissions: [
        'visits:read:own', // Only own visits
        'evv:write:own', // Clock in/out for own visits
        'tasks:read:own',
        'tasks:write:own',
        'care-plans:read:assigned', // Only assigned care plans
      ],
    };

    const tokenPayload: TokenPayload = {
      userId: user.userId,
      email: user.email,
      organizationId: user.organizationId,
      roles: user.roles,
      permissions: user.permissions,
      tokenVersion: 1,
    };
    user.token = JWTUtils.generateTokenPair(tokenPayload).accessToken;

    await use(user);
  },

  /**
   * Authenticated Page - Page with auth headers/cookies set
   * Defaults to coordinator role, but can be overridden
   */
  authenticatedPage: async ({ page, coordinatorUser }, use) => {
    // Option 1: Set authentication via local storage (for JWT-based auth)
    await page.goto('/');
    await page.evaluate(({ token, userId, orgId }) => {
      localStorage.setItem('authToken', token as string);
      localStorage.setItem('userId', userId);
      localStorage.setItem('organizationId', orgId);
    }, { token: coordinatorUser.token, userId: coordinatorUser.userId, orgId: coordinatorUser.organizationId });

    // Option 2: Set authentication via cookies (if using cookie-based auth)
    await page.context().addCookies([
      {
        name: 'authToken',
        value: coordinatorUser.token!,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    // Option 3: Set authentication via HTTP headers (for API requests)
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${coordinatorUser.token}`,
      'X-User-Id': coordinatorUser.userId,
      'X-Organization-Id': coordinatorUser.organizationId,
      'X-Branch-Id': coordinatorUser.branchId,
    });

    await use(page);
  },
});

/**
 * Helper: Create custom authenticated page for specific user
 */
export async function createAuthenticatedPage(
  page: Page,
  user: AuthenticatedUser
): Promise<Page> {
  await page.goto('/');

  // Set local storage
  await page.evaluate(
    ({ token, userId, organizationId }) => {
      localStorage.setItem('authToken', token as string);
      localStorage.setItem('userId', userId);
      localStorage.setItem('organizationId', organizationId);
    },
    { token: user.token, userId: user.userId, organizationId: user.organizationId }
  );

  // Set cookies
  await page.context().addCookies([
    {
      name: 'authToken',
      value: user.token!,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Set headers
  await page.setExtraHTTPHeaders({
    Authorization: `Bearer ${user.token}`,
    'X-User-Id': user.userId,
    'X-Organization-Id': user.organizationId,
    'X-Branch-Id': user.branchId,
  });

  return page;
}

/**
 * Re-export expect for convenience
 */
export { expect } from '@playwright/test';
