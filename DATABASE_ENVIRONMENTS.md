# Database Environment Management

This guide explains how to manage databases across multiple environments (local, preview/staging, production) using environment-specific configuration files.

## Overview

The Care Commons platform supports three database environments:

1. **Local Development** - Your local PostgreSQL instance (default)
2. **Preview/Staging** - Neon cloud database for testing before production
3. **Production** - Neon cloud database for live system

## Environment Files

Database credentials are stored in environment-specific `.env` files:

| Environment | File | Purpose |
|-------------|------|---------|
| Local Dev | `.env` | Local PostgreSQL (default) |
| Preview | `.env.preview` | Neon staging database |
| Production | `.env.production` | Neon production database |

**⚠️ IMPORTANT**: All `.env` files are gitignored. Never commit database credentials to version control!

## Setup

### 1. Local Development (Default)

Create or update `.env` in the root directory:

```bash
# Local PostgreSQL connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=care_commons
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SSL=false

NODE_ENV=development

# Add JWT secrets, encryption keys, etc.
JWT_SECRET=your_jwt_secret_here_change_in_production_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here_change_in_production_min_32_chars
ENCRYPTION_KEY=your_32_byte_encryption_key_here_change_in_production
```

### 2. Preview/Staging Environment

The `.env.preview` file has been created with the Neon staging database URL:

```bash
# .env.preview (already created)
DATABASE_URL=postgresql://neondb_owner:npg_P9wFgJXoR6cA@ep-calm-field-aexhpxvj-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NODE_ENV=staging
# ... other secrets ...
```

**⚠️ Update the JWT secrets and encryption keys** in `.env.preview` with production-grade values!

### 3. Production Environment

The `.env.production` file has been created with the Neon production database URL:

```bash
# .env.production (already created)
DATABASE_URL=postgresql://neondb_owner:npg_P9wFgJXoR6cA@ep-dawn-moon-aekgmdog-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NODE_ENV=production
# ... other secrets ...
```

**⚠️ Update the JWT secrets and encryption keys** in `.env.production` with production-grade values!

## Usage

### The `db-env.sh` Script

The main tool for managing databases across environments is `./scripts/db-env.sh`:

```bash
./scripts/db-env.sh <command> [--env=<environment>]
```

**Commands:**
- `nuke` - Drop all tables and extensions (destructive!)
- `migrate` - Run all migrations
- `seed` - Seed minimal operational data (org, branch, admin user)
- `seed:demo` - Seed comprehensive demo data (clients, caregivers, visits, etc.)
- `reset` - Nuke + Migrate + Seed
- `reset:demo` - Nuke + Migrate + Seed + Seed:demo

**Environments:**
- `--env=local` - Use `.env` (default if not specified)
- `--env=preview` - Use `.env.preview`
- `--env=production` - Use `.env.production`

### Common Workflows

#### Local Development (Default)

Run database operations without specifying an environment:

```bash
# Run migrations
npm run db:migrate
# OR
./scripts/db-env.sh migrate

# Full reset with demo data
npm run db:reset:demo
# OR
./scripts/db-env.sh reset:demo
```

#### Preview/Staging Environment

Initialize or reset the preview database:

```bash
# Run migrations only
./scripts/db-env.sh migrate --env=preview

# Full reset with demo data (recommended for preview)
./scripts/db-env.sh reset:demo --env=preview

# This does: nuke → migrate → seed (minimal) → seed:demo (full data)
```

#### Production Environment

Initialize or update the production database:

```bash
# Run migrations only (safest for production)
./scripts/db-env.sh migrate --env=production

# Full reset (DESTRUCTIVE - requires confirmation)
./scripts/db-env.sh reset --env=production
```

**⚠️ Production Safety**: Operations targeting `--env=production` require typing `YES` to confirm!

### NPM Convenience Scripts

The root `package.json` includes shortcuts:

```bash
# Local (default behavior - no env specified)
npm run db:migrate       # Migrate local database
npm run db:seed          # Seed local database
npm run db:reset:demo    # Full reset with demo data

# Preview/Production (use db-env.sh directly)
npm run db:env migrate --env=preview       # Migrate preview
npm run db:env reset:demo --env=preview    # Full reset preview with demo
npm run db:env migrate --env=production    # Migrate production
```

## Step-by-Step: Setting Up Neon Databases

### Preview Environment

```bash
# 1. Verify .env.preview has correct DATABASE_URL
cat .env.preview | grep DATABASE_URL

# 2. Run full reset with demo data
./scripts/db-env.sh reset:demo --env=preview

# 3. Verify success - you should see:
#    ✅ Database nuked successfully
#    ✅ Migrations applied
#    ✅ Minimal seed completed (org, branch, admin)
#    ✅ Demo data seeded (clients, caregivers, visits)
```

**Login Credentials (after seeding):**
- Email: `admin@carecommons.example`
- Password: `Admin123!`

### Production Environment

```bash
# 1. Verify .env.production has correct DATABASE_URL
cat .env.production | grep DATABASE_URL

# 2. Run ONLY migrations (don't seed demo data in production!)
./scripts/db-env.sh migrate --env=production

# 3. Seed minimal operational data (org, branch, admin user)
./scripts/db-env.sh seed --env=production

# 4. (Optional) If you need to reset production completely
./scripts/db-env.sh reset --env=production  # Type YES to confirm
```

**⚠️ For Production**: 
- Use `reset` only for initial setup
- Use `migrate` for ongoing schema updates
- **Never** use `seed:demo` in production (demo data is for testing only)
- After initial setup, use the admin UI to create real organizations, branches, users

## Database Commands Reference

### Individual Operations

| Operation | Local | Preview | Production |
|-----------|-------|---------|------------|
| **Nuke** (drop all) | `./scripts/db-env.sh nuke` | `./scripts/db-env.sh nuke --env=preview` | `./scripts/db-env.sh nuke --env=production` |
| **Migrate** | `./scripts/db-env.sh migrate` | `./scripts/db-env.sh migrate --env=preview` | `./scripts/db-env.sh migrate --env=production` |
| **Seed** (minimal) | `./scripts/db-env.sh seed` | `./scripts/db-env.sh seed --env=preview` | `./scripts/db-env.sh seed --env=production` |
| **Seed:demo** (full) | `./scripts/db-env.sh seed:demo` | `./scripts/db-env.sh seed:demo --env=preview` | ❌ Don't use in prod |
| **Reset** (nuke+migrate+seed) | `./scripts/db-env.sh reset` | `./scripts/db-env.sh reset --env=preview` | `./scripts/db-env.sh reset --env=production` |
| **Reset:demo** (full reset) | `./scripts/db-env.sh reset:demo` | `./scripts/db-env.sh reset:demo --env=preview` | ❌ Don't use in prod |

### Combined Operations

**Reset** = `nuke` → `migrate` → `seed` (minimal operational data)

**Reset:demo** = `nuke` → `migrate` → `seed` → `seed:demo` (full demo data)

## What Gets Seeded

### Minimal Seed (`seed`)

Creates only what's required for the system to function:
- 1 Organization: "Care Commons Home Health"
- 1 Branch: "Main Office"
- 1 Admin User: `admin@carecommons.example` / `Admin123!`

### Demo Seed (`seed:demo`)

Adds comprehensive demo data for testing (after minimal seed):
- Multiple clients with demographics and addresses
- Multiple caregivers with credentials and availability
- Scheduled visits with EVV data
- Care plans and tasks
- Billing and invoicing data
- State-specific compliance data (Texas and Florida examples)

## Troubleshooting

### Connection Issues

If you get connection errors:

1. **Verify the DATABASE_URL** is correct in the env file
2. **Check Neon connection pooler** is specified (`-pooler` in hostname)
3. **Ensure SSL mode** is set: `sslmode=require&channel_binding=require`
4. **Test the connection** manually:

```bash
# Load env file and test connection
source .env.preview
psql "$DATABASE_URL" -c "SELECT NOW();"
```

### Migration Errors

If migrations fail:

```bash
# Check current migration status
./scripts/db-env.sh migrate:status --env=preview

# If needed, manually rollback and re-run
cd packages/core
npm run db:migrate:rollback  # Only works for local
npm run db:migrate
```

### Permission Errors

If you get permission denied errors on the script:

```bash
chmod +x ./scripts/db-env.sh
```

## Security Best Practices

1. **Never commit** `.env`, `.env.preview`, or `.env.production` files
2. **Use strong secrets** for JWT and encryption keys in preview/production
3. **Rotate credentials** regularly in production
4. **Use Neon pooled connections** (`-pooler`) for serverless deployments
5. **Limit production access** - only authorized team members should have production credentials
6. **Audit database access** - Enable Neon's audit logging for production

## Generating Secure Secrets

For JWT secrets and session secrets:

```bash
openssl rand -base64 32
```

For encryption keys:

```bash
openssl rand -hex 32
```

Replace the placeholder values in `.env.preview` and `.env.production` with generated values.

## Summary

- **Local dev** is the default - no `--env` flag needed
- **Preview/Staging** uses `--env=preview` for testing before production
- **Production** uses `--env=production` with safety confirmation
- **All credentials** are in gitignored `.env*` files
- **Use `reset:demo`** for preview, **use `reset` or `migrate`** for production
- **The script handles** all environment loading automatically

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
