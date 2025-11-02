# Deployment Quick Start

**5-minute setup guide for Care Commons deployments**

## Prerequisites Checklist

- [ ] GitHub account with admin access to repository
- [ ] Vercel account ([signup](https://vercel.com/signup))
- [ ] Neon PostgreSQL account ([signup](https://neon.tech/signup))

## Step 1: Create Vercel Token (2 minutes)

1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Settings:
   - Name: `care-commons-github-actions`
   - Scope: **Full Account**
   - Expiration: No Expiration
4. Click **"Create"**
5. **⚠️ COPY TOKEN IMMEDIATELY** (you won't see it again!)

## Step 2: Link Vercel Project (1 minute)

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link project
cd /path/to/care-commons
vercel link

# Get your IDs
cat .vercel/project.json
```

Copy these values:
- `orgId` → This is your `VERCEL_ORG_ID`
- `projectId` → This is your `VERCEL_PROJECT_ID`

## Step 3: Add GitHub Secrets (2 minutes)

Go to: **GitHub → Your Repo → Settings → Secrets and variables → Actions**

Click **"New repository secret"** and add each:

| Secret Name | Value | Where to Get It |
|------------|-------|-----------------|
| `VERCEL_TOKEN` | *(paste token from Step 1)* | From Step 1 |
| `VERCEL_ORG_ID` | `team_xxxx...` | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `prj_xxxx...` | From `.vercel/project.json` |
| `DATABASE_URL` | `postgresql://user:pass@host/db` | Neon production DB |
| `STAGING_DATABASE_URL` | `postgresql://user:pass@host/db_staging` | Neon staging DB |

### Database URLs (Neon)

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Click **"Connection Details"**
4. Copy **"Pooled connection"** string (NOT direct connection!)
5. Format: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech:5432/dbname?sslmode=require`

## Step 4: Test Deployment

**Option A: Open a Pull Request**
- Create a branch, make a change, open PR
- GitHub Actions will automatically deploy a preview
- Check Actions tab for deployment status

**Option B: Manual Workflow**
1. Go to **Actions** tab in GitHub
2. Select **"Deploy"** workflow
3. Click **"Run workflow"**
4. Select environment: `staging`
5. Click **"Run workflow"**

## Verify Setup

### Check GitHub Secrets
Go to: Settings → Secrets and variables → Actions

You should see:
- ✅ VERCEL_TOKEN
- ✅ VERCEL_ORG_ID  
- ✅ VERCEL_PROJECT_ID
- ✅ DATABASE_URL
- ✅ STAGING_DATABASE_URL

### Check Workflow Status
1. Go to **Actions** tab
2. Look for running/completed workflows
3. Click on a workflow to view logs

## Common Issues

### ❌ "No existing credentials found"
**Problem:** Missing or invalid `VERCEL_TOKEN`

**Fix:**
1. Verify secret exists in GitHub
2. Create new token at [vercel.com/account/tokens](https://vercel.com/account/tokens)
3. Update GitHub secret

### ❌ "Project not found"
**Problem:** Invalid `VERCEL_PROJECT_ID` or `VERCEL_ORG_ID`

**Fix:**
1. Run `vercel link` locally
2. Check `.vercel/project.json` for correct IDs
3. Update GitHub secrets

### ❌ "Database connection failed"
**Problem:** Invalid database URL or connection issues

**Fix:**
1. Verify using **pooled** connection string (contains `-pooler-`)
2. Check `?sslmode=require` is at end of URL
3. Test locally: `psql $DATABASE_URL`

## Environment Variable Names

**CRITICAL:** Use exact names (case-sensitive)

```bash
# Vercel (required)
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID

# Database (required)
DATABASE_URL
STAGING_DATABASE_URL

# Optional
JWT_SECRET
STAGING_JWT_SECRET
ENCRYPTION_KEY
CODECOV_TOKEN
SNYK_TOKEN
```

## Deployment Workflow

### Preview (PR)
```
Open PR → Auto deploy → Comment with URL
```

### Staging (develop branch)
```
Push to develop → Auto deploy → Run migrations
```

### Production (main branch)
```
Push to main → Auto deploy → Run migrations → Health check
```

## Quick Commands

```bash
# Deploy preview
vercel

# Deploy production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs <deployment-url>

# Run migrations
export DATABASE_URL="your-connection-string"
npm run db:migrate

# Check migration status
npm run db:migrate:status
```

## Health Check

After deployment, verify:
```bash
curl https://your-deployment.vercel.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-01T12:00:00Z",
  "database": {
    "status": "connected"
  }
}
```

## Resources

- Full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)
- Neon docs: [neon.tech/docs](https://neon.tech/docs)
- GitHub Actions: [GITHUB_ACTIONS.md](./GITHUB_ACTIONS.md)

## Support

If stuck:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section
2. Review GitHub Actions logs
3. Check Vercel deployment logs
4. Open GitHub issue with error details

---

**Last updated:** November 2024
