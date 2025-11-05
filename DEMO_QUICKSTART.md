# Rich Interactive Demo - Quick Start Guide

## Overview

The Care Commons Rich Interactive Demo transforms the platform into a **living, breathing simulation** of a home healthcare agency with realistic multi-persona workflows.

## What's Included

### Demo Data (Phase 1 - ✅ COMPLETE)

- **20+ Caregivers** with varied:
  - Roles: CNA, HHA, RN, Companion, Senior Caregiver
  - Specialties: Dementia care, wound care, Parkinsons, hospice
  - Languages: English, Spanish, Mandarin, Korean
  - Certifications: Active, expiring soon, pending verification
  - Employment: Full-time, part-time, per diem
  - Compliance: 90% compliant, 10% with expiring credentials

- **30+ Clients** with diverse:
  - Conditions: Alzheimers, Parkinsons, CHF, COPD, diabetes, stroke, cancer
  - Risk levels: Low (7), Medium (11), High (8), Critical (4)
  - Mobility: Independent (5), Walker (15), Wheelchair (7), Bedridden (3)
  - Authorized hours: 10-60 hours per week
  - Locations: Dallas/Fort Worth area with GPS coordinates

- **3 Coordinators**:
  - Sarah Kim (Field Coordinator)
  - Michael Brown (Scheduling Coordinator)
  - Jennifer Lopez (Care Coordinator)

## Setup Instructions

### 1. Prerequisites

Ensure you have:
- PostgreSQL database running
- Environment variables configured (`.env` file)
- Database migrations applied

```bash
# Check database connection
npm run db:migrate:status

# If needed, run migrations
npm run db:migrate
```

### 2. Seed Base Operational Data

This creates the organization, branch, and admin user:

```bash
npm run db:seed
```

**Output**:
```
✅ Minimal seed completed successfully!

📊 Operational data created:
  Organization: Care Commons Home Health
  Branch: Main Office
  Admin User: admin@carecommons.example
  Password: Admin123!
```

### 3. Seed Rich Demo Data

This adds all caregivers, clients, and coordinators:

```bash
npm run db:seed:demo-v2
```

**Output**:
```
🎭 Seeding enhanced interactive demo data...

📝 Using DATABASE_URL for seeding
Using organization: Care Commons Home Health (uuid)
Using branch: Main Office (uuid)
Using system user: uuid

Creating Personal Care Services program...
✅ Created program: uuid

📝 Seeding 20+ caregivers...
✅ Created 20 caregivers

📝 Seeding 30+ clients...
✅ Created 30 clients

📝 Seeding coordinators...
✅ Created 3 coordinators

✅ Enhanced demo data seeded successfully!

📊 Demo data summary:
  Organization: Care Commons Home Health
  Branch: Main Office
  Program: Personal Care Services

👨‍⚕️ Caregivers: 20
    - Full-time: 14
    - Part-time: 4
    - Per diem: 2
    - Compliant: 18
    - Expiring credentials: 2

👥 Clients: 30
    - Low risk: 7
    - Medium risk: 11
    - High risk: 8
    - Critical risk: 4

👔 Coordinators: 3
    - Field: 1
    - Scheduling: 1
    - Care: 1
```

### 4. Verify Demo Data

```bash
# Login to database
psql $DATABASE_URL

# Check caregiver count
SELECT COUNT(*) FROM caregivers WHERE deleted_at IS NULL;
-- Expected: 20

# Check client count
SELECT COUNT(*) FROM clients WHERE deleted_at IS NULL;
-- Expected: 30

# Check coordinator count
SELECT COUNT(*) FROM users WHERE 'FIELD_COORDINATOR' = ANY(roles) OR 'SCHEDULING_COORDINATOR' = ANY(roles) OR 'CARE_COORDINATOR' = ANY(roles);
-- Expected: 3
```

## Demo Personas

### Featured Caregivers

| Name | Role | Specialty | Languages | Status |
|------|------|-----------|-----------|--------|
| Maria Rodriguez | CNA | Dementia Care | English, Spanish | Compliant |
| James Wilson | HHA | Mobility Assistance | English | Compliant |
| Aisha Johnson | RN | Wound Care | English | Compliant |
| David Chen | CNA | - | English, Mandarin | Pending Verification |
| Lisa Washington | HHA | - | English | Expiring Soon |
| Robert Davis | Senior | Hospice Care | English | Compliant |

**Total**: 20 caregivers with full profiles

### Featured Clients

| Name | Age | Conditions | Risk | Mobility | Hours/Week |
|------|-----|------------|------|----------|------------|
| Dorothy Chen | 87 | Alzheimers, Diabetes | High | Walker | 35 |
| Robert Martinez | 72 | Parkinsons | Medium | Wheelchair | 28 |
| Margaret Thompson | 82 | CHF, COPD | High | Walker | 42 |
| William Jackson | 79 | Post-Stroke | High | Wheelchair | 40 |
| Thomas Brown | 86 | Dementia, Wandering | **Critical** | Independent | 50 |
| David Gonzalez | 84 | Lung Cancer, Chemo | **Critical** | Bedridden | 56 |

**Total**: 30 clients with diverse care needs

### Coordinators

- **Sarah Kim** - Field Coordinator (North Dallas)
  - Username: `sarah.kim`
  - Email: `sarah.kim@demo.carecommons.example`

- **Michael Brown** - Scheduling Coordinator (Main Office)
  - Username: `michael.brown`
  - Email: `michael.brown@demo.carecommons.example`

- **Jennifer Lopez** - Care Coordinator (North Dallas)
  - Username: `jennifer.lopez`
  - Email: `jennifer.lopez@demo.carecommons.example`

## Using the Demo Data

### API Testing

```bash
# Get all caregivers
curl http://localhost:3000/api/caregivers

# Get caregiver by ID
curl http://localhost:3000/api/caregivers/{caregiver_id}

# Get all clients
curl http://localhost:3000/api/clients

# Get client by ID
curl http://localhost:3000/api/clients/{client_id}

# Get users (coordinators)
curl http://localhost:3000/api/users
```

### Database Queries

```sql
-- Caregivers by compliance status
SELECT 
  compliance_status, 
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM caregivers WHERE deleted_at IS NULL), 1) as percentage
FROM caregivers 
WHERE deleted_at IS NULL
GROUP BY compliance_status;

-- Clients by risk level
SELECT 
  risk_flags->0->>'severity' as risk_level,
  COUNT(*) as count
FROM clients 
WHERE deleted_at IS NULL
GROUP BY risk_flags->0->>'severity';

-- Caregivers with expiring credentials
SELECT 
  first_name, 
  last_name, 
  employee_number,
  credentials
FROM caregivers 
WHERE compliance_status = 'EXPIRING_SOON' 
  AND deleted_at IS NULL;

-- Clients by mobility
SELECT 
  mobility_info->>'requiresWheelchair' as wheelchair,
  mobility_info->>'requiresWalker' as walker,
  COUNT(*) as count
FROM clients 
WHERE deleted_at IS NULL
GROUP BY mobility_info->>'requiresWheelchair', mobility_info->>'requiresWalker';
```

## Resetting Demo Data

### Full Reset (Wipe Everything)

```bash
# WARNING: This deletes ALL data
npm run db:reset:demo

# This runs:
# 1. db:nuke     - Drop all tables
# 2. db:migrate  - Recreate schema
# 3. db:seed     - Add base org/branch/admin
# 4. db:seed:demo-v2 - Add all demo data
```

### Incremental Reset

```bash
# Just re-seed demo data (keeps base org/branch/admin)
npm run db:seed:demo-v2

# Note: This will add DUPLICATE data if run twice
# Run db:nuke first if you want a clean slate
```

## Demo API Endpoints (Phase 3 - ✅ COMPLETE)

The interactive demo system provides write-enabled APIs for testing multi-persona workflows. All modifications are **session-scoped** and isolated per user.

### Session Management

#### Create Demo Session
```bash
POST /api/demo/sessions
Content-Type: application/json

{
  "userId": "demo-user-123",           # Optional (auto-generated if omitted)
  "personaType": "CAREGIVER"           # Optional: CAREGIVER, COORDINATOR_FIELD, COORDINATOR_SCHEDULING, COORDINATOR_CARE, ADMIN
}

# Response
{
  "success": true,
  "data": {
    "sessionId": "session-xyz",
    "currentPersona": {
      "id": "caregiver-uuid",
      "type": "CAREGIVER",
      "name": "Maria Rodriguez",
      "role": "CNA"
    },
    "availablePersonas": [...],
    "expiresAt": "2025-01-06T04:00:00Z"
  }
}
```

#### Get Session State
```bash
GET /api/demo/sessions/:sessionId

# Response
{
  "success": true,
  "data": {
    "sessionId": "session-xyz",
    "currentPersona": {...},
    "state": {
      "currentTime": "2025-01-05T14:30:00Z",
      "eventCount": 5
    }
  }
}
```

#### Switch Persona
```bash
POST /api/demo/sessions/:sessionId/persona
Content-Type: application/json

{
  "personaType": "COORDINATOR_FIELD"
}

# Response
{
  "success": true,
  "data": {
    "currentPersona": {
      "id": "coordinator-uuid",
      "type": "COORDINATOR_FIELD",
      "name": "Sarah Kim",
      "role": "Field Coordinator"
    }
  }
}
```

#### Reset Session
```bash
POST /api/demo/sessions/:sessionId/reset

# Response
{
  "success": true,
  "data": {
    "message": "Session reset to base state"
  }
}
```

#### Delete Session
```bash
DELETE /api/demo/sessions/:sessionId

# Response
{
  "success": true,
  "data": {
    "message": "Session deleted"
  }
}
```

### Caregiver Actions

#### Clock In to Visit
```bash
POST /api/demo/sessions/:sessionId/visits/:visitId/clock-in
Content-Type: application/json

{
  "location": {
    "latitude": 32.7767,
    "longitude": -96.7970,
    "accuracy": 10
  }
}

# Response
{
  "success": true,
  "data": {
    "visitId": "visit-uuid",
    "status": "IN_PROGRESS",
    "actualStartTime": "2025-01-05T14:30:00Z"
  }
}
```

#### Clock Out from Visit
```bash
POST /api/demo/sessions/:sessionId/visits/:visitId/clock-out

# Response
{
  "success": true,
  "data": {
    "visitId": "visit-uuid",
    "status": "COMPLETED",
    "actualEndTime": "2025-01-05T16:30:00Z"
  }
}
```

#### Complete Task
```bash
POST /api/demo/sessions/:sessionId/tasks/:taskId/complete

# Response
{
  "success": true,
  "data": {
    "taskId": "task-uuid",
    "status": "COMPLETED",
    "completedAt": "2025-01-05T15:00:00Z"
  }
}
```

#### Add Visit Note
```bash
POST /api/demo/sessions/:sessionId/visits/:visitId/notes
Content-Type: application/json

{
  "content": "Patient in good spirits. Vital signs stable. Completed all ADLs without difficulty."
}

# Response
{
  "success": true,
  "data": {
    "visitId": "visit-uuid",
    "note": {
      "content": "Patient in good spirits...",
      "createdAt": "2025-01-05T15:30:00Z"
    }
  }
}
```

### Coordinator Actions

#### Assign Visit
```bash
POST /api/demo/sessions/:sessionId/visits/:visitId/assign
Content-Type: application/json

{
  "caregiverId": "caregiver-uuid"
}

# Response
{
  "success": true,
  "data": {
    "visitId": "visit-uuid",
    "caregiverId": "caregiver-uuid",
    "status": "ASSIGNED"
  }
}
```

#### Resolve Exception
```bash
POST /api/demo/sessions/:sessionId/exceptions/:exceptionId/resolve
Content-Type: application/json

{
  "resolution": "Reassigned to backup caregiver. Original caregiver called in sick."
}

# Response
{
  "success": true,
  "data": {
    "exceptionId": "exception-uuid",
    "status": "RESOLVED",
    "resolvedAt": "2025-01-05T10:00:00Z"
  }
}
```

### Utilities

#### Get Session Statistics
```bash
GET /api/demo/stats

# Response
{
  "success": true,
  "data": {
    "activeSessions": 5,
    "totalEvents": 127,
    "avgEventsPerSession": 25.4,
    "oldestSessionAge": "2h 15m"
  }
}
```

### Example: Multi-Persona Workflow

```bash
# 1. Create session as caregiver
SESSION_ID=$(curl -X POST http://localhost:3000/api/demo/sessions \
  -H "Content-Type: application/json" \
  -d '{"personaType": "CAREGIVER"}' | jq -r '.data.sessionId')

# 2. Clock in to visit
curl -X POST "http://localhost:3000/api/demo/sessions/$SESSION_ID/visits/visit-123/clock-in" \
  -H "Content-Type: application/json" \
  -d '{"location": {"latitude": 32.7767, "longitude": -96.7970, "accuracy": 10}}'

# 3. Complete tasks
curl -X POST "http://localhost:3000/api/demo/sessions/$SESSION_ID/tasks/task-456/complete"

# 4. Add visit note
curl -X POST "http://localhost:3000/api/demo/sessions/$SESSION_ID/visits/visit-123/notes" \
  -H "Content-Type: application/json" \
  -d '{"content": "Patient doing well. All tasks completed."}'

# 5. Clock out
curl -X POST "http://localhost:3000/api/demo/sessions/$SESSION_ID/visits/visit-123/clock-out"

# 6. Switch to coordinator persona
curl -X POST "http://localhost:3000/api/demo/sessions/$SESSION_ID/persona" \
  -H "Content-Type: application/json" \
  -d '{"personaType": "COORDINATOR_FIELD"}'

# 7. View exceptions and resolve
curl -X POST "http://localhost:3000/api/demo/sessions/$SESSION_ID/exceptions/exc-789/resolve" \
  -H "Content-Type: application/json" \
  -d '{"resolution": "Reassigned to backup caregiver"}'

# 8. Clean up session
curl -X DELETE "http://localhost:3000/api/demo/sessions/$SESSION_ID"
```

### Architecture Details

- **Event Sourcing**: All modifications are tracked as events
- **Session Isolation**: Each session has independent state
- **Time Travel**: Sessions maintain simulated time for testing
- **Auto-Expiration**: Sessions expire after 4 hours (configurable)
- **Background Cleanup**: Expired sessions cleaned every 60 seconds

### Implementation

Demo APIs are implemented in:
- `packages/app/src/routes/demo.ts` - Express route handlers
- `packages/core/src/demo/demo-session-manager.ts` - Session management
- `packages/core/src/demo/demo-state-store.ts` - In-memory storage

## Next Steps (Future Phases)

### Phase 2: Demo Session Management - ✅ COMPLETE
- [x] In-memory session store
- [x] Session isolation per user
- [x] Persona switching
- [x] Time acceleration

### Phase 3: Write-Enabled APIs - ✅ COMPLETE
- [x] Caregiver actions (clock-in/out, task completion)
- [x] Coordinator actions (schedule assignment, exception resolution)
- [x] Session management APIs
- [x] Event sourcing for state replay

### Phase 4: Role-Based UI (Week 3-4)
- [ ] Caregiver mobile view
- [ ] Coordinator dashboard
- [ ] Administrator analytics
- [ ] Demo mode toggle

### Phase 5: Family Portal & AI (Week 4)
- [ ] SMS notifications (Twilio)
- [ ] AI chatbot (Anthropic Claude)
- [ ] Family portal UI
- [ ] Secure family access

## Troubleshooting

### "No organization found" Error

**Solution**: Run `npm run db:seed` first to create base org/branch/admin

### Duplicate Key Errors

**Solution**: The demo seed script will fail if run twice without cleanup. Run:

```bash
npm run db:nuke
npm run db:migrate
npm run db:seed
npm run db:seed:demo-v2
```

### TypeScript Errors

**Solution**: Ensure all dependencies are installed:

```bash
npm install
npm run build
```

### Database Connection Errors

**Solution**: Check your `.env` file or `DATABASE_URL` environment variable:

```bash
# Local development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=care_commons

# OR use DATABASE_URL
DATABASE_URL=postgresql://user:pass@host:port/database
```

## Architecture Notes

### Why Separate Scripts?

- **`seed.ts`**: Minimal operational data (org, branch, admin)
  - Run once per environment
  - Required before demo data

- **`seed-demo-v2.ts`**: Rich demo data (caregivers, clients, coordinators)
  - Can be re-run for testing
  - Idempotent within fresh database

### Data Relationships

```
Organization (1)
  └─ Branch (1)
      ├─ Caregivers (20)
      ├─ Clients (30)
      └─ Visits (future: 100+)
  
  └─ Program (1)
      └─ Client Enrollments (30)

Users (4)
  ├─ Admin (1)
  └─ Coordinators (3)
```

## Performance Considerations

- **Seeding time**: ~2-3 seconds for all data
- **Database size**: ~500KB for demo data
- **Query performance**: Indexed on all common queries

## Contributing

To add more demo personas:

1. Edit `packages/core/scripts/seed-demo-v2.ts`
2. Add personas to `CAREGIVER_PERSONAS` or `CLIENT_PERSONAS` arrays
3. Run `npm run db:seed:demo-v2` to test

## Support

- **Documentation**: See `RICH_DEMO_IMPLEMENTATION_PLAN.md`
- **Issues**: Report to development team
- **Questions**: Ask in #engineering channel

---

**Last Updated**: 2025-01-05  
**Status**: Phases 1-3 Complete  
**Next Phase**: Role-Based UI Components (Phase 4)
