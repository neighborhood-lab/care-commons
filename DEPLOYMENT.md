# Cloud Deployment Guide

This document provides a complete guide for deploying Care Commons to production using **Vercel Hobby Plan** and **Neon PostgreSQL**.

## Overview

Care Commons uses a modern serverless architecture optimized for cost-efficiency and scalability:

- **Frontend & API**: Deployed on Vercel (serverless functions)
- **Database**: Neon PostgreSQL (serverless database with connection pooling)
- **CI/CD**: GitHub Actions for automated deployments
- **Environments (Vercel Hobby Plan)**:
  - **Production** (Vercel production environment) ← `main` branch (pushes only)
  - **Preview** (Vercel preview environment) ← `preview` branch (pushes only)
  - **Development** (local only, not deployed) ← linked to local machine via `vercel dev`
  - **Note**: Pull requests and feature branches do NOT trigger deployments

### Deployment Rate Limiting

**IMPORTANT**: Vercel automatic deployments on PRs are **disabled** to avoid hitting free tier limits (100 deployments/day).

- **vercel.json** has `"github": { "enabled": false }` to prevent automatic Vercel deployments
- **Only GitHub Actions** triggers deployments (controlled, predictable)
- **Pushes to `main` and `preview`** branches trigger deployments via GitHub Actions
- **All other branches/PRs** only run CI checks (build, lint, typecheck, tests)

## Architecture

```
┌─────────────────┐
│   GitHub PR     │
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ GitHub Actions  │─────>│ Vercel Preview   │
│   (CI/CD)       │      │   Deployment     │
└────────┬────────┘      └──────────────────┘
         │
         │ main/develop
         ▼
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│ Build & Test    │─────>│ Vercel Deploy    │─────>│ Neon PostgreSQL │
│                 │      │ (Serverless)     │      │ (Pooled)        │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

## Prerequisites

### Required Accounts
1. **GitHub Account** - Repository hosting and CI/CD
2. **Vercel Account** - Application hosting ([vercel.com](https://vercel.com))
3. **Neon Account** - Database hosting ([neon.tech](https://neon.tech))

### Local Development Tools
- Node.js 20+
- PostgreSQL 14+ (for local development)
- Vercel CLI: `npm install -g vercel`
- Git

## Step-by-Step Setup

### 1. Neon PostgreSQL Setup

#### Create Databases
1. Sign up at [console.neon.tech](https://console.neon.tech)
2. Create a new project: `care-commons`
3. Create two branches in Neon:
   - `preview` - For preview environment (develop branch and PRs)
   - `production` - For production environment (main branch)

#### Configure Connection Pooling
1. In each database branch, enable **Connection Pooling**
2. Copy the **pooled connection string** (not the direct connection string)
3. The pooled connection string format:
   ```
   postgresql://user:password@ep-pooler-host.region.aws.neon.tech:5432/dbname?sslmode=require
   ```

#### Important Notes
- Always use **pooled** connection strings for Vercel deployments
- Neon automatically manages SSL certificates
- Connection pooling is essential for serverless environments to avoid connection exhaustion

### 2. Vercel Project Setup

#### Initial Configuration
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link your project:
   ```bash
   cd /path/to/care-commons
   vercel link
   ```
   - Select your account/team
   - Link to existing project or create new
   - Accept default settings

4. Get Project IDs:
   ```bash
   # These will be displayed after linking
   # Also visible in Vercel dashboard under Settings
   VERCEL_ORG_ID=team_xxxxx
   VERCEL_PROJECT_ID=prj_xxxxx
   ```

#### Environment Variables
Add environment variables through Vercel dashboard or CLI:

```bash
# Production Environment
vercel env add DATABASE_URL production
# Paste: postgresql://user:pass@neon-host/care_commons_production?sslmode=require

vercel env add JWT_SECRET production
# Paste: (generate with: openssl rand -hex 32)

vercel env add ENCRYPTION_KEY production
# Paste: (generate with: openssl rand -hex 32)

# Staging/Preview Environment
vercel env add DATABASE_URL preview
# Paste: postgresql://user:pass@neon-host/care_commons_staging?sslmode=require

vercel env add JWT_SECRET preview
# Paste: (same or different secret for staging)

vercel env add ENCRYPTION_KEY preview
# Paste: (same or different key for preview)
```

### 3. GitHub Repository Setup

#### Required Secrets
Add these in: **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | How to Get It |
|------------|-------------|---------------|
| **`VERCEL_TOKEN`** | ⚠️ **REQUIRED** - Vercel authentication token | 1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)<br>2. Click "Create Token"<br>3. Name: `care-commons-github-actions`<br>4. Scope: **Full Account**<br>5. Copy token immediately (can't view again)<br>6. Add to GitHub Secrets |
| **`VERCEL_ORG_ID`** | ⚠️ **REQUIRED** - Your Vercel organization/team ID | From `vercel link` output or Vercel dashboard URL |
| **`VERCEL_PROJECT_ID`** | ⚠️ **REQUIRED** - Your Vercel project ID | From `vercel link` output or Project Settings |
| **`DATABASE_URL`** | ⚠️ **REQUIRED** - Production database connection | Neon production pooled connection string |
| **`PREVIEW_DATABASE_URL`** | ⚠️ **REQUIRED** - Preview database connection | Neon preview pooled connection string |

**Environment Variable Names:**
```bash
# Vercel Integration (CRITICAL - deployment will fail without these)
VERCEL_TOKEN              # Authentication token from vercel.com/account/tokens
VERCEL_ORG_ID             # Organization/team ID (e.g., team_xxxx)
VERCEL_PROJECT_ID         # Project ID (e.g., prj_xxxx)

# Database Connections
DATABASE_URL              # Neon production pooled connection string
PREVIEW_DATABASE_URL      # Neon preview pooled connection string

# Application Secrets (Optional for basic deployment)
JWT_SECRET                # openssl rand -hex 32
PREVIEW_JWT_SECRET        # openssl rand -hex 32 (can be same or different)
ENCRYPTION_KEY            # openssl rand -hex 32
```

#### Creating the VERCEL_TOKEN

The `VERCEL_TOKEN` is **critical** - without it, deployments will fail with:
```
Error: No existing credentials found. Please run `vercel login` or pass "--token"
```

**Step-by-step:**
1. **Go to** [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. **Click** "Create Token" button
3. **Configure**:
   - Token Name: `care-commons-github-actions`
   - Scope: **Full Account** (required for deployments)
   - Expiration: No Expiration (or set based on security policy)
4. **Click** "Create"
5. **IMPORTANT**: Copy the token **immediately** - you won't see it again!
6. **Add to GitHub**:
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `VERCEL_TOKEN`
   - Value: Paste the token
   - Click "Add secret"

#### Optional Secrets
```bash
CODECOV_TOKEN            # For code coverage reporting
SNYK_TOKEN               # For security scanning
```

### 4. Database Migration

Migrations run automatically during deployment via GitHub Actions. To run manually:

```bash
# Set environment variable
export DATABASE_URL="your-neon-pooled-connection-string"

# Run migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Seed demo data (optional)
npm run db:seed:demo
```

## Deployment Workflows

> **📖 Detailed Guide:** See [.github/workflows/DEPLOYMENT_FLOW.md](.github/workflows/DEPLOYMENT_FLOW.md) for complete workflow documentation.

### Deployment Triggers

| Branch | Event | Vercel Environment | Database |
|--------|-------|-------------------|----------|
| `main` | Push | ✅ **Production** | Production (Neon) |
| `preview` | Push | ✅ **Preview** | Preview (Neon) |
| `develop` | Push | ❌ **None** (only CI checks) | N/A |
| `feature/*` | Push | ❌ **None** (only CI checks) | N/A |
| Any | Pull Request | ❌ **None** (only CI checks) | N/A |

**Important:** 
- Vercel Hobby Plan supports **Production** and **Preview** environments only
- **Automatic Vercel deployments are DISABLED** (`vercel.json`: `"github.enabled": false`)
- **Only GitHub Actions** triggers deployments (controlled by `.github/workflows/deploy.yml`)
- **Pull requests do NOT trigger deployments** - only pushes to `main` or `preview`
- Feature branches and `develop` do NOT trigger deployments
- Only `main` (production) and `preview` branches trigger automatic deployments on push
- PRs should target `develop` for integration, then merge `develop` → `preview` → `main`

### Preview Deployments (preview branch only)
- **Trigger**: 
  - Push to `preview` branch only (via GitHub Actions)
- **Vercel Environment**: Preview
- **Database**: Preview (Neon)
- **Features**:
  - Automatic deployment when code is pushed to preview
  - Persistent preview environment
  - Runs database migrations
  - Health checks
  - Tests run in CI before deployment
- **Workflow**:
  1. Merge feature branches → `develop` (integration, no deployment)
  2. Merge `develop` → `preview` (triggers preview deployment)
  3. Test on preview environment
  4. Merge `preview` → `main` (triggers production deployment)
- **Does NOT trigger on**: Pull requests, feature branches, or `develop` branch

### Production Deployments
- **Trigger**: 
  - Push to `main` branch ONLY
  - Manual workflow dispatch
- **Vercel Environment**: Production
- **Database**: Production (Neon)
- **Features**:
  - Automatic database migrations
  - Health check validation
  - Production URL with custom domain support
  - Optional demo data seeding (manual workflow dispatch)
- **Does NOT trigger on**: PRs or feature branches

### Development Environment (Local Only)
- **Setup**: `vercel dev` (links to local machine)
- **Not deployed**: Development environment is NOT deployed to Vercel
- **Database**: Local PostgreSQL or development database
- **Purpose**: Local testing and development

## Deployment Commands

### Using NPM Scripts
```bash
# Preview deployment (for develop branch)
npm run deploy:preview

# Production deployment (for main branch)
npm run deploy:production
```

### Using Vercel CLI Directly
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# List deployments
vercel ls

# View logs
vercel logs <deployment-url>

# Promote deployment to production
vercel promote <deployment-url>
```

## Monitoring & Health Checks

### Health Endpoint
Every deployment includes a `/health` endpoint:

```bash
# Check production
curl https://your-app.vercel.app/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-11-01T12:00:00.000Z",
  "environment": "production",
  "uptime": 3600,
  "responseTime": 45,
  "database": {
    "status": "connected",
    "responseTime": 45
  },
  "memory": {
    "used": 128,
    "total": 256
  }
}
```

### Vercel Dashboard
- **Deployments**: View deployment history and logs
- **Analytics**: Monitor traffic and performance
- **Logs**: Real-time serverless function logs
- **Metrics**: Response times, error rates

### Neon Console
- **Monitoring**: Query performance and database metrics
- **Connections**: Active connection pooling stats
- **Backups**: Point-in-time recovery
- **Branches**: Database branching for testing

## Rollback Procedures

### Vercel Rollback
```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote <previous-deployment-url>
```

### Database Rollback
```bash
# Rollback last migration
npm run db:migrate:rollback

# For Neon: Use point-in-time recovery in console
# Navigate to: Neon Console → Database → Restore
```

## Troubleshooting

### Common Deployment Errors

#### Error: "No existing credentials found. Please run `vercel login` or pass "--token""

**Cause:** Missing or invalid `VERCEL_TOKEN` in GitHub Secrets

**Solution:**
1. **Verify** the secret exists:
   - Go to GitHub → Settings → Secrets and variables → Actions
   - Check if `VERCEL_TOKEN` is listed
   - If not, create it following the steps above

2. **If it exists, create a new token:**
   - Old token may have expired or been revoked
   - Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - Click "Create Token"
   - Scope: **Full Account**
   - Copy the new token
   - Update GitHub Secret with new value

3. **Check token permissions:**
   - Token must have **Full Account** scope
   - Tokens with limited scope won't work for deployments

4. **Verify workflow file:**
   - Check `.github/workflows/deploy.yml`
   - Ensure it uses `${{ secrets.VERCEL_TOKEN }}`
   - NOT `${{ env.VERCEL_TOKEN }}` (wrong!)

#### Error: "Project not found" or "Invalid project"

**Cause:** Invalid `VERCEL_PROJECT_ID` or `VERCEL_ORG_ID`

**Solution:**
1. **Get correct IDs** by running locally:
   ```bash
   vercel link
   cat .vercel/project.json
   ```
   
2. **Update GitHub Secrets** with values from `.vercel/project.json`:
   ```json
   {
     "orgId": "team_xxxxxxxxxxxxxxxxxxxx",
     "projectId": "prj_xxxxxxxxxxxxxxxxxxxx"
   }
   ```

3. **Alternative** - Get from Vercel Dashboard:
   - Project Settings → General
   - Copy Project ID
   - Org ID is in the URL: `vercel.com/<org-id>/...`

### Deployment Failures

#### Build Errors
```bash
# Check build logs in Vercel dashboard
# Or locally:
npm run build
npm run lint
npm run typecheck
```

#### Database Connection Issues
1. Verify connection string is **pooled** (contains `-pooler-`)
2. Check SSL mode is set: `?sslmode=require`
3. Verify IP allowlisting in Neon (Vercel IPs whitelisted)
4. Test connection locally:
   ```bash
   export DATABASE_URL="your-connection-string"
   npm run db:migrate:status
   ```

#### Migration Failures
1. Check migration order in `packages/core/migrations`
2. Verify database user has CREATE permissions
3. Review migration logs in GitHub Actions
4. Manual intervention:
   ```bash
   # Connect to database
   psql $DATABASE_URL
   
   # Check migration status
   SELECT * FROM knex_migrations;
   
   # Force unlock if stuck
   DELETE FROM knex_migrations_lock WHERE is_locked = 1;
   ```

### Performance Issues

#### Slow Database Queries
1. Enable query logging in Neon
2. Review slow queries in Neon console
3. Add database indexes if needed
4. Check connection pool settings

#### Function Timeouts
1. Increase timeout in `vercel.json` (max 60s)
2. Optimize database queries
3. Consider breaking into smaller functions

## Best Practices

### Security
1. **Never commit secrets** - Use environment variables
2. **Rotate secrets regularly** - Update JWT_SECRET and ENCRYPTION_KEY quarterly
3. **Use HTTPS only** - Enforced by Vercel
4. **Enable Vercel firewall** - Block suspicious traffic
5. **Monitor access logs** - Review regularly for anomalies

### Database
1. **Always use pooled connections** - Essential for serverless
2. **Test migrations on preview first** - Never test on production
3. **Backup before major changes** - Use Neon point-in-time recovery
4. **Monitor connection counts** - Avoid exhaustion
5. **Use prepared statements** - Prevent SQL injection

### Deployments
1. **Review preview deployments** - Test changes before merging
2. **Run tests locally** - Don't rely solely on CI
3. **Monitor health endpoint** - Set up external monitoring
4. **Document breaking changes** - Update migration notes
5. **Keep dependencies updated** - Security patches

### Cost Optimization
1. **Use Vercel free tier wisely** - Monitor usage
2. **Optimize bundle size** - Code splitting, tree shaking
3. **Enable caching** - Static assets, API responses
4. **Monitor Neon usage** - Connection pooling reduces costs
5. **Clean up old deployments** - Remove stale preview deployments

## Support & Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Care Commons README](./README.md)

### Getting Help
- **GitHub Issues**: [Report bugs or request features](https://github.com/neighborhood-lab/care-commons/issues)
- **Vercel Support**: support@vercel.com
- **Neon Support**: support@neon.tech

## Appendix

### Environment Variable Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | Neon pooled connection string | `postgresql://user:pass@host/db` |
| `NODE_ENV` | Auto | Environment name | `production`, `staging`, `development` |
| `PORT` | Auto | Server port (Vercel sets automatically) | `3000` |
| `JWT_SECRET` | Yes | Secret for JWT tokens | `(32-byte hex string)` |
| `ENCRYPTION_KEY` | Yes | Key for encrypting sensitive data | `(32-byte hex string)` |
| `CORS_ORIGIN` | No | Allowed CORS origins | `https://app.example.com` |
| `LOG_LEVEL` | No | Logging verbosity | `info`, `debug`, `error` |

### vercel.json Configuration

See [vercel.json](./vercel.json) for complete configuration.

Key settings:
- **Build Command**: `npm run build`
- **Output Directory**: `packages/web/dist`
- **Function Runtime**: Node.js 20
- **Max Duration**: 60 seconds
- **Regions**: IAD1 (US East)

### Migration Scripts

Located in `packages/core/migrations/`:
- Migrations run in alphanumeric order
- Each migration has `up` and `down` functions
- Migration status tracked in `knex_migrations` table
- Manual rollback: `npm run db:migrate:rollback`

---

**Care Commons** - Cloud deployment infrastructure
Built with Vercel and Neon PostgreSQL
