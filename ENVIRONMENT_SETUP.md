# Environment Configuration Guide

**Complete reference for all environment variables, secrets, and external system configuration required for Care Commons deployment.**

---

## Table of Contents

- [Overview](#overview)
- [Local Development](#local-development)
- [GitHub Secrets](#github-secrets)
- [Vercel Configuration](#vercel-configuration)
- [Neon Database](#neon-database)
- [Snyk Security](#snyk-security)
- [Codecov](#codecov)
- [Environment Variables Reference](#environment-variables-reference)

---

## Overview

Care Commons uses different configurations for each environment:

| Environment | Branch | Database | URL | Purpose |
|-------------|--------|----------|-----|---------|
| **Local** | Any | Local PostgreSQL | localhost:3000 | Development |
| **Preview** | `preview` | Neon Preview DB | `*.vercel.app` | Pre-production testing |
| **Production** | `main` | Neon Production DB | `care-commons.vercel.app` | Live system |

---

## Local Development

### Required Environment Variables

Create a `.env` file in the project root:

```bash
# Database Configuration (Local PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/care_commons

# OR use individual variables:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=care_commons
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SSL=false

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (comma-separated origins)
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### Local Database Setup

1. **Install PostgreSQL 15+**:
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Ubuntu
   sudo apt install postgresql-15
   sudo systemctl start postgresql
   ```

2. **Create Database**:
   ```bash
   createdb care_commons
   createdb care_commons_test
   ```

3. **Run Migrations**:
   ```bash
   npm run db:migrate
   ```

4. **Seed Data** (optional):
   ```bash
   npm run db:seed
   ```

### Running Locally

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start development server
npm run dev
```

Access the application:
- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:5173 (if using Vite dev server)
- **Health Check**: http://localhost:3000/health

---

## GitHub Secrets

### Navigate to GitHub Settings

Go to: **Repository → Settings → Secrets and variables → Actions → New repository secret**

### Required Secrets

#### 1. Database Secrets

| Secret Name | Description | Example | Used By |
|-------------|-------------|---------|---------|
| `DATABASE_URL` | Production Neon database connection string | `postgresql://user:pass@host/db?sslmode=require` | Production deployment |
| `PREVIEW_DATABASE_URL` | Preview Neon database connection string | `postgresql://user:pass@host/db_preview?sslmode=require` | Preview deployment |

#### 2. Vercel Secrets

| Secret Name | Description | How to Get | Used By |
|-------------|-------------|------------|---------|
| `VERCEL_TOKEN` | Vercel API token for deployments | [Vercel Account Settings](https://vercel.com/account/tokens) | All deployments |
| `VERCEL_ORG_ID` | Vercel organization/team ID | Project Settings → General | All deployments |
| `VERCEL_PROJECT_ID` | Vercel project ID | Project Settings → General | All deployments |

**To get Vercel IDs**:
1. Go to https://vercel.com/neighborhood-lab/care-commons/settings
2. Copy **Project ID** and **Team ID**
3. Add to GitHub Secrets

#### 3. Security & Monitoring Secrets

| Secret Name | Description | How to Get | Used By |
|-------------|-------------|------------|---------|
| `CODECOV_TOKEN` | Codecov upload token | [Codecov Settings](https://codecov.io/gh/neighborhood-lab/care-commons/settings) | CI workflow |
| `SNYK_TOKEN` | Snyk security scanning token | [Snyk Account Settings](https://app.snyk.io/account) | Security workflow |

#### 4. JWT Secrets (Production)

| Secret Name | Description | How to Generate | Used By |
|-------------|-------------|-----------------|---------|
| `JWT_ACCESS_SECRET` | JWT access token signing key | `openssl rand -base64 32` | Production app |
| `JWT_REFRESH_SECRET` | JWT refresh token signing key | `openssl rand -base64 32` | Production app |

---

## Vercel Configuration

### Project Setup

1. **Link Repository**:
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Import GitHub repository: `neighborhood-lab/care-commons`

2. **Configure Build Settings**:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `public`
   - **Install Command**: `npm install`
   - **Node.js Version**: 22.x (CRITICAL - do not change)

3. **Root Directory**: Leave empty (monorepo at root)

### Environment Variables (Vercel Dashboard)

Navigate to: **Project Settings → Environment Variables**

#### Production Environment Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` (from Neon) | Production |
| `JWT_ACCESS_SECRET` | Random 32-byte base64 string | Production |
| `JWT_REFRESH_SECRET` | Random 32-byte base64 string | Production |
| `NODE_ENV` | `production` | Production |
| `CORS_ORIGIN` | `https://care-commons.vercel.app` | Production |

#### Preview Environment Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` (preview DB from Neon) | Preview |
| `JWT_ACCESS_SECRET` | Random 32-byte base64 string | Preview |
| `JWT_REFRESH_SECRET` | Random 32-byte base64 string | Preview |
| `NODE_ENV` | `production` | Preview |
| `CORS_ORIGIN` | `https://*.vercel.app` | Preview |

### Vercel Deployment Configuration

The `vercel.json` file is critical for proper deployment:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "framework": null,
  "installCommand": "npm install",
  "functions": {
    "api/index.mts": {
      "runtime": "nodejs22.x",
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/health",
      "destination": "/api/index.mts"
    },
    {
      "source": "/api/:path*",
      "destination": "/api/index.mts"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**DO NOT MODIFY** the Node.js version (22.x) - Vercel requires this for ESM support.

---

## Neon Database

### Production Database Setup

1. **Create Neon Account**: https://neon.tech
2. **Create Production Database**:
   - Project Name: `care-commons-production`
   - Region: Choose closest to your users
   - PostgreSQL Version: 15+
   - Compute Size: Start with 0.25 vCPU, scale as needed

3. **Get Connection String**:
   - Go to Project Dashboard
   - Click "Connection Details"
   - Copy connection string (format: `postgresql://user:pass@host/dbname?sslmode=require`)
   - Add to GitHub Secrets as `DATABASE_URL`

4. **Configure Pooling** (recommended for Vercel):
   - Enable "Pooled connection" in Neon dashboard
   - Use pooled connection string for `DATABASE_URL`

### Preview Database Setup

1. **Create Preview Database**:
   - Same project or separate project
   - Name: `care-commons-preview`
   - Same configuration as production

2. **Get Connection String**:
   - Copy preview database connection string
   - Add to GitHub Secrets as `PREVIEW_DATABASE_URL`

### Database Migrations

Migrations run automatically during deployment via GitHub Actions:

```yaml
- name: Run Database Migrations (Production)
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: npm run db:migrate
```

**Manual migration** (if needed):
```bash
DATABASE_URL="postgresql://..." npm run db:migrate
```

---

## Snyk Security

### Setup

1. **Create Snyk Account**: https://snyk.io
2. **Connect GitHub Repository**:
   - Go to https://app.snyk.io
   - Click "Add project"
   - Select GitHub → `neighborhood-lab/care-commons`

3. **Get API Token**:
   - Go to https://app.snyk.io/account
   - Copy your API token
   - Add to GitHub Secrets as `SNYK_TOKEN`

### Security Workflow

The `.github/workflows/security.yml` workflow runs Snyk scans:
- **Trigger**: Weekly schedule + manual dispatch
- **Scans**: Dependencies, code vulnerabilities
- **Reporting**: Creates GitHub security alerts

---

## Codecov

### Setup

1. **Create Codecov Account**: https://codecov.io
2. **Connect GitHub Repository**:
   - Go to https://codecov.io/gh
   - Add repository: `neighborhood-lab/care-commons`

3. **Get Upload Token**:
   - Go to https://codecov.io/gh/neighborhood-lab/care-commons/settings
   - Copy "Repository Upload Token"
   - Add to GitHub Secrets as `CODECOV_TOKEN`

### Coverage Reporting

The CI workflow automatically uploads coverage:
```yaml
- name: Upload coverage reports
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./packages/*/coverage/lcov.info
```

---

## Environment Variables Reference

### Complete List

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| **Database** |
| `DATABASE_URL` | Yes (prod) | - | PostgreSQL connection string (preferred) |
| `DB_HOST` | If no DATABASE_URL | `localhost` | Database host |
| `DB_PORT` | If no DATABASE_URL | `5432` | Database port |
| `DB_NAME` | If no DATABASE_URL | `care_commons` | Database name |
| `DB_USER` | If no DATABASE_URL | `postgres` | Database user |
| `DB_PASSWORD` | If no DATABASE_URL | - | Database password |
| `DB_SSL` | No | `false` | Enable SSL for database connection |
| **Authentication** |
| `JWT_ACCESS_SECRET` | Yes (prod) | - | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes (prod) | - | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRY` | No | `15m` | Access token expiration |
| `JWT_REFRESH_EXPIRY` | No | `7d` | Refresh token expiration |
| **Server** |
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment (`development`, `production`, `test`) |
| `CORS_ORIGIN` | Recommended | - | Comma-separated allowed origins |
| **External Services** |
| `VERCEL_TOKEN` | Yes (deploy) | - | Vercel API token |
| `VERCEL_ORG_ID` | Yes (deploy) | - | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Yes (deploy) | - | Vercel project ID |
| `SNYK_TOKEN` | Yes (security) | - | Snyk API token |
| `CODECOV_TOKEN` | Yes (coverage) | - | Codecov upload token |

---

## Quick Reference: Setup Checklist

### Local Development

- [ ] Install Node.js 22.x
- [ ] Install PostgreSQL 15+
- [ ] Create `.env` file with database credentials
- [ ] Run `npm install`
- [ ] Run `npm run db:migrate`
- [ ] Run `npm run dev`
- [ ] Test: `curl http://localhost:3000/health`

### GitHub Repository

- [ ] Add `DATABASE_URL` secret (production)
- [ ] Add `PREVIEW_DATABASE_URL` secret (preview)
- [ ] Add `VERCEL_TOKEN` secret
- [ ] Add `VERCEL_ORG_ID` secret
- [ ] Add `VERCEL_PROJECT_ID` secret
- [ ] Add `CODECOV_TOKEN` secret
- [ ] Add `SNYK_TOKEN` secret
- [ ] Enable branch protection for `main` and `preview`
- [ ] Require CI checks to pass before merging

### Vercel Project

- [ ] Link GitHub repository
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `public`
- [ ] Set Node.js version: 22.x
- [ ] Add production environment variables
- [ ] Add preview environment variables
- [ ] Test deployment to preview
- [ ] Test deployment to production
- [ ] Verify health check: `https://care-commons.vercel.app/health`

### Neon Database

- [ ] Create production database project
- [ ] Create preview database project
- [ ] Copy production connection string to GitHub Secrets
- [ ] Copy preview connection string to GitHub Secrets
- [ ] Enable connection pooling
- [ ] Test connection from local environment
- [ ] Run migrations on production
- [ ] Run migrations on preview

### Security & Monitoring

- [ ] Connect Snyk to repository
- [ ] Add Snyk token to GitHub Secrets
- [ ] Connect Codecov to repository
- [ ] Add Codecov token to GitHub Secrets
- [ ] Enable Dependabot alerts
- [ ] Configure GitHub security advisories

---

## Troubleshooting

### Database Connection Issues

**Error**: `ECONNREFUSED` or `Connection timeout`

**Solutions**:
1. Verify `DATABASE_URL` is correct
2. Check Neon database is running
3. Verify SSL mode: `?sslmode=require` for Neon
4. Test connection: `psql "$DATABASE_URL"`

### Vercel Deployment Failures

**Error**: `Module not found` or `Cannot find module`

**Solutions**:
1. Verify Node.js version is 22.x in `vercel.json`
2. Check ESM imports include `.js` extension
3. Run `npm run build` locally to verify
4. Check build logs in Vercel dashboard

### Health Check Failing

**Error**: Health check returns 404 or 500

**Solutions**:
1. Verify `vercel.json` rewrites are correct
2. Check `api/index.mts` exists and compiles
3. Test locally: `npm run build && node packages/app/dist/index.js`
4. Check Vercel function logs for errors

### Authentication Issues

**Error**: `Invalid token` or `Token expired`

**Solutions**:
1. Verify `JWT_ACCESS_SECRET` is set in Vercel
2. Regenerate secrets: `openssl rand -base64 32`
3. Update secrets in both GitHub and Vercel
4. Redeploy after updating secrets

---

## Security Best Practices

1. **Never commit** `.env` files or secrets to Git
2. **Rotate secrets** regularly (every 90 days recommended)
3. **Use different secrets** for each environment
4. **Enable 2FA** on all external accounts (GitHub, Vercel, Neon)
5. **Review Snyk alerts** weekly
6. **Monitor Vercel logs** for suspicious activity
7. **Use branch protection** to prevent direct commits to `main` and `preview`

---

## Support & Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Neon Documentation**: https://neon.tech/docs
- **GitHub Actions**: https://docs.github.com/actions
- **Snyk Documentation**: https://docs.snyk.io
- **Codecov Documentation**: https://docs.codecov.com

---

**Last Updated**: November 2025  
**Maintained By**: Neighborhood Lab  
**Repository**: https://github.com/neighborhood-lab/care-commons
