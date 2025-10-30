"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollRepository = void 0;
const uuid_1 = require("uuid");
class PayrollRepository {
    constructor(pool) {
        this.pool = pool;
    }
    async createPayPeriod(period, client) {
        const db = client || this.pool;
        const id = (0, uuid_1.v4)();
        const now = new Date();
        const result = await db.query(`
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
      `, [
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
        ]);
        return this.mapPayPeriod(result.rows[0]);
    }
    async findPayPeriodById(id) {
        const result = await this.pool.query('SELECT * FROM pay_periods WHERE id = $1', [id]);
        return result.rows[0] ? this.mapPayPeriod(result.rows[0]) : null;
    }
    async findPayPeriodByDate(organizationId, date) {
        const result = await this.pool.query(`SELECT * FROM pay_periods 
       WHERE organization_id = $1 
       AND start_date <= $2 
       AND end_date >= $2
       ORDER BY created_at DESC
       LIMIT 1`, [organizationId, date]);
        return result.rows[0] ? this.mapPayPeriod(result.rows[0]) : null;
    }
    async findPayPeriods(filters) {
        const conditions = [];
        const params = [];
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
        const result = await this.pool.query(`SELECT * FROM pay_periods ${whereClause} ORDER BY start_date DESC`, params);
        return result.rows.map(this.mapPayPeriod);
    }
    async updatePayPeriod(id, updates) {
        const existing = await this.findPayPeriodById(id);
        if (!existing)
            return null;
        const fields = [];
        const params = [];
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
        if (fields.length === 0)
            return existing;
        fields.push(`updated_at = $${paramIndex++}`);
        params.push(new Date());
        fields.push(`version = version + 1`);
        params.push(id);
        const result = await this.pool.query(`UPDATE pay_periods SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`, params);
        return result.rows[0] ? this.mapPayPeriod(result.rows[0]) : null;
    }
    async createTimeSheet(sheet, client) {
        const db = client || this.pool;
        const id = (0, uuid_1.v4)();
        const now = new Date();
        const result = await db.query(`
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
      `, [
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
        ]);
        return this.mapTimeSheet(result.rows[0]);
    }
    async findTimeSheetById(id) {
        const result = await this.pool.query('SELECT * FROM time_sheets WHERE id = $1 AND deleted_at IS NULL', [id]);
        return result.rows[0] ? this.mapTimeSheet(result.rows[0]) : null;
    }
    async findTimeSheetByCaregiver(caregiverId, payPeriodId) {
        const result = await this.pool.query(`SELECT * FROM time_sheets 
       WHERE caregiver_id = $1 
       AND pay_period_id = $2 
       AND deleted_at IS NULL
       LIMIT 1`, [caregiverId, payPeriodId]);
        return result.rows[0] ? this.mapTimeSheet(result.rows[0]) : null;
    }
    async findTimeSheets(filters) {
        const conditions = ['deleted_at IS NULL'];
        const params = [];
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
        const result = await this.pool.query(`SELECT * FROM time_sheets ${whereClause} ORDER BY created_at DESC`, params);
        return result.rows.map(this.mapTimeSheet);
    }
    async updateTimeSheet(id, updates) {
        const existing = await this.findTimeSheetById(id);
        if (!existing)
            return null;
        const fields = [];
        const params = [];
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
        if (fields.length === 0)
            return existing;
        fields.push(`updated_at = $${paramIndex++}`);
        params.push(new Date());
        fields.push(`version = version + 1`);
        params.push(id);
        const result = await this.pool.query(`UPDATE time_sheets SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`, params);
        return result.rows[0] ? this.mapTimeSheet(result.rows[0]) : null;
    }
    async createPayRun(run, client) {
        const db = client || this.pool;
        const id = (0, uuid_1.v4)();
        const now = new Date();
        const result = await db.query(`
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
      `, [
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
        ]);
        return this.mapPayRun(result.rows[0]);
    }
    async findPayRunById(id) {
        const result = await this.pool.query('SELECT * FROM pay_runs WHERE id = $1', [id]);
        return result.rows[0] ? this.mapPayRun(result.rows[0]) : null;
    }
    async findPayRunsByPeriod(payPeriodId) {
        const result = await this.pool.query('SELECT * FROM pay_runs WHERE pay_period_id = $1 ORDER BY created_at DESC', [payPeriodId]);
        return result.rows.map(this.mapPayRun);
    }
    async updatePayRun(id, updates) {
        const existing = await this.findPayRunById(id);
        if (!existing)
            return null;
        const fields = [];
        const params = [];
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
        if (fields.length === 0)
            return existing;
        fields.push(`updated_at = $${paramIndex++}`);
        params.push(new Date());
        fields.push(`version = version + 1`);
        params.push(id);
        const result = await this.pool.query(`UPDATE pay_runs SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`, params);
        return result.rows[0] ? this.mapPayRun(result.rows[0]) : null;
    }
    async createPayStub(stub, client) {
        const db = client || this.pool;
        const id = (0, uuid_1.v4)();
        const now = new Date();
        const result = await db.query(`
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
      `, [
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
        ]);
        return this.mapPayStub(result.rows[0]);
    }
    async findPayStubById(id) {
        const result = await this.pool.query('SELECT * FROM pay_stubs WHERE id = $1', [id]);
        return result.rows[0] ? this.mapPayStub(result.rows[0]) : null;
    }
    async findPayStubs(filters) {
        const conditions = [];
        const params = [];
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
        const result = await this.pool.query(`SELECT * FROM pay_stubs ${whereClause} ORDER BY pay_date DESC, caregiver_name ASC`, params);
        return result.rows.map(this.mapPayStub);
    }
    async createTaxConfiguration(config, client) {
        const db = client || this.pool;
        const id = (0, uuid_1.v4)();
        const now = new Date();
        const result = await db.query(`
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
      `, [
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
        ]);
        return this.mapTaxConfiguration(result.rows[0]);
    }
    async findTaxConfiguration(caregiverId) {
        const result = await this.pool.query(`SELECT * FROM tax_configurations 
       WHERE caregiver_id = $1 
       AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
       ORDER BY effective_from DESC
       LIMIT 1`, [caregiverId]);
        return result.rows[0] ? this.mapTaxConfiguration(result.rows[0]) : null;
    }
    async createDeduction(deduction, caregiverId, client) {
        const db = client || this.pool;
        const id = (0, uuid_1.v4)();
        const result = await db.query(`
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
      `, [
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
        ]);
        return this.mapDeduction(result.rows[0]);
    }
    async findDeductionsForCaregiver(caregiverId) {
        const result = await this.pool.query(`SELECT * FROM caregiver_deductions 
       WHERE caregiver_id = $1 
       AND is_active = true
       AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
       AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
       ORDER BY deduction_type`, [caregiverId]);
        return result.rows.map(this.mapDeduction);
    }
    async createPaymentRecord(payment, client) {
        const db = client || this.pool;
        const id = (0, uuid_1.v4)();
        const now = new Date();
        const result = await db.query(`
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
      `, [
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
        ]);
        return this.mapPaymentRecord(result.rows[0]);
    }
    async findPaymentRecordById(id) {
        const result = await this.pool.query('SELECT * FROM payment_records WHERE id = $1', [id]);
        return result.rows[0] ? this.mapPaymentRecord(result.rows[0]) : null;
    }
    async findPaymentRecords(filters) {
        const conditions = [];
        const params = [];
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
        const result = await this.pool.query(`SELECT * FROM payment_records ${whereClause} ORDER BY payment_date DESC`, params);
        return result.rows.map(this.mapPaymentRecord);
    }
    async createACHBatch(batch, client) {
        const db = client || this.pool;
        const id = (0, uuid_1.v4)();
        const now = new Date();
        const result = await db.query(`
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
      `, [
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
        ]);
        return this.mapACHBatch(result.rows[0]);
    }
    mapPayPeriod(row) {
        return {
            id: row.id,
            organizationId: row.organization_id,
            branchId: row.branch_id,
            periodNumber: row.period_number,
            periodYear: row.period_year,
            periodType: row.period_type,
            startDate: row.start_date,
            endDate: row.end_date,
            payDate: row.pay_date,
            status: row.status,
            statusHistory: JSON.parse(row.status_history || '[]'),
            cutoffDate: row.cutoff_date,
            approvalDeadline: row.approval_deadline,
            payRunId: row.pay_run_id,
            totalCaregivers: row.total_caregivers,
            totalHours: row.total_hours,
            totalGrossPay: row.total_gross_pay,
            totalNetPay: row.total_net_pay,
            totalTaxWithheld: row.total_tax_withheld,
            totalDeductions: row.total_deductions,
            notes: row.notes,
            fiscalQuarter: row.fiscal_quarter,
            fiscalYear: row.fiscal_year,
            createdAt: row.created_at,
            createdBy: row.created_by,
            updatedAt: row.updated_at,
            updatedBy: row.updated_by,
            version: row.version,
        };
    }
    mapTimeSheet(row) {
        return {
            id: row.id,
            organizationId: row.organization_id,
            branchId: row.branch_id,
            payPeriodId: row.pay_period_id,
            caregiverId: row.caregiver_id,
            caregiverName: row.caregiver_name,
            caregiverEmployeeId: row.caregiver_employee_id,
            timeEntries: JSON.parse(row.time_entries),
            regularHours: row.regular_hours,
            overtimeHours: row.overtime_hours,
            doubleTimeHours: row.double_time_hours,
            ptoHours: row.pto_hours,
            holidayHours: row.holiday_hours,
            sickHours: row.sick_hours,
            otherHours: row.other_hours,
            totalHours: row.total_hours,
            regularRate: row.regular_rate,
            overtimeRate: row.overtime_rate,
            doubleTimeRate: row.double_time_rate,
            regularEarnings: row.regular_earnings,
            overtimeEarnings: row.overtime_earnings,
            doubleTimeEarnings: row.double_time_earnings,
            ptoEarnings: row.pto_earnings,
            holidayEarnings: row.holiday_earnings,
            sickEarnings: row.sick_earnings,
            otherEarnings: row.other_earnings,
            grossEarnings: row.gross_earnings,
            bonuses: JSON.parse(row.bonuses),
            reimbursements: JSON.parse(row.reimbursements),
            adjustments: JSON.parse(row.adjustments),
            totalAdjustments: row.total_adjustments,
            totalGrossPay: row.total_gross_pay,
            status: row.status,
            statusHistory: JSON.parse(row.status_history || '[]'),
            submittedAt: row.submitted_at,
            submittedBy: row.submitted_by,
            approvedAt: row.approved_at,
            approvedBy: row.approved_by,
            approvalNotes: row.approval_notes,
            hasDiscrepancies: row.has_discrepancies,
            discrepancyFlags: JSON.parse(row.discrepancy_flags || '[]'),
            evvRecordIds: JSON.parse(row.evv_record_ids),
            visitIds: JSON.parse(row.visit_ids),
            notes: row.notes,
            reviewNotes: row.review_notes,
            createdAt: row.created_at,
            createdBy: row.created_by,
            updatedAt: row.updated_at,
            updatedBy: row.updated_by,
            version: row.version,
            deletedAt: row.deleted_at ? row.deleted_at : null,
            deletedBy: row.deleted_by ? row.deleted_by : null,
        };
    }
    mapPayRun(row) {
        return {
            id: row.id,
            organizationId: row.organization_id,
            branchId: row.branch_id,
            payPeriodId: row.pay_period_id,
            payPeriodStartDate: row.pay_period_start_date,
            payPeriodEndDate: row.pay_period_end_date,
            payDate: row.pay_date,
            runNumber: row.run_number,
            runType: row.run_type,
            status: row.status,
            statusHistory: JSON.parse(row.status_history || '[]'),
            initiatedAt: row.initiated_at,
            initiatedBy: row.initiated_by,
            calculatedAt: row.calculated_at,
            approvedAt: row.approved_at,
            approvedBy: row.approved_by,
            processedAt: row.processed_at,
            processedBy: row.processed_by,
            payStubIds: JSON.parse(row.pay_stub_ids),
            totalPayStubs: row.total_pay_stubs,
            totalCaregivers: row.total_caregivers,
            totalHours: row.total_hours,
            totalGrossPay: row.total_gross_pay,
            totalDeductions: row.total_deductions,
            totalTaxWithheld: row.total_tax_withheld,
            totalNetPay: row.total_net_pay,
            federalIncomeTax: row.federal_income_tax,
            stateIncomeTax: row.state_income_tax,
            socialSecurityTax: row.social_security_tax,
            medicareTax: row.medicare_tax,
            localTax: row.local_tax,
            benefitsDeductions: row.benefits_deductions,
            garnishments: row.garnishments,
            otherDeductions: row.other_deductions,
            directDepositCount: row.direct_deposit_count,
            directDepositAmount: row.direct_deposit_amount,
            checkCount: row.check_count,
            checkAmount: row.check_amount,
            cashCount: row.cash_count,
            cashAmount: row.cash_amount,
            payrollRegisterUrl: row.payroll_register_url,
            taxReportUrl: row.tax_report_url,
            exportFiles: JSON.parse(row.export_files || '[]'),
            complianceChecks: JSON.parse(row.compliance_checks || '[]'),
            compliancePassed: row.compliance_passed,
            hasErrors: row.has_errors,
            errors: JSON.parse(row.errors || '[]'),
            warnings: JSON.parse(row.warnings || '[]'),
            notes: row.notes,
            internalNotes: row.internal_notes,
            createdAt: row.created_at,
            createdBy: row.created_by,
            updatedAt: row.updated_at,
            updatedBy: row.updated_by,
            version: row.version,
        };
    }
    mapPayStub(row) {
        return {
            id: row.id,
            organizationId: row.organization_id,
            branchId: row.branch_id,
            payRunId: row.pay_run_id,
            payPeriodId: row.pay_period_id,
            caregiverId: row.caregiver_id,
            timeSheetId: row.time_sheet_id,
            caregiverName: row.caregiver_name,
            caregiverEmployeeId: row.caregiver_employee_id,
            caregiverAddress: row.caregiver_address ? JSON.parse(row.caregiver_address) : undefined,
            payPeriodStartDate: row.pay_period_start_date,
            payPeriodEndDate: row.pay_period_end_date,
            payDate: row.pay_date,
            stubNumber: row.stub_number,
            regularHours: row.regular_hours,
            overtimeHours: row.overtime_hours,
            doubleTimeHours: row.double_time_hours,
            ptoHours: row.pto_hours,
            holidayHours: row.holiday_hours,
            sickHours: row.sick_hours,
            otherHours: row.other_hours,
            totalHours: row.total_hours,
            regularPay: row.regular_pay,
            overtimePay: row.overtime_pay,
            doubleTimePay: row.double_time_pay,
            ptoPay: row.pto_pay,
            holidayPay: row.holiday_pay,
            sickPay: row.sick_pay,
            otherPay: row.other_pay,
            bonuses: row.bonuses,
            commissions: row.commissions,
            reimbursements: row.reimbursements,
            retroactivePay: row.retroactive_pay,
            otherEarnings: row.other_earnings,
            currentGrossPay: row.current_gross_pay,
            yearToDateGrossPay: row.year_to_date_gross_pay,
            deductions: JSON.parse(row.deductions),
            federalIncomeTax: row.federal_income_tax,
            stateIncomeTax: row.state_income_tax,
            localIncomeTax: row.local_income_tax,
            socialSecurityTax: row.social_security_tax,
            medicareTax: row.medicare_tax,
            additionalMedicareTax: row.additional_medicare_tax,
            totalTaxWithheld: row.total_tax_withheld,
            healthInsurance: row.health_insurance,
            dentalInsurance: row.dental_insurance,
            visionInsurance: row.vision_insurance,
            lifeInsurance: row.life_insurance,
            retirement401k: row.retirement_401k,
            retirementRoth: row.retirement_roth,
            fsaHealthcare: row.fsa_healthcare,
            fsaDependentCare: row.fsa_dependent_care,
            hsa: row.hsa,
            garnishments: row.garnishments,
            unionDues: row.union_dues,
            otherDeductions: row.other_deductions,
            totalOtherDeductions: row.total_other_deductions,
            currentNetPay: row.current_net_pay,
            yearToDateNetPay: row.year_to_date_net_pay,
            ytdHours: row.ytd_hours,
            ytdGrossPay: row.ytd_gross_pay,
            ytdFederalTax: row.ytd_federal_tax,
            ytdStateTax: row.ytd_state_tax,
            ytdSocialSecurity: row.ytd_social_security,
            ytdMedicare: row.ytd_medicare,
            ytdDeductions: row.ytd_deductions,
            ytdNetPay: row.ytd_net_pay,
            paymentMethod: row.payment_method,
            paymentId: row.payment_id,
            bankAccountId: row.bank_account_id,
            bankAccountLast4: row.bank_account_last4,
            checkNumber: row.check_number,
            checkDate: row.check_date,
            checkStatus: row.check_status,
            status: row.status,
            statusHistory: JSON.parse(row.status_history || '[]'),
            calculatedAt: row.calculated_at,
            calculatedBy: row.calculated_by,
            approvedAt: row.approved_at,
            approvedBy: row.approved_by,
            deliveredAt: row.delivered_at,
            deliveryMethod: row.delivery_method,
            viewedAt: row.viewed_at,
            pdfUrl: row.pdf_url,
            pdfGeneratedAt: row.pdf_generated_at,
            isVoid: row.is_void,
            voidReason: row.void_reason,
            voidedAt: row.voided_at,
            voidedBy: row.voided_by,
            notes: row.notes,
            internalNotes: row.internal_notes,
            createdAt: row.created_at,
            createdBy: row.created_by,
            updatedAt: row.updated_at,
            updatedBy: row.updated_by,
            version: row.version,
        };
    }
    mapTaxConfiguration(row) {
        return {
            id: row.id,
            organizationId: row.organization_id,
            caregiverId: row.caregiver_id,
            federalFilingStatus: row.federal_filing_status,
            federalAllowances: row.federal_allowances,
            federalExtraWithholding: row.federal_extra_withholding,
            federalExempt: row.federal_exempt,
            w4Step2: row.w4_step_2,
            w4Step3Dependents: row.w4_step_3_dependents,
            w4Step4aOtherIncome: row.w4_step_4a_other_income,
            w4Step4bDeductions: row.w4_step_4b_deductions,
            w4Step4cExtraWithholding: row.w4_step_4c_extra_withholding,
            stateFilingStatus: row.state_filing_status,
            stateAllowances: row.state_allowances,
            stateExtraWithholding: row.state_extra_withholding,
            stateExempt: row.state_exempt,
            stateResidence: row.state_residence,
            localTaxJurisdiction: row.local_tax_jurisdiction,
            localExempt: row.local_exempt,
            effectiveFrom: row.effective_from,
            effectiveTo: row.effective_to,
            lastUpdated: row.last_updated,
            w4OnFile: row.w4_on_file,
            w4FileDate: row.w4_file_date,
            w4DocumentId: row.w4_document_id,
            stateFormOnFile: row.state_form_on_file,
            stateFormDate: row.state_form_date,
            stateFormDocumentId: row.state_form_document_id,
            createdAt: row.created_at,
            createdBy: row.created_by,
            updatedAt: row.updated_at,
            updatedBy: row.updated_by,
            version: row.version,
        };
    }
    mapDeduction(row) {
        return {
            id: row.id,
            deductionType: row.deduction_type,
            deductionCode: row.deduction_code,
            description: row.description,
            amount: row.amount,
            calculationMethod: row.calculation_method,
            percentage: row.percentage,
            hasLimit: row.has_limit,
            yearlyLimit: row.yearly_limit,
            yearToDateAmount: row.year_to_date_amount,
            remainingAmount: row.remaining_amount,
            isPreTax: row.is_pre_tax,
            isPostTax: row.is_post_tax,
            isStatutory: row.is_statutory,
            employerMatch: row.employer_match,
            employerMatchPercentage: row.employer_match_percentage,
            garnishmentOrder: row.garnishment_order ? JSON.parse(row.garnishment_order) : undefined,
            isActive: row.is_active,
            effectiveFrom: row.effective_from,
            effectiveTo: row.effective_to,
        };
    }
    mapPaymentRecord(row) {
        return {
            id: row.id,
            organizationId: row.organization_id,
            branchId: row.branch_id,
            payRunId: row.pay_run_id,
            payStubId: row.pay_stub_id,
            caregiverId: row.caregiver_id,
            paymentNumber: row.payment_number,
            paymentMethod: row.payment_method,
            paymentAmount: row.payment_amount,
            paymentDate: row.payment_date,
            bankAccountId: row.bank_account_id,
            routingNumber: row.routing_number,
            accountNumber: row.account_number,
            accountType: row.account_type,
            transactionId: row.transaction_id,
            traceNumber: row.trace_number,
            checkNumber: row.check_number,
            checkDate: row.check_date,
            checkStatus: row.check_status,
            checkClearedDate: row.check_cleared_date,
            checkImageUrl: row.check_image_url,
            status: row.status,
            statusHistory: JSON.parse(row.status_history || '[]'),
            initiatedAt: row.initiated_at,
            initiatedBy: row.initiated_by,
            processedAt: row.processed_at,
            settledAt: row.settled_at,
            achBatchId: row.ach_batch_id,
            achFileId: row.ach_file_id,
            hasErrors: row.has_errors,
            errorCode: row.error_code,
            errorMessage: row.error_message,
            errorDetails: row.error_details,
            isReissue: row.is_reissue,
            originalPaymentId: row.original_payment_id,
            reissueReason: row.reissue_reason,
            notes: row.notes,
            createdAt: row.created_at,
            createdBy: row.created_by,
            updatedAt: row.updated_at,
            updatedBy: row.updated_by,
            version: row.version,
        };
    }
    mapACHBatch(row) {
        return {
            id: row.id,
            organizationId: row.organization_id,
            batchNumber: row.batch_number,
            batchDate: row.batch_date,
            effectiveDate: row.effective_date,
            companyName: row.company_name,
            companyId: row.company_id,
            companyEntryDescription: row.company_entry_description,
            paymentIds: JSON.parse(row.payment_ids),
            transactionCount: row.transaction_count,
            totalDebitAmount: row.total_debit_amount,
            totalCreditAmount: row.total_credit_amount,
            achFileUrl: row.ach_file_url,
            achFileFormat: row.ach_file_format,
            achFileGeneratedAt: row.ach_file_generated_at,
            achFileHash: row.ach_file_hash,
            status: row.status,
            submittedAt: row.submitted_at,
            submittedBy: row.submitted_by,
            originatingBankRoutingNumber: row.originating_bank_routing_number,
            originatingBankAccountNumber: row.originating_bank_account_number,
            settledAt: row.settled_at,
            settlementConfirmation: row.settlement_confirmation,
            hasReturns: row.has_returns,
            returnCount: row.return_count,
            returns: JSON.parse(row.returns || '[]'),
            notes: row.notes,
            createdAt: row.created_at,
            createdBy: row.created_by,
            updatedAt: row.updated_at,
            updatedBy: row.updated_by,
            version: row.version,
        };
    }
}
exports.PayrollRepository = PayrollRepository;
//# sourceMappingURL=payroll-repository.js.map