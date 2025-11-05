/**
 * Service for Scheduling & Visit Management
 * 
 * Business logic layer for scheduling operations:
 * - Service pattern management
 * - Schedule generation from patterns
 * - Visit lifecycle management
 * - Caregiver assignment
 * - Conflict detection
 * - Availability checking
 */

import {
  UUID,
  UserContext,
  PaginationParams,
  PaginatedResult,
  ValidationError,
  PermissionError,
  NotFoundError,
  ConflictError,
} from '@care-commons/core';
import { ScheduleRepository } from '../repository/schedule-repository';
import { ScheduleValidator } from '../validation/schedule-validator';
import {
  ServicePattern,
  Visit,
  VisitStatus,
  CreateServicePatternInput,
  UpdateServicePatternInput,
  CreateVisitInput,
  AssignVisitInput,
  UpdateVisitStatusInput,
  CompleteVisitInput,
  VisitSearchFilters,
  ScheduleGenerationOptions,
  CaregiverAvailabilityQuery,
  AvailabilitySlot,
  DayOfWeek,
} from '../types/schedule';
import {
  addDays,
  addWeeks,
  startOfDay,
  endOfDay,
  isBefore,
  isSameDay,
} from 'date-fns';

/**
 * Interface for fetching client address data
 * Allows decoupling from client-demographics vertical
 */
export interface IClientAddressProvider {
  getClientAddress(clientId: UUID): Promise<{
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
    geofenceRadius?: number;
  }>;
}

export class ScheduleService {
  constructor(
    private repository: ScheduleRepository,
    private clientAddressProvider?: IClientAddressProvider
  ) { }

  /**
   * Service Pattern Management
   */

  async createServicePattern(
    input: CreateServicePatternInput,
    context: UserContext
  ): Promise<ServicePattern> {
    // Validate input
    const validated = ScheduleValidator.validateServicePattern(input);
    this.checkPermission(context, 'schedules:create');
    this.checkOrganizationAccess(context, input.organizationId);
    this.checkBranchAccess(context, input.branchId);

    // Business rules validation
    await this.validatePatternBusinessRules(validated);

    // Create pattern - filter out undefined values to satisfy exactOptionalPropertyTypes
    const patternInput = { ...validated };
    for (const key of Object.keys(patternInput)) {
      if (patternInput[key as keyof typeof patternInput] === undefined) {
        delete patternInput[key as keyof typeof patternInput];
      }
    }
    return await this.repository.createServicePattern(patternInput, context);
  }

  async getServicePatternById(
    id: UUID,
    context: UserContext
  ): Promise<ServicePattern> {
    this.checkPermission(context, 'schedules:read');

    const pattern = await this.repository.getServicePatternById(id);
    if (!pattern) {
      throw new NotFoundError('Service pattern not found', { id });
    }

    this.checkOrganizationAccess(context, pattern.organizationId);
    return pattern;
  }

  async updateServicePattern(
    id: UUID,
    input: UpdateServicePatternInput,
    context: UserContext
  ): Promise<ServicePattern> {
    const validated = ScheduleValidator.validateUpdatePattern(input);
    this.checkPermission(context, 'schedules:update');

    const pattern = await this.repository.getServicePatternById(id);
    if (!pattern) {
      throw new NotFoundError('Service pattern not found', { id });
    }

    this.checkOrganizationAccess(context, pattern.organizationId);

    return await this.repository.updateServicePattern(id, validated, context);
  }

  async getPatternsByClient(
    clientId: UUID,
    context: UserContext
  ): Promise<ServicePattern[]> {
    this.checkPermission(context, 'schedules:read');

    const patterns = await this.repository.getPatternsByClient(clientId);

    // Filter by organization access
    return patterns.filter(p =>
      context.organizationId === p.organizationId
    );
  }

  /**
   * Visit Management
   */

  async createVisit(
    input: CreateVisitInput,
    context: UserContext
  ): Promise<Visit> {
    const validated = ScheduleValidator.validateVisit(input);
    this.checkPermission(context, 'visits:create');
    this.checkOrganizationAccess(context, input.organizationId);
    this.checkBranchAccess(context, input.branchId);

    // Validate visit doesn't conflict with existing visits
    await this.validateVisitConflicts(validated);

    // Filter out undefined values to satisfy exactOptionalPropertyTypes
    const visitInput = { ...validated };
    for (const key of Object.keys(visitInput)) {
      if (visitInput[key as keyof typeof visitInput] === undefined) {
        delete visitInput[key as keyof typeof visitInput];
      }
    }
    return await this.repository.createVisit(visitInput, context);
  }

  async getVisitById(id: UUID, context: UserContext): Promise<Visit> {
    this.checkPermission(context, 'visits:read');

    const visit = await this.repository.getVisitById(id);
    if (!visit) {
      throw new NotFoundError('Visit not found', { id });
    }

    this.checkOrganizationAccess(context, visit.organizationId);
    return visit;
  }

  async updateVisitStatus(
    input: UpdateVisitStatusInput,
    context: UserContext
  ): Promise<Visit> {
    ScheduleValidator.validateStatusUpdate(input);
    this.checkPermission(context, 'visits:update');

    const visit = await this.repository.getVisitById(input.visitId);
    if (!visit) {
      throw new NotFoundError('Visit not found', { visitId: input.visitId });
    }

    this.checkOrganizationAccess(context, visit.organizationId);

    // Validate status transition
    this.validateStatusTransition(visit.status, input.newStatus, context);

    return await this.repository.updateVisitStatus(
      input.visitId,
      input.newStatus,
      context,
      input.notes,
      input.reason
    );
  }

  async completeVisit(
    input: CompleteVisitInput,
    context: UserContext
  ): Promise<Visit> {
    ScheduleValidator.validateCompletion(input);
    this.checkPermission(context, 'visits:update');

    const visit = await this.repository.getVisitById(input.visitId);
    if (!visit) {
      throw new NotFoundError('Visit not found', { visitId: input.visitId });
    }

    this.checkOrganizationAccess(context, visit.organizationId);

    // Validate visit is in progress
    if (visit.status !== 'IN_PROGRESS' && visit.status !== 'PAUSED') {
      throw new ValidationError('Visit must be in progress to complete', {
        currentStatus: visit.status,
      });
    }

    // Update to completed status
    return await this.repository.updateVisitStatus(
      input.visitId,
      'COMPLETED',
      context,
      input.completionNotes
    );
  }

  async assignCaregiver(
    input: AssignVisitInput,
    context: UserContext
  ): Promise<Visit> {
    const validated = ScheduleValidator.validateAssignment(input);
    this.checkPermission(context, 'visits:assign');

    const visit = await this.repository.getVisitById(input.visitId);
    if (!visit) {
      throw new NotFoundError('Visit not found', { visitId: input.visitId });
    }

    this.checkOrganizationAccess(context, visit.organizationId);

    // Check if visit can be assigned
    if (!['UNASSIGNED', 'SCHEDULED', 'ASSIGNED'].includes(visit.status)) {
      throw new ValidationError('Visit cannot be assigned in current status', {
        status: visit.status,
      });
    }

    // Check caregiver availability
    const isAvailable = await this.checkCaregiverAvailability({
      caregiverId: input.caregiverId,
      date: visit.scheduledDate,
      startTime: visit.scheduledStartTime,
      endTime: visit.scheduledEndTime,
      includeTravel: true,
    });

    if (!isAvailable) {
      throw new ConflictError('Caregiver is not available for this time slot', {
        caregiverId: input.caregiverId,
        visitId: input.visitId,
      });
    }

    return await this.repository.assignCaregiver(validated, context);
  }

  async searchVisits(
    filters: VisitSearchFilters,
    pagination: PaginationParams,
    context: UserContext
  ): Promise<PaginatedResult<Visit>> {
    const validated = ScheduleValidator.validateSearchFilters(filters);
    this.checkPermission(context, 'visits:read');

    // Enforce organization filtering
    const orgFilters = {
      ...validated,
      organizationId: context.organizationId,
    };

    // Enforce branch filtering if user has limited access
    if (context.roles !== undefined && context.roles !== null && Array.isArray(context.roles) && (context.roles.includes('BRANCH_ADMIN') || context.roles.includes('COORDINATOR'))) {
      orgFilters.branchIds = context.branchIds;
    }

    return await this.repository.searchVisits(orgFilters, pagination);
  }

  async getUnassignedVisits(
    organizationId: UUID,
    branchId: UUID | undefined,
    context: UserContext
  ): Promise<Visit[]> {
    this.checkPermission(context, 'visits:read');
    this.checkOrganizationAccess(context, organizationId);

    if (branchId) {
      this.checkBranchAccess(context, branchId);
    }

    return await this.repository.getUnassignedVisits(organizationId, branchId);
  }

  /**
   * Schedule Generation
   */

  async generateScheduleFromPattern(
    options: ScheduleGenerationOptions,
    context: UserContext
  ): Promise<Visit[]> {
    ScheduleValidator.validateGenerationOptions(options);
    this.checkPermission(context, 'schedules:generate');

    const pattern = await this.repository.getServicePatternById(options.patternId);
    if (!pattern) {
      throw new NotFoundError('Service pattern not found', { patternId: options.patternId });
    }

    this.checkOrganizationAccess(context, pattern.organizationId);

    if (pattern.status !== 'ACTIVE') {
      throw new ValidationError('Can only generate schedule from active patterns', {
        patternStatus: pattern.status,
      });
    }

    // Generate visit dates based on recurrence rule
    const visitDates = this.calculateVisitDates(
      pattern,
      options.startDate,
      options.endDate,
    options.skipHolidays || false
    );

    // Create visits
    const visits: Visit[] = [];
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
        scheduledEndTime: this.calculateEndTime(
          pattern.recurrence.startTime,
          pattern.duration
        ),
        address: await this.getClientAddress(pattern.clientId), // Would need to fetch from client service
        taskIds: pattern.taskTemplateIds,
        requiredSkills: pattern.requiredSkills,
        requiredCertifications: pattern.requiredCertifications,
        clientInstructions: pattern.clientInstructions,
        caregiverInstructions: pattern.caregiverInstructions,
      } as CreateVisitInput;

      const visit = await this.repository.createVisit(visitInput, context);
      visits.push(visit);

      // Auto-assign if requested and preferred caregivers exist
      if (options.autoAssign && pattern.preferredCaregivers && pattern.preferredCaregivers.length > 0) {
        // Try to assign to preferred caregiver
        for (const caregiverId of pattern.preferredCaregivers) {
          try {
            await this.assignCaregiver(
              {
                visitId: visit.id,
                caregiverId,
                assignmentMethod: 'PREFERRED',
              },
              context
            );
            break; // Successfully assigned
          } catch {
            // Try next preferred caregiver
            continue;
          }
        }
      }
    }

    return visits;
  }

  /**
   * Availability Checking
   */

  async checkCaregiverAvailability(
    query: CaregiverAvailabilityQuery
  ): Promise<boolean> {
    const validated = ScheduleValidator.validateAvailabilityQuery(query);

    // Get all visits for the caregiver on that date
    const visits = await this.repository.searchVisits(
      {
        caregiverId: validated.caregiverId,
        dateFrom: validated.date,
        dateTo: validated.date,
        status: ['ASSIGNED', 'CONFIRMED', 'EN_ROUTE', 'IN_PROGRESS'],
      },
      { page: 1, limit: 100 }
    );

    // If no time specified, just check if any visits exist
    if (validated.startTime === undefined || validated.startTime === null || validated.endTime === undefined || validated.endTime === null) {
      return visits.items.length === 0;
    }

    // Check for time conflicts
    const requestedStart = this.timeToMinutes(validated.startTime);
    const requestedEnd = this.timeToMinutes(validated.endTime);

    for (const visit of visits.items) {
      const visitStart = this.timeToMinutes(visit.scheduledStartTime);
      const visitEnd = this.timeToMinutes(visit.scheduledEndTime);

      // Add travel time if requested
      const travelBefore = validated.includeTravel ? (visit.address ? 30 : 0) : 0;
      const travelAfter = validated.includeTravel ? (visit.address ? 30 : 0) : 0;

      const effectiveStart = visitStart - travelBefore;
      const effectiveEnd = visitEnd + travelAfter;

      // Check for overlap
      if (
        (requestedStart >= effectiveStart && requestedStart < effectiveEnd) ||
        (requestedEnd > effectiveStart && requestedEnd <= effectiveEnd) ||
        (requestedStart <= effectiveStart && requestedEnd >= effectiveEnd)
      ) {
        return false; // Conflict found
      }
    }

    return true; // No conflicts
  }

  async getCaregiverAvailabilitySlots(
    query: CaregiverAvailabilityQuery
  ): Promise<AvailabilitySlot[]> {
    // This would integrate with caregiver availability preferences
    // For now, return basic implementation

    const slots: AvailabilitySlot[] = [];
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
        includeTravel: query.includeTravel ?? false,
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

  /**
   * Helper Methods
   */

  private calculateVisitDates(
    pattern: ServicePattern,
    startDate: Date,
    endDate: Date,
    _skipHolidays: boolean
  ): Date[] {
    const dates: Date[] = [];
    const { recurrence } = pattern;

    let currentDate = startOfDay(startDate);
    const finalDate = endOfDay(endDate);

    while (isBefore(currentDate, finalDate) || isSameDay(currentDate, finalDate)) {
      let shouldInclude = false;

      switch (recurrence.frequency) {
        case 'DAILY':
          shouldInclude = true;
          currentDate = addDays(currentDate, recurrence.interval);
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
          currentDate = addDays(currentDate, 1);

          // Skip to next week/biweek at end of week
          if (this.getDayOfWeek(currentDate) === 'MONDAY' && dates.length > 0) {
            const weeksToAdd = recurrence.frequency === 'BIWEEKLY' ? 2 : 1;
            currentDate = addWeeks(currentDate, weeksToAdd - 1);
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
          currentDate = addDays(currentDate, 1);
          continue;

        default:
          currentDate = addDays(currentDate, 1);
          continue;
      }

      if (shouldInclude && recurrence.frequency === 'DAILY') {
        dates.push(new Date(currentDate));
      }
    }

    // TODO: Filter holidays if skipHolidays is true
    // Would need holiday calendar service

    return dates;
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    return days[date.getDay()] as DayOfWeek;
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    return this.addMinutesToTime(startTime, durationMinutes);
  }

  private addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = (hours ?? 0) * 60 + (mins ?? 0) + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  private timeToMinutes(time: string): number {
    const [hours, mins] = time.split(':').map(Number);
    return (hours ?? 0) * 60 + (mins ?? 0);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getClientAddress(clientId: UUID): Promise<any> {
    // Use injected client address provider if available
    if (this.clientAddressProvider) {
      return await this.clientAddressProvider.getClientAddress(clientId);
    }

    // Fallback: Return a placeholder address with a warning
    // In production, this should always use a real ClientAddressProvider
    console.warn(
      `ScheduleService: No ClientAddressProvider configured. Using placeholder address for client ${clientId}. ` +
      'This should only happen in development/testing. ' +
      'Production deployments must inject a ClientAddressProvider.'
    );

    return {
      line1: 'Address not configured',
      city: 'Unknown',
      state: 'XX',
      postalCode: '00000',
      country: 'USA',
      latitude: 0,
      longitude: 0,
      geofenceRadius: 100,
    };
  }

  private async validatePatternBusinessRules(input: CreateServicePatternInput): Promise<void> {
    // Validate authorization dates
    if (input.authorizationEndDate !== undefined && input.authorizationEndDate !== null && input.authorizationStartDate !== undefined && input.authorizationStartDate !== null) {
      if (isBefore(input.authorizationEndDate, input.authorizationStartDate)) {
        throw new ValidationError('Authorization end date must be after start date');
      }
    }

    // Validate recurrence rule
    if (input.recurrence.frequency === 'WEEKLY' && input.recurrence.daysOfWeek?.length === 0) {
      throw new ValidationError('Weekly patterns must specify days of week');
    }

    if (input.recurrence.frequency === 'MONTHLY' && input.recurrence.datesOfMonth?.length === 0) {
      throw new ValidationError('Monthly patterns must specify dates of month');
    }
  }

  private async validateVisitConflicts(input: CreateVisitInput): Promise<void> {
    // Check if client already has a visit at this time
    const existingVisits = await this.repository.searchVisits(
      {
        clientId: input.clientId,
        dateFrom: input.scheduledDate,
        dateTo: input.scheduledDate,
        status: ['SCHEDULED', 'ASSIGNED', 'CONFIRMED', 'IN_PROGRESS'],
      },
      { page: 1, limit: 100 }
    );

    const requestedStart = this.timeToMinutes(input.scheduledStartTime);
    const requestedEnd = this.timeToMinutes(input.scheduledEndTime);

    for (const visit of existingVisits.items) {
      const visitStart = this.timeToMinutes(visit.scheduledStartTime);
      const visitEnd = this.timeToMinutes(visit.scheduledEndTime);

      if (
        (requestedStart >= visitStart && requestedStart < visitEnd) ||
        (requestedEnd > visitStart && requestedEnd <= visitEnd) ||
        (requestedStart <= visitStart && requestedEnd >= visitEnd)
      ) {
        throw new ConflictError('Client already has a visit scheduled at this time', {
          existingVisitId: visit.id,
        });
      }
    }
  }

  private validateStatusTransition(
    currentStatus: VisitStatus,
    newStatus: VisitStatus,
    _context: UserContext
  ): void {
    // Check if transition is valid
    if (!this.isValidStatusTransition(currentStatus, newStatus)) {
      throw new ValidationError(`Invalid status transition from ${currentStatus} to ${newStatus}`, {
        currentStatus,
        requestedStatus: newStatus,
      });
    }
  }

  private isValidStatusTransition(currentStatus: VisitStatus, newStatus: VisitStatus): boolean {
    // Define valid transitions
    const validTransitions: Record<VisitStatus, VisitStatus[]> = {
      DRAFT: ['SCHEDULED', 'CANCELLED'],
      SCHEDULED: ['UNASSIGNED', 'ASSIGNED', 'CANCELLED'],
      UNASSIGNED: ['ASSIGNED', 'CANCELLED'],
      ASSIGNED: ['CONFIRMED', 'EN_ROUTE', 'CANCELLED', 'REJECTED'],
      CONFIRMED: ['EN_ROUTE', 'CANCELLED', 'NO_SHOW_CAREGIVER'],
      EN_ROUTE: ['ARRIVED', 'CANCELLED', 'NO_SHOW_CAREGIVER'],
      ARRIVED: ['IN_PROGRESS', 'NO_SHOW_CLIENT'],
      IN_PROGRESS: ['PAUSED', 'COMPLETED', 'INCOMPLETE'],
      PAUSED: ['IN_PROGRESS', 'COMPLETED', 'INCOMPLETE'],
      COMPLETED: [], // Terminal state
      INCOMPLETE: [], // Terminal state
      CANCELLED: [], // Terminal state
      NO_SHOW_CLIENT: [], // Terminal state
      NO_SHOW_CAREGIVER: ['ASSIGNED'], // Can reassign
      REJECTED: ['ASSIGNED'], // Can reassign
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private checkPermission(context: UserContext, permission: string): void {
    if (!(context.permissions?.includes(permission) && context.roles?.includes('SUPER_ADMIN'))) {
      throw new PermissionError(`Missing required permission: ${permission}`, {
        userId: context.userId,
        permission,
      });
    }
  }

  private checkOrganizationAccess(context: UserContext, organizationId: UUID): void {
    if (context.organizationId !== organizationId && !context.roles?.includes('SUPER_ADMIN')) {
      throw new PermissionError('Access denied to this organization', {
        userOrg: context.organizationId,
        requestedOrg: organizationId,
      });
    }
  }

  private checkBranchAccess(context: UserContext, branchId: UUID): void {
    if (
      !context.branchIds?.includes(branchId) &&
      !context.roles?.includes('SUPER_ADMIN') &&
      !context.roles?.includes('ORG_ADMIN')
    ) {
      throw new PermissionError('Access denied to this branch', {
        userBranches: context.branchIds,
        requestedBranch: branchId,
      });
    }
  }
}
