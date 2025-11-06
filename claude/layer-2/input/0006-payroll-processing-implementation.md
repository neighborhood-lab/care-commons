# Task 0006: Implement Payroll Processing Service and UI

**Priority**: 🟡 MEDIUM
**Phase**: Phase 2 - Feature Completeness
**Estimated Effort**: 10-14 hours

## Context

The payroll vertical has a complete database schema but lacks the service logic for tax calculations, pay period processing, and the frontend UI for pay stubs and payroll reports.

## Existing Foundation

- ✅ Database schema: `pay_periods`, `payroll_entries`, `tax_withholdings`, `deductions`, `garnishments`, `pay_stubs`
- ✅ Basic routes structure
- ⚠️ Service logic needs implementation
- ⚠️ Frontend UI needed

## Task

### 1. Implement Payroll Service Logic

**File**: `verticals/payroll-processing/src/services/payroll.service.ts`

**Methods to Implement**:

```typescript
// Calculate gross pay from time entries
calculateGrossPay(caregiverId: string, payPeriodId: string): Promise<number>

// Calculate federal tax withholding (W-4 based)
calculateFederalTax(grossPay: number, w4Data: W4Info): Promise<number>

// Calculate state tax withholding (multi-state support)
calculateStateTax(grossPay: number, state: string, stateW4?: any): Promise<number>

// Calculate FICA (Social Security + Medicare)
calculateFICA(grossPay: number): Promise<{ socialSecurity: number, medicare: number }>

// Apply deductions (health insurance, 401k, etc.)
applyDeductions(grossPay: number, deductions: Deduction[]): Promise<number>

// Apply garnishments (court-ordered wage garnishments)
applyGarnishments(grossPay: number, garnishments: Garnishment[]): Promise<number>

// Generate pay stub
generatePayStub(payrollEntryId: string): Promise<PayStub>

// Process entire pay period (all caregivers)
processPayPeriod(payPeriodId: string): Promise<PayPeriodSummary>
```

**Tax Calculation Logic**:
- Use 2024 IRS tax brackets and tables
- Support federal W-4 (2020 version and later)
- Support state withholding for all 7 states (TX, FL, OH, PA, GA, NC, AZ)
- Note: TX and FL have no state income tax

**Validation**:
- Verify time entries are approved before including in payroll
- Check for missing W-4 forms
- Validate garnishment percentages don't exceed legal limits
- Ensure minimum wage compliance

### 2. Create Tax Calculation Service

**File**: `verticals/payroll-processing/src/services/tax-calculator.service.ts`

Separate service for tax calculation logic:
- Federal tax calculation using tax brackets
- State-specific tax rules
- FICA calculation (6.2% Social Security + 1.45% Medicare)
- Additional Medicare tax (0.9% over $200k)
- Tax year management (2024, 2025 rules)

### 3. Implement Frontend UI

**Pay Period Management** (`packages/web/src/app/pages/payroll/PayPeriodPage.tsx`):
- List pay periods (weekly, bi-weekly, semi-monthly)
- Create new pay period
- Process pay period (generate all pay stubs)
- View pay period summary
- Export for payroll provider (ADP, Paychex format)

**Pay Stubs** (`packages/web/src/app/pages/payroll/PayStubsPage.tsx`):
- List pay stubs for a caregiver
- View individual pay stub (detailed breakdown)
- Download pay stub as PDF
- Email pay stub to caregiver

**Payroll Reports** (`packages/web/src/app/pages/payroll/PayrollReportsPage.tsx`):
- Payroll summary report
- Tax liability report (employer taxes owed)
- Deduction summary
- Garnishment tracking
- 401k contribution report

**Caregiver Self-Service** (`packages/web/src/app/pages/caregiver-portal/PayStubsPage.tsx`):
- Caregivers can view their own pay stubs
- Download pay stubs
- View YTD earnings
- Update direct deposit info (future)

### 4. Create Components

**Components** (`packages/web/src/app/pages/payroll/components/`):
- `PayStubCard.tsx` - Display pay stub summary
- `PayStubDetail.tsx` - Full pay stub with all deductions
- `TaxSummary.tsx` - Tax withholding summary
- `DeductionsList.tsx` - List of deductions
- `PayPeriodForm.tsx` - Create/edit pay period
- `ProcessPayrollButton.tsx` - Trigger payroll processing with confirmation

### 5. Add API Integration

**Service Hooks** (`packages/web/src/services/`):
- `usePayroll.ts` - React Query hooks for payroll operations
- `usePayStubs.ts` - Hooks for pay stub retrieval

### 6. Add Validation and Error Handling

**Validations**:
- All time entries approved before processing
- All caregivers have W-4 on file
- Pay period not already processed
- Tax calculations within reasonable bounds (sanity check)

**Error Handling**:
- Missing W-4 form → block payroll, show warning
- Unapproved time entries → show list, allow override with reason
- Tax calculation error → log, notify admin, allow manual override

### 7. Add Reports Export

**Export Formats**:
- **PDF**: Pay stubs, payroll summary (formatted for printing)
- **CSV**: Payroll data for import into accounting software
- **ADP/Paychex**: Format for payroll service providers
- **QuickBooks**: Format for QuickBooks import

## User Stories

1. **As an administrator**, I can create pay periods and process payroll for all caregivers
2. **As an administrator**, I can view payroll summaries and tax liabilities
3. **As an administrator**, I can export payroll data for our payroll provider
4. **As a caregiver**, I can view my pay stubs and download them as PDF
5. **As a caregiver**, I can see year-to-date earnings and tax withholdings
6. **As a coordinator**, I can verify time entries are ready for payroll

## Tax Compliance Requirements

- ✅ Federal tax withholding per IRS Publication 15
- ✅ State tax withholding per state regulations
- ✅ FICA tax calculation
- ✅ Garnishment handling per federal and state law
- ✅ Minimum wage compliance checks
- ✅ Overtime calculation (1.5x over 40 hours/week)

## Acceptance Criteria

- [ ] Payroll service logic implemented
- [ ] Tax calculator service functional
- [ ] Gross pay calculation from time entries
- [ ] Federal and state tax calculations correct
- [ ] FICA calculations correct
- [ ] Deductions and garnishments applied
- [ ] Pay stub generation working
- [ ] Frontend UI complete
- [ ] Pay stubs viewable and downloadable as PDF
- [ ] Payroll reports generated
- [ ] Export functionality for payroll providers
- [ ] Validation and error handling
- [ ] Tests for tax calculations (critical!)
- [ ] Works end-to-end in local dev

## Testing Requirements

**Unit Tests** (critical for tax calculations):
- Test federal tax calculation with various W-4 scenarios
- Test state tax calculation for all 7 states
- Test FICA calculation with edge cases (over Social Security max)
- Test garnishment percentage limits
- Test minimum wage compliance

**Integration Tests**:
- Test full payroll processing end-to-end
- Test pay stub generation with real data
- Test export formats

## Reference

- IRS Publication 15 (Circular E) - Employer's Tax Guide
- IRS Form W-4 (2020 and later)
- State tax withholding tables for OH, PA, GA, NC, AZ
- Federal minimum wage: $7.25/hour
- State minimum wages vary (document in README)

## Future Enhancements (Document in README)

- Direct deposit (ACH) integration
- Year-end W-2 generation
- Automated tax filing (future)
- Integration with QuickBooks API
- Multi-currency support (for agencies in multiple countries)
