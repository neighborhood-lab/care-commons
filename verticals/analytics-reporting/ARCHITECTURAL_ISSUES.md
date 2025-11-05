# Analytics & Reporting - Architectural Issues & Required Refactor

**Status**: ⚠️ **NOT PRODUCTION READY** - Requires significant architectural refactor before deployment

## Critical Issues

### 1. Database Access Layer Mismatch

**Problem**: The analytics-reporting vertical was implemented using Knex query builder, but the Care Commons codebase uses raw SQL queries via the `Database` class from `@care-commons/core`.

**Impact**:
- All repository methods in `src/repository/analytics-repository.ts` call `this.database.getConnection()` which doesn't exist
- The `Database` class only exposes: `query()`, `getClient()`, `transaction()`, `close()`, and `healthCheck()`
- Approximately 600+ lines of code need to be rewritten

**Files Affected**:
- `verticals/analytics-reporting/src/repository/analytics-repository.ts` - Every query method
- `verticals/analytics-reporting/src/service/analytics-service.ts` - Depends on repository
- `verticals/analytics-reporting/src/service/report-service.ts` - Depends on repository  
- `verticals/analytics-reporting/src/service/export-service.ts` - Depends on repository

### 2. User Context API Mismatch

**Problem**: The code references `UserContext.branchId` (singular), but the actual interface uses `UserContext.branchIds` (plural array).

**Impact**:
- Authentication/authorization checks will fail
- Branch-level filtering logic is incorrect

**Files Affected**:
- `verticals/analytics-reporting/src/service/analytics-service.ts:422` - `validateAccess()` method

### 3. Missing Package Configuration

**Problem**: The package wasn't properly configured for the workspace build system.

**Status**: ✅ **FIXED** in latest commit
- Added `build` script with `tsc && tsc-alias`
- Updated `package.json` exports to point to compiled `/dist` files
- Created `eslint.config.js`
- Updated `tsconfig.json` with tsc-alias configuration

### 4. Routes Temporarily Disabled

**Problem**: To prevent build failures, the analytics routes have been disabled in the main application.

**Files Modified**:
- `packages/app/src/routes/index.ts` - Analytics routes commented out
- `packages/app/src/routes/analytics.ts` - Renamed to `analytics.ts.disabled`

## Required Refactor Plan

### Phase 1: Repository Layer Rewrite (High Priority)

Rewrite all analytics repository methods to use raw SQL instead of Knex:

```typescript
// BEFORE (Knex - does not work):
async countVisits(...): Promise<number> {
  const query = this.database
    .getConnection()  // ❌ This method doesn't exist
    .from('schedules')
    .where('organization_id', orgId);
  const result = await query.count('* as count').first();
  return parseInt(result?.count as string) || 0;
}

// AFTER (Raw SQL - correct pattern):
async countVisits(
  orgId: string,
  dateRange: DateRange,
  statuses: string[],
  branchId?: string
): Promise<number> {
  const statusPlaceholders = statuses.map((_, i) => `$${i + 3}`).join(', ');
  const branchClause = branchId ? 'AND branch_id = $' + (statuses.length + 3) : '';
  
  const query = `
    SELECT COUNT(*) as count
    FROM schedules
    WHERE organization_id = $1
      AND start_date BETWEEN $2 AND ${statusPlaceholders}
      AND status IN (${statusPlaceholders})
      ${branchClause}
  `;
  
  const params = [orgId, dateRange.startDate, ...statuses];
  if (branchId) params.push(branchId);
  
  const result = await this.database.query(query, params);
  return parseInt(result.rows[0].count as string, 10) || 0;
}
```

**Estimated Effort**: 2-3 days for experienced developer familiar with the codebase

### Phase 2: User Context Fixes (Medium Priority)

Update all branch filtering logic to use `branchIds` array:

```typescript
// BEFORE:
private validateAccess(context: UserContext, orgId: string, branchId?: string): void {
  if (branchId && context.branchId && context.branchId !== branchId) {
    throw new Error('Unauthorized: Access denied to this branch');
  }
}

// AFTER:
private validateAccess(context: UserContext, orgId: string, branchId?: string): void {
  if (branchId && context.branchIds.length > 0 && !context.branchIds.includes(branchId)) {
    throw new Error('Unauthorized: Access denied to this branch');
  }
}
```

**Estimated Effort**: 2-4 hours

### Phase 3: Testing & Validation (High Priority)

- Write integration tests for all analytics queries
- Test with real database schema
- Validate query performance with EXPLAIN ANALYZE
- Ensure proper indexing on queried columns

**Estimated Effort**: 1-2 days

### Phase 4: Re-enable Routes (Low Priority)

Once all fixes are complete:

1. Restore `packages/app/src/routes/analytics.ts.disabled` → `analytics.ts`
2. Uncomment analytics routes in `packages/app/src/routes/index.ts`
3. Add integration tests for API endpoints
4. Update API documentation

## Compliance Considerations

### HIPAA Audit Trail Requirements

The analytics system accesses Protected Health Information (PHI). Ensure:

- All queries log user access (who accessed what data when)
- Audit trail captures filter parameters (organization_id, branch_id, date ranges)
- Failed authorization attempts are logged
- Data minimization principle applied (only query what's needed)

### State-Specific Reporting

Different states have different reporting requirements:

- **Texas**: HHSC audit trail requirements, EVV aggregator submissions
- **Florida**: AHCA reporting formats, multi-aggregator support
- **Other states**: TBD based on expansion

## Alternative Approach: Microservice

**Consideration**: Given the complexity of analytics queries and the mismatch with the main application's architecture, consider building analytics as a separate microservice:

**Pros**:
- Can use Knex or other query builder
- Independent scaling for analytics workload
- Separate deployment pipeline
- Different performance optimization strategies

**Cons**:
- Increased operational complexity
- Network latency for queries
- Data synchronization concerns
- Auth/authorization coordination

## Recommendation

**Do NOT merge to `main` or `preview` branches until Phase 1 and Phase 2 are complete.**

The current implementation will cause runtime failures when:
- Any analytics route is called
- The repository attempts to query the database
- Branch-level authorization is checked

## Questions for Product/Engineering Leadership

1. **Priority**: How critical is analytics functionality for the initial launch?
2. **Resources**: Can we allocate dedicated dev time for the refactor?
3. **Architecture**: Should analytics be a separate service or remain integrated?
4. **Timeline**: What's the acceptable timeline for having working analytics?

---

**Last Updated**: 2024-11-05  
**Reviewers Needed**: Backend Lead, Database Architect, Product Owner
