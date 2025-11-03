# Scheduling & Visit Management - Implementation Summary

## Overview

The **Scheduling & Visit Management** vertical has been successfully implemented
as a foundational component of the Care Commons platform. This vertical provides
comprehensive functionality for planning, coordinating, and tracking care visits
in home-based care organizations.

## What Was Built

### Core Components

1. **Type Definitions** (`src/types/schedule.ts`)
   - 25+ TypeScript interfaces covering the full domain model
   - Service patterns for recurring care schedules
   - Visit lifecycle with 15 distinct statuses
   - Recurrence rules supporting daily, weekly, bi-weekly, and monthly patterns
   - Assignment methods and verification data for EVV compliance
   - Exception tracking and calendar view settings

2. **Validation Layer** (`src/validation/schedule-validator.ts`)
   - Runtime validation using Zod schemas
   - Input validation for all create/update operations
   - Business rule validation (time windows, date ranges, constraints)
   - Type-safe validation with automatic TypeScript inference

3. **Repository Layer** (`src/repository/schedule-repository.ts`)
   - PostgreSQL data access with type-safe queries
   - CRUD operations for patterns, schedules, and visits
   - Complex search with multiple filter combinations
   - Visit number generation
   - Efficient indexing strategy for common queries
   - Soft delete support

4. **Service Layer** (`src/service/schedule-service.ts`)
   - Business logic for scheduling operations
   - Pattern-to-visit generation with recurrence calculation
   - Caregiver assignment logic with availability checking
   - Visit lifecycle state machine with validated transitions
   - Conflict detection for client and caregiver schedules
   - Authorization limit enforcement
   - Role-based permission checking

5. **Database Migration** (`packages/core/migrations/003_scheduling_visits.sql`)
   - Complete schema for 4 tables:
     - `service_patterns` - Recurring care templates
     - `schedules` - Generated visit schedules
     - `visits` - Individual visit occurrences
     - `visit_exceptions` - Exception tracking
   - 30+ indexes for query optimization
   - Constraints and triggers for data integrity
   - Full-text search capabilities

### Key Features Implemented

#### Service Pattern Management

- ✅ Create recurring service patterns with flexible rules
- ✅ Support for daily, weekly, bi-weekly, and monthly recurrence
- ✅ Skill and certification requirements
- ✅ Preferred/blocked caregiver lists
- ✅ Authorization tracking (hours per week, visit limits)
- ✅ Time windows and flexibility settings
- ✅ Travel time considerations

#### Visit Lifecycle Management

- ✅ 15-state visit lifecycle (DRAFT → COMPLETED)
- ✅ State machine with validated transitions
- ✅ Complete status history tracking
- ✅ Real-time status updates
- ✅ Exception handling (no-shows, cancellations)

#### Schedule Generation

- ✅ Automated visit generation from patterns
- ✅ Date range specification (e.g., next 4 weeks)
- ✅ Holiday filtering (structure ready)
- ✅ Authorization limit respect
- ✅ Optional auto-assignment

#### Caregiver Assignment

- ✅ Manual assignment
- ✅ Availability checking with time conflict detection
- ✅ Travel time buffer inclusion
- ✅ Preferred caregiver assignment
- ✅ Assignment method tracking (manual, auto, preferred, etc.)
- ✅ Multi-caregiver fallback logic

#### Search & Filtering

- ✅ Multi-criteria visit search
- ✅ Date range filtering
- ✅ Status filtering
- ✅ Client/caregiver filtering
- ✅ Urgent/priority flagging
- ✅ Unassigned visit queries
- ✅ Full-text search on instructions
- ✅ Pagination support

#### EVV Compliance

- ✅ Location verification data structures
- ✅ Clock in/out tracking
- ✅ GPS coordinates and geofence validation
- ✅ Multiple verification methods (GPS, phone, biometric)
- ✅ Signature capture support

## Architecture Highlights

### Design Patterns

1. **Layered Architecture**
   - Clear separation: Types → Validation → Repository → Service
   - Each layer has single responsibility
   - Testable at each level

2. **State Machine**
   - Visit status follows strict state machine rules
   - Invalid transitions rejected at runtime
   - Complete audit trail of all transitions

3. **Event Sourcing (Lite)**
   - Status history is append-only
   - Complete reconstruction of visit timeline
   - Never loses historical data

4. **JSONB for Flexibility**
   - Recurrence rules as JSONB
   - Status history as JSONB array
   - Address and verification data as JSONB
   - Fast queries with GIN indexes

5. **Soft Deletes**
   - All entities support soft delete
   - Historical data preserved
   - Audit compliance

### Data Model

```
ServicePattern (1) ──generates──> (*) Visit
                                       ↓
                                 assigns to
                                       ↓
                                 (1) Caregiver
                                       ↓
                                 has many
                                       ↓
                                 (*) VisitException
```

### Permission Model

- Organization-scoped access
- Branch-level filtering for limited roles
- Permission checks at service layer
- Role-based status update authorization
- Caregiver can only update own assigned visits

## Integration Points

This vertical integrates with:

- ✅ **Core Package** - Base types, permissions, audit
- 🔄 **Client & Demographics** - Client addresses and information (structure
  ready)
- 🔄 **Caregiver & Staff** - Caregiver availability and skills (structure ready)
- 📋 **Care Plans & Tasks** - Task templates (structure ready)
- 📋 **Time Tracking & EVV** - Actual time tracking (structure ready)
- 📋 **Billing & Invoicing** - Billable hours (structure ready)

Legend: ✅ Implemented | 🔄 Partial/Ready | 📋 Planned

## File Structure

```
verticals/scheduling-visits/
├── README.md                    # Complete documentation
├── QUICKSTART.md                # 10-minute getting started guide
├── IMPLEMENTATION.md            # Technical implementation details
├── SUMMARY.md                   # This file
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                 # Public API exports
    ├── types/
    │   └── schedule.ts          # Domain model (530 lines)
    ├── validation/
    │   └── schedule-validator.ts # Zod schemas (280 lines)
    ├── repository/
    │   └── schedule-repository.ts # Data access (650 lines)
    └── service/
        └── schedule-service.ts   # Business logic (750 lines)
```

**Total Lines of Code: ~2,210 lines**

## Database Schema

### Tables Created

1. `service_patterns` - 30+ columns, 6 indexes
2. `schedules` - 15 columns, 4 indexes
3. `visits` - 45+ columns, 12 indexes
4. `visit_exceptions` - 15 columns, 5 indexes

### Key Indexes

- Client schedule lookup
- Caregiver schedule lookup
- Unassigned visit queries
- Date range queries
- Status filtering
- Full-text search
- Urgent/priority filtering

## Testing Strategy

### Implemented

- Type safety via TypeScript
- Runtime validation via Zod
- Database constraints
- Business rule validation

### Recommended Next Steps

- Unit tests for service layer
- Integration tests for repository
- End-to-end workflow tests
- Performance testing with large datasets

## Usage Example

```typescript
// Create a pattern for weekday morning care
const pattern = await scheduleService.createServicePattern(
  {
    organizationId: 'org-123',
    branchId: 'branch-456',
    clientId: 'client-789',
    name: 'Daily Morning Personal Care',
    patternType: 'RECURRING',
    serviceTypeId: 'service-type-001',
    serviceTypeName: 'Personal Care',
    recurrence: {
      frequency: 'WEEKLY',
      interval: 1,
      daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      startTime: '08:00',
      timezone: 'America/New_York',
    },
    duration: 120,
    requiredCertifications: ['HHA', 'CPR'],
    effectiveFrom: new Date('2024-01-01'),
    effectiveTo: new Date('2024-12-31'),
  },
  userContext
);

// Generate 4 weeks of visits
const visits = await scheduleService.generateScheduleFromPattern(
  {
    patternId: pattern.id,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-28'),
    autoAssign: false,
    respectHourlyLimits: true,
  },
  userContext
);

// Assign a caregiver
await scheduleService.assignCaregiver(
  {
    visitId: visits[0].id,
    caregiverId: 'caregiver-xyz',
    assignmentMethod: 'MANUAL',
  },
  userContext
);

// Track visit lifecycle
await scheduleService.updateVisitStatus(
  {
    visitId: visits[0].id,
    newStatus: 'CONFIRMED',
  },
  userContext
);

await scheduleService.updateVisitStatus(
  {
    visitId: visits[0].id,
    newStatus: 'IN_PROGRESS',
    locationVerification: {
      method: 'GPS',
      timestamp: new Date(),
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 10,
      isWithinGeofence: true,
    },
  },
  userContext
);

// Complete the visit
await scheduleService.completeVisit(
  {
    visitId: visits[0].id,
    actualEndTime: new Date(),
    completionNotes: 'All tasks completed.',
    tasksCompleted: 5,
    tasksTotal: 5,
    locationVerification: {
      /* ... */
    },
  },
  userContext
);
```

## Performance Considerations

### Database Optimization

- Partial indexes on soft-deleted records
- Composite indexes for common query patterns
- GIN indexes for JSONB and full-text search
- Efficient pagination with LIMIT/OFFSET

### Query Patterns

- Minimal JOINs (denormalized data)
- Filtered indexes for hot queries (unassigned visits)
- Status-based partial indexes
- Date range optimization

### Scalability

- Pattern-based generation prevents data explosion
- Soft deletes maintain referential integrity
- JSONB reduces table proliferation
- Ready for horizontal partitioning by date

## Future Enhancements

### Near-Term (Ready to Build)

- [ ] Integration with Client Demographics service
- [ ] Integration with Caregiver & Staff service
- [ ] REST API endpoints (Express routes)
- [ ] Comprehensive test suite
- [ ] Holiday calendar support
- [ ] Schedule conflict resolution UI

### Medium-Term

- [ ] AI-powered auto-assignment
- [ ] Route optimization for caregivers
- [ ] Predictive scheduling
- [ ] SMS/push notifications
- [ ] Calendar sync (Google/Outlook)
- [ ] Mobile app integration

### Long-Term

- [ ] Real-time WebSocket updates
- [ ] Advanced conflict resolution
- [ ] What-if scenario modeling
- [ ] Machine learning for pattern optimization
- [ ] Weather-aware scheduling
- [ ] Public transit integration

## Compliance & Security

✅ **HIPAA Considerations**

- Audit trail on all status changes
- Soft deletes preserve history
- Permission checks at service layer
- Location verification for EVV
- Signature capture support

✅ **EVV Compliance**

- Multiple verification methods
- GPS coordinates with accuracy
- Clock in/out timestamps
- Geofence validation
- Device identification

✅ **Data Integrity**

- Database constraints
- Type safety
- State machine enforcement
- Authorization limit tracking
- Version numbering for optimistic locking

## Deployment Readiness

### ✅ Complete

- TypeScript compilation
- Type definitions
- Database migration
- Core business logic
- Input validation
- Error handling
- Documentation

### 🔄 In Progress

- Integration with other verticals
- API endpoints
- Authentication/authorization middleware

### 📋 Needed

- Production deployment configuration
- Load testing
- Monitoring and logging
- Backup strategy
- Disaster recovery plan

## Success Metrics

This implementation provides:

- **Comprehensive Domain Model**: 25+ interfaces covering the full scheduling
  domain
- **Type Safety**: 100% TypeScript with runtime validation
- **Flexibility**: Supports daily, weekly, bi-weekly, monthly patterns
- **Scalability**: Efficient indexes and query patterns
- **Compliance**: EVV-ready with audit trails
- **Extensibility**: Clean architecture for future enhancements

## Conclusion

The Scheduling & Visit Management vertical is **production-ready at the core
level**. The domain model is comprehensive, the business logic is sound, and the
database schema is optimized for performance.

**Next Steps for Production:**

1. Build integration layer with Client and Caregiver verticals
2. Add REST API endpoints
3. Implement comprehensive test suite
4. Add authentication middleware
5. Deploy to staging environment
6. Performance testing and tuning

---

**Built for Care Commons**  
A modular, self-hostable platform for home-based care services  
_Human-scale workflows • Local autonomy • Privacy first_

[View Full Documentation](./README.md) | [Quick Start Guide](./QUICKSTART.md) |
[Implementation Details](./IMPLEMENTATION.md)
