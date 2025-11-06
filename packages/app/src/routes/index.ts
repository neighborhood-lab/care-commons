/**
 * API Routes Setup
 * 
 * Integrates all vertical route handlers with the Express app
 */

import { Express, Router } from 'express';
import { Database, PermissionService, UserRepository } from '@care-commons/core';
import { createClientRouter, ClientService, ClientRepository } from '@care-commons/client-demographics';
import { CarePlanService, CarePlanRepository } from '@care-commons/care-plans-tasks';
import { createCarePlanHandlers } from '@care-commons/care-plans-tasks';
import { createAuthRouter } from './auth.js';
import { createOrganizationRouter } from './organizations.js';
import { createCaregiverRouter } from './caregivers.js';
import { createDemoRouter } from './demo.js';
import { authLimiter } from '../middleware/rate-limit.js';
/**
 * NOTE: Analytics routes temporarily disabled - requires architectural refactor
 * The analytics-reporting vertical uses Knex query builder, but the codebase uses raw SQL via Database class
 * See verticals/analytics-reporting/ARCHITECTURAL_ISSUES.md for implementation details
 * When re-enabling: import { createAnalyticsRouter } from './analytics.js';
 */
import { createSyncRouter } from '../api/sync/sync-routes.js';

/**
 * Setup all API routes for the application
 */
export function setupRoutes(app: Express, db: Database): void {
  console.log('Setting up API routes...');

  // Authentication routes with rate limiting
  const authRouter = createAuthRouter(db);
  app.use('/api/auth', authLimiter, authRouter);
  console.log('  ✓ Authentication routes registered (with rate limiting)');

  // Organization & Invitation routes
  const organizationRouter = createOrganizationRouter(db);
  app.use('/api', organizationRouter);
  console.log('  ✓ Organization & Invitation routes registered');

  // Client Demographics routes
  const clientRepository = new ClientRepository(db);
  const clientService = new ClientService(clientRepository);
  const clientRouter = createClientRouter(clientService);
  app.use('/api', clientRouter);
  console.log('  ✓ Client Demographics routes registered');

  // Care Plans & Tasks routes
  const carePlanRepository = new CarePlanRepository(db);
  const permissionService = new PermissionService();
  const userRepository = new UserRepository(db);
  const carePlanService = new CarePlanService(carePlanRepository, permissionService, userRepository);
  const carePlanHandlers = createCarePlanHandlers(carePlanService);
  const carePlanRouter = createCarePlanRouter(carePlanHandlers);
  app.use('/api', carePlanRouter);
  console.log('  ✓ Care Plans & Tasks routes registered');

  // Caregiver & Staff Management routes
  const caregiverRouter = createCaregiverRouter(db);
  app.use('/api/caregivers', caregiverRouter);
  console.log('  ✓ Caregiver & Staff Management routes registered');

  // Medication Management routes - TEMPORARILY DISABLED
  // Requires PostgreSQL repository implementation (currently uses SQLite-style API)
  // const medicationRepository = new MedicationRepository(db);
  // const medicationService = new MedicationService(medicationRepository);
  // const medicationRouter = createMedicationRouter(medicationService);
  // app.use('/api', medicationRouter);
  // console.log('  ✓ Medication Management routes registered');

  // Demo routes (interactive demo system)
  const demoRouter = createDemoRouter(db);
  app.use('/api/demo', demoRouter);
  console.log('  ✓ Demo routes registered');

  // Analytics & Reporting routes - TEMPORARILY DISABLED
  // Requires architectural refactor: analytics-reporting uses Knex, but codebase uses raw SQL
  // const analyticsRouter = createAnalyticsRouter(db);
  // app.use('/api/analytics', analyticsRouter);
  // console.log('  ✓ Analytics & Reporting routes registered');

  // Offline Sync routes
  const syncRouter = createSyncRouter(db);
  app.use('/api/sync', syncRouter);
  console.log('  ✓ Offline Sync routes registered');

  // Additional verticals can be added here as they implement route handlers:
  // - Scheduling & Visits
  // - EVV & Time Tracking
  // - Shift Matching
  // - Billing & Invoicing
  // - Payroll Processing

  console.log('API routes setup complete\n');
}

/**
 * Helper to create router from care plan handlers object
 */
function createCarePlanRouter(handlers: ReturnType<typeof createCarePlanHandlers>): Router {
  const router = Router();

  // Care Plan endpoints
  router.post('/care-plans', handlers.createCarePlan);
  router.get('/care-plans', handlers.searchCarePlans);
  router.get('/care-plans/:id', handlers.getCarePlanById);
  router.put('/care-plans/:id', handlers.updateCarePlan);
  router.delete('/care-plans/:id', handlers.deleteCarePlan);
  router.post('/care-plans/:id/activate', handlers.activateCarePlan);
  router.get('/care-plans/expiring', handlers.getExpiringCarePlans);

  // Client-specific care plan endpoints
  router.get('/clients/:clientId/care-plans', handlers.getCarePlansByClientId);
  router.get('/clients/:clientId/care-plans/active', handlers.getActiveCarePlanForClient);

  // Task generation
  router.post('/care-plans/:id/tasks/generate', handlers.createTasksForVisit);

  // Task endpoints
  router.post('/tasks', handlers.createTaskInstance);
  router.get('/tasks', handlers.searchTaskInstances);
  router.get('/tasks/:id', handlers.getTaskInstanceById);
  router.post('/tasks/:id/complete', handlers.completeTask);
  router.post('/tasks/:id/skip', handlers.skipTask);
  router.post('/tasks/:id/report-issue', handlers.reportTaskIssue);

  // Visit tasks
  router.get('/visits/:visitId/tasks', handlers.getTasksByVisitId);

  // Progress notes
  router.post('/progress-notes', handlers.createProgressNote);
  router.get('/care-plans/:id/progress-notes', handlers.getProgressNotesByCarePlanId);

  // Analytics
  router.get('/analytics/care-plans', handlers.getCarePlanAnalytics);
  router.get('/analytics/tasks/completion', handlers.getTaskCompletionMetrics);

  return router;
}
