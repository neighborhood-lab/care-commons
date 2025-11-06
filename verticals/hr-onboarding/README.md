# HR & Onboarding Vertical

Comprehensive employee onboarding and HR management system for care organizations.

## Overview

The HR & Onboarding vertical provides a complete solution for managing the employee onboarding lifecycle, from initial application through full integration into the organization. It streamlines document management, background checks, training coordination, and compliance tracking.

## Features

### Core Capabilities

- **Onboarding Workflow Management**: Track employees through defined onboarding stages
- **Document Management**: Upload, verify, and track required documentation
- **Background Checks**: Initiate and monitor various types of background checks
- **Training Coordination**: Schedule and track training sessions and certifications
- **Task Management**: Create and track onboarding tasks with dependencies
- **Template System**: Use position-based templates to standardize onboarding
- **Progress Tracking**: Real-time visibility into onboarding completion status
- **Blocker Detection**: Automatically identify issues that may delay onboarding

### Onboarding Stages

1. **Not Started** - Initial state
2. **Application Submitted** - Candidate has applied
3. **Background Check Initiated** - Background checks in progress
4. **Background Check Completed** - All checks completed
5. **Documents Pending** - Awaiting required documentation
6. **Documents Verified** - All documents reviewed and approved
7. **Training Scheduled** - Training sessions scheduled
8. **Training In Progress** - Currently undergoing training
9. **Training Completed** - All training finished
10. **Orientation Scheduled** - Orientation session scheduled
11. **Orientation Completed** - Orientation finished
12. **Equipment Provisioning** - Equipment being provided
13. **System Access Setup** - IT access being configured
14. **Onboarding Complete** - Fully onboarded
15. **On Hold** - Temporarily paused
16. **Cancelled** - Onboarding cancelled

### Document Types

- **Identity & Eligibility**: Government ID, SSN, Work Authorization, I-9, W-4
- **Professional Credentials**: Licenses, Certifications, References, Resume
- **Compliance & Background**: Background checks, Drug tests, TB tests, Immunizations
- **Training**: Training certificates, CPR, First Aid
- **Banking**: Direct deposit forms
- **Company Policies**: Handbook, Confidentiality, Code of Conduct, HIPAA
- **Emergency**: Emergency contact information

### Background Check Types

- Criminal
- Employment verification
- Education verification
- Credit check
- Professional license verification
- Reference checks
- Drug screening
- Health screening

### Training Types

- Orientation
- Compliance training
- Technical training
- Safety training
- Clinical training
- Soft skills
- Product knowledge
- System training
- Specialty training
- Continuing education

## Architecture

### Layered Design

```
┌─────────────────────────────────────────┐
│           API Handlers                  │  Express route handlers
├─────────────────────────────────────────┤
│           Service Layer                 │  Business logic
├─────────────────────────────────────────┤
│         Validation Layer                │  Zod schemas
├─────────────────────────────────────────┤
│        Repository Layer                 │  Database access
├─────────────────────────────────────────┤
│            Database                     │  Data persistence
└─────────────────────────────────────────┘
```

### Data Model

#### Core Entities

**OnboardingRecord**
- Main tracking record for an employee's onboarding journey
- Links to employee/caregiver
- Tracks overall progress and status
- Contains stage information and progress metrics

**OnboardingDocument**
- Individual document records
- Tracks upload, verification, and expiration
- Supports multiple document types
- Maintains audit trail

**BackgroundCheck**
- Background check records
- Tracks provider, status, and results
- Supports multiple check types
- Records findings and completion

**Training**
- Training session records
- Tracks scheduling, completion, and scores
- Supports certification tracking
- Handles pass/fail status

**OnboardingTask**
- Individual task records
- Supports task dependencies
- Tracks assignment and completion
- Categorized by type

**OnboardingTemplate**
- Position-based templates
- Defines required documents, checks, and trainings
- Includes default tasks and timeline
- Enables consistent onboarding

## API Reference

### Onboarding Records

#### Create Onboarding Record
```http
POST /api/onboarding
Content-Type: application/json

{
  "employeeId": "uuid",
  "caregiverId": "uuid",
  "position": "Registered Nurse",
  "department": "Clinical",
  "startDate": "2025-01-15",
  "targetCompletionDate": "2025-02-15",
  "hiringManager": "uuid",
  "hrContact": "uuid",
  "buddy": "uuid",
  "templateId": "uuid",
  "notes": "Special accommodations needed"
}
```

#### Get Onboarding Record
```http
GET /api/onboarding/:id
```

#### Update Onboarding Record
```http
PATCH /api/onboarding/:id
Content-Type: application/json

{
  "stage": "training_in_progress",
  "notes": "Updated notes"
}
```

#### List Onboarding Records
```http
GET /api/onboarding?stage=training_in_progress&department=Clinical
```

#### Get Full Onboarding Details
```http
GET /api/onboarding/:id/full
```

Returns complete onboarding information including all documents, background checks, trainings, tasks, and tracking status.

#### Advance Stage
```http
POST /api/onboarding/:id/advance
Content-Type: application/json

{
  "nextStage": "training_completed"
}
```

#### Check Tracking Status
```http
GET /api/onboarding/:id/tracking
```

Returns whether onboarding is on track and any blockers.

### Documents

#### Upload Document
```http
POST /api/onboarding/:id/documents
Content-Type: application/json

{
  "employeeId": "uuid",
  "documentType": "nursing_license",
  "fileName": "license.pdf",
  "fileUrl": "https://storage.example.com/...",
  "mimeType": "application/pdf",
  "fileSize": 1048576,
  "expiresAt": "2027-12-31",
  "notes": "Valid through 2027"
}
```

#### List Documents
```http
GET /api/onboarding/:id/documents
```

#### Update Document Status
```http
PATCH /api/onboarding/documents/:documentId/status
Content-Type: application/json

{
  "status": "verified",
  "verifiedBy": "uuid"
}
```

### Background Checks

#### Initiate Background Check
```http
POST /api/onboarding/:id/background-checks
Content-Type: application/json

{
  "employeeId": "uuid",
  "checkType": "criminal",
  "provider": "Checkr",
  "referenceNumber": "CHK-12345"
}
```

#### List Background Checks
```http
GET /api/onboarding/:id/background-checks
```

#### Update Background Check Status
```http
PATCH /api/onboarding/background-checks/:checkId/status
Content-Type: application/json

{
  "status": "cleared",
  "result": "clear",
  "findings": "No issues found"
}
```

### Trainings

#### Schedule Training
```http
POST /api/onboarding/:id/trainings
Content-Type: application/json

{
  "employeeId": "uuid",
  "trainingType": "orientation",
  "title": "New Employee Orientation",
  "description": "Company policies and procedures",
  "required": true,
  "scheduledAt": "2025-01-20T09:00:00Z",
  "durationMinutes": 240,
  "passingScore": 80,
  "location": "Training Room A",
  "instructorId": "uuid"
}
```

#### List Trainings
```http
GET /api/onboarding/:id/trainings
```

#### Update Training Status
```http
PATCH /api/onboarding/trainings/:trainingId/status
Content-Type: application/json

{
  "status": "passed",
  "score": 95,
  "certificateUrl": "https://storage.example.com/cert.pdf"
}
```

### Tasks

#### Create Task
```http
POST /api/onboarding/:id/tasks
Content-Type: application/json

{
  "title": "Complete I-9 Form",
  "description": "Fill out employment eligibility verification",
  "category": "document",
  "assignedTo": "uuid",
  "dueDate": "2025-01-18",
  "order": 1,
  "required": true,
  "dependsOn": ["other-task-uuid"]
}
```

#### List Tasks
```http
GET /api/onboarding/:id/tasks
```

#### Update Task Status
```http
PATCH /api/onboarding/tasks/:taskId/status
Content-Type: application/json

{
  "status": "completed",
  "completedBy": "uuid"
}
```

#### Check if Task Can Start
```http
GET /api/onboarding/tasks/:taskId/can-start
```

### Templates

#### List Active Templates
```http
GET /api/onboarding/templates
```

#### Get Template for Position
```http
GET /api/onboarding/templates/position/Registered%20Nurse
```

## Usage Examples

### Creating an Onboarding Record with Template

```typescript
import { OnboardingService, OnboardingRepository } from '@care-commons/hr-onboarding';

const repository = new OnboardingRepository(db);
const service = new OnboardingService(repository);

// Create onboarding record using a template
const record = await service.createOnboardingRecord(
  {
    employeeId: 'emp-123',
    position: 'Registered Nurse',
    department: 'Clinical',
    startDate: new Date('2025-01-15'),
    targetCompletionDate: new Date('2025-02-15'),
    templateId: 'template-rn-001'
  },
  'admin-user-id'
);

// Template automatically creates required documents, checks, and trainings
```

### Tracking Onboarding Progress

```typescript
// Get full onboarding details
const details = await service.getFullOnboardingDetails(record.id);

console.log(`Overall Progress: ${details.record.overallProgress}%`);
console.log(`Documents: ${details.record.documentsProgress.verified}/${details.record.documentsProgress.total}`);
console.log(`Background Checks: ${details.record.backgroundChecksProgress.cleared}/${details.record.backgroundChecksProgress.total}`);
console.log(`Trainings: ${details.record.trainingsProgress.passed}/${details.record.trainingsProgress.total}`);
console.log(`Tasks: ${details.record.tasksProgress.completed}/${details.record.tasksProgress.total}`);

if (details.blockers.length > 0) {
  console.log('Blockers:', details.blockers);
}
```

### Managing Documents

```typescript
// Upload a document
const document = await service.uploadDocument(
  {
    onboardingId: record.id,
    employeeId: 'emp-123',
    documentType: 'nursing_license',
    fileName: 'license.pdf',
    fileUrl: 'https://storage.example.com/license.pdf',
    mimeType: 'application/pdf',
    fileSize: 1048576,
    expiresAt: new Date('2027-12-31')
  },
  'uploader-user-id'
);

// Verify the document
await service.updateDocumentStatus(
  document.id,
  {
    status: 'verified',
    verifiedBy: 'verifier-user-id'
  }
);
```

### Advancing Through Stages

```typescript
// Advance to next stage
await service.advanceStage(
  record.id,
  'training_in_progress',
  'admin-user-id'
);

// Check if onboarding is on track
const tracking = await service.checkOnTrack(record.id);
if (!tracking.isOnTrack) {
  console.log('Onboarding has blockers:', tracking.blockers);
}
```

## Integration

### With Caregiver-Staff Vertical

The HR & Onboarding vertical integrates with the `caregiver-staff` vertical to link onboarding records to caregiver profiles:

```typescript
import { CaregiverService } from '@care-commons/caregiver-staff';
import { OnboardingService } from '@care-commons/hr-onboarding';

// Link onboarding to caregiver
const onboarding = await onboardingService.createOnboardingRecord({
  employeeId: 'emp-123',
  caregiverId: 'cgv-456',  // Link to caregiver record
  position: 'Home Health Aide',
  // ...
}, userId);
```

### Database Schema

The vertical requires the following database tables:

- `onboarding_records`
- `onboarding_documents`
- `background_checks`
- `trainings`
- `onboarding_tasks`
- `equipment_provisions`
- `system_access`
- `onboarding_templates`

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
npm run test:coverage
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Best Practices

### Onboarding Process

1. **Create from Template**: Always use position-based templates for consistency
2. **Track Progress Regularly**: Monitor progress metrics and address blockers promptly
3. **Verify Documents**: Review and verify documents as soon as they're uploaded
4. **Complete Background Checks Early**: Initiate checks early to avoid delays
5. **Schedule Training in Advance**: Book training sessions early to ensure availability
6. **Use Task Dependencies**: Structure tasks with proper dependencies for logical flow
7. **Set Realistic Timelines**: Base target completion dates on historical data

### Document Management

- Store actual files in secure cloud storage (S3, Azure Blob, etc.)
- Store only file URLs and metadata in the database
- Implement expiration tracking for time-sensitive documents
- Maintain audit trails for document verification
- Support document versioning for updates

### Background Checks

- Integrate with third-party providers (Checkr, Sterling, etc.)
- Store provider reference numbers for tracking
- Set up webhooks for status updates from providers
- Comply with FCRA requirements for background checks
- Document findings appropriately

### Training Coordination

- Link to LMS (Learning Management System) if available
- Track certifications and expiration dates
- Support both in-person and online training
- Record passing scores and certificates
- Send reminders for upcoming training sessions

## Security Considerations

- Protect sensitive employee information (PII)
- Implement role-based access control (RBAC)
- Encrypt documents at rest and in transit
- Audit all access to onboarding records
- Comply with employment regulations (EEOC, ADA, etc.)
- Follow data retention policies

## Performance

- Index commonly queried fields (employeeId, stage, position)
- Cache template data to reduce database queries
- Batch progress updates when processing multiple items
- Use pagination for large result sets
- Optimize file storage with CDN for document delivery

## Future Enhancements

- **E-Signature Integration**: Digital signing of documents
- **Video Onboarding**: Record and track video-based orientation
- **Mobile App**: Mobile-friendly onboarding experience
- **Automated Reminders**: Email/SMS reminders for pending tasks
- **Analytics Dashboard**: Onboarding metrics and insights
- **Integration Hub**: Connect with HRIS systems (Workday, BambooHR, etc.)
- **Compliance Automation**: Auto-check compliance requirements by state/region

## License

MIT

## Support

For questions or issues, please contact the Care Commons team.
