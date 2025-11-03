/**
 * Payroll repository layer
 *
 * Database access for payroll entities
 */

import { Pool, PoolClient } from 'pg';
import { v4 as uuid } from 'uuid';
import { UUID } from '@care-commons/core';
import {
  PayPeriod,
  PayRun,
  PayStub,
  TimeSheet,
  PaymentRecord,
  TaxConfiguration,
  ACHBatch,
  Deduction,
  PayPeriodSearchFilters,
  TimeSheetSearchFilters,
  PayStubSearchFilters,
  PaymentSearchFilters,
  PaymentMethod,
  CheckStatus,
} from '../types/payroll';

export class PayrollRepository {
  constructor(private pool: Pool) {}

  /**
   * PAY PERIOD OPERATIONS
   */

  async createPayPeriod(
    period: Omit<PayPeriod, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
    client?: PoolClient
  ): Promise<PayPeriod> {
    const db = client || this.pool;
    const id = uuid();
    const now = new Date();

    const result = await db.query(
      `
      INSERT INTO pay_periods (
        id, organization_id, branch_id,
        period_number, period_year, period_type,
        start_date, end_date, pay_date,
        status, status_history,
        cutoff_date, approval_deadline,
        pay_run_id,
        total_caregivers, total_hours, total_gross_pay, total_net_pay,
        total_tax_withheld, total_deductions,
        notes, fiscal_quarter, fiscal_year,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28
      )
      RETURNING *
      `,
      [
        id,
        period.organizationId,
        period.branchId || null,
        period.periodNumber,
        period.periodYear,
        period.periodType,
        period.startDate,
        period.endDate,
        period.payDate,
        period.status,
        JSON.stringify(period.statusHistory || []),
        period.cutoffDate || null,
        period.approvalDeadline || null,
        period.payRunId || null,
        period.totalCaregivers || null,
        period.totalHours || null,
        period.totalGrossPay || null,
        period.totalNetPay || null,
        period.totalTaxWithheld || null,
        period.totalDeductions || null,
        period.notes || null,
        period.fiscalQuarter || null,
        period.fiscalYear || null,
        now,
        period.createdBy,
        now,
        period.updatedBy,
        1,
      ]
    );

    return this.mapPayPeriod(result.rows[0]);
  }

  async findPayPeriodById(id: UUID): Promise<PayPeriod | null> {
    const result = await this.pool.query('SELECT * FROM pay_periods WHERE id = $1', [id]);
    return result.rows[0] ? this.mapPayPeriod(result.rows[0]) : null;
  }

  async findPayPeriodByDate(organizationId: UUID, date: Date): Promise<PayPeriod | null> {
    const result = await this.pool.query(
      `SELECT * FROM pay_periods 
       WHERE organization_id = $1 
       AND start_date <= $2 
       AND end_date >= $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [organizationId, date]
    );
    return result.rows[0] ? this.mapPayPeriod(result.rows[0]) : null;
  }

  async findPayPeriods(filters: PayPeriodSearchFilters): Promise<PayPeriod[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramIndex++}`);
      params.push(filters.organizationId);
    }

    if (filters.branchId) {
      conditions.push(`branch_id = $${paramIndex++}`);
      params.push(filters.branchId);
    }

    if (filters.periodType && filters.periodType.length > 0) {
      conditions.push(`period_type = ANY($${paramIndex++})`);
      params.push(filters.periodType);
    }

    if (filters.status && filters.status.length > 0) {
      conditions.push(`status = ANY($${paramIndex++})`);
      params.push(filters.status);
    }

    if (filters.year) {
      conditions.push(`period_year = $${paramIndex++}`);
      params.push(filters.year);
    }

    if (filters.startDate) {
      conditions.push(`start_date >= $${paramIndex++}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`end_date <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.pool.query(
      `SELECT * FROM pay_periods ${whereClause} ORDER BY start_date DESC`,
      params
    );

    return result.rows.map(this.mapPayPeriod);
  }

  async updatePayPeriod(id: UUID, updates: Partial<PayPeriod>): Promise<PayPeriod | null> {
    const existing = await this.findPayPeriodById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      params.push(updates.status);
    }

    if (updates.statusHistory !== undefined) {
      fields.push(`status_history = $${paramIndex++}`);
      params.push(JSON.stringify(updates.statusHistory));
    }

    if (updates.payRunId !== undefined) {
      fields.push(`pay_run_id = $${paramIndex++}`);
      params.push(updates.payRunId);
    }

    if (updates.totalCaregivers !== undefined) {
      fields.push(`total_caregivers = $${paramIndex++}`);
      params.push(updates.totalCaregivers);
    }

    if (updates.totalHours !== undefined) {
      fields.push(`total_hours = $${paramIndex++}`);
      params.push(updates.totalHours);
    }

    if (updates.totalGrossPay !== undefined) {
      fields.push(`total_gross_pay = $${paramIndex++}`);
      params.push(updates.totalGrossPay);
    }

    if (updates.totalNetPay !== undefined) {
      fields.push(`total_net_pay = $${paramIndex++}`);
      params.push(updates.totalNetPay);
    }

    if (updates.totalTaxWithheld !== undefined) {
      fields.push(`total_tax_withheld = $${paramIndex++}`);
      params.push(updates.totalTaxWithheld);
    }

    if (updates.totalDeductions !== undefined) {
      fields.push(`total_deductions = $${paramIndex++}`);
      params.push(updates.totalDeductions);
    }

    if (fields.length === 0) return existing;

    fields.push(`updated_at = $${paramIndex++}`);
    params.push(new Date());
    fields.push(`version = version + 1`);
    params.push(id);

    const result = await this.pool.query(
      `UPDATE pay_periods SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return result.rows[0] ? this.mapPayPeriod(result.rows[0]) : null;
  }

  /**
   * TIME SHEET OPERATIONS
   */

  async createTimeSheet(
    sheet: Omit<
      TimeSheet,
      'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt' | 'deletedBy'
    >,
    client?: PoolClient
  ): Promise<TimeSheet> {
    const db = client || this.pool;
    const id = uuid();
    const now = new Date();

    const result = await db.query(
      `
      INSERT INTO time_sheets (
        id, organization_id, branch_id,
        pay_period_id, caregiver_id, caregiver_name, caregiver_employee_id,
        time_entries,
        regular_hours, overtime_hours, double_time_hours, pto_hours,
        holiday_hours, sick_hours, other_hours, total_hours,
        regular_rate, overtime_rate, double_time_rate,
        regular_earnings, overtime_earnings, double_time_earnings,
        pto_earnings, holiday_earnings, sick_earnings, other_earnings, gross_earnings,
        bonuses, reimbursements, adjustments, total_adjustments,
        total_gross_pay,
        status, status_history,
        submitted_at, submitted_by, approved_at, approved_by, approval_notes,
        has_discrepancies, discrepancy_flags,
        evv_record_ids, visit_ids,
        notes, review_notes,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46, $47, $48, $49
      )
      RETURNING *
      `,
      [
        id,
        sheet.organizationId,
        sheet.branchId,
        sheet.payPeriodId,
        sheet.caregiverId,
        sheet.caregiverName,
        sheet.caregiverEmployeeId,
        JSON.stringify(sheet.timeEntries),
        sheet.regularHours,
        sheet.overtimeHours,
        sheet.doubleTimeHours,
        sheet.ptoHours,
        sheet.holidayHours,
        sheet.sickHours,
        sheet.otherHours,
        sheet.totalHours,
        sheet.regularRate,
        sheet.overtimeRate,
        sheet.doubleTimeRate,
        sheet.regularEarnings,
        sheet.overtimeEarnings,
        sheet.doubleTimeEarnings,
        sheet.ptoEarnings,
        sheet.holidayEarnings,
        sheet.sickEarnings,
        sheet.otherEarnings,
        sheet.grossEarnings,
        JSON.stringify(sheet.bonuses),
        JSON.stringify(sheet.reimbursements),
        JSON.stringify(sheet.adjustments),
        sheet.totalAdjustments,
        sheet.totalGrossPay,
        sheet.status,
        JSON.stringify(sheet.statusHistory || []),
        sheet.submittedAt || null,
        sheet.submittedBy || null,
        sheet.approvedAt || null,
        sheet.approvedBy || null,
        sheet.approvalNotes || null,
        sheet.hasDiscrepancies,
        JSON.stringify(sheet.discrepancyFlags || []),
        JSON.stringify(sheet.evvRecordIds),
        JSON.stringify(sheet.visitIds),
        sheet.notes || null,
        sheet.reviewNotes || null,
        now,
        sheet.createdBy,
        now,
        sheet.updatedBy,
        1,
      ]
    );

    return this.mapTimeSheet(result.rows[0]);
  }

  async findTimeSheetById(id: UUID): Promise<TimeSheet | null> {
    const result = await this.pool.query(
      'SELECT * FROM time_sheets WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] ? this.mapTimeSheet(result.rows[0]) : null;
  }

  async findTimeSheetByCaregiver(caregiverId: UUID, payPeriodId: UUID): Promise<TimeSheet | null> {
    const result = await this.pool.query(
      `SELECT * FROM time_sheets 
       WHERE caregiver_id = $1 
       AND pay_period_id = $2 
       AND deleted_at IS NULL
       LIMIT 1`,
      [caregiverId, payPeriodId]
    );
    return result.rows[0] ? this.mapTimeSheet(result.rows[0]) : null;
  }

  async findTimeSheets(filters: TimeSheetSearchFilters): Promise<TimeSheet[]> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramIndex++}`);
      params.push(filters.organizationId);
    }

    if (filters.branchId) {
      conditions.push(`branch_id = $${paramIndex++}`);
      params.push(filters.branchId);
    }

    if (filters.payPeriodId) {
      conditions.push(`pay_period_id = $${paramIndex++}`);
      params.push(filters.payPeriodId);
    }

    if (filters.caregiverId) {
      conditions.push(`caregiver_id = $${paramIndex++}`);
      params.push(filters.caregiverId);
    }

    if (filters.status && filters.status.length > 0) {
      conditions.push(`status = ANY($${paramIndex++})`);
      params.push(filters.status);
    }

    if (filters.hasDiscrepancies !== undefined) {
      conditions.push(`has_discrepancies = $${paramIndex++}`);
      params.push(filters.hasDiscrepancies);
    }

    if (filters.requiresApproval) {
      conditions.push(`status IN ('SUBMITTED', 'PENDING_REVIEW')`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const result = await this.pool.query(
      `SELECT * FROM time_sheets ${whereClause} ORDER BY created_at DESC`,
      params
    );

    return result.rows.map(this.mapTimeSheet);
  }

  async updateTimeSheet(id: UUID, updates: Partial<TimeSheet>): Promise<TimeSheet | null> {
    const existing = await this.findTimeSheetById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      params.push(updates.status);
    }

    if (updates.statusHistory !== undefined) {
      fields.push(`status_history = $${paramIndex++}`);
      params.push(JSON.stringify(updates.statusHistory));
    }

    if (updates.approvedAt !== undefined) {
      fields.push(`approved_at = $${paramIndex++}`);
      params.push(updates.approvedAt);
    }

    if (updates.approvedBy !== undefined) {
      fields.push(`approved_by = $${paramIndex++}`);
      params.push(updates.approvedBy);
    }

    if (updates.approvalNotes !== undefined) {
      fields.push(`approval_notes = $${paramIndex++}`);
      params.push(updates.approvalNotes);
    }

    if (fields.length === 0) return existing;

    fields.push(`updated_at = $${paramIndex++}`);
    params.push(new Date());
    fields.push(`version = version + 1`);
    params.push(id);

    const result = await this.pool.query(
      `UPDATE time_sheets SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return result.rows[0] ? this.mapTimeSheet(result.rows[0]) : null;
  }

  /**
   * PAY RUN OPERATIONS
   */

  async createPayRun(
    run: Omit<PayRun, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
    client?: PoolClient
  ): Promise<PayRun> {
    const db = client || this.pool;
    const id = uuid();
    const now = new Date();

    const result = await db.query(
      `
      INSERT INTO pay_runs (
        id, organization_id, branch_id,
        pay_period_id, pay_period_start_date, pay_period_end_date, pay_date,
        run_number, run_type,
        status, status_history,
        initiated_at, initiated_by, calculated_at, approved_at, approved_by,
        processed_at, processed_by,
        pay_stub_ids, total_pay_stubs,
        total_caregivers, total_hours, total_gross_pay, total_deductions,
        total_tax_withheld, total_net_pay,
        federal_income_tax, state_income_tax, social_security_tax,
        medicare_tax, local_tax,
        benefits_deductions, garnishments, other_deductions,
        direct_deposit_count, direct_deposit_amount,
        check_count, check_amount,
        cash_count, cash_amount,
        payroll_register_url, tax_report_url, export_files,
        compliance_checks, compliance_passed,
        has_errors, errors, warnings,
        notes, internal_notes,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51
      )
      RETURNING *
      `,
      [
        id,
        run.organizationId,
        run.branchId || null,
        run.payPeriodId,
        run.payPeriodStartDate,
        run.payPeriodEndDate,
        run.payDate,
        run.runNumber,
        run.runType,
        run.status,
        JSON.stringify(run.statusHistory || []),
        run.initiatedAt || null,
        run.initiatedBy || null,
        run.calculatedAt || null,
        run.approvedAt || null,
        run.approvedBy || null,
        run.processedAt || null,
        run.processedBy || null,
        JSON.stringify(run.payStubIds),
        run.totalPayStubs,
        run.totalCaregivers,
        run.totalHours,
        run.totalGrossPay,
        run.totalDeductions,
        run.totalTaxWithheld,
        run.totalNetPay,
        run.federalIncomeTax,
        run.stateIncomeTax,
        run.socialSecurityTax,
        run.medicareTax,
        run.localTax,
        run.benefitsDeductions,
        run.garnishments,
        run.otherDeductions,
        run.directDepositCount,
        run.directDepositAmount,
        run.checkCount,
        run.checkAmount,
        run.cashCount,
        run.cashAmount,
        run.payrollRegisterUrl || null,
        run.taxReportUrl || null,
        JSON.stringify(run.exportFiles || []),
        JSON.stringify(run.complianceChecks || []),
        run.compliancePassed,
        run.hasErrors,
        JSON.stringify(run.errors || []),
        JSON.stringify(run.warnings || []),
        run.notes || null,
        run.internalNotes || null,
        now,
        run.createdBy,
        now,
        run.updatedBy,
        1,
      ]
    );

    return this.mapPayRun(result.rows[0]);
  }

  async findPayRunById(id: UUID): Promise<PayRun | null> {
    const result = await this.pool.query('SELECT * FROM pay_runs WHERE id = $1', [id]);
    return result.rows[0] ? this.mapPayRun(result.rows[0]) : null;
  }

  async findPayRunsByPeriod(payPeriodId: UUID): Promise<PayRun[]> {
    const result = await this.pool.query(
      'SELECT * FROM pay_runs WHERE pay_period_id = $1 ORDER BY created_at DESC',
      [payPeriodId]
    );
    return result.rows.map(this.mapPayRun);
  }

  async updatePayRun(id: UUID, updates: Partial<PayRun>): Promise<PayRun | null> {
    const existing = await this.findPayRunById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      params.push(updates.status);
    }

    if (updates.statusHistory !== undefined) {
      fields.push(`status_history = $${paramIndex++}`);
      params.push(JSON.stringify(updates.statusHistory));
    }

    if (updates.calculatedAt !== undefined) {
      fields.push(`calculated_at = $${paramIndex++}`);
      params.push(updates.calculatedAt);
    }

    if (updates.approvedAt !== undefined) {
      fields.push(`approved_at = $${paramIndex++}`);
      params.push(updates.approvedAt);
    }

    if (updates.approvedBy !== undefined) {
      fields.push(`approved_by = $${paramIndex++}`);
      params.push(updates.approvedBy);
    }

    if (updates.processedAt !== undefined) {
      fields.push(`processed_at = $${paramIndex++}`);
      params.push(updates.processedAt);
    }

    if (updates.processedBy !== undefined) {
      fields.push(`processed_by = $${paramIndex++}`);
      params.push(updates.processedBy);
    }

    if (fields.length === 0) return existing;

    fields.push(`updated_at = $${paramIndex++}`);
    params.push(new Date());
    fields.push(`version = version + 1`);
    params.push(id);

    const result = await this.pool.query(
      `UPDATE pay_runs SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return result.rows[0] ? this.mapPayRun(result.rows[0]) : null;
  }

  /**
   * PAY STUB OPERATIONS
   */

  async createPayStub(
    stub: Omit<PayStub, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
    client?: PoolClient
  ): Promise<PayStub> {
    const db = client || this.pool;
    const id = uuid();
    const now = new Date();

    const result = await db.query(
      `
      INSERT INTO pay_stubs (
        id, organization_id, branch_id,
        pay_run_id, pay_period_id, caregiver_id, time_sheet_id,
        caregiver_name, caregiver_employee_id, caregiver_address,
        pay_period_start_date, pay_period_end_date, pay_date,
        stub_number,
        regular_hours, overtime_hours, double_time_hours, pto_hours,
        holiday_hours, sick_hours, other_hours, total_hours,
        regular_pay, overtime_pay, double_time_pay, pto_pay,
        holiday_pay, sick_pay, other_pay,
        bonuses, commissions, reimbursements, retroactive_pay, other_earnings,
        current_gross_pay, year_to_date_gross_pay,
        deductions,
        federal_income_tax, state_income_tax, local_income_tax,
        social_security_tax, medicare_tax, additional_medicare_tax, total_tax_withheld,
        health_insurance, dental_insurance, vision_insurance, life_insurance,
        retirement_401k, retirement_roth, fsa_healthcare, fsa_dependent_care,
        hsa, garnishments, union_dues, other_deductions, total_other_deductions,
        current_net_pay, year_to_date_net_pay,
        ytd_hours, ytd_gross_pay, ytd_federal_tax, ytd_state_tax,
        ytd_social_security, ytd_medicare, ytd_deductions, ytd_net_pay,
        payment_method, payment_id,
        bank_account_id, bank_account_last4,
        check_number, check_date, check_status,
        status, status_history,
        calculated_at, calculated_by, approved_at, approved_by,
        delivered_at, delivery_method, viewed_at,
        pdf_url, pdf_generated_at,
        is_void, void_reason, voided_at, voided_by,
        notes, internal_notes,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
        $51, $52, $53, $54, $55, $56, $57, $58, $59, $60,
        $61, $62, $63, $64, $65, $66, $67, $68, $69, $70,
        $71, $72, $73, $74, $75, $76, $77, $78, $79, $80, $81
      )
      RETURNING *
      `,
      [
        id,
        stub.organizationId,
        stub.branchId,
        stub.payRunId,
        stub.payPeriodId,
        stub.caregiverId,
        stub.timeSheetId,
        stub.caregiverName,
        stub.caregiverEmployeeId,
        stub.caregiverAddress ? JSON.stringify(stub.caregiverAddress) : null,
        stub.payPeriodStartDate,
        stub.payPeriodEndDate,
        stub.payDate,
        stub.stubNumber,
        stub.regularHours,
        stub.overtimeHours,
        stub.doubleTimeHours,
        stub.ptoHours,
        stub.holidayHours,
        stub.sickHours,
        stub.otherHours,
        stub.totalHours,
        stub.regularPay,
        stub.overtimePay,
        stub.doubleTimePay,
        stub.ptoPay,
        stub.holidayPay,
        stub.sickPay,
        stub.otherPay,
        stub.bonuses,
        stub.commissions,
        stub.reimbursements,
        stub.retroactivePay,
        stub.otherEarnings,
        stub.currentGrossPay,
        stub.yearToDateGrossPay,
        JSON.stringify(stub.deductions),
        stub.federalIncomeTax,
        stub.stateIncomeTax,
        stub.localIncomeTax,
        stub.socialSecurityTax,
        stub.medicareTax,
        stub.additionalMedicareTax,
        stub.totalTaxWithheld,
        stub.healthInsurance,
        stub.dentalInsurance,
        stub.visionInsurance,
        stub.lifeInsurance,
        stub.retirement401k,
        stub.retirementRoth,
        stub.fsaHealthcare,
        stub.fsaDependentCare,
        stub.hsa,
        stub.garnishments,
        stub.unionDues,
        stub.otherDeductions,
        stub.totalOtherDeductions,
        stub.currentNetPay,
        stub.yearToDateNetPay,
        stub.ytdHours,
        stub.ytdGrossPay,
        stub.ytdFederalTax,
        stub.ytdStateTax,
        stub.ytdSocialSecurity,
        stub.ytdMedicare,
        stub.ytdDeductions,
        stub.ytdNetPay,
        stub.paymentMethod,
        stub.paymentId || null,
        stub.bankAccountId || null,
        stub.bankAccountLast4 || null,
        stub.checkNumber || null,
        stub.checkDate || null,
        stub.checkStatus || null,
        stub.status,
        JSON.stringify(stub.statusHistory || []),
        stub.calculatedAt,
        stub.calculatedBy || null,
        stub.approvedAt || null,
        stub.approvedBy || null,
        stub.deliveredAt || null,
        stub.deliveryMethod || null,
        stub.viewedAt || null,
        stub.pdfUrl || null,
        stub.pdfGeneratedAt || null,
        stub.isVoid,
        stub.voidReason || null,
        stub.voidedAt || null,
        stub.voidedBy || null,
        stub.notes || null,
        stub.internalNotes || null,
        now,
        stub.createdBy,
        now,
        stub.updatedBy,
        1,
      ]
    );

    return this.mapPayStub(result.rows[0]);
  }

  async findPayStubById(id: UUID): Promise<PayStub | null> {
    const result = await this.pool.query('SELECT * FROM pay_stubs WHERE id = $1', [id]);
    return result.rows[0] ? this.mapPayStub(result.rows[0]) : null;
  }

  async findPayStubs(filters: PayStubSearchFilters): Promise<PayStub[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramIndex++}`);
      params.push(filters.organizationId);
    }

    if (filters.branchId) {
      conditions.push(`branch_id = $${paramIndex++}`);
      params.push(filters.branchId);
    }

    if (filters.payRunId) {
      conditions.push(`pay_run_id = $${paramIndex++}`);
      params.push(filters.payRunId);
    }

    if (filters.payPeriodId) {
      conditions.push(`pay_period_id = $${paramIndex++}`);
      params.push(filters.payPeriodId);
    }

    if (filters.caregiverId) {
      conditions.push(`caregiver_id = $${paramIndex++}`);
      params.push(filters.caregiverId);
    }

    if (filters.status && filters.status.length > 0) {
      conditions.push(`status = ANY($${paramIndex++})`);
      params.push(filters.status);
    }

    if (filters.paymentMethod && filters.paymentMethod.length > 0) {
      conditions.push(`payment_method = ANY($${paramIndex++})`);
      params.push(filters.paymentMethod);
    }

    if (filters.isVoid !== undefined) {
      conditions.push(`is_void = $${paramIndex++}`);
      params.push(filters.isVoid);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.pool.query(
      `SELECT * FROM pay_stubs ${whereClause} ORDER BY pay_date DESC, caregiver_name ASC`,
      params
    );

    return result.rows.map(this.mapPayStub);
  }

  /**
   * TAX CONFIGURATION OPERATIONS
   */

  async createTaxConfiguration(
    config: Omit<TaxConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
    client?: PoolClient
  ): Promise<TaxConfiguration> {
    const db = client || this.pool;
    const id = uuid();
    const now = new Date();

    const result = await db.query(
      `
      INSERT INTO tax_configurations (
        id, organization_id, caregiver_id,
        federal_filing_status, federal_allowances, federal_extra_withholding, federal_exempt,
        w4_step_2, w4_step_3_dependents, w4_step_4a_other_income,
        w4_step_4b_deductions, w4_step_4c_extra_withholding,
        state_filing_status, state_allowances, state_extra_withholding,
        state_exempt, state_residence,
        local_tax_jurisdiction, local_exempt,
        effective_from, effective_to, last_updated, updated_by,
        w4_on_file, w4_file_date, w4_document_id,
        state_form_on_file, state_form_date, state_form_document_id,
        created_at, created_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
      )
      RETURNING *
      `,
      [
        id,
        config.organizationId,
        config.caregiverId,
        config.federalFilingStatus,
        config.federalAllowances,
        config.federalExtraWithholding,
        config.federalExempt,
        config.w4Step2,
        config.w4Step3Dependents,
        config.w4Step4aOtherIncome,
        config.w4Step4bDeductions,
        config.w4Step4cExtraWithholding,
        config.stateFilingStatus,
        config.stateAllowances,
        config.stateExtraWithholding,
        config.stateExempt,
        config.stateResidence,
        config.localTaxJurisdiction || null,
        config.localExempt,
        config.effectiveFrom,
        config.effectiveTo || null,
        config.lastUpdated,
        config.updatedBy,
        config.w4OnFile,
        config.w4FileDate || null,
        config.w4DocumentId || null,
        config.stateFormOnFile,
        config.stateFormDate || null,
        config.stateFormDocumentId || null,
        now,
        config.createdBy,
        1,
      ]
    );

    return this.mapTaxConfiguration(result.rows[0]);
  }

  async findTaxConfiguration(caregiverId: UUID): Promise<TaxConfiguration | null> {
    const result = await this.pool.query(
      `SELECT * FROM tax_configurations 
       WHERE caregiver_id = $1 
       AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
       ORDER BY effective_from DESC
       LIMIT 1`,
      [caregiverId]
    );
    return result.rows[0] ? this.mapTaxConfiguration(result.rows[0]) : null;
  }

  /**
   * DEDUCTION OPERATIONS
   */

  async createDeduction(
    deduction: Omit<Deduction, 'id'>,
    caregiverId: UUID,
    client?: PoolClient
  ): Promise<Deduction> {
    const db = client || this.pool;
    const id = uuid();

    const result = await db.query(
      `
      INSERT INTO caregiver_deductions (
        id, caregiver_id, deduction_type, deduction_code, description,
        amount, calculation_method, percentage,
        has_limit, yearly_limit, year_to_date_amount, remaining_amount,
        is_pre_tax, is_post_tax, is_statutory,
        employer_match, employer_match_percentage,
        garnishment_order,
        is_active, effective_from, effective_to
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      )
      RETURNING *
      `,
      [
        id,
        caregiverId,
        deduction.deductionType,
        deduction.deductionCode,
        deduction.description,
        deduction.amount,
        deduction.calculationMethod,
        deduction.percentage || null,
        deduction.hasLimit,
        deduction.yearlyLimit || null,
        deduction.yearToDateAmount || null,
        deduction.remainingAmount || null,
        deduction.isPreTax,
        deduction.isPostTax,
        deduction.isStatutory,
        deduction.employerMatch || null,
        deduction.employerMatchPercentage || null,
        deduction.garnishmentOrder ? JSON.stringify(deduction.garnishmentOrder) : null,
        deduction.isActive,
        deduction.effectiveFrom || null,
        deduction.effectiveTo || null,
      ]
    );

    return this.mapDeduction(result.rows[0]);
  }

  async findDeductionsForCaregiver(caregiverId: UUID): Promise<Deduction[]> {
    const result = await this.pool.query(
      `SELECT * FROM caregiver_deductions 
       WHERE caregiver_id = $1 
       AND is_active = true
       AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
       AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
       ORDER BY deduction_type`,
      [caregiverId]
    );
    return result.rows.map(this.mapDeduction);
  }

  /**
   * PAYMENT RECORD OPERATIONS
   */

  async createPaymentRecord(
    payment: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
    client?: PoolClient
  ): Promise<PaymentRecord> {
    const db = client || this.pool;
    const id = uuid();
    const now = new Date();

    const result = await db.query(
      `
      INSERT INTO payment_records (
        id, organization_id, branch_id,
        pay_run_id, pay_stub_id, caregiver_id,
        payment_number, payment_method, payment_amount, payment_date,
        bank_account_id, routing_number, account_number, account_type,
        transaction_id, trace_number,
        check_number, check_date, check_status, check_cleared_date, check_image_url,
        status, status_history,
        initiated_at, initiated_by, processed_at, settled_at,
        ach_batch_id, ach_file_id,
        has_errors, error_code, error_message, error_details,
        is_reissue, original_payment_id, reissue_reason,
        notes,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41
      )
      RETURNING *
      `,
      [
        id,
        payment.organizationId,
        payment.branchId,
        payment.payRunId,
        payment.payStubId,
        payment.caregiverId,
        payment.paymentNumber,
        payment.paymentMethod,
        payment.paymentAmount,
        payment.paymentDate,
        payment.bankAccountId || null,
        payment.routingNumber || null,
        payment.accountNumber || null,
        payment.accountType || null,
        payment.transactionId || null,
        payment.traceNumber || null,
        payment.checkNumber || null,
        payment.checkDate || null,
        payment.checkStatus || null,
        payment.checkClearedDate || null,
        payment.checkImageUrl || null,
        payment.status,
        JSON.stringify(payment.statusHistory || []),
        payment.initiatedAt,
        payment.initiatedBy,
        payment.processedAt || null,
        payment.settledAt || null,
        payment.achBatchId || null,
        payment.achFileId || null,
        payment.hasErrors,
        payment.errorCode || null,
        payment.errorMessage || null,
        payment.errorDetails || null,
        payment.isReissue,
        payment.originalPaymentId || null,
        payment.reissueReason || null,
        payment.notes || null,
        now,
        payment.createdBy,
        now,
        payment.updatedBy,
        1,
      ]
    );

    return this.mapPaymentRecord(result.rows[0]);
  }

  async findPaymentRecordById(id: UUID): Promise<PaymentRecord | null> {
    const result = await this.pool.query('SELECT * FROM payment_records WHERE id = $1', [id]);
    return result.rows[0] ? this.mapPaymentRecord(result.rows[0]) : null;
  }

  async findPaymentRecords(filters: PaymentSearchFilters): Promise<PaymentRecord[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramIndex++}`);
      params.push(filters.organizationId);
    }

    if (filters.payRunId) {
      conditions.push(`pay_run_id = $${paramIndex++}`);
      params.push(filters.payRunId);
    }

    if (filters.caregiverId) {
      conditions.push(`caregiver_id = $${paramIndex++}`);
      params.push(filters.caregiverId);
    }

    if (filters.status && filters.status.length > 0) {
      conditions.push(`status = ANY($${paramIndex++})`);
      params.push(filters.status);
    }

    if (filters.paymentMethod && filters.paymentMethod.length > 0) {
      conditions.push(`payment_method = ANY($${paramIndex++})`);
      params.push(filters.paymentMethod);
    }

    if (filters.hasErrors !== undefined) {
      conditions.push(`has_errors = $${paramIndex++}`);
      params.push(filters.hasErrors);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.pool.query(
      `SELECT * FROM payment_records ${whereClause} ORDER BY payment_date DESC`,
      params
    );

    return result.rows.map(this.mapPaymentRecord);
  }

  /**
   * ACH BATCH OPERATIONS
   */

  async createACHBatch(
    batch: Omit<ACHBatch, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
    client?: PoolClient
  ): Promise<ACHBatch> {
    const db = client || this.pool;
    const id = uuid();
    const now = new Date();

    const result = await db.query(
      `
      INSERT INTO ach_batches (
        id, organization_id,
        batch_number, batch_date, effective_date,
        company_name, company_id, company_entry_description,
        payment_ids, transaction_count, total_debit_amount, total_credit_amount,
        ach_file_url, ach_file_format, ach_file_generated_at, ach_file_hash,
        status, submitted_at, submitted_by,
        originating_bank_routing_number, originating_bank_account_number,
        settled_at, settlement_confirmation,
        has_returns, return_count, returns,
        notes,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
      )
      RETURNING *
      `,
      [
        id,
        batch.organizationId,
        batch.batchNumber,
        batch.batchDate,
        batch.effectiveDate,
        batch.companyName,
        batch.companyId,
        batch.companyEntryDescription,
        JSON.stringify(batch.paymentIds),
        batch.transactionCount,
        batch.totalDebitAmount,
        batch.totalCreditAmount,
        batch.achFileUrl || null,
        batch.achFileFormat,
        batch.achFileGeneratedAt || null,
        batch.achFileHash || null,
        batch.status,
        batch.submittedAt || null,
        batch.submittedBy || null,
        batch.originatingBankRoutingNumber,
        batch.originatingBankAccountNumber,
        batch.settledAt || null,
        batch.settlementConfirmation || null,
        batch.hasReturns,
        batch.returnCount || null,
        JSON.stringify(batch.returns || []),
        batch.notes || null,
        now,
        batch.createdBy,
        now,
        batch.updatedBy,
        1,
      ]
    );

    return this.mapACHBatch(result.rows[0]);
  }

  /**
   * Mappers - Convert DB rows to domain models
   */

  private mapPayPeriod(row: Record<string, unknown>): PayPeriod {
    return {
      id: row['id'] as UUID,
      organizationId: row['organization_id'] as UUID,
      ...(row['branch_id'] != null && { branchId: row['branch_id'] as UUID }),
      periodNumber: row['period_number'] as number,
      periodYear: row['period_year'] as number,
      periodType: row['period_type'] as PayPeriod['periodType'],
      startDate: row['start_date'] as Date,
      endDate: row['end_date'] as Date,
      payDate: row['pay_date'] as Date,
      status: row['status'] as PayPeriod['status'],
      statusHistory: JSON.parse((row['status_history'] as string) || '[]'),
      ...(row['cutoff_date'] != null && { cutoffDate: row['cutoff_date'] as Date }),
      ...(row['approval_deadline'] != null && {
        approvalDeadline: row['approval_deadline'] as Date,
      }),
      ...(row['pay_run_id'] != null && { payRunId: row['pay_run_id'] as UUID }),
      ...(row['total_caregivers'] != null && {
        totalCaregivers: row['total_caregivers'] as number,
      }),
      ...(row['total_hours'] != null && { totalHours: row['total_hours'] as number }),
      ...(row['total_gross_pay'] != null && { totalGrossPay: row['total_gross_pay'] as number }),
      ...(row['total_net_pay'] != null && { totalNetPay: row['total_net_pay'] as number }),
      ...(row['total_tax_withheld'] != null && {
        totalTaxWithheld: row['total_tax_withheld'] as number,
      }),
      ...(row['total_deductions'] != null && {
        totalDeductions: row['total_deductions'] as number,
      }),
      ...(row['notes'] != null && { notes: row['notes'] as string }),
      ...(row['fiscal_quarter'] != null && { fiscalQuarter: row['fiscal_quarter'] as number }),
      ...(row['fiscal_year'] != null && { fiscalYear: row['fiscal_year'] as number }),
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as UUID,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as UUID,
      version: row['version'] as number,
    };
  }

  private mapTimeSheet(row: Record<string, unknown>): TimeSheet {
    return {
      id: row['id'] as UUID,
      organizationId: row['organization_id'] as UUID,
      branchId: row['branch_id'] as UUID,
      payPeriodId: row['pay_period_id'] as UUID,
      caregiverId: row['caregiver_id'] as UUID,
      caregiverName: row['caregiver_name'] as string,
      caregiverEmployeeId: row['caregiver_employee_id'] as string,
      timeEntries: JSON.parse(row['time_entries'] as string),
      regularHours: row['regular_hours'] as number,
      overtimeHours: row['overtime_hours'] as number,
      doubleTimeHours: row['double_time_hours'] as number,
      ptoHours: row['pto_hours'] as number,
      holidayHours: row['holiday_hours'] as number,
      sickHours: row['sick_hours'] as number,
      otherHours: row['other_hours'] as number,
      totalHours: row['total_hours'] as number,
      regularRate: row['regular_rate'] as number,
      overtimeRate: row['overtime_rate'] as number,
      doubleTimeRate: row['double_time_rate'] as number,
      regularEarnings: row['regular_earnings'] as number,
      overtimeEarnings: row['overtime_earnings'] as number,
      doubleTimeEarnings: row['double_time_earnings'] as number,
      ptoEarnings: row['pto_earnings'] as number,
      holidayEarnings: row['holiday_earnings'] as number,
      sickEarnings: row['sick_earnings'] as number,
      otherEarnings: row['other_earnings'] as number,
      grossEarnings: row['gross_earnings'] as number,
      bonuses: JSON.parse(row['bonuses'] as string),
      reimbursements: JSON.parse(row['reimbursements'] as string),
      adjustments: JSON.parse(row['adjustments'] as string),
      totalAdjustments: row['total_adjustments'] as number,
      totalGrossPay: row['total_gross_pay'] as number,
      status: row['status'] as TimeSheet['status'],
      statusHistory: JSON.parse((row['status_history'] as string) || '[]'),
      ...(row['submitted_at'] != null && { submittedAt: row['submitted_at'] as Date }),
      ...(row['submitted_by'] != null && { submittedBy: row['submitted_by'] as UUID }),
      ...(row['approved_at'] != null && { approvedAt: row['approved_at'] as Date }),
      ...(row['approved_by'] != null && { approvedBy: row['approved_by'] as UUID }),
      ...(row['approval_notes'] != null && { approvalNotes: row['approval_notes'] as string }),
      hasDiscrepancies: row['has_discrepancies'] as boolean,
      discrepancyFlags: JSON.parse((row['discrepancy_flags'] as string) || '[]'),
      evvRecordIds: JSON.parse(row['evv_record_ids'] as string),
      visitIds: JSON.parse(row['visit_ids'] as string),
      ...(row['notes'] != null && { notes: row['notes'] as string }),
      ...(row['review_notes'] != null && { reviewNotes: row['review_notes'] as string }),
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as UUID,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as UUID,
      version: row['version'] as number,
      deletedAt: row['deleted_at'] ? (row['deleted_at'] as Date) : null,
      deletedBy: row['deleted_by'] ? (row['deleted_by'] as UUID) : null,
    };
  }

  private mapPayRun(row: Record<string, unknown>): PayRun {
    return {
      id: row['id'] as UUID,
      organizationId: row['organization_id'] as UUID,
      ...(row['branch_id'] != null && { branchId: row['branch_id'] as UUID }),
      payPeriodId: row['pay_period_id'] as UUID,
      payPeriodStartDate: row['pay_period_start_date'] as Date,
      payPeriodEndDate: row['pay_period_end_date'] as Date,
      payDate: row['pay_date'] as Date,
      runNumber: row['run_number'] as string,
      runType: row['run_type'] as PayRun['runType'],
      status: row['status'] as PayRun['status'],
      statusHistory: JSON.parse((row['status_history'] as string) || '[]'),
      ...(row['initiated_at'] != null && { initiatedAt: row['initiated_at'] as Date }),
      ...(row['initiated_by'] != null && { initiatedBy: row['initiated_by'] as UUID }),
      ...(row['calculated_at'] != null && { calculatedAt: row['calculated_at'] as Date }),
      ...(row['approved_at'] != null && { approvedAt: row['approved_at'] as Date }),
      ...(row['approved_by'] != null && { approvedBy: row['approved_by'] as UUID }),
      ...(row['processed_at'] != null && { processedAt: row['processed_at'] as Date }),
      ...(row['processed_by'] != null && { processedBy: row['processed_by'] as UUID }),
      payStubIds: JSON.parse(row['pay_stub_ids'] as string),
      totalPayStubs: row['total_pay_stubs'] as number,
      totalCaregivers: row['total_caregivers'] as number,
      totalHours: row['total_hours'] as number,
      totalGrossPay: row['total_gross_pay'] as number,
      totalDeductions: row['total_deductions'] as number,
      totalTaxWithheld: row['total_tax_withheld'] as number,
      totalNetPay: row['total_net_pay'] as number,
      federalIncomeTax: row['federal_income_tax'] as number,
      stateIncomeTax: row['state_income_tax'] as number,
      socialSecurityTax: row['social_security_tax'] as number,
      medicareTax: row['medicare_tax'] as number,
      localTax: row['local_tax'] as number,
      benefitsDeductions: row['benefits_deductions'] as number,
      garnishments: row['garnishments'] as number,
      otherDeductions: row['other_deductions'] as number,
      directDepositCount: row['direct_deposit_count'] as number,
      directDepositAmount: row['direct_deposit_amount'] as number,
      checkCount: row['check_count'] as number,
      checkAmount: row['check_amount'] as number,
      cashCount: row['cash_count'] as number,
      cashAmount: row['cash_amount'] as number,
      ...(row['payroll_register_url'] != null && {
        payrollRegisterUrl: row['payroll_register_url'] as string,
      }),
      ...(row['tax_report_url'] != null && { taxReportUrl: row['tax_report_url'] as string }),
      exportFiles: JSON.parse((row['export_files'] as string) || '[]'),
      complianceChecks: JSON.parse((row['compliance_checks'] as string) || '[]'),
      compliancePassed: row['compliance_passed'] as boolean,
      hasErrors: row['has_errors'] as boolean,
      errors: JSON.parse((row['errors'] as string) || '[]'),
      warnings: JSON.parse((row['warnings'] as string) || '[]'),
      ...(row['notes'] != null && { notes: row['notes'] as string }),
      ...(row['internal_notes'] != null && { internalNotes: row['internal_notes'] as string }),
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as UUID,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as UUID,
      version: row['version'] as number,
    };
  }

  private mapPayStub(row: Record<string, unknown>): PayStub {
    return {
      id: row['id'] as UUID,
      organizationId: row['organization_id'] as UUID,
      branchId: row['branch_id'] as UUID,
      payRunId: row['pay_run_id'] as UUID,
      payPeriodId: row['pay_period_id'] as UUID,
      caregiverId: row['caregiver_id'] as UUID,
      timeSheetId: row['time_sheet_id'] as UUID,
      caregiverName: row['caregiver_name'] as string,
      caregiverEmployeeId: row['caregiver_employee_id'] as string,
      ...(row['caregiver_address'] != null && {
        caregiverAddress: JSON.parse(row['caregiver_address'] as string),
      }),
      payPeriodStartDate: row['pay_period_start_date'] as Date,
      payPeriodEndDate: row['pay_period_end_date'] as Date,
      payDate: row['pay_date'] as Date,
      stubNumber: row['stub_number'] as string,
      regularHours: row['regular_hours'] as number,
      overtimeHours: row['overtime_hours'] as number,
      doubleTimeHours: row['double_time_hours'] as number,
      ptoHours: row['pto_hours'] as number,
      holidayHours: row['holiday_hours'] as number,
      sickHours: row['sick_hours'] as number,
      otherHours: row['other_hours'] as number,
      totalHours: row['total_hours'] as number,
      regularPay: row['regular_pay'] as number,
      overtimePay: row['overtime_pay'] as number,
      doubleTimePay: row['double_time_pay'] as number,
      ptoPay: row['pto_pay'] as number,
      holidayPay: row['holiday_pay'] as number,
      sickPay: row['sick_pay'] as number,
      otherPay: row['other_pay'] as number,
      bonuses: row['bonuses'] as number,
      commissions: row['commissions'] as number,
      reimbursements: row['reimbursements'] as number,
      retroactivePay: row['retroactive_pay'] as number,
      otherEarnings: row['other_earnings'] as number,
      currentGrossPay: row['current_gross_pay'] as number,
      yearToDateGrossPay: row['year_to_date_gross_pay'] as number,
      deductions: JSON.parse(row['deductions'] as string),
      federalIncomeTax: row['federal_income_tax'] as number,
      stateIncomeTax: row['state_income_tax'] as number,
      localIncomeTax: row['local_income_tax'] as number,
      socialSecurityTax: row['social_security_tax'] as number,
      medicareTax: row['medicare_tax'] as number,
      additionalMedicareTax: row['additional_medicare_tax'] as number,
      totalTaxWithheld: row['total_tax_withheld'] as number,
      healthInsurance: row['health_insurance'] as number,
      dentalInsurance: row['dental_insurance'] as number,
      visionInsurance: row['vision_insurance'] as number,
      lifeInsurance: row['life_insurance'] as number,
      retirement401k: row['retirement_401k'] as number,
      retirementRoth: row['retirement_roth'] as number,
      fsaHealthcare: row['fsa_healthcare'] as number,
      fsaDependentCare: row['fsa_dependent_care'] as number,
      hsa: row['hsa'] as number,
      garnishments: row['garnishments'] as number,
      unionDues: row['union_dues'] as number,
      otherDeductions: row['other_deductions'] as number,
      totalOtherDeductions: row['total_other_deductions'] as number,
      currentNetPay: row['current_net_pay'] as number,
      yearToDateNetPay: row['year_to_date_net_pay'] as number,
      ytdHours: row['ytd_hours'] as number,
      ytdGrossPay: row['ytd_gross_pay'] as number,
      ytdFederalTax: row['ytd_federal_tax'] as number,
      ytdStateTax: row['ytd_state_tax'] as number,
      ytdSocialSecurity: row['ytd_social_security'] as number,
      ytdMedicare: row['ytd_medicare'] as number,
      ytdDeductions: row['ytd_deductions'] as number,
      ytdNetPay: row['ytd_net_pay'] as number,
      paymentMethod: row['payment_method'] as PaymentMethod,
      ...(row['payment_id'] != null && { paymentId: row['payment_id'] as UUID }),
      ...(row['bank_account_id'] != null && { bankAccountId: row['bank_account_id'] as UUID }),
      ...(row['bank_account_last4'] != null && {
        bankAccountLast4: row['bank_account_last4'] as string,
      }),
      ...(row['check_number'] != null && { checkNumber: row['check_number'] as string }),
      ...(row['check_date'] != null && { checkDate: row['check_date'] as Date }),
      ...(row['check_status'] != null && { checkStatus: row['check_status'] as CheckStatus }),
      status: row['status'] as PayStub['status'],
      statusHistory: JSON.parse((row['status_history'] as string) || '[]'),
      calculatedAt: row['calculated_at'] as Date,
      ...(row['calculated_by'] != null && { calculatedBy: row['calculated_by'] as UUID }),
      ...(row['approved_at'] != null && { approvedAt: row['approved_at'] as Date }),
      ...(row['approved_by'] != null && { approvedBy: row['approved_by'] as UUID }),
      ...(row['delivered_at'] != null && { deliveredAt: row['delivered_at'] as Date }),
      ...(row['delivery_method'] != null && {
        deliveryMethod: row['delivery_method'] as 'EMAIL' | 'PRINT' | 'PORTAL' | 'MAIL',
      }),
      ...(row['viewed_at'] != null && { viewedAt: row['viewed_at'] as Date }),
      ...(row['pdf_url'] != null && { pdfUrl: row['pdf_url'] as string }),
      ...(row['pdf_generated_at'] != null && { pdfGeneratedAt: row['pdf_generated_at'] as Date }),
      isVoid: row['is_void'] as boolean,
      ...(row['void_reason'] != null && { voidReason: row['void_reason'] as string }),
      ...(row['voided_at'] != null && { voidedAt: row['voided_at'] as Date }),
      ...(row['voided_by'] != null && { voidedBy: row['voided_by'] as UUID }),
      ...(row['notes'] != null && { notes: row['notes'] as string }),
      ...(row['internal_notes'] != null && { internalNotes: row['internal_notes'] as string }),
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as UUID,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as UUID,
      version: row['version'] as number,
    };
  }

  private mapTaxConfiguration(row: Record<string, unknown>): TaxConfiguration {
    return {
      id: row['id'] as UUID,
      organizationId: row['organization_id'] as UUID,
      caregiverId: row['caregiver_id'] as UUID,
      federalFilingStatus: row['federal_filing_status'] as TaxConfiguration['federalFilingStatus'],
      federalAllowances: row['federal_allowances'] as number,
      federalExtraWithholding: row['federal_extra_withholding'] as number,
      federalExempt: row['federal_exempt'] as boolean,
      w4Step2: row['w4_step_2'] as boolean,
      w4Step3Dependents: row['w4_step_3_dependents'] as number,
      w4Step4aOtherIncome: row['w4_step_4a_other_income'] as number,
      w4Step4bDeductions: row['w4_step_4b_deductions'] as number,
      w4Step4cExtraWithholding: row['w4_step_4c_extra_withholding'] as number,
      stateFilingStatus: row['state_filing_status'] as TaxConfiguration['stateFilingStatus'],
      stateAllowances: row['state_allowances'] as number,
      stateExtraWithholding: row['state_extra_withholding'] as number,
      stateExempt: row['state_exempt'] as boolean,
      stateResidence: row['state_residence'] as string,
      ...(row['local_tax_jurisdiction'] != null && {
        localTaxJurisdiction: row['local_tax_jurisdiction'] as string,
      }),
      localExempt: row['local_exempt'] as boolean,
      effectiveFrom: row['effective_from'] as Date,
      ...(row['effective_to'] != null && { effectiveTo: row['effective_to'] as Date }),
      lastUpdated: row['last_updated'] as Date,
      w4OnFile: row['w4_on_file'] as boolean,
      ...(row['w4_file_date'] != null && { w4FileDate: row['w4_file_date'] as Date }),
      ...(row['w4_document_id'] != null && { w4DocumentId: row['w4_document_id'] as UUID }),
      stateFormOnFile: row['state_form_on_file'] as boolean,
      ...(row['state_form_date'] != null && { stateFormDate: row['state_form_date'] as Date }),
      ...(row['state_form_document_id'] != null && {
        stateFormDocumentId: row['state_form_document_id'] as UUID,
      }),
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as UUID,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as UUID,
      version: row['version'] as number,
    };
  }

  private mapDeduction(row: Record<string, unknown>): Deduction {
    return {
      id: row['id'] as UUID,
      deductionType: row['deduction_type'] as Deduction['deductionType'],
      deductionCode: row['deduction_code'] as string,
      description: row['description'] as string,
      amount: row['amount'] as number,
      calculationMethod: row['calculation_method'] as Deduction['calculationMethod'],
      ...(row['percentage'] != null && { percentage: row['percentage'] as number }),
      hasLimit: row['has_limit'] as boolean,
      ...(row['yearly_limit'] != null && { yearlyLimit: row['yearly_limit'] as number }),
      ...(row['year_to_date_amount'] != null && {
        yearToDateAmount: row['year_to_date_amount'] as number,
      }),
      ...(row['remaining_amount'] != null && {
        remainingAmount: row['remaining_amount'] as number,
      }),
      isPreTax: row['is_pre_tax'] as boolean,
      isPostTax: row['is_post_tax'] as boolean,
      isStatutory: row['is_statutory'] as boolean,
      ...(row['employer_match'] != null && { employerMatch: row['employer_match'] as number }),
      ...(row['employer_match_percentage'] != null && {
        employerMatchPercentage: row['employer_match_percentage'] as number,
      }),
      ...(row['garnishment_order'] != null && {
        garnishmentOrder: JSON.parse(row['garnishment_order'] as string),
      }),
      isActive: row['is_active'] as boolean,
      ...(row['effective_from'] != null && { effectiveFrom: row['effective_from'] as Date }),
      ...(row['effective_to'] != null && { effectiveTo: row['effective_to'] as Date }),
    };
  }

  private mapPaymentRecord(row: Record<string, unknown>): PaymentRecord {
    return {
      id: row['id'] as UUID,
      organizationId: row['organization_id'] as UUID,
      branchId: row['branch_id'] as UUID,
      payRunId: row['pay_run_id'] as UUID,
      payStubId: row['pay_stub_id'] as UUID,
      caregiverId: row['caregiver_id'] as UUID,
      paymentNumber: row['payment_number'] as string,
      paymentMethod: row['payment_method'] as PaymentMethod,
      paymentAmount: row['payment_amount'] as number,
      paymentDate: row['payment_date'] as Date,
      ...(row['bank_account_id'] != null && { bankAccountId: row['bank_account_id'] as UUID }),
      ...(row['routing_number'] != null && { routingNumber: row['routing_number'] as string }),
      ...(row['account_number'] != null && { accountNumber: row['account_number'] as string }),
      ...(row['account_type'] != null && {
        accountType: row['account_type'] as 'CHECKING' | 'SAVINGS',
      }),
      ...(row['transaction_id'] != null && { transactionId: row['transaction_id'] as string }),
      ...(row['trace_number'] != null && { traceNumber: row['trace_number'] as string }),
      ...(row['check_number'] != null && { checkNumber: row['check_number'] as string }),
      ...(row['check_date'] != null && { checkDate: row['check_date'] as Date }),
      ...(row['check_status'] != null && { checkStatus: row['check_status'] as CheckStatus }),
      ...(row['check_cleared_date'] != null && {
        checkClearedDate: row['check_cleared_date'] as Date,
      }),
      ...(row['check_image_url'] != null && { checkImageUrl: row['check_image_url'] as string }),
      status: row['status'] as PaymentRecord['status'],
      statusHistory: JSON.parse((row['status_history'] as string) || '[]'),
      initiatedAt: row['initiated_at'] as Date,
      initiatedBy: row['initiated_by'] as UUID,
      ...(row['processed_at'] != null && { processedAt: row['processed_at'] as Date }),
      ...(row['settled_at'] != null && { settledAt: row['settled_at'] as Date }),
      ...(row['ach_batch_id'] != null && { achBatchId: row['ach_batch_id'] as UUID }),
      ...(row['ach_file_id'] != null && { achFileId: row['ach_file_id'] as string }),
      hasErrors: row['has_errors'] as boolean,
      ...(row['error_code'] != null && { errorCode: row['error_code'] as string }),
      ...(row['error_message'] != null && { errorMessage: row['error_message'] as string }),
      ...(row['error_details'] != null && { errorDetails: row['error_details'] as string }),
      isReissue: row['is_reissue'] as boolean,
      ...(row['original_payment_id'] != null && {
        originalPaymentId: row['original_payment_id'] as UUID,
      }),
      ...(row['reissue_reason'] != null && { reissueReason: row['reissue_reason'] as string }),
      ...(row['notes'] != null && { notes: row['notes'] as string }),
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as UUID,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as UUID,
      version: row['version'] as number,
    };
  }

  private mapACHBatch(row: Record<string, unknown>): ACHBatch {
    return {
      id: row['id'] as UUID,
      organizationId: row['organization_id'] as UUID,
      batchNumber: row['batch_number'] as string,
      batchDate: row['batch_date'] as Date,
      effectiveDate: row['effective_date'] as Date,
      companyName: row['company_name'] as string,
      companyId: row['company_id'] as string,
      companyEntryDescription: row['company_entry_description'] as string,
      paymentIds: JSON.parse(row['payment_ids'] as string),
      transactionCount: row['transaction_count'] as number,
      totalDebitAmount: row['total_debit_amount'] as number,
      totalCreditAmount: row['total_credit_amount'] as number,
      ...(row['ach_file_url'] != null && { achFileUrl: row['ach_file_url'] as string }),
      achFileFormat: row['ach_file_format'] as ACHBatch['achFileFormat'],
      ...(row['ach_file_generated_at'] != null && {
        achFileGeneratedAt: row['ach_file_generated_at'] as Date,
      }),
      ...(row['ach_file_hash'] != null && { achFileHash: row['ach_file_hash'] as string }),
      status: row['status'] as ACHBatch['status'],
      ...(row['submitted_at'] != null && { submittedAt: row['submitted_at'] as Date }),
      ...(row['submitted_by'] != null && { submittedBy: row['submitted_by'] as UUID }),
      originatingBankRoutingNumber: row['originating_bank_routing_number'] as string,
      originatingBankAccountNumber: row['originating_bank_account_number'] as string,
      ...(row['settled_at'] != null && { settledAt: row['settled_at'] as Date }),
      ...(row['settlement_confirmation'] != null && {
        settlementConfirmation: row['settlement_confirmation'] as string,
      }),
      hasReturns: row['has_returns'] as boolean,
      ...(row['return_count'] != null && { returnCount: row['return_count'] as number }),
      returns: JSON.parse((row['returns'] as string) || '[]'),
      ...(row['notes'] != null && { notes: row['notes'] as string }),
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as UUID,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as UUID,
      version: row['version'] as number,
    };
  }
}
