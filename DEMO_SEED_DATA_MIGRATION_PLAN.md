# Demo Seed Data Migration Plan

**Goal**: Move demo data seeding from destructive `npm run seed` script to Knex migrations for SaaS production environments where database cannot be nuked.

---

## Current State

### Existing Script: `packages/core/scripts/seed-demo.ts`

**Problem**: Destructive approach
- Truncates all tables with `TRUNCATE TABLE ... CASCADE`
- Seeds 60 clients, 35 caregivers, 600+ visits, 50 care plans, 40 family members
- Cannot run in production SaaS - would destroy customer data
- Only suitable for development environments

**Current Usage**:
```bash
npm run db:seed        # Creates org, branch, admin (safe)
npm run db:seed:demo   # DESTROYS all data, reseeds demo (destructive)
```

**Seed Data**:
- Texas-specific: 5 cities (Austin, Houston, Dallas, San Antonio, Fort Worth)
- Culturally diverse names (40% Hispanic reflecting Texas demographics)
- Age-appropriate medical conditions (65-95 years old)
- Geographic clustering (Austin clients → Austin caregivers)
- Realistic EVV compliance (90% with geofence warnings, missed clock-outs)
- Comprehensive: clients, caregivers, visits, care plans, family members, billing

---

## Target State

### Idempotent Migration Approach

**Goal**: Safe demo data initialization that:
1. ✅ Can run in production without destroying existing data
2. ✅ Creates demo organization separate from customer orgs
3. ✅ Idempotent - can re-run without errors
4. ✅ Preserves development workflow (fast local seeding)

**Strategy**: Two-tier approach
- **Migrations**: Production-safe demo org creation
- **Dev Script**: Fast destructive seeding for local development (keep existing)

---

## Implementation Plan

### Phase 1: Create Demo Organization Migration ✅ (HIGH PRIORITY)

**File**: `packages/core/migrations/20251120000000_seed_demo_organization.ts`

**Purpose**: Create a demo organization with basic infrastructure

**What it creates**:
- 1 demo organization: "Care Commons Demo (Texas)"
- 1 demo branch: "Austin Central Office"
- 5 demo personas (matching Login.tsx):
  - admin@tx.carecommons.example (Administrator)
  - coordinator@tx.carecommons.example (Care Coordinator)
  - caregiver@tx.carecommons.example (Caregiver)
  - nurse@tx.carecommons.example (RN Clinical)
  - family@tx.carecommons.example (Family Member)

**Idempotency**: Check if demo org exists before creating
```sql
SELECT id FROM organizations WHERE name = 'Care Commons Demo (Texas)';
```

**No data destruction**: Uses `INSERT ... ON CONFLICT DO NOTHING`

---

### Phase 2: Seed Demo Clients Migration (MEDIUM PRIORITY)

**File**: `packages/core/migrations/20251120000001_seed_demo_clients.ts`

**Purpose**: Create realistic client data for demo

**What it creates**:
- 60 Texas-based clients across 5 cities
- Realistic demographics (ages 65-95)
- Age-appropriate medical conditions
- Texas addresses with accurate zip codes
- Emergency contacts
- Service authorizations

**Idempotency**: 
```sql
SELECT COUNT(*) FROM clients WHERE organization_id = (
  SELECT id FROM organizations WHERE name = 'Care Commons Demo (Texas)'
);
-- Only seed if count = 0
```

**Data Scope**: ~60 clients (manageable migration size)

---

### Phase 3: Seed Demo Caregivers Migration (MEDIUM PRIORITY)

**File**: `packages/core/migrations/20251120000002_seed_demo_caregivers.ts`

**Purpose**: Create caregiver staff for demo

**What it creates**:
- 35 caregivers across Texas cities
- Credentials (CNA, HHA, companion)
- Bilingual capabilities (Spanish/English)
- Geographic distribution matching client locations
- Background screening records
- Training certifications

**Idempotency**: Check if demo caregivers exist

**Data Scope**: ~35 caregivers

---

### Phase 4: Seed Demo Visits & EVV Migration (LOW PRIORITY)

**File**: `packages/core/migrations/20251120000003_seed_demo_visits.ts`

**Purpose**: Create visit history for demo

**What it creates**:
- 600+ visits (past 90 days)
- EVV records with realistic compliance (90%)
- Geofence data (GPS coordinates)
- Clock-in/out timestamps
- Visit notes and signatures
- Realistic EVV issues (geofence warnings, missed clock-outs)

**Idempotency**: Check if demo visits exist

**Data Scope**: ~600 visits (larger migration, may need batching)

**Consideration**: This is the largest dataset - may want to reduce for production or create on-demand

---

### Phase 5: Seed Demo Care Plans Migration (LOW PRIORITY)

**File**: `packages/core/migrations/20251120000004_seed_demo_care_plans.ts`

**Purpose**: Create care plans and tasks

**What it creates**:
- 50 care plans
- Care plan goals
- Task definitions
- Task instances (linked to visits)
- Progress notes

**Idempotency**: Check if demo care plans exist

**Data Scope**: ~50 care plans + associated data

---

### Phase 6: Seed Demo Family Members Migration (LOW PRIORITY)

**File**: `packages/core/migrations/20251120000005_seed_demo_family_members.ts`

**Purpose**: Create family portal access

**What it creates**:
- 40 family members
- Portal access permissions
- Family relationships to clients
- Notification preferences
- Message threads

**Idempotency**: Check if demo family members exist

**Data Scope**: ~40 family members

---

## Migration Implementation Details

### Template Structure

Each migration follows this pattern:

```typescript
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Check if demo org exists
  const demoOrg = await knex('organizations')
    .where('name', 'Care Commons Demo (Texas)')
    .first();
  
  if (!demoOrg) {
    // Create demo org first (or skip if Phase 1 not run)
    return;
  }
  
  // 2. Check if data already exists
  const existingCount = await knex('clients')
    .where('organization_id', demoOrg.id)
    .count('* as count');
  
  if (Number(existingCount[0].count) > 0) {
    console.log('Demo clients already exist, skipping...');
    return;
  }
  
  // 3. Insert data in transaction
  await knex.transaction(async (trx) => {
    const clients = generateDemoClients(demoOrg.id);
    await trx('clients').insert(clients);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove demo data (only for demo org)
  const demoOrg = await knex('organizations')
    .where('name', 'Care Commons Demo (Texas)')
    .first();
  
  if (demoOrg) {
    await knex('clients')
      .where('organization_id', demoOrg.id)
      .delete();
  }
}
```

### Helper Functions

Extract from `seed-demo.ts` and make reusable:
- `generateDemoClients(orgId: string)` - Client data generation
- `generateDemoCaregivers(orgId: string)` - Caregiver data generation
- `generateDemoVisits(clientIds: string[], caregiverIds: string[])` - Visit generation
- Date helpers: `daysAgo()`, `daysFromNow()`, `today()`

Create shared module: `packages/core/src/db/demo-data-generators.ts`

---

## Development Workflow

### Option 1: Keep Existing Dev Script (RECOMMENDED)

**For local development**:
```bash
npm run db:reset         # Drop all tables
npm run db:migrate       # Run migrations (includes demo org)
npm run db:seed:demo     # Fast destructive seed (60 clients, 600 visits)
```

**Pros**:
- Fast iteration for developers
- No change to existing workflow
- Can easily nuke and reseed

**Cons**:
- Two separate codebases (migration + script)
- Must keep in sync

### Option 2: Migration-Only (PURIST)

**For local development**:
```bash
npm run db:reset         # Drop all tables
npm run db:migrate       # Run all migrations including demo data
```

**Pros**:
- Single source of truth
- What you develop is what runs in production

**Cons**:
- Slower (migrations are verbose)
- Cannot easily re-seed without rollback

**Recommendation**: **Option 1** - Keep dev script for speed, add migrations for production safety

---

## Production Deployment Strategy

### Initial Production Setup

**One-time**: Run migrations to create demo org
```bash
npm run db:migrate
```

This creates:
- Demo organization
- Demo personas (5 users)
- Demo clients (60)
- Demo caregivers (35)
- Demo visits (600) - OPTIONAL, may skip for production
- Demo care plans (50)
- Demo family members (40)

### Post-Production Considerations

**Do we want demo data in production?**

**YES** (Recommended for SaaS):
- Provides onboarding experience
- Users can explore before creating real data
- Demo org isolated from customer orgs
- Clearly labeled "DEMO" in UI

**NO** (Skip migrations):
- Production is for real customers only
- Demo data adds database bloat
- Use staging environment for demos

**Decision Point**: Should we create demo org in production?

---

## File Changes Required

### New Files

**Migrations** (6 files):
1. `packages/core/migrations/20251120000000_seed_demo_organization.ts`
2. `packages/core/migrations/20251120000001_seed_demo_clients.ts`
3. `packages/core/migrations/20251120000002_seed_demo_caregivers.ts`
4. `packages/core/migrations/20251120000003_seed_demo_visits.ts` (OPTIONAL)
5. `packages/core/migrations/20251120000004_seed_demo_care_plans.ts`
6. `packages/core/migrations/20251120000005_seed_demo_family_members.ts`

**Helper Module**:
- `packages/core/src/db/demo-data-generators.ts` - Extracted data generation functions

### Modified Files

**Keep unchanged** (Option 1 - Recommended):
- `packages/core/scripts/seed-demo.ts` - Dev-only fast seeding

**OR Update** (Option 2 - Purist):
- `packages/core/scripts/seed-demo.ts` - Remove, replace with migration-only

**Documentation**:
- `README.md` - Update with migration approach
- `SEEDING.md` - Document production vs. development seeding

---

## Timeline & Effort Estimate

### Phase 1: Demo Organization (HIGH PRIORITY) ⏱️ 2-3 hours
- Create migration for demo org, branch, users
- Test idempotency
- Update documentation

### Phase 2-6: Demo Data (MEDIUM/LOW PRIORITY) ⏱️ 8-12 hours
- Extract data generators from seed-demo.ts
- Create 5 migrations
- Test each migration independently
- Test full migration sequence
- Test rollback (down migrations)

### Total Effort: **10-15 hours** (can be broken into smaller PRs)

---

## Testing Strategy

### Local Testing

**Test idempotency**:
```bash
npm run db:migrate        # Run migrations
npm run db:migrate        # Run again - should skip existing data
```

**Test rollback**:
```bash
npm run db:rollback       # Roll back last migration
npm run db:migrate        # Re-run - should succeed
```

**Test data integrity**:
- Verify foreign key relationships
- Check data quality (no nulls where required)
- Verify geographic clustering (Austin clients → Austin caregivers)

### Production Testing (Staging)

**Deploy to staging environment**:
1. Run migrations on fresh database
2. Verify demo org created
3. Login with demo personas
4. Test UI with demo data
5. Verify performance (600 visits query time)

### Rollback Plan

If migrations fail in production:
```bash
npm run db:rollback       # Roll back failed migration
# Fix migration
npm run db:migrate        # Re-apply
```

---

## Recommendations

### Immediate Actions (This Week)

1. ✅ **Approve this plan** - Review with team
2. ✅ **Phase 1 Implementation** - Demo org migration (HIGH PRIORITY)
3. ✅ **Test locally** - Verify idempotency and rollback

### Next Sprint

4. **Phase 2-3 Implementation** - Clients and caregivers (MEDIUM PRIORITY)
5. **Test on staging** - Deploy to preview environment
6. **Update documentation** - README, SEEDING.md

### Future (Backlog)

7. **Phase 4-6 Implementation** - Visits, care plans, family (LOW PRIORITY)
8. **Production decision** - Do we want demo data in production?
9. **UI enhancements** - Mark demo org clearly in UI ("DEMO MODE" badge)

---

## Open Questions

1. **Should production have demo data?**
   - Recommendation: YES for SaaS onboarding
   - Can be disabled via feature flag

2. **How many visits in production demo?**
   - 600 visits = realistic but larger migration
   - Alternative: 100 visits = faster migration
   - Alternative: On-demand generation via API

3. **Should we keep dev script?**
   - Recommendation: YES (Option 1) - faster developer workflow
   - Must keep in sync with migrations

4. **Migration rollback strategy?**
   - Should `down()` delete demo data?
   - Recommendation: YES for demo org only (safe)

5. **Feature flag for demo mode?**
   - Allow admins to disable demo org visibility
   - Recommendation: Add to white-label config

---

## Conclusion

**Recommended Approach**:
- **Phase 1 now**: Demo org migration (HIGH PRIORITY)
- **Phase 2-3 soon**: Clients & caregivers (MEDIUM PRIORITY)
- **Phase 4-6 later**: Visits, care plans, family (LOW PRIORITY - can skip)
- **Keep dev script**: Fast local development (Option 1)
- **Production decision**: YES to demo data for onboarding

**Benefits**:
- ✅ Production-safe (no data destruction)
- ✅ SaaS-ready (idempotent migrations)
- ✅ Developer-friendly (keep fast dev script)
- ✅ Isolated (demo org separate from customers)
- ✅ Rollback-capable (down migrations)

**Next Step**: Approve plan and implement Phase 1 (demo org migration)
