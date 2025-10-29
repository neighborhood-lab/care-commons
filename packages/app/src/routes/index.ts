/**
 * API Routes Setup
 * 
 * Integrates all vertical route handlers with the Express app
 */

import { Express, Router } from 'express';
import { Database, PermissionService } from '@care-commons/core';
import { createClientRouter, ClientService, ClientRepository } from '@care-commons/client-demographics';
import { CarePlanService, CarePlanRepository } from '@care-commons/care-plans-tasks';
import { createCarePlanHandlers } from '@care-commons/care-plans-tasks';

/**
 * Setup all API routes for the application
 */
export function setupRoutes(app: Express, db: Database): void {
  console.log('Setting up API routes...');

  // Client Demographics routes
  const clientRepository = new ClientRepository(db);
  const clientService = new ClientService(clientRepository);
  const clientRouter = createClientRouter(clientService);
  app.use('/api', clientRouter);
  console.log('  ✓ Client Demographics routes registered');

  // Care Plans & Tasks routes
  const carePlanRepository = new CarePlanRepository(db);
  const permissionService = new PermissionService();
  const carePlanService = new CarePlanService(carePlanRepository, permissionService);
  const carePlanHandlers = createCarePlanHandlers(carePlanService);
  const carePlanRouter = createCarePlanRouter(carePlanHandlers);
  app.use('/api', carePlanRouter);
  console.log('  ✓ Care Plans & Tasks routes registered');

  // Additional verticals can be added here as they implement route handlers:
  // - Scheduling & Visits
  // - EVV & Time Tracking
  // - Shift Matching
  // - Billing & Invoicing
  // - Payroll Processing
  // - Caregiver & Staff Management

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
