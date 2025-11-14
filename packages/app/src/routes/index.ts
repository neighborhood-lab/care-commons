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
import { 
  authLimiter, 
  generalApiLimiter, 
  syncLimiter, 
  reportLimiter,
  evvLimiter 
} from '../middleware/rate-limit';
import { createSyncRouter } from '../api/sync/sync-routes';
import docsRoutes from './docs.routes';
import { createPayrollRouter } from './payroll';
import adminRoutes from './admin';
import { createWhiteLabelRouter } from './white-label';
import { AuditService, AuditRepository, AuditFindingRepository, CorrectiveActionRepository, createAuditRoutes } from '@care-commons/quality-assurance-audits';
import { createSearchRouter } from './search.js';
import { MedicationService, createMedicationHandlers } from '@care-commons/medication-management';
import { IncidentService, createIncidentHandlers } from '@care-commons/incident-reporting';
import { createVisitRouter } from './visits.js';
import pushNotificationRouter from './push-notifications.js';

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

/**
 * Helper to create router from medication handlers object
 */
function createMedicationRouter(handlers: ReturnType<typeof createMedicationHandlers>, db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  // All medication routes require authentication
  router.use(authMiddleware.requireAuth);

  // Client medication endpoints
  router.get('/clients/:clientId/medications', handlers.getClientMedications);
  router.get('/clients/:clientId/administrations', handlers.getClientAdministrations);

  // Medication CRUD endpoints
  router.post('/medications', handlers.createMedication);
  router.get('/medications/:medicationId', handlers.getMedication);
  router.patch('/medications/:medicationId', handlers.updateMedication);
  router.post('/medications/:medicationId/discontinue', handlers.discontinueMedication);

  // Medication administration endpoints
  router.post('/medications/:medicationId/administer', handlers.recordAdministration);
  router.get('/medications/:medicationId/administrations', handlers.getMedicationAdministrations);

  return router;
}

/**
 * Helper to create router from incident handlers object
 */
function createIncidentRouter(handlers: ReturnType<typeof createIncidentHandlers>, db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  // All incident routes require authentication
  router.use(authMiddleware.requireAuth);

  // Incident CRUD endpoints
  router.post('/incidents', handlers.createIncident);
  router.get('/incidents', handlers.searchIncidents);
  router.get('/incidents/:incidentId', handlers.getIncident);
  router.patch('/incidents/:incidentId', handlers.updateIncident);

  return router;
}

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
  app.use('/api', generalApiLimiter, organizationRouter);
  console.log('  ✓ Organization & Invitation routes registered (with rate limiting)');

  // Client Demographics routes
  const clientRepository = new ClientRepository(db);
  const clientService = new ClientService(clientRepository);
  const clientRouter = createClientRouter(clientService);
  app.use('/api', generalApiLimiter, clientRouter);
  console.log('  ✓ Client Demographics routes registered (with rate limiting)');

  // Care Plans & Tasks routes
  const carePlanRepository = new CarePlanRepository(db);
  const permissionService = new PermissionService();
  const userRepository = new UserRepository(db);
  const carePlanService = new CarePlanService(carePlanRepository, permissionService, userRepository);
  const carePlanHandlers = createCarePlanHandlers(carePlanService);
  const carePlanRouter = createCarePlanRouter(carePlanHandlers, db);
  app.use('/api', generalApiLimiter, carePlanRouter);
  console.log('  ✓ Care Plans & Tasks routes registered (with rate limiting)');

  // Caregiver & Staff Management routes
  const caregiverRouter = createCaregiverRouter(db);
  app.use('/api/caregivers', generalApiLimiter, caregiverRouter);
  console.log('  ✓ Caregiver & Staff Management routes registered (with rate limiting)');

  // Visit & Scheduling routes
  const visitRouter = createVisitRouter(db);
  app.use('/api/visits', generalApiLimiter, visitRouter);
  console.log('  ✓ Visit & Scheduling routes registered (with rate limiting)');

  // Demo routes (interactive demo system) - includes EVV clock-in/out
  const demoRouter = createDemoRouter(db);
  app.use('/api/demo', evvLimiter, demoRouter);
  console.log('  ✓ Demo routes registered (with EVV rate limiting)');

  // Analytics & Reporting routes
  const analyticsRouter = createAnalyticsRouter(db);
  app.use('/api/analytics', reportLimiter, analyticsRouter);
  console.log('  ✓ Analytics & Reporting routes registered (with rate limiting)');

  // Offline Sync routes
  const syncRouter = createSyncRouter(db);
  app.use('/api/sync', syncLimiter, syncRouter);
  console.log('  ✓ Offline Sync routes registered (with rate limiting)');

  // Payroll Processing routes
  const payrollRouter = createPayrollRouter(db);
  app.use('/api', generalApiLimiter, payrollRouter);
  console.log('  ✓ Payroll Processing routes registered (with rate limiting)');

  // Admin routes (cache monitoring, etc.)
  app.use('/api/admin', generalApiLimiter, adminRoutes);
  console.log('  ✓ Admin routes registered (with rate limiting)');

  // White-label routes (branding, feature flags)
  const whiteLabelRouter = createWhiteLabelRouter(db);
  app.use('/api/white-label', generalApiLimiter, whiteLabelRouter);
  console.log('  ✓ White-label routes registered (with rate limiting)');

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
  createAuditRoutes(auditService, auditRouter, db);
  app.use('/api', generalApiLimiter, auditRouter);
  console.log('  ✓ Quality Assurance & Audits routes registered (with rate limiting)');

  // Global Search routes
  const searchRouter = createSearchRouter(db);
  app.use('/api/search', generalApiLimiter, searchRouter);
  console.log('  ✓ Global Search routes registered (with rate limiting)');

  // Medication Management routes
  const medicationService = new MedicationService(db);
  const medicationHandlers = createMedicationHandlers(medicationService);
  const medicationRouter = createMedicationRouter(medicationHandlers, db);
  app.use('/api', generalApiLimiter, medicationRouter);
  console.log('  ✓ Medication Management routes registered (with rate limiting)');

  // Incident Reporting routes
  const incidentService = new IncidentService(db);
  const incidentHandlers = createIncidentHandlers(incidentService);
  const incidentRouter = createIncidentRouter(incidentHandlers, db);
  app.use('/api', generalApiLimiter, incidentRouter);
  console.log('  ✓ Incident Reporting routes registered (with rate limiting)');

  // Push Notifications routes (for mobile device token registration)
  app.use('/api/push', generalApiLimiter, pushNotificationRouter);
  console.log('  ✓ Push Notifications routes registered (with rate limiting)');

  // Additional verticals can be added here as they implement route handlers:
  // - Family Engagement (in progress)
  // - EVV & Time Tracking
  // - Shift Matching
  // - Billing & Invoicing

  console.log('API routes setup complete\n');
}
