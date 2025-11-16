# Organization Scoping & Multi-Tenancy Security

**CRITICAL SECURITY DOCUMENT**

This document describes the multi-layered security architecture implemented to ensure complete organization-level data isolation in Care Commons.

## Security Threat Model

### Primary Threat: Cross-Organization Data Leaks

In a multi-tenant SaaS application, the most critical security threat is **cross-organization data access**. This can occur through:

1. **Query Parameter Injection**: Malicious users modifying `organizationId` in query parameters
2. **Request Body Tampering**: Changing `organizationId` in POST/PUT/PATCH requests
3. **Missing Authorization Checks**: Routes that don't validate organization membership
4. **SQL Injection**: Bypassing application-level filters via SQL injection
5. **Direct Database Access**: Compromised credentials or SQL injection allowing direct DB queries
6. **Broken Authentication**: Expired or compromised JWT tokens
7. **Session Hijacking**: Stealing active user sessions

### Defense-in-Depth Strategy

We implement **THREE LAYERS** of defense:

```
┌─────────────────────────────────────────┐
│  Layer 1: Middleware (Application)      │  ← Request validation & context
├─────────────────────────────────────────┤
│  Layer 2: Scoped Queries (Application)  │  ← Automatic org_id filtering
├─────────────────────────────────────────┤
│  Layer 3: RLS Policies (Database)       │  ← PostgreSQL enforcement
└─────────────────────────────────────────┘
```

Even if **TWO layers** fail, the third layer prevents data leaks.

---

## Layer 1: Middleware Authentication & Authorization

### JWT Token Payload

All authenticated requests include a JWT token with:

```typescript
interface TokenPayload {
  userId: UUID;
  email: string;
  organizationId: UUID;  // ← CRITICAL: User's organization
  branchIds: UUID[];
  roles: string[];
  permissions: string[];
  tokenVersion: number;
}
```

### Middleware Stack

#### 1. `requireAuth` - JWT Validation

```typescript
router.use(authMiddleware.requireAuth);
```

**Purpose**: Validates JWT token and attaches user context to `req.user`.

**Enforces**:
- Token signature is valid
- Token has not expired
- User account still exists and is active
- Token version matches (not revoked)

**On Failure**: Returns `401 Unauthorized`

#### 2. `enforceOrganizationScoping` - Organization Context

```typescript
router.use(authMiddleware.enforceOrganizationScoping);
```

**Purpose**: Prevents query parameter and request body tampering.

**Enforces**:
- Query parameter `organizationId` matches JWT `organizationId`
- Request body `organizationId` matches JWT `organizationId`
- Forces `organizationId` in request body to match authenticated user

**On Failure**: Returns `403 Forbidden` and logs unauthorized attempt

#### 3. `requireSameOrganization` - Route Parameter Validation

```typescript
router.get('/organizations/:id', 
  authMiddleware.requireAuth,
  authMiddleware.requireSameOrganization('id'),
  handler
);
```

**Purpose**: Validates organization ID in URL path matches user's organization.

**On Failure**: Returns `403 Forbidden` and logs cross-org access attempt

### Usage Example

```typescript
import { AuthMiddleware } from '@care-commons/core';

const authMiddleware = new AuthMiddleware(db);

// All routes require authentication
router.use(authMiddleware.requireAuth);

// Enforce organization scoping on all routes
router.use(authMiddleware.enforceOrganizationScoping);

// Specific route with role-based access
router.post('/caregivers',
  authMiddleware.requireRole(['ORG_ADMIN', 'SUPERVISOR']),
  createCaregiverHandler
);

// Route accessing different org's resources
router.get('/organizations/:id/invitations',
  authMiddleware.requireSameOrganization('id'),
  getInvitationsHandler
);
```

---

## Layer 2: Scoped Database Queries

### Automatic Organization Filtering

All database operations MUST use scoped query helpers that automatically inject `organization_id` filters.

### Available Helpers

#### `scopedSelect` - Filtered SELECT

```typescript
import { scopedSelect } from '@care-commons/core';

const context = {
  organizationId: req.user.organizationId,
  userId: req.user.userId
};

const result = await scopedSelect(
  db,
  context,
  'SELECT * FROM clients WHERE status = $1',
  ['ACTIVE']
);
// Automatically adds: AND organization_id = $2
```

**SECURITY**: Appends `AND organization_id = <context.organizationId>` to all queries.

#### `scopedInsert` - Organization-Scoped INSERT

```typescript
import { scopedInsert } from '@care-commons/core';

await scopedInsert(
  db,
  context,
  'clients',
  {
    client_number: 'C001',
    first_name: 'John',
    last_name: 'Doe',
    // ... other fields
  }
);
// Automatically sets:
// - organization_id = context.organizationId
// - created_by = context.userId
// - updated_by = context.userId
```

**SECURITY**: Forces `organization_id` to match authenticated user, prevents tampering.

#### `scopedUpdate` - Organization-Scoped UPDATE

```typescript
import { scopedUpdate } from '@care-commons/core';

await scopedUpdate(
  db,
  context,
  'clients',
  { status: 'INACTIVE' },
  'id = $1',
  [clientId]
);
// Automatically adds: AND organization_id = <context.organizationId>
```

**SECURITY**: Only updates records belonging to user's organization.

#### `scopedDelete` - Organization-Scoped Soft Delete

```typescript
import { scopedDelete } from '@care-commons/core';

await scopedDelete(
  db,
  context,
  'clients',
  'id = $1',
  [clientId]
);
// Sets deleted_at and deleted_by only for user's org
```

**SECURITY**: Only soft-deletes records in user's organization.

#### `validateOrganizationOwnership` - Pre-Operation Check

```typescript
import { validateOrganizationOwnership } from '@care-commons/core';

// Before performing operation on a resource
await validateOrganizationOwnership(
  db,
  context,
  'clients',
  clientId
);
// Throws error if client belongs to different organization
```

**SECURITY**: Validates resource ownership before performing operations.

### ScopedDatabase - Transaction Support

For complex multi-query operations:

```typescript
import { createScopedDatabase } from '@care-commons/core';

const scopedDb = createScopedDatabase(db, {
  organizationId: req.user.organizationId,
  userId: req.user.userId
});

// All queries automatically scoped via RLS
await scopedDb.transaction(async (client) => {
  await client.query('INSERT INTO ...', [...]); // Scoped
  await client.query('UPDATE ...', [...]); // Scoped
  await client.query('DELETE FROM ...', [...]); // Scoped
});
```

---

## Layer 3: Row-Level Security (RLS) Policies

### PostgreSQL RLS Overview

RLS provides **database-level enforcement** of multi-tenancy, even if application code is bypassed.

### Setup Instructions

#### Step 1: Run RLS Migration

```bash
psql -d care_commons_production -f scripts/migrations/001_enable_rls_policies.sql
```

This creates:
- RLS policies on all data tables
- Helper functions for organization context
- Super admin bypass capability

#### Step 2: Set Organization Context

At the start of each database transaction:

```typescript
await db.query(
  'SET LOCAL app.current_organization_id = $1',
  [organizationId]
);
```

The `ScopedDatabase` class handles this automatically.

#### Step 3: Verify RLS Enforcement

Test that RLS prevents cross-org access:

```sql
-- Set org context
SET LOCAL app.current_organization_id = '<org1-uuid>';

-- Should return only org1's clients
SELECT * FROM clients;

-- Should return 0 rows (different org)
SELECT * FROM clients WHERE organization_id = '<org2-uuid>';
```

### RLS Policy Structure

All tables have policies like:

```sql
CREATE POLICY org_isolation_policy ON clients
  FOR ALL
  USING (
    organization_id = app_get_current_organization_id()
    OR app_is_super_admin()
  );
```

**What this does**:
- Filters ALL queries (SELECT, INSERT, UPDATE, DELETE)
- Only shows rows where `organization_id` matches session variable
- Allows super admins to bypass for administrative operations

### Super Admin Access

For legitimate cross-org administrative operations:

```typescript
// Set super admin flag
await db.query('SET LOCAL app.is_super_admin = $1', ['true']);

// Now can access all organizations
const allClients = await db.query('SELECT * FROM clients');
```

**WARNING**: Use super admin access VERY sparingly and only for:
- System administration
- Cross-organization reports
- Data migrations
- Support operations

**ALWAYS** audit super admin operations.

---

## Audit Logging

All authorization failures are automatically logged to the audit trail:

### Logged Events

1. **Cross-Org Access Attempts**
   - Event: `CROSS_ORG_ACCESS_ATTEMPT`
   - Includes: Requested org ID, user org ID, IP address, user agent

2. **Query Parameter Tampering**
   - Event: `ORG_ID_OVERRIDE_ATTEMPT_QUERY`
   - Includes: Tampered value, actual org ID

3. **Request Body Tampering**
   - Event: `ORG_ID_OVERRIDE_ATTEMPT_BODY`
   - Includes: Tampered value, actual org ID

4. **Role/Permission Violations**
   - Event: `UNAUTHORIZED_ACCESS_ATTEMPT`
   - Includes: Required permissions, user permissions

### Viewing Audit Logs

```sql
SELECT * FROM audit_logs 
WHERE event_type = 'CROSS_ORG_ACCESS_ATTEMPT'
ORDER BY created_at DESC
LIMIT 100;
```

---

## Testing Organization Isolation

### Integration Tests

Run the organization isolation test suite:

```bash
cd packages/core
npm run test:security
```

Tests verify:
- ✅ Scoped SELECT only returns user's organization data
- ✅ Cross-org query attempts return 0 rows
- ✅ Scoped INSERT forces correct organization_id
- ✅ Organization ID tampering is prevented
- ✅ Scoped UPDATE only affects user's org
- ✅ Scoped DELETE only soft-deletes user's org records
- ✅ Validation rejects cross-org resource access

### Manual Testing

#### Test 1: Query Parameter Tampering

```bash
# Authenticate as user in org1
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@org1.com","password":"password"}' \
  | jq -r '.accessToken')

# Attempt to access org2's data via query parameter
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/clients?organizationId=<org2-id>"

# Expected: 403 Forbidden
# Audit log: ORG_ID_OVERRIDE_ATTEMPT_QUERY
```

#### Test 2: Request Body Tampering

```bash
# Attempt to create resource in different org
curl -X POST http://localhost:3001/api/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"organizationId":"<org2-id>","firstName":"John","lastName":"Doe",...}'

# Expected: 403 Forbidden OR resource created with org1-id
# Audit log: ORG_ID_OVERRIDE_ATTEMPT_BODY
```

#### Test 3: Direct Database Access

```bash
# Connect to database as application user
psql -d care_commons_production -U app_user

# Set org context
SET LOCAL app.current_organization_id = '<org1-id>';

# Try to access org2's data
SELECT * FROM clients WHERE organization_id = '<org2-id>';

# Expected: 0 rows (RLS blocks)
```

---

## Migration Guide for Existing Routes

### Before (Vulnerable)

```typescript
// ❌ VULNERABLE: Accepts organizationId from query
router.get('/clients', async (req, res) => {
  const orgId = req.query.organizationId as string;
  const clients = await db.query(
    'SELECT * FROM clients WHERE organization_id = $1',
    [orgId]
  );
  res.json(clients);
});
```

**Vulnerability**: Malicious user can set `?organizationId=<other-org-id>` to access different org's data.

### After (Secure)

```typescript
// ✅ SECURE: Enforces organization scoping
router.get('/clients',
  authMiddleware.requireAuth,
  authMiddleware.enforceOrganizationScoping,
  async (req, res) => {
    const context = {
      organizationId: req.user.organizationId,
      userId: req.user.userId
    };
    
    const clients = await scopedSelect(
      db,
      context,
      'SELECT * FROM clients WHERE 1=1',
      []
    );
    
    res.json(clients);
  }
);
```

**Protection**:
1. Middleware validates JWT and extracts `organizationId`
2. Middleware blocks query parameter tampering
3. Scoped query automatically filters by `organization_id`
4. RLS enforces at database level

---

## Security Checklist

### For New Routes

- [ ] All routes use `authMiddleware.requireAuth`
- [ ] All routes use `authMiddleware.enforceOrganizationScoping`
- [ ] Routes with org ID in path use `requireSameOrganization()`
- [ ] All database queries use scoped query helpers
- [ ] Context is extracted from `req.user`, never from request params/body
- [ ] Sensitive operations have role/permission checks

### For New Database Tables

- [ ] Table has `organization_id UUID NOT NULL` column
- [ ] Table has index on `organization_id`
- [ ] RLS policy created for table
- [ ] RLS policy tested with cross-org access attempts

### For Production Deployment

- [ ] RLS migration applied to production database
- [ ] RLS policies tested in staging environment
- [ ] Audit logging configured and monitored
- [ ] Security integration tests passing
- [ ] Performance impact of RLS assessed
- [ ] Super admin access restricted to authorized users

---

## Performance Considerations

### Indexes

Ensure all tables have indexes on `organization_id`:

```sql
CREATE INDEX idx_clients_organization_id ON clients(organization_id);
CREATE INDEX idx_caregivers_organization_id ON caregivers(organization_id);
-- Add for all multi-tenant tables
```

### Query Performance

RLS policies add a `WHERE` clause to every query. With proper indexes, performance impact is minimal (<5%).

Monitor slow queries:

```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%organization_id%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Connection Pooling

Session variables (`app.current_organization_id`) are LOCAL to the transaction. Connection pooling works normally.

---

## Incident Response

### Suspected Data Leak

1. **Immediate Actions**:
   - Review audit logs for `CROSS_ORG_ACCESS_ATTEMPT` events
   - Identify affected organizations and users
   - Revoke tokens for compromised accounts (increment `token_version`)

2. **Investigation**:
   - Check application logs for unusual access patterns
   - Review database query logs
   - Verify RLS policies are active: `SELECT * FROM pg_policies;`

3. **Remediation**:
   - Fix vulnerable routes
   - Deploy patched version
   - Force re-authentication for all users
   - Notify affected organizations per HIPAA Breach Notification Rule

### RLS Policy Violation

If RLS is bypassed:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';

-- Re-enable RLS
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = '<table_name>';
```

---

## Compliance & Regulations

### HIPAA Security Rule

This implementation satisfies:
- **164.308(a)(3)**: Workforce Security - Role-based access control
- **164.308(a)(4)**: Access Authorization - Organization-level isolation
- **164.312(a)(1)**: Access Control - Technical safeguards
- **164.312(d)**: Audit Controls - Comprehensive audit logging

### State Regulations

**Texas HHSC 26 TAC §558**:
- ✅ Data isolation between agencies
- ✅ Audit trail for data access

**Florida AHCA Chapter 59A-8**:
- ✅ Organization-level data segregation
- ✅ Secure access controls

---

## Additional Resources

- [PostgreSQL Row-Level Security Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP: Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)

---

**Last Updated**: November 2025  
**Owned By**: Engineering Team  
**Review Frequency**: Quarterly  
**Next Review**: February 2026
