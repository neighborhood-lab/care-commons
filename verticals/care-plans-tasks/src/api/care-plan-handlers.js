"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCarePlanHandlers = createCarePlanHandlers;
function getUserContext(req) {
    const branchId = req.header('X-Branch-Id');
    return {
        userId: req.header('X-User-Id') || 'system',
        organizationId: req.header('X-Organization-Id') || '',
        branchIds: branchId ? [branchId] : [],
        roles: (req.header('X-User-Roles') || 'CAREGIVER').split(','),
        permissions: (req.header('X-User-Permissions') || '').split(',').filter(Boolean),
    };
}
function createCarePlanHandlers(service) {
    return {
        async createCarePlan(req, res) {
            try {
                const context = getUserContext(req);
                const carePlan = await service.createCarePlan(req.body, context);
                res.status(201).json(carePlan);
            }
            catch (error) {
                if (error.name === 'ValidationError') {
                    res.status(400).json({ error: error.message, details: error.details });
                }
                else if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error creating care plan:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async getCarePlanById(req, res) {
            try {
                const context = getUserContext(req);
                const carePlan = await service.getCarePlanById(req.params.id, context);
                res.json(carePlan);
            }
            catch (error) {
                if (error.name === 'NotFoundError') {
                    res.status(404).json({ error: error.message });
                }
                else if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error fetching care plan:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async updateCarePlan(req, res) {
            try {
                const context = getUserContext(req);
                const carePlan = await service.updateCarePlan(req.params.id, req.body, context);
                res.json(carePlan);
            }
            catch (error) {
                if (error.name === 'NotFoundError') {
                    res.status(404).json({ error: error.message });
                }
                else if (error.name === 'ValidationError') {
                    res.status(400).json({ error: error.message, details: error.details });
                }
                else if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error updating care plan:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async activateCarePlan(req, res) {
            try {
                const context = getUserContext(req);
                const carePlan = await service.activateCarePlan(req.params.id, context);
                res.json(carePlan);
            }
            catch (error) {
                if (error.name === 'NotFoundError') {
                    res.status(404).json({ error: error.message });
                }
                else if (error.name === 'ValidationError') {
                    res.status(400).json({ error: error.message, details: error.details });
                }
                else if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error activating care plan:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async searchCarePlans(req, res) {
            try {
                const context = getUserContext(req);
                const filters = {
                    query: req.query.query,
                    clientId: req.query.clientId,
                    status: req.query.status ? req.query.status.split(',') : undefined,
                    planType: req.query.planType ? req.query.planType.split(',') : undefined,
                    coordinatorId: req.query.coordinatorId,
                    expiringWithinDays: req.query.expiringWithinDays ? parseInt(req.query.expiringWithinDays) : undefined,
                    needsReview: req.query.needsReview === 'true',
                };
                const pagination = {
                    page: parseInt(req.query.page) || 1,
                    limit: parseInt(req.query.limit) || 20,
                    sortBy: req.query.sortBy,
                    sortOrder: req.query.sortOrder || 'desc',
                };
                const result = await service.searchCarePlans(filters, pagination, context);
                res.json(result);
            }
            catch (error) {
                if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error searching care plans:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async getCarePlansByClientId(req, res) {
            try {
                const context = getUserContext(req);
                const plans = await service.getCarePlansByClientId(req.params.clientId, context);
                res.json(plans);
            }
            catch (error) {
                if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error fetching client care plans:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async getActiveCarePlanForClient(req, res) {
            try {
                const context = getUserContext(req);
                const plan = await service.getActiveCarePlanForClient(req.params.clientId, context);
                if (!plan) {
                    res.status(404).json({ error: 'No active care plan found' });
                }
                else {
                    res.json(plan);
                }
            }
            catch (error) {
                if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error fetching active care plan:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async getExpiringCarePlans(req, res) {
            try {
                const context = getUserContext(req);
                const days = parseInt(req.query.days) || 30;
                const plans = await service.getExpiringCarePlans(days, context);
                res.json(plans);
            }
            catch (error) {
                if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error fetching expiring care plans:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async deleteCarePlan(req, res) {
            try {
                const context = getUserContext(req);
                await service.deleteCarePlan(req.params.id, context);
                res.status(204).send();
            }
            catch (error) {
                if (error.name === 'NotFoundError') {
                    res.status(404).json({ error: error.message });
                }
                else if (error.name === 'ValidationError') {
                    res.status(400).json({ error: error.message });
                }
                else if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error deleting care plan:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async createTasksForVisit(req, res) {
            try {
                const context = getUserContext(req);
                const { visitId, visitDate } = req.body;
                const tasks = await service.createTasksForVisit(req.params.id, visitId, new Date(visitDate), context);
                res.status(201).json(tasks);
            }
            catch (error) {
                if (error.name === 'NotFoundError') {
                    res.status(404).json({ error: error.message });
                }
                else if (error.name === 'ValidationError') {
                    res.status(400).json({ error: error.message });
                }
                else if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error creating tasks:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async createTaskInstance(req, res) {
            try {
                const context = getUserContext(req);
                const task = await service.createTaskInstance(req.body, context);
                res.status(201).json(task);
            }
            catch (error) {
                if (error.name === 'ValidationError') {
                    res.status(400).json({ error: error.message, details: error.details });
                }
                else if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error creating task:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async getTaskInstanceById(req, res) {
            try {
                const context = getUserContext(req);
                const task = await service.getTaskInstanceById(req.params.id, context);
                res.json(task);
            }
            catch (error) {
                if (error.name === 'NotFoundError') {
                    res.status(404).json({ error: error.message });
                }
                else if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error fetching task:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async completeTask(req, res) {
            try {
                const context = getUserContext(req);
                const task = await service.completeTask(req.params.id, req.body, context);
                res.json(task);
            }
            catch (error) {
                if (error.name === 'NotFoundError') {
                    res.status(404).json({ error: error.message });
                }
                else if (error.name === 'ValidationError') {
                    res.status(400).json({ error: error.message, details: error.details });
                }
                else if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error completing task:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async skipTask(req, res) {
            try {
                const context = getUserContext(req);
                const { reason, note } = req.body;
                const task = await service.skipTask(req.params.id, reason, note, context);
                res.json(task);
            }
            catch (error) {
                if (error.name === 'NotFoundError') {
                    res.status(404).json({ error: error.message });
                }
                else if (error.name === 'ValidationError') {
                    res.status(400).json({ error: error.message });
                }
                else if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error skipping task:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async reportTaskIssue(req, res) {
            try {
                const context = getUserContext(req);
                const { issueDescription } = req.body;
                const task = await service.reportTaskIssue(req.params.id, issueDescription, context);
                res.json(task);
            }
            catch (error) {
                if (error.name === 'NotFoundError') {
                    res.status(404).json({ error: error.message });
                }
                else if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error reporting task issue:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async searchTaskInstances(req, res) {
            try {
                const context = getUserContext(req);
                const filters = {
                    carePlanId: req.query.carePlanId,
                    clientId: req.query.clientId,
                    assignedCaregiverId: req.query.assignedCaregiverId,
                    visitId: req.query.visitId,
                    status: req.query.status ? req.query.status.split(',') : undefined,
                    category: req.query.category ? req.query.category.split(',') : undefined,
                    scheduledDateFrom: req.query.scheduledDateFrom ? new Date(req.query.scheduledDateFrom) : undefined,
                    scheduledDateTo: req.query.scheduledDateTo ? new Date(req.query.scheduledDateTo) : undefined,
                    overdue: req.query.overdue === 'true',
                    requiresSignature: req.query.requiresSignature === 'true' ? true : undefined,
                };
                const pagination = {
                    page: parseInt(req.query.page) || 1,
                    limit: parseInt(req.query.limit) || 20,
                    sortBy: req.query.sortBy,
                    sortOrder: req.query.sortOrder || 'asc',
                };
                const result = await service.searchTaskInstances(filters, pagination, context);
                res.json(result);
            }
            catch (error) {
                if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error searching tasks:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async getTasksByVisitId(req, res) {
            try {
                const context = getUserContext(req);
                const tasks = await service.getTasksByVisitId(req.params.visitId, context);
                res.json(tasks);
            }
            catch (error) {
                if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error fetching visit tasks:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async createProgressNote(req, res) {
            try {
                const context = getUserContext(req);
                const note = await service.createProgressNote(req.body, context);
                res.status(201).json(note);
            }
            catch (error) {
                if (error.name === 'ValidationError') {
                    res.status(400).json({ error: error.message, details: error.details });
                }
                else if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error creating progress note:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async getProgressNotesByCarePlanId(req, res) {
            try {
                const context = getUserContext(req);
                const notes = await service.getProgressNotesByCarePlanId(req.params.id, context);
                res.json(notes);
            }
            catch (error) {
                if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error fetching progress notes:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async getCarePlanAnalytics(req, res) {
            try {
                const context = getUserContext(req);
                const analytics = await service.getCarePlanAnalytics(context.organizationId, context);
                res.json(analytics);
            }
            catch (error) {
                if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error fetching analytics:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
        async getTaskCompletionMetrics(req, res) {
            try {
                const context = getUserContext(req);
                const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date();
                const metrics = await service.getTaskCompletionMetrics({
                    dateFrom,
                    dateTo,
                    organizationId: context.organizationId,
                }, context);
                res.json(metrics);
            }
            catch (error) {
                if (error.name === 'PermissionError') {
                    res.status(403).json({ error: error.message });
                }
                else {
                    console.error('Error fetching task metrics:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        },
    };
}
exports.default = createCarePlanHandlers;
//# sourceMappingURL=care-plan-handlers.js.map