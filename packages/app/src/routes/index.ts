/**
 * API Routes Setup
 * 
 * Integrates all vertical route handlers with the Express app
 */

import { Express, Router } from 'express';
import { Database, PermissionService, UserRepository, AuthMiddleware } from '@care-commons/core';
import { createClientRouter, ClientService, ClientRepository } from '@care-commons/client-demographics';
import { CarePlanService, CarePlanRepository } from '@care-commons/care-plans-tasks';
import { createCarePlanHandlers } from '@care-commons/care-plans-tasks';
import { createHealthRouter } from './health';
import { createMetricsRouter } from './metrics';
import { createAuthRouter } from './auth';
import { createOrganizationRouter } from './organizations';
import { createCaregiverRouter } from './caregivers';
import { createDemoRouter } from './demo';
import { createAnalyticsRouter } from './analytics';
import { authLimiter } from '../middleware/rate-limit';
import { createSyncRouter } from '../api/sync/sync-routes';
import docsRoutes from './docs.routes';
import { createPayrollRouter } from './payroll';
import adminRoutes from './admin';
import { createWhiteLabelRouter } from './white-label';
import { AuditService, AuditRepository, AuditFindingRepository, CorrectiveActionRepository, createAuditRoutes } from '@care-commons/quality-assurance-audits';
import { createSearchRouter } from './search';

/**
 * Setup all API routes for the application
 */
export function setupRoutes(app: Express, db: Database): void {
  console.log('Setting up API routes...');

  // Health check route (no authentication required)
  const healthRouter = createHealthRouter(db);
  app.use('/health', healthRouter);
  console.log('  ✓ Health check route registered');

  // Metrics route (no authentication required)
  const metricsRouter = createMetricsRouter();
  app.use('/metrics', metricsRouter);
  console.log('  ✓ Metrics route registered');

  // API Documentation routes
  app.use('/', docsRoutes);
  console.log('  ✓ API Documentation routes registered');

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
  const carePlanRouter = createCarePlanRouter(carePlanHandlers, db);
  app.use('/api', carePlanRouter);
  console.log('  ✓ Care Plans & Tasks routes registered');

  // Caregiver & Staff Management routes
  const caregiverRouter = createCaregiverRouter(db);
  app.use('/api/caregivers', caregiverRouter);
  console.log('  ✓ Caregiver & Staff Management routes registered');

  // Demo routes (interactive demo system)
  const demoRouter = createDemoRouter(db);
  app.use('/api/demo', demoRouter);
  console.log('  ✓ Demo routes registered');

  // Analytics & Reporting routes
  const analyticsRouter = createAnalyticsRouter(db);
  app.use('/api/analytics', analyticsRouter);
  console.log('  ✓ Analytics & Reporting routes registered');

  // Offline Sync routes
  const syncRouter = createSyncRouter(db);
  app.use('/api/sync', syncRouter);
  console.log('  ✓ Offline Sync routes registered');

  // Payroll Processing routes
  const payrollRouter = createPayrollRouter(db);
  app.use('/api', payrollRouter);
  console.log('  ✓ Payroll Processing routes registered');

  // Admin routes (cache monitoring, etc.)
  app.use('/api/admin', adminRoutes);
  console.log('  ✓ Admin routes registered');

  // White-label routes (branding, feature flags)
  const whiteLabelRouter = createWhiteLabelRouter(db);
  app.use('/api/white-label', whiteLabelRouter);
  console.log('  ✓ White-label routes registered');

  // Quality Assurance & Audits routes
  const auditRepository = new AuditRepository(db);
  const auditFindingRepository = new AuditFindingRepository(db);
  const correctiveActionRepository = new CorrectiveActionRepository(db);
  const auditService = new AuditService(
    auditRepository,
    auditFindingRepository,
    correctiveActionRepository,
    permissionService
  );
  const auditRouter = Router();
  createAuditRoutes(auditService, auditRouter);
  app.use('/api', auditRouter);
  console.log('  ✓ Quality Assurance & Audits routes registered');

  // Global Search routes
  const searchRouter = createSearchRouter(db);
  app.use('/api/search', searchRouter);
  console.log('  ✓ Global Search routes registered');

  // Additional verticals can be added here as they implement route handlers:
  // - Scheduling & Visits
  // - EVV & Time Tracking
  // - Shift Matching
  // - Billing & Invoicing

  console.log('API routes setup complete\n');
}

/**
 * Helper to create router from care plan handlers object
 */
function createCarePlanRouter(handlers: ReturnType<typeof createCarePlanHandlers>, db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  // All care plan routes require authentication
  router.use(authMiddleware.requireAuth);

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
