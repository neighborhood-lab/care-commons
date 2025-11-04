# @care-commons/core

Core shared functionality for Care Commons platform including database connection, authentication, permissions, and domain types.

## Database Management

### Database Workflow

The database setup follows a three-layer approach:

#### 1. Schema (DDL) - `npm run db:migrate`
- Creates all tables, indexes, functions, and extensions
- Pure Data Definition Language (DDL) - no data inserts
- Runs all Knex migrations in timestamp order
- Idempotent - safe to run multiple times

```bash
npm run db:migrate
```

#### 2. Operational Data - `npm run db:seed`
- **Minimal data required for ANY installation** (all US states)
- Creates:
  - 1 Organization (template)
  - 1 Branch (template)
  - 1 Admin User: `admin@carecommons.example` / `Admin123!`
- Customer adds their own clients, caregivers, programs

```bash
npm run db:seed
```

#### 3. Demo Data - `npm run db:seed:demo`
- **Sample data for development and testing only**
- Creates:
  - 1 Sample Program (Personal Care Services)
  - 5 Sample Clients (Margaret, Robert, Dorothy, George, Eleanor)
  - 5 Sample Caregivers (various roles: CNA, HHA, Companion)
- Uses existing org/branch/admin from `db:seed`

```bash
npm run db:seed:demo
```

### Quick Setup Commands

**Production/Customer Installation:**
```bash
npm run db:migrate   # Schema only
npm run db:seed      # Minimal operational data
```

**Development with Demo Data:**
```bash
npm run db:reset:demo   # Nuke → Migrate → Seed → Demo (all in one)
```

**Individual Commands:**
```bash
npm run db:nuke              # Drop everything (destructive!)
npm run db:migrate           # Run migrations
npm run db:migrate:status    # Check migration status
npm run db:migrate:rollback  # Rollback last migration
npm run db:seed              # Seed operational data
npm run db:seed:demo         # Seed demo data
npm run db:reset             # Nuke → Migrate → Seed
npm run db:reset:demo        # Nuke → Migrate → Seed → Demo
```

### Migration Files

Migrations are located in `packages/core/migrations/`:

- `20251029214712_create_base_tables.ts` - Organizations, branches, users, programs
- `20251030214712_create_clients_table.ts` - Client demographics
- `20251030214713_create_caregivers_table.ts` - Caregiver management
- `20251030214714_scheduling_visits.ts` - Scheduling and visits
- `20251030214715_evv_tables.ts` - Electronic Visit Verification
- `20251030214716_care_plans_tables.ts` - Care plans and tasks
- `20251030214717_shift_matching.ts` - Shift matching
- `20251030214718_billing_invoicing.ts` - Billing and invoicing
- `20251030214719_state_specific_fields.ts` - State-specific client/caregiver fields
- `20251030214720_state_specific_evv.ts` - State-specific EVV rules
- `20251030214721_state_specific_care_plans.ts` - State-specific care plan requirements
- `20251030214722_payroll_processing.ts` - Payroll processing
- Plus additional migrations for indexes, OAuth, mobile support, etc.

### Environment Variables

Required for database connection:

```env
# Local Development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=develop_care_commons
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# Production (alternative to individual vars)
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
```

## Authentication

The core package provides JWT-based authentication with:

- Google OAuth 2.0 (primary method)
- Password authentication (fallback/demo)
- Refresh token rotation
- Account lockout after failed attempts
- HIPAA-compliant audit logging

### Password Security

Uses PBKDF2 with:
- 100,000 iterations (10x NIST minimum)
- 512-bit key length
- SHA-512 digest
- Cryptographically secure random salt
- Constant-time comparison to prevent timing attacks

## Permissions

Fine-grained, role-based permission system:

```typescript
import { PermissionService } from '@care-commons/core/permissions.js';

const permissions = new PermissionService(db);

// Check permission
const canView = await permissions.checkPermission(userId, 'clients:read');

// Get user permissions
const userPerms = await permissions.getUserPermissions(userId);

// Get user roles
const roles = await permissions.getUserRoles(userId);
```

## Types

Shared domain types and interfaces:

```typescript
import { UUID, Timestamp, Address } from '@care-commons/core/types/base.js';
import { Client, Caregiver } from '@care-commons/core/types/entities.js';
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Testing
npm run test
npm run test:coverage
```

## ESM Architecture

⚠️ **CRITICAL**: This package uses ES Modules (ESM):

- ✅ Always use `import`/`export` syntax
- ✅ Always include `.js` extensions in imports (even for `.ts` files)
- ❌ Never use `require()`/`module.exports`
- ❌ Never omit file extensions

Example:
```typescript
// ✅ CORRECT
import { Database } from './db/connection.js';

// ❌ WRONG
import { Database } from './db/connection';
const { Database } = require('./db/connection');
```

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
