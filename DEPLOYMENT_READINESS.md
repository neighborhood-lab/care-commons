# Deployment Readiness Guide

This document outlines the critical checks and procedures for deploying to Vercel preview and production environments.

## Critical Lessons from November 2025 Production Deployment

The following issues were resolved to achieve successful production deployment. **NEVER regress on these:**

### 1. ESM Import Resolution in Vercel Serverless ✅

**Problem**: Node.js serverless functions failed with module resolution errors.

**Solution**:
- Added `tsc-alias` to all packages to append `.js` extensions to relative imports
- All `package.json` build scripts: `tsc && tsc-alias -p tsconfig.json`
- All `tsconfig.json` files include tsc-alias config
- API entry point (`api/index.ts`) imports from compiled `dist/` directory

**Test**: Health check at `/health` must return 200 with database connection status.

### 2. SPA Client-Side Routing ✅

**Problem**: Direct navigation to routes like `/login` returned 404.

**Solution**: Added catch-all rewrite in `vercel.json`:
```json
{"source": "/(.*)", "destination": "/index.html"}
```

**Test**: All frontend routes must be directly accessible via URL.

### 3. Admin User Authentication ✅

**Problem**: No admin user existed in production database.

**Solution**: Created temporary seed endpoint, then immediately removed after use.

**Security**: NEVER deploy unauthenticated admin creation endpoints to production.

**Test**: Login at `/login` with `admin@carecommons.example` must work.

### 4. Database Schema Alignment ✅

**Problem**: Production database schema didn't match code expectations.

**Solution**: Ensured migrations run before deployment, verified schema.

**Implementation**: Organizations table requires `primary_address`, `created_by`, `updated_by`.

**Test**: All database operations must succeed without schema errors.

## Pre-Deployment Checklist

Run this script before any deployment:

```bash
./scripts/deployment-readiness-check.sh
```

This comprehensive script validates:

### 1. ESM Architecture
- ✅ `package.json` has `type: "module"`
- ✅ `package.json` has `node: "22.x"`
- ✅ All packages use `tsc-alias` in build scripts
- ✅ API entry point imports from `dist/`

### 2. Vercel Configuration
- ✅ Configuration validates via `validate-vercel-config.ts`
- ✅ `vercel.json` includes dist in functions
- ✅ Security headers configured
- ✅ SPA rewrites configured
- ✅ Health endpoint rewrite configured

### 3. Build & Type Safety
- ✅ Lint passes (warnings allowed)
- ✅ TypeCheck passes (zero errors)
- ✅ Build succeeds
- ✅ Tests pass

### 4. Database Readiness
- ✅ Migration files exist
- ✅ Seed scripts exist
- ✅ No destructive operations in migrations

### 5. Regression Tests
- ✅ Server module imports (ESM resolution)
- ✅ Authentication flow tests
- ✅ Health check endpoint tests

### 6. Security
- ✅ No hardcoded secrets in code
- ✅ Security headers in Vercel config
- ✅ Environment variables configured in Vercel

## Branching & Deployment Strategy

```
feature/* → develop → preview → production
```

### Branch Purposes
- **`feature/*` branches**: Development work, no deployment
- **`develop` branch**: Integration testing, **NEVER deployed**
- **`preview` branch**: Pre-production validation, deploys to Vercel preview
- **`production` branch**: Production, deploys to Vercel production

### Deployment Process

#### 1. Deploy to Preview

```bash
# Ensure you're on develop and up-to-date
git checkout develop
git pull origin develop

# Ensure all checks pass
./scripts/deployment-readiness-check.sh

# Fast-forward preview to develop
git checkout preview
git merge --ff-only develop
git push origin preview

# Monitor GitHub Actions deploy workflow
```

#### 2. Deploy to Production

```bash
# Ensure preview is stable and tested
# Ensure you're on develop and up-to-date
git checkout develop
git pull origin develop

# Ensure all checks pass
./scripts/deployment-readiness-check.sh

# Fast-forward production to develop
git checkout production
git merge --ff-only develop
git push origin production

# Monitor GitHub Actions deploy workflow
```

## Critical Regression Tests

The following tests **must pass** before deployment:

### ESM Import Resolution
```bash
npm run test -- src/__tests__/regression.test.ts
```

Tests that serverless functions can import compiled modules.

### Health Check Endpoint
```bash
curl https://care-commons.vercel.app/health
```

Should return 200 with:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "..."
}
```

### SPA Routing
All routes should be directly accessible:
- `/` - Main app
- `/login` - Login page
- `/dashboard` - Dashboard (requires auth)

### Authentication Flow
Login must work end-to-end with seeded admin user.

## Environment Variables

### Required in Vercel

#### Preview Environment
- `DATABASE_URL` - Preview database (Neon branch)
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV` - Set to `production`
- `ENVIRONMENT` - Set to `preview`

#### Production Environment
- `DATABASE_URL` - Production database
- `JWT_SECRET` - JWT signing secret (different from preview!)
- `NODE_ENV` - Set to `production`
- `ENVIRONMENT` - Set to `production`

## Post-Deployment Validation

After deployment completes, run these checks:

### 1. Health Check
```bash
./scripts/validate-deployment.sh https://care-commons.vercel.app production
```

### 2. Manual Smoke Tests
1. Visit the deployment URL
2. Verify login works
3. Navigate through main app sections
4. Check for console errors
5. Verify database queries work

### 3. Monitor Vercel Logs
```bash
vercel logs --follow
```

## Rollback Procedure

If deployment fails:

### Quick Rollback
```bash
git checkout production  # or preview
git reset --hard HEAD~1  # Go back one commit
git push --force origin production  # or preview
```

### Vercel Instant Rollback
1. Go to Vercel dashboard
2. Find the previous successful deployment
3. Click "Promote to Production"

## Common Deployment Issues

### Issue: ESM Import Errors

**Symptom**: `Cannot find module` errors in serverless functions

**Fix**:
1. Ensure `tsc-alias` is in build scripts
2. Verify `api/index.ts` imports from `dist/`
3. Check all `tsconfig.json` files have tsc-alias config

### Issue: 404 on Routes

**Symptom**: Direct navigation to routes returns 404

**Fix**:
1. Verify SPA fallback in `vercel.json`
2. Ensure `{"source": "/(.*)", "destination": "/index.html"}` exists
3. Check route is last in rewrites array

### Issue: Database Connection Fails

**Symptom**: Health check fails, `/health` returns 500

**Fix**:
1. Verify `DATABASE_URL` is set in Vercel environment
2. Check Neon database is running
3. Verify migrations have been applied
4. Test database connection locally with same URL

### Issue: Login Fails

**Symptom**: Login returns 401 or 500

**Fix**:
1. Verify `JWT_SECRET` is set in Vercel
2. Check admin user exists in database
3. Verify password hashing matches
4. Check for CORS issues

## Monitoring

### Metrics to Watch
- Response time (< 200ms for API)
- Error rate (< 0.1%)
- Database connection pool usage
- Memory usage in serverless functions

### Alerts
Set up alerts for:
- Health check failures
- Error rate spikes
- Slow response times
- Database connection failures

## Security Notes

### Before Deploying
- ✅ No secrets in code
- ✅ Environment variables configured in Vercel
- ✅ Security headers enabled
- ✅ CORS configured correctly
- ✅ Rate limiting enabled
- ✅ SQL injection prevention (parameterized queries)

### After Deploying
- 🔒 Rotate JWT_SECRET if exposed
- 🔒 Monitor for unauthorized access
- 🔒 Review Vercel access logs
- 🔒 Check for SQL injection attempts

## Reference

- [Vercel Deployment Docs](https://vercel.com/docs)
- [GitHub Actions Deploy Workflow](.github/workflows/deploy.yml)
- [Vercel Configuration](vercel.json)
- [ESM Architecture](ESM_ARCHITECTURE.md) *(if exists)*
- [API Documentation](docs/API_DOCUMENTATION.md)

---

**Last Updated**: November 15, 2025  
**Next Review**: Before next production deployment
