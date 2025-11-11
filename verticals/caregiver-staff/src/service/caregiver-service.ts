/**
 * Caregiver service - business logic layer
 */

import {
  Database,
  UserContext,
  PaginatedResult,
  ValidationError,
  NotFoundError,
  PermissionError,
  ConflictError,
  UserRepository,
} from '@care-commons/core';
import { CaregiverRepository } from '../repository/caregiver-repository';
import {
  Caregiver,
  CreateCaregiverInput,
  UpdateCaregiverInput,
  CaregiverSearchFilters,
  CaregiverEligibility,
  EligibilityReason,
  ComplianceStatus,
} from '../types/caregiver';
import { CaregiverValidator } from '../validation/caregiver-validator';

interface ServiceAuthorization {
  id: string;
  caregiverId: string;
  serviceTypeCode: string;
  serviceTypeName: string;
  authorizationSource: string;
  effectiveDate: Date;
  expirationDate: Date | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StateScreening {
  id: string;
  caregiverId: string;
  stateCode: string;
  screeningType: string;
  status: string;
  initiationDate: Date;
  completionDate: Date | null;
  expirationDate: Date | null;
  confirmationNumber: string | null;
  clearanceNumber: string | null;
  results: Record<string, unknown> | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CaregiverService {
  private repository: CaregiverRepository;
  private userRepository: UserRepository;
  private validator: CaregiverValidator;

  constructor(database: Database) {
    this.repository = new CaregiverRepository(database);
    this.userRepository = new UserRepository(database);
    this.validator = new CaregiverValidator();
  }

  /**
   * Create a new caregiver
   */
  async createCaregiver(
    input: CreateCaregiverInput,
    context: UserContext
  ): Promise<Caregiver> {
    // Validate permissions
    this.checkPermission(context, 'caregivers:create');

    // Validate input
    const validation = this.validator.validateCreate(input);
    if (!validation.success) {
      throw new ValidationError('Invalid caregiver data', {
        errors: validation.errors,
      });
    }

    // Generate employee number if not provided
    let employeeNumber = input.employeeNumber;
    if (!employeeNumber) {
      employeeNumber = await this.repository.generateEmployeeNumber(
        input.organizationId
      );
    }

    // Check for duplicate employee number
    const existing = await this.repository.findByEmployeeNumber(
      employeeNumber,
      input.organizationId
    );
    if (existing) {
      throw new ConflictError(`Employee number ${employeeNumber} already exists`);
    }

    // Set default values
    const caregiverData: Partial<Caregiver> = {
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

  /**
   * Update a caregiver
   */
  async updateCaregiver(
    id: string,
    input: UpdateCaregiverInput,
    context: UserContext
  ): Promise<Caregiver> {
    // Validate permissions
    this.checkPermission(context, 'caregivers:update');

    // Validate input
    const validation = this.validator.validateUpdate(input);
    if (!validation.success) {
      throw new ValidationError('Invalid caregiver data', {
        errors: validation.errors,
      });
    }

    // Check if caregiver exists
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Caregiver not found: ${id}`);
    }

    // Update compliance status if credentials or training changed
    let updates: Partial<Caregiver> = { ...input };
    if (input.credentials || input.training) {
      const complianceStatus = await this.calculateComplianceStatus({
        ...existing,
        ...updates,
      });
      updates.complianceStatus = complianceStatus;
    }

    return this.repository.update(id, updates, context);
  }

  /**
   * Get caregiver by ID
   */
  async getCaregiverById(id: string, context: UserContext): Promise<Caregiver> {
    this.checkPermission(context, 'caregivers:read');

    const caregiver = await this.repository.findById(id);
    if (!caregiver) {
      throw new NotFoundError(`Caregiver not found: ${id}`);
    }

    // Filter sensitive data based on permissions
    return this.filterSensitiveData(caregiver, context);
  }

  /**
   * Get caregiver by employee number
   */
  async getCaregiverByEmployeeNumber(
    employeeNumber: string,
    organizationId: string,
    context: UserContext
  ): Promise<Caregiver> {
    this.checkPermission(context, 'caregivers:read');

    const caregiver = await this.repository.findByEmployeeNumber(
      employeeNumber,
      organizationId
    );
    if (!caregiver) {
      throw new NotFoundError(`Caregiver not found: ${employeeNumber}`);
    }

    return this.filterSensitiveData(caregiver, context);
  }

  /**
   * Get authenticated caregiver's profile
   * 
   * Links user authentication record to caregiver profile via email.
   * This is a temporary solution using email lookup. Future enhancement:
   * add user_id field to caregivers table for direct linkage and better performance.
   * 
   * @param context - User context containing userId and permissions
   * @returns Caregiver profile for the authenticated user
   * @throws NotFoundError if user or caregiver profile not found
   */
  async getCurrentCaregiverProfile(context: UserContext): Promise<Caregiver> {
    // Get user email from user repository
    const user = await this.userRepository.getUserById(context.userId);
    if (!user) {
      throw new NotFoundError(`User not found: ${context.userId}`);
    }

    // Find caregiver by email
    const caregiver = await this.repository.findByEmail(user.email);
    if (!caregiver) {
      throw new NotFoundError(`Caregiver profile not found for user: ${context.userId}`);
    }

    // Caregivers can always read their own profile
    return this.filterSensitiveData(caregiver, context);
  }

  /**
   * Search caregivers
   */
  async searchCaregivers(
    filters: CaregiverSearchFilters,
    pagination: { page: number; limit: number },
    context: UserContext
  ): Promise<PaginatedResult<Caregiver>> {
    this.checkPermission(context, 'caregivers:read');

    // Apply organization/branch filter based on context
    const effectiveFilters = this.applyContextFilters(filters, context);

    const result = await this.repository.search(effectiveFilters, pagination);

    // Filter sensitive data
    const filteredItems = result.items.map((caregiver) =>
      this.filterSensitiveData(caregiver, context)
    );

    return {
      ...result,
      items: filteredItems,
    };
  }

  /**
   * Get caregivers by branch
   */
  async getCaregiversByBranch(
    branchId: string,
    activeOnly: boolean,
    context: UserContext
  ): Promise<Caregiver[]> {
    this.checkPermission(context, 'caregivers:read');

    // Check branch access
    if (!context.branchIds.includes(branchId)) {
      throw new PermissionError('No access to this branch');
    }

    const caregivers = await this.repository.findByBranch(branchId, activeOnly);
    return caregivers.map((c) => this.filterSensitiveData(c, context));
  }

  /**
   * Get caregivers with expiring credentials
   */
  async getCaregiversWithExpiringCredentials(
    organizationId: string,
    daysUntilExpiration: number,
    context: UserContext
  ): Promise<Caregiver[]> {
    this.checkPermission(context, 'caregivers:read');

    const caregivers = await this.repository.findWithExpiringCredentials(
      organizationId,
      daysUntilExpiration
    );
    return caregivers.map((c) => this.filterSensitiveData(c, context));
  }

  /**
   * Get caregivers by compliance status
   */
  async getCaregiversByComplianceStatus(
    organizationId: string,
    complianceStatus: ComplianceStatus[],
    context: UserContext
  ): Promise<Caregiver[]> {
    this.checkPermission(context, 'caregivers:read');

    const caregivers = await this.repository.findByComplianceStatus(
      organizationId,
      complianceStatus
    );
    return caregivers.map((c) => this.filterSensitiveData(c, context));
  }

  /**
   * Find available caregivers for a shift
   */
  async findAvailableForShift(
    organizationId: string,
    branchId: string,
    dayOfWeek: string,
    _shiftStart: string,
    _shiftEnd: string,
    context: UserContext
  ): Promise<Caregiver[]> {
    this.checkPermission(context, 'caregivers:read');

    const caregivers = await this.repository.findAvailableForShift(
      organizationId,
      branchId,
      dayOfWeek
    );

    return caregivers.map((c) => this.filterSensitiveData(c, context));
  }

  /**
   * Check caregiver eligibility for assignment
   */
  async checkEligibilityForAssignment(
    caregiverId: string,
    clientId: string,
    _shiftDate: Date,
    context: UserContext
  ): Promise<CaregiverEligibility> {
    this.checkPermission(context, 'caregivers:read');

    const caregiver = await this.repository.findById(caregiverId);
    if (!caregiver) {
      throw new NotFoundError(`Caregiver not found: ${caregiverId}`);
    }

    const reasons: EligibilityReason[] = [];
    let isEligible = true;

    // Check compliance status
    if (caregiver.complianceStatus !== 'COMPLIANT') {
      reasons.push({
        type: 'COMPLIANCE',
        message: `Compliance status is ${caregiver.complianceStatus}`,
        severity: 'ERROR',
      });
      isEligible = false;
    }

    // Check employment status
    if (caregiver.employmentStatus !== 'ACTIVE') {
      reasons.push({
        type: 'COMPLIANCE',
        message: `Employment status is ${caregiver.employmentStatus}`,
        severity: 'ERROR',
      });
      isEligible = false;
    }

    // Check status
    if (caregiver.status !== 'ACTIVE') {
      reasons.push({
        type: 'COMPLIANCE',
        message: `Caregiver status is ${caregiver.status}`,
        severity: 'ERROR',
      });
      isEligible = false;
    }

    // Check restricted clients
    if (caregiver.restrictedClients?.includes(clientId)) {
      reasons.push({
        type: 'PREFERENCE',
        message: 'Caregiver is restricted from this client',
        severity: 'ERROR',
      });
      isEligible = false;
    }

    // Check credentials expiration
    const expiredCredentials = caregiver.credentials.filter(
      (cred) =>
        cred.expirationDate &&
        new Date(cred.expirationDate) < new Date() &&
        cred.status === 'ACTIVE'
    );
    if (expiredCredentials.length > 0) {
      reasons.push({
        type: 'COMPLIANCE',
        message: `${expiredCredentials.length} credential(s) expired`,
        severity: 'ERROR',
      });
      isEligible = false;
    }

    // Warning for expiring credentials
    const expiringCredentials = caregiver.credentials.filter(
      (cred) =>
        cred.expirationDate &&
        new Date(cred.expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
        new Date(cred.expirationDate) >= new Date() &&
        cred.status === 'ACTIVE'
    );
    if (expiringCredentials.length > 0) {
      reasons.push({
        type: 'COMPLIANCE',
        message: `${expiringCredentials.length} credential(s) expiring soon`,
        severity: 'WARNING',
      });
    }

    // Info for preferred client
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

  /**
   * Update compliance status
   */
  async updateComplianceStatus(
    caregiverId: string,
    context: UserContext
  ): Promise<Caregiver> {
    this.checkPermission(context, 'caregivers:update');

    const caregiver = await this.repository.findById(caregiverId);
    if (!caregiver) {
      throw new NotFoundError(`Caregiver not found: ${caregiverId}`);
    }

    const complianceStatus = await this.calculateComplianceStatus(caregiver);
    
    return this.repository.updateComplianceStatus(
      caregiverId,
      complianceStatus,
      context
    );
  }

  /**
   * Soft delete a caregiver
   */
  async deleteCaregiver(id: string, context: UserContext): Promise<void> {
    this.checkPermission(context, 'caregivers:delete');

    const caregiver = await this.repository.findById(id);
    if (!caregiver) {
      throw new NotFoundError(`Caregiver not found: ${id}`);
    }

    // Check if caregiver has active assignments (would be in scheduling vertical)
    // For now, just perform the delete
    await this.repository.delete(id, context);
  }

  /**
   * Add service authorization for caregiver
   */
  async addServiceAuthorization(
    caregiverId: string,
    serviceTypeCode: string,
    serviceTypeName: string,
    options: {
      authorizationSource?: string;
      effectiveDate?: Date;
      expirationDate?: Date;
      notes?: string;
    },
    context: UserContext
  ): Promise<string> {
    this.checkPermission(context, 'caregivers:update');

    const caregiver = await this.repository.findById(caregiverId);
    if (!caregiver) {
      throw new NotFoundError(`Caregiver not found: ${caregiverId}`);
    }

    return this.repository.createServiceAuthorization(
      {
        caregiverId,
        serviceTypeCode,
        serviceTypeName,
        authorizationSource: options.authorizationSource,
        effectiveDate: options.effectiveDate || new Date(),
        expirationDate: options.expirationDate,
        notes: options.notes,
      },
      context
    );
  }

  /**
   * Get service authorizations for caregiver
   */
  async getServiceAuthorizations(
    caregiverId: string,
    context: UserContext
  ): Promise<ServiceAuthorization[]> {
    this.checkPermission(context, 'caregivers:read');

    const caregiver = await this.repository.findById(caregiverId);
    if (!caregiver) {
      throw new NotFoundError(`Caregiver not found: ${caregiverId}`);
    }

    return this.repository.getServiceAuthorizations(caregiverId);
  }

  /**
   * Validate caregiver can be assigned to visit
   * Enhanced to check service authorizations and state registrations
   */
  async validateAssignment(
    caregiverId: string,
    serviceTypeCode: string,
    stateJurisdiction: string,
    context: UserContext
  ): Promise<{ eligible: boolean; reasons: string[] }> {
    this.checkPermission(context, 'caregivers:read');

    const caregiver = await this.repository.findById(caregiverId);
    if (!caregiver) {
      throw new NotFoundError(`Caregiver not found: ${caregiverId}`);
    }

    const reasons: string[] = [];

    // Check status
    if (caregiver.status !== 'ACTIVE') {
      reasons.push(`Caregiver status is ${caregiver.status}, not ACTIVE`);
    }

    // Check compliance status
    if (caregiver.complianceStatus !== 'COMPLIANT') {
      reasons.push(`Compliance status is ${caregiver.complianceStatus}`);
    }

    // Check service authorization
    const authorizations = await this.repository.getServiceAuthorizations(caregiverId);
    const hasAuthorization = authorizations.some(
      auth => auth.serviceTypeCode === serviceTypeCode && 
              auth.status === 'ACTIVE' &&
              (!auth.expirationDate || new Date(auth.expirationDate) > new Date())
    );
    if (!hasAuthorization) {
      reasons.push(`Not authorized for service type ${serviceTypeCode}`);
    }

    // Check active credentials
    const hasActiveCredentials = caregiver.credentials.some(
      cred => cred.status === 'ACTIVE' &&
        (!cred.expirationDate || new Date(cred.expirationDate) > new Date())
    );
    if (!hasActiveCredentials) {
      reasons.push('No active credentials on file');
    }

    // Check state-specific registrations if stateJurisdiction is provided
    if (stateJurisdiction) {
      const screenings = await this.repository.getStateScreenings(caregiverId);
      const hasStateClean = screenings.some(
        screening => screening.stateCode === stateJurisdiction &&
                    screening.status === 'CLEARED' &&
                    (!screening.expirationDate || new Date(screening.expirationDate) > new Date())
      );
      if (!hasStateClean) {
        reasons.push(`Missing ${stateJurisdiction} registry clearance or background screening`);
      }
    }

    return {
      eligible: reasons.length === 0,
      reasons
    };
  }

  /**
   * Initiate state-specific background screening
   */
  async initiateBackgroundScreening(
    caregiverId: string,
    stateCode: string,
    screeningType: string,
    context: UserContext
  ): Promise<string> {
    this.checkPermission(context, 'caregivers:update');

    const caregiver = await this.repository.findById(caregiverId);
    if (!caregiver) {
      throw new NotFoundError(`Caregiver not found: ${caregiverId}`);
    }

    // Validate state code
    const validStateCodes = ['TX', 'FL', 'CA', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI'];
    if (!validStateCodes.includes(stateCode)) {
      throw new ValidationError(`Invalid state code: ${stateCode}`, {
        errors: [{ field: 'stateCode', message: 'Must be a valid US state code' }]
      });
    }

    // Validate screening type based on state
    const validScreeningTypes: Record<string, string[]> = {
      TX: ['EMPLOYEE_MISCONDUCT_REGISTRY', 'NURSE_AIDE_REGISTRY', 'DPS_FINGERPRINTING'],
      FL: ['LEVEL_2_BACKGROUND', 'AHCA_CLEARINGHOUSE'],
    };

    const allowedTypes = validScreeningTypes[stateCode] || ['BACKGROUND_CHECK'];
    if (!allowedTypes.includes(screeningType)) {
      throw new ValidationError(`Invalid screening type for ${stateCode}: ${screeningType}`, {
        errors: [{ field: 'screeningType', message: `Must be one of: ${allowedTypes.join(', ')}` }]
      });
    }

    const screeningId = await this.repository.createStateScreening({
      caregiverId,
      stateCode,
      screeningType,
      initiatedBy: context.userId,
      initiatedAt: new Date()
    });

    // External API integration for actual screening will be implemented in future
    // Texas: HHAeXchange API, Employee Misconduct Registry lookup
    // Florida: AHCA Clearinghouse API
    // For now, screening record is created in PENDING status

    return screeningId;
  }

  /**
   * Update background screening result
   */
  async updateBackgroundScreening(
    screeningId: string,
    updates: {
      status?: string;
      completionDate?: Date;
      expirationDate?: Date;
      confirmationNumber?: string;
      clearanceNumber?: string;
      results?: Record<string, unknown>;
      notes?: string;
    },
    context: UserContext
  ): Promise<void> {
    this.checkPermission(context, 'caregivers:update');

    await this.repository.updateStateScreening(screeningId, updates, context);
  }

  /**
   * Get state screenings for caregiver
   */
  async getStateScreenings(
    caregiverId: string,
    context: UserContext
  ): Promise<StateScreening[]> {
    this.checkPermission(context, 'caregivers:read');

    const caregiver = await this.repository.findById(caregiverId);
    if (!caregiver) {
      throw new NotFoundError(`Caregiver not found: ${caregiverId}`);
    }

    return this.repository.getStateScreenings(caregiverId);
  }

  /**
   * Calculate compliance status based on credentials and requirements
   */
  private async calculateComplianceStatus(
    caregiver: Partial<Caregiver>
  ): Promise<ComplianceStatus> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Check for expired credentials
    const hasExpiredCredentials = caregiver.credentials?.some(
      (cred) =>
        cred.expirationDate &&
        new Date(cred.expirationDate) < now &&
        cred.status === 'ACTIVE'
    );
    if (hasExpiredCredentials) {
      return 'EXPIRED';
    }

    // Check for credentials expiring soon
    const hasExpiringCredentials = caregiver.credentials?.some(
      (cred) =>
        cred.expirationDate &&
        new Date(cred.expirationDate) <= thirtyDaysFromNow &&
        new Date(cred.expirationDate) >= now &&
        cred.status === 'ACTIVE'
    );
    if (hasExpiringCredentials) {
      return 'EXPIRING_SOON';
    }

    // Check background check
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
    } else {
      return 'PENDING_VERIFICATION';
    }

    // Check drug screening
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
    } else {
      return 'PENDING_VERIFICATION';
    }

    // Check health screening
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

  /**
   * Get default permissions for a role
   */
  private getDefaultPermissions(role: string): string[] {
    const permissionsByRole: Record<string, string[]> = {
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

  /**
   * Filter sensitive data based on permissions
   */
  private filterSensitiveData(
    caregiver: Caregiver,
    context: UserContext
  ): Caregiver {
    const canViewSensitive =
      context.roles.includes('ORG_ADMIN') ||
      context.roles.includes('HR') ||
      context.roles.includes('SUPER_ADMIN');

    if (!canViewSensitive) {
      // Mask sensitive fields but keep required structure
      // eslint-disable-next-line sonarjs/no-unused-vars -- Intentionally destructure to exclude sensitive fields
      const { ssn: _ssn, alternatePayRates: _alternatePayRates, payrollInfo: _payrollInfo, ...safeCaregiver } = caregiver;
      return {
        ...safeCaregiver,
        payRate: {
          id: 'masked',
          rateType: 'BASE' as const,
          amount: 0,
          unit: 'HOURLY' as const,
          effectiveDate: new Date(),
        },
      };
    }

    return caregiver;
  }

  /**
   * Apply context-based filters (organization, branch access)
   */
  private applyContextFilters(
    filters: CaregiverSearchFilters,
    context: UserContext
  ): CaregiverSearchFilters {
    const effectiveFilters = { ...filters };

    // Always filter by organization
    if (!effectiveFilters.organizationId) {
      effectiveFilters.organizationId = context.organizationId;
    }

    // Apply branch filter if user doesn't have org-wide access
    if (
      !context.roles.includes('ORG_ADMIN') &&
      !context.roles.includes('SUPER_ADMIN') &&
      !effectiveFilters.branchId
    ) {
      // User can only see caregivers in their branches
      // This would need to be handled in the repository query
      // For now, we just note it should be filtered
    }

    return effectiveFilters;
  }

  /**
   * Check if user has required permission
   */
  private checkPermission(context: UserContext, permission: string): void {
    const hasPermission =
      context.roles.includes('SUPER_ADMIN') ||
      context.roles.includes('ORG_ADMIN') ||
      context.permissions.includes(permission) ||
      context.permissions.includes('*');

    if (!hasPermission) {
      throw new PermissionError(`Permission denied: ${permission}`);
    }
  }
}
