"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const express_1 = require("express");
const core_1 = require("@care-commons/core");
const client_demographics_1 = require("@care-commons/client-demographics");
const care_plans_tasks_1 = require("@care-commons/care-plans-tasks");
const care_plans_tasks_2 = require("@care-commons/care-plans-tasks");
const auth_1 = __importDefault(require("./auth"));
function setupRoutes(app, db) {
    console.log('Setting up API routes...');
    app.use('/api/auth', auth_1.default);
    console.log('  ✓ Authentication routes registered');
    const clientRepository = new client_demographics_1.ClientRepository(db);
    const clientService = new client_demographics_1.ClientService(clientRepository);
    const clientRouter = (0, client_demographics_1.createClientRouter)(clientService);
    app.use('/api', clientRouter);
    console.log('  ✓ Client Demographics routes registered');
    const carePlanRepository = new care_plans_tasks_1.CarePlanRepository(db);
    const permissionService = new core_1.PermissionService();
    const carePlanService = new care_plans_tasks_1.CarePlanService(carePlanRepository, permissionService);
    const carePlanHandlers = (0, care_plans_tasks_2.createCarePlanHandlers)(carePlanService);
    const carePlanRouter = createCarePlanRouter(carePlanHandlers);
    app.use('/api', carePlanRouter);
    console.log('  ✓ Care Plans & Tasks routes registered');
    console.log('API routes setup complete\n');
}
function createCarePlanRouter(handlers) {
    const router = (0, express_1.Router)();
    router.post('/care-plans', handlers.createCarePlan);
    router.get('/care-plans', handlers.searchCarePlans);
    router.get('/care-plans/:id', handlers.getCarePlanById);
    router.put('/care-plans/:id', handlers.updateCarePlan);
    router.delete('/care-plans/:id', handlers.deleteCarePlan);
    router.post('/care-plans/:id/activate', handlers.activateCarePlan);
    router.get('/care-plans/expiring', handlers.getExpiringCarePlans);
    router.get('/clients/:clientId/care-plans', handlers.getCarePlansByClientId);
    router.get('/clients/:clientId/care-plans/active', handlers.getActiveCarePlanForClient);
    router.post('/care-plans/:id/tasks/generate', handlers.createTasksForVisit);
    router.post('/tasks', handlers.createTaskInstance);
    router.get('/tasks', handlers.searchTaskInstances);
    router.get('/tasks/:id', handlers.getTaskInstanceById);
    router.post('/tasks/:id/complete', handlers.completeTask);
    router.post('/tasks/:id/skip', handlers.skipTask);
    router.post('/tasks/:id/report-issue', handlers.reportTaskIssue);
    router.get('/visits/:visitId/tasks', handlers.getTasksByVisitId);
    router.post('/progress-notes', handlers.createProgressNote);
    router.get('/care-plans/:id/progress-notes', handlers.getProgressNotesByCarePlanId);
    router.get('/analytics/care-plans', handlers.getCarePlanAnalytics);
    router.get('/analytics/tasks/completion', handlers.getTaskCompletionMetrics);
    return router;
}
//# sourceMappingURL=index.js.map