# Database Quick Start

## Three-Layer Database Setup

Care Commons uses a clean separation between schema, operational data, and demo data:

### 1️⃣ Schema (DDL) - `npm run db:migrate`

**Pure Data Definition Language - no data inserts**

Creates all database objects:
- ✅ Tables (organizations, users, clients, caregivers, visits, etc.)
- ✅ Indexes (performance optimization)
- ✅ Functions (business logic)
- ✅ Extensions (UUID, pgcrypto)
- ✅ Triggers (audit trails, updated_at)

```bash
npm run db:migrate
```

**Safe to run multiple times** - Knex tracks which migrations have been applied.

---

### 2️⃣ Operational Data - `npm run db:seed`

**Minimal data required for ANY installation (all US states)**

Creates only:
- ✅ 1 Organization (template)
- ✅ 1 Branch (template)
- ✅ 1 Admin User
  - Email: `admin@carecommons.example`
  - Password: `Admin123!`
  - Role: `SUPER_ADMIN`

```bash
npm run db:seed
```

**That's it!** Customer organizations add their own:
- Clients
- Caregivers
- Programs
- Schedules
- Care plans

---

### 3️⃣ Demo Data - `npm run db:seed:demo`

**Sample data for development and testing ONLY**

Creates:
- ✅ 1 Sample Program (Personal Care Services)
- ✅ 5 Sample Clients
  - Margaret Thompson (Active, fall risk)
  - Robert Martinez (Active, veteran, wheelchair)
  - Dorothy Williams (Pending intake)
  - George Patterson (On hold)
  - Eleanor Rodriguez (Inquiry)
- ✅ 5 Sample Caregivers
  - Sarah Johnson (Senior CNA, 5 years exp)
  - Michael Chen (New CNA, onboarding)
  - Maria Garcia (Companion, bilingual Spanish)
  - Jennifer Williams (HHA, credentials expiring)
  - James Robinson (Per diem, weekends only)

```bash
npm run db:seed:demo
```

**Prerequisite**: Must run `db:seed` first (uses existing org/branch/admin).

---

## Quick Commands

### Production/Customer Installation
```bash
npm run db:migrate   # Schema
npm run db:seed      # Operational data
# Done! Customer adds their data
```

### Development Setup
```bash
npm run db:reset:demo   # Complete setup with demo data
# or step-by-step:
npm run db:nuke         # Drop everything
npm run db:migrate      # Create schema
npm run db:seed         # Add operational data
npm run db:seed:demo    # Add demo data
```

### Other Useful Commands
```bash
npm run db:migrate:status     # Check which migrations have run
npm run db:migrate:rollback   # Undo last migration
npm run db:reset              # Nuke → Migrate → Seed (no demo)
```

---

## Environment Variables

### Local Development
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=develop_care_commons
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
```

### Production (Vercel/Cloud)
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
```

---

## Common Workflows

### Starting Fresh (Development)
```bash
npm run db:reset:demo
npm run dev
# Login: admin@carecommons.example / Admin123!
```

### Testing Migrations
```bash
npm run db:nuke
npm run db:migrate
# Check for errors, verify schema
```

### Adding New Migration
```bash
cd packages/core
npx knex migrate:make your_migration_name --migrations-directory migrations
# Edit the new migration file
npm run db:migrate
```

### Customer Onboarding
```bash
# On customer's server/cloud
npm run db:migrate   # Schema
npm run db:seed      # Minimal data
# Customer logs in as admin@carecommons.example
# Customer changes password
# Customer adds their organization's data
```

---

## What Goes Where?

### ✅ Migrations (DDL)
- Table definitions
- Column changes
- Indexes
- Functions/triggers
- Extensions

### ✅ db:seed (Operational Data)
- Initial org/branch/admin
- System configuration (if needed)
- **Nothing else**

### ❌ NOT in db:seed
- Sample clients
- Sample caregivers
- Sample programs
- Demo data of any kind

### ✅ db:seed:demo (Demo Data)
- Example clients/caregivers
- Sample programs
- Test schedules/visits
- State-specific examples
- **Anything for testing/showcasing**

---

## Migration Order

Migrations run in timestamp order (oldest to newest):

1. `20251029214712_create_base_tables.ts` - Foundation
2. `20251030214712_create_clients_table.ts` - Client demographics
3. `20251030214713_create_caregivers_table.ts` - Caregiver management
4. `20251030214714_scheduling_visits.ts` - Scheduling
5. `20251030214715_evv_tables.ts` - EVV (Electronic Visit Verification)
6. `20251030214716_care_plans_tables.ts` - Care plans
7. `20251030214717_shift_matching.ts` - Shift matching
8. `20251030214718_billing_invoicing.ts` - Billing
9. `20251030214719_state_specific_fields.ts` - State-specific client/caregiver fields
10. `20251030214720_state_specific_evv.ts` - State EVV rules
11. `20251030214721_state_specific_care_plans.ts` - State care plan requirements
12. `20251030214722_payroll_processing.ts` - Payroll
13. Plus additional migrations for indexes, OAuth, mobile, etc.

---

## Troubleshooting

### Migration fails with "relation already exists"
```bash
# Database has leftover objects
npm run db:nuke        # Nuclear option - drops EVERYTHING
npm run db:migrate     # Clean slate
```

### "No organization found" when running db:seed:demo
```bash
# Must run db:seed first
npm run db:seed
npm run db:seed:demo
```

### Login fails after db:seed
```bash
# Make sure dev server restarted after seeding
# Stop server (Ctrl+C)
npm run dev
# Try login: admin@carecommons.example / Admin123!
```

### Want to change admin password
```bash
cd packages/core
ADMIN_PASSWORD="NewPassword123!" npm run db:seed
```

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
