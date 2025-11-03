# Vercel Production Deployment Checklist

## Critical Environment Variables Required

The following environment variables **MUST** be set in Vercel for production deployment:

### Database
- `DATABASE_URL` - PostgreSQL connection string (required)
  - Format: `postgresql://user:password@host:5432/database?sslmode=require`
  - Use Neon's pooled connection string for serverless

### Authentication (Required for login)
- `JWT_SECRET` - Must be at least 32 characters
  - Generate: `openssl rand -base64 32`
- `JWT_REFRESH_SECRET` - Must be at least 32 characters
  - Generate: `openssl rand -base64 32`

### Encryption (Required for PHI)
- `ENCRYPTION_KEY` - 32-byte hex key for encrypting sensitive fields (SSN, etc.)
  - Generate: `openssl rand -hex 32`

### Optional (but recommended for production)
- `GOOGLE_CLIENT_ID` - For Google OAuth authentication
- `GOOGLE_CLIENT_SECRET` - For Google OAuth authentication
- `CORS_ORIGIN` - Comma-separated list of allowed origins
- `NODE_ENV` - Set to `production`
- `ENVIRONMENT` - Set to `production`

## Vercel Configuration Status

✅ Node.js version: 22.x (specified in package.json engines)
✅ ESM architecture: Maintained throughout (.mts entry point, type: module)
✅ Build command: `npm run build`
✅ Serverless function: `/api/index.mts` configured in vercel.json
✅ Health endpoint: `/health` rewrite configured
✅ API routes: `/api/:path*` rewrite configured

## Pre-Deployment Steps

1. Verify all environment variables are set in Vercel dashboard:
   - Settings → Environment Variables
   - Ensure they are set for "Production" environment

2. Run local checks:
   ```bash
   npm run build
   npm run lint
   npm run typecheck
   npm run test
   ./scripts/check.sh
   ```

3. Verify database migrations are up to date:
   ```bash
   npm run db:migrate
   ```

## Post-Deployment Verification

1. Check health endpoint:
   ```bash
   curl https://your-domain.vercel.app/health
   ```

2. Test authentication:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'
   ```

3. Verify database connection in health check response

## Common Issues

### Login fails with 500 error
- **Cause**: Missing JWT_SECRET or JWT_REFRESH_SECRET
- **Fix**: Add these environment variables in Vercel dashboard

### Database connection fails
- **Cause**: Missing or incorrect DATABASE_URL
- **Fix**: Verify DATABASE_URL is set and uses pooled connection string

### SSN encryption fails
- **Cause**: Missing ENCRYPTION_KEY
- **Fix**: Generate and add ENCRYPTION_KEY environment variable

## GitHub Actions Workflow

The deployment workflow in `.github/workflows/deploy.yml`:
1. ✅ Runs build and tests
2. ✅ Runs database migrations (using DATABASE_URL secret)
3. ✅ Deploys to Vercel production with environment variables

Make sure these GitHub Secrets are set:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DATABASE_URL`

## User Login Credentials

Production login will work with:
- Any user created in the production database
- Email/password authentication endpoint: `POST /api/auth/login`
- Google OAuth authentication endpoint: `POST /api/auth/login/google`

To create initial users, run the demo seed script after deployment:
```bash
DATABASE_URL=<production_url> npm run db:seed:demo
```

This creates test users for Texas and Florida agencies.
