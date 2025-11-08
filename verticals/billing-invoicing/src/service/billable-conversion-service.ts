/**
 * Billable Conversion Service
 *
 * Converts completed visits to billable line items
 * Applies rate schedules, modifiers, and calculates billing amounts
 */

import { UUID } from '@care-commons/core';
import { BillingRepository } from '../repository/billing-repository';

interface Visit {
  id: number;
  clientId: UUID;
  serviceId: UUID;
  scheduledStartTime: Date;
  actualStartTime: Date;
  actualEndTime: Date;
  status: string;
  isLiveIn?: boolean;
  multipleCaregivers?: boolean;
}

interface RateSchedule {
  id: UUID;
  billing_code: string;
  billing_increment: number; // minutes
  rate_per_unit: number;
  modifier_rates?: Record<string, { type: 'percentage' | 'flat'; value: number }>;
}

interface BillableLineItem {
  visitId: number;
  clientId: UUID;
  serviceId: UUID;
  billingCode: string;
  modifiers: string[];
  units: number;
  unitRate: number;
  baseAmount: number;
  adjustedAmount: number;
  billingDate: Date;
  serviceDate: Date;
  description?: string;
}

export class BillableConversionService {
  constructor(
    private repository: BillingRepository,
    private visitProvider: any, // Would be injected visit service
    private clientProvider: any, // Would be injected client service
    private rateScheduleService: any // Would be injected rate schedule service
  ) {}

  /**
   * Convert completed visits to billable line items
   */
  async convertVisitsToBillables(
    visitIds: number[]
  ): Promise<BillableLineItem[]> {
    const billables: BillableLineItem[] = [];

    for (const visitId of visitIds) {
      const visit = await this.visitProvider.getVisit(visitId);

      if (!visit || visit.status !== 'completed') {
        continue;
      }

      // Get applicable rate schedule
      const rateSchedule = await this.getRateSchedule(
        visit.clientId,
        visit.serviceId,
        visit.scheduledStartTime
      );

      if (!rateSchedule) {
        throw new Error(`No rate schedule found for visit ${visitId}`);
      }

      // Calculate billable units (e.g., 15-minute increments)
      const units = this.calculateBillableUnits(
        visit.actualStartTime,
        visit.actualEndTime,
        rateSchedule.billing_increment
      );

      // Apply modifiers based on visit characteristics
      const modifiers = this.determineModifiers(visit);

      // Calculate base amount
      const unitRate = rateSchedule.rate_per_unit;
      const baseAmount = units * unitRate;

      // Apply modifier adjustments
      const adjustedAmount = this.applyModifierAdjustments(
        baseAmount,
        modifiers,
        rateSchedule
      );

      billables.push({
        visitId,
        clientId: visit.clientId,
        serviceId: visit.serviceId,
        billingCode: rateSchedule.billing_code,
        modifiers,
        units,
        unitRate,
        baseAmount,
        adjustedAmount,
        billingDate: new Date(),
        serviceDate: visit.scheduledStartTime,
      });
    }

    return billables;
  }

  /**
   * Calculate billable units based on actual time worked
   * Rounds to billing increment (e.g., 15 minutes)
   */
  calculateBillableUnits(
    startTime: Date,
    endTime: Date,
    billingIncrement: number // minutes
  ): number {
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    // Round to nearest billing increment
    const units = Math.round(durationMinutes / billingIncrement);

    return Math.max(1, units); // Minimum 1 unit
  }

  /**
   * Determine applicable modifiers based on visit characteristics
   * Examples: GT (telehealth), 95 (remote monitoring), GP (PCA services)
   */
  determineModifiers(visit: Visit): string[] {
    const modifiers: string[] = [];

    // Time-based modifiers
    if (this.isWeekend(visit.scheduledStartTime)) {
      modifiers.push('U3'); // Weekend service
    }

    if (this.isAfterHours(visit.scheduledStartTime)) {
      modifiers.push('U4'); // After hours
    }

    // Service-based modifiers
    if (visit.isLiveIn) {
      modifiers.push('U7'); // Live-in care
    }

    if (visit.multipleCaregivers) {
      modifiers.push('U1'); // Multiple caregivers
    }

    return modifiers;
  }

  /**
   * Apply rate adjustments for modifiers
   */
  applyModifierAdjustments(
    baseAmount: number,
    modifiers: string[],
    rateSchedule: RateSchedule
  ): number {
    let adjustedAmount = baseAmount;

    for (const modifier of modifiers) {
      const modifierRate = rateSchedule.modifier_rates?.[modifier];

      if (modifierRate) {
        if (modifierRate.type === 'percentage') {
          adjustedAmount *= (1 + modifierRate.value / 100);
        } else {
          adjustedAmount += modifierRate.value;
        }
      }
    }

    return adjustedAmount;
  }

  /**
   * Get applicable rate schedule for a visit
   */
  private async getRateSchedule(
    clientId: UUID,
    serviceId: UUID,
    visitDate: Date
  ): Promise<RateSchedule | null> {
    // Delegate to rate schedule service
    return this.rateScheduleService.getRateSchedule(
      clientId,
      serviceId,
      visitDate
    );
  }

  /**
   * Check if date is a weekend
   */
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  /**
   * Check if time is after hours (before 7am or after 7pm)
   */
  private isAfterHours(date: Date): boolean {
    const hour = date.getHours();
    return hour < 7 || hour >= 19;
  }
}
