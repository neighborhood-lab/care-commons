# Care Notes & Progress Reporting

Comprehensive documentation and reporting system for home care operations.

## Overview

The Care Notes & Progress Reporting vertical provides a complete solution for documenting care activities, tracking client progress, and generating compliance reports. It supports various note types including visit notes, incident reports, change in condition documentation, and comprehensive progress reports.

## Features

### Care Note Documentation

- **Multiple Note Types**
  - Visit notes and daily care documentation
  - Incident reports with detailed tracking
  - Change in condition documentation
  - Progress notes and assessments
  - Communication notes (family, physician)
  - Admission, discharge, and transfer notes

- **Structured Documentation**
  - ADL (Activities of Daily Living) assessments
  - IADL (Instrumental ADL) assessments
  - Physical, cognitive, and safety assessments
  - Vital signs tracking with alerts
  - Pain and mood assessments
  - Client condition monitoring

- **Care Activity Tracking**
  - Activities performed during visits
  - Tasks completed
  - Interventions provided
  - Medications administered
  - Goal progress tracking

### Review & Approval Workflow

- Multi-stage review process
- Approval workflow with audit trail
- Compliance checking
- Missing field validation
- Review comments and feedback

### Progress Reporting

- Automated progress report generation
- Configurable reporting periods (weekly, monthly, quarterly, annual)
- Goal progress tracking
- Key achievements and challenges
- Recommendations for care plan modifications
- Regulatory and payer-specific reports

### Analytics & Insights

- Care note analytics dashboard
- Compliance rate tracking
- Review completion metrics
- Incident and concern trending
- Change in condition tracking
- Notes by type analysis

## Architecture

The vertical follows a layered architecture:

```
┌─────────────────────────────────────┐
│         API Handlers                │  Express route handlers
├─────────────────────────────────────┤
│         Service Layer               │  Business logic & orchestration
├─────────────────────────────────────┤
│       Repository Layer              │  Data access & persistence
├─────────────────────────────────────┤
│         Types & Models              │  Domain models & interfaces
└─────────────────────────────────────┘
```

## Installation

```bash
npm install @care-commons/care-notes-reporting
```

## Usage

### Basic Setup

```typescript
import { Database } from '@care-commons/core';
import { PermissionService } from '@care-commons/core';
import {
  CareNoteRepository,
  CareNoteService,
  createCareNoteHandlers,
} from '@care-commons/care-notes-reporting';

// Initialize repository
const database = new Database(config);
const repository = new CareNoteRepository(database);

// Initialize service
const permissions = new PermissionService();
const service = new CareNoteService(repository, permissions);

// Create API handlers
const handlers = createCareNoteHandlers(service);
```

### Creating a Care Note

```typescript
const careNote = await service.createCareNote(
  {
    clientId: 'client-uuid',
    caregiverId: 'caregiver-uuid',
    organizationId: 'org-uuid',
    noteType: 'VISIT_NOTE',
    visitDate: new Date(),
    title: 'Morning Visit',
    content: 'Assisted client with morning ADLs...',
    structuredContent: {
      adlAssessment: {
        bathing: 'REQUIRES_ASSISTANCE',
        dressing: 'REQUIRES_ASSISTANCE',
        grooming: 'INDEPENDENT',
        // ... other ADLs
      },
    },
    vitalSigns: {
      takenAt: new Date(),
      takenBy: 'caregiver-uuid',
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      heartRate: 72,
      temperature: 98.6,
      temperatureUnit: 'F',
    },
  },
  userContext
);
```

### Searching Care Notes

```typescript
const result = await service.searchCareNotes(
  {
    clientId: 'client-uuid',
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
    noteType: ['VISIT_NOTE', 'PROGRESS_NOTE'],
    needsReview: true,
  },
  userContext,
  { limit: 20, offset: 0 }
);
```

### Reviewing Care Notes

```typescript
const reviewed = await service.reviewCareNote(
  noteId,
  {
    reviewStatus: 'APPROVED',
    reviewComments: 'Complete and accurate documentation.',
  },
  userContext
);
```

### Generating Progress Reports

```typescript
const report = await service.generateProgressReport(
  'client-uuid',
  'MONTHLY',
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  userContext
);
```

## API Endpoints

### Care Notes

- `POST /care-notes` - Create a new care note
- `GET /care-notes/:id` - Get care note by ID
- `PUT /care-notes/:id` - Update care note
- `DELETE /care-notes/:id` - Delete care note (soft delete)
- `GET /care-notes` - Search care notes
- `GET /care-notes/client/:clientId` - Get care notes by client
- `GET /care-notes/review/pending` - Get notes requiring review
- `POST /care-notes/:id/review` - Review a care note
- `POST /care-notes/:id/approve` - Approve a care note
- `GET /care-notes/analytics` - Get care note analytics

### Progress Reports

- `POST /progress-reports` - Generate a progress report
- `GET /progress-reports/:id` - Get progress report by ID
- `GET /progress-reports/client/:clientId` - Get reports by client

## Data Models

### CareNote

Core care note entity with:
- Basic identification (client, caregiver, visit)
- Note metadata (type, priority, status)
- Content (title, narrative, structured data)
- Observations and assessments
- Activities and tasks performed
- Concerns and alerts
- Review and approval tracking
- Compliance status

### StructuredNoteContent

Template-based structured documentation:
- ADL/IADL assessments
- Physical/cognitive assessments
- Safety assessments
- Environmental assessments
- SOAP note format (Subjective, Objective, Assessment, Plan)

### ProgressReport

Comprehensive progress reporting:
- Time period metrics
- Goal progress tracking
- Key achievements and challenges
- Care plan recommendations
- Assessment summaries
- Signatures and approvals

## Permissions

Required permissions:
- `care-notes:create` - Create care notes
- `care-notes:read` - Read care notes
- `care-notes:read:private` - Read private notes
- `care-notes:update` - Update care notes
- `care-notes:update:locked` - Update locked notes
- `care-notes:update:approved` - Update approved notes
- `care-notes:delete` - Delete care notes
- `care-notes:delete:approved` - Delete approved notes
- `care-notes:review` - Review care notes
- `care-notes:approve` - Approve care notes
- `care-notes:analytics` - View analytics
- `progress-reports:create` - Generate progress reports
- `progress-reports:read` - Read progress reports

## Compliance Features

- Required field validation
- Compliance status tracking
- Audit trail for all changes
- Review workflow enforcement
- Digital signature capture
- Timestamp and location tracking
- Privacy and confidentiality controls

## Integration Points

### With Other Verticals

- **Client Demographics** - Client information and demographics
- **Caregiver Staff** - Caregiver assignments and credentials
- **Scheduling Visits** - Visit scheduling and completion
- **Care Plans & Tasks** - Goal tracking and task completion
- **Time Tracking EVV** - Visit verification and timing

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm run test
npm run test:coverage
```

### Linting

```bash
npm run lint
```

## License

Proprietary - Care Commons Platform
