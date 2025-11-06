# 🚀 Deployment Safety Checklist

This checklist is automatically referenced in deployment workflows to ensure safe deployments.

## ✅ Pre-Deployment (Required)

### All Environments
- [ ] All CI checks passing (lint, typecheck, test, build)
- [ ] Code reviewed and approved
- [ ] No known critical bugs in deployment branch
- [ ] Dependencies up to date and audited

### Preview Deployments
- [ ] `PREVIEW_DATABASE_URL` secret configured in GitHub
- [ ] Preview environment variables set in Vercel dashboard
- [ ] Test data available in preview database

### Production Deployments
- [ ] **CRITICAL**: Tested in preview environment first
- [ ] `DATABASE_URL` secret configured (production database)
- [ ] All required environment variables set in Vercel:
  - `JWT_SECRET` (32+ characters)
  - `JWT_REFRESH_SECRET` (32+ characters)  
  - `ENCRYPTION_KEY` (64 hex characters)
  - `NODE_ENV=production`
  - `CORS_ORIGIN` (production domain)
- [ ] Database backup completed (if running migrations)
- [ ] Rollback plan documented
- [ ] Stakeholders notified of deployment window

## 🔍 Migration Safety (If Applicable)

- [ ] Migrations tested locally
- [ ] Migrations tested in preview environment
- [ ] No destructive operations without data backup:
  - `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`
  - `ALTER TABLE ... DROP`
- [ ] Migration file naming follows convention: `YYYYMMDDHHMMSS_description.ts`
- [ ] Migrations are reversible (or rollback plan exists)

## 🧪 Post-Deployment Validation

### Preview Environment
- [ ] Deployment reachable (OAuth redirect working)
- [ ] Manual login test successful
- [ ] Health endpoint accessible after auth
- [ ] Core user flows tested manually

### Production Environment  
- [ ] Health endpoint returns 200 OK
- [ ] Database connection verified
- [ ] Frontend loads (no white screen)
- [ ] Login page accessible (client-side routing)
- [ ] Static assets loading (Vite build artifacts)
- [ ] API endpoints responding (ESM resolution working)
- [ ] Core user flows smoke tested

## 🚨 Critical Regression Tests

Based on **November 2025 production deployment lessons**, verify these do NOT regress:

1. **ESM Import Resolution**
   - ✅ Test: `/health` endpoint returns 200
   - ❌ Failure: Module resolution errors in serverless functions

2. **SPA Client-Side Routing**
   - ✅ Test: Direct navigation to `/login` works (no 404)
   - ❌ Failure: Routes return 404, need catch-all rewrite

3. **Admin User Authentication**
   - ✅ Test: Login with existing credentials succeeds
   - ❌ Failure: No admin user exists, cannot access system

4. **Database Schema Alignment**
   - ✅ Test: CRUD operations succeed without errors
   - ❌ Failure: Schema mismatch errors (missing columns, etc.)

## 🔄 Rollback Procedure

If critical issues detected post-deployment:

1. **Immediate**: Use Vercel dashboard to promote previous deployment
2. **Database**: If migrations ran, restore from backup (if destructive)
3. **Notify**: Alert stakeholders of rollback
4. **Document**: Log issue in GitHub Issues with root cause
5. **Fix Forward**: Create hotfix PR with proper testing

## 📊 Success Criteria

Deployment is considered successful when:

- ✅ All automated health checks pass
- ✅ Manual smoke tests complete without errors  
- ✅ No user-reported critical issues within 1 hour
- ✅ Monitoring shows normal system behavior

## 🛠️ Automated Safety Features

Our deployment pipeline includes:

1. **Pre-deployment checks**:
   - Migration safety validation (`validate-migrations-safety.sh`)
   - Database URL verification
   - Build and test execution

2. **Post-deployment validation**:
   - Automated health checks (`validate-deployment.sh`)
   - Environment-specific validation (OAuth-aware)
   - Critical endpoint verification

3. **Deployment controls**:
   - Manual approval required for production
   - Skip tests option (hotfix/rollback only)
   - Skip migrations option (emergencies)
   - Deployment type tracking (standard/hotfix/rollback)

---

**Last Updated**: November 2025  
**Owner**: Platform Team  
**Review Frequency**: After each production incident
