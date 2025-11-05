# Family Engagement Platform - Architectural Issues & Required Refactor

**Status**: ⚠️ **NOT PRODUCTION READY** - Requires significant architectural refactor before deployment

## Critical Issues

### 1. Database Access Layer Mismatch (CRITICAL)

**Problem**: The family-engagement vertical uses `getKnex()` method which doesn't exist in the Care Commons `Database` class.

**Impact**:
- All repository methods calling `this.database.getKnex()` will fail at runtime
- The `Database` class from `@care-commons/core` only exposes: `query()`, `getClient()`, `transaction()`, `close()`, and `healthCheck()`
- 26 instances of `getKnex()` usage across repository files
- Zero instances of proper raw SQL usage

**Files Affected**:
- `verticals/family-engagement/src/repository/family-member-repository.ts` - Multiple query methods
- `verticals/family-engagement/src/repository/family-message-repository.ts` - All query methods
- `verticals/family-engagement/src/repository/family-notification-repository.ts` - All query methods

**Example Issue**:
```typescript
// CURRENT (BROKEN):
async findByClientId(clientId: string): Promise<FamilyMember[]> {
  const query = this.database
    .getKnex()(this.tableName)  // ❌ getKnex() does not exist
    .where({ client_id: clientId, status: 'ACTIVE' })
    .orderBy('contact_priority', 'asc');
  
  const rows = await query;
  return rows.map(row => this.mapRowToEntity(row));
}

// REQUIRED (Raw SQL):
async findByClientId(clientId: string): Promise<FamilyMember[]> {
  const query = `
    SELECT * FROM family_members
    WHERE client_id = $1 AND status = $2
    ORDER BY contact_priority ASC
  `;
  
  const result = await this.database.query(query, [clientId, 'ACTIVE']);
  return result.rows.map(row => this.mapRowToEntity(row));
}
```

### 2. Repository Pattern Mismatch

**Problem**: The repositories extend `Repository<T>` from core but then bypass it with Knex queries.

**Impact**:
- Not leveraging the built-in CRUD operations from base Repository class
- Duplicating logic that Repository base class provides
- Inconsistent with other verticals (client-demographics, caregiver-staff)

**Solution**: Either:
1. Use base Repository CRUD methods and only add custom queries
2. Don't extend Repository and use raw SQL throughout

## Required Refactor Plan

### Phase 1: Repository Layer Rewrite (High Priority)

Rewrite all 26 Knex query instances to use raw SQL:

**FamilyMemberRepository** (~8-10 methods to rewrite):
- `findByClientId()`
- `findByOrganization()`
- `findPrimaryContact()`
- `findEmergencyContacts()`
- `search()`
- `getStatistics()`

**FamilyMessageRepository** (~10-12 methods to rewrite):
- `findByConversation()`
- `findByParticipant()`
- `getUnreadCount()`
- `markAsRead()`
- `search()`
- Custom conversation queries

**FamilyNotificationRepository** (~6-8 methods to rewrite):
- `findByRecipient()`
- `findUndelivered()`
- `markAsDelivered()`
- `markAsRead()`
- `getStatistics()`

**Estimated Effort**: 2-3 days for experienced developer

### Phase 2: Integration with Core Repository (Medium Priority)

Refactor to properly leverage base Repository class:

```typescript
export class FamilyMemberRepository extends Repository<FamilyMember> {
  // Use inherited methods: create(), findById(), update(), delete(), findAll()
  
  // Only add family-specific queries:
  async findByClientId(clientId: string): Promise<FamilyMember[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE client_id = $1 AND status = 'ACTIVE'
      ORDER BY contact_priority ASC
    `;
    const result = await this.database.query(query, [clientId]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }
}
```

**Estimated Effort**: 1-2 days

### Phase 3: Testing & Validation (High Priority)

- Write integration tests for all repository methods
- Test with real PostgreSQL database
- Validate query performance with EXPLAIN ANALYZE
- Ensure proper indexing (migration creates indexes)
- Test transaction handling for multi-table operations

**Estimated Effort**: 1-2 days

### Phase 4: Service Layer Validation (Low Priority)

Once repositories are fixed:
- Verify service layer business logic
- Add service-level unit tests
- Validate notification delivery logic
- Test message threading and conversations
- Verify consent management workflows

**Estimated Effort**: 1 day

## Compliance & Security Considerations

### HIPAA Requirements

The family engagement platform accesses PHI and requires:

1. **Access Controls**:
   - Family members can only access their authorized client's data
   - Granular permissions (can_view_care_plans, can_view_medical_info, etc.)
   - Authorized representative designation and tracking

2. **Audit Trail**:
   - All data access must be logged (who, what, when)
   - Message read status tracking
   - Notification delivery tracking
   - Consent changes must be auditable

3. **Minimum Necessary**:
   - Only expose data family member is authorized to see
   - Respect communication preferences
   - Honor opt-out requests

4. **Data Retention**:
   - Messages must be retained per policy
   - Audit logs must be immutable
   - Consent records must be preserved

### State-Specific Considerations

**Texas**:
- Written consent required for certain disclosures
- Electronic signatures must meet Texas Health & Safety Code requirements
- Family access logs may be subject to HHSC audits

**Florida**:
- Additional privacy protections under Florida Statute Chapter 395
- Consent requirements for MCO clients
- Family portal access may require specific authorization forms

## Database Migration Status

✅ **Migration Created**: `20251105000000_family_engagement_platform.ts`

**Tables Created**:
- `family_members` - Core family member records
- `family_users` - Portal authentication
- `family_notifications` - Multi-channel notifications
- `family_messages` - Two-way messaging
- `family_consents` - Consent tracking

**Indexes Created**: Yes (on foreign keys, status, dates)

**Migration Status**: ✅ Ready to run (but code won't work until Phase 1 complete)

## Feature Completeness Assessment

### ✅ Complete
- Database schema design
- Type definitions (comprehensive TypeScript types)
- Migration file (properly structured)
- Documentation (README with usage examples)
- Package configuration (ESM, build scripts, dependencies)

### ⚠️ Incomplete (Blocked by Database API Issues)
- Repository implementations (use non-existent getKnex())
- Service layer (depends on repositories)
- API endpoints (not yet created)
- Tests (not yet written)

### 📋 Planned
- Frontend family portal UI
- Real-time notification delivery
- Email/SMS integration
- Push notification support
- Mobile app family features

## Alternative Approach: Temporary Mocks

If immediate testing is needed before refactor:

```typescript
// Add to Database class temporarily:
class Database {
  // Existing methods...
  
  getKnex() {
    // WARNING: Temporary mock for development only
    throw new Error('getKnex() is not implemented - use raw SQL with database.query()');
  }
}
```

This would make the error explicit rather than cryptic.

## Recommendation

**Do NOT merge to `main` or `preview` until Phase 1 is complete.**

The current implementation will cause immediate runtime failures when:
- Any repository method is called
- Services attempt to query the database
- API endpoints (when added) are invoked

## Questions for Product/Engineering Leadership

1. **Priority**: Is family engagement a near-term launch requirement?
2. **Resources**: Can we allocate dedicated time for the repository refactor?
3. **Dependencies**: Are there other features blocked on family engagement?
4. **Timeline**: What's the acceptable delivery date for working family portal?

## Impact Assessment

**If Deployed As-Is**:
- ❌ 100% of family engagement features will fail
- ❌ Runtime errors on all family member lookups
- ❌ Notifications cannot be created or delivered
- ❌ Messages cannot be sent or retrieved
- ❌ Family portal will be completely non-functional

**After Phase 1 Completion**:
- ✅ Repository layer will work correctly
- ✅ Services can interact with database
- ✅ API endpoints can be built and tested
- ✅ Foundation ready for frontend integration

---

**Last Updated**: 2024-11-05  
**Severity**: CRITICAL - Blocks all family engagement features  
**Estimated Fix Time**: 2-3 days (Phase 1) + 1-2 days (Phase 2) + 1-2 days (Phase 3)  
**Reviewers Needed**: Backend Lead, Database Architect, Compliance Officer
