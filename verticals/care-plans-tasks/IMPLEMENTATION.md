# Care Plans & Tasks Library - Implementation Guide

## Overview

This document provides technical implementation details for the Care Plans &
Tasks Library vertical, including database schema, API endpoints, and deployment
considerations.

## Database Schema

**Migration Status**: ✅ IMPLEMENTED

The database schema described below has been implemented in migration file
`packages/core/migrations/20251030214716_care_plans_tables.ts` and successfully
applied to the database.

To verify:

```bash
# Check migration status
npm run db:migrate:status

# View the comprehensive migration
cat packages/core/migrations/20251030214716_care_plans_tables.ts
```

### Table: care_plans

```sql
CREATE TABLE care_plans (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,

  -- Associations
  client_id UUID NOT NULL REFERENCES clients(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  branch_id UUID REFERENCES branches(id),

  -- Plan metadata
  plan_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',

  -- Dates
  effective_date DATE NOT NULL,
  expiration_date DATE,
  review_date DATE,
  last_reviewed_date DATE,

  -- Care team
  primary_caregiver_id UUID REFERENCES caregivers(id),
  coordinator_id UUID REFERENCES users(id),
  supervisor_id UUID REFERENCES users(id),
  physician_id UUID,

  -- Plan content (JSONB for flexibility)
  assessment_summary TEXT,
  medical_diagnosis TEXT[],
  functional_limitations TEXT[],
  goals JSONB NOT NULL DEFAULT '[]',
  interventions JSONB NOT NULL DEFAULT '[]',
  task_templates JSONB DEFAULT '[]',

  -- Frequency and schedule
  service_frequency JSONB,
  estimated_hours_per_week NUMERIC(5,2),

  -- Authorization
  authorized_by UUID REFERENCES users(id),
  authorized_date DATE,
  authorization_number VARCHAR(100),
  payer_source JSONB,
  authorization_hours NUMERIC(6,2),
  authorization_start_date DATE,
  authorization_end_date DATE,

  -- Documentation requirements
  required_documentation JSONB,
  signature_requirements JSONB,

  -- Restrictions and precautions
  restrictions TEXT[],
  precautions TEXT[],
  allergies JSONB,
  contraindications TEXT[],

  -- Progress and outcomes
  progress_notes JSONB,
  outcomes_measured JSONB,

  -- Compliance
  regulatory_requirements TEXT[],
  compliance_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW',
  last_compliance_check TIMESTAMP,

  -- Modifications
  modification_history JSONB DEFAULT '[]',

  -- Metadata
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB,

  -- Audit fields
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1,

  -- Soft delete
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_care_plans_client_id ON care_plans(client_id);
CREATE INDEX idx_care_plans_organization_id ON care_plans(organization_id);
CREATE INDEX idx_care_plans_branch_id ON care_plans(branch_id);
CREATE INDEX idx_care_plans_status ON care_plans(status);
CREATE INDEX idx_care_plans_effective_date ON care_plans(effective_date);
CREATE INDEX idx_care_plans_expiration_date ON care_plans(expiration_date);
CREATE INDEX idx_care_plans_coordinator_id ON care_plans(coordinator_id);
CREATE INDEX idx_care_plans_plan_number ON care_plans(plan_number);
CREATE INDEX idx_care_plans_deleted_at ON care_plans(deleted_at);

-- GIN indexes for JSONB columns
CREATE INDEX idx_care_plans_goals ON care_plans USING GIN (goals);
CREATE INDEX idx_care_plans_interventions ON care_plans USING GIN (interventions);
CREATE INDEX idx_care_plans_task_templates ON care_plans USING GIN (task_templates);

-- Full-text search
CREATE INDEX idx_care_plans_name_search ON care_plans USING GIN (to_tsvector('english', name));

-- Composite indexes for common queries
CREATE INDEX idx_care_plans_org_status ON care_plans(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_care_plans_client_active ON care_plans(client_id, status) WHERE status = 'ACTIVE' AND deleted_at IS NULL;

-- Trigger for updated_at
CREATE TRIGGER update_care_plans_updated_at
  BEFORE UPDATE ON care_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Table: task_instances

```sql
CREATE TABLE task_instances (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  care_plan_id UUID NOT NULL REFERENCES care_plans(id),
  template_id UUID, -- Reference to template in care_plan.task_templates
  visit_id UUID REFERENCES visits(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  assigned_caregiver_id UUID REFERENCES caregivers(id),

  -- Task details
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  instructions TEXT NOT NULL,

  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  time_of_day VARCHAR(20),
  estimated_duration INTEGER, -- minutes

  -- Completion
  status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES users(id),
  completion_note TEXT,
  completion_signature JSONB,
  completion_photo TEXT[],

  -- Verification
  verification_data JSONB,
  quality_check_responses JSONB,

  -- Skipping
  skipped_at TIMESTAMP,
  skipped_by UUID REFERENCES users(id),
  skip_reason VARCHAR(200),
  skip_note TEXT,

  -- Issues
  issue_reported BOOLEAN DEFAULT FALSE,
  issue_description TEXT,
  issue_reported_at TIMESTAMP,
  issue_reported_by UUID REFERENCES users(id),

  -- Required data
  required_signature BOOLEAN NOT NULL DEFAULT FALSE,
  required_note BOOLEAN NOT NULL DEFAULT FALSE,
  custom_field_values JSONB,

  -- Metadata
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1
);

-- Indexes
CREATE INDEX idx_task_instances_care_plan_id ON task_instances(care_plan_id);
CREATE INDEX idx_task_instances_visit_id ON task_instances(visit_id);
CREATE INDEX idx_task_instances_client_id ON task_instances(client_id);
CREATE INDEX idx_task_instances_assigned_caregiver_id ON task_instances(assigned_caregiver_id);
CREATE INDEX idx_task_instances_status ON task_instances(status);
CREATE INDEX idx_task_instances_category ON task_instances(category);
CREATE INDEX idx_task_instances_scheduled_date ON task_instances(scheduled_date);
CREATE INDEX idx_task_instances_completed_at ON task_instances(completed_at);

-- Composite indexes
CREATE INDEX idx_task_instances_visit_status ON task_instances(visit_id, status);
CREATE INDEX idx_task_instances_date_status ON task_instances(scheduled_date, status);
CREATE INDEX idx_task_instances_caregiver_date ON task_instances(assigned_caregiver_id, scheduled_date);

-- GIN indexes for JSONB
CREATE INDEX idx_task_instances_verification ON task_instances USING GIN (verification_data);
CREATE INDEX idx_task_instances_quality_checks ON task_instances USING GIN (quality_check_responses);

-- Trigger for updated_at
CREATE TRIGGER update_task_instances_updated_at
  BEFORE UPDATE ON task_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Table: progress_notes

```sql
CREATE TABLE progress_notes (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  care_plan_id UUID NOT NULL REFERENCES care_plans(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  visit_id UUID REFERENCES visits(id),

  -- Note metadata
  note_type VARCHAR(50) NOT NULL,
  note_date DATE NOT NULL,

  -- Author
  author_id UUID NOT NULL REFERENCES users(id),
  author_name VARCHAR(200) NOT NULL,
  author_role VARCHAR(50) NOT NULL,

  -- Content
  content TEXT NOT NULL,

  -- Structured data (JSONB for flexibility)
  goal_progress JSONB DEFAULT '[]',
  observations JSONB DEFAULT '[]',
  concerns TEXT[],
  recommendations TEXT[],

  -- Review and approval
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  approved BOOLEAN DEFAULT FALSE,

  -- Attachments
  attachments TEXT[],

  -- Signature
  signature JSONB,

  -- Metadata
  tags TEXT[],
  is_private BOOLEAN DEFAULT FALSE,

  -- Audit fields
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1
);

-- Indexes
CREATE INDEX idx_progress_notes_care_plan_id ON progress_notes(care_plan_id);
CREATE INDEX idx_progress_notes_client_id ON progress_notes(client_id);
CREATE INDEX idx_progress_notes_visit_id ON progress_notes(visit_id);
CREATE INDEX idx_progress_notes_author_id ON progress_notes(author_id);
CREATE INDEX idx_progress_notes_note_type ON progress_notes(note_type);
CREATE INDEX idx_progress_notes_note_date ON progress_notes(note_date);
CREATE INDEX idx_progress_notes_reviewed_by ON progress_notes(reviewed_by);

-- Full-text search on content
CREATE INDEX idx_progress_notes_content_search ON progress_notes USING GIN (to_tsvector('english', content));

-- GIN indexes for JSONB
CREATE INDEX idx_progress_notes_goal_progress ON progress_notes USING GIN (goal_progress);
CREATE INDEX idx_progress_notes_observations ON progress_notes USING GIN (observations);

-- Trigger for updated_at
CREATE TRIGGER update_progress_notes_updated_at
  BEFORE UPDATE ON progress_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Supporting Function

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## API Endpoints

**Implementation Status**: ✅ IMPLEMENTED

All API endpoints described below have been implemented in
`verticals/care-plans-tasks/src/api/care-plan-handlers.ts` and are registered in
the Express app via `packages/app/src/routes/index.ts`.

To test the API:

```bash
# Start the server
npm run dev:server

# See DEMO.md for curl examples
```

### Care Plans

```
POST   /api/care-plans                    - Create new care plan
GET    /api/care-plans/:id                - Get care plan by ID
PUT    /api/care-plans/:id                - Update care plan
DELETE /api/care-plans/:id                - Delete care plan (soft delete)
POST   /api/care-plans/:id/activate       - Activate care plan
GET    /api/care-plans                    - Search care plans
GET    /api/care-plans/client/:clientId   - Get care plans for client
GET    /api/care-plans/expiring           - Get expiring care plans
GET    /api/care-plans/analytics          - Get care plan analytics
```

### Tasks

```
POST   /api/tasks                         - Create task instance
GET    /api/tasks/:id                     - Get task by ID
PUT    /api/tasks/:id                     - Update task
POST   /api/tasks/:id/complete            - Complete task
POST   /api/tasks/:id/skip                - Skip task
POST   /api/tasks/:id/report-issue        - Report task issue
GET    /api/tasks                         - Search task instances
GET    /api/tasks/visit/:visitId          - Get tasks for visit
POST   /api/tasks/visit/:visitId/generate - Generate tasks from care plan
GET    /api/tasks/metrics                 - Get task completion metrics
```

### Progress Notes

```
POST   /api/progress-notes                        - Create progress note
GET    /api/progress-notes/:id                    - Get progress note by ID
PUT    /api/progress-notes/:id                    - Update progress note
GET    /api/progress-notes/care-plan/:carePlanId - Get notes for care plan
GET    /api/progress-notes/client/:clientId      - Get notes for client
POST   /api/progress-notes/:id/review            - Review and approve note
```

## Data Validation Rules

### Care Plan

- Name: 1-255 characters, required
- Effective date: Cannot be in future for activation
- Expiration date: Must be after effective date
- At least one goal required for activation
- At least one intervention required for activation
- Coordinator required for activation

### Goal

- Name: 1-255 characters
- Description: 1-2000 characters
- Target date: Optional, must be in future
- Measurement type determines required fields
- Progress percentage: 0-100

### Task Instance

- Name: 1-255 characters
- Description: 1-2000 characters
- Instructions: 1-5000 characters
- Scheduled date: Required
- Status transitions validated

### Task Completion

- Signature required if task.requiredSignature = true
- Note required if task.requiredNote = true
- Vital signs must be within reasonable ranges
- GPS location required for GPS verification type

### Progress Note

- Content: 1-10000 characters
- Author information: Required
- Note date: Required
- Signature optional but captured if provided

## Business Logic

### Care Plan Activation

1. Validate plan has at least one goal
2. Validate plan has at least one intervention
3. Validate coordinator is assigned
4. Check for existing active plan for client
5. Optionally expire old plan
6. Set status to ACTIVE

### Task Generation

1. Load active care plan for client
2. Filter task templates by status = ACTIVE
3. For each template:
   - Check frequency pattern matches visit date
   - Check day of week if specified
   - Create task instance if conditions met
4. Link tasks to visit
5. Set initial status to SCHEDULED

### Task Completion

1. Validate task is in completable state (not COMPLETED, CANCELLED)
2. Check required fields (signature, note)
3. Validate vital signs if provided
4. Capture verification data (GPS, photo, etc.)
5. Record quality check responses
6. Set status to COMPLETED
7. Record completion timestamp and user

### Progress Note Creation

1. Validate care plan exists and is accessible
2. Extract author information from user context
3. Validate content length and format
4. Store structured goal progress data
5. Store structured observations
6. Capture signature if provided
7. Set initial approved = false

## Performance Considerations

### Indexing Strategy

- Index all foreign keys
- Composite indexes for common query patterns
- GIN indexes for JSONB columns
- Full-text indexes for search
- Partial indexes for filtered queries

### Query Optimization

- Use pagination for large result sets
- Limit JSONB column retrieval to needed fields
- Cache frequently accessed care plans
- Use database connection pooling
- Implement query result caching for analytics

### Scaling Considerations

- Partition task_instances by scheduled_date (monthly/quarterly)
- Archive old progress_notes to separate table
- Implement read replicas for analytics queries
- Use CDN for signature images and photos
- Consider caching layer (Redis) for active care plans

## Security

### Data Protection

- Encrypt signature data at rest
- Encrypt photo URLs (use signed URLs)
- Redact sensitive medical information in logs
- Implement field-level encryption for PHI

### Access Control

- Enforce organization boundary in all queries
- Validate user permissions before operations
- Audit all access to care plans and notes
- Implement row-level security policies

### Compliance

- Maintain complete audit trail
- Retain deleted records for required period
- Implement data retention policies
- Support HIPAA compliance requirements
- Enable audit log export for compliance reporting

## Testing Strategy

### Unit Tests

- Validation schemas
- Business logic methods
- Data transformations
- Permission checks

### Integration Tests

- Repository CRUD operations
- Service layer workflows
- API endpoints
- Database constraints

### End-to-End Tests

- Complete care plan lifecycle
- Task generation and completion
- Progress note creation
- Multi-user workflows

## Deployment

### Prerequisites

- PostgreSQL 14+ with JSONB support
- Node.js 20+
- Core package installed
- Client and Caregiver verticals (dependencies)

### Migration Steps

1. Run database migrations in order
2. Create indexes (can be done concurrently)
3. Seed initial data if needed
4. Deploy application code
5. Run smoke tests
6. Enable monitoring

### Rollback Plan

- Keep previous version deployable
- Database migrations are additive
- Feature flags for new functionality
- Gradual rollout by organization

## Monitoring

### Key Metrics

- Care plan creation rate
- Task completion rate
- Average completion time
- Skipped task rate
- Issue report rate
- Progress note creation rate
- API response times
- Database query performance

### Alerts

- Care plan expiring in < 7 days
- Task overdue > 24 hours
- High skip rate (> 20%)
- High issue report rate (> 10%)
- API errors > 1%
- Slow query warnings

## Future Enhancements

### Phase 2

- Care plan versioning and comparison
- Template library for common care plans
- Bulk task operations
- Advanced analytics dashboard
- Mobile-optimized task completion UI

### Phase 3

- AI-powered care plan suggestions
- Predictive analytics for outcomes
- Integration with clinical guidelines
- Voice-to-text for notes
- Automated care plan generation from assessments

### Phase 4

- Family portal integration
- Medication reconciliation
- Telehealth integration
- Outcome-based payment tracking
- Population health analytics

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
