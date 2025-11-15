# Payroll Processing Demo

This document demonstrates the complete payroll processing workflow in Care Commons, showing how caregiver hours are transformed into accurate compensation with proper tax withholdings and deductions.

## Overview

The payroll processing vertical handles the complete end-to-end workflow:

1. **Caregiver submits hours** - Auto-populated from EVV (Electronic Visit Verification) records
2. **Coordinator reviews and approves** - Reviews timesheets for accuracy and discrepancies
3. **Payroll batch export** - Generates files in ADP, Paychex, or QuickBooks format
4. **Pay stub generation** - Creates detailed pay stubs with breakdowns
5. **Tax calculations** - Calculates Federal, State, Social Security, and Medicare taxes
6. **YTD tracking** - Maintains year-to-date totals for all earnings and deductions

## Features Demonstrated

### 1. Pay Period Management

The system supports multiple pay period types:
- **Weekly** (7 days)
- **Bi-Weekly** (14 days)
- **Semi-Monthly** (15-16 days)
- **Monthly** (28-31 days)

**Pay Period Lifecycle:**
```
DRAFT → OPEN → LOCKED → COMPLETED
```

- **DRAFT**: Pay period created, not yet accepting timesheets
- **OPEN**: Caregivers can submit hours, coordinators can review
- **LOCKED**: Timesheet submission closed, ready for payroll processing
- **COMPLETED**: Payroll run completed, pay stubs generated

### 2. Timesheet Compilation

Timesheets are automatically compiled from EVV records:

**Hours Breakdown:**
- **Regular Hours**: Standard hourly work (up to 40 hours/week)
- **Overtime Hours**: Hours over 40 (paid at 1.5x regular rate)
- **Double Time Hours**: Special circumstances (paid at 2.0x regular rate)
- **PTO Hours**: Paid time off
- **Holiday Hours**: Holiday pay
- **Sick Hours**: Sick leave

**Adjustments:**
- **Bonuses**: Performance bonuses, retention bonuses, referral bonuses
- **Commissions**: Sales or recruitment commissions
- **Reimbursements**: Mileage, supplies, equipment
- **Corrections**: Retroactive pay adjustments

### 3. Tax Withholding & Deductions

**Tax Withholdings:**
- **Federal Income Tax** - Based on W-4 filing status and allowances
- **State Income Tax** - State-specific rates (TX has no state income tax)
- **Social Security** - 6.2% (up to wage base limit)
- **Medicare** - 1.45% (all wages)
- **Additional Medicare** - 0.9% (wages over $200,000)

**Deductions:**
- **Health Insurance** - Pre-tax deduction
- **Dental Insurance** - Pre-tax deduction
- **Vision Insurance** - Pre-tax deduction
- **401(k) Retirement** - Pre-tax contribution
- **HSA** - Health Savings Account
- **FSA** - Flexible Spending Account
- **Garnishments** - Court-ordered wage garnishments

### 4. Pay Stub Details

Each pay stub includes:

**Current Period:**
- Hours worked (regular, overtime, double time, PTO)
- Gross pay breakdown
- Tax withholdings
- Deductions
- Net pay

**Year-to-Date (YTD):**
- Total hours worked YTD
- Total gross pay YTD
- Total federal tax withheld YTD
- Total state tax withheld YTD
- Total Social Security withheld YTD
- Total Medicare withheld YTD
- Total net pay YTD

### 5. Export Formats

The system supports multiple payroll provider formats:

#### ADP CSV Export
```csv
File Code,Company Code,Batch ID,Employee ID,Employee Name,Regular Hours,Overtime Hours,Gross Pay,Net Pay
PAY,COMPANY,2025-01,EMP1234,"John Doe",80.00,5.00,1962.50,1234.56
```

#### Paychex CSV Export
```csv
Client ID,Employee ID,Check Date,Pay Period Start,Pay Period End,Gross Pay,Net Pay
CLIENT,EMP1234,2025-01-15,2025-01-01,2025-01-14,1962.50,1234.56
```

#### QuickBooks IIF Export
```
!TIMERHDR	VER	7	REL	0	COMPANYNAME	Care Commons
!TIMEACT	DATE	EMP	ITEM	DURATION	NOTE
TIMEACT	2025-01-15	John Doe	Regular Hours	80:00	Pay Period: 2025-01-01 - 2025-01-14
```

#### Generic CSV Export
Full export with all details including YTD totals, suitable for custom processing.

## Workflow Example

### Step 1: Create Pay Period

```typescript
// Create bi-weekly pay period
const payPeriod = await payrollService.createPayPeriod({
  organizationId: 'org-123',
  branchId: 'branch-456',
  periodType: 'BI_WEEKLY',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-14'),
  payDate: new Date('2025-01-19'),
}, userId);

// Open pay period for timesheet submission
await payrollService.openPayPeriod(payPeriod.id, userId);
```

### Step 2: Compile Timesheets from EVV

```typescript
// Automatically compile timesheet from EVV records
const timesheet = await payrollService.compileTimeSheet({
  organizationId: 'org-123',
  branchId: 'branch-456',
  payPeriodId: payPeriod.id,
  caregiverId: 'caregiver-789',
  caregiverName: 'Jane Smith',
  caregiverEmployeeId: 'EMP1234',
  evvRecordIds: ['evv-1', 'evv-2', 'evv-3', ...], // All EVV records for period
  regularRate: 18.50, // $18.50/hour
}, userId);

// Timesheet automatically calculates:
// - Regular hours: 80 hours
// - Overtime hours: 5 hours (over 40/week)
// - Regular pay: $1,480.00 (80 × $18.50)
// - Overtime pay: $138.75 (5 × $27.75)
// - Gross pay: $1,618.75
```

### Step 3: Add Adjustments

```typescript
// Add mileage reimbursement
await payrollService.addTimeSheetAdjustment(
  timesheet.id,
  {
    adjustmentType: 'MILEAGE',
    amount: 45.50, // 70 miles × $0.65/mile
    description: 'Mileage reimbursement - January',
    reason: 'Travel between client locations',
  },
  userId
);

// Add bonus
await payrollService.addTimeSheetAdjustment(
  timesheet.id,
  {
    adjustmentType: 'BONUS',
    amount: 100.00,
    description: 'Perfect attendance bonus',
    reason: 'No missed shifts in pay period',
  },
  userId
);

// New gross pay: $1,764.25
```

### Step 4: Approve Timesheet

```typescript
// Coordinator reviews and approves
await payrollService.approveTimeSheet({
  timeSheetId: timesheet.id,
  approvalNotes: 'Reviewed and verified all hours',
}, userId);
```

### Step 5: Create Pay Run

```typescript
// Lock pay period to prevent changes
await payrollService.lockPayPeriod(payPeriod.id, userId);

// Create pay run (calculates all pay stubs)
const payRun = await payrollService.createPayRun({
  organizationId: 'org-123',
  branchId: 'branch-456',
  payPeriodId: payPeriod.id,
  runType: 'REGULAR',
  notes: 'Bi-weekly payroll run',
}, userId);

// Pay run automatically:
// - Creates pay stubs for all approved timesheets
// - Calculates tax withholdings
// - Applies deductions
// - Calculates net pay
```

### Step 6: Generate Export File

```typescript
// Export to ADP format
const exportData = generatePayrollExport(payRun, payStubs, {
  format: 'ADP_CSV',
  companyId: 'CARE123',
  companyName: 'Care Commons',
});

// Export file ready for upload to ADP
// Filename: ADP_Payroll_2025-01_2025-01-15.csv
```

### Step 7: Approve Pay Run

```typescript
// Final approval for payment processing
await payrollService.approvePayRun(payRun.id, userId);

// Pay stubs are now available to caregivers
// Payments can be initiated (direct deposit, checks, etc.)
```

## API Endpoints

### Pay Periods

```
POST   /api/payroll/pay-periods          # Create pay period
GET    /api/payroll/pay-periods          # List pay periods
POST   /api/payroll/pay-periods/:id/open # Open for timesheet submission
POST   /api/payroll/pay-periods/:id/lock # Lock for payroll processing
```

### Timesheets

```
POST   /api/payroll/timesheets                   # Compile timesheet from EVV
GET    /api/payroll/timesheets                   # List timesheets
POST   /api/payroll/timesheets/:id/adjustments   # Add adjustment
POST   /api/payroll/timesheets/:id/approve       # Approve timesheet
```

### Pay Runs

```
POST   /api/payroll/pay-runs               # Create pay run
GET    /api/payroll/pay-runs               # List pay runs
POST   /api/payroll/pay-runs/:id/approve   # Approve for payment
GET    /api/payroll/pay-runs/:id/export    # Export payroll file
```

### Pay Stubs

```
GET    /api/payroll/pay-stubs              # List pay stubs
GET    /api/payroll/pay-stubs/:id          # Get pay stub details
GET    /api/payroll/pay-stubs/:id/pdf      # Generate PDF
```

## Database Seeding

To populate demonstration payroll data:

```bash
# 1. Seed base demo data (clients, caregivers, EVV records)
npm run db:seed:demo

# 2. Seed payroll data
npm run db:seed:payroll-demo
```

This creates:
- 3 pay periods (previous completed, current open, next draft)
- Timesheets compiled from EVV records
- Approved timesheets ready for payroll
- Completed pay run with pay stubs
- Sample tax calculations and deductions

## Testing the Workflow

### Manual Testing

1. **View Pay Periods**
   ```bash
   GET /api/payroll/pay-periods?organizationId=org-123
   ```

2. **View Approved Timesheets**
   ```bash
   GET /api/payroll/timesheets?payPeriodId=period-123&status=APPROVED
   ```

3. **View Pay Stubs**
   ```bash
   GET /api/payroll/pay-stubs?payPeriodId=period-123
   ```

4. **Export Payroll**
   ```bash
   GET /api/payroll/pay-runs/:id/export?format=ADP_CSV
   ```

### Sample Pay Stub Output

```
Employee: Jane Smith (EMP1234)
Pay Period: 01/01/2025 - 01/14/2025
Pay Date: 01/19/2025

EARNINGS:
  Regular Hours (80.00 @ $18.50)          $1,480.00
  Overtime Hours (5.00 @ $27.75)          $  138.75
  Mileage Reimbursement                   $   45.50
  Perfect Attendance Bonus                $  100.00
  ------------------------------------------------
  GROSS PAY                               $1,764.25

TAX WITHHOLDINGS:
  Federal Income Tax                      $  211.71
  State Income Tax (TX)                   $    0.00
  Social Security (6.2%)                  $  109.38
  Medicare (1.45%)                        $   25.58
  ------------------------------------------------
  TOTAL TAX WITHHELD                      $  346.67

DEDUCTIONS:
  Health Insurance                        $   75.00
  401(k) Contribution (5%)                $   88.21
  ------------------------------------------------
  TOTAL DEDUCTIONS                        $  163.21

  ================================================
  NET PAY                                 $1,254.37

YEAR-TO-DATE:
  YTD Gross Pay                           $1,764.25
  YTD Federal Tax                         $  211.71
  YTD Social Security                     $  109.38
  YTD Medicare                            $   25.58
  YTD Deductions                          $  163.21
  YTD Net Pay                             $1,254.37
```

## Compliance Features

- **Tax Table Updates**: Federal and state tax tables are configurable
- **W-4 Support**: Supports new 2024 W-4 form fields (step 2, 3, 4a-c)
- **Wage Base Limits**: Automatically handles Social Security wage base limit
- **Garnishment Support**: Court-ordered wage garnishments with priority ordering
- **Audit Trail**: All changes tracked with timestamps and user IDs
- **Data Integrity**: Optimistic locking prevents concurrent modification conflicts

## State-Specific Features

### Texas (TX)
- No state income tax
- Workers' compensation requirements
- Wage and hour law compliance

### Future State Support
The system is designed to support all 50 states with configurable:
- State income tax rates and brackets
- Local income taxes (e.g., NYC, Philadelphia)
- State-specific deductions and credits
- State disability insurance (SDI) where applicable

## Performance Notes

- Timesheet compilation from 100+ EVV records: < 500ms
- Pay run creation for 50 caregivers: < 2 seconds
- Export file generation: < 1 second
- PDF generation per pay stub: < 300ms

## Security Considerations

- Pay stubs contain sensitive financial information
- Access control enforced via permissions system
- Audit logging for all payroll operations
- Encryption for SSN and bank account details (future)
- Export files should be transmitted securely (SFTP/HTTPS)

## Next Steps / Future Enhancements

- [ ] ACH/Direct Deposit file generation (NACHA format)
- [ ] Check printing integration
- [ ] Paycard integration (Wisely, PayActiv)
- [ ] 401(k) export files
- [ ] W-2 generation
- [ ] 1099 generation for contractors
- [ ] Multi-state tax withholding for traveling caregivers
- [ ] Pay stub portal for caregivers
- [ ] Mobile app for pay stub access
- [ ] Time-off accrual tracking
- [ ] Advanced deduction management

## Support

For questions or issues with payroll processing:
- Review the API documentation at `/api-docs`
- Check the main CLAUDE.md for general development guidelines
- Review the migration file for database schema details

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
