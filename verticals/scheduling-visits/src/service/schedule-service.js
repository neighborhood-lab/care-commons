"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleService = void 0;
const core_1 = require("@care-commons/core");
const schedule_validator_1 = require("../validation/schedule-validator");
const date_fns_1 = require("date-fns");
class ScheduleService {
    constructor(repository) {
        this.repository = repository;
    }
    async createServicePattern(input, context) {
        const validated = schedule_validator_1.ScheduleValidator.validateServicePattern(input);
        this.checkPermission(context, 'schedules:create');
        this.checkOrganizationAccess(context, input.organizationId);
        this.checkBranchAccess(context, input.branchId);
        await this.validatePatternBusinessRules(validated);
        return await this.repository.createServicePattern(validated, context);
    }
    async getServicePatternById(id, context) {
        this.checkPermission(context, 'schedules:read');
        const pattern = await this.repository.getServicePatternById(id);
        if (!pattern) {
            throw new core_1.NotFoundError('Service pattern not found', { id });
        }
        this.checkOrganizationAccess(context, pattern.organizationId);
        return pattern;
    }
    async updateServicePattern(id, input, context) {
        const validated = schedule_validator_1.ScheduleValidator.validateUpdatePattern(input);
        this.checkPermission(context, 'schedules:update');
        const pattern = await this.repository.getServicePatternById(id);
        if (!pattern) {
            throw new core_1.NotFoundError('Service pattern not found', { id });
        }
        this.checkOrganizationAccess(context, pattern.organizationId);
        return await this.repository.updateServicePattern(id, validated, context);
    }
    async getPatternsByClient(clientId, context) {
        this.checkPermission(context, 'schedules:read');
        const patterns = await this.repository.getPatternsByClient(clientId);
        return patterns.filter(p => context.organizationId === p.organizationId);
    }
    async createVisit(input, context) {
        const validated = schedule_validator_1.ScheduleValidator.validateVisit(input);
        this.checkPermission(context, 'visits:create');
        this.checkOrganizationAccess(context, input.organizationId);
        this.checkBranchAccess(context, input.branchId);
        await this.validateVisitConflicts(validated);
        return await this.repository.createVisit(validated, context);
    }
    async getVisitById(id, context) {
        this.checkPermission(context, 'visits:read');
        const visit = await this.repository.getVisitById(id);
        if (!visit) {
            throw new core_1.NotFoundError('Visit not found', { id });
        }
        this.checkOrganizationAccess(context, visit.organizationId);
        return visit;
    }
    async updateVisitStatus(input, context) {
        const validated = schedule_validator_1.ScheduleValidator.validateStatusUpdate(input);
        this.checkPermission(context, 'visits:update');
        const visit = await this.repository.getVisitById(input.visitId);
        if (!visit) {
            throw new core_1.NotFoundError('Visit not found', { visitId: input.visitId });
        }
        this.checkOrganizationAccess(context, visit.organizationId);
        this.validateStatusTransition(visit.status, input.newStatus, context);
        return await this.repository.updateVisitStatus(input.visitId, input.newStatus, context, input.notes, input.reason);
    }
    async completeVisit(input, context) {
        const validated = schedule_validator_1.ScheduleValidator.validateCompletion(input);
        this.checkPermission(context, 'visits:update');
        const visit = await this.repository.getVisitById(input.visitId);
        if (!visit) {
            throw new core_1.NotFoundError('Visit not found', { visitId: input.visitId });
        }
        this.checkOrganizationAccess(context, visit.organizationId);
        if (visit.status !== 'IN_PROGRESS' && visit.status !== 'PAUSED') {
            throw new core_1.ValidationError('Visit must be in progress to complete', {
                currentStatus: visit.status,
            });
        }
        return await this.repository.updateVisitStatus(input.visitId, 'COMPLETED', context, input.completionNotes);
    }
    async assignCaregiver(input, context) {
        const validated = schedule_validator_1.ScheduleValidator.validateAssignment(input);
        this.checkPermission(context, 'visits:assign');
        const visit = await this.repository.getVisitById(input.visitId);
        if (!visit) {
            throw new core_1.NotFoundError('Visit not found', { visitId: input.visitId });
        }
        this.checkOrganizationAccess(context, visit.organizationId);
        if (!['UNASSIGNED', 'SCHEDULED', 'ASSIGNED'].includes(visit.status)) {
            throw new core_1.ValidationError('Visit cannot be assigned in current status', {
                status: visit.status,
            });
        }
        const isAvailable = await this.checkCaregiverAvailability({
            caregiverId: input.caregiverId,
            date: visit.scheduledDate,
            startTime: visit.scheduledStartTime,
            endTime: visit.scheduledEndTime,
            includeTravel: true,
        });
        if (!isAvailable) {
            throw new core_1.ConflictError('Caregiver is not available for this time slot', {
                caregiverId: input.caregiverId,
                visitId: input.visitId,
            });
        }
        return await this.repository.assignCaregiver(validated, context);
    }
    async searchVisits(filters, pagination, context) {
        const validated = schedule_validator_1.ScheduleValidator.validateSearchFilters(filters);
        this.checkPermission(context, 'visits:read');
        const orgFilters = {
            ...validated,
            organizationId: context.organizationId,
        };
        if (context.roles.includes('BRANCH_ADMIN') || context.roles.includes('COORDINATOR')) {
            orgFilters.branchIds = context.branchIds;
        }
        return await this.repository.searchVisits(orgFilters, pagination);
    }
    async getUnassignedVisits(organizationId, branchId, context) {
        this.checkPermission(context, 'visits:read');
        this.checkOrganizationAccess(context, organizationId);
        if (branchId) {
            this.checkBranchAccess(context, branchId);
        }
        return await this.repository.getUnassignedVisits(organizationId, branchId);
    }
    async generateScheduleFromPattern(options, context) {
        const validated = schedule_validator_1.ScheduleValidator.validateGenerationOptions(options);
        this.checkPermission(context, 'schedules:generate');
        const pattern = await this.repository.getServicePatternById(options.patternId);
        if (!pattern) {
            throw new core_1.NotFoundError('Service pattern not found', { patternId: options.patternId });
        }
        this.checkOrganizationAccess(context, pattern.organizationId);
        if (pattern.status !== 'ACTIVE') {
            throw new core_1.ValidationError('Can only generate schedule from active patterns', {
                patternStatus: pattern.status,
            });
        }
        const visitDates = this.calculateVisitDates(pattern, options.startDate, options.endDate, options.skipHolidays || false);
        const visits = [];
        for (const date of visitDates) {
            const visitInput = {
                organizationId: pattern.organizationId,
                branchId: pattern.branchId,
                clientId: pattern.clientId,
                patternId: pattern.id,
                visitType: 'REGULAR',
                serviceTypeId: pattern.serviceTypeId,
                serviceTypeName: pattern.serviceTypeName,
                scheduledDate: date,
                scheduledStartTime: pattern.recurrence.startTime,
                scheduledEndTime: this.calculateEndTime(pattern.recurrence.startTime, pattern.duration),
                address: await this.getClientAddress(pattern.clientId),
                taskIds: pattern.taskTemplateIds,
                requiredSkills: pattern.requiredSkills,
                requiredCertifications: pattern.requiredCertifications,
                clientInstructions: pattern.clientInstructions,
                caregiverInstructions: pattern.caregiverInstructions,
            };
            const visit = await this.repository.createVisit(visitInput, context);
            visits.push(visit);
            if (options.autoAssign && pattern.preferredCaregivers && pattern.preferredCaregivers.length > 0) {
                for (const caregiverId of pattern.preferredCaregivers) {
                    try {
                        await this.assignCaregiver({
                            visitId: visit.id,
                            caregiverId,
                            assignmentMethod: 'PREFERRED',
                        }, context);
                        break;
                    }
                    catch (error) {
                        continue;
                    }
                }
            }
        }
        return visits;
    }
    async checkCaregiverAvailability(query) {
        const validated = schedule_validator_1.ScheduleValidator.validateAvailabilityQuery(query);
        const visits = await this.repository.searchVisits({
            caregiverId: validated.caregiverId,
            dateFrom: validated.date,
            dateTo: validated.date,
            status: ['ASSIGNED', 'CONFIRMED', 'EN_ROUTE', 'IN_PROGRESS'],
        }, { page: 1, limit: 100 });
        if (!validated.startTime || !validated.endTime) {
            return visits.items.length === 0;
        }
        const requestedStart = this.timeToMinutes(validated.startTime);
        const requestedEnd = this.timeToMinutes(validated.endTime);
        for (const visit of visits.items) {
            const visitStart = this.timeToMinutes(visit.scheduledStartTime);
            const visitEnd = this.timeToMinutes(visit.scheduledEndTime);
            const travelBefore = validated.includeTravel ? (visit.address ? 30 : 0) : 0;
            const travelAfter = validated.includeTravel ? (visit.address ? 30 : 0) : 0;
            const effectiveStart = visitStart - travelBefore;
            const effectiveEnd = visitEnd + travelAfter;
            if ((requestedStart >= effectiveStart && requestedStart < effectiveEnd) ||
                (requestedEnd > effectiveStart && requestedEnd <= effectiveEnd) ||
                (requestedStart <= effectiveStart && requestedEnd >= effectiveEnd)) {
                return false;
            }
        }
        return true;
    }
    async getCaregiverAvailabilitySlots(query) {
        const slots = [];
        const workDayStart = '08:00';
        const workDayEnd = '18:00';
        const slotDuration = query.duration || 60;
        let currentTime = workDayStart;
        while (this.timeToMinutes(currentTime) + slotDuration <= this.timeToMinutes(workDayEnd)) {
            const endTime = this.addMinutesToTime(currentTime, slotDuration);
            const isAvailable = await this.checkCaregiverAvailability({
                caregiverId: query.caregiverId,
                date: query.date,
                startTime: currentTime,
                endTime: endTime,
                includeTravel: query.includeTravel,
            });
            slots.push({
                startTime: currentTime,
                endTime: endTime,
                isAvailable,
                reason: isAvailable ? undefined : 'Conflicting visit',
            });
            currentTime = endTime;
        }
        return slots;
    }
    calculateVisitDates(pattern, startDate, endDate, skipHolidays) {
        const dates = [];
        const { recurrence } = pattern;
        let currentDate = (0, date_fns_1.startOfDay)(startDate);
        const finalDate = (0, date_fns_1.endOfDay)(endDate);
        while ((0, date_fns_1.isBefore)(currentDate, finalDate) || (0, date_fns_1.isSameDay)(currentDate, finalDate)) {
            let shouldInclude = false;
            switch (recurrence.frequency) {
                case 'DAILY':
                    shouldInclude = true;
                    currentDate = (0, date_fns_1.addDays)(currentDate, recurrence.interval);
                    break;
                case 'WEEKLY':
                case 'BIWEEKLY':
                    if (recurrence.daysOfWeek) {
                        const dayOfWeek = this.getDayOfWeek(currentDate);
                        shouldInclude = recurrence.daysOfWeek.includes(dayOfWeek);
                    }
                    if (shouldInclude) {
                        dates.push(new Date(currentDate));
                    }
                    currentDate = (0, date_fns_1.addDays)(currentDate, 1);
                    if (this.getDayOfWeek(currentDate) === 'MONDAY' && dates.length > 0) {
                        const weeksToAdd = recurrence.frequency === 'BIWEEKLY' ? 2 : 1;
                        currentDate = (0, date_fns_1.addWeeks)(currentDate, weeksToAdd - 1);
                    }
                    continue;
                case 'MONTHLY':
                    if (recurrence.datesOfMonth) {
                        const dayOfMonth = currentDate.getDate();
                        shouldInclude = recurrence.datesOfMonth.includes(dayOfMonth);
                    }
                    if (shouldInclude) {
                        dates.push(new Date(currentDate));
                    }
                    currentDate = (0, date_fns_1.addDays)(currentDate, 1);
                    continue;
                default:
                    currentDate = (0, date_fns_1.addDays)(currentDate, 1);
                    continue;
            }
            if (shouldInclude && recurrence.frequency === 'DAILY') {
                dates.push(new Date(currentDate));
            }
        }
        return dates;
    }
    getDayOfWeek(date) {
        const days = [
            'SUNDAY',
            'MONDAY',
            'TUESDAY',
            'WEDNESDAY',
            'THURSDAY',
            'FRIDAY',
            'SATURDAY',
        ];
        return days[date.getDay()];
    }
    calculateEndTime(startTime, durationMinutes) {
        return this.addMinutesToTime(startTime, durationMinutes);
    }
    addMinutesToTime(time, minutes) {
        const [hours, mins] = time.split(':').map(Number);
        const totalMinutes = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMins = totalMinutes % 60;
        return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
    }
    timeToMinutes(time) {
        const [hours, mins] = time.split(':').map(Number);
        return hours * 60 + mins;
    }
    async getClientAddress(clientId) {
        throw new core_1.NotFoundError('Client address integration not configured. ' +
            'ScheduleService requires a ClientProvider to fetch client addresses. ' +
            'This must be injected via dependency injection.', { clientId });
    }
    async validatePatternBusinessRules(input) {
        if (input.authorizationEndDate && input.authorizationStartDate) {
            if ((0, date_fns_1.isBefore)(input.authorizationEndDate, input.authorizationStartDate)) {
                throw new core_1.ValidationError('Authorization end date must be after start date');
            }
        }
        if (input.recurrence.frequency === 'WEEKLY' && !input.recurrence.daysOfWeek) {
            throw new core_1.ValidationError('Weekly patterns must specify days of week');
        }
        if (input.recurrence.frequency === 'MONTHLY' && !input.recurrence.datesOfMonth) {
            throw new core_1.ValidationError('Monthly patterns must specify dates of month');
        }
    }
    async validateVisitConflicts(input) {
        const existingVisits = await this.repository.searchVisits({
            clientId: input.clientId,
            dateFrom: input.scheduledDate,
            dateTo: input.scheduledDate,
            status: ['SCHEDULED', 'ASSIGNED', 'CONFIRMED', 'IN_PROGRESS'],
        }, { page: 1, limit: 100 });
        const requestedStart = this.timeToMinutes(input.scheduledStartTime);
        const requestedEnd = this.timeToMinutes(input.scheduledEndTime);
        for (const visit of existingVisits.items) {
            const visitStart = this.timeToMinutes(visit.scheduledStartTime);
            const visitEnd = this.timeToMinutes(visit.scheduledEndTime);
            if ((requestedStart >= visitStart && requestedStart < visitEnd) ||
                (requestedEnd > visitStart && requestedEnd <= visitEnd) ||
                (requestedStart <= visitStart && requestedEnd >= visitEnd)) {
                throw new core_1.ConflictError('Client already has a visit scheduled at this time', {
                    existingVisitId: visit.id,
                });
            }
        }
    }
    validateStatusTransition(currentStatus, newStatus, context) {
        const validTransitions = {
            DRAFT: ['SCHEDULED', 'CANCELLED'],
            SCHEDULED: ['UNASSIGNED', 'ASSIGNED', 'CANCELLED'],
            UNASSIGNED: ['ASSIGNED', 'CANCELLED'],
            ASSIGNED: ['CONFIRMED', 'EN_ROUTE', 'CANCELLED', 'REJECTED'],
            CONFIRMED: ['EN_ROUTE', 'CANCELLED', 'NO_SHOW_CAREGIVER'],
            EN_ROUTE: ['ARRIVED', 'CANCELLED', 'NO_SHOW_CAREGIVER'],
            ARRIVED: ['IN_PROGRESS', 'NO_SHOW_CLIENT'],
            IN_PROGRESS: ['PAUSED', 'COMPLETED', 'INCOMPLETE'],
            PAUSED: ['IN_PROGRESS', 'COMPLETED', 'INCOMPLETE'],
            COMPLETED: [],
            INCOMPLETE: [],
            CANCELLED: [],
            NO_SHOW_CLIENT: [],
            NO_SHOW_CAREGIVER: ['ASSIGNED'],
            REJECTED: ['ASSIGNED'],
        };
        if (!validTransitions[currentStatus]?.includes(newStatus)) {
            throw new core_1.ValidationError(`Invalid status transition from ${currentStatus} to ${newStatus}`, {
                currentStatus,
                requestedStatus: newStatus,
            });
        }
    }
    checkPermission(context, permission) {
        if (!context.permissions.includes(permission) && !context.roles.includes('SUPER_ADMIN')) {
            throw new core_1.PermissionError(`Missing required permission: ${permission}`, {
                userId: context.userId,
                permission,
            });
        }
    }
    checkOrganizationAccess(context, organizationId) {
        if (context.organizationId !== organizationId && !context.roles.includes('SUPER_ADMIN')) {
            throw new core_1.PermissionError('Access denied to this organization', {
                userOrg: context.organizationId,
                requestedOrg: organizationId,
            });
        }
    }
    checkBranchAccess(context, branchId) {
        if (!context.branchIds.includes(branchId) &&
            !context.roles.includes('SUPER_ADMIN') &&
            !context.roles.includes('ORG_ADMIN')) {
            throw new core_1.PermissionError('Access denied to this branch', {
                userBranches: context.branchIds,
                requestedBranch: branchId,
            });
        }
    }
}
exports.ScheduleService = ScheduleService;
//# sourceMappingURL=schedule-service.js.map