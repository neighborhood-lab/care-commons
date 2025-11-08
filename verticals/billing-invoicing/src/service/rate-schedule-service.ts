/**
 * Rate Schedule Service
 *
 * Manages rate schedules for services
 * Handles client-specific, payer-specific, and default rates
 */

import { Pool, PoolClient } from 'pg';
import { UUID } from '@care-commons/core';
import { BillingRepository } from '../repository/billing-repository';
import { RateSchedule } from '../types/billing';

interface Client {
  id: UUID;
  primary_payer_id?: UUID;
}

interface RateScheduleData {
  organizationId: UUID;
  branchId?: UUID;
  name: string;
  serviceId: UUID;
  effectiveDate: Date;
  expirationDate?: Date;
  clientId?: UUID;
  payerId?: UUID;
  unitRate: number;
  unitType: string;
  billingIncrement?: number;
  modifierRates?: Record<string, { type: 'percentage' | 'flat'; value: number }>;
}

export class RateScheduleService {
  constructor(
    private pool: Pool,
    private repository: BillingRepository,
    private clientProvider: any // Would be injected client service
  ) {}

  /**
   * Get applicable rate schedule for a visit
   */
  async getRateSchedule(
    clientId: UUID,
    serviceId: UUID,
    visitDate: Date
  ): Promise<RateSchedule | null> {
    const client = await this.clientProvider.getClient(clientId);

    // Priority order:
    // 1. Client-specific rate (private pay)
    // 2. Payer contract rate (insurance)
    // 3. Default agency rate

    // Check for client-specific rate
    let rateSchedule = await this.repository.getClientRate(
      clientId,
      serviceId,
      visitDate
    );

    if (rateSchedule) {
      return rateSchedule;
    }

    // Check for payer contract rate
    if (client.primary_payer_id) {
      rateSchedule = await this.repository.getPayerContractRate(
        client.primary_payer_id,
        serviceId,
        visitDate
      );

      if (rateSchedule) {
        return rateSchedule;
      }
    }

    // Fall back to default agency rate
    rateSchedule = await this.repository.getDefaultRate(serviceId, visitDate);

    return rateSchedule;
  }

  /**
   * Create rate schedule
   */
  async createRateSchedule(data: RateScheduleData): Promise<RateSchedule> {
    // Validate no overlapping schedules
    const overlapping = await this.repository.findOverlappingSchedules(
      data.serviceId,
      data.effectiveDate,
      data.expirationDate,
      data.clientId || data.payerId
    );

    if (overlapping.length > 0) {
      throw new Error('Overlapping rate schedule exists for this period');
    }

    return this.repository.createRateSchedule(data as any);
  }

  /**
   * Update rate schedule
   */
  async updateRateSchedule(
    scheduleId: UUID,
    updates: Partial<RateSchedule>
  ): Promise<void> {
    const schedule = await this.repository.getRateScheduleById(scheduleId);

    if (!schedule) {
      throw new Error(`Rate schedule ${scheduleId} not found`);
    }

    // Don't allow updates to active schedules with past effective dates
    if (schedule.status === 'ACTIVE' && schedule.effectiveFrom < new Date()) {
      throw new Error('Cannot update active rate schedule with past effective date');
    }

    await this.repository.updateRateSchedule(scheduleId, updates);
  }

  /**
   * Deactivate rate schedule
   */
  async deactivateRateSchedule(
    scheduleId: UUID,
    effectiveDate: Date
  ): Promise<void> {
    const schedule = await this.repository.getRateScheduleById(scheduleId);

    if (!schedule) {
      throw new Error(`Rate schedule ${scheduleId} not found`);
    }

    if (schedule.status !== 'ACTIVE') {
      throw new Error(`Rate schedule is not active (status: ${schedule.status})`);
    }

    await this.repository.updateRateSchedule(scheduleId, {
      status: 'INACTIVE',
      effectiveTo: effectiveDate,
    } as any);
  }

  /**
   * Get all active rate schedules for an organization
   */
  async getActiveRateSchedules(
    organizationId: UUID,
    date: Date = new Date()
  ): Promise<RateSchedule[]> {
    return this.repository.getActiveRateSchedules(organizationId, date);
  }

  /**
   * Get rate schedule history for a service
   */
  async getRateScheduleHistory(
    serviceId: UUID,
    startDate: Date,
    endDate: Date
  ): Promise<RateSchedule[]> {
    return this.repository.getRateScheduleHistory(serviceId, startDate, endDate);
  }
}
