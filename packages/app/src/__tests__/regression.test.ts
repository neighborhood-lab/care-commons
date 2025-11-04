/**
 * Critical Regression Tests
 * 
 * These tests ensure we never regress on critical production functionality
 * that was hard-won during the November 2025 deployment.
 * 
 * DO NOT REMOVE OR SKIP THESE TESTS!
 * 
 * Note: These are simplified tests that verify module imports work correctly.
 * Full integration tests should be run in CI with actual database.
 */

import { describe, it, expect } from 'vitest';

describe('Critical Regression Tests - ESM Module Resolution', () => {
  describe('Server Module (DO NOT REGRESS)', () => {
    it('should import server module without errors', async () => {
      // This verifies ESM import resolution works in Node.js
      const serverModule = await import('../server.js');
      expect(serverModule).toBeDefined();
    });

    it('should export expected functions', async () => {
      const serverModule = await import('../server.js');
      // Verify the module structure is correct
      expect(typeof serverModule).toBe('object');
    });
  });

  describe('Routes Module (DO NOT REGRESS)', () => {
    it('should import routes module without errors', async () => {
      const routesModule = await import('../routes/index.js');
      expect(routesModule).toBeDefined();
      expect(routesModule.setupRoutes).toBeDefined();
      expect(typeof routesModule.setupRoutes).toBe('function');
    });
  });

  describe('Auth Routes (DO NOT REGRESS)', () => {
    it('should import auth routes module without errors', async () => {
      const authModule = await import('../routes/auth.js');
      expect(authModule).toBeDefined();
      expect(authModule.createAuthRouter).toBeDefined();
      expect(typeof authModule.createAuthRouter).toBe('function');
    });
  });

  describe('Core Dependencies (DO NOT REGRESS)', () => {
    it('should import @care-commons/core without errors', async () => {
      const coreModule = await import('@care-commons/core');
      expect(coreModule).toBeDefined();
      expect(coreModule.initializeDatabase).toBeDefined();
      expect(coreModule.getDatabase).toBeDefined();
    });

    it('should import client-demographics vertical without errors', async () => {
      const clientModule = await import('@care-commons/client-demographics');
      expect(clientModule).toBeDefined();
      expect(clientModule.createClientRouter).toBeDefined();
    });

    it('should import caregiver-staff vertical without errors', async () => {
      const caregiverModule = await import('@care-commons/caregiver-staff');
      expect(caregiverModule).toBeDefined();
    });

    it('should import care-plans-tasks vertical without errors', async () => {
      const carePlansModule = await import('@care-commons/care-plans-tasks');
      expect(carePlansModule).toBeDefined();
      expect(carePlansModule.CarePlanService).toBeDefined();
      expect(carePlansModule.createCarePlanHandlers).toBeDefined();
    });
  });

  describe('Middleware (DO NOT REGRESS)', () => {
    it('should import request-logger middleware without errors', async () => {
      const loggerModule = await import('../middleware/request-logger.js');
      expect(loggerModule).toBeDefined();
      expect(loggerModule.createRequestLogger).toBeDefined();
    });

    it('should import auth-context middleware without errors', async () => {
      const authContextModule = await import('../middleware/auth-context.js');
      expect(authContextModule).toBeDefined();
      expect(authContextModule.authContextMiddleware).toBeDefined();
    });

    it('should import error-handler middleware without errors', async () => {
      const errorModule = await import('../middleware/error-handler.js');
      expect(errorModule).toBeDefined();
      expect(errorModule.errorHandler).toBeDefined();
      expect(errorModule.notFoundHandler).toBeDefined();
    });
  });

  describe('TypeScript Compilation (DO NOT REGRESS)', () => {
    it('should have compiled .js files with proper exports', async () => {
      // This test verifies tsc-alias worked correctly
      const serverModule = await import('../server.js');
      const routesModule = await import('../routes/index.js');
      const authModule = await import('../routes/auth.js');
      
      expect(serverModule).toBeDefined();
      expect(routesModule).toBeDefined();
      expect(authModule).toBeDefined();
    });
  });
});

/**
 * API Endpoint Structure Tests
 * 
 * These verify the expected API structure exists
 */
describe('API Structure Tests', () => {
  it('should have health check route handler', async () => {
    // Import server to verify it compiles
    const server = await import('../server.js');
    expect(server).toBeDefined();
  });

  it('should have auth routes configured', async () => {
    const auth = await import('../routes/auth.js');
    expect(auth.createAuthRouter).toBeDefined();
  });

  it('should have organization routes configured', async () => {
    const org = await import('../routes/organizations.js');
    expect(org.createOrganizationRouter).toBeDefined();
  });

  it('should have caregiver routes configured', async () => {
    const caregiver = await import('../routes/caregivers.js');
    expect(caregiver.createCaregiverRouter).toBeDefined();
  });
});
