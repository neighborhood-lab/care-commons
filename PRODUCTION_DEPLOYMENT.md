# Production Deployment Guide - Vercel

## 🚨 CRITICAL: Required Environment Variables

Before merging to `main`, these environment variables **MUST** be set in the Vercel dashboard for production deployment. Without these, **user login will fail**.

### Required Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables → Production:

```bash
# 1. JWT Secrets (REQUIRED for authentication)
JWT_SECRET=<generate-with-command-below>
JWT_REFRESH_SECRET=<generate-with-command-below>

# 2. Encryption Key (REQUIRED for PHI fields like SSN)
ENCRYPTION_KEY=<generate-with-command-below>

# 3. Database URL (should already be set in GitHub Secrets)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# 4. Optional but recommended
NODE_ENV=production
ENVIRONMENT=production
CORS_ORIGIN=https://your-production-domain.vercel.app
```

### How to Generate Secrets

Run these commands locally to generate secure secrets:

```bash
# Generate JWT_SECRET (base64, 32+ characters)
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET (base64, 32+ characters)
openssl rand -base64 32

# Generate ENCRYPTION_KEY (hex, 32 bytes)
openssl rand -hex 32
```

**IMPORTANT:** 
- Save these secrets securely (password manager recommended)
- Use different values for each environment (production, preview, development)
- Never commit these to git

---

## ✅ Pre-Deployment Checklist

### 1. Verify Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Ensure ALL of the following are set for **Production** environment:

- [ ] `JWT_SECRET` (minimum 32 characters)
- [ ] `JWT_REFRESH_SECRET` (minimum 32 characters)
- [ ] `ENCRYPTION_KEY` (32-byte hex string)
- [ ] `DATABASE_URL` (PostgreSQL connection string with `?sslmode=require`)
- [ ] `NODE_ENV=production` (optional but recommended)
- [ ] `CORS_ORIGIN` (comma-separated list of allowed origins)

### 2. Verify GitHub Secrets

Go to GitHub → Settings → Secrets and variables → Actions

Ensure these repository secrets exist:

- [ ] `VERCEL_TOKEN`
- [ ] `VERCEL_ORG_ID`
- [ ] `VERCEL_PROJECT_ID`
- [ ] `DATABASE_URL` (production database)

### 3. Run Local Checks

Before merging to `main`, verify everything passes locally:

```bash
# Full check (includes build, lint, typecheck, tests, db setup)
./scripts/check.sh

# Or run individually:
npm run build
npm run lint
npm run typecheck
npm run test
```

All checks should pass with **zero errors** (warnings are acceptable).

### 4. Database Migration Status

Verify migrations are up to date:

```bash
# Check migration status
npm run db:migrate:status

# If needed, run migrations
npm run db:migrate
```

---

## 🚀 Deployment Process

### Automatic Deployment (Recommended)

1. **Merge `develop` to `main`:**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

2. **GitHub Actions will automatically:**
   - ✅ Run build and tests
   - ✅ Run database migrations (production)
   - ✅ Deploy to Vercel production
   - ✅ Pass environment variables from GitHub Secrets

3. **Monitor deployment:**
   - GitHub Actions: Check workflow status
   - Vercel Dashboard: Monitor build logs

### Manual Deployment (If Needed)

```bash
# Install Vercel CLI
npm install -g vercel@latest

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

---

## 🔍 Post-Deployment Verification

### 1. Health Check

Verify the API is healthy:

```bash
curl https://your-production-domain.vercel.app/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-03T...",
  "environment": "production",
  "database": {
    "status": "connected"
  }
}
```

### 2. Authentication Test

Test login endpoint:

```bash
curl -X POST https://your-production-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@carecommons.example",
    "password": "ChangeThisSecurePassword123!"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@carecommons.example",
      ...
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
}
```

**If you get a 500 error:** JWT secrets are not set correctly in Vercel.

### 3. Database Connection

Verify database is accessible from Vercel:

```bash
# Check health endpoint for database status
curl https://your-production-domain.vercel.app/health | jq '.database'
```

Should return:
```json
{
  "status": "connected",
  "responseTime": 50
}
```

---

## 👥 Creating Production Users

### Option 1: Run Demo Seed Script

Create demo users for Texas and Florida agencies:

```bash
# Set production database URL
export DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"

# Run demo seed script
npm run db:seed:demo
```

This creates:
- 2 organizations (Texas, Florida)
- Admin users for each organization
- Sample clients and caregivers
- Sample schedules and care plans

### Option 2: Create Users Manually

Use the API to create users programmatically:

```bash
# 1. Create organization (as super admin)
curl -X POST https://your-domain.vercel.app/api/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Home Health Agency",
    "stateCode": "TX",
    "timezone": "America/Chicago"
  }'

# 2. Create admin user (requires invite token or super admin)
# See packages/core/scripts/seed-tx-fl-demo.ts for reference
```

---

## 🐛 Troubleshooting

### Login Fails with 500 Error

**Symptom:** POST to `/api/auth/login` returns 500 Internal Server Error

**Cause:** Missing or invalid `JWT_SECRET` or `JWT_REFRESH_SECRET`

**Fix:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify `JWT_SECRET` is set for Production environment
3. Verify `JWT_REFRESH_SECRET` is set for Production environment
4. Ensure both are at least 32 characters long
5. Redeploy: `vercel --prod`

### Database Connection Fails

**Symptom:** Health check shows `"database": { "status": "disconnected" }`

**Cause:** Missing or incorrect `DATABASE_URL`

**Fix:**
1. Verify `DATABASE_URL` is set in Vercel Dashboard
2. Ensure it uses the **pooled connection string** (for serverless)
3. Ensure it includes `?sslmode=require` parameter
4. Example: `postgresql://user:pass@host.neon.tech:5432/db?sslmode=require`

### SSN/PHI Encryption Fails

**Symptom:** Errors when creating clients with SSN or other encrypted fields

**Cause:** Missing `ENCRYPTION_KEY`

**Fix:**
1. Generate key: `openssl rand -hex 32`
2. Add to Vercel Dashboard → Environment Variables → Production
3. Redeploy

### Build Fails

**Symptom:** Vercel build fails during deployment

**Fix:**
1. Check build command in `package.json`: `"vercel:build": "npm run build"`
2. Verify all tests pass locally: `./scripts/check.sh`
3. Check Vercel build logs for specific error
4. Ensure Node.js version is 22.x (specified in `package.json` engines)

### CORS Errors

**Symptom:** Browser requests fail with CORS error

**Fix:**
1. Set `CORS_ORIGIN` in Vercel Dashboard
2. Value should be comma-separated list of allowed origins
3. Example: `https://app.example.com,https://admin.example.com`
4. Redeploy

---

## 📊 Monitoring and Observability

### Vercel Dashboard

Monitor in Vercel Dashboard:
- Deployment status
- Build logs
- Function logs
- Performance metrics

### Health Endpoint

Set up monitoring to check `/health` endpoint:
- Should return 200 status
- Database should be "connected"
- Response time should be < 1000ms

### Error Tracking

Consider adding error tracking (optional):
- Sentry DSN in environment variables
- Configure in `packages/app/src/server.ts`

---

## 🔒 Security Checklist

- [ ] `JWT_SECRET` is at least 32 characters (64+ recommended)
- [ ] `JWT_REFRESH_SECRET` is different from `JWT_SECRET`
- [ ] `ENCRYPTION_KEY` is 32 bytes (64 hex characters)
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`)
- [ ] `CORS_ORIGIN` is set (not `*` wildcard)
- [ ] Secrets are stored in password manager
- [ ] Different secrets for each environment (prod, preview, dev)
- [ ] Never commit secrets to git

---

## 📝 User Login Credentials

### Demo Users (if `db:seed:demo` was run)

**Texas Agency Admin:**
- Email: `admin@texas-homehealth.example`
- Password: `ChangeThisSecurePassword123!`

**Florida Agency Admin:**
- Email: `admin@florida-homecare.example`
- Password: `ChangeThisSecurePassword123!`

### Production Users

For production, you should:
1. Create real user accounts with secure passwords
2. Use Google OAuth for authentication (recommended)
3. Set up proper user invitation flow
4. Change default passwords immediately

---

## 🎯 Success Criteria

Deployment is successful when:

1. ✅ Health check returns "healthy" status
2. ✅ Database shows "connected" status
3. ✅ Login endpoint returns JWT tokens
4. ✅ No errors in Vercel function logs
5. ✅ CORS allows your frontend origin
6. ✅ All CI/CD checks pass (build, lint, typecheck, tests)

---

## 📞 Support

If you encounter issues:

1. Check Vercel function logs in dashboard
2. Verify all environment variables are set
3. Review troubleshooting section above
4. Check GitHub Actions workflow logs
5. Ensure database migrations completed successfully

---

**Last Updated:** November 3, 2024  
**Vercel Node.js Runtime:** 22.x  
**ESM Architecture:** Required (maintained)
