"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaregiverService = void 0;
const core_1 = require("@care-commons/core");
const caregiver_repository_1 = require("../repository/caregiver-repository");
const caregiver_validator_1 = require("../validation/caregiver-validator");
class CaregiverService {
    constructor(database) {
        this.repository = new caregiver_repository_1.CaregiverRepository(database);
        this.validator = new caregiver_validator_1.CaregiverValidator();
    }
    async createCaregiver(input, context) {
        this.checkPermission(context, 'caregivers:create');
        const validation = this.validator.validateCreate(input);
        if (!validation.success) {
            throw new core_1.ValidationError('Invalid caregiver data', {
                errors: validation.errors,
            });
        }
        let employeeNumber = input.employeeNumber;
        if (!employeeNumber) {
            employeeNumber = await this.repository.generateEmployeeNumber(input.organizationId);
        }
        const existing = await this.repository.findByEmployeeNumber(employeeNumber, input.organizationId);
        if (existing) {
            throw new core_1.ConflictError(`Employee number ${employeeNumber} already exists`);
        }
        const caregiverData = {
            ...input,
            employeeNumber,
            status: input.status || 'PENDING_ONBOARDING',
            complianceStatus: 'PENDING_VERIFICATION',
            employmentStatus: 'ACTIVE',
            permissions: this.getDefaultPermissions(input.role),
            credentials: [],
            training: [],
            skills: [],
            specializations: [],
            languages: [],
            availability: {
                schedule: {
                    monday: { available: false },
                    tuesday: { available: false },
                    wednesday: { available: false },
                    thursday: { available: false },
                    friday: { available: false },
                    saturday: { available: false },
                    sunday: { available: false },
                },
                lastUpdated: new Date(),
            },
            preferredClients: [],
            restrictedClients: [],
        };
        return this.repository.create(caregiverData, context);
    }
    async updateCaregiver(id, input, context) {
        this.checkPermission(context, 'caregivers:update');
        const validation = this.validator.validateUpdate(input);
        if (!validation.success) {
            throw new core_1.ValidationError('Invalid caregiver data', {
                errors: validation.errors,
            });
        }
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new core_1.NotFoundError(`Caregiver not found: ${id}`);
        }
        let updates = { ...input };
        if (input.credentials || input.training) {
            const complianceStatus = await this.calculateComplianceStatus({
                ...existing,
                ...updates,
            });
            updates.complianceStatus = complianceStatus;
        }
        return this.repository.update(id, updates, context);
    }
    async getCaregiverById(id, context) {
        this.checkPermission(context, 'caregivers:read');
        const caregiver = await this.repository.findById(id);
        if (!caregiver) {
            throw new core_1.NotFoundError(`Caregiver not found: ${id}`);
        }
        return this.filterSensitiveData(caregiver, context);
    }
    async getCaregiverByEmployeeNumber(employeeNumber, organizationId, context) {
        this.checkPermission(context, 'caregivers:read');
        const caregiver = await this.repository.findByEmployeeNumber(employeeNumber, organizationId);
        if (!caregiver) {
            throw new core_1.NotFoundError(`Caregiver not found: ${employeeNumber}`);
        }
        return this.filterSensitiveData(caregiver, context);
    }
    async searchCaregivers(filters, pagination, context) {
        this.checkPermission(context, 'caregivers:read');
        const effectiveFilters = this.applyContextFilters(filters, context);
        const result = await this.repository.search(effectiveFilters, pagination);
        const filteredItems = result.items.map((caregiver) => this.filterSensitiveData(caregiver, context));
        return {
            ...result,
            items: filteredItems,
        };
    }
    async getCaregiversByBranch(branchId, activeOnly, context) {
        this.checkPermission(context, 'caregivers:read');
        if (!context.branchIds.includes(branchId)) {
            throw new core_1.PermissionError('No access to this branch');
        }
        const caregivers = await this.repository.findByBranch(branchId, activeOnly);
        return caregivers.map((c) => this.filterSensitiveData(c, context));
    }
    async getCaregiversWithExpiringCredentials(organizationId, daysUntilExpiration, context) {
        this.checkPermission(context, 'caregivers:read');
        const caregivers = await this.repository.findWithExpiringCredentials(organizationId, daysUntilExpiration);
        return caregivers.map((c) => this.filterSensitiveData(c, context));
    }
    async getCaregiversByComplianceStatus(organizationId, complianceStatus, context) {
        this.checkPermission(context, 'caregivers:read');
        const caregivers = await this.repository.findByComplianceStatus(organizationId, complianceStatus);
        return caregivers.map((c) => this.filterSensitiveData(c, context));
    }
    async findAvailableForShift(organizationId, branchId, dayOfWeek, shiftStart, shiftEnd, context) {
        this.checkPermission(context, 'caregivers:read');
        const caregivers = await this.repository.findAvailableForShift(organizationId, branchId, dayOfWeek, shiftStart, shiftEnd);
        return caregivers.map((c) => this.filterSensitiveData(c, context));
    }
    async checkEligibilityForAssignment(caregiverId, clientId, shiftDate, context) {
        this.checkPermission(context, 'caregivers:read');
        const caregiver = await this.repository.findById(caregiverId);
        if (!caregiver) {
            throw new core_1.NotFoundError(`Caregiver not found: ${caregiverId}`);
        }
        const reasons = [];
        let isEligible = true;
        if (caregiver.complianceStatus !== 'COMPLIANT') {
            reasons.push({
                type: 'COMPLIANCE',
                message: `Compliance status is ${caregiver.complianceStatus}`,
                severity: 'ERROR',
            });
            isEligible = false;
        }
        if (caregiver.employmentStatus !== 'ACTIVE') {
            reasons.push({
                type: 'COMPLIANCE',
                message: `Employment status is ${caregiver.employmentStatus}`,
                severity: 'ERROR',
            });
            isEligible = false;
        }
        if (caregiver.status !== 'ACTIVE') {
            reasons.push({
                type: 'COMPLIANCE',
                message: `Caregiver status is ${caregiver.status}`,
                severity: 'ERROR',
            });
            isEligible = false;
        }
        if (caregiver.restrictedClients?.includes(clientId)) {
            reasons.push({
                type: 'PREFERENCE',
                message: 'Caregiver is restricted from this client',
                severity: 'ERROR',
            });
            isEligible = false;
        }
        const expiredCredentials = caregiver.credentials.filter((cred) => cred.expirationDate &&
            new Date(cred.expirationDate) < new Date() &&
            cred.status === 'ACTIVE');
        if (expiredCredentials.length > 0) {
            reasons.push({
                type: 'COMPLIANCE',
                message: `${expiredCredentials.length} credential(s) expired`,
                severity: 'ERROR',
            });
            isEligible = false;
        }
        const expiringCredentials = caregiver.credentials.filter((cred) => cred.expirationDate &&
            new Date(cred.expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
            new Date(cred.expirationDate) >= new Date() &&
            cred.status === 'ACTIVE');
        if (expiringCredentials.length > 0) {
            reasons.push({
                type: 'COMPLIANCE',
                message: `${expiringCredentials.length} credential(s) expiring soon`,
                severity: 'WARNING',
            });
        }
        if (caregiver.preferredClients?.includes(clientId)) {
            reasons.push({
                type: 'PREFERENCE',
                message: 'This is a preferred client for this caregiver',
                severity: 'INFO',
            });
        }
        return {
            caregiverId,
            isEligible,
            reasons,
        };
    }
    async updateComplianceStatus(caregiverId, context) {
        this.checkPermission(context, 'caregivers:update');
        const caregiver = await this.repository.findById(caregiverId);
        if (!caregiver) {
            throw new core_1.NotFoundError(`Caregiver not found: ${caregiverId}`);
        }
        const complianceStatus = await this.calculateComplianceStatus(caregiver);
        return this.repository.updateComplianceStatus(caregiverId, complianceStatus, context);
    }
    async deleteCaregiver(id, context) {
        this.checkPermission(context, 'caregivers:delete');
        const caregiver = await this.repository.findById(id);
        if (!caregiver) {
            throw new core_1.NotFoundError(`Caregiver not found: ${id}`);
        }
        await this.repository.delete(id, context);
    }
    async calculateComplianceStatus(caregiver) {
        const now = new Date();
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const hasExpiredCredentials = caregiver.credentials?.some((cred) => cred.expirationDate &&
            new Date(cred.expirationDate) < now &&
            cred.status === 'ACTIVE');
        if (hasExpiredCredentials) {
            return 'EXPIRED';
        }
        const hasExpiringCredentials = caregiver.credentials?.some((cred) => cred.expirationDate &&
            new Date(cred.expirationDate) <= thirtyDaysFromNow &&
            new Date(cred.expirationDate) >= now &&
            cred.status === 'ACTIVE');
        if (hasExpiringCredentials) {
            return 'EXPIRING_SOON';
        }
        if (caregiver.backgroundCheck) {
            if (caregiver.backgroundCheck.status === 'FLAGGED') {
                return 'NON_COMPLIANT';
            }
            if (caregiver.backgroundCheck.status === 'EXPIRED') {
                return 'EXPIRED';
            }
            if (caregiver.backgroundCheck.status === 'PENDING') {
                return 'PENDING_VERIFICATION';
            }
        }
        else {
            return 'PENDING_VERIFICATION';
        }
        if (caregiver.drugScreening) {
            if (caregiver.drugScreening.status === 'FAILED') {
                return 'NON_COMPLIANT';
            }
            if (caregiver.drugScreening.status === 'EXPIRED') {
                return 'EXPIRED';
            }
            if (caregiver.drugScreening.status === 'PENDING') {
                return 'PENDING_VERIFICATION';
            }
        }
        else {
            return 'PENDING_VERIFICATION';
        }
        if (caregiver.healthScreening) {
            if (caregiver.healthScreening.status === 'EXPIRED') {
                return 'EXPIRED';
            }
            if (caregiver.healthScreening.status === 'PENDING') {
                return 'PENDING_VERIFICATION';
            }
        }
        return 'COMPLIANT';
    }
    getDefaultPermissions(role) {
        const permissionsByRole = {
            CAREGIVER: ['visits:create', 'visits:read', 'visits:update', 'clients:read'],
            SENIOR_CAREGIVER: [
                'visits:create',
                'visits:read',
                'visits:update',
                'clients:read',
                'caregivers:read',
            ],
            COORDINATOR: [
                'visits:*',
                'clients:*',
                'caregivers:read',
                'schedules:*',
            ],
            SUPERVISOR: [
                'visits:*',
                'clients:*',
                'caregivers:*',
                'schedules:*',
                'reports:read',
            ],
            SCHEDULER: ['schedules:*', 'clients:read', 'caregivers:read', 'visits:*'],
            ADMINISTRATIVE: ['*'],
        };
        return permissionsByRole[role] || ['visits:read', 'clients:read'];
    }
    filterSensitiveData(caregiver, context) {
        const canViewSensitive = context.roles.includes('ORG_ADMIN') ||
            context.roles.includes('HR') ||
            context.roles.includes('SUPER_ADMIN');
        if (!canViewSensitive) {
            return {
                ...caregiver,
                ssn: undefined,
                dateOfBirth: undefined,
                payRate: undefined,
                alternatePayRates: undefined,
                payrollInfo: undefined,
            };
        }
        return caregiver;
    }
    applyContextFilters(filters, context) {
        const effectiveFilters = { ...filters };
        if (!effectiveFilters.organizationId) {
            effectiveFilters.organizationId = context.organizationId;
        }
        if (!context.roles.includes('ORG_ADMIN') &&
            !context.roles.includes('SUPER_ADMIN') &&
            !effectiveFilters.branchId) {
        }
        return effectiveFilters;
    }
    checkPermission(context, permission) {
        const hasPermission = context.roles.includes('SUPER_ADMIN') ||
            context.roles.includes('ORG_ADMIN') ||
            context.permissions.includes(permission) ||
            context.permissions.includes('*');
        if (!hasPermission) {
            throw new core_1.PermissionError(`Permission denied: ${permission}`);
        }
    }
}
exports.CaregiverService = CaregiverService;
//# sourceMappingURL=caregiver-service.js.map