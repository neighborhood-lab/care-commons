# Scheduling & Visit Management

> Definition of service episodes, recurring patterns, manual and rule-assisted scheduling, real-time status during the day, exceptions handling, and calendar views across roles.

The **Scheduling & Visit Management** vertical provides comprehensive functionality for planning, coordinating, and tracking care visits in home-based care organizations. It bridges the gap between care needs and service delivery through intelligent scheduling, automated pattern generation, and real-time visit tracking.

## Features

### Core Functionality

- **Service Pattern Templates** - Define recurring care schedules with flexible recurrence rules
- **Automated Schedule Generation** - Generate visit schedules from patterns for weeks or months ahead
- **Manual Visit Creation** - Create one-time or ad-hoc visits outside of patterns
- **Intelligent Assignment** - Match caregivers to visits based on skills, availability, and preferences
- **Real-Time Status Tracking** - Track visits through their complete lifecycle from scheduled to completed
- **Availability Management** - Check caregiver availability and identify scheduling conflicts
- **Exception Handling** - Detect and manage no-shows, late starts, and other exceptions
- **Calendar Views** - Multiple calendar perspectives for different roles and needs
- **Visit Verification** - Location-based verification for EVV compliance
- **Conflict Detection** - Prevent double-booking of clients or caregivers

### Visit Lifecycle

Visits progress through a well-defined lifecycle with automated and manual transitions:

```
DRAFT → SCHEDULED → UNASSIGNED → ASSIGNED → CONFIRMED
                                               ↓
                                          EN_ROUTE
                                               ↓
                                           ARRIVED
                                               ↓
                                        IN_PROGRESS ⟷ PAUSED
                                               ↓
                                          COMPLETED
```

Alternative outcomes:
- **CANCELLED** - Visit cancelled before start
- **NO_SHOW_CLIENT** - Client not available
- **NO_SHOW_CAREGIVER** - Caregiver didn't arrive
- **INCOMPLETE** - Visit ended but tasks not completed
- **REJECTED** - Caregiver rejected assignment

### Service Patterns

Service patterns are templates that define recurring care requirements:

- **Recurrence Rules** - Daily, weekly, bi-weekly, monthly, or custom schedules
- **Duration & Timing** - Specify visit length and preferred time windows
- **Skill Requirements** - Define required certifications and skills
- **Caregiver Preferences** - Specify preferred or blocked caregivers
- **Authorization Tracking** - Track authorized hours and visit limits
- **Client & Caregiver Instructions** - Include visit-specific guidance

### Assignment Methods

Caregivers can be assigned to visits through multiple pathways:

- **Manual Assignment** - Scheduler manually assigns caregiver
- **Auto-Match** - System recommends best matches based on:
  - Skills and certifications
  - Geographic proximity
  - Availability
  - Past performance with client
  - Language compatibility
- **Preferred Assignment** - Assign to client's preferred caregiver
- **Self-Assignment** - Caregivers claim open shifts
- **Overflow Assignment** - Last-resort assignment when no ideal match

## Data Model

### Service Pattern

```typescript
interface ServicePattern {
  // Identity
  id: UUID;
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;
  name: string;
  patternType: 'RECURRING' | 'ONE_TIME' | 'AS_NEEDED' | 'RESPITE';
  
  // Service definition
  serviceTypeId: UUID;
  serviceTypeName: string;
  recurrence: RecurrenceRule;
  duration: number; // minutes
  
  // Requirements
  requiredSkills: string[];
  requiredCertifications: string[];
  preferredCaregivers: UUID[];
  blockedCaregivers: UUID[];
  
  // Authorization
  authorizedHoursPerWeek: number;
  authorizationStartDate: Date;
  authorizationEndDate: Date;
  
  // Status
  status: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'COMPLETED';
  effectiveFrom: Date;
  effectiveTo: Date;
}
```

### Recurrence Rule

```typescript
interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM';
  interval: number; // Every N days/weeks/months
  daysOfWeek?: DayOfWeek[]; // For weekly patterns
  datesOfMonth?: number[]; // For monthly patterns
  startTime: string; // HH:MM
  endTime?: string;
  timezone: string;
}
```

### Visit

```typescript
interface Visit {
  // Identity
  id: UUID;
  visitNumber: string; // Human-readable like "V2024-000123"
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;
  patternId?: UUID;
  
  // Type & Service
  visitType: VisitType;
  serviceTypeId: UUID;
  serviceTypeName: string;
  
  // Timing
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  scheduledDuration: number;
  actualStartTime?: Date;
  actualEndTime?: Date;
  
  // Assignment
  assignedCaregiverId?: UUID;
  assignedAt?: Date;
  assignmentMethod: AssignmentMethod;
  
  // Location
  address: VisitAddress;
  locationVerification?: LocationVerification;
  
  // Tasks
  taskIds?: UUID[];
  tasksCompleted?: number;
  tasksTotal?: number;
  
  // Status
  status: VisitStatus;
  statusHistory: VisitStatusChange[];
  
  // Flags
  isUrgent: boolean;
  isPriority: boolean;
  requiresSupervision: boolean;
  riskFlags?: string[];
  
  // Completion
  completionNotes?: string;
  signatureRequired: boolean;
  signatureData?: SignatureData;
  
  // Billing
  billableHours?: number;
  billingStatus?: BillingStatus;
}
```

## Usage

### Creating a Service Pattern

```typescript
import { ScheduleService } from '@care-commons/scheduling-visits';
import { UserContext } from '@care-commons/core';

const scheduleService = new ScheduleService(repository);

const pattern = await scheduleService.createServicePattern({
  organizationId: 'org-123',
  branchId: 'branch-456',
  clientId: 'client-789',
  name: 'Daily Morning Care',
  patternType: 'RECURRING',
  serviceTypeId: 'service-type-abc',
  serviceTypeName: 'Personal Care',
  
  // Recurrence: Every weekday at 8am for 2 hours
  recurrence: {
    frequency: 'WEEKLY',
    interval: 1,
    daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    startTime: '08:00',
    timezone: 'America/New_York',
  },
  duration: 120, // 2 hours
  
  // Requirements
  requiredSkills: ['Dementia Care', 'Medication Management'],
  requiredCertifications: ['HHA', 'CPR'],
  preferredCaregivers: ['caregiver-1', 'caregiver-2'],
  
  // Authorization
  authorizedHoursPerWeek: 10,
  effectiveFrom: new Date('2024-01-01'),
  effectiveTo: new Date('2024-12-31'),
  
  // Instructions
  clientInstructions: 'Please arrive through side door. Client prefers morning routine before breakfast.',
  caregiverInstructions: 'Assist with hygiene, dressing, and breakfast preparation.',
}, userContext);
```

### Generating Schedule from Pattern

```typescript
// Generate 4 weeks of visits from the pattern
const visits = await scheduleService.generateScheduleFromPattern({
  patternId: pattern.id,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-28'),
  autoAssign: true, // Automatically assign to preferred caregivers
  respectHourlyLimits: true, // Don't exceed authorized hours
  skipHolidays: true,
}, userContext);

console.log(`Generated ${visits.length} visits`);
```

### Creating a One-Time Visit

```typescript
const visit = await scheduleService.createVisit({
  organizationId: 'org-123',
  branchId: 'branch-456',
  clientId: 'client-789',
  visitType: 'EMERGENCY',
  serviceTypeId: 'service-type-abc',
  serviceTypeName: 'Personal Care',
  scheduledDate: new Date('2024-01-15'),
  scheduledStartTime: '14:00',
  scheduledEndTime: '16:00',
  address: {
    line1: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62701',
    country: 'US',
  },
  isUrgent: true,
  clientInstructions: 'Emergency visit requested by family',
}, userContext);
```

### Assigning a Caregiver

```typescript
const assignedVisit = await scheduleService.assignCaregiver({
  visitId: visit.id,
  caregiverId: 'caregiver-123',
  assignmentMethod: 'MANUAL',
  notes: 'Best match based on location and experience',
}, userContext);
```

### Checking Caregiver Availability

```typescript
const isAvailable = await scheduleService.checkCaregiverAvailability({
  caregiverId: 'caregiver-123',
  date: new Date('2024-01-15'),
  startTime: '14:00',
  endTime: '16:00',
  includeTravel: true, // Include travel time in conflict check
});

if (!isAvailable) {
  console.log('Caregiver has conflicting visit or insufficient travel time');
}
```

### Getting Available Time Slots

```typescript
const slots = await scheduleService.getCaregiverAvailabilitySlots({
  caregiverId: 'caregiver-123',
  date: new Date('2024-01-15'),
  duration: 120, // 2-hour visit
  includeTravel: true,
});

slots.forEach(slot => {
  console.log(`${slot.startTime} - ${slot.endTime}: ${slot.isAvailable ? 'Available' : 'Unavailable'}`);
});
```

### Updating Visit Status

```typescript
// Mark caregiver as en route
await scheduleService.updateVisitStatus({
  visitId: visit.id,
  newStatus: 'EN_ROUTE',
  notes: 'Caregiver confirmed departure',
}, userContext);

// Clock in at client location
await scheduleService.updateVisitStatus({
  visitId: visit.id,
  newStatus: 'IN_PROGRESS',
  locationVerification: {
    method: 'GPS',
    timestamp: new Date(),
    latitude: 39.7817,
    longitude: -89.6501,
    accuracy: 10,
    isWithinGeofence: true,
  },
}, userContext);
```

### Completing a Visit

```typescript
await scheduleService.completeVisit({
  visitId: visit.id,
  actualEndTime: new Date(),
  completionNotes: 'All tasks completed successfully. Client in good spirits.',
  tasksCompleted: 8,
  tasksTotal: 8,
  signatureData: {
    capturedAt: new Date(),
    capturedBy: 'client-789',
    signatureImageUrl: 'https://...',
  },
  locationVerification: {
    method: 'GPS',
    timestamp: new Date(),
    latitude: 39.7817,
    longitude: -89.6501,
    accuracy: 15,
    isWithinGeofence: true,
  },
}, userContext);
```

### Searching Visits

```typescript
const results = await scheduleService.searchVisits({
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date('2024-01-31'),
  status: ['ASSIGNED', 'CONFIRMED'],
  branchId: 'branch-456',
  isUrgent: true,
}, {
  page: 1,
  limit: 20,
  sortBy: 'scheduled_date',
  sortOrder: 'asc',
}, userContext);

console.log(`Found ${results.total} visits`);
results.items.forEach(visit => {
  console.log(`${visit.visitNumber}: ${visit.scheduledDate} ${visit.scheduledStartTime} - ${visit.status}`);
});
```

### Getting Unassigned Visits

```typescript
const unassigned = await scheduleService.getUnassignedVisits(
  'org-123',
  'branch-456',
  userContext
);

console.log(`${unassigned.length} visits need assignment`);
unassigned.forEach(visit => {
  console.log(`${visit.visitNumber}: ${visit.scheduledDate} at ${visit.scheduledStartTime}`);
  console.log(`  Required skills: ${visit.requiredSkills?.join(', ')}`);
  console.log(`  Urgent: ${visit.isUrgent}`);
});
```

## Database Schema

### service_patterns table

```sql
CREATE TABLE service_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    client_id UUID NOT NULL,
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    pattern_type VARCHAR(50) NOT NULL,
    
    service_type_id UUID NOT NULL,
    service_type_name VARCHAR(200) NOT NULL,
    task_template_ids JSONB,
    
    recurrence JSONB NOT NULL,
    duration INTEGER NOT NULL, -- minutes
    flexibility_window INTEGER,
    
    required_skills JSONB,
    required_certifications JSONB,
    preferred_caregivers JSONB,
    blocked_caregivers JSONB,
    gender_preference VARCHAR(50),
    language_preference VARCHAR(100),
    
    preferred_time_of_day VARCHAR(50),
    must_start_by TIME,
    must_end_by TIME,
    
    authorized_hours_per_week NUMERIC(5,2),
    authorized_visits_per_week INTEGER,
    authorization_start_date DATE,
    authorization_end_date DATE,
    funding_source_id UUID,
    
    travel_time_before INTEGER,
    travel_time_after INTEGER,
    allow_back_to_back BOOLEAN DEFAULT false,
    
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    effective_from DATE NOT NULL,
    effective_to DATE,
    
    notes TEXT,
    client_instructions TEXT,
    caregiver_instructions TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id),
    CONSTRAINT fk_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id),
    CONSTRAINT fk_client FOREIGN KEY (client_id) 
        REFERENCES clients(id)
);

CREATE INDEX idx_patterns_client ON service_patterns(client_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_patterns_status ON service_patterns(status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_patterns_dates ON service_patterns(effective_from, effective_to) 
    WHERE deleted_at IS NULL;
```

### visits table

```sql
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    client_id UUID NOT NULL,
    pattern_id UUID,
    schedule_id UUID,
    
    visit_number VARCHAR(50) NOT NULL UNIQUE,
    visit_type VARCHAR(50) NOT NULL,
    service_type_id UUID NOT NULL,
    service_type_name VARCHAR(200) NOT NULL,
    
    scheduled_date DATE NOT NULL,
    scheduled_start_time TIME NOT NULL,
    scheduled_end_time TIME NOT NULL,
    scheduled_duration INTEGER NOT NULL, -- minutes
    timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
    
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    actual_duration INTEGER,
    
    assigned_caregiver_id UUID,
    assigned_at TIMESTAMP,
    assigned_by UUID,
    assignment_method VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    
    address JSONB NOT NULL,
    location_verification JSONB,
    
    task_ids JSONB,
    required_skills JSONB,
    required_certifications JSONB,
    
    status VARCHAR(50) NOT NULL DEFAULT 'UNASSIGNED',
    status_history JSONB NOT NULL DEFAULT '[]',
    
    is_urgent BOOLEAN DEFAULT false,
    is_priority BOOLEAN DEFAULT false,
    requires_supervision BOOLEAN DEFAULT false,
    risk_flags JSONB,
    
    verification_method VARCHAR(50),
    verification_data JSONB,
    
    completion_notes TEXT,
    tasks_completed INTEGER,
    tasks_total INTEGER,
    incident_reported BOOLEAN,
    
    signature_required BOOLEAN DEFAULT true,
    signature_captured BOOLEAN,
    signature_data JSONB,
    
    billable_hours NUMERIC(5,2),
    billing_status VARCHAR(50),
    billing_notes TEXT,
    
    client_instructions TEXT,
    caregiver_instructions TEXT,
    internal_notes TEXT,
    tags TEXT[],
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id),
    CONSTRAINT fk_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id),
    CONSTRAINT fk_client FOREIGN KEY (client_id) 
        REFERENCES clients(id),
    CONSTRAINT fk_pattern FOREIGN KEY (pattern_id) 
        REFERENCES service_patterns(id),
    CONSTRAINT fk_caregiver FOREIGN KEY (assigned_caregiver_id) 
        REFERENCES caregivers(id)
);

CREATE INDEX idx_visits_client ON visits(client_id, scheduled_date) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_visits_caregiver ON visits(assigned_caregiver_id, scheduled_date) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_visits_date ON visits(scheduled_date, scheduled_start_time) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_visits_status ON visits(status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_visits_unassigned ON visits(organization_id, branch_id) 
    WHERE deleted_at IS NULL AND assigned_caregiver_id IS NULL;
CREATE INDEX idx_visits_urgent ON visits(organization_id, scheduled_date) 
    WHERE deleted_at IS NULL AND is_urgent = true;
CREATE INDEX idx_visits_search ON visits 
    USING gin(to_tsvector('english', 
        coalesce(client_instructions, '') || ' ' || 
        coalesce(caregiver_instructions, '')));
```

## Permissions

### Required Permissions

- `schedules:create` - Create service patterns
- `schedules:read` - View patterns and schedules
- `schedules:update` - Modify patterns
- `schedules:delete` - Delete patterns
- `schedules:generate` - Generate visit schedules from patterns
- `visits:create` - Create visits
- `visits:read` - View visits
- `visits:update` - Modify visits and status
- `visits:delete` - Delete visits
- `visits:assign` - Assign caregivers to visits

### Role-Based Access

- **SUPER_ADMIN** - Full access to all scheduling functions
- **ORG_ADMIN** - Full access within organization
- **BRANCH_ADMIN** - Full access within assigned branches
- **COORDINATOR** - Create/update patterns and visits, assign caregivers
- **SCHEDULER** - Create visits, assign caregivers, view schedules
- **CAREGIVER** - View own assigned visits, update visit status
- **CLIENT/FAMILY** - View own visits (read-only)
- **AUDITOR** - Read-only access for compliance

## Integration Points

This vertical integrates with:

- **Client & Demographics** - Client information and addresses
- **Caregiver & Staff Management** - Caregiver availability, skills, certifications
- **Care Plans & Tasks** - Task templates and requirements
- **Time Tracking & EVV** - Clock in/out and location verification
- **Billing & Invoicing** - Billable hours and service documentation
- **Payroll Processing** - Worked hours for pay calculation
- **Compliance & Documentation** - Visit documentation and audit trails
- **Communication & Messaging** - Visit notifications and reminders

### Client Address Provider

The scheduling service requires a `ClientAddressProvider` implementation to fetch client addresses for visit generation and geolocation-based features (EVV validation, route optimization, caregiver-to-client matching).

**Architecture:**

The service uses dependency injection to decouple from the client-demographics vertical:

```typescript
import { ScheduleService, ClientAddressProvider } from '@care-commons/scheduling-visits';
import { ClientService } from '@care-commons/client-demographics';

// Create the address provider with caching
const addressProvider = new ClientAddressProvider(
  clientService,
  systemContext,
  300000 // 5-minute cache TTL (optional, default is 5 minutes)
);

// Inject into schedule service
const scheduleService = new ScheduleService(
  scheduleRepository,
  addressProvider
);
```

**Address Selection Priority:**

1. Primary address if type is 'HOME'
2. First secondary address with type 'HOME'
3. Any primary address regardless of type
4. Throws `NotFoundError` if no address found

**Caching Strategy:**

The `ClientAddressProvider` implements in-memory caching to reduce database queries:

- **Cache TTL**: Configurable, defaults to 5 minutes
- **Cache Invalidation**: Automatic expiration after TTL
- **Manual Invalidation**: Call `invalidateClient(clientId)` after address updates
- **Cache Clearing**: Call `clearCache()` for bulk invalidation
- **Monitoring**: Use `getCacheStats()` to monitor cache size and configuration

**Cache Invalidation Hooks:**

When client addresses are updated in the client-demographics service, invalidate the cache:

```typescript
// After updating a client's address
await clientService.updateClient(clientId, { primaryAddress: newAddress }, context);

// Invalidate the cached address
addressProvider.invalidateClient(clientId);
```

**Production Considerations:**

For production deployments with multiple application instances, consider:

1. **Redis/Memcached**: Replace in-memory cache with distributed cache
2. **Event-Driven Invalidation**: Use message queues to broadcast cache invalidation across instances
3. **Cache Warming**: Pre-populate cache with frequently accessed addresses
4. **Monitoring**: Track cache hit rates and adjust TTL based on usage patterns

**Future Enhancements:**

- [ ] Redis adapter for distributed caching
- [ ] Event-driven cache invalidation via message queue
- [ ] Per-client configurable geofence radius
- [ ] Address validation and geocoding service integration
- [ ] Cache warming on service startup

## Compliance Features

- **EVV Compliance** - Location-based visit verification
- **Authorization Tracking** - Monitor authorized hours and visit limits
- **Audit Trail** - Complete history of status changes and assignments
- **Signature Capture** - Digital signature collection for visit completion
- **Exception Reporting** - Track and document visit exceptions
- **Document Retention** - Long-term storage of visit records

## Future Enhancements

- [ ] AI-powered auto-assignment optimization
- [ ] Predictive scheduling based on historical patterns
- [ ] Multi-client route optimization for caregivers
- [ ] Weather-aware scheduling adjustments
- [ ] Integration with public transit schedules
- [ ] Automated late/no-show detection and alerts
- [ ] Client preference learning and pattern recommendations
- [ ] Group visit scheduling (multiple caregivers)
- [ ] Video visit support for telehealth
- [ ] Real-time location tracking during visits
- [ ] Automated visit report generation
- [ ] Calendar sync with Google/Outlook/Apple calendars
- [ ] SMS/push notifications for visit reminders
- [ ] Voice-activated status updates
- [ ] Caregiver bidding on open shifts

## License

See [LICENSE](../../LICENSE) for details.

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
