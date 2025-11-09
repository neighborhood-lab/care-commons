# Task 0059: Payroll Processing Frontend UI

**Priority**: 🟠 MEDIUM (Feature Completion)
**Category**: Web / Frontend
**Estimated Effort**: 1 week

## Context

Payroll backend 100% complete (58,456 line migration). Frontend 70% complete at `packages/web/src/verticals/payroll-processing/`. Need UI for pay stubs, tax calculations, and payroll reports.

## Objective

Complete payroll frontend UI for administrators and caregivers.

## Requirements

**Administrator Views**:
1. **Payroll Run** - Generate payroll for pay period
2. **Tax Calculations** - Review federal/state/local taxes
3. **Deductions** - Manage deductions (insurance, garnishments)
4. **Reports** - Payroll reports (quarterly, annual)
5. **Export** - Export to QuickBooks, ADP, etc.

**Caregiver Views**:
1. **Pay Stubs** - View/download pay stubs
2. **YTD Summary** - Year-to-date earnings and taxes
3. **W-2 Forms** - Access W-2 at year-end
4. **Direct Deposit** - Manage bank account info

## Implementation

**New Pages Needed**:
- `PayrollRunPage.tsx` - Generate payroll for period
- `PayStubsPage.tsx` - List and view pay stubs
- `TaxReportsPage.tsx` - Tax reports and forms
- `DeductionsManagementPage.tsx` - Manage deductions

**API Integration**:
- POST `/api/payroll/run` - Generate payroll
- GET `/api/payroll/pay-stubs` - Fetch pay stubs
- GET `/api/payroll/reports/quarterly` - Tax reports
- PUT `/api/caregivers/direct-deposit` - Update banking

## Success Criteria

- [ ] Admin can generate payroll for period
- [ ] Tax calculations display correctly
- [ ] Caregivers can view pay stubs
- [ ] Export to CSV/PDF works
- [ ] Direct deposit management works
- [ ] Multi-state tax handling correct
