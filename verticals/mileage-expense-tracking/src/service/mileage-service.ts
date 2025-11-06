import type { UUID, UserContext } from '@care-commons/core';
import { PermissionService } from '@care-commons/core';
import type {
  MileageEntry,
  MileageRate,
  CreateMileageEntryInput,
  UpdateMileageEntryInput,
  CreateMileageRateInput,
  MileageQueryFilter,
  MileageSummary,
  DistanceUnit,
} from '../types/mileage.js';
import { MileageRepository, MileageRateRepository } from '../repository/mileage-repository.js';

/**
 * Service for managing mileage entries
 */
export class MileageService {
  constructor(
    private repository: MileageRepository,
    private rateRepository: MileageRateRepository,
    private permissions: PermissionService
  ) {}

  /**
   * Create a new mileage entry
   */
  async createMileage(
    input: CreateMileageEntryInput,
    context: UserContext
  ): Promise<MileageEntry> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'mileage:create')) {
      throw new Error('Insufficient permissions to create mileage entries');
    }

    // Business validation
    if (input.distance <= 0) {
      throw new Error('Distance must be positive');
    }

    if (!input.purpose || input.purpose.trim().length === 0) {
      throw new Error('Purpose is required');
    }

    if (!input.startLocation || input.startLocation.trim().length === 0) {
      throw new Error('Start location is required');
    }

    if (!input.endLocation || input.endLocation.trim().length === 0) {
      throw new Error('End location is required');
    }

    // Validate trip date is not in the future
    const tripDate = new Date(input.tripDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (tripDate > today) {
      throw new Error('Trip date cannot be in the future');
    }

    // Validate odometer readings if provided
    if (
      input.odometerStart !== undefined &&
      input.odometerEnd !== undefined &&
      input.odometerEnd <= input.odometerStart
    ) {
      throw new Error('Odometer end reading must be greater than start reading');
    }

    // Get applicable rate for this trip
    const rateType = input.rateType || 'BUSINESS';
    const rate = await this.rateRepository.getActiveRate(rateType, input.tripDate, context);

    if (!rate) {
      throw new Error(`No active rate found for rate type: ${rateType}`);
    }

    // Calculate amount based on distance and rate
    const distanceUnit = input.distanceUnit || 'MILES';
    const ratePerUnit =
      distanceUnit === 'MILES' ? rate.ratePerMile : rate.ratePerKilometer;
    const calculatedAmount = Math.round(input.distance * ratePerUnit);

    // Create mileage entry with draft status
    const mileage: Partial<MileageEntry> = {
      employeeId: input.employeeId,
      tripDate: input.tripDate,
      startLocation: input.startLocation.trim(),
      endLocation: input.endLocation.trim(),
      distance: input.distance,
      distanceUnit,
      purpose: input.purpose.trim(),
      rateType,
      clientId: input.clientId,
      ratePerUnit,
      calculatedAmount,
      vehicleDescription: input.vehicleDescription?.trim(),
      licensePlate: input.licensePlate?.trim(),
      routeNotes: input.routeNotes?.trim(),
      odometerStart: input.odometerStart,
      odometerEnd: input.odometerEnd,
      status: 'DRAFT',
      organizationId: context.organizationId,
      branchId: context.branchIds[0],
      notes: input.notes?.trim(),
      tags: input.tags,
    };

    return await this.repository.create(mileage, context);
  }

  /**
   * Update a mileage entry
   */
  async updateMileage(
    mileageId: UUID,
    input: UpdateMileageEntryInput,
    context: UserContext
  ): Promise<MileageEntry> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'mileage:update')) {
      throw new Error('Insufficient permissions to update mileage entries');
    }

    // Get existing mileage
    const existing = await this.repository.findById(mileageId, context);
    if (!existing) {
      throw new Error('Mileage entry not found');
    }

    // Can only update draft mileage entries
    if (existing.status !== 'DRAFT') {
      throw new Error('Can only update mileage entries in DRAFT status');
    }

    // Validate updated values
    if (input.distance !== undefined && input.distance <= 0) {
      throw new Error('Distance must be positive');
    }

    if (input.purpose !== undefined && input.purpose.trim().length === 0) {
      throw new Error('Purpose cannot be empty');
    }

    // Build update object
    const updates: Partial<MileageEntry> = {};
    if (input.tripDate !== undefined) updates.tripDate = input.tripDate;
    if (input.startLocation !== undefined) updates.startLocation = input.startLocation.trim();
    if (input.endLocation !== undefined) updates.endLocation = input.endLocation.trim();
    if (input.purpose !== undefined) updates.purpose = input.purpose.trim();
    if (input.clientId !== undefined) updates.clientId = input.clientId;
    if (input.vehicleDescription !== undefined)
      updates.vehicleDescription = input.vehicleDescription.trim();
    if (input.licensePlate !== undefined) updates.licensePlate = input.licensePlate.trim();
    if (input.routeNotes !== undefined) updates.routeNotes = input.routeNotes.trim();
    if (input.odometerStart !== undefined) updates.odometerStart = input.odometerStart;
    if (input.odometerEnd !== undefined) updates.odometerEnd = input.odometerEnd;
    if (input.notes !== undefined) updates.notes = input.notes.trim();
    if (input.tags !== undefined) updates.tags = input.tags;

    // Recalculate amount if distance, distance unit, or rate type changed
    if (
      input.distance !== undefined ||
      input.distanceUnit !== undefined ||
      input.rateType !== undefined
    ) {
      const distance = input.distance ?? existing.distance;
      const distanceUnit = input.distanceUnit ?? existing.distanceUnit;
      const rateType = input.rateType ?? existing.rateType;
      const tripDate = input.tripDate ?? existing.tripDate;

      const rate = await this.rateRepository.getActiveRate(rateType, tripDate, context);
      if (!rate) {
        throw new Error(`No active rate found for rate type: ${rateType}`);
      }

      const ratePerUnit =
        distanceUnit === 'MILES' ? rate.ratePerMile : rate.ratePerKilometer;
      updates.distance = distance;
      updates.distanceUnit = distanceUnit;
      updates.rateType = rateType;
      updates.ratePerUnit = ratePerUnit;
      updates.calculatedAmount = Math.round(distance * ratePerUnit);
    }

    return await this.repository.update(mileageId, updates, context);
  }

  /**
   * Submit mileage entries for approval
   */
  async submitMileage(mileageIds: UUID[], context: UserContext): Promise<MileageEntry[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'mileage:submit')) {
      throw new Error('Insufficient permissions to submit mileage entries');
    }

    if (mileageIds.length === 0) {
      throw new Error('At least one mileage entry must be selected');
    }

    // Validate all mileage entries are in DRAFT status
    const entries = await Promise.all(
      mileageIds.map((id) => this.repository.findById(id, context))
    );

    for (const entry of entries) {
      if (!entry) {
        throw new Error('One or more mileage entries not found');
      }
      if (entry.status !== 'DRAFT') {
        throw new Error(`Mileage entry ${entry.id} is not in DRAFT status`);
      }
    }

    // Update status to SUBMITTED
    const now = new Date().toISOString();
    for (const mileageId of mileageIds) {
      await this.repository.update(
        mileageId,
        { status: 'SUBMITTED', submittedAt: now },
        context
      );
    }

    // Fetch and return updated entries
    return await Promise.all(
      mileageIds.map((id) => this.repository.findById(id, context))
    ) as MileageEntry[];
  }

  /**
   * Approve mileage entries
   */
  async approveMileage(
    mileageIds: UUID[],
    notes: string | undefined,
    context: UserContext
  ): Promise<MileageEntry[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'mileage:approve')) {
      throw new Error('Insufficient permissions to approve mileage entries');
    }

    if (mileageIds.length === 0) {
      throw new Error('At least one mileage entry must be selected');
    }

    // Validate all entries are in SUBMITTED status
    const entries = await Promise.all(
      mileageIds.map((id) => this.repository.findById(id, context))
    );

    for (const entry of entries) {
      if (!entry) {
        throw new Error('One or more mileage entries not found');
      }
      if (entry.status !== 'SUBMITTED') {
        throw new Error(`Mileage entry ${entry.id} is not in SUBMITTED status`);
      }
    }

    // Update status to APPROVED
    const now = new Date().toISOString();
    for (const mileageId of mileageIds) {
      await this.repository.update(
        mileageId,
        {
          status: 'APPROVED',
          approvedBy: context.userId,
          approvedAt: now,
          notes,
        },
        context
      );
    }

    // Fetch and return updated entries
    return await Promise.all(
      mileageIds.map((id) => this.repository.findById(id, context))
    ) as MileageEntry[];
  }

  /**
   * Reject mileage entries
   */
  async rejectMileage(
    mileageIds: UUID[],
    rejectionReason: string,
    context: UserContext
  ): Promise<MileageEntry[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'mileage:approve')) {
      throw new Error('Insufficient permissions to reject mileage entries');
    }

    if (mileageIds.length === 0) {
      throw new Error('At least one mileage entry must be selected');
    }

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    // Validate all entries are in SUBMITTED status
    const entries = await Promise.all(
      mileageIds.map((id) => this.repository.findById(id, context))
    );

    for (const entry of entries) {
      if (!entry) {
        throw new Error('One or more mileage entries not found');
      }
      if (entry.status !== 'SUBMITTED') {
        throw new Error(`Mileage entry ${entry.id} is not in SUBMITTED status`);
      }
    }

    // Update status to REJECTED
    for (const mileageId of mileageIds) {
      await this.repository.update(
        mileageId,
        {
          status: 'REJECTED',
          rejectionReason: rejectionReason.trim(),
        },
        context
      );
    }

    // Fetch and return updated entries
    return await Promise.all(
      mileageIds.map((id) => this.repository.findById(id, context))
    ) as MileageEntry[];
  }

  /**
   * Mark mileage entries as paid
   */
  async markMileagePaid(
    mileageIds: UUID[],
    paymentReference: string | undefined,
    context: UserContext
  ): Promise<MileageEntry[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'mileage:pay')) {
      throw new Error('Insufficient permissions to mark mileage as paid');
    }

    if (mileageIds.length === 0) {
      throw new Error('At least one mileage entry must be selected');
    }

    // Validate all entries are in APPROVED status
    const entries = await Promise.all(
      mileageIds.map((id) => this.repository.findById(id, context))
    );

    for (const entry of entries) {
      if (!entry) {
        throw new Error('One or more mileage entries not found');
      }
      if (entry.status !== 'APPROVED') {
        throw new Error(`Mileage entry ${entry.id} is not in APPROVED status`);
      }
    }

    // Update status to PAID
    const now = new Date().toISOString();
    for (const mileageId of mileageIds) {
      await this.repository.update(
        mileageId,
        {
          status: 'PAID',
          paidAt: now,
          paymentReference,
        },
        context
      );
    }

    // Fetch and return updated entries
    return await Promise.all(
      mileageIds.map((id) => this.repository.findById(id, context))
    ) as MileageEntry[];
  }

  /**
   * Get mileage entry by ID
   */
  async getMileageById(mileageId: UUID, context: UserContext): Promise<MileageEntry | null> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'mileage:view')) {
      throw new Error('Insufficient permissions to view mileage entries');
    }

    return await this.repository.findById(mileageId, context);
  }

  /**
   * Get mileage entries for an employee
   */
  async getEmployeeMileage(employeeId: UUID, context: UserContext): Promise<MileageEntry[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'mileage:view')) {
      throw new Error('Insufficient permissions to view mileage entries');
    }

    return await this.repository.findByEmployee(employeeId, context);
  }

  /**
   * Get mileage entries for a client
   */
  async getClientMileage(clientId: UUID, context: UserContext): Promise<MileageEntry[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'mileage:view')) {
      throw new Error('Insufficient permissions to view mileage entries');
    }

    return await this.repository.findByClient(clientId, context);
  }

  /**
   * Query mileage entries with filters
   */
  async queryMileage(
    filter: MileageQueryFilter,
    context: UserContext
  ): Promise<MileageEntry[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'mileage:view')) {
      throw new Error('Insufficient permissions to view mileage entries');
    }

    return await this.repository.findWithFilters(filter, context);
  }

  /**
   * Get mileage summary
   */
  async getMileageSummary(
    filter: MileageQueryFilter,
    context: UserContext
  ): Promise<MileageSummary> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'mileage:view')) {
      throw new Error('Insufficient permissions to view mileage entries');
    }

    return await this.repository.getSummary(filter, context);
  }

  /**
   * Delete a mileage entry (only drafts can be deleted)
   */
  async deleteMileage(mileageId: UUID, context: UserContext): Promise<void> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'mileage:delete')) {
      throw new Error('Insufficient permissions to delete mileage entries');
    }

    // Get existing mileage
    const existing = await this.repository.findById(mileageId, context);
    if (!existing) {
      throw new Error('Mileage entry not found');
    }

    // Can only delete draft entries
    if (existing.status !== 'DRAFT') {
      throw new Error('Can only delete mileage entries in DRAFT status');
    }

    await this.repository.delete(mileageId, context);
  }

  /**
   * Create a new mileage rate
   */
  async createRate(input: CreateMileageRateInput, context: UserContext): Promise<MileageRate> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'mileage-rates:create')) {
      throw new Error('Insufficient permissions to create mileage rates');
    }

    // Validate rate values
    if (input.ratePerMile <= 0 || input.ratePerKilometer <= 0) {
      throw new Error('Rates must be positive');
    }

    // Create rate
    const rate: Partial<MileageRate> = {
      rateType: input.rateType,
      ratePerMile: input.ratePerMile,
      ratePerKilometer: input.ratePerKilometer,
      effectiveDate: input.effectiveDate,
      endDate: input.endDate,
      organizationId: context.organizationId,
      isDefault: input.isDefault ?? false,
      description: input.description?.trim(),
    };

    return await this.rateRepository.create(rate, context);
  }

  /**
   * Get active rate for a specific rate type and date
   */
  async getActiveRate(
    rateType: string,
    date: string,
    context: UserContext
  ): Promise<MileageRate | null> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'mileage-rates:view')) {
      throw new Error('Insufficient permissions to view mileage rates');
    }

    return await this.rateRepository.getActiveRate(rateType as any, date, context);
  }

  /**
   * Get all active rates for a specific date
   */
  async getActiveRates(date: string, context: UserContext): Promise<MileageRate[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'mileage-rates:view')) {
      throw new Error('Insufficient permissions to view mileage rates');
    }

    return await this.rateRepository.getActiveRates(date, context);
  }
}
