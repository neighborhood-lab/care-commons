# Complete Deployment Setup Guide for Care Commons

**Two Parallel Deployment Configurations**:
1. **Vercel + Neon** (Primary - Already Configured)
2. **Cloudflare Pages/Workers + Supabase** (Alternative - This Guide)

This document provides comprehensive setup instructions for both deployment options, with a focus on production-ready configurations for a home healthcare compliance application.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option 1: Vercel + Neon (Current Setup)](#option-1-vercel--neon-current-setup)
- [Option 2: Cloudflare + Supabase (Alternative)](#option-2-cloudflare--supabase-alternative)
- [Database Migration Strategy](#database-migration-strategy)
- [Connection Pooling Best Practices](#connection-pooling-best-practices)
- [Secrets Management](#secrets-management)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Cost Comparison](#cost-comparison)
- [Production Checklist](#production-checklist)

---

## Prerequisites

### Required Tools

```bash
# Node.js 22.x (required for Vercel compatibility)
nvm install 22
nvm use 22

# Verify versions
node --version  # Should be 22.x
npm --version   # Should be 10.9.4+

# Install global CLI tools
npm install -g vercel@latest
npm install -g wrangler@latest

# Optional: Database CLIs
npm install -g @neondatabase/cli
npm install -g supabase
```

### GitHub Repository Setup

1. Fork or clone the Care Commons repository
2. Enable GitHub Actions in your repository settings
3. Configure branch protection rules:
   - `main` branch: Production deployments
   - `preview` branch: Preview/staging deployments
   - `develop` branch: Integration testing (no deployment)

---

## Option 1: Vercel + Neon (Current Setup)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel Edge Network                      │
│  ┌────────────────┐              ┌─────────────────────┐   │
│  │  Static Assets │              │ Serverless Functions│   │
│  │  (React SPA)   │              │   (Express API)     │   │
│  └────────────────┘              └─────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Pooled Connection
                           ▼
                  ┌────────────────────┐
                  │   Neon PostgreSQL   │
                  │  (Serverless DB)    │
                  │  - Auto-scaling     │
                  │  - Built-in pooling │
                  └────────────────────┘
```

### Neon Database Setup

#### 1. Create Neon Project

```bash
# Login to Neon
neon auth

# Create project
neon projects create --name care-commons-prod --region aws-us-east-2

# Create database
neon databases create --project-id <PROJECT_ID> --name care_commons_production

# Get connection strings
neon connection-string <DATABASE_ID>
```

#### 2. Neon Connection Strings

Neon provides two types of connection strings:

```bash
# Pooled connection (use for Vercel serverless functions)
postgres://user:pass@ep-xxx-xxx.pooler.us-east-2.aws.neon.tech/care_commons_production?sslmode=require

# Direct connection (use for migrations only)
postgres://user:pass@ep-xxx-xxx.us-east-2.aws.neon.tech/care_commons_production?sslmode=require
```

**CRITICAL**: Always use the pooled connection string (contains `.pooler.`) for serverless deployments.

#### 3. Neon Configuration Best Practices

```typescript
// For Vercel serverless functions - use Neon's HTTP driver
import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

// For long-running operations (migrations)
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
  max: 10, // Neon's pooler handles this
});
```

### Vercel Setup

#### 1. Install Vercel CLI and Link Project

```bash
# Login to Vercel
vercel login

# Link project
cd /Users/bedwards/care-commons
vercel link

# Follow prompts:
# - Scope: Your Vercel account
# - Link to existing project? No (if first time)
# - Project name: care-commons
```

#### 2. Configure Environment Variables

```bash
# Production environment variables
vercel env add DATABASE_URL production
# Paste your Neon POOLED connection string

vercel env add DATABASE_URL_UNPOOLED production
# Paste your Neon DIRECT connection string

vercel env add JWT_SECRET production
# Generate: openssl rand -base64 32

vercel env add JWT_REFRESH_SECRET production
# Generate: openssl rand -base64 32

vercel env add SESSION_SECRET production
# Generate: openssl rand -base64 32

vercel env add ENCRYPTION_KEY production
# Generate: openssl rand -hex 32

# Preview environment (repeat for preview)
vercel env add DATABASE_URL preview
vercel env add JWT_SECRET preview
vercel env add JWT_REFRESH_SECRET preview
vercel env add SESSION_SECRET preview
vercel env add ENCRYPTION_KEY preview
```

#### 3. Verify Vercel Configuration

Your existing `vercel.json` is already configured correctly:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "regions": ["iad1"],
  "functions": {
    "api/index.ts": {
      "includeFiles": "{packages,verticals}/**/dist/**"
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api"
    },
    {
      "source": "/health",
      "destination": "/api"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### GitHub Secrets for Vercel Deployment

Add these secrets to your GitHub repository:

```bash
# In GitHub: Settings → Secrets and variables → Actions → New repository secret

VERCEL_TOKEN=<your_vercel_token>
VERCEL_ORG_ID=<your_vercel_org_id>
VERCEL_PROJECT_ID=<your_vercel_project_id>
DATABASE_URL=<neon_pooled_connection_string>
PREVIEW_DATABASE_URL=<neon_preview_pooled_connection_string>
JWT_SECRET=<generated_secret>
JWT_REFRESH_SECRET=<generated_secret>
SESSION_SECRET=<generated_secret>
ENCRYPTION_KEY=<generated_key>
```

### Deploy to Vercel

```bash
# Manual deployment (for testing)
npm run build
vercel deploy --prod

# Automatic deployment (via GitHub Actions)
git push origin main  # Triggers production deployment
git push origin preview  # Triggers preview deployment
```

### Verify Vercel Deployment

```bash
# Check health endpoint
curl https://care-commons.vercel.app/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-12T..."
}

# Check frontend
curl https://care-commons.vercel.app

# Test authentication
curl -X POST https://care-commons.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@carecommons.example","password":"your_password"}'
```

---

## Option 2: Cloudflare + Supabase (Alternative)

### Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                  Cloudflare Global Network                      │
│  ┌──────────────────┐          ┌──────────────────────────┐   │
│  │ Cloudflare Pages │          │  Cloudflare Workers       │   │
│  │  (Static Assets) │          │  (Serverless API)         │   │
│  └──────────────────┘          └──────────────────────────┘   │
│                                           │                     │
│                                           ▼                     │
│                                  ┌─────────────────┐           │
│                                  │   Hyperdrive    │           │
│                                  │ (Connection     │           │
│                                  │  Pooling)       │           │
│                                  └─────────────────┘           │
└────────────────────────────────────────┬───────────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │  Supabase Postgres  │
                              │  (Managed DB)       │
                              │  - PgBouncer pooler │
                              │  - Auto-backups     │
                              └─────────────────────┘
```

### Why Hyperdrive is Essential

**Cloudflare Workers cannot maintain persistent database connections** because:
- Workers are stateless and distributed globally
- Each request may hit a different data center
- Workers spin up and down dynamically

**Hyperdrive solves this by:**
- Creating regional connection pools
- Caching connections near your database
- Multiplexing queries over fewer connections
- Reducing latency with smart routing

**Without Hyperdrive**: You'll quickly exhaust database connections (typically 100-200 max connections) and experience connection errors.

### Supabase Setup

#### 1. Create Supabase Project

Visit https://supabase.com/dashboard/new/aoxifllwcujpinwfaxmu

Or use CLI:

```bash
# Login
supabase login

# Create project (or link existing)
supabase projects create care-commons-prod \
  --org-id <YOUR_ORG_ID> \
  --db-password "<PASSWORD_FROM_supabase-password.txt>" \
  --region us-east-1

# Get project details
supabase projects list
```

#### 2. Get Supabase Connection Strings

In Supabase Dashboard → Project Settings → Database:

```bash
# Direct connection (for migrations) - Port 5432
postgres://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Transaction pooler (for applications) - Port 6543
postgres://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# IMPORTANT: Add ?pgbouncer=true query parameter for pooler
postgres://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Your Supabase Password**: `-Q$gsyPD788qv!S` (from `supabase-password.txt`)

**Your Project Reference**: `aoxifllwcujpinwfaxmu` (from the URL you provided)

#### 3. Configure Supabase Connection Pooling

Supabase uses PgBouncer with two modes:

**Transaction Mode (Port 6543)** - Use for Cloudflare Workers
- Each transaction gets a connection
- Best for serverless (short-lived operations)
- Add `?pgbouncer=true` to connection string

**Session Mode (Port 5432)** - Use for migrations
- Each client session gets a connection
- Use for long-running operations
- Direct database access

```typescript
// Example connection strings
const SUPABASE_DIRECT = 'postgres://postgres:[pwd]@db.aoxifllwcujpinwfaxmu.supabase.co:5432/postgres';
const SUPABASE_POOLER = 'postgres://postgres.aoxifllwcujpinwfaxmu:[pwd]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
```

### Cloudflare Setup

#### 1. Install Wrangler CLI

```bash
# Already installed globally
wrangler --version

# Login to Cloudflare
wrangler login

# Get account ID (save this)
wrangler whoami
```

#### 2. Create Hyperdrive Configuration

**This is CRITICAL for Postgres from Workers**:

```bash
# Create Hyperdrive with your Supabase pooler connection
wrangler hyperdrive create care-commons-db \
  --connection-string="postgres://postgres.aoxifllwcujpinwfaxmu:-Q\$gsyPD788qv\!S@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Output will include:
# Successfully created a new Hyperdrive!
# 
# [[hyperdrive]]
# binding = "HYPERDRIVE"
# id = "a1b2c3d4e5f6..."
#
# Copy this ID - you'll need it for wrangler.toml
```

**Important**: Escape special characters in your password when using command line:
- `$` becomes `\$`
- `!` becomes `\!`

#### 3. Update wrangler.toml

Replace the `REPLACE_WITH_HYPERDRIVE_ID_AFTER_CREATION` placeholder with your actual Hyperdrive ID.

See updated `wrangler.toml` configuration below.

#### 4. Create Cloudflare Pages Project

```bash
# Create Pages project
wrangler pages project create care-commons-web

# Or link to existing project
wrangler pages project list
```

#### 5. Configure Cloudflare Secrets

```bash
# Set secrets for Workers
wrangler secret put DATABASE_URL
# Paste: postgres://postgres.aoxifllwcujpinwfaxmu:-Q$gsyPD788qv!S@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

wrangler secret put JWT_SECRET
# Generate: openssl rand -base64 32

wrangler secret put JWT_REFRESH_SECRET
wrangler secret put SESSION_SECRET
wrangler secret put ENCRYPTION_KEY
# Generate: openssl rand -hex 32

wrangler secret put SUPABASE_ANON_KEY
# From Supabase Dashboard → Settings → API → anon public

wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# From Supabase Dashboard → Settings → API → service_role (keep secret!)

# List secrets to verify
wrangler secret list
```

### GitHub Secrets for Cloudflare Deployment

Add these to GitHub: Settings → Secrets and variables → Actions:

```
CLOUDFLARE_API_TOKEN=<your_cloudflare_api_token>
CLOUDFLARE_ACCOUNT_ID=<your_cloudflare_account_id>
SUPABASE_ACCESS_TOKEN=<supabase_access_token>
SUPABASE_PROJECT_ID=aoxifllwcujpinwfaxmu
SUPABASE_DB_PASSWORD=-Q$gsyPD788qv!S
SUPABASE_DATABASE_URL=postgres://postgres.aoxifllwcujpinwfaxmu:-Q$gsyPD788qv!S@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
SUPABASE_ANON_KEY=<from_supabase_dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from_supabase_dashboard>
```

### Creating Cloudflare API Token

1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Add permissions:
   - Account → Cloudflare Pages → Edit
   - Account → Workers Scripts → Edit
   - Zone → Workers Routes → Edit
5. Set Account Resources to your account
6. Create token and save securely

### Deploy to Cloudflare

```bash
# Deploy Workers (API)
wrangler deploy --env production

# Deploy Pages (Frontend)
cd packages/web
npm run build
cd ../..
wrangler pages deploy public --project-name=care-commons-web --branch=main

# Or use GitHub Actions (automatic)
git push origin main
```

### Verify Cloudflare Deployment

```bash
# Check Workers deployment
curl https://care-commons-api.your-subdomain.workers.dev/health

# Check Pages deployment
curl https://care-commons-web.pages.dev

# Test with Hyperdrive
curl https://care-commons-api.your-subdomain.workers.dev/api/health
```

---

## Database Migration Strategy

### Migration Files Location

```
packages/core/migrations/
├── 001_initial_schema.sql
├── 002_add_evv_tables.sql
├── 003_add_state_compliance.sql
└── ...
```

### Running Migrations

#### For Neon (Vercel)

```bash
# Use unpooled connection for migrations
export DATABASE_URL="postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/care_commons_production?sslmode=require"

# Run migrations
npm run db:migrate

# Verify migration status
npm run db:migrate:status

# Rollback if needed
npm run db:migrate:rollback
```

#### For Supabase (Cloudflare)

```bash
# Use direct connection (port 5432) for migrations
export DATABASE_URL="postgres://postgres:-Q\$gsyPD788qv\!S@db.aoxifllwcujpinwfaxmu.supabase.co:5432/postgres"

# Run migrations
npm run db:migrate

# Or use Supabase CLI
supabase db push
```

### Migration Best Practices

1. **Always test migrations locally first**
2. **Use transactions** for atomic changes
3. **Add indexes after data loads** to avoid locking
4. **Use `IF NOT EXISTS`** for idempotent migrations
5. **Keep migrations reversible** when possible

Example migration:

```sql
-- Migration: Add visit geofencing fields
-- Date: 2025-11-12

BEGIN;

-- Add columns with IF NOT EXISTS safety
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS geofence_radius_meters INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS gps_accuracy_meters DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS clock_in_location JSONB,
ADD COLUMN IF NOT EXISTS clock_out_location JSONB;

-- Add indexes for geofencing queries
CREATE INDEX IF NOT EXISTS idx_visits_geofence 
ON visits (clock_in_location) 
WHERE clock_in_location IS NOT NULL;

-- Add check constraint for Texas compliance (100m + accuracy)
ALTER TABLE visits 
ADD CONSTRAINT IF NOT EXISTS chk_geofence_texas 
CHECK (
  (state <> 'TX') OR 
  (geofence_radius_meters >= 100)
);

COMMIT;
```

---

## Connection Pooling Best Practices

### Vercel + Neon Pooling

**Use Neon's built-in pooler** - it's optimized for serverless:

```typescript
// ✅ CORRECT - Use pooled connection
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL); // pooler endpoint

export async function handler(req, res) {
  const result = await sql`SELECT * FROM clients LIMIT 10`;
  return res.json(result);
}
```

**Configuration**:
- Max connections: Handled by Neon pooler (no config needed)
- Connection mode: Transaction mode (automatic)
- SSL: Always enabled (enforced by Neon)

**Why it works**:
- Neon's pooler is PgBouncer in transaction mode
- Optimized for serverless cold starts
- Automatically manages connection lifecycle
- Includes connection caching

### Cloudflare + Supabase Pooling

**Use Hyperdrive + Supabase pooler** - two layers of pooling:

```typescript
// ✅ CORRECT - Use Hyperdrive binding
import { Pool } from 'pg';

export interface Env {
  HYPERDRIVE: {
    connectionString: string;
  };
}

export default {
  async fetch(request: Request, env: Env) {
    const pool = new Pool({
      connectionString: env.HYPERDRIVE.connectionString,
      ssl: { rejectUnauthorized: false },
      max: 1, // Hyperdrive manages pooling
    });

    const result = await pool.query('SELECT * FROM clients LIMIT 10');
    return Response.json(result.rows);
  }
};
```

**Configuration**:
- Supabase pooler: Transaction mode (port 6543)
- Hyperdrive: Regional caching + connection reuse
- Worker pool: max: 1 (Hyperdrive handles everything)

**Why Hyperdrive is critical**:
- Workers are distributed globally (thousands of edge locations)
- Without Hyperdrive: Each edge location opens new connections
- With Hyperdrive: Regional pools near database, connection reuse
- Result: 100x fewer database connections

### Connection Pooling Comparison

| Feature | Neon Pooler | Supabase + Hyperdrive |
|---------|-------------|----------------------|
| Built-in pooling | ✅ Yes (PgBouncer) | ✅ Yes (PgBouncer + Hyperdrive) |
| Serverless optimized | ✅ Excellent | ✅ Excellent |
| Global edge support | ⚠️ Limited (US regions) | ✅ Excellent (Cloudflare global) |
| Max connections | ~10000 | ~100 (pooler) + unlimited (Hyperdrive) |
| Cold start latency | ~50ms | ~20ms (with Hyperdrive) |
| Cost | Included | Hyperdrive: $5/month |

---

## Secrets Management

### Environment Variables Structure

```bash
# .env.production (never commit!)
DATABASE_URL=postgres://...pooled_connection
DATABASE_URL_UNPOOLED=postgres://...direct_connection

# Authentication
JWT_SECRET=<base64_32_bytes>
JWT_REFRESH_SECRET=<base64_32_bytes>
SESSION_SECRET=<random_string>

# Encryption (for SSN, sensitive data)
ENCRYPTION_KEY=<hex_64_chars>

# OAuth (if using)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# EVV Aggregators (Texas)
HHAEXCHANGE_CLIENT_ID=xxx
HHAEXCHANGE_CLIENT_SECRET=xxx
HHAEXCHANGE_BASE_URL=https://api.hhaexchange.com/api

# Geocoding
GEOCODING_PROVIDER=mapbox
GEOCODING_API_KEY=xxx

# Monitoring (optional)
SENTRY_DSN=https://...
```

### Generating Secrets

```bash
# JWT secrets (base64, 32 bytes)
openssl rand -base64 32

# Encryption key (hex, 32 bytes = 64 hex chars)
openssl rand -hex 32

# Session secret (alphanumeric)
openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 32
```

### Secrets Checklist

**Vercel**:
- [ ] `DATABASE_URL` (pooled)
- [ ] `DATABASE_URL_UNPOOLED` (migrations)
- [ ] `JWT_SECRET`
- [ ] `JWT_REFRESH_SECRET`
- [ ] `SESSION_SECRET`
- [ ] `ENCRYPTION_KEY`
- [ ] `HHAEXCHANGE_CLIENT_ID` (if using TX EVV)
- [ ] `HHAEXCHANGE_CLIENT_SECRET`

**Cloudflare**:
- [ ] `DATABASE_URL` (Supabase pooler)
- [ ] `HYPERDRIVE` binding (configured in wrangler.toml)
- [ ] `JWT_SECRET`
- [ ] `JWT_REFRESH_SECRET`
- [ ] `SESSION_SECRET`
- [ ] `ENCRYPTION_KEY`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

**GitHub Secrets** (for CI/CD):
- [ ] Vercel: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- [ ] Cloudflare: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- [ ] Database: `DATABASE_URL`, `PREVIEW_DATABASE_URL`, `SUPABASE_DATABASE_URL`
- [ ] All application secrets (JWT, session, encryption)

---

## GitHub Actions CI/CD

### Current Workflow Structure

```
.github/workflows/
├── ci.yml                    # Lint, typecheck, tests
├── deploy.yml                # Vercel deployment (main, preview)
├── deploy-cloudflare.yml     # Cloudflare deployment (alternative)
├── e2e-tests.yml             # End-to-end tests
└── security.yml              # Security scanning
```

### Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Push to branch                                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  CI Workflow (ci.yml)                                        │
│  - Lint (turbo run lint)                                     │
│  - Type check (turbo run typecheck)                          │
│  - Unit tests (turbo run test)                               │
│  - Build (turbo run build)                                   │
└────────────────┬────────────────────────────────────────────┘
                 │ All checks pass
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Deploy Workflow (deploy.yml or deploy-cloudflare.yml)      │
│  - Run database migrations                                   │
│  - Deploy to target environment                              │
│  - Run smoke tests                                           │
│  - Health check                                              │
└─────────────────────────────────────────────────────────────┘
```

### Branch Strategy

| Branch | Environment | Deployed To | Database |
|--------|-------------|-------------|----------|
| `main` | Production | Vercel Production / CF Workers | Neon Production / Supabase |
| `preview` | Preview/Staging | Vercel Preview / CF Staging | Neon Preview / Supabase Preview |
| `develop` | Development | None (local only) | Local Postgres |
| `feature/*` | Local | None | Local Postgres |

---

## Cost Comparison

### Free Tier Limits

#### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ Unlimited API requests
- ✅ Serverless function execution included
- ✅ Automatic HTTPS
- ❌ Limited to hobby projects (non-commercial)
- **Paid**: $20/month per team member (Pro)

#### Neon Free Tier
- ✅ 512MB storage
- ✅ 191.9 compute hours/month
- ✅ 1 project
- ✅ Automated backups
- ❌ Limited to 1 database per project
- **Paid**: $19/month (Pro) for more storage/compute

#### Cloudflare Free Tier
- ✅ 100,000 requests/day (Workers)
- ✅ 500 builds/month (Pages)
- ✅ Unlimited bandwidth
- ✅ Global edge network
- ❌ 10ms CPU time per request (Workers)
- **Paid**: $5/month (Workers Paid), $1/month (Hyperdrive)

#### Supabase Free Tier
- ✅ 500MB database storage
- ✅ 2GB file storage
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests
- ❌ Projects pause after 1 week inactivity
- **Paid**: $25/month (Pro) for always-on

### Cost Projections (Production Scale)

**Scenario**: 10,000 monthly active users, 1M API requests/month

#### Option 1: Vercel + Neon
- Vercel Pro: $20/user/month
- Neon Pro: $19/month
- Total: **~$39-59/month** (1-2 team members)

#### Option 2: Cloudflare + Supabase
- Cloudflare Workers Paid: $5/month
- Hyperdrive: $1/month
- Supabase Pro: $25/month
- Total: **~$31/month**

**Winner for cost**: Cloudflare + Supabase (~20% cheaper)

**Winner for simplicity**: Vercel + Neon (better DX, integrated)

---

## Production Checklist

### Pre-Deployment

- [ ] All tests passing (`npm run test`)
- [ ] Type checking clean (`npm run typecheck`)
- [ ] Linting clean (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Pre-commit hooks enabled (`npm run prepare`)
- [ ] Database migrations tested locally
- [ ] Environment variables documented
- [ ] Secrets rotated and secured

### Database

- [ ] Connection pooling configured
- [ ] Migrations run successfully
- [ ] Indexes created for performance
- [ ] Backup strategy in place
- [ ] Connection strings use SSL
- [ ] Audit logging enabled
- [ ] Row-level security configured (Supabase)

### Security

- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] JWT secrets are strong (32+ bytes)
- [ ] Encryption key is unique per environment
- [ ] API rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection headers set
- [ ] CSRF protection enabled

### Monitoring

- [ ] Health check endpoint working (`/health`)
- [ ] Error tracking configured (Sentry optional)
- [ ] Database performance monitoring
- [ ] API response time tracking
- [ ] Deployment notifications set up

### Compliance (Home Healthcare Specific)

- [ ] HIPAA compliance validated
- [ ] PHI encryption at rest and in transit
- [ ] Audit trail logging all PHI access
- [ ] User permissions granular and tested
- [ ] State-specific EVV requirements met
- [ ] Background check validation working
- [ ] Session timeout configured (15 min for PHI access)
- [ ] Data retention policies implemented

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Health check returns 200
- [ ] Authentication flow working
- [ ] Database connectivity verified
- [ ] Static assets loading
- [ ] API endpoints responding
- [ ] No console errors in browser
- [ ] Performance metrics acceptable

---

## Testing Deployments Locally

### Vercel Local Development

```bash
# Run Vercel dev server (simulates serverless functions)
vercel dev

# Access at http://localhost:3000
```

### Cloudflare Local Development

```bash
# Run Wrangler dev (simulates Workers)
wrangler dev --remote  # Uses remote bindings (Hyperdrive)

# Or with local Supabase
supabase start  # Starts local Postgres on port 54322
wrangler dev  # Uses local DATABASE_URL
```

---

## Troubleshooting

### Vercel Issues

**Problem**: `MODULE_NOT_FOUND` errors in serverless functions

**Solution**: Ensure `vercel.json` includes compiled dist files:
```json
{
  "functions": {
    "api/index.ts": {
      "includeFiles": "{packages,verticals}/**/dist/**"
    }
  }
}
```

**Problem**: Database connection timeout

**Solution**: Verify you're using Neon's POOLED connection string (contains `.pooler.`)

### Cloudflare Issues

**Problem**: `Error: connect ETIMEDOUT` from Workers

**Solution**: Configure Hyperdrive binding properly. Workers cannot connect directly to Postgres.

**Problem**: `ReferenceError: require is not defined`

**Solution**: Enable Node.js compatibility in wrangler.toml:
```toml
node_compat = true
compatibility_flags = ["nodejs_compat"]
```

**Problem**: Hyperdrive binding not found

**Solution**: Verify Hyperdrive ID in wrangler.toml matches your created Hyperdrive:
```bash
wrangler hyperdrive list
```

### Database Issues

**Problem**: Too many connections

**Solution**: 
- Neon: Use pooled connection string
- Supabase: Ensure using transaction pooler (port 6543) + Hyperdrive

**Problem**: Migration fails with lock timeout

**Solution**: Ensure no active connections during migration:
```sql
-- Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'care_commons_production';

-- Terminate if needed (carefully!)
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE datname = 'care_commons_production' AND pid <> pg_backend_pid();
```

---

## Next Steps

1. **Choose your deployment strategy**:
   - Vercel + Neon: Better DX, simpler setup, slightly higher cost
   - Cloudflare + Supabase: Lower cost, more control, global edge

2. **Set up database**:
   - Create project (Neon or Supabase)
   - Configure connection pooling
   - Run migrations
   - Verify connectivity

3. **Configure deployment platform**:
   - Install CLI tools
   - Link project
   - Set environment variables
   - Configure GitHub secrets

4. **Deploy**:
   - Test locally first
   - Deploy to preview/staging
   - Run smoke tests
   - Deploy to production

5. **Monitor and iterate**:
   - Watch error rates
   - Monitor database performance
   - Collect user feedback
   - Optimize as needed

---

## Support and Resources

### Documentation
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Neon Database Docs](https://neon.tech/docs)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Supabase Docs](https://supabase.com/docs)
- [Hyperdrive Docs](https://developers.cloudflare.com/hyperdrive/)

### Care Commons Specific
- Main README: `/Users/bedwards/care-commons/README.md`
- Architecture: `/Users/bedwards/care-commons/docs/`
- Compliance Guide: `/Users/bedwards/care-commons/docs/compliance/`
- EVV Integration: `/Users/bedwards/care-commons/verticals/time-tracking-evv/`

### Community
- GitHub Issues: https://github.com/neighborhood-lab/care-commons/issues
- Discussions: https://github.com/neighborhood-lab/care-commons/discussions

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
