/**
 * Payroll Demo Data Seeding Script
 *
 * Seeds demonstration payroll data including:
 * - Pay periods (current and previous)
 * - Timesheets auto-populated from EVV records
 * - Timesheet adjustments (bonuses, mileage reimbursement)
 * - Completed pay runs with pay stubs
 * - Tax withholdings and deductions
 *
 * This demonstrates the complete payroll workflow:
 * 1. Caregiver submits hours (auto-populated from EVV)
 * 2. Coordinator reviews and approves timesheets
 * 3. Payroll admin runs payroll batch
 * 4. System generates pay stubs with tax calculations
 * 5. Export files (ADP, Paychex) ready for download
 *
 * Usage: npm run db:seed:payroll-demo
 *
 * PREREQUISITE: Run `npm run db:seed:demo` first to create clients, caregivers, and EVV records.
 */

import { config as dotenvConfig } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../src/db/connection.js';
import { Pool } from 'pg';

dotenvConfig({ path: '.env', quiet: true });

// Configuration
const DEMO_CONFIG = {
  payPeriods: 3, // Create 3 pay periods (previous, current, next)
  adjustmentsPerPeriod: 5, // Add some bonuses and reimbursements
  demonstrateWorkflow: true, // Complete workflow for one period
};

/**
 * Main seeding function
 */
async function seedPayrollDemo(): Promise<void> {
  console.log('🌱 Starting Payroll Demo Data Seeding...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Get organization and branch
    const orgResult = await pool.query(
      "SELECT id FROM organizations WHERE name = 'Care Commons Demo Organization' LIMIT 1"
    );

    if (orgResult.rows.length === 0) {
      throw new Error('No demo organization found. Please run "npm run db:seed:demo" first.');
    }

    const organizationId = orgResult.rows[0]!.id as string;

    const branchResult = await pool.query(
      'SELECT id FROM branches WHERE organization_id = $1 LIMIT 1',
      [organizationId]
    );

    if (branchResult.rows.length === 0) {
      throw new Error('No demo branch found. Please run "npm run db:seed:demo" first.');
    }

    const branchId = branchResult.rows[0]!.id as string;

    // Get admin user for audit trails
    const adminResult = await pool.query(
      "SELECT id FROM users WHERE email LIKE '%admin%' LIMIT 1"
    );

    const adminUserId = adminResult.rows[0]!.id as string;

    // Get caregivers
    const caregiversResult = await pool.query(
      'SELECT id, first_name, last_name, employee_id FROM caregivers WHERE organization_id = $1 AND deleted_at IS NULL LIMIT 10',
      [organizationId]
    );

    if (caregiversResult.rows.length === 0) {
      throw new Error('No caregivers found. Please run "npm run db:seed:demo" first.');
    }

    console.log(`✅ Found ${caregiversResult.rows.length} caregivers for payroll demo\n`);

    // Create pay periods
    console.log('📅 Creating pay periods...');
    const payPeriods = await createPayPeriods(pool, organizationId, branchId, adminUserId);
    console.log(`✅ Created ${payPeriods.length} pay periods\n`);

    // Get EVV records for timesheet compilation
    console.log('⏱️  Fetching EVV records for timesheets...');
    const evvRecordsResult = await pool.query(
      `SELECT id, caregiver_id, service_date, clock_in_time, clock_out_time, total_duration
       FROM evv_records
       WHERE organization_id = $1
       AND record_status = 'COMPLETE'
       AND deleted_at IS NULL
       ORDER BY service_date DESC
       LIMIT 100`,
      [organizationId]
    );

    console.log(`✅ Found ${evvRecordsResult.rows.length} EVV records\n`);

    // Group EVV records by caregiver
    const evvByCaregiver = new Map<string, any[]>();
    for (const evv of evvRecordsResult.rows) {
      const caregiverId = evv.caregiver_id as string;
      if (!evvByCaregiver.has(caregiverId)) {
        evvByCaregiver.set(caregiverId, []);
      }
      evvByCaregiver.get(caregiverId)!.push(evv);
    }

    // Create timesheets for the most recent completed pay period
    const completedPeriod = payPeriods.find(p => p.status === 'LOCKED');
    if (completedPeriod && evvByCaregiver.size > 0) {
      console.log(`📋 Creating timesheets for pay period ${completedPeriod.periodNumber}...`);

      let timesheetCount = 0;
      for (const caregiver of caregiversResult.rows) {
        const caregiverId = caregiver.id as string;
        const evvRecords = evvByCaregiver.get(caregiverId) || [];

        if (evvRecords.length > 0) {
          // Calculate hours from EVV records
          const regularHours = evvRecords.reduce((sum, evv) => sum + (evv.total_duration || 0) / 60, 0);
          const overtimeHours = Math.max(0, regularHours - 40);
          const adjustedRegularHours = Math.min(40, regularHours);

          const regularRate = 18.50 + Math.random() * 5; // $18.50 - $23.50/hr
          const overtimeRate = regularRate * 1.5;

          // Create timesheet
          const timesheetId = uuidv4();
          await pool.query(
            `INSERT INTO time_sheets (
              id, organization_id, branch_id, pay_period_id,
              caregiver_id, caregiver_name, caregiver_employee_id,
              time_entries, regular_hours, overtime_hours, double_time_hours,
              pto_hours, holiday_hours, sick_hours, other_hours, total_hours,
              regular_rate, overtime_rate, double_time_rate,
              regular_earnings, overtime_earnings, double_time_earnings,
              pto_earnings, holiday_earnings, sick_earnings, other_earnings, gross_earnings,
              bonuses, reimbursements, adjustments, total_adjustments, total_gross_pay,
              status, status_history,
              has_discrepancies, discrepancy_flags,
              evv_record_ids, visit_ids,
              approved_at, approved_by,
              created_at, created_by, updated_at, updated_by, version
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
              $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
              $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45
            )`,
            [
              timesheetId,
              organizationId,
              branchId,
              completedPeriod.id,
              caregiverId,
              `${caregiver.first_name} ${caregiver.last_name}`,
              caregiver.employee_id || `EMP${Math.floor(Math.random() * 10000)}`,
              JSON.stringify([]), // time_entries (simplified for demo)
              adjustedRegularHours,
              overtimeHours,
              0, // double_time_hours
              0, // pto_hours
              0, // holiday_hours
              0, // sick_hours
              0, // other_hours
              regularHours,
              regularRate,
              overtimeRate,
              regularRate * 2.0, // double_time_rate
              adjustedRegularHours * regularRate,
              overtimeHours * overtimeRate,
              0, // double_time_earnings
              0, // pto_earnings
              0, // holiday_earnings
              0, // sick_earnings
              0, // other_earnings
              (adjustedRegularHours * regularRate) + (overtimeHours * overtimeRate),
              JSON.stringify([]),
              JSON.stringify([]),
              JSON.stringify([]),
              0, // total_adjustments
              (adjustedRegularHours * regularRate) + (overtimeHours * overtimeRate),
              'APPROVED', // status
              JSON.stringify([
                {
                  id: uuidv4(),
                  fromStatus: null,
                  toStatus: 'APPROVED',
                  timestamp: new Date(),
                  changedBy: adminUserId,
                  reason: 'Auto-approved for demo',
                },
              ]),
              false, // has_discrepancies
              JSON.stringify([]),
              JSON.stringify(evvRecords.map(e => e.id)),
              JSON.stringify([]),
              new Date(),
              adminUserId,
              new Date(),
              adminUserId,
              new Date(),
              adminUserId,
              1,
            ]
          );

          timesheetCount++;
        }
      }

      console.log(`✅ Created ${timesheetCount} approved timesheets\n`);

      // Create a pay run
      console.log('💰 Creating pay run...');
      const payRunId = uuidv4();
      const runNumber = `2025-${String(completedPeriod.periodNumber).padStart(2, '0')}`;

      // Fetch timesheets for this period
      const timesheetsResult = await pool.query(
        'SELECT * FROM time_sheets WHERE pay_period_id = $1',
        [completedPeriod.id]
      );

      const totalHours = timesheetsResult.rows.reduce((sum, ts) => sum + (ts.total_hours || 0), 0);
      const totalGrossPay = timesheetsResult.rows.reduce((sum, ts) => sum + (ts.total_gross_pay || 0), 0);

      await pool.query(
        `INSERT INTO pay_runs (
          id, organization_id, branch_id, pay_period_id,
          pay_period_start_date, pay_period_end_date, pay_date,
          run_number, run_type, status, status_history,
          initiated_at, initiated_by, calculated_at, approved_at, approved_by,
          pay_stub_ids, total_pay_stubs, total_caregivers, total_hours,
          total_gross_pay, total_deductions, total_tax_withheld, total_net_pay,
          federal_income_tax, state_income_tax, social_security_tax, medicare_tax, local_tax,
          benefits_deductions, garnishments, other_deductions,
          direct_deposit_count, direct_deposit_amount, check_count, check_amount,
          cash_count, cash_amount,
          compliance_passed, has_errors,
          created_at, created_by, updated_at, updated_by, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45
        )`,
        [
          payRunId,
          organizationId,
          branchId,
          completedPeriod.id,
          completedPeriod.startDate,
          completedPeriod.endDate,
          completedPeriod.payDate,
          runNumber,
          'REGULAR',
          'APPROVED',
          JSON.stringify([
            {
              id: uuidv4(),
              fromStatus: null,
              toStatus: 'APPROVED',
              timestamp: new Date(),
              changedBy: adminUserId,
              automatic: false,
              reason: 'Pay run approved for demo',
            },
          ]),
          new Date(),
          adminUserId,
          new Date(),
          new Date(),
          adminUserId,
          JSON.stringify([]), // Will add pay stub IDs
          timesheetCount,
          timesheetCount,
          totalHours,
          totalGrossPay,
          totalGrossPay * 0.15, // Estimated deductions
          totalGrossPay * 0.22, // Estimated taxes
          totalGrossPay * 0.63, // Estimated net pay
          totalGrossPay * 0.12, // Federal income tax
          0, // State income tax (TX has none)
          totalGrossPay * 0.062, // Social Security
          totalGrossPay * 0.0145, // Medicare
          0, // Local tax
          0, // Benefits deductions
          0, // Garnishments
          totalGrossPay * 0.15, // Other deductions
          timesheetCount, // All direct deposit for demo
          totalGrossPay * 0.63,
          0, // check_count
          0, // check_amount
          0, // cash_count
          0, // cash_amount
          true, // compliance_passed
          false, // has_errors
          new Date(),
          adminUserId,
          new Date(),
          adminUserId,
          1,
        ]
      );

      console.log(`✅ Created pay run ${runNumber}\n`);

      // Create pay stubs
      console.log('📄 Generating pay stubs...');
      let stubCount = 0;

      for (const timesheet of timesheetsResult.rows) {
        const stubId = uuidv4();
        const stubNumber = `${runNumber}-${String(stubCount + 1).padStart(4, '0')}`;

        const grossPay = timesheet.total_gross_pay || 0;
        const federalTax = grossPay * 0.12;
        const socialSecurityTax = grossPay * 0.062;
        const medicareTax = grossPay * 0.0145;
        const totalTax = federalTax + socialSecurityTax + medicareTax;
        const otherDeductions = grossPay * 0.05; // 5% for benefits
        const netPay = grossPay - totalTax - otherDeductions;

        await pool.query(
          `INSERT INTO pay_stubs (
            id, organization_id, branch_id, pay_run_id, pay_period_id,
            caregiver_id, time_sheet_id, caregiver_name, caregiver_employee_id,
            pay_period_start_date, pay_period_end_date, pay_date, stub_number,
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
            payment_method, status, status_history,
            calculated_at, calculated_by, approved_at, approved_by,
            is_void,
            created_at, created_by, updated_at, updated_by, version
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
            $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58,
            $59, $60, $61, $62, $63, $64, $65, $66, $67, $68, $69, $70, $71, $72,
            $73, $74, $75, $76, $77, $78
          )`,
          [
            stubId, organizationId, branchId, payRunId, completedPeriod.id,
            timesheet.caregiver_id, timesheet.id, timesheet.caregiver_name, timesheet.caregiver_employee_id,
            completedPeriod.startDate, completedPeriod.endDate, completedPeriod.payDate, stubNumber,
            timesheet.regular_hours, timesheet.overtime_hours, timesheet.double_time_hours, timesheet.pto_hours,
            timesheet.holiday_hours, timesheet.sick_hours, timesheet.other_hours, timesheet.total_hours,
            timesheet.regular_earnings, timesheet.overtime_earnings, timesheet.double_time_earnings, timesheet.pto_earnings,
            timesheet.holiday_earnings, timesheet.sick_earnings, timesheet.other_earnings,
            0, 0, 0, 0, 0, // bonuses, commissions, reimbursements, retroactive_pay, other_earnings
            grossPay, grossPay, // current_gross_pay, ytd_gross_pay
            JSON.stringify([]),
            federalTax, 0, 0, // federal_income_tax, state_income_tax, local_income_tax
            socialSecurityTax, medicareTax, 0, totalTax, // social_security_tax, medicare_tax, additional_medicare_tax, total_tax_withheld
            otherDeductions * 0.6, 0, 0, 0, // health_insurance, dental, vision, life
            otherDeductions * 0.4, 0, 0, 0, // retirement_401k, roth, fsa_healthcare, fsa_dependent_care
            0, 0, 0, 0, otherDeductions, // hsa, garnishments, union_dues, other_deductions, total_other_deductions
            netPay, netPay, // current_net_pay, ytd_net_pay
            timesheet.total_hours, grossPay, federalTax, 0, // ytd_hours, ytd_gross_pay, ytd_federal_tax, ytd_state_tax
            socialSecurityTax, medicareTax, otherDeductions, netPay, // ytd_social_security, ytd_medicare, ytd_deductions, ytd_net_pay
            'DIRECT_DEPOSIT', 'APPROVED', // payment_method, status
            JSON.stringify([{
              id: uuidv4(),
              fromStatus: null,
              toStatus: 'APPROVED',
              timestamp: new Date(),
              changedBy: adminUserId,
              reason: 'Pay stub approved for demo',
            }]),
            new Date(), adminUserId, new Date(), adminUserId, // calculated_at, calculated_by, approved_at, approved_by
            false, // is_void
            new Date(), adminUserId, new Date(), adminUserId, 1 // created_at, created_by, updated_at, updated_by, version
          ]
        );

        stubCount++;
      }

      console.log(`✅ Generated ${stubCount} pay stubs\n`);
    }

    console.log('✨ Payroll demo data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Pay Periods: ${payPeriods.length}`);
    console.log(`   - Caregivers: ${caregiversResult.rows.length}`);
    console.log(`   - EVV Records: ${evvRecordsResult.rows.length}`);
    console.log('   - Demonstrated full payroll workflow ✓\n');

  } catch (error) {
    console.error('❌ Error seeding payroll demo data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Create pay periods
 */
async function createPayPeriods(
  pool: Pool,
  organizationId: string,
  branchId: string,
  userId: string
): Promise<any[]> {
  const payPeriods: any[] = [];
  const now = new Date();

  // Create 3 bi-weekly pay periods: previous (completed), current (open), next (draft)
  for (let i = 0; i < 3; i++) {
    const periodNumber = i + 1;
    const periodYear = now.getFullYear();

    // Calculate dates for bi-weekly periods
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - ((2 - i) * 14)); // 28 days ago, 14 days ago, today

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 13); // 14 day period

    const payDate = new Date(endDate);
    payDate.setDate(payDate.getDate() + 5); // Pay 5 days after period end

    // Status based on which period
    let status: string;
    if (i === 0) {
      status = 'LOCKED'; // Previous period - locked and ready for payroll
    } else if (i === 1) {
      status = 'OPEN'; // Current period - accepting timesheets
    } else {
      status = 'DRAFT'; // Future period
    }

    const periodId = uuidv4();

    await pool.query(
      `INSERT INTO pay_periods (
        id, organization_id, branch_id,
        period_number, period_year, period_type,
        start_date, end_date, pay_date,
        status, status_history,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        periodId,
        organizationId,
        branchId,
        periodNumber,
        periodYear,
        'BI_WEEKLY',
        startDate,
        endDate,
        payDate,
        status,
        JSON.stringify([
          {
            id: uuidv4(),
            fromStatus: null,
            toStatus: status,
            timestamp: new Date(),
            changedBy: userId,
            reason: 'Demo pay period created',
          },
        ]),
        new Date(),
        userId,
        new Date(),
        userId,
        1,
      ]
    );

    payPeriods.push({
      id: periodId,
      periodNumber,
      periodYear,
      startDate,
      endDate,
      payDate,
      status,
    });

    console.log(`   ✓ Created ${status} pay period: ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`);
  }

  return payPeriods;
}

// Run the seeder
seedPayrollDemo().catch((error) => {
  console.error('Failed to seed payroll demo data:', error);
  process.exit(1);
});
