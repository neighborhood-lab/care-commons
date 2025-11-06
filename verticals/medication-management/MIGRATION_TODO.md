# Medication Management - Migration TODO

This vertical has been scaffolded but requires database layer implementation to be fully functional.

## Current Status

✅ **Complete:**
- Package structure and configuration
- TypeScript types and interfaces
- Validation schemas (Zod)
- Service layer business logic
- API handlers and routes
- Utility functions
- Database schema (PostgreSQL SQL)
- Documentation (README.md)

⚠️ **Incomplete:**
- Repository layer implementation (uses SQLite-style API instead of PostgreSQL)
- Route integration (commented out in `packages/app/src/routes/index.ts`)
- Database migration execution

## Next Steps

### 1. Update Repository to Use PostgreSQL

The current `MedicationRepository` uses SQLite-style methods (`db.get()`, `db.all()`, `db.run()`), but the Care Commons platform uses PostgreSQL with the `db.query()` method.

**Option A: Use Base Repository Class (Recommended)**

Follow the pattern from `client-demographics` and extend the `Repository` base class:

```typescript
import { Repository } from '@care-commons/core';

export class MedicationRepository extends Repository<Medication> {
  constructor(database: Database) {
    super({
      tableName: 'medications',
      database,
      enableAudit: true,
      enableSoftDelete: false,
    });
  }

  // Implement custom query methods as needed
}
```

**Option B: Rewrite with Raw PostgreSQL Queries**

Update all repository methods to use `this.db.query()` with PostgreSQL syntax:

```typescript
async getMedicationById(id: string): Promise<Medication | null> {
  const result = await this.db.query<Medication>(
    'SELECT * FROM medications WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}
```

### 2. Run Database Migration

Execute the SQL schema from `SCHEMA.sql`:

```bash
psql -d care_commons -f verticals/medication-management/SCHEMA.sql
```

Or integrate into your migration system.

### 3. Enable Routes

Uncomment the medication routes in `packages/app/src/routes/index.ts`:

```typescript
// Remove the comment markers from:
import { createMedicationRouter, MedicationService, MedicationRepository } from '@care-commons/medication-management';

// And:
const medicationRepository = new MedicationRepository(db);
const medicationService = new MedicationService(medicationRepository);
const medicationRouter = createMedicationRouter(medicationService);
app.use('/api', medicationRouter);
console.log('  ✓ Medication Management routes registered');
```

### 4. Add Authentication Middleware

Update the medication router to use the app's authentication middleware:

In `packages/app/src/routes/medications.ts` (create this file):

```typescript
import { Router } from 'express';
import { Database } from '@care-commons/core';
import { requireAuth } from '../middleware/auth-context.js';
import { MedicationRepository, MedicationService, createMedicationRouter } from '@care-commons/medication-management';

export function createMedicationRoutes(db: Database): Router {
  const repository = new MedicationRepository(db);
  const service = new MedicationService(repository);
  const router = createMedicationRouter(service);

  // Apply authentication to all routes
  router.use(requireAuth);

  return router;
}
```

### 5. Testing

Once the repository is implemented:

1. Build the vertical: `npm run build`
2. Run tests: `npm test`
3. Test API endpoints manually or with integration tests
4. Verify database operations work correctly

## Database Schema Notes

The PostgreSQL schema includes:

- **medications** - Medication records with full prescription details
- **medication_administrations** - Administration log entries
- **medication_allergies** - Client allergy records
- **Views** - Useful summaries (adherence, active meds, etc.)
- **Triggers** - Automatic updated_at timestamps

## API Endpoints

Once enabled, the following endpoints will be available:

**Medications:**
- `GET /api/medications` - Search medications
- `GET /api/medications/:id` - Get medication details
- `POST /api/medications` - Create medication
- `PATCH /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Discontinue medication
- `GET /api/clients/:clientId/medications` - Get client medications

**Administrations:**
- `GET /api/medication-administrations` - Search administration logs
- `POST /api/medication-administrations` - Record administration
- `GET /api/medication-administrations/report` - Get adherence report

**Allergies:**
- `GET /api/medication-allergies` - Search allergies
- `POST /api/medication-allergies` - Create allergy
- `PATCH /api/medication-allergies/:id` - Update allergy
- `GET /api/clients/:clientId/medication-allergies` - Get client allergies

## Dependencies

The vertical depends on:
- `@care-commons/core` - Core platform types and utilities
- `@care-commons/client-demographics` - Client records
- `@care-commons/caregiver-staff` - Caregiver administration tracking

## Reference Implementation

For reference on PostgreSQL repository implementation, see:
- `verticals/client-demographics/src/repository/client-repository.ts`
- `verticals/care-plans-tasks/src/repository/care-plan-repository.ts`

These show the proper pattern for extending the `Repository` base class and implementing custom queries.
