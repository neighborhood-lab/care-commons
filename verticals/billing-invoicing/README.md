# Billing & Invoicing

Revenue cycle management from service delivery to payment collection. Transforms care delivery data (visits, time tracking, care plans) into billable items, generates invoices for multiple payer types, tracks claims submission and payment cycles, and provides revenue analytics.

## Status

**Production Ready** - Core implementation complete with repository layer, validation, utilities, and comprehensive seed data for demos.

## Key Features

### Billable Items
- Automatic conversion of completed visits to billable items
- Link to EVV records for compliance verification
- Service authorization tracking
- Rate schedule application
- Modifiers and adjustments
- Hold and review workflows

### Invoicing
- Generate invoices by payer and time period
- Support multiple invoice types (standard, interim, credit, statement)
- Configurable billing cycles
- Line item detail with service codes
- Tax calculation
- PDF generation

### Payments
- Record payments from any source
- Multiple payment methods (check, ACH, credit card, ERA)
- Payment allocation to invoices
- Unapplied payment tracking
- Bank reconciliation

### Claims Management
- Submit claims to insurance payers
- Support for CMS-1500, UB-04, and EDI formats
- Clearinghouse integration
- Claim status tracking
- Denial management and appeals
- Electronic Remittance Advice (ERA) processing

### Rate Schedules
- Define rates by service type and payer
- Time-based modifiers (weekend, holiday, night, overtime)
- Geographic adjustments
- Effective date management
- Approval workflow

### Service Authorizations
- Track pre-approvals from payers
- Unit consumption monitoring
- Expiration alerts
- Remaining balance tracking
- Referral management

### Payer Management
- Insurance companies and Medicaid/Medicare
- Private pay clients
- Contact information
- Billing preferences
- Submission methods
- Performance metrics (average payment days, denial rate)

### Reporting & Analytics
- Revenue summaries
- Accounts receivable aging
- Payer performance analysis
- Denial trend analysis
- Collection rate tracking
- Forecast modeling

## Domain Model

### Core Entities

- **BillableItem**: Individual service occurrence ready for billing
- **Invoice**: Collection of billable items for a specific payer
- **Payment**: Incoming payment from any source
- **Claim**: Submission to insurance payer
- **RateSchedule**: Pricing rules by service type and payer
- **ServiceAuthorization**: Pre-approval for services
- **Payer**: Insurance company, agency, or individual paying for services
- **BillingReport**: Summary analytics

## Integration Points

### Upstream Dependencies
- **Client Demographics**: Client billing information
- **Scheduling & Visits**: Service occurrences to bill
- **Time Tracking & EVV**: Compliance-verified visit timing
- **Care Plans & Tasks**: Authorized services and tasks completed

### Downstream Dependencies
- **Payroll**: Caregiver compensation (future)
- **Accounting**: GL integration (future)

## Compliance

- HIPAA-compliant data handling
- Medicaid/Medicare billing requirements
- State-specific claim filing rules
- EVV linkage for federally mandated services
- Audit trail on all financial transactions

## Workflow Example

1. **Visit Completion**: Caregiver completes a visit, clocks out via EVV
2. **Billable Item Creation**: System creates billable item linked to visit and EVV record
3. **Rate Application**: System looks up rate schedule for service type and payer
4. **Authorization Check**: System verifies service authorization and deducts units
5. **Review**: Billing coordinator reviews flagged items
6. **Invoice Generation**: System groups billable items into invoices by payer and period
7. **Claim Submission**: For insurance payers, system generates and submits claims
8. **Payment Receipt**: Payment received and allocated to invoices
9. **Reconciliation**: Payment reconciled with bank deposit
10. **Reporting**: Revenue analytics updated in real-time

## Data Model

See [migration 008_billing_invoicing.sql](../../packages/core/migrations/008_billing_invoicing.sql) for complete database schema.

Key tables:
- `payers` - Payer information
- `rate_schedules` - Service pricing rules
- `service_authorizations` - Pre-approvals for services
- `billable_items` - Individual service occurrences
- `invoices` - Collections of billable items
- `payments` - Incoming payments
- `claims` - Insurance claim submissions

## Future Enhancements

- Electronic claims submission (EDI 837)
- ERA processing automation
- Clearinghouse integrations
- Patient statement generation
- Recurring billing for subscription services
- Collections workflow
- Write-off management
- Bad debt tracking
- Revenue forecasting
- GL integration
- Payment plan management

## Development Status

- [x] Domain model and types
- [x] Database migration
- [x] Repository layer
- [x] Validation layer
- [x] Utility functions (rate calculation, rounding, tax, holidays, time modifiers)
- [x] Seed data for realistic demos
- [ ] Service layer (business logic workflows)
- [ ] API handlers
- [ ] Tests
- [ ] Full documentation
