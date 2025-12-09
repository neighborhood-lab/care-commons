# Database Schema Documentation

This document provides a comprehensive reference for the Folk Care database schema. The database uses PostgreSQL 14+ with JSONB for flexible structured data.

## Schema Overview

Folk Care uses a multi-tenant architecture where all data is scoped to an organization. The schema supports:
- Home care agency operations (scheduling, visits, billing)
- Electronic Visit Verification (EVV) compliance
- Care plan management
- Caregiver credentialing and compliance tracking
- Family engagement portal

## Core Tables

### organizations

The root entity for multi-tenant isolation. All data belongs to an organization.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Display name |
| legal_name | VARCHAR(255) | Legal business name |
| tax_id | VARCHAR(50) | Tax identification number |
| license_number | VARCHAR(100) | State license number |
| phone | VARCHAR(20) | Main phone number |
| email | VARCHAR(255) | Main email address |
| website | VARCHAR(255) | Website URL |
| primary_address | JSONB | Primary address |
| billing_address | JSONB | Billing address |
| settings | JSONB | Organization-wide settings |
| status | VARCHAR(50) | ACTIVE, SUSPENDED, etc. |
| created_at | TIMESTAMP | Creation timestamp |
| created_by | UUID | User who created |
| updated_at | TIMESTAMP | Last update timestamp |
| updated_by | UUID | User who last updated |
| version | INTEGER | Optimistic locking version |
| deleted_at | TIMESTAMP | Soft delete timestamp |
| deleted_by | UUID | User who deleted |

### branches

Physical locations or divisions within an organization.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| name | VARCHAR(255) | Branch name |
| code | VARCHAR(50) | Short code identifier |
| phone | VARCHAR(20) | Branch phone |
| email | VARCHAR(255) | Branch email |
| address | JSONB | Branch address |
| service_area | JSONB | Geographic service area definition |
| settings | JSONB | Branch-specific settings |
| status | VARCHAR(50) | ACTIVE, INACTIVE |

### users

System users with authentication and authorization.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| username | VARCHAR(100) | Unique username |
| email | VARCHAR(255) | Unique email |
| password_hash | VARCHAR(255) | Bcrypt password hash |
| first_name | VARCHAR(100) | First name |
| last_name | VARCHAR(100) | Last name |
| phone | VARCHAR(20) | Phone number |
| roles | VARCHAR(50)[] | Array of role names |
| permissions | VARCHAR(100)[] | Array of permission strings |
| branch_ids | UUID[] | Accessible branches |
| status | VARCHAR(50) | ACTIVE, INACTIVE, LOCKED |
| last_login_at | TIMESTAMP | Last successful login |
| password_changed_at | TIMESTAMP | Last password change |
| failed_login_attempts | INTEGER | Failed login counter |
| locked_until | TIMESTAMP | Account lock expiration |
| settings | JSONB | User preferences |

## Client Management

### clients

Individuals receiving care services.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| branch_id | UUID | FK to branches |
| client_number | VARCHAR(50) | Human-readable ID |
| first_name | VARCHAR(100) | First name |
| middle_name | VARCHAR(100) | Middle name |
| last_name | VARCHAR(100) | Last name |
| preferred_name | VARCHAR(100) | Preferred name |
| date_of_birth | DATE | Date of birth |
| ssn | VARCHAR(255) | Social Security (encrypted) |
| gender | VARCHAR(50) | Gender identity |
| pronouns | VARCHAR(50) | Preferred pronouns |
| primary_phone | JSONB | Primary phone contact |
| alternate_phone | JSONB | Alternate phone |
| email | VARCHAR(255) | Email address |
| language | VARCHAR(50) | Primary language |
| primary_address | JSONB | Residence address |
| emergency_contacts | JSONB | Emergency contact list |
| authorized_contacts | JSONB | Authorized contacts with permissions |
| primary_physician | JSONB | Primary care physician |
| pharmacy | JSONB | Preferred pharmacy |
| insurance | JSONB | Insurance information |
| programs | JSONB | Program enrollments |
| service_eligibility | JSONB | Eligibility criteria |
| risk_flags | JSONB | Safety and care risk flags |
| allergies | JSONB | Known allergies |
| special_instructions | TEXT | Special care instructions |
| access_instructions | TEXT | Home access instructions |
| status | VARCHAR(50) | Client status |
| intake_date | DATE | Service start date |
| discharge_date | DATE | Service end date |

**Status Values:** INQUIRY, PENDING_INTAKE, ACTIVE, INACTIVE, ON_HOLD, DISCHARGED, DECEASED

## Caregiver Management

### caregivers

Personnel providing care services.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| branch_ids | UUID[] | Branches where can work |
| primary_branch_id | UUID | Primary branch |
| employee_number | VARCHAR(50) | Employee ID |
| first_name | VARCHAR(100) | First name |
| last_name | VARCHAR(100) | Last name |
| date_of_birth | DATE | Date of birth |
| ssn | VARCHAR(255) | SSN (encrypted) |
| primary_phone | JSONB | Primary phone |
| email | VARCHAR(255) | Email address |
| primary_address | JSONB | Home address |
| emergency_contacts | JSONB | Emergency contacts |
| employment_type | VARCHAR(50) | Employment classification |
| employment_status | VARCHAR(50) | Employment status |
| hire_date | DATE | Hire date |
| role | VARCHAR(100) | Job role/title |
| supervisor_id | UUID | FK to caregivers |
| credentials | JSONB | Certifications and licenses |
| background_check | JSONB | Background check record |
| drug_screening | JSONB | Drug screening record |
| health_screening | JSONB | Health/immunization records |
| training | JSONB | Training records |
| skills | JSONB | Skills and proficiency |
| specializations | VARCHAR(100)[] | Specialization areas |
| availability | JSONB | Weekly availability |
| work_preferences | JSONB | Shift preferences |
| max_hours_per_week | INTEGER | Maximum weekly hours |
| pay_rate | JSONB | Primary pay rate |
| compliance_status | VARCHAR(50) | Credential compliance |
| reliability_score | DECIMAL(3,2) | Reliability metric (0.0-1.0) |
| preferred_clients | UUID[] | Preferred client assignments |
| restricted_clients | UUID[] | Cannot assign clients |
| status | VARCHAR(50) | Caregiver status |

**Employment Types:** FULL_TIME, PART_TIME, PER_DIEM, CONTRACT, TEMPORARY, SEASONAL

**Roles:** CAREGIVER, SENIOR_CAREGIVER, CERTIFIED_NURSING_ASSISTANT, HOME_HEALTH_AIDE, PERSONAL_CARE_AIDE, COMPANION, NURSE_RN, NURSE_LPN, THERAPIST, COORDINATOR, SUPERVISOR, SCHEDULER, ADMINISTRATIVE

**Compliance Status:** COMPLIANT, PENDING_VERIFICATION, EXPIRING_SOON, EXPIRED, NON_COMPLIANT

## Scheduling & Visits

### service_patterns

Templates for recurring service schedules.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| branch_id | UUID | FK to branches |
| client_id | UUID | FK to clients |
| name | VARCHAR(200) | Pattern name |
| pattern_type | VARCHAR(50) | Type of pattern |
| service_type_id | UUID | Service type reference |
| service_type_name | VARCHAR(200) | Service type name |
| recurrence | JSONB | Recurrence rules |
| duration | INTEGER | Service duration (minutes) |
| flexibility_window | INTEGER | Allowed variance (minutes) |
| required_skills | JSONB | Required caregiver skills |
| required_certifications | JSONB | Required certifications |
| preferred_caregivers | JSONB | Preferred caregiver list |
| authorized_hours_per_week | DECIMAL(5,2) | Weekly hours authorized |
| authorization_start_date | DATE | Authorization start |
| authorization_end_date | DATE | Authorization end |
| status | VARCHAR(50) | Pattern status |
| effective_from | DATE | Pattern start date |
| effective_to | DATE | Pattern end date |

**Pattern Types:** RECURRING, ONE_TIME, AS_NEEDED, RESPITE

### visits

Individual care visit occurrences.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| branch_id | UUID | FK to branches |
| client_id | UUID | FK to clients |
| pattern_id | UUID | FK to service_patterns |
| schedule_id | UUID | FK to schedules |
| visit_number | VARCHAR(50) | Unique visit identifier |
| visit_type | VARCHAR(50) | Type of visit |
| service_type_id | UUID | Service type |
| scheduled_date | DATE | Scheduled date |
| scheduled_start_time | TIME | Scheduled start |
| scheduled_end_time | TIME | Scheduled end |
| scheduled_duration | INTEGER | Duration (minutes) |
| timezone | VARCHAR(100) | Timezone |
| actual_start_time | TIMESTAMP | Actual start |
| actual_end_time | TIMESTAMP | Actual end |
| actual_duration | INTEGER | Actual duration |
| assigned_caregiver_id | UUID | FK to caregivers |
| assignment_method | VARCHAR(50) | How assigned |
| address | JSONB | Visit location |
| location_verification | JSONB | GPS verification (EVV) |
| status | VARCHAR(50) | Visit status |
| status_history | JSONB | Status change log |
| verification_method | VARCHAR(50) | EVV verification type |
| verification_data | JSONB | EVV verification records |
| signature_data | JSONB | Digital signature |
| billable_hours | DECIMAL(5,2) | Hours to bill |
| billing_status | VARCHAR(50) | Billing status |

**Visit Types:** REGULAR, INITIAL, DISCHARGE, RESPITE, EMERGENCY, MAKEUP, SUPERVISION, ASSESSMENT

**Visit Status:** DRAFT, SCHEDULED, UNASSIGNED, ASSIGNED, CONFIRMED, EN_ROUTE, ARRIVED, IN_PROGRESS, PAUSED, COMPLETED, INCOMPLETE, CANCELLED, NO_SHOW_CLIENT, NO_SHOW_CAREGIVER, REJECTED

**Verification Methods:** GPS, PHONE, FACIAL, BIOMETRIC, MANUAL

**Billing Status:** PENDING, READY, BILLED, PAID, DENIED, ADJUSTED

### visit_exceptions

Exceptions and issues during visits.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| visit_id | UUID | FK to visits |
| client_id | UUID | FK to clients |
| caregiver_id | UUID | FK to caregivers |
| exception_type | VARCHAR(50) | Type of exception |
| severity | VARCHAR(50) | Severity level |
| description | TEXT | Exception description |
| resolution | TEXT | Resolution details |
| status | VARCHAR(50) | Exception status |

**Exception Types:** LATE_START, EARLY_END, OVERTIME, NO_SHOW_CLIENT, NO_SHOW_CAREGIVER, LOCATION_MISMATCH, MISSED_TASKS, SAFETY_CONCERN, EQUIPMENT_ISSUE, MEDICATION_ISSUE, CLIENT_REFUSED, EMERGENCY, OTHER

**Severity Levels:** LOW, MEDIUM, HIGH, CRITICAL

## Audit & Compliance

### audit_events

Audit trail for security and compliance.

| Column | Type | Description |
|--------|------|-------------|
| event_id | UUID | Primary key |
| timestamp | TIMESTAMP | Event timestamp |
| user_id | UUID | FK to users |
| organization_id | UUID | FK to organizations |
| event_type | VARCHAR(50) | Type of event |
| resource | VARCHAR(100) | Resource type |
| resource_id | VARCHAR(100) | Resource identifier |
| action | VARCHAR(50) | Action performed |
| result | VARCHAR(20) | Success/Failure |
| metadata | JSONB | Additional context |
| ip_address | VARCHAR(45) | Client IP |
| user_agent | TEXT | Browser/client info |

### audit_revisions

Detailed change history for entities.

| Column | Type | Description |
|--------|------|-------------|
| revision_id | UUID | Primary key |
| entity_id | UUID | Entity identifier |
| entity_type | VARCHAR(100) | Entity type name |
| timestamp | TIMESTAMP | Revision timestamp |
| user_id | UUID | FK to users |
| operation | VARCHAR(20) | INSERT, UPDATE, DELETE |
| changes | JSONB | Changed fields |
| snapshot | JSONB | Full entity state |
| reason | TEXT | Reason for change |

## Programs & Billing

### programs

Care programs and funding sources.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| name | VARCHAR(255) | Program name |
| code | VARCHAR(50) | Program code |
| description | TEXT | Description |
| program_type | VARCHAR(100) | Type of program |
| funding_source | VARCHAR(100) | Funding source |
| eligibility_criteria | JSONB | Eligibility rules |
| service_types | VARCHAR(100)[] | Allowed services |
| hourly_rate | DECIMAL(10,2) | Billing rate |
| status | VARCHAR(50) | Program status |
| start_date | DATE | Program start |
| end_date | DATE | Program end |

## JSONB Data Structures

### Address Structure

```json
{
  "street1": "123 Main St",
  "street2": "Apt 4B",
  "city": "Austin",
  "state": "TX",
  "zipCode": "78701",
  "country": "US",
  "latitude": 30.2672,
  "longitude": -97.7431
}
```

### Phone Structure

```json
{
  "number": "+15125551234",
  "type": "MOBILE",
  "isPrimary": true,
  "canText": true,
  "canReceiveAlerts": true
}
```

### Emergency Contact Structure

```json
{
  "name": "Jane Doe",
  "relationship": "Daughter",
  "phone": "+15125551234",
  "alternatePhone": "+15125554321",
  "email": "jane@example.com",
  "isPrimaryContact": true,
  "canMakeDecisions": true,
  "hasKeyAccess": false
}
```

### Credential Structure

```json
{
  "type": "CNA",
  "number": "CNA-12345",
  "state": "TX",
  "issuedDate": "2023-01-15",
  "expirationDate": "2025-01-14",
  "status": "ACTIVE",
  "verificationDate": "2023-01-20",
  "verifiedBy": "uuid"
}
```

### Availability Structure

```json
{
  "monday": [
    { "start": "08:00", "end": "17:00" }
  ],
  "tuesday": [
    { "start": "08:00", "end": "17:00" }
  ],
  "exceptions": [
    {
      "date": "2024-12-25",
      "available": false,
      "reason": "Holiday"
    }
  ],
  "timezone": "America/Chicago"
}
```

### Recurrence Structure

```json
{
  "frequency": "WEEKLY",
  "interval": 1,
  "daysOfWeek": ["MONDAY", "WEDNESDAY", "FRIDAY"],
  "startTime": "09:00",
  "endTime": "11:00",
  "timezone": "America/Chicago",
  "startDate": "2024-01-01",
  "endDate": null,
  "exceptions": []
}
```

## Indexes

The schema includes extensive indexing for performance:

- **Partial indexes** on soft-deleted records (`WHERE deleted_at IS NULL`)
- **Composite indexes** for common query patterns
- **GIN indexes** on JSONB columns for JSON querying
- **Full-text search indexes** on name fields
- **Array indexes** on UUID[] columns using GIN

## Triggers

Automatic triggers for:

- `updated_at` timestamp updates on all mutable tables
- Credential expiration checking on caregivers table
- Status history tracking on visits

## Security Considerations

1. **Encryption**: SSN and sensitive financial data should be encrypted at the application level before storage
2. **Row-Level Security**: Consider implementing PostgreSQL RLS for multi-tenant isolation
3. **Audit Logging**: All changes are tracked in audit_events and audit_revisions
4. **Soft Deletes**: Records are soft-deleted (deleted_at timestamp) for data retention compliance

## Migration Files

Database migrations are located in `packages/core/migrations/`. Run migrations with:

```bash
npm run db:migrate
```

Rollback with:

```bash
npm run db:rollback
```
