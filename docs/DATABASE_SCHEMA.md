# Database Schema Documentation

> **Folk Care Platform** - PostgreSQL 14+ Database Schema
> Last Updated: December 2024
> Version: 1.0

## Table of Contents

- [Overview](#overview)
- [Core Tables](#core-tables)
- [Client Demographics](#client-demographics)
- [Caregiver Management](#caregiver-management)
- [Scheduling & Visits](#scheduling--visits)
- [Electronic Visit Verification (EVV)](#electronic-visit-verification-evv)
- [Care Plans](#care-plans)
- [Billing & Invoicing](#billing--invoicing)
- [Clinical Documentation](#clinical-documentation)
- [Security & Audit](#security--audit)
- [Multi-Tenancy](#multi-tenancy)
- [Mobile & Offline Sync](#mobile--offline-sync)
- [Indexes & Performance](#indexes--performance)

---

## Overview

The Folk Care database uses PostgreSQL 14+ with the following extensions:
- `uuid-ossp` - UUID generation
- `pgcrypto` - Cryptographic functions

### Design Principles

1. **Soft Deletes**: Most tables use `deleted_at` and `deleted_by` columns instead of hard deletes
2. **Audit Trail**: All changes tracked via `audit_events` and `audit_revisions`
3. **Versioning**: Entity versioning via `version` column for optimistic locking
4. **Multi-Tenancy**: Organization-scoped data with `organization_id` foreign keys
5. **JSONB Fields**: Flexible schema for addresses, settings, metadata
6. **Demo Data**: `is_demo_data` flag for test/showcase data

### Common Columns

Most tables include these standard columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `organization_id` | UUID | Organization scope (FK to organizations) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `created_by` | UUID | User who created (FK to users) |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `updated_by` | UUID | User who updated (FK to users) |
| `deleted_at` | TIMESTAMP | Soft delete timestamp (NULL if active) |
| `deleted_by` | UUID | User who deleted |
| `version` | INTEGER | Optimistic locking version |
| `is_demo_data` | BOOLEAN | Demo/test data flag |

---

## Core Tables

### organizations

Home healthcare agencies that use the platform.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Organization ID |
| `name` | VARCHAR(255) | NOT NULL | Display name |
| `legal_name` | VARCHAR(255) | | Legal business name |
| `tax_id` | VARCHAR(50) | | Federal tax ID (EIN) |
| `license_number` | VARCHAR(100) | | State license number |
| `phone` | VARCHAR(20) | | Primary contact phone |
| `email` | VARCHAR(255) | | Primary contact email |
| `website` | VARCHAR(255) | | Organization website |
| `primary_address` | JSONB | NOT NULL | Primary business address |
| `billing_address` | JSONB | | Billing address (if different) |
| `settings` | JSONB | DEFAULT '{}' | Organization preferences |
| `status` | VARCHAR(50) | DEFAULT 'ACTIVE' | ACTIVE, SUSPENDED, INACTIVE |
| `state_code` | VARCHAR(2) | | Primary state (for compliance) |
| ...standard columns... |

**Indexes:**
- `idx_organizations_status` - Active organizations
- Organization data is tenant root for all scoped data

### branches

Physical locations or service areas within an organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Branch ID |
| `organization_id` | UUID | FK, NOT NULL | Parent organization |
| `name` | VARCHAR(255) | NOT NULL | Branch name |
| `code` | VARCHAR(50) | | Internal branch code |
| `phone` | VARCHAR(20) | | Branch phone |
| `email` | VARCHAR(255) | | Branch email |
| `address` | JSONB | NOT NULL | Branch address |
| `service_area` | JSONB | | Geographic service area |
| `settings` | JSONB | DEFAULT '{}' | Branch-specific settings |
| `status` | VARCHAR(50) | DEFAULT 'ACTIVE' | Branch status |
| ...standard columns... |

**Indexes:**
- `idx_branches_organization` - Branches by organization
- `idx_branches_status` - Active branches

### users

System users (administrators, coordinators, caregivers, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | User ID |
| `organization_id` | UUID | FK, NOT NULL | User's organization |
| `username` | VARCHAR(100) | UNIQUE, NOT NULL | Login username |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt password hash |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `phone` | VARCHAR(20) | | Contact phone |
| `roles` | VARCHAR(50)[] | DEFAULT '{}' | User roles (ADMIN, COORDINATOR, etc.) |
| `permissions` | VARCHAR(100)[] | DEFAULT '{}' | Granular permissions |
| `branch_ids` | UUID[] | DEFAULT '{}' | Assigned branches |
| `status` | VARCHAR(50) | DEFAULT 'ACTIVE' | ACTIVE, INACTIVE, LOCKED |
| `last_login_at` | TIMESTAMP | | Last successful login |
| `password_changed_at` | TIMESTAMP | | Last password change |
| `failed_login_attempts` | INTEGER | DEFAULT 0 | Failed login counter |
| `locked_until` | TIMESTAMP | | Account lock expiration |
| `email_verified` | BOOLEAN | DEFAULT FALSE | Email verification status |
| `settings` | JSONB | DEFAULT '{}' | User preferences |
| ...standard columns... |

**Indexes:**
- `idx_users_organization` - Users by organization
- `idx_users_email` - Email lookup
- `idx_users_status` - Active users

### programs

Service programs (Medicaid, private pay, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Program ID |
| `organization_id` | UUID | FK, NOT NULL | Organization |
| `name` | VARCHAR(255) | NOT NULL | Program name |
| `code` | VARCHAR(50) | | Program code |
| `description` | TEXT | | Program description |
| `program_type` | VARCHAR(100) | | Program type category |
| `funding_source` | VARCHAR(100) | | Funding source |
| `eligibility_criteria` | JSONB | | Eligibility requirements |
| `service_types` | VARCHAR(100)[] | | Allowed service types |
| `hourly_rate` | DECIMAL(10,2) | | Default hourly rate |
| `settings` | JSONB | DEFAULT '{}' | Program settings |
| `status` | VARCHAR(50) | DEFAULT 'ACTIVE' | Program status |
| `start_date` | DATE | | Program start date |
| `end_date` | DATE | | Program end date |
| ...standard columns... |

---

## Client Demographics

### clients

Individuals receiving care services.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Client ID |
| `organization_id` | UUID | FK, NOT NULL | Organization |
| `client_id` | VARCHAR(100) | UNIQUE | External client ID |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `middle_name` | VARCHAR(100) | | Middle name |
| `preferred_name` | VARCHAR(100) | | Preferred name |
| `date_of_birth` | DATE | NOT NULL | Date of birth |
| `ssn_last_4` | VARCHAR(4) | | Last 4 of SSN |
| `gender` | VARCHAR(50) | | Gender |
| `preferred_language` | VARCHAR(50) | | Preferred language |
| `phone_primary` | VARCHAR(20) | | Primary phone |
| `phone_secondary` | VARCHAR(20) | | Secondary phone |
| `email` | VARCHAR(255) | | Email address |
| `address` | JSONB | | Current address |
| `emergency_contact` | JSONB | | Emergency contact info |
| `insurance_info` | JSONB | | Insurance details |
| `medicaid_number` | VARCHAR(100) | | Medicaid ID |
| `medicare_number` | VARCHAR(100) | | Medicare ID |
| `admission_date` | DATE | | Service admission date |
| `discharge_date` | DATE | | Service discharge date |
| `status` | VARCHAR(50) | DEFAULT 'ACTIVE' | ACTIVE, INACTIVE, DISCHARGED |
| `status_reason` | TEXT | | Status change reason |
| `branch_id` | UUID | FK | Primary branch |
| `program_id` | UUID | FK | Primary program |
| `coordinator_id` | UUID | FK | Assigned coordinator |
| `referral_source` | VARCHAR(100) | | Referral source |
| `notes` | TEXT | | General notes |
| `timezone` | VARCHAR(50) | | Client timezone |
| ...standard columns... |

**Indexes:**
- `idx_clients_organization` - Clients by organization
- `idx_clients_status` - Active clients
- `idx_clients_client_id` - External ID lookup
- `idx_clients_coordinator` - Clients by coordinator

---

## Caregiver Management

### caregivers

Professional caregivers providing services.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Caregiver ID |
| `organization_id` | UUID | FK, NOT NULL | Organization |
| `user_id` | UUID | FK | Associated user account |
| `employee_id` | VARCHAR(100) | | Employee ID |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `phone` | VARCHAR(20) | | Contact phone |
| `email` | VARCHAR(255) | | Email address |
| `address` | JSONB | | Home address |
| `date_of_birth` | DATE | | Date of birth |
| `ssn_last_4` | VARCHAR(4) | | Last 4 of SSN |
| `hire_date` | DATE | | Hire date |
| `termination_date` | DATE | | Termination date |
| `status` | VARCHAR(50) | DEFAULT 'ACTIVE' | ACTIVE, INACTIVE, ON_LEAVE |
| `employment_type` | VARCHAR(50) | | FULL_TIME, PART_TIME, CONTRACT |
| `certifications` | JSONB | | Certifications/licenses |
| `specializations` | VARCHAR(100)[] | | Care specializations |
| `languages` | VARCHAR(50)[] | | Spoken languages |
| `hourly_rate` | DECIMAL(10,2) | | Base hourly rate |
| `max_hours_week` | INTEGER | | Max weekly hours |
| `availability` | JSONB | | Availability schedule |
| `branch_ids` | UUID[] | | Assigned branches |
| `notes` | TEXT | | General notes |
| `timezone` | VARCHAR(50) | | Caregiver timezone |
| ...standard columns... |

**Indexes:**
- `idx_caregivers_organization` - Caregivers by organization
- `idx_caregivers_status` - Active caregivers
- `idx_caregivers_user_id` - Link to user account

---

## Scheduling & Visits

### visits

Scheduled care visits.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Visit ID |
| `organization_id` | UUID | FK, NOT NULL | Organization |
| `client_id` | UUID | FK, NOT NULL | Client |
| `caregiver_id` | UUID | FK | Assigned caregiver |
| `visit_type` | VARCHAR(100) | NOT NULL | Visit type |
| `scheduled_start` | TIMESTAMP | NOT NULL | Scheduled start time |
| `scheduled_end` | TIMESTAMP | NOT NULL | Scheduled end time |
| `actual_start` | TIMESTAMP | | Actual start time (from clock-in) |
| `actual_end` | TIMESTAMP | | Actual end time (from clock-out) |
| `duration_scheduled_minutes` | INTEGER | | Scheduled duration |
| `duration_actual_minutes` | INTEGER | | Actual duration |
| `status` | VARCHAR(50) | DEFAULT 'SCHEDULED' | SCHEDULED, IN_PROGRESS, COMPLETED, etc. |
| `location` | JSONB | | Visit location |
| `tasks` | JSONB | | Tasks to perform |
| `notes` | TEXT | | Visit notes |
| `cancellation_reason` | TEXT | | Reason if cancelled |
| `branch_id` | UUID | FK | Branch |
| `program_id` | UUID | FK | Program |
| ...standard columns... |

**Statuses:** SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW

**Indexes:**
- `idx_visits_client` - Visits by client
- `idx_visits_caregiver` - Visits by caregiver
- `idx_visits_scheduled_start` - Time-based queries
- `idx_visits_status` - Status filtering

---

## Electronic Visit Verification (EVV)

### evv_records

Electronic visit verification check-in/out records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | EVV record ID |
| `organization_id` | UUID | FK, NOT NULL | Organization |
| `visit_id` | UUID | FK, NOT NULL | Associated visit |
| `client_id` | UUID | FK, NOT NULL | Client |
| `caregiver_id` | UUID | FK, NOT NULL | Caregiver |
| `event_type` | VARCHAR(20) | NOT NULL | CLOCK_IN, CLOCK_OUT |
| `event_timestamp` | TIMESTAMP | NOT NULL | Event timestamp |
| `latitude` | DECIMAL(10,8) | | GPS latitude |
| `longitude` | DECIMAL(11,8) | | GPS longitude |
| `location_accuracy` | DECIMAL(8,2) | | GPS accuracy (meters) |
| `address` | TEXT | | Geocoded address |
| `distance_from_client` | DECIMAL(8,2) | | Distance from client (meters) |
| `device_id` | VARCHAR(255) | | Mobile device ID |
| `verification_method` | VARCHAR(50) | | GPS, PHONE, QR_CODE, etc. |
| `photo_url` | TEXT | | Optional photo URL |
| `signature_url` | TEXT | | Digital signature URL |
| `tasks_completed` | JSONB | | Completed tasks |
| `notes` | TEXT | | Visit notes |
| `compliance_flags` | JSONB | | Compliance warnings |
| `submitted_at` | TIMESTAMP | | Submission timestamp |
| `state_submitted_at` | TIMESTAMP | | State EVV submission |
| `state_evv_id` | VARCHAR(255) | | State EVV system ID |
| `state_code` | VARCHAR(2) | | State code |
| ...standard columns... |

**Indexes:**
- `idx_evv_records_visit` - EVV by visit
- `idx_evv_records_caregiver` - EVV by caregiver
- `idx_evv_records_timestamp` - Time-based queries
- `idx_evv_records_state_code` - State-specific queries

---

## Care Plans

### care_plans

Client care plans and service authorizations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Care plan ID |
| `organization_id` | UUID | FK, NOT NULL | Organization |
| `client_id` | UUID | FK, NOT NULL | Client |
| `name` | VARCHAR(255) | NOT NULL | Plan name |
| `plan_type` | VARCHAR(100) | NOT NULL | Plan type |
| `effective_date` | DATE | NOT NULL | Effective start date |
| `expiration_date` | DATE | | Expiration date |
| `authorized_hours_weekly` | DECIMAL(5,2) | | Authorized hours/week |
| `service_types` | VARCHAR(100)[] | | Authorized services |
| `goals` | JSONB | | Care goals |
| `restrictions` | TEXT | | Service restrictions |
| `coordinator_id` | UUID | FK | Care coordinator |
| `status` | VARCHAR(50) | DEFAULT 'ACTIVE' | Plan status |
| `approval_status` | VARCHAR(50) | | Approval status |
| `approved_by` | UUID | FK | Approver |
| `approved_at` | TIMESTAMP | | Approval timestamp |
| ...standard columns... |

### care_plan_tasks

Individual tasks within care plans.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Task ID |
| `care_plan_id` | UUID | FK, NOT NULL | Parent care plan |
| `task_name` | VARCHAR(255) | NOT NULL | Task name |
| `task_category` | VARCHAR(100) | | Task category (ADL, IADL, etc.) |
| `description` | TEXT | | Task description |
| `frequency` | VARCHAR(50) | | How often to perform |
| `duration_minutes` | INTEGER | | Estimated duration |
| `instructions` | TEXT | | Detailed instructions |
| `status` | VARCHAR(50) | DEFAULT 'ACTIVE' | Task status |
| ...standard columns... |

---

## Billing & Invoicing

### invoices

Invoices for services rendered.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Invoice ID |
| `organization_id` | UUID | FK, NOT NULL | Organization |
| `client_id` | UUID | FK, NOT NULL | Client |
| `invoice_number` | VARCHAR(100) | UNIQUE, NOT NULL | Invoice number |
| `invoice_date` | DATE | NOT NULL | Invoice date |
| `due_date` | DATE | | Payment due date |
| `period_start` | DATE | NOT NULL | Billing period start |
| `period_end` | DATE | NOT NULL | Billing period end |
| `subtotal` | DECIMAL(12,2) | NOT NULL | Subtotal |
| `tax_amount` | DECIMAL(12,2) | DEFAULT 0 | Tax amount |
| `total_amount` | DECIMAL(12,2) | NOT NULL | Total amount |
| `amount_paid` | DECIMAL(12,2) | DEFAULT 0 | Amount paid |
| `status` | VARCHAR(50) | DEFAULT 'DRAFT' | DRAFT, SENT, PAID, OVERDUE, etc. |
| `payer_type` | VARCHAR(50) | | MEDICAID, MEDICARE, PRIVATE, etc. |
| `payer_id` | VARCHAR(100) | | Payer identifier |
| `notes` | TEXT | | Invoice notes |
| `sent_at` | TIMESTAMP | | Sent timestamp |
| `paid_at` | TIMESTAMP | | Payment timestamp |
| ...standard columns... |

### invoice_line_items

Line items on invoices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Line item ID |
| `invoice_id` | UUID | FK, NOT NULL | Parent invoice |
| `visit_id` | UUID | FK | Associated visit |
| `service_date` | DATE | NOT NULL | Service date |
| `service_code` | VARCHAR(50) | | Billing code |
| `description` | TEXT | NOT NULL | Service description |
| `quantity` | DECIMAL(10,2) | NOT NULL | Quantity (hours) |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Price per unit |
| `amount` | DECIMAL(12,2) | NOT NULL | Line total |
| `tax_rate` | DECIMAL(5,4) | DEFAULT 0 | Tax rate |
| `tax_amount` | DECIMAL(12,2) | DEFAULT 0 | Tax amount |
| ...standard columns... |

---

## Clinical Documentation

### medications

Client medications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Medication ID |
| `client_id` | UUID | FK, NOT NULL | Client |
| `medication_name` | VARCHAR(255) | NOT NULL | Medication name |
| `dosage` | VARCHAR(100) | | Dosage |
| `frequency` | VARCHAR(100) | | Frequency |
| `route` | VARCHAR(50) | | Route (oral, topical, etc.) |
| `prescriber` | VARCHAR(255) | | Prescribing physician |
| `start_date` | DATE | | Start date |
| `end_date` | DATE | | End date |
| `status` | VARCHAR(50) | DEFAULT 'ACTIVE' | Status |
| `notes` | TEXT | | Notes |
| ...standard columns... |

### medication_administrations

Medication administration records (MAR).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Administration ID |
| `medication_id` | UUID | FK, NOT NULL | Medication |
| `visit_id` | UUID | FK | Associated visit |
| `administered_by` | UUID | FK, NOT NULL | Caregiver |
| `administered_at` | TIMESTAMP | NOT NULL | Administration time |
| `dosage_given` | VARCHAR(100) | | Actual dosage given |
| `status` | VARCHAR(50) | NOT NULL | GIVEN, REFUSED, MISSED, etc. |
| `reason` | TEXT | | Reason if not given |
| `notes` | TEXT | | Administration notes |
| ...standard columns... |

### incidents

Incident reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Incident ID |
| `client_id` | UUID | FK, NOT NULL | Client |
| `visit_id` | UUID | FK | Associated visit |
| `reported_by` | UUID | FK, NOT NULL | Reporter |
| `incident_date` | TIMESTAMP | NOT NULL | Incident date/time |
| `incident_type` | VARCHAR(100) | NOT NULL | Incident type |
| `severity` | VARCHAR(50) | NOT NULL | MINOR, MODERATE, MAJOR, CRITICAL |
| `description` | TEXT | NOT NULL | Description |
| `immediate_action` | TEXT | | Action taken |
| `follow_up_required` | BOOLEAN | DEFAULT FALSE | Follow-up needed |
| `status` | VARCHAR(50) | DEFAULT 'OPEN' | OPEN, INVESTIGATING, RESOLVED |
| ...standard columns... |

### visit_notes

Visit documentation and notes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Note ID |
| `visit_id` | UUID | FK, NOT NULL | Visit |
| `note_type` | VARCHAR(50) | NOT NULL | Note type |
| `content` | TEXT | NOT NULL | Note content |
| `vital_signs` | JSONB | | Vital signs data |
| `tasks_completed` | JSONB | | Completed tasks |
| `client_status` | TEXT | | Client status |
| `caregiver_signature` | TEXT | | Digital signature |
| `signed_at` | TIMESTAMP | | Signature timestamp |
| ...standard columns... |

---

## Security & Audit

### audit_events

High-level audit trail of user actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `event_id` | UUID | PK | Event ID |
| `timestamp` | TIMESTAMP | NOT NULL | Event timestamp |
| `user_id` | UUID | FK, NOT NULL | User |
| `organization_id` | UUID | FK, NOT NULL | Organization |
| `event_type` | VARCHAR(50) | NOT NULL | Event type |
| `resource` | VARCHAR(100) | NOT NULL | Resource type |
| `resource_id` | VARCHAR(100) | NOT NULL | Resource ID |
| `action` | VARCHAR(50) | NOT NULL | Action (CREATE, READ, UPDATE, DELETE) |
| `result` | VARCHAR(20) | NOT NULL | SUCCESS, FAILURE |
| `metadata` | JSONB | DEFAULT '{}' | Additional data |
| `ip_address` | VARCHAR(45) | | IP address |
| `user_agent` | TEXT | | User agent |

**Indexes:**
- `idx_audit_events_user` - Events by user
- `idx_audit_events_resource` - Events by resource
- `idx_audit_events_timestamp` - Time-based queries
- `idx_audit_events_organization` - Organization scope

### audit_revisions

Detailed change tracking for entities.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `revision_id` | UUID | PK | Revision ID |
| `entity_id` | UUID | NOT NULL | Entity ID |
| `entity_type` | VARCHAR(100) | NOT NULL | Entity type |
| `timestamp` | TIMESTAMP | NOT NULL | Revision timestamp |
| `user_id` | UUID | FK, NOT NULL | User who made change |
| `operation` | VARCHAR(20) | NOT NULL | CREATE, UPDATE, DELETE |
| `changes` | JSONB | NOT NULL | Changed fields |
| `snapshot` | JSONB | NOT NULL | Full entity snapshot |
| `reason` | TEXT | | Change reason |
| `ip_address` | VARCHAR(45) | | IP address |
| `user_agent` | TEXT | | User agent |

**Indexes:**
- `idx_audit_revisions_entity` - Revisions by entity
- `idx_audit_revisions_timestamp` - Time-based queries
- `idx_audit_revisions_user` - Revisions by user

### security_events

Security-related events (login attempts, access violations).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Event ID |
| `timestamp` | TIMESTAMP | NOT NULL | Event timestamp |
| `event_type` | VARCHAR(50) | NOT NULL | LOGIN_SUCCESS, LOGIN_FAILURE, etc. |
| `user_id` | UUID | FK | User (if applicable) |
| `email` | VARCHAR(255) | | Email used in attempt |
| `ip_address` | VARCHAR(45) | | IP address |
| `user_agent` | TEXT | | User agent |
| `result` | VARCHAR(20) | | SUCCESS, FAILURE |
| `metadata` | JSONB | | Additional details |

---

## Multi-Tenancy

### organization_branding

Organization white-labeling and theming.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Branding ID |
| `organization_id` | UUID | FK, UNIQUE, NOT NULL | Organization |
| `logo_url` | TEXT | | Logo URL |
| `favicon_url` | TEXT | | Favicon URL |
| `primary_color` | VARCHAR(7) | | Primary brand color (hex) |
| `secondary_color` | VARCHAR(7) | | Secondary color |
| `custom_css` | TEXT | | Custom CSS |
| `custom_domain` | VARCHAR(255) | | Custom domain |
| ...standard columns... |

### feature_flags

Feature toggles per organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Flag ID |
| `organization_id` | UUID | FK | Organization (NULL = global) |
| `feature_key` | VARCHAR(100) | NOT NULL | Feature identifier |
| `enabled` | BOOLEAN | DEFAULT FALSE | Feature enabled |
| `config` | JSONB | | Feature configuration |
| ...standard columns... |

### domain_mappings

Custom domain mappings for organizations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Mapping ID |
| `organization_id` | UUID | FK, NOT NULL | Organization |
| `domain` | VARCHAR(255) | UNIQUE, NOT NULL | Custom domain |
| `verified` | BOOLEAN | DEFAULT FALSE | Domain verified |
| `verification_token` | VARCHAR(255) | | Verification token |
| `verified_at` | TIMESTAMP | | Verification timestamp |
| ...standard columns... |

---

## Mobile & Offline Sync

### sync_metadata

Offline sync tracking for mobile devices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Sync ID |
| `user_id` | UUID | FK, NOT NULL | User |
| `device_id` | VARCHAR(255) | NOT NULL | Device identifier |
| `entity_type` | VARCHAR(100) | NOT NULL | Entity type |
| `entity_id` | UUID | NOT NULL | Entity ID |
| `last_sync` | TIMESTAMP | NOT NULL | Last sync timestamp |
| `sync_status` | VARCHAR(50) | | SYNCED, PENDING, CONFLICT |
| `local_version` | INTEGER | | Local version number |
| `server_version` | INTEGER | | Server version number |
| `conflict_data` | JSONB | | Conflict resolution data |

### push_notifications

Push notification queue.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Notification ID |
| `user_id` | UUID | FK, NOT NULL | Target user |
| `title` | VARCHAR(255) | NOT NULL | Notification title |
| `body` | TEXT | NOT NULL | Notification body |
| `data` | JSONB | | Additional data payload |
| `sent_at` | TIMESTAMP | | Sent timestamp |
| `read_at` | TIMESTAMP | | Read timestamp |
| `status` | VARCHAR(50) | DEFAULT 'PENDING' | PENDING, SENT, FAILED |

---

## Indexes & Performance

### Query Optimization

Key performance indexes by use case:

**Time-based queries:**
```sql
CREATE INDEX idx_visits_scheduled_start ON visits(scheduled_start DESC);
CREATE INDEX idx_evv_records_timestamp ON evv_records(event_timestamp DESC);
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp DESC);
```

**Organization scoping:**
```sql
CREATE INDEX idx_[table]_organization ON [table](organization_id) WHERE deleted_at IS NULL;
```

**Status filtering:**
```sql
CREATE INDEX idx_[table]_status ON [table](status) WHERE deleted_at IS NULL;
```

**Composite indexes:**
```sql
CREATE INDEX idx_visits_client_date ON visits(client_id, scheduled_start DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_evv_caregiver_date ON evv_records(caregiver_id, event_timestamp DESC);
```

### Partial Indexes

Most indexes use `WHERE deleted_at IS NULL` to:
- Reduce index size
- Improve query performance
- Focus on active records

### JSONB Indexing

JSONB columns use GIN indexes for efficient querying:
```sql
CREATE INDEX idx_clients_address_gin ON clients USING GIN (address);
CREATE INDEX idx_metadata_gin ON [table] USING GIN (metadata);
```

---

## Data Retention

### Soft Delete Policy

- Records are soft-deleted with `deleted_at` timestamp
- Soft-deleted records remain in database indefinitely for audit purposes
- Queries filter out deleted records via `WHERE deleted_at IS NULL`

### Hard Delete Policy

Hard deletes only for:
- Demo data (`is_demo_data = TRUE`)
- Data retention compliance (organization-specific)
- Explicit data subject requests (GDPR, CCPA)

### Archive Strategy

Long-term archival strategy:
1. Audit logs > 7 years moved to cold storage
2. Completed visits > 3 years archived
3. Invoices > 10 years archived (tax compliance)

---

## Compliance Notes

### HIPAA Compliance

- All PHI encrypted at rest (database encryption)
- All PHI encrypted in transit (SSL/TLS)
- Access logging via `audit_events`
- Change tracking via `audit_revisions`

### State-Specific EVV Compliance

EVV records include state-specific fields:
- `state_code` - State identifier
- `state_evv_id` - State system ID
- `state_submitted_at` - Submission timestamp
- `compliance_flags` - State requirements

State-specific tables:
- `state_specific_evv_fields` - Additional state requirements
- `state_specific_care_plan_fields` - State care plan requirements

### Data Portability

All data exportable via API endpoints:
- JSON export format
- CSV export for reporting
- FHIR R4 export (planned)
- HL7 v2.x export (planned)

---

## Migration Information

Migrations located in: `packages/core/migrations/`

**Apply migrations:**
```bash
npm run db:migrate
```

**Rollback last migration:**
```bash
npm run db:migrate:rollback
```

**Check migration status:**
```bash
npm run db:migrate:status
```

**Create new migration:**
```bash
npm run db:migration:create my_migration_name
```

---

## Entity Relationship Diagram

```
organizations 1---* branches
organizations 1---* users
organizations 1---* clients
organizations 1---* caregivers
organizations 1---* programs
organizations 1---* visits

clients 1---* visits
clients 1---* care_plans
clients 1---* medications
clients 1---* incidents

caregivers 1---* visits
caregivers 1---* evv_records

visits 1---* evv_records
visits 1---1 visit_notes

care_plans 1---* care_plan_tasks

invoices 1---* invoice_line_items
```

---

## Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [API Quick Start](./API_QUICK_START.md)
- [Development Guide](./DEVELOPMENT.md)
- [Architecture Overview](./ARCHITECTURE.md)

---

**Generated**: December 2024
**Maintainers**: Folk Care Development Team
**License**: AGPL-3.0
