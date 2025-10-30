/**
 * Payroll Service
 * 
 * Core payroll service implementing SOLID principles
 * Orchestrates payroll operations: timesheet compilation, pay calculation,
 * deduction processing, and payment generation
 */

import { Pool, PoolClient } from 'pg';
import { v4 as uuid } from 'uuid';
import { UUID } from '@care-commons/core';
import { PayrollRepository } from '../repository/payroll-repository';
import { EVVRecord, EVVRecordStatus } from '@care-commons/time-tracking-evv';
import {
  PayPeriod,
  PayRun,
  PayStub,
  TimeSheet,
  TimeSheetEntry,
  TimeSheetAdjustment,
  Deduction,
  PaymentRecord,
  PayPeriodType,
  PayRunType,
  DiscrepancyFlag,
  DiscrepancyType,
  PayRateMultiplier,
} from '../types/payroll';
import {
  calculateOvertimeHours,
  calculateOvertimePay,
  calculateTotalCompensation,
  roundToTwoDecimals,
  applyRateMultipliers,
} from '../utils/pay-calculations';
import {
  calculateFederalIncomeTax,
  calculateStateIncomeTax,
  calculateSocialSecurityTax,
  calculateMedicareTax,
} from '../utils/tax-calculations';

/**
 * Input for creating a pay period
 */
export interface CreatePayPeriodInput {
  organizationId: UUID;
  branchId?: UUID;
  periodNumber: number;
  periodYear: number;
  periodType: PayPeriodType;
  startDate: Date;
  endDate: Date;
  payDate: Date;
  cutoffDate?: Date;
  approvalDeadline?: Date;
  notes?: string;
}

/**
 * Input for compiling timesheet from EVV records
 */
export interface CompileTimeSheetInput {
  organizationId: UUID;
  branchId: UUID;
  payPeriodId: UUID;
  caregiverId: UUID;
  caregiverName: string;
  caregiverEmployeeId: string;
  evvRecordIds: UUID[]; // EVV records to include
  regularRate: number; // Base hourly rate
}

/**
 * Input for creating a pay run
 */
export interface CreatePayRunInput {
  organizationId: UUID;
  branchId?: UUID;
  payPeriodId: UUID;
  runType: PayRunType;
  notes?: string;
}

/**
 * Input for approving timesheets
 */
export interface ApproveTimeSheetInput {
  timeSheetId: UUID;
  approvalNotes?: string;
}

export class PayrollService {
  private repository: PayrollRepository;

  constructor(private pool: Pool) {
    this.repository = new PayrollRepository(pool);
  }

  /**
   * Create a new pay period
   */
  async createPayPeriod(
    input: CreatePayPeriodInput,
    userId: UUID
  ): Promise<PayPeriod> {
    const payPeriod: Omit<PayPeriod, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
      organizationId: input.organizationId,
      branchId: input.branchId,
      periodNumber: input.periodNumber,
      periodYear: input.periodYear,
      periodType: input.periodType,
      startDate: input.startDate,
      endDate: input.endDate,
      payDate: input.payDate,
      status: 'DRAFT',
      statusHistory: [
        {
          id: uuid(),
          fromStatus: null,
          toStatus: 'DRAFT',
          timestamp: new Date(),
          changedBy: userId,
          reason: 'Pay period created',
        },
      ],
      cutoffDate: input.cutoffDate,
      approvalDeadline: input.approvalDeadline,
      notes: input.notes,
      createdBy: userId,
      updatedBy: userId,
    };

    return this.repository.createPayPeriod(payPeriod);
  }

  /**
   * Compile timesheet from EVV records
   * This is where EVV time tracking data becomes payroll data
   */
  async compileTimeSheet(
    input: CompileTimeSheetInput,
    userId: UUID
  ): Promise<TimeSheet> {
    // Fetch EVV records for the pay period
    const evvRecords = await this.fetchEVVRecords(input);
    
    // Convert EVV records to timesheet entries
    const timeEntries = await this.convertEVVToTimeSheetEntries(evvRecords, input);
    
    // Calculate hours and earnings
    const hoursCalculation = this.calculateHours(timeEntries);
    const earningsCalculation = this.calculateEarnings(hoursCalculation, input.regularRate);
    
    // Calculate overtime based on weekly hours
    const overtimeCalculation = this.calculateOvertime(hoursCalculation, input.regularRate);
    
    // Detect discrepancies
    const discrepancies = this.detectTimeSheetDiscrepancies(
      timeEntries,
      overtimeCalculation.totalHours
    );

    const timeSheet: Omit<
      TimeSheet,
      'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt' | 'deletedBy'
    > = {
      organizationId: input.organizationId,
      branchId: input.branchId,
      payPeriodId: input.payPeriodId,
      caregiverId: input.caregiverId,
      caregiverName: input.caregiverName,
      caregiverEmployeeId: input.caregiverEmployeeId,
      timeEntries,
      regularHours: overtimeCalculation.regularHours,
      overtimeHours: overtimeCalculation.overtimeHours,
      doubleTimeHours: overtimeCalculation.doubleTimeHours,
      ptoHours: 0,
      holidayHours: 0,
      sickHours: 0,
      otherHours: 0,
      totalHours: overtimeCalculation.totalHours,
      regularRate: input.regularRate,
      overtimeRate: input.regularRate * 1.5,
      doubleTimeRate: input.regularRate * 2.0,
      regularEarnings: earningsCalculation.regularEarnings,
      overtimeEarnings: earningsCalculation.overtimeEarnings,
      doubleTimeEarnings: earningsCalculation.doubleTimeEarnings,
      ptoEarnings: 0,
      holidayEarnings: 0,
      sickEarnings: 0,
      otherEarnings: 0,
      grossEarnings: earningsCalculation.grossEarnings,
      bonuses: [],
      reimbursements: [],
      adjustments: [],
      totalAdjustments: 0,
      totalGrossPay: earningsCalculation.grossEarnings,
      status: 'DRAFT',
      statusHistory: [
        {
          id: uuid(),
          fromStatus: null,
          toStatus: 'DRAFT',
          timestamp: new Date(),
          changedBy: userId,
          reason: 'Timesheet compiled from EVV records',
        },
      ],
      hasDiscrepancies: discrepancies.length > 0,
      discrepancyFlags: discrepancies,
      evvRecordIds: input.evvRecordIds,
      visitIds: timeEntries.map(entry => entry.visitId),
      createdBy: userId,
      updatedBy: userId,
    };

    return this.repository.createTimeSheet(timeSheet);
  }

  /**
   * Add adjustment to timesheet (bonus, reimbursement, etc.)
   */
  async addTimeSheetAdjustment(
    timeSheetId: UUID,
    adjustment: Omit<TimeSheetAdjustment, 'id' | 'addedAt' | 'addedBy'>,
    userId: UUID
  ): Promise<void> {
    const timeSheet = await this.repository.findTimeSheetById(timeSheetId);
    if (!timeSheet) {
      throw new Error('TimeSheet not found');
    }

    if (timeSheet.status !== 'DRAFT' && timeSheet.status !== 'SUBMITTED') {
      throw new Error(`Cannot add adjustment to timesheet in ${timeSheet.status} status`);
    }

    const fullAdjustment: TimeSheetAdjustment = {
      ...adjustment,
      id: uuid(),
      addedAt: new Date(),
      addedBy: userId,
    };

    // Add adjustment to appropriate category
    let updatedBonuses = timeSheet.bonuses;
    let updatedReimbursements = timeSheet.reimbursements;
    let updatedAdjustments = timeSheet.adjustments;
    let totalAdjustments = timeSheet.totalAdjustments;

    if (adjustment.adjustmentType === 'BONUS') {
      updatedBonuses = [...timeSheet.bonuses, fullAdjustment];
      totalAdjustments += adjustment.amount;
    } else if (adjustment.adjustmentType === 'REIMBURSEMENT' || adjustment.adjustmentType === 'MILEAGE') {
      updatedReimbursements = [...timeSheet.reimbursements, fullAdjustment];
      totalAdjustments += adjustment.amount;
    } else {
      updatedAdjustments = [...timeSheet.adjustments, fullAdjustment];
      totalAdjustments += adjustment.amount;
    }

    // Update the timesheet using the general update method
    const updated: Omit<TimeSheet, 'createdAt' | 'updatedAt' | 'version'> = {
      ...timeSheet,
      bonuses: updatedBonuses,
      reimbursements: updatedReimbursements,
      adjustments: updatedAdjustments,
      totalAdjustments,
      totalGrossPay: timeSheet.grossEarnings + totalAdjustments,
      updatedBy: userId,
    };

    await this.repository.updateTimeSheet(timeSheetId, updated);
  }

  /**
   * Approve timesheet for payroll processing
   */
  async approveTimeSheet(
    input: ApproveTimeSheetInput,
    userId: UUID
  ): Promise<void> {
    const timeSheet = await this.repository.findTimeSheetById(input.timeSheetId);
    if (!timeSheet) {
      throw new Error('TimeSheet not found');
    }

    if (timeSheet.status !== 'SUBMITTED' && timeSheet.status !== 'PENDING_REVIEW') {
      throw new Error(`Cannot approve timesheet in ${timeSheet.status} status`);
    }

    if (timeSheet.hasDiscrepancies) {
      const unresolvedFlags = timeSheet.discrepancyFlags?.filter(
        (flag) => flag.requiresResolution && !flag.resolvedAt
      );
      if (unresolvedFlags && unresolvedFlags.length > 0) {
        throw new Error(
          `Cannot approve timesheet with ${unresolvedFlags.length} unresolved discrepancies`
        );
      }
    }

    const statusChange = {
      id: uuid(),
      fromStatus: timeSheet.status,
      toStatus: 'APPROVED' as const,
      timestamp: new Date(),
      changedBy: userId,
      reason: 'Timesheet approved for payroll',
      notes: input.approvalNotes,
    };

    await this.repository.updateTimeSheet(input.timeSheetId, {
      status: 'APPROVED',
      statusHistory: [...timeSheet.statusHistory, statusChange],
      approvedAt: new Date(),
      approvedBy: userId,
      approvalNotes: input.approvalNotes,
    });
  }

  /**
   * Create pay run and calculate pay stubs for all approved timesheets
   */
  async createPayRun(
    input: CreatePayRunInput,
    userId: UUID
  ): Promise<PayRun> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get pay period
      const payPeriod = await this.repository.findPayPeriodById(input.payPeriodId);
      if (!payPeriod) {
        throw new Error('Pay period not found');
      }

      if (payPeriod.status !== 'LOCKED' && payPeriod.status !== 'PROCESSING') {
        throw new Error(`Pay period must be LOCKED before running payroll (current: ${payPeriod.status})`);
      }

      // Get all approved timesheets for this pay period
      const timesheets = await this.repository.findTimeSheets({
        organizationId: input.organizationId,
        payPeriodId: input.payPeriodId,
        status: ['APPROVED'],
      });

      if (timesheets.length === 0) {
        throw new Error('No approved timesheets found for this pay period');
      }

      // Generate run number
      const runNumber = this.generateRunNumber(payPeriod.periodYear, payPeriod.periodNumber);

      // Calculate pay stubs for each timesheet
      const payStubIds: UUID[] = [];
      let totalGrossPay = 0;
      let totalNetPay = 0;
      let totalDeductions = 0;
      let totalTaxWithheld = 0;

      for (const timesheet of timesheets) {
        const payStub = await this.calculatePayStub(
          timesheet,
          payPeriod,
          userId,
          client
        );
        
        payStubIds.push(payStub.id);
        totalGrossPay += payStub.currentGrossPay;
        totalNetPay += payStub.currentNetPay;
        totalDeductions += payStub.totalOtherDeductions;
        totalTaxWithheld += payStub.totalTaxWithheld;

        // Update timesheet status to PROCESSING
        const statusChange = {
          id: uuid(),
          fromStatus: 'APPROVED' as const,
          toStatus: 'PROCESSING' as const,
          timestamp: new Date(),
          changedBy: userId,
          reason: 'Included in pay run',
        };

        await this.repository.updateTimeSheet(
          timesheet.id,
          {
            status: 'PROCESSING',
            statusHistory: [...timesheet.statusHistory, statusChange],
          }
        );
      }

      // Create pay run
      const payRun: Omit<PayRun, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
        organizationId: input.organizationId,
        branchId: input.branchId,
        payPeriodId: input.payPeriodId,
        payPeriodStartDate: payPeriod.startDate,
        payPeriodEndDate: payPeriod.endDate,
        payDate: payPeriod.payDate,
        runNumber,
        runType: input.runType,
        status: 'CALCULATED',
        statusHistory: [
          {
            id: uuid(),
            fromStatus: null,
            toStatus: 'CALCULATED',
            timestamp: new Date(),
            changedBy: userId,
            automatic: false,
            reason: 'Pay run calculated',
          },
        ],
        initiatedAt: new Date(),
        initiatedBy: userId,
        calculatedAt: new Date(),
        payStubIds,
        totalPayStubs: payStubIds.length,
        totalCaregivers: timesheets.length,
        totalHours: timesheets.reduce((sum, ts) => sum + ts.totalHours, 0),
        totalGrossPay,
        totalDeductions,
        totalTaxWithheld,
        totalNetPay,
        federalIncomeTax: 0, // Would be calculated from pay stubs
        stateIncomeTax: 0,
        socialSecurityTax: 0,
        medicareTax: 0,
        localTax: 0,
        benefitsDeductions: 0,
        garnishments: 0,
        otherDeductions: 0,
        directDepositCount: 0,
        directDepositAmount: 0,
        checkCount: 0,
        checkAmount: 0,
        cashCount: 0,
        cashAmount: 0,
        compliancePassed: true,
        hasErrors: false,
        notes: input.notes,
        createdBy: userId,
        updatedBy: userId,
      };

      const createdPayRun = await this.repository.createPayRun(payRun, client);

      // Update pay period with pay run reference
      await this.repository.updatePayPeriod(
        input.payPeriodId,
        {
          payRunId: createdPayRun.id,
          status: 'PROCESSING',
        }
      );

      await client.query('COMMIT');
      return createdPayRun;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate individual pay stub from timesheet
   * This is where all the tax and deduction calculations happen
   */
  private async calculatePayStub(
    timesheet: TimeSheet,
    payPeriod: PayPeriod,
    userId: UUID,
    client?: PoolClient
  ): Promise<PayStub> {
    // Calculate gross pay
    const grossPay = timesheet.totalGrossPay;

    // Get caregiver's tax configuration
    // In a real implementation, we'd fetch from caregiver record
    const taxConfig = {
      federalExempt: false,
      stateExempt: false,
      federalFilingStatus: 'SINGLE' as const,
      w4Step3Dependents: 0,
      w4Step4aOtherIncome: 0,
      w4Step4bDeductions: 0,
      w4Step4cExtraWithholding: 0,
      stateFilingStatus: 'SINGLE',
      stateAllowances: 0,
      stateAdditionalWithholding: 0,
    };

    // Calculate federal taxes
    // Map pay period type to accepted types
    const periodTypeForTax = payPeriod.periodType === 'DAILY' || payPeriod.periodType === 'CUSTOM'
      ? 'WEEKLY'
      : payPeriod.periodType;

    const federalIncomeTax = calculateFederalIncomeTax(
      grossPay,
      periodTypeForTax,
      taxConfig as any // Simplified for MVP - would construct full TaxConfiguration
    );

    // Calculate state taxes (TX has no state income tax)
    const stateIncomeTax = calculateStateIncomeTax(
      grossPay,
      'TX', // Would come from organization/caregiver record
      taxConfig as any // Simplified for MVP
    );

    // Calculate FICA taxes (YTD would come from caregiver records)
    const socialSecurityTax = calculateSocialSecurityTax(grossPay, 0); // 0 YTD for simplicity
    const medicareTax = calculateMedicareTax(grossPay);

    const totalTaxWithheld =
      federalIncomeTax +
      stateIncomeTax +
      socialSecurityTax +
      medicareTax;

    // Calculate other deductions (benefits, garnishments, etc.)
    // In a real implementation, we'd fetch from caregiver record
    const deductions: Deduction[] = [];
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    // Calculate net pay
    const netPay = grossPay - totalTaxWithheld - totalDeductions;

    // Create pay stub
    const payStub: Omit<
      PayStub,
      'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt' | 'deletedBy'
    > = {
      organizationId: timesheet.organizationId,
      branchId: timesheet.branchId,
      payPeriodId: payPeriod.id,
      payRunId: undefined!, // Will be set by caller
      caregiverId: timesheet.caregiverId,
      caregiverName: timesheet.caregiverName,
      caregiverEmployeeId: timesheet.caregiverEmployeeId,
      checkNumber: undefined, // Will be set when check is printed
      stubNumber: this.generateStubNumber(payPeriod, timesheet.caregiverId),
      payDate: payPeriod.payDate,
      payPeriodStartDate: payPeriod.startDate,
      payPeriodEndDate: payPeriod.endDate,
      timeSheetId: timesheet.id,
      regularHours: timesheet.regularHours,
      overtimeHours: timesheet.overtimeHours,
      doubleTimeHours: timesheet.doubleTimeHours,
      ptoHours: timesheet.ptoHours,
      holidayHours: timesheet.holidayHours,
      sickHours: timesheet.sickHours,
      otherHours: timesheet.otherHours,
      totalHours: timesheet.totalHours,
      regularPay: timesheet.regularEarnings,
      overtimePay: timesheet.overtimeEarnings,
      doubleTimePay: timesheet.doubleTimeEarnings,
      ptoPay: timesheet.ptoEarnings,
      holidayPay: timesheet.holidayEarnings,
      sickPay: timesheet.sickEarnings,
      otherPay: timesheet.otherEarnings,
      bonuses: timesheet.bonuses.reduce((sum, b) => sum + b.amount, 0),
      commissions: 0,
      reimbursements: timesheet.reimbursements.reduce((sum, r) => sum + r.amount, 0),
      retroactivePay: 0,
      otherEarnings: 0,
      currentGrossPay: grossPay,
      yearToDateGrossPay: grossPay, // Would need to calculate actual YTD
      deductions,
      federalIncomeTax,
      stateIncomeTax,
      localIncomeTax: 0,
      socialSecurityTax,
      medicareTax,
      additionalMedicareTax: 0,
      totalTaxWithheld,
      healthInsurance: 0,
      dentalInsurance: 0,
      visionInsurance: 0,
      lifeInsurance: 0,
      retirement401k: 0,
      retirementRoth: 0,
      fsaHealthcare: 0,
      fsaDependentCare: 0,
      hsa: 0,
      garnishments: 0,
      unionDues: 0,
      otherDeductions: 0,
      totalOtherDeductions: totalDeductions,
      currentNetPay: netPay,
      yearToDateNetPay: netPay,
      ytdHours: timesheet.totalHours,
      ytdGrossPay: grossPay,
      ytdFederalTax: federalIncomeTax,
      ytdStateTax: stateIncomeTax,
      ytdSocialSecurity: socialSecurityTax,
      ytdMedicare: medicareTax,
      ytdDeductions: totalDeductions,
      ytdNetPay: netPay,
      paymentMethod: 'DIRECT_DEPOSIT', // Would come from caregiver preference
      status: 'CALCULATED',
      statusHistory: [
        {
          id: uuid(),
          fromStatus: null,
          toStatus: 'CALCULATED',
          timestamp: new Date(),
          changedBy: userId,
          reason: 'Pay stub calculated',
        },
      ],
      calculatedAt: new Date(),
      calculatedBy: userId,
      isVoid: false,
      createdBy: userId,
      updatedBy: userId,
    };

    return this.repository.createPayStub(payStub, client);
  }

  /**
   * Detect discrepancies in timesheet entries
   */
  private detectTimeSheetDiscrepancies(
    entries: TimeSheetEntry[],
    totalHours: number
  ): DiscrepancyFlag[] {
    const flags: DiscrepancyFlag[] = [];

    // Check for excessive hours (>16 hours/day or >80 hours/week)
    if (totalHours > 80) {
      flags.push({
        flagType: 'EXCESSIVE_HOURS',
        severity: 'HIGH',
        description: `Total hours (${totalHours.toFixed(2)}) exceed 80 hours for the period`,
        requiresResolution: true,
      });
    }

    // Check for excessive daily hours
    const dailyHours = new Map<string, number>();
    entries.forEach(entry => {
      const dateKey = entry.workDate.toISOString().split('T')[0];
      dailyHours.set(dateKey, (dailyHours.get(dateKey) || 0) + entry.totalHours);
    });

    dailyHours.forEach((hours, date) => {
      if (hours > 16) {
        flags.push({
          flagType: 'EXCESSIVE_HOURS',
          severity: 'HIGH',
          description: `Excessive hours (${hours.toFixed(2)}) on ${date}`,
          requiresResolution: true,
        });
      }
    });

    // Check for overlapping shifts
    const sortedEntries = [...entries].sort(
      (a, b) => a.clockInTime.getTime() - b.clockInTime.getTime()
    );
    for (let i = 0; i < sortedEntries.length - 1; i++) {
      const current = sortedEntries[i];
      const next = sortedEntries[i + 1];
      if (current.clockOutTime > next.clockInTime) {
        flags.push({
          flagType: 'OVERLAPPING_SHIFTS',
          severity: 'CRITICAL',
          description: `Overlapping shifts: ${current.workDate.toDateString()} and ${next.workDate.toDateString()}`,
          affectedEntryIds: [current.id, next.id],
          requiresResolution: true,
        });
      }
    }

    // Check for missing clock-outs (entries with unusually long duration)
    entries.forEach(entry => {
      const durationHours = (entry.clockOutTime.getTime() - entry.clockInTime.getTime()) / (1000 * 60 * 60);
      if (durationHours > 24) {
        flags.push({
          flagType: 'MISSING_CLOCK_OUT',
          severity: 'HIGH',
          description: `Possible missing clock-out for entry on ${entry.workDate.toDateString()} (${durationHours.toFixed(2)} hours)`,
          affectedEntryIds: [entry.id],
          requiresResolution: true,
        });
      }
    });

    // Check for unusually short shifts (possible data entry errors)
    entries.forEach(entry => {
      if (entry.totalHours < 0.25 && entry.totalHours > 0) {
        flags.push({
          flagType: 'CALCULATION_ERROR',
          severity: 'MEDIUM',
          description: `Unusually short shift (${entry.totalHours.toFixed(2)} hours) on ${entry.workDate.toDateString()}`,
          affectedEntryIds: [entry.id],
          requiresResolution: false,
        });
      }
    });

    // Check for negative hours
    entries.forEach(entry => {
      if (entry.totalHours < 0) {
        flags.push({
          flagType: 'CALCULATION_ERROR',
          severity: 'CRITICAL',
          description: `Negative hours detected for entry on ${entry.workDate.toDateString()}`,
          affectedEntryIds: [entry.id],
          requiresResolution: true,
        });
      }
    });

    // Check for clock-out before clock-in
    entries.forEach(entry => {
      if (entry.clockOutTime < entry.clockInTime) {
        flags.push({
          flagType: 'DATE_MISMATCH',
          severity: 'CRITICAL',
          description: `Clock-out time before clock-in time for entry on ${entry.workDate.toDateString()}`,
          affectedEntryIds: [entry.id],
          requiresResolution: true,
        });
      }
    });

    // Check for entries requiring review
    const entriesNeedingReview = entries.filter(entry => entry.requiresReview);
    if (entriesNeedingReview.length > 0) {
      flags.push({
        flagType: 'RATE_MISMATCH',
        severity: 'MEDIUM',
        description: `${entriesNeedingReview.length} entries require supervisor review`,
        affectedEntryIds: entriesNeedingReview.map(entry => entry.id),
        requiresResolution: true,
      });
    }

    return flags;
  }

  /**
   * Generate pay run number
   */
  private generateRunNumber(year: number, periodNumber: number): string {
    return `${year}-${String(periodNumber).padStart(2, '0')}`;
  }

  /**
   * Generate pay stub number
   */
  private generateStubNumber(payPeriod: PayPeriod, caregiverId: UUID): string {
    const periodCode = `${payPeriod.periodYear}-${String(payPeriod.periodNumber).padStart(2, '0')}`;
    const caregiverCode = caregiverId.substring(0, 8);
    return `${periodCode}-${caregiverCode}`;
  }

  /**
   * Fetch EVV records for timesheet compilation
   */
  private async fetchEVVRecords(input: CompileTimeSheetInput): Promise<any[]> {
    // In a real implementation, this would call the EVV service
    // For now, we'll simulate fetching EVV records
    const mockEVVRecords = input.evvRecordIds.map(id => ({
      id,
      visitId: uuid(),
      organizationId: input.organizationId,
      branchId: input.branchId,
      clientId: uuid(),
      caregiverId: input.caregiverId,
      serviceTypeCode: 'HCBS',
      serviceTypeName: 'Home Care',
      clientName: 'Client Name',
      caregiverName: input.caregiverName,
      caregiverEmployeeId: input.caregiverEmployeeId,
      serviceDate: new Date(),
      clockInTime: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      clockOutTime: new Date(),
      totalDuration: 480, // 8 hours in minutes
      recordStatus: 'COMPLETE' as const,
      verificationLevel: 'FULL' as const,
      complianceFlags: [],
      integrityHash: 'mock-hash',
      integrityChecksum: 'mock-checksum',
      recordedAt: new Date(),
      recordedBy: input.caregiverId,
      syncMetadata: {
        version: 1,
        lastSyncAt: new Date(),
        conflictResolved: false,
      },
    }));

    return mockEVVRecords;
  }

  /**
   * Convert EVV records to timesheet entries
   */
  private async convertEVVToTimeSheetEntries(
    evvRecords: any[],
    input: CompileTimeSheetInput
  ): Promise<TimeSheetEntry[]> {
    return evvRecords.map(evvRecord => {
      const workDate = new Date(evvRecord.serviceDate);
      const clockInTime = new Date(evvRecord.clockInTime);
      const clockOutTime = evvRecord.clockOutTime ? new Date(evvRecord.clockOutTime) : new Date();
      
      // Calculate total hours worked
      const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
      
      // Determine if this is weekend, holiday, or night shift
      const isWeekend = workDate.getDay() === 0 || workDate.getDay() === 6;
      const isNightShift = clockInTime.getHours() >= 20 || clockInTime.getHours() < 6;
      const isHoliday = false; // Would check against holiday calendar
      
      // Calculate rate multipliers
      const appliedMultipliers: PayRateMultiplier[] = [];
      let effectiveRate = input.regularRate;
      
      if (isWeekend) {
        appliedMultipliers.push({
          multiplierType: 'WEEKEND',
          multiplier: 1.25,
          baseRate: input.regularRate,
          appliedAmount: input.regularRate * 0.25,
        });
        effectiveRate *= 1.25;
      }
      
      if (isNightShift) {
        appliedMultipliers.push({
          multiplierType: 'NIGHT_SHIFT',
          multiplier: 1.15,
          baseRate: input.regularRate,
          appliedAmount: input.regularRate * 0.15,
        });
        effectiveRate *= 1.15;
      }
      
      if (isHoliday) {
        appliedMultipliers.push({
          multiplierType: 'HOLIDAY',
          multiplier: 1.5,
          baseRate: input.regularRate,
          appliedAmount: input.regularRate * 0.5,
        });
        effectiveRate *= 1.5;
      }
      
      return {
        id: uuid(),
        visitId: evvRecord.visitId,
        evvRecordId: evvRecord.id,
        clientId: evvRecord.clientId,
        clientName: evvRecord.clientName,
        workDate,
        clockInTime,
        clockOutTime,
        regularHours: totalHours, // Initially all regular, will be adjusted for overtime
        overtimeHours: 0,
        doubleTimeHours: 0,
        breakHours: 0,
        totalHours,
        payRate: effectiveRate,
        payRateType: isWeekend ? 'WEEKEND' : isHoliday ? 'HOLIDAY' : isNightShift ? 'NIGHT_SHIFT' : 'REGULAR',
        isWeekend,
        isHoliday,
        isNightShift,
        isLiveIn: false,
        appliedMultipliers,
        earnings: totalHours * effectiveRate,
        serviceType: evvRecord.serviceTypeName,
        serviceCode: evvRecord.serviceTypeCode,
        isBillable: true,
        requiresReview: evvRecord.complianceFlags.length > 0,
        reviewReason: evvRecord.complianceFlags.length > 0 ? evvRecord.complianceFlags.join(', ') : undefined,
      };
    });
  }

  /**
   * Calculate hours breakdown from timesheet entries
   */
  private calculateHours(timeEntries: TimeSheetEntry[]): {
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    doubleTimeHours: number;
  } {
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
    
    // Federal overtime rules: >40 hours/week = 1.5x
    // Some states have daily overtime: >8 hours/day = 1.5x, >12 hours/day = 2x
    let regularHours = totalHours;
    let overtimeHours = 0;
    let doubleTimeHours = 0;
    
    if (totalHours > 40) {
      overtimeHours = Math.min(totalHours - 40, 8); // Up to 8 hours at 1.5x
      regularHours = 40;
      
      if (totalHours > 48) {
        doubleTimeHours = totalHours - 48; // Anything over 48 hours at 2x
        overtimeHours = 8; // Cap overtime at 8 hours
      }
    }
    
    return {
      totalHours,
      regularHours,
      overtimeHours,
      doubleTimeHours,
    };
  }

  /**
   * Calculate earnings from hours and rates
   */
  private calculateEarnings(
    hoursCalculation: ReturnType<typeof this.calculateHours>,
    regularRate: number
  ): {
    regularEarnings: number;
    overtimeEarnings: number;
    doubleTimeEarnings: number;
    grossEarnings: number;
  } {
    const regularEarnings = hoursCalculation.regularHours * regularRate;
    const overtimeEarnings = hoursCalculation.overtimeHours * (regularRate * 1.5);
    const doubleTimeEarnings = hoursCalculation.doubleTimeHours * (regularRate * 2.0);
    const grossEarnings = regularEarnings + overtimeEarnings + doubleTimeEarnings;
    
    return {
      regularEarnings,
      overtimeEarnings,
      doubleTimeEarnings,
      grossEarnings,
    };
  }

  /**
   * Calculate overtime with proper hour distribution
   */
  private calculateOvertime(
    hoursCalculation: ReturnType<typeof this.calculateHours>,
    regularRate: number
  ): {
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    doubleTimeHours: number;
  } {
    return hoursCalculation;
  }

  /**
   * Approve pay run for payment processing
   */
  async approvePayRun(payRunId: UUID, userId: UUID): Promise<void> {
    const payRun = await this.repository.findPayRunById(payRunId);
    if (!payRun) {
      throw new Error('Pay run not found');
    }

    if (payRun.status !== 'CALCULATED' && payRun.status !== 'PENDING_APPROVAL') {
      throw new Error(`Cannot approve pay run in ${payRun.status} status`);
    }

    if (payRun.hasErrors) {
      throw new Error('Cannot approve pay run with errors');
    }

    const statusChange = {
      id: uuid(),
      fromStatus: payRun.status,
      toStatus: 'APPROVED' as const,
      timestamp: new Date(),
      changedBy: userId,
      automatic: false,
      reason: 'Pay run approved for payment processing',
    };

    await this.repository.updatePayRun(
      payRunId,
      {
        status: 'APPROVED',
        statusHistory: [...payRun.statusHistory, statusChange],
        approvedAt: new Date(),
        approvedBy: userId,
      }
    );
  }

  /**
   * Open pay period for timesheet submission
   */
  async openPayPeriod(payPeriodId: UUID, userId: UUID): Promise<void> {
    const payPeriod = await this.repository.findPayPeriodById(payPeriodId);
    if (!payPeriod) {
      throw new Error('Pay period not found');
    }

    if (payPeriod.status !== 'DRAFT') {
      throw new Error(`Cannot open pay period in ${payPeriod.status} status`);
    }

    const statusChange = {
      id: uuid(),
      fromStatus: 'DRAFT' as const,
      toStatus: 'OPEN' as const,
      timestamp: new Date(),
      changedBy: userId,
      reason: 'Pay period opened for timesheet submission',
    };

    await this.repository.updatePayPeriod(
      payPeriodId,
      {
        status: 'OPEN',
        statusHistory: [...payPeriod.statusHistory, statusChange],
      }
    );
  }

  /**
   * Lock pay period to prevent further timesheet changes
   */
  async lockPayPeriod(payPeriodId: UUID, userId: UUID): Promise<void> {
    const payPeriod = await this.repository.findPayPeriodById(payPeriodId);
    if (!payPeriod) {
      throw new Error('Pay period not found');
    }

    if (payPeriod.status !== 'OPEN') {
      throw new Error(`Cannot lock pay period in ${payPeriod.status} status`);
    }

    const statusChange = {
      id: uuid(),
      fromStatus: 'OPEN' as const,
      toStatus: 'LOCKED' as const,
      timestamp: new Date(),
      changedBy: userId,
      reason: 'Pay period locked for payroll processing',
    };

    await this.repository.updatePayPeriod(
      payPeriodId,
      {
        status: 'LOCKED',
        statusHistory: [...payPeriod.statusHistory, statusChange],
      }
    );
  }
}
