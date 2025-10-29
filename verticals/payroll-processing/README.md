# Payroll Processing

Transforms time tracking and visit data into accurate caregiver compensation with tax withholdings, deductions, and payment distribution.

## Overview

The Payroll Processing vertical handles the complete payroll lifecycle for home care organizations:

- **Pay Period Management** – Define weekly, bi-weekly, semi-monthly, or monthly pay cycles
- **Time Sheet Aggregation** – Consolidate EVV records and time entries into payable hours
- **Overtime & Rate Calculations** – Apply overtime rules, shift differentials, and special rates
- **Tax Withholdings** – Calculate federal, state, and local tax deductions based on W-4/state forms
- **Benefit Deductions** – Handle health insurance, retirement contributions, FSA, HSA
- **Garnishments** – Manage court-ordered wage garnishments with proper priority handling
- **Pay Stub Generation** – Create detailed earnings statements with YTD totals
- **Payment Distribution** – Generate direct deposits (ACH), checks, or alternative payment methods
- **Compliance Reporting** – Prepare quarterly tax filings (941, state withholding, SUTA)

## Key Concepts

### Pay Period
A defined time span for accumulating work hours and calculating pay. Supports multiple frequencies (weekly, bi-weekly, semi-monthly, monthly). Each period has:
- Start and end dates
- Pay date (when caregivers receive payment)
- Cutoff date for timesheet submission
- Status lifecycle (DRAFT → OPEN → LOCKED → PROCESSING → APPROVED → PAID → CLOSED)

### Time Sheet
Consolidated view of all worked hours for a single caregiver in a pay period. Automatically generated from EVV records and time entries, categorizing hours as:
- Regular hours
- Overtime hours (usually 1.5x)
- Double-time hours (usually 2x)
- PTO, holiday, and sick hours

Time sheets include adjustments (bonuses, reimbursements, corrections) and must be approved before payroll processing.

### Pay Run
The execution of payroll for an entire pay period. Orchestrates:
- Time sheet validation
- Gross pay calculation
- Tax and deduction computation
- Net pay determination
- Payment record generation
- Compliance checks

Pay runs produce aggregate reports and export files for banking (ACH) and tax reporting.

### Pay Stub
Individual caregiver's earnings statement showing:
- Hours breakdown by type
- Earnings breakdown (regular, overtime, bonuses, etc.)
- Tax withholdings (federal, state, FICA, Medicare)
- Other deductions (insurance, retirement, garnishments)
- Current period and year-to-date totals
- Net pay and payment method

### Deductions
Withholdings from gross pay, categorized as:
- **Pre-tax** – Reduce taxable income (401k, health insurance, HSA)
- **Post-tax** – Deducted after tax calculation (Roth IRA, some garnishments)
- **Statutory** – Required by law (FICA, Medicare, income taxes)

Deductions may have annual limits (e.g., Social Security cap, HSA contribution limit).

### Tax Configuration
Per-caregiver tax withholding setup based on:
- W-4 form (federal withholding)
- State withholding form
- Local tax jurisdictions
- Exemptions and additional withholdings

Uses the current W-4 format (post-2020) with multi-job adjustments, dependent credits, and extra withholding.

### Payment Record
Actual disbursement of funds to caregiver:
- Direct deposit (ACH/EFT with routing and account numbers)
- Paper check (with check number and clearing tracking)
- Alternative methods (paycard, Venmo, Zelle for special cases)

Tracks payment status from initiation through settlement, with error handling for returned payments.

### ACH Batch
Group of direct deposit payments submitted together to the bank:
- NACHA file generation
- Batch controls (hash totals, transaction counts)
- Effective date (when funds settle)
- Return handling (NSF, invalid account, etc.)

## Data Flow

```
EVV Records + Time Entries
  ↓
Time Sheets (per caregiver, per period)
  ↓ (approval)
Pay Run (entire organization/branch)
  ↓ (calculation)
Pay Stubs (individual earnings statements)
  ↓
Payment Records (disbursements)
  ↓
ACH Batch / Check Print
  ↓
Bank Settlement
```

## Integration Points

### Upstream Dependencies

**Caregiver & Staff Management**
- Caregiver records (employee ID, name, address)
- Pay rates (base, overtime, specialized)
- Tax configurations (W-4, state forms)
- Deduction enrollments (benefits, garnishments)
- Bank account information (for direct deposit)

**Time Tracking & EVV**
- EVV records (verified clock-in/out times)
- Visit completion data
- Service type and billing codes
- Overtime tracking and approvals

**Scheduling & Visits**
- Scheduled vs actual hours
- Holiday pay eligibility
- Weekend/night shift identification

### Downstream Consumers

**Billing & Invoicing**
- Labor cost allocation
- Service costing analysis
- Profitability tracking

**Compliance & Documentation**
- Quarterly tax filings (Form 941, state withholding)
- Annual W-2 generation
- Unemployment (SUTA/FUTA) filings
- Garnishment remittance reports

**Reporting & Analytics**
- Labor cost trends
- Overtime analysis
- Tax liability forecasting
- Payroll expense by program/branch

## Architecture

```
types/payroll.ts          Domain models and interfaces
repository/               Database access layer
  payroll-repository.ts   CRUD operations for all payroll entities
service/                  Business logic layer
  payroll-service.ts      Orchestrates payroll processing
  timesheet-service.ts    Timesheet aggregation and approval
  tax-service.ts          Tax calculation engine
utils/                    Calculation utilities
  pay-calculations.ts     Overtime, rate calculations
  tax-calculations.ts     Federal/state tax withholding
  deduction-calculations.ts  Benefits, garnishments
validation/               Input validation
  payroll-validator.ts    Payroll data validation
api/                      HTTP handlers (future)
```

## Core Operations

### Creating a Pay Period

```typescript
import { PayrollService } from '@care-commons/payroll-processing';

const period = await payrollService.createPayPeriod({
  organizationId: 'org-123',
  periodType: 'BI_WEEKLY',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-14'),
  payDate: new Date('2025-01-20'),
  cutoffDate: new Date('2025-01-15'),
});
```

### Generating Time Sheets

```typescript
// Automatically aggregate time entries for all caregivers
await payrollService.generateTimeSheets(periodId);

// Or generate for specific caregiver
await payrollService.generateTimeSheet({
  payPeriodId: periodId,
  caregiverId: 'caregiver-456',
  evvRecordIds: [...], // Auto-discovered if not provided
});
```

### Approving Time Sheets

```typescript
await payrollService.approveTimeSheet(timesheetId, {
  approvedBy: userId,
  notes: 'Verified all hours and adjustments',
});
```

### Running Payroll

```typescript
const payRun = await payrollService.createPayRun({
  payPeriodId: periodId,
  runType: 'REGULAR',
  caregiverIds: undefined, // Include all, or specify subset
});

// Calculate all pay stubs
await payrollService.calculatePayRun(payRun.id);

// Review and approve
await payrollService.approvePayRun(payRun.id, {
  approvedBy: userId,
});

// Generate payments
await payrollService.processPayments(payRun.id);
```

### ACH File Generation

```typescript
const achBatch = await payrollService.createACHBatch({
  organizationId: 'org-123',
  paymentIds: directDepositPaymentIds,
  effectiveDate: new Date('2025-01-20'),
  companyEntryDescription: 'PAYROLL',
});

// Download NACHA file for bank submission
const nachFile = await payrollService.downloadACHFile(achBatch.id);
```

## Tax Calculation

Payroll calculates taxes using:

- **Federal income tax** – IRS Publication 15-T withholding tables
- **FICA (Social Security)** – 6.2% up to annual wage base ($168,600 in 2024)
- **Medicare** – 1.45% on all wages, plus 0.9% Additional Medicare Tax over $200k
- **State income tax** – State-specific withholding tables and formulas
- **Local income tax** – City/county taxes where applicable
- **SUI/SDI** – State unemployment and disability insurance (employee portion where applicable)

Tax calculations respect:
- Pre-tax deductions (reduce taxable income)
- Filing status and W-4 adjustments
- Annual wage limits (Social Security cap)
- Multiple jobs and supplemental income

## Deduction Handling

### Pre-tax Deductions
Reduce taxable income for federal/state income tax (but not FICA/Medicare):
- Health insurance premiums
- Dental and vision insurance
- 401(k) and 403(b) contributions
- HSA contributions
- FSA (healthcare and dependent care)
- Commuter benefits

### Post-tax Deductions
Deducted after all taxes calculated:
- Roth IRA contributions
- After-tax retirement contributions
- Union dues
- Some garnishments

### Garnishments
Court-ordered wage withholdings with federal priority rules:
1. Child support and alimony
2. Federal tax levies
3. State tax levies
4. Creditor garnishments
5. Student loan garnishments

Each garnishment has a maximum percentage of disposable income (usually 25% for creditors, up to 50-65% for child support).

## Compliance & Reporting

### Quarterly (Form 941)
- Total wages paid
- Federal income tax withheld
- Social Security and Medicare taxes (employer + employee portions)
- Due dates: April 30, July 31, October 31, January 31

### Annual (W-2)
- Employee wage and tax statement
- Due to employees by January 31
- Filed with SSA by January 31 (with Form W-3)

### State Filings
- State income tax withholding (quarterly or monthly)
- State unemployment insurance (SUTA) – quarterly
- Varies by state

## Security & Privacy

- **Encrypted at rest** – SSNs, bank account numbers, routing numbers
- **Access controls** – Role-based permissions for payroll operations
- **Audit trail** – Full history of changes to pay rates, deductions, pay stubs
- **Data retention** – 7-year retention for tax records (IRS requirement)

## Status & Roadmap

### Implemented (v0.1)
- [x] Domain model and types
- [x] Database repository layer
- [x] Pay period management
- [x] Time sheet aggregation
- [x] Pay run orchestration
- [x] Pay stub generation
- [x] Deduction and garnishment handling
- [x] Tax configuration

### In Progress
- [ ] Payroll service implementation
- [ ] Tax calculation engine (federal, state, local)
- [ ] Overtime calculation utilities
- [ ] ACH file generation (NACHA format)
- [ ] Pay stub PDF generation

### Planned
- [ ] Multi-state payroll support
- [ ] PTO accrual integration
- [ ] Bonus and commission processing
- [ ] Payroll advance handling
- [ ] Time card mobile approval workflow
- [ ] Integration with ADP, Paychex, or other payroll providers
- [ ] Automated tax filing (via third-party service)
- [ ] Year-end W-2 generation
- [ ] 1099 contractor payment support

## Database Schema

See `packages/core/migrations/` for SQL migrations creating:

- `pay_periods` – Pay period definitions and status
- `time_sheets` – Aggregated time entries per caregiver
- `pay_runs` – Payroll execution records
- `pay_stubs` – Individual earnings statements
- `tax_configurations` – W-4 and state tax setup
- `caregiver_deductions` – Benefit and garnishment enrollments
- `payment_records` – Disbursement tracking
- `ach_batches` – Direct deposit batches

## Dependencies

- `@care-commons/core` – Base types, database connection
- `@care-commons/caregiver-staff` – Caregiver records and rates
- `@care-commons/time-tracking-evv` – Source time data

## References

- [IRS Publication 15 (Circular E)](https://www.irs.gov/pub/irs-pdf/p15.pdf) – Employer's Tax Guide
- [IRS Publication 15-T](https://www.irs.gov/pub/irs-pdf/p15t.pdf) – Federal Income Tax Withholding Methods
- [DOL Wage and Hour Division](https://www.dol.gov/agencies/whd) – Overtime and wage rules
- [NACHA Operating Rules](https://www.nacha.org/) – ACH file format specifications
- [SSA Business Services Online](https://www.ssa.gov/bso/) – W-2 electronic filing
