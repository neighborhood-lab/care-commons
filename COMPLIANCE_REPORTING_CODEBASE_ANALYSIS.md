# Care Commons Codebase Exploration Summary

## 1. Overall Project Structure

### Architecture Overview
- **Monorepo Setup**: Uses npm workspaces (Turbo monorepo)
- **Node Version**: 22.x required
- **Package Manager**: npm 10.9.4+
- **Type System**: TypeScript with strict ESM (ES Modules) configuration

### Directory Structure
```
care-commons/
├── packages/
│   ├── app/              # Express server (main API entry point)
│   ├── core/             # Shared core library (DB, auth, compliance, audit)
│   ├── web/              # Web frontend (React)
│   ├── mobile/           # Mobile app (React Native)
│   └── shared-components/# Shared UI components
├── verticals/            # Domain-specific business logic modules
│   ├── analytics-reporting
│   ├── billing-invoicing
│   ├── care-plans-tasks
│   ├── caregiver-staff
│   ├── client-demographics
│   ├── family-engagement
│   ├── payroll-processing
│   ├── quality-assurance-audits
│   ├── scheduling-visits
│   ├── shift-matching
│   └── time-tracking-evv
├── api/                  # Vercel serverless API handler
├── showcase/             # Demo/showcase application
├── e2e/                  # Playwright end-to-end tests
└── docs/                 # Documentation

```

### Key Technologies
- **Backend**: Express.js 5.x
- **Database**: PostgreSQL with Knex.js migration system
- **ORM/Query**: Custom raw SQL via Database class (NOT using Knex for runtime queries)
- **Authentication**: JWT with OAuth2 support
- **Frontend**: React with TanStack React Query
- **Testing**: Vitest + Playwright
- **Security**: Helmet, CORS, express-rate-limit, Redis for rate limiting
- **Monitoring**: Sentry for error tracking, OpenTelemetry instrumentation, Prom-client for metrics
- **Logging**: Pino structured logging

---

## 2. Existing Compliance & Reporting Features

### Compliance Module (`packages/core/src/compliance/`)
State-specific compliance validators supporting:
- **States**: Florida, Texas, Ohio, Arizona, Georgia, North Carolina, Pennsylvania
- **Architecture**: Abstract base validator with state-specific extensions
- **Validators**: `StateComplianceValidator` interface with these methods:
  - `canAssignToVisit()` - Validates caregiver assignments
  - Background screening validation
  - Licensure validation
  - Registry checks validation
  - State-specific credential validation

### Compliance Checks Implemented
1. **Background Screening**
   - Required level (1, 2, 3, Fingerprint)
   - Frequency (at hire, annual, biennial, 5-year)
   - Status tracking (Pending, Issues, Cleared, Expiring)

2. **Licensure Verification**
   - Role-based license requirements
   - Verification frequency
   - Expiration tracking

3. **Registry Checks**
   - Employee Misconduct Registry
   - Nurse Aide Registry
   - Abuse/Neglect Registry
   - Custom registry types

4. **Service Authorization**
   - Authorization tracking
   - Unit consumption monitoring
   - Overage handling

5. **Plan of Care**
   - Supervision requirements
   - Assessment timelines
   - Care plan expiration

### Analytics & Reporting Vertical (`verticals/analytics-reporting/`)
**Status**: Currently DISABLED in API routes due to architectural mismatch

**Pre-built Report Types**:
- **EVV Compliance Report** - State submission readiness, compliance rates
- **Productivity Report** - Caregiver performance metrics
- **Revenue Cycle Report** - Billing analysis, AR aging, payment trends

**Export Formats**:
- PDF (placeholder implementation - needs pdfkit/puppeteer)
- Excel (placeholder - needs exceljs)
- CSV (fully implemented)

**Architecture Issue**: 
- Uses Knex query builder at runtime
- Rest of codebase uses raw SQL via Database class
- Needs refactoring before re-enabling
- See: `verticals/analytics-reporting/ARCHITECTURAL_ISSUES.md`

### Audit Service (`packages/core/src/audit/audit-service.ts`)
- **Purpose**: Security and compliance event logging
- **Audit Events**: 
  - Authentication, Authorization, Data Access, Data Modification, Configuration, Security, Compliance
- **Tables**: `audit_events`, `audit_revisions`
- **Logging Methods**: logEvent, logDataAccess, logDataModification, logSecurityEvent

### Quality Assurance & Audits Vertical (`verticals/quality-assurance-audits/`)
Comprehensive audit management system with:

**Audit Types**:
- Compliance, Quality, Safety, Documentation
- Financial, Medication, Infection Control
- Training, Internal Reviews, External Audits

**Key Features**:
- Audit lifecycle management (draft → completion → approval)
- Finding documentation with severity levels
- Corrective action plans with root cause analysis
- Progress tracking and verification
- Compliance score calculation

**Service Methods**:
- createAudit, getAudit, updateAudit, startAudit, completeAudit
- createFinding, updateFindingStatus, verifyFinding, getCriticalFindings
- createCorrectiveAction, updateProgress, completeAction, verifyAction
- getAuditDashboard with real-time metrics

---

## 3. Database Schema & Models

### Core Tables

#### Base Infrastructure
- **organizations** - Organization entities with state code
- **users** - User accounts with roles and permissions
- **branches** - Organization branches
- **permissions** - Role-based access control
- **audit_events** - Compliance audit logging
- **audit_revisions** - Change tracking

#### Client & Caregiver Management
- **clients** - Client demographics with state-specific fields
- **caregivers** - Staff profiles with credentials
- **caregiver_credentials** - License/certification tracking
- **caregiver_background_checks** - Background screening records
- **caregiver_training** - Training and certifications

#### Service Delivery
- **visits** - Visit scheduling with status tracking
- **visit_notes** - Clinical documentation
- **tasks** - Care plan task tracking
- **care_plans** - Service authorization and care planning
- **service_types** - Service definitions with billing codes
- **service_authorizations** - Insurance/Medicaid authorizations

#### EVV & Compliance (Highly Detailed)
- **evv_records** - Electronic Visit Verification with:
  - Clock in/out with location verification (lat/long, geofence)
  - Location verification methods (GPS, address-based, manual, phone)
  - Mid-visit location checks
  - Pause/resume events
  - Exception events (breaks, travel)
  - Compliance flags (geofence violations, suspicious location, etc.)
  - Integrity hashing (SHA-256 + checksum for tamper detection)
  - Attestations (caregiver, client, supervisor)
  - State-specific extensible data
  - Payor submission tracking

#### Billing & Revenue
- **payers** - Insurance companies, Medicaid, Medicare entities
- **billable_items** - Individual service occurrences ready for billing
- **invoices** - Billing collections with status tracking
- **claims** - Insurance claim submissions
- **payments** - Incoming payment tracking
- **rate_schedules** - Pricing rules by service type and payer
- **billing_adjustments** - Denials, write-offs, corrections

#### Shift Matching
- **open_shifts** - Unfilled shifts with matching status
- **shift_proposals** - Caregiver proposals with acceptance tracking
- **match_history** - Audit log of matching attempts

#### Payroll & Time Tracking
- **timesheet_entries** - Time record tracking
- **payroll_runs** - Batch payroll processing
- **wage_deductions** - Tax and benefit deductions
- **payment_distributions** - Direct deposit tracking

#### Quality Assurance (Migration pending)
- **audits** - Audit records
- **audit_findings** - Individual findings with severity
- **corrective_actions** - Action plans for findings
- **audit_templates** - Reusable audit checklists

### Key Characteristics
- **UUID Primary Keys** with `gen_random_uuid()`
- **Soft Deletes**: `deleted_at` and `deleted_by` fields
- **Versioning**: `version` field for optimistic locking
- **Audit Trail**: `created_at/by`, `updated_at/by` on all tables
- **JSONB Fields**: For flexible data storage (state-specific fields, metadata)
- **Extensive Indexes**: Performance optimization on frequently queried columns
- **Foreign Key Constraints**: Referential integrity with ON DELETE CASCADE/RESTRICT
- **State-Specific Extensibility**: JSONB columns for state variations

### Notable Database Features
1. **Geospatial Support**: GIST indexes on location (latitude, longitude)
2. **Timezone Support**: Explicit timezone columns for time handling
3. **Compliance Integrity**: SHA-256 integrity hashes on EVV records
4. **Flexible Authorization**: JSONB arrays for dynamic field tracking
5. **Complex Constraints**: CHECK constraints for enumerated values

---

## 4. API Structure & Endpoints

### Server Architecture
**Main Entry Point**: `packages/app/src/server.ts`
- Uses Express 5.x
- Environment-aware (Vercel serverless vs local development)
- Vercel handler export via `createApp()` function

### Middleware Stack (in order)
1. Helmet - Security headers
2. Custom security headers
3. CORS - Origin validation
4. Request logging (Pino structured)
5. Metrics collection (Prometheus)
6. Body parsing (JSON + URL-encoded, 10MB limit)
7. Auth context extraction
8. Rate limiting (global `/api` routes)
9. Error handler (last)

### Rate Limiting
- **express-rate-limit** with Redis backend
- **General limiter**: Global API rate limit
- **Auth limiter**: Stricter limits on authentication endpoints
- **Redis**: Distributed rate limit store (supports cluster deployments)

### Current API Routes
```
/health                         - Health check
/metrics                        - Prometheus metrics
/api                           - API version info

# Authentication (with auth limiter)
/api/auth/*                    - Login, logout, password reset, 2FA

# Organization & Invitations
/api/organizations/*           - Org management
/api/invitations/*             - User invitations

# Client Management
/api/clients/*                 - Client CRUD operations
/api/clients/:id/care-plans    - Client care plans

# Care Plans & Tasks
/api/care-plans/*              - Care plan management
/api/care-plans/:id/activate   - Care plan activation
/api/care-plans/expiring       - Expiring care plans
/api/tasks/*                   - Task management
/api/tasks/:id/complete        - Task completion
/api/progress-notes/*          - Clinical notes

# Caregivers
/api/caregivers/*              - Staff management

# Sync (Offline Support)
/api/sync/*                    - Offline sync operations

# Demo (Testing)
/api/demo/*                    - Interactive demo endpoints
```

### DISABLED Routes (Needs Refactoring)
```
/api/analytics/                - DISABLED: Requires architectural refactor
                               See: verticals/analytics-reporting/ARCHITECTURAL_ISSUES.md
```

### Future Routes (Not Yet Implemented)
- `/api/scheduling/`           - Scheduling & visits
- `/api/evv/`                  - Time tracking & EVV
- `/api/shift-matching/`       - Shift matching
- `/api/billing/`              - Billing & invoicing
- `/api/payroll/`              - Payroll processing
- `/api/quality-assurance/`    - Quality assurance & audits
- `/api/analytics/`            - Analytics & reporting (currently disabled)

### Response Format
- **Status**: Standard HTTP status codes
- **Errors**: Structured error objects with:
  - `error` (string)
  - `message` (detailed description)
  - `statusCode` (HTTP status)
  - `details` (additional context)
- **Pagination**: Supported via query parameters (limit, offset)
- **Content-Type**: application/json

### Authentication
- **JWT Bearer Tokens**: In Authorization header
- **Session Management**: Optional session support
- **OAuth2 Ready**: Google Auth Library integrated
- **Rate Limiting**: Auth endpoints get stricter limits

---

## 5. Job Scheduling & Cron Systems

### Current Status: **NOT IMPLEMENTED**

### Infrastructure Available
1. **Redis Support**: 
   - Installed and configured for rate limiting
   - Available for job queue implementation

2. **Identified Needs** (from report-service.ts):
   - Method `scheduleReport()` exists but marked NOT IMPLEMENTED
   - Comments suggest requirements:
     - Job queue (e.g., Bull, BullMQ)
     - Cron scheduling
     - Email delivery

3. **Existing Patterns**:
   - Password reset service has comment: "Should be run periodically (e.g., daily cron job)"
   - Suggests cron jobs needed for cleanup operations

### Recommendations for Implementation
1. **Job Queue Library**: BullMQ (recommended for Node.js + Redis)
2. **Cron Scheduling**: 
   - node-cron for simple schedules
   - Or use BullMQ's built-in recurring job features
3. **Potential Jobs**:
   - Automated report generation and email delivery
   - EVV submission to state aggregators
   - Credential expiration warnings
   - Billing cycle triggering
   - Payment reconciliation
   - Appointment reminder notifications
   - Audit schedule triggers
   - Data cleanup and archival

### Database Preparation
Would need new tables:
```
scheduled_reports          # Store report generation schedules
job_runs                  # Track job execution history
job_failures              # Log failed job attempts
notification_queue        # Pending notifications
```

---

## 6. Report Generation Functionality

### Current Implementation Status

#### Report Service (`verticals/analytics-reporting/src/service/report-service.ts`)
**Status**: Partially implemented, DISABLED in API routes

**Implemented Methods**:
1. `generateEVVComplianceReport()` - State compliance reporting
   - Compliant vs total visit count
   - Compliance rate calculation
   - Flagged visit details
   - State-specific aggregator submissions tracking

2. `generateProductivityReport()` - Caregiver performance metrics
   - Visits completed, average duration
   - On-time percentage, EVV compliance
   - Performance scoring (0-100)
   - Top performers and improvement needed lists

3. `generateRevenueCycleReport()` - Financial analysis
   - Billed, paid, outstanding amounts
   - Aging bucket analysis (0-30, 31-60, 61-90, 90+)
   - Denial rates
   - Revenue by payer breakdown
   - 12-month trend analysis

4. `scheduleReport()` - NOT IMPLEMENTED
   - Needs job queue integration
   - Needs email delivery configuration
   - Needs persistent storage

**Report Structure**:
```typescript
interface Report {
  id: string;           // Generated report ID
  reportType: ReportType;
  title: string;
  description?: string;
  organizationId: UUID;
  branchId?: UUID;
  generatedAt: Date;
  generatedBy: UUID;   // User who requested
  period: DateRange;
  exportFormats: ['PDF', 'EXCEL', 'CSV'];
  data: Record<string, unknown>;
}
```

#### Export Service (`verticals/analytics-reporting/src/service/export-service.ts`)
**Status**: Placeholder implementations

**Export Methods**:
1. `exportToPDF()` - PLACEHOLDER
   - Needs implementation with: jsPDF, pdfkit, or puppeteer
   - Currently returns buffer stub

2. `exportToExcel()` - PLACEHOLDER
   - Needs exceljs library implementation
   - Currently returns buffer stub

3. `exportToCSV()` - FULLY IMPLEMENTED
   - Generates proper CSV with headers
   - Report-type specific formatting
   - Different handlers for EVV, Productivity, Revenue reports

**MIME Types Supported**:
- PDF: `application/pdf`
- Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- CSV: `text/csv`

#### Types Defined (`verticals/analytics-reporting/src/types/analytics.ts`)
Comprehensive report type definitions including:
- DateRange, DateRangeFilter
- VisitMetrics, EVVComplianceMetrics
- RevenueMetrics, StaffingMetrics, ClientMetrics
- ComplianceAlerts (with severity levels)
- CaregiverPerformance with 11 metrics
- RevenueTrendDataPoint, EVVSubmissionStatus
- VisitException tracking
- AgingBucket for AR analysis
- RevenueByPayer breakdown
- OperationalKPIs aggregation

#### Repository (`verticals/analytics-reporting/src/repository/analytics-repository.ts`)
Query methods for:
- countCompliantVisits, countFlaggedVisits
- getCaregiverPerformanceData
- sumBilledAmount, sumPaidAmount, getOutstandingAR
- getAgingBuckets, getRevenueByPayer
- getRevenueTrends (12-month history)

### Why Analytics Routes Are Disabled
1. **Query Architecture Mismatch**:
   - Analytics uses: Knex.js query builder at runtime
   - Rest of system uses: Raw SQL via Database class
   - Incompatible patterns create maintenance debt

2. **Missing Implementation**:
   - PDF export needs library (pdfkit/jsPDF/puppeteer)
   - Excel export needs exceljs
   - Flagged visit details method throws error (Knex usage)
   - Schedule report method throws error (not implemented)

3. **Path Forward**:
   - Refactor analytics-reporting to use raw SQL
   - OR add Knex to core Database class
   - Add document generation libraries
   - Complete schedule report implementation

---

## 7. Document Generation Tools

### Current Dependencies
**Installed**: NONE
- pdfkit - NOT installed
- jspdf - NOT installed
- puppeteer - NOT installed
- exceljs - NOT installed
- csv-parse/stringify - NOT installed

### Export Service Status
All document generation is PLACEHOLDER only:

#### PDF Export (NOT IMPLEMENTED)
```typescript
async exportToPDF(report: Report): Promise<Buffer>
```
**Needs One Of**:
1. **pdfkit** - Node.js PDF generation library
2. **jsPDF** - JavaScript PDF library
3. **puppeteer** - Chromium-based HTML-to-PDF conversion
4. **libre-office** (external) - Enterprise PDF generation

**Recommendation**: Puppeteer for complex layouts, pdfkit for simplicity

#### Excel Export (NOT IMPLEMENTED)
```typescript
async exportToExcel(report: Report): Promise<Buffer>
```
**Needs**: exceljs library
- Supports styling, formulas, multiple sheets
- Can create pivot tables
- Supports charts

#### CSV Export (FULLY IMPLEMENTED)
```typescript
async exportToCSV(report: Report): Promise<string>
```
Already handles:
- EVV Compliance reports
- Productivity reports
- Revenue Cycle reports
- Generic fallback for unknown types

### Implementation Gaps
1. **PDF Generation**
   - Placeholder returns text buffer
   - Needs styled template system
   - Should include headers, footers, logos
   - Multi-page support for large datasets

2. **Excel Generation**
   - Placeholder returns CSV-like text
   - Needs multiple worksheets
   - Should include formatting, colors
   - Needs formulas for calculations
   - Should support charts/graphs

3. **Email Delivery**
   - No SMTP configured
   - No email templating system
   - No attachment handling

4. **Storage**
   - No file storage system
   - No report archival
   - No download tracking

### Recommended Implementation Stack
1. **PDF**: Puppeteer (HTML-based, flexible layouts)
2. **Excel**: ExcelJS (comprehensive Excel support)
3. **CSV**: Already done
4. **Email**: Nodemailer + handlebars templates
5. **Storage**: S3 or local file system

### Future Report Types Needed
From type definitions:
- `CAREGIVER_PERFORMANCE`
- `CLIENT_SUMMARY`
- `AUTHORIZATION_STATUS`
- `CREDENTIAL_COMPLIANCE`
- Custom state-specific reports

---

## Summary: Where to Implement Compliance Reporting Automation

### Recommended Implementation Location
1. **API Endpoints**: `packages/app/src/routes/analytics.ts`
   - Create new route handlers for compliance reporting
   - Integrate quality-assurance-audits for audit reports
   
2. **Services**: 
   - `verticals/analytics-reporting/src/service/` - Report generation
   - `verticals/quality-assurance-audits/src/services/` - Audit management
   - New: Compliance reporting service

3. **Database**:
   - Existing: `audit_events`, `audit_revisions`, `evv_records`
   - Create: `scheduled_reports`, `generated_reports`, `report_distributions`
   - Quality assurance vertical tables for audits

4. **Job Scheduling**:
   - Implement BullMQ + Redis for background jobs
   - Create job handlers for:
     - Report generation
     - Email delivery
     - EVV submission to aggregators
     - Credential expiration notifications

5. **Document Generation**:
   - Add puppeteer, exceljs, nodemailer dependencies
   - Implement PDF/Excel export in ExportService
   - Create email templates

### Key Files to Focus On
- `/packages/app/src/routes/analytics.ts` - Re-enable with fixes
- `/verticals/analytics-reporting/` - Complete and refactor
- `/verticals/quality-assurance-audits/` - Use for audit reports
- `/packages/core/src/compliance/` - Leverage validators
- Database migrations - Add reporting infrastructure tables

