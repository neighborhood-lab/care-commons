"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarePlanService = void 0;
const core_1 = require("@care-commons/core");
const date_fns_1 = require("date-fns");
const care_plan_validator_1 = require("../validation/care-plan-validator");
class CarePlanService {
    constructor(repository, permissions) {
        this.repository = repository;
        this.permissions = permissions;
    }
    async createCarePlan(input, context) {
        if (!this.permissions.hasPermission(context, 'care-plans:create')) {
            throw new core_1.PermissionError('Insufficient permissions to create care plans');
        }
        const validatedInput = care_plan_validator_1.CarePlanValidator.validateCreateCarePlan(input);
        const planNumber = await this.generatePlanNumber(input.organizationId);
        const carePlan = await this.repository.createCarePlan({
            ...validatedInput,
            planNumber,
            createdBy: context.userId,
        });
        return carePlan;
    }
    async getCarePlanById(id, context) {
        if (!this.permissions.hasPermission(context, 'care-plans:read')) {
            throw new core_1.PermissionError('Insufficient permissions to read care plans');
        }
        const carePlan = await this.repository.getCarePlanById(id);
        if (!carePlan) {
            throw new core_1.NotFoundError('Care plan not found', { id });
        }
        if (carePlan.organizationId !== context.organizationId) {
            throw new core_1.PermissionError('Cannot access care plan from another organization');
        }
        return carePlan;
    }
    async updateCarePlan(id, input, context) {
        if (!this.permissions.hasPermission(context, 'care-plans:update')) {
            throw new core_1.PermissionError('Insufficient permissions to update care plans');
        }
        const validatedInput = care_plan_validator_1.CarePlanValidator.validateUpdateCarePlan(input);
        const existing = await this.getCarePlanById(id, context);
        if (['COMPLETED', 'DISCONTINUED'].includes(existing.status) &&
            !this.permissions.hasPermission(context, 'care-plans:update:archived')) {
            throw new core_1.PermissionError('Cannot update completed or discontinued care plans');
        }
        const updated = await this.repository.updateCarePlan(id, validatedInput, context.userId);
        return updated;
    }
    async activateCarePlan(id, context) {
        if (!this.permissions.hasPermission(context, 'care-plans:activate')) {
            throw new core_1.PermissionError('Insufficient permissions to activate care plans');
        }
        const carePlan = await this.getCarePlanById(id, context);
        const validation = care_plan_validator_1.CarePlanValidator.validateCarePlanActivation(carePlan);
        if (!validation.valid) {
            throw new core_1.ValidationError('Care plan cannot be activated', {
                errors: validation.errors,
            });
        }
        const existingActive = await this.repository.getActiveCarePlanForClient(carePlan.clientId);
        if (existingActive && existingActive.id !== id) {
            await this.repository.updateCarePlan(existingActive.id, { status: 'EXPIRED' }, context.userId);
        }
        return await this.repository.updateCarePlan(id, { status: 'ACTIVE' }, context.userId);
    }
    async searchCarePlans(filters, pagination, context) {
        if (!this.permissions.hasPermission(context, 'care-plans:read')) {
            throw new core_1.PermissionError('Insufficient permissions to search care plans');
        }
        const validatedFilters = care_plan_validator_1.CarePlanValidator.validateCarePlanSearchFilters(filters);
        const orgFilters = {
            ...validatedFilters,
            organizationId: context.organizationId,
        };
        return await this.repository.searchCarePlans(orgFilters, pagination);
    }
    async getCarePlansByClientId(clientId, context) {
        if (!this.permissions.hasPermission(context, 'care-plans:read')) {
            throw new core_1.PermissionError('Insufficient permissions to read care plans');
        }
        const plans = await this.repository.getCarePlansByClientId(clientId);
        return plans.filter(plan => plan.organizationId === context.organizationId);
    }
    async getActiveCarePlanForClient(clientId, context) {
        if (!this.permissions.hasPermission(context, 'care-plans:read')) {
            throw new core_1.PermissionError('Insufficient permissions to read care plans');
        }
        const plan = await this.repository.getActiveCarePlanForClient(clientId);
        if (plan && plan.organizationId !== context.organizationId) {
            return null;
        }
        return plan;
    }
    async getExpiringCarePlans(daysUntilExpiration, context) {
        if (!this.permissions.hasPermission(context, 'care-plans:read')) {
            throw new core_1.PermissionError('Insufficient permissions to read care plans');
        }
        return await this.repository.getExpiringCarePlans(context.organizationId, daysUntilExpiration);
    }
    async deleteCarePlan(id, context) {
        if (!this.permissions.hasPermission(context, 'care-plans:delete')) {
            throw new core_1.PermissionError('Insufficient permissions to delete care plans');
        }
        const carePlan = await this.getCarePlanById(id, context);
        if (carePlan.status === 'ACTIVE') {
            throw new core_1.ValidationError('Cannot delete an active care plan. Please discontinue it first.');
        }
        await this.repository.deleteCarePlan(id, context.userId);
    }
    async createTasksForVisit(carePlanId, visitId, visitDate, context) {
        if (!this.permissions.hasPermission(context, 'tasks:create')) {
            throw new core_1.PermissionError('Insufficient permissions to create tasks');
        }
        const carePlan = await this.getCarePlanById(carePlanId, context);
        const tasks = [];
        for (const template of carePlan.taskTemplates || []) {
            if (template.status !== 'ACTIVE') {
                continue;
            }
            if (this.shouldCreateTaskForDate(template, visitDate)) {
                const task = await this.createTaskInstance({
                    carePlanId,
                    templateId: template.id,
                    visitId,
                    clientId: carePlan.clientId,
                    name: template.name,
                    description: template.description,
                    category: template.category,
                    instructions: template.instructions,
                    scheduledDate: visitDate,
                    requiredSignature: template.requiresSignature,
                    requiredNote: template.requiresNote,
                }, context);
                tasks.push(task);
            }
        }
        return tasks;
    }
    async createTaskInstance(input, context) {
        if (!this.permissions.hasPermission(context, 'tasks:create')) {
            throw new core_1.PermissionError('Insufficient permissions to create tasks');
        }
        const validatedInput = care_plan_validator_1.CarePlanValidator.validateCreateTaskInstance(input);
        const task = await this.repository.createTaskInstance({
            ...validatedInput,
            createdBy: context.userId,
            status: 'SCHEDULED',
        });
        return task;
    }
    async getTaskInstanceById(id, context) {
        if (!this.permissions.hasPermission(context, 'tasks:read')) {
            throw new core_1.PermissionError('Insufficient permissions to read tasks');
        }
        const task = await this.repository.getTaskInstanceById(id);
        if (!task) {
            throw new core_1.NotFoundError('Task not found', { id });
        }
        return task;
    }
    async completeTask(id, input, context) {
        if (!this.permissions.hasPermission(context, 'tasks:complete')) {
            throw new core_1.PermissionError('Insufficient permissions to complete tasks');
        }
        const task = await this.getTaskInstanceById(id, context);
        if (task.status === 'COMPLETED') {
            throw new core_1.ValidationError('Task is already completed');
        }
        if (task.status === 'CANCELLED') {
            throw new core_1.ValidationError('Cannot complete a cancelled task');
        }
        const validatedInput = care_plan_validator_1.CarePlanValidator.validateCompleteTask(input);
        const validation = care_plan_validator_1.CarePlanValidator.validateTaskCompletion(task, validatedInput);
        if (!validation.valid) {
            throw new core_1.ValidationError('Task completion requirements not met', {
                errors: validation.errors,
            });
        }
        if (validatedInput.verificationData?.vitalSigns) {
            const vitalValidation = care_plan_validator_1.CarePlanValidator.validateVitalSigns(validatedInput.verificationData.vitalSigns);
            if (vitalValidation.warnings.length > 0) {
                console.warn('Vital signs warnings:', vitalValidation.warnings);
            }
        }
        const now = new Date();
        const completed = await this.repository.updateTaskInstance(id, {
            status: 'COMPLETED',
            completedAt: now,
            completedBy: context.userId,
            completionNote: validatedInput.completionNote,
            completionSignature: validatedInput.signature ? {
                ...validatedInput.signature,
                signedAt: now,
            } : undefined,
            verificationData: validatedInput.verificationData ? {
                ...validatedInput.verificationData,
                verifiedAt: now,
                verifiedBy: context.userId,
                gpsLocation: validatedInput.verificationData.gpsLocation
                    ? {
                        ...validatedInput.verificationData.gpsLocation,
                        timestamp: now,
                    }
                    : undefined,
            } : undefined,
            qualityCheckResponses: validatedInput.qualityCheckResponses,
            customFieldValues: validatedInput.customFieldValues,
        }, context.userId);
        return completed;
    }
    async skipTask(id, reason, note, context = {}) {
        if (!this.permissions.hasPermission(context, 'tasks:skip')) {
            throw new core_1.PermissionError('Insufficient permissions to skip tasks');
        }
        const task = await this.getTaskInstanceById(id, context);
        if (task.status === 'COMPLETED') {
            throw new core_1.ValidationError('Cannot skip a completed task');
        }
        if (task.status === 'CANCELLED') {
            throw new core_1.ValidationError('Cannot skip a cancelled task');
        }
        const skipped = await this.repository.updateTaskInstance(id, {
            status: 'SKIPPED',
            skippedAt: new Date(),
            skippedBy: context.userId,
            skipReason: reason,
            skipNote: note,
        }, context.userId);
        return skipped;
    }
    async reportTaskIssue(id, issueDescription, context) {
        if (!this.permissions.hasPermission(context, 'tasks:update')) {
            throw new core_1.PermissionError('Insufficient permissions to report task issues');
        }
        const task = await this.getTaskInstanceById(id, context);
        const updated = await this.repository.updateTaskInstance(id, {
            status: 'ISSUE_REPORTED',
            issueReported: true,
            issueDescription,
            issueReportedAt: new Date(),
            issueReportedBy: context.userId,
        }, context.userId);
        return updated;
    }
    async searchTaskInstances(filters, pagination, context) {
        if (!this.permissions.hasPermission(context, 'tasks:read')) {
            throw new core_1.PermissionError('Insufficient permissions to search tasks');
        }
        const validatedFilters = care_plan_validator_1.CarePlanValidator.validateTaskInstanceSearchFilters(filters);
        return await this.repository.searchTaskInstances(validatedFilters, pagination);
    }
    async getTasksByVisitId(visitId, context) {
        if (!this.permissions.hasPermission(context, 'tasks:read')) {
            throw new core_1.PermissionError('Insufficient permissions to read tasks');
        }
        return await this.repository.getTasksByVisitId(visitId);
    }
    async createProgressNote(input, context) {
        if (!this.permissions.hasPermission(context, 'progress-notes:create')) {
            throw new core_1.PermissionError('Insufficient permissions to create progress notes');
        }
        const validatedInput = care_plan_validator_1.CarePlanValidator.validateCreateProgressNote(input);
        const now = new Date();
        const makeTs = () => now;
        const normalizedObservations = validatedInput.observations?.map(observation => ({
            ...observation,
            timestamp: new Date(),
        }));
        const signature = validatedInput.signature
            ? { ...validatedInput.signature }
            : undefined;
        const noteInput = {
            carePlanId: validatedInput.carePlanId,
            clientId: validatedInput.clientId,
            visitId: validatedInput.visitId,
            noteType: validatedInput.noteType,
            content: validatedInput.content,
            goalProgress: validatedInput.goalProgress,
            observations: normalizedObservations,
            concerns: validatedInput.concerns,
            recommendations: validatedInput.recommendations,
            signature,
        };
        const authorRole = context.roles?.[0] || 'CAREGIVER';
        const authorName = context.userId ? `User ${context.userId.substring(0, 8)}` : 'System User';
        const note = await this.repository.createProgressNote({
            ...noteInput,
            authorId: context.userId,
            authorName,
            authorRole: String(authorRole),
            noteDate: now,
        });
        return note;
    }
    async getProgressNotesByCarePlanId(carePlanId, context) {
        if (!this.permissions.hasPermission(context, 'progress-notes:read')) {
            throw new core_1.PermissionError('Insufficient permissions to read progress notes');
        }
        return await this.repository.getProgressNotesByCarePlanId(carePlanId);
    }
    async getCarePlanAnalytics(organizationId, context) {
        if (!this.permissions.hasPermission(context, 'analytics:read')) {
            throw new core_1.PermissionError('Insufficient permissions to view analytics');
        }
        const plans = await this.repository.searchCarePlans({ organizationId }, { page: 1, limit: 10000 });
        const activePlans = plans.items.filter(p => p.status === 'ACTIVE');
        const expiringPlans = plans.items.filter(p => p.expirationDate &&
            (0, date_fns_1.isBefore)(p.expirationDate, (0, date_fns_1.addDays)(new Date(), 30)));
        let totalGoals = 0;
        let achievedGoals = 0;
        plans.items.forEach(plan => {
            totalGoals += plan.goals.length;
            achievedGoals += plan.goals.filter(g => g.status === 'ACHIEVED').length;
        });
        const thirtyDaysAgo = (0, date_fns_1.addDays)(new Date(), -30);
        const taskMetrics = await this.getTaskCompletionMetrics({
            dateFrom: thirtyDaysAgo,
            dateTo: new Date(),
            organizationId,
        }, context);
        const compliantPlans = activePlans.filter(p => p.complianceStatus === 'COMPLIANT').length;
        const complianceRate = activePlans.length > 0 ? (compliantPlans / activePlans.length) * 100 : 100;
        return {
            totalPlans: plans.total,
            activePlans: activePlans.length,
            expiringPlans: expiringPlans.length,
            goalCompletionRate: totalGoals > 0 ? (achievedGoals / totalGoals) * 100 : 0,
            taskCompletionRate: taskMetrics.completionRate,
            averageGoalsPerPlan: plans.total > 0 ? totalGoals / plans.total : 0,
            averageTasksPerVisit: taskMetrics.totalTasks > 0 ? taskMetrics.totalTasks / plans.total : 0,
            complianceRate,
        };
    }
    async getTaskCompletionMetrics(filters, context) {
        if (!this.permissions.hasPermission(context, 'analytics:read')) {
            throw new core_1.PermissionError('Insufficient permissions to view analytics');
        }
        const tasks = await this.repository.searchTaskInstances({
            scheduledDateFrom: filters.dateFrom,
            scheduledDateTo: filters.dateTo,
        }, { page: 1, limit: 10000 });
        const completed = tasks.items.filter(t => t.status === 'COMPLETED');
        const skipped = tasks.items.filter(t => t.status === 'SKIPPED');
        const missed = tasks.items.filter(t => t.status === 'MISSED');
        const issues = tasks.items.filter(t => t.issueReported);
        const tasksByCategory = tasks.items.reduce((acc, task) => {
            acc[task.category] = (acc[task.category] || 0) + 1;
            return acc;
        }, {});
        const completionTimes = completed
            .filter(t => t.completedAt && t.scheduledDate)
            .map(t => {
            const scheduled = new Date(t.scheduledDate).getTime();
            const completed = new Date(t.completedAt).getTime();
            return (completed - scheduled) / (1000 * 60);
        });
        const avgCompletionTime = completionTimes.length > 0
            ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
            : 0;
        return {
            totalTasks: tasks.total,
            completedTasks: completed.length,
            skippedTasks: skipped.length,
            missedTasks: missed.length,
            completionRate: tasks.total > 0 ? (completed.length / tasks.total) * 100 : 0,
            averageCompletionTime: avgCompletionTime,
            tasksByCategory: tasksByCategory,
            issuesReported: issues.length,
        };
    }
    async generatePlanNumber(organizationId) {
        const prefix = 'CP';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }
    shouldCreateTaskForDate(template, date) {
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        const frequency = template.frequency;
        if (frequency.pattern === 'DAILY') {
            return true;
        }
        if (frequency.pattern === 'WEEKLY' && frequency.specificDays) {
            return frequency.specificDays.includes(dayOfWeek);
        }
        if (frequency.pattern === 'AS_NEEDED') {
            return false;
        }
        return true;
    }
}
exports.CarePlanService = CarePlanService;
exports.default = CarePlanService;
//# sourceMappingURL=care-plan-service.js.map