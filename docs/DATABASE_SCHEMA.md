# Database Schema Documentation

This document provides an overview of the Folk Care database schema for self-hosters, contributors, and integrators.

## Overview

Folk Care uses PostgreSQL 14+ with the following extensions:
- `uuid-ossp` - UUID generation
- `pgcrypto` - Cryptographic functions

All tables follow common patterns:
- **Primary Keys**: UUID with `uuid_generate_v4()` or `gen_random_uuid()`
- **Timestamps**: `created_at`, `updated_at` with timezone support
- **Soft Deletes**: `deleted_at`, `deleted_by` for recoverable deletion
- **Versioning**: `version` field for optimistic locking
- **Audit**: `created_by`, `updated_by` for attribution

## Core Tables

### organizations

The root entity for multi-tenant architecture. All other entities belong to an organization.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | varchar(255) | Display name |
| legal_name | varchar(255) | Legal/registered name |
| tax_id | varchar(50) | Tax identification number |
| license_number | varchar(100) | Healthcare license number |
| phone | varchar(20) | Contact phone |
| email | varchar(255) | Contact email |
| website | varchar(255) | Organization website |
| primary_address | jsonb | Main address (street, city, state, zip) |
| billing_address | jsonb | Billing address |
| settings | jsonb | Organization-specific settings |
| status | varchar(50) | ACTIVE, SUSPENDED, INACTIVE |
| state_code | varchar(2) | US state code for compliance |
| created_at | timestamp | Record creation time |
| created_by | uuid | User who created the record |
| updated_at | timestamp | Last update time |
| updated_by | uuid | User who last updated |
| version | integer | Optimistic locking version |
| deleted_at | timestamp | Soft delete timestamp |
| deleted_by | uuid | User who deleted |

### branches

Sub-locations within an organization for multi-site agencies.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| name | varchar(255) | Branch name |
| code | varchar(50) | Internal code |
| phone | varchar(20) | Branch phone |
| email | varchar(255) | Branch email |
| address | jsonb | Branch address |
| service_area | jsonb | Geographic service area |
| settings | jsonb | Branch-specific settings |
| status | varchar(50) | ACTIVE, INACTIVE |

### users

System users with authentication credentials and permissions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| username | varchar(100) | Unique login name |
| email | varchar(255) | Unique email address |
| password_hash | varchar(255) | Bcrypt password hash |
| first_name | varchar(100) | User's first name |
| last_name | varchar(100) | User's last name |
| phone | varchar(20) | Contact phone |
| roles | varchar(50)[] | Array of role names |
| permissions | varchar(100)[] | Array of permission strings |
| branch_ids | uuid[] | Array of accessible branch IDs |
| status | varchar(50) | ACTIVE, SUSPENDED, INACTIVE |
| last_login_at | timestamp | Last successful login |
| failed_login_attempts | integer | Failed login counter |
| locked_until | timestamp | Account lockout expiry |
| email_verified | boolean | Email verification status |
| email_verified_at | timestamp | When email was verified |

### programs

Service programs within an organization (e.g., Medicaid PCS, Private Pay).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| name | varchar(255) | Program name |
| code | varchar(50) | Internal code |
| program_type | varchar(100) | Type (Medicaid, Private, etc.) |
| funding_source | varchar(100) | Funding source identifier |
| eligibility_criteria | jsonb | Program eligibility rules |
| service_types | varchar(100)[] | Allowed service types |
| hourly_rate | decimal(10,2) | Default hourly billing rate |
| status | varchar(50) | ACTIVE, INACTIVE |
| start_date | date | Program start date |
| end_date | date | Program end date |

## Client Management

### clients

Care recipients (patients).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| client_code | varchar(50) | Internal client code |
| first_name | varchar(100) | Legal first name |
| last_name | varchar(100) | Legal last name |
| preferred_name | varchar(100) | Preferred name |
| date_of_birth | date | Date of birth |
| ssn_encrypted | text | Encrypted SSN |
| gender | varchar(20) | Gender |
| language | varchar(50) | Primary language |
| phone | varchar(20) | Primary phone |
| email | varchar(255) | Email address |
| address | jsonb | Home address |
| emergency_contacts | jsonb | Emergency contact array |
| diagnoses | jsonb | Medical diagnoses |
| allergies | jsonb | Known allergies |
| payer_info | jsonb | Insurance/payer information |
| status | varchar(50) | ACTIVE, INACTIVE, DISCHARGED |
| admission_date | date | Service start date |
| discharge_date | date | Service end date |
| is_demo_data | boolean | Demo data flag |

### client_authorizations

Service authorizations (approved hours/units).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| client_id | uuid | FK to clients |
| program_id | uuid | FK to programs |
| authorization_number | varchar(100) | External auth number |
| service_type | varchar(100) | Service type |
| authorized_units | decimal(10,2) | Approved units |
| unit_type | varchar(50) | HOURS, VISITS, DAYS |
| start_date | date | Authorization start |
| end_date | date | Authorization end |
| status | varchar(50) | ACTIVE, EXPIRED, REVOKED |

## Caregiver Management

### caregivers

Care providers (staff).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| user_id | uuid | FK to users (if has system access) |
| employee_code | varchar(50) | Internal employee code |
| first_name | varchar(100) | Legal first name |
| last_name | varchar(100) | Legal last name |
| date_of_birth | date | Date of birth |
| ssn_encrypted | text | Encrypted SSN |
| phone | varchar(20) | Primary phone |
| email | varchar(255) | Email address |
| address | jsonb | Home address |
| emergency_contact | jsonb | Emergency contact info |
| hire_date | date | Employment start date |
| termination_date | date | Employment end date |
| employment_type | varchar(50) | FULL_TIME, PART_TIME, PRN |
| pay_rate | decimal(10,2) | Hourly pay rate |
| certifications | jsonb | Certification array |
| skills | varchar(100)[] | Skill tags |
| languages | varchar(50)[] | Languages spoken |
| service_areas | jsonb | Geographic service areas |
| availability | jsonb | Weekly availability schedule |
| status | varchar(50) | ACTIVE, INACTIVE, TERMINATED |
| is_demo_data | boolean | Demo data flag |

### caregiver_credentials

Training certifications and compliance documents.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| caregiver_id | uuid | FK to caregivers |
| credential_type | varchar(100) | Type (CPR, TB Test, etc.) |
| credential_number | varchar(100) | Credential/license number |
| issuing_authority | varchar(255) | Issuing organization |
| issue_date | date | When issued |
| expiration_date | date | When expires |
| verification_status | varchar(50) | VERIFIED, PENDING, EXPIRED |
| document_url | text | Document storage URL |

## Scheduling

### visits

Scheduled care visits.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| client_id | uuid | FK to clients |
| caregiver_id | uuid | FK to caregivers |
| program_id | uuid | FK to programs |
| visit_type | varchar(50) | Service type |
| scheduled_start | timestamp | Scheduled start time |
| scheduled_end | timestamp | Scheduled end time |
| actual_start | timestamp | Actual clock-in time |
| actual_end | timestamp | Actual clock-out time |
| status | varchar(50) | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW |
| notes | text | Visit notes |
| tasks_completed | jsonb | Completed task list |
| signatures | jsonb | Client/caregiver signatures |
| mileage | decimal(10,2) | Travel mileage |
| is_demo_data | boolean | Demo data flag |

### visit_recurrences

Recurring visit patterns.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| client_id | uuid | FK to clients |
| caregiver_id | uuid | FK to caregivers |
| program_id | uuid | FK to programs |
| recurrence_pattern | jsonb | RRULE-style pattern |
| start_date | date | Pattern start |
| end_date | date | Pattern end |
| status | varchar(50) | ACTIVE, PAUSED, ENDED |

## EVV (Electronic Visit Verification)

### evv_records

Clock-in/out records with GPS verification.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| visit_id | uuid | FK to visits |
| record_type | varchar(50) | CLOCK_IN, CLOCK_OUT |
| timestamp | timestamp | Event timestamp |
| location | jsonb | GPS coordinates |
| verification_method | varchar(50) | GPS, TELEPHONY, BIOMETRIC |
| verification_status | varchar(50) | VERIFIED, NEEDS_REVIEW, REJECTED |
| device_info | jsonb | Device metadata |
| signature | text | Base64 signature image |
| notes | text | Optional notes |

### evv_exceptions

EVV compliance exceptions for review.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| visit_id | uuid | FK to visits |
| exception_type | varchar(100) | Type of exception |
| description | text | Exception description |
| resolution_status | varchar(50) | PENDING, RESOLVED, EXEMPT |
| resolved_by | uuid | FK to users |
| resolved_at | timestamp | Resolution timestamp |
| resolution_notes | text | Resolution explanation |

## Care Plans

### care_plans

Client care plans with goals and tasks.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| client_id | uuid | FK to clients |
| plan_type | varchar(100) | Plan type |
| title | varchar(255) | Plan title |
| description | text | Plan overview |
| goals | jsonb | Care goals array |
| tasks | jsonb | Task definitions |
| frequency | jsonb | Visit frequency requirements |
| start_date | date | Plan effective date |
| end_date | date | Plan end date |
| status | varchar(50) | DRAFT, ACTIVE, EXPIRED, SUPERSEDED |
| approved_by | uuid | FK to users |
| approved_at | timestamp | Approval timestamp |

### care_plan_tasks

Task completion tracking per visit.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| care_plan_id | uuid | FK to care_plans |
| visit_id | uuid | FK to visits |
| task_definition_id | varchar(100) | Reference to task in plan |
| status | varchar(50) | PENDING, COMPLETED, SKIPPED |
| completed_at | timestamp | Completion time |
| notes | text | Task notes |

## Billing

### invoices

Generated invoices.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| client_id | uuid | FK to clients |
| program_id | uuid | FK to programs |
| invoice_number | varchar(100) | Invoice identifier |
| period_start | date | Billing period start |
| period_end | date | Billing period end |
| total_units | decimal(10,2) | Total billable units |
| total_amount | decimal(12,2) | Total amount |
| status | varchar(50) | DRAFT, SUBMITTED, PAID, VOID |
| submitted_at | timestamp | Submission timestamp |
| paid_at | timestamp | Payment timestamp |
| paid_amount | decimal(12,2) | Amount received |

### invoice_line_items

Individual charges on invoices.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| invoice_id | uuid | FK to invoices |
| visit_id | uuid | FK to visits |
| service_type | varchar(100) | Service type |
| service_date | date | Date of service |
| units | decimal(10,2) | Billable units |
| rate | decimal(10,2) | Rate per unit |
| amount | decimal(12,2) | Line total |
| modifier_codes | varchar(10)[] | Billing modifiers |

## Payroll

### payroll_periods

Pay periods for staff compensation.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| period_start | date | Period start date |
| period_end | date | Period end date |
| status | varchar(50) | OPEN, CLOSED, PROCESSED |
| processed_at | timestamp | Processing timestamp |
| total_gross | decimal(12,2) | Total gross pay |
| total_net | decimal(12,2) | Total net pay |

### payroll_entries

Individual payroll records per caregiver.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| payroll_period_id | uuid | FK to payroll_periods |
| caregiver_id | uuid | FK to caregivers |
| regular_hours | decimal(10,2) | Regular hours |
| overtime_hours | decimal(10,2) | Overtime hours |
| regular_rate | decimal(10,2) | Regular pay rate |
| overtime_rate | decimal(10,2) | Overtime rate |
| gross_pay | decimal(12,2) | Total gross |
| deductions | jsonb | Deduction breakdown |
| net_pay | decimal(12,2) | Total net |
| status | varchar(50) | PENDING, APPROVED, PAID |

## Audit & Compliance

### audit_events

Security and compliance event log.

| Column | Type | Description |
|--------|------|-------------|
| event_id | uuid | Primary key |
| timestamp | timestamp | Event time |
| user_id | uuid | FK to users |
| organization_id | uuid | FK to organizations |
| event_type | varchar(50) | Event category |
| resource | varchar(100) | Affected resource type |
| resource_id | varchar(100) | Affected resource ID |
| action | varchar(50) | Action performed |
| result | varchar(20) | SUCCESS, FAILURE |
| metadata | jsonb | Additional context |
| ip_address | varchar(45) | Client IP address |
| user_agent | text | Browser/client info |

### audit_revisions

Change history for compliance tracking.

| Column | Type | Description |
|--------|------|-------------|
| revision_id | uuid | Primary key |
| entity_id | uuid | Changed entity ID |
| entity_type | varchar(100) | Entity type name |
| timestamp | timestamp | Change time |
| user_id | uuid | FK to users |
| operation | varchar(20) | CREATE, UPDATE, DELETE |
| changes | jsonb | Changed fields |
| snapshot | jsonb | Full entity snapshot |
| reason | text | Change reason |

## AI Features

### ai_usage

AI inference tracking per organization.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| user_id | uuid | FK to users (nullable) |
| feature_name | text | AI feature identifier |
| provider | text | AI provider (anthropic, cloudflare) |
| model | text | Model identifier |
| model_tier | text | fast, balanced, powerful |
| input_tokens | integer | Input token count |
| output_tokens | integer | Output token count |
| total_tokens | integer | Total tokens |
| estimated_cost_cents | integer | Estimated cost in cents |
| latency_ms | integer | Response time |
| success | boolean | Request success status |
| error_message | text | Error details if failed |
| metadata | jsonb | Additional context |
| created_at | timestamp | Record timestamp |

### ai_usage_daily_summary

Aggregated AI usage statistics.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| date | date | Summary date |
| feature_name | text | AI feature identifier |
| provider | text | AI provider |
| request_count | integer | Total requests |
| total_input_tokens | integer | Total input tokens |
| total_output_tokens | integer | Total output tokens |
| total_tokens | integer | Total tokens |
| total_cost_cents | integer | Total cost in cents |
| avg_latency_ms | integer | Average latency |
| success_count | integer | Successful requests |
| error_count | integer | Failed requests |

## Additional Tables

The database includes additional tables for:

- **Subscriptions**: `subscriptions`, `subscription_tiers` - Billing tiers and plans
- **White Label**: `organization_branding`, `feature_flags`, `domain_mappings` - Customization
- **Notifications**: `push_subscriptions`, `notification_preferences` - Push notifications
- **Family Portal**: `family_members`, `family_notifications`, `family_messages` - Family engagement
- **Clinical**: `visit_notes`, `clinical_assessments`, `medications`, `medication_administrations`
- **Quality**: `audits`, `audit_findings`, `corrective_actions`
- **Sync**: `sync_log`, `client_sync_state` - Offline sync infrastructure

## Indexes

Key indexes are created for:
- Foreign key relationships
- Status filters with soft delete exclusion
- Timestamp-based queries
- Full-text search on names
- Geospatial queries on locations

## Migration History

The database schema is managed through Knex migrations in `packages/core/migrations/`. Run migrations with:

```bash
npm run db:migrate
```

Rollback with:

```bash
npm run db:rollback
```

## JSONB Schemas

### Address Format
```json
{
  "street1": "123 Main St",
  "street2": "Apt 4B",
  "city": "Austin",
  "state": "TX",
  "zip": "78701",
  "country": "US"
}
```

### Emergency Contact Format
```json
{
  "name": "Jane Doe",
  "relationship": "Spouse",
  "phone": "512-555-1234",
  "alternatePhone": "512-555-5678"
}
```

### GPS Location Format
```json
{
  "latitude": 30.2672,
  "longitude": -97.7431,
  "accuracy": 10,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Security Considerations

1. **Encryption**: SSN and sensitive fields use application-level encryption
2. **Soft Deletes**: Records are soft-deleted for audit trail
3. **Audit Logging**: All mutations are logged to audit tables
4. **Row-Level Security**: Organization isolation via foreign keys
5. **Password Hashing**: Bcrypt with cost factor 12

## Self-Hosting Notes

When self-hosting, ensure:
1. PostgreSQL 14+ with required extensions
2. Sufficient connection pool size (default: 20)
3. Regular backups with point-in-time recovery
4. Proper index maintenance via VACUUM
5. SSL connections in production

For detailed migration steps, see [Self-Hosting Documentation](./SELF_HOSTING.md).
