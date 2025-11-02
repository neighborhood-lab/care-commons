# Cloud Deployment Guide

This document provides a complete guide for deploying Care Commons to production using **Vercel** and **Neon PostgreSQL**.

## Overview

Care Commons uses a modern serverless architecture optimized for cost-efficiency and scalability:

- **Frontend & API**: Deployed on Vercel (serverless functions)
- **Database**: Neon PostgreSQL (serverless database with connection pooling)
- **CI/CD**: GitHub Actions for automated deployments
- **Environments**: Preview (PR), Staging (develop branch), Production (main branch)

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
   - `staging` - For staging environment
   - `production` - For production environment

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
# Paste: (same or different key for staging)
```

### 3. GitHub Repository Setup

#### Required Secrets
Add these in: Settings → Secrets and variables → Actions → New repository secret

```bash
# Vercel Integration
VERCEL_TOKEN              # From vercel.com/account/tokens
VERCEL_ORG_ID             # From vercel link output or dashboard
VERCEL_PROJECT_ID         # From vercel link output or dashboard

# Database Connections
DATABASE_URL              # Neon production pooled connection string
STAGING_DATABASE_URL      # Neon staging pooled connection string

# Application Secrets
JWT_SECRET                # openssl rand -hex 32
STAGING_JWT_SECRET        # openssl rand -hex 32 (can be same or different)
ENCRYPTION_KEY            # openssl rand -hex 32
```

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

### Preview Deployments (Pull Requests)
- **Trigger**: Opening or updating a pull request
- **Environment**: Preview (uses staging database)
- **Features**:
  - Automatic deployment on every PR commit
  - Unique preview URL for each PR
  - PR comment with preview URL
  - Runs tests before deployment

### Staging Deployments
- **Trigger**: Push to `develop` branch
- **Environment**: Staging
- **Features**:
  - Automatic database migrations
  - Health check validation
  - Persistent staging URL

### Production Deployments
- **Trigger**: Push to `main` branch
- **Environment**: Production
- **Features**:
  - Automatic database migrations
  - Health check validation
  - Production URL with custom domain support
  - Optional demo data seeding (manual workflow dispatch)

## Deployment Commands

### Using NPM Scripts
```bash
# Preview deployment
npm run deploy:preview

# Staging deployment
npm run deploy:staging

# Production deployment
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
2. **Test migrations on staging first** - Never test on production
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
