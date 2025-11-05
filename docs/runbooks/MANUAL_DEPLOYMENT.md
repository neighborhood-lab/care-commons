# Manual Deployment Runbook

**Use Case**: GitHub webhooks are failing or you need to deploy outside normal merge workflow

**Audience**: DevOps Engineers, Site Reliability Engineers, Technical Leads

**Last Updated**: 2025-11-05

---

## Prerequisites

- GitHub account with `write` permissions on the Care Commons repository
- Access to GitHub Actions
- Knowledge of current production/preview state
- Understanding of the deployment process

## When to Use Manual Deployment

Use manual deployment in these scenarios:

1. **GitHub Webhook Failures**: Webhooks not triggering automatic deployments
2. **Emergency Hotfixes**: Critical fixes that need to bypass normal PR process
3. **Rollback Required**: Need to revert to a previous deployment
4. **Testing Deployment Process**: Validating deployment changes
5. **Scheduled Deployments**: Deploying at specific times outside normal workflow

---

## Procedure: Manual Deployment via GitHub UI

### Step 1: Navigate to Actions

1. Go to [GitHub Actions](https://github.com/neighborhood-lab/care-commons/actions)
2. Click **"Deploy"** workflow in the left sidebar

### Step 2: Configure Deployment

1. Click **"Run workflow"** button (top right)
2. Select parameters carefully:

   **Branch**:
   - Select `main` for production deployments
   - Select `preview` for preview environment deployments

   **Environment**:
   - `production` - Live production environment
   - `preview` - Preview/staging environment

   **Deploy Type**:
   - `standard` - Normal deployment with all checks (recommended)
   - `hotfix` - Skip tests for emergency fixes (use sparingly!)
   - `rollback` - Requires deployment ID (use rollback workflow instead)

   **Skip Tests**:
   - Leave unchecked for standard deployments
   - Check only for emergency hotfixes
   - ⚠️ **Warning**: Skipping tests can introduce bugs

   **Run Migrations**:
   - Check if database schema changes are included
   - Uncheck only if migrations were already run separately

3. Click **"Run workflow"** (green button)

### Step 3: Monitor Deployment

1. Click on the workflow run to see live logs
2. Watch for these checkpoints:

   ```
   ✅ Build completes
   ✅ Tests pass (if not skipped)
   ✅ Migrations run successfully
   ✅ Vercel deployment succeeds
   ✅ Health check passes
   ```

3. Monitor timing for each phase:
   - Build: ~2-4 minutes
   - Tests: ~1-3 minutes
   - Migrations: ~10-30 seconds
   - Deployment: ~1-2 minutes
   - Health check: ~30-60 seconds

4. If any step fails:
   - Review error logs in the failed step
   - Check [Troubleshooting Guide](#troubleshooting) below
   - Consider rollback if necessary

### Step 4: Verify Deployment

#### Health Check

```bash
# Production
curl https://care-commons.vercel.app/health

# Preview
curl https://preview-care-commons.vercel.app/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "responseTime": 45
  }
}
```

#### Functional Testing

1. **Login Flow**:
   - Navigate to `/login`
   - Attempt authentication
   - Verify successful login

2. **Navigation**:
   - Test routing to major sections
   - Verify all pages load correctly

3. **API Endpoints**:
   - Test protected endpoints with valid token
   - Verify data retrieval works

4. **Critical Features**:
   - Test EVV check-in/check-out
   - Verify client management
   - Check caregiver scheduling

### Step 5: Post-Deployment Checklist

- [ ] Health endpoint returns 200 OK
- [ ] Login flow works correctly
- [ ] Database queries succeed
- [ ] No error spike in Vercel logs
- [ ] Performance metrics within normal range
- [ ] Critical features functioning
- [ ] Team notified of deployment

---

## Procedure: Manual Deployment via GitHub CLI

### Prerequisites

Install GitHub CLI if not already installed:

```bash
# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Or download from: https://cli.github.com/
```

### Authentication

```bash
gh auth login
```

Follow the prompts to authenticate with your GitHub account.

### Deploy to Preview

```bash
gh workflow run deploy.yml \
  --ref preview \
  -f environment=preview \
  -f deploy_type=standard \
  -f skip_tests=false \
  -f run_migrations=true
```

### Deploy to Production

```bash
gh workflow run deploy.yml \
  --ref main \
  -f environment=production \
  -f deploy_type=standard \
  -f skip_tests=false \
  -f run_migrations=true
```

### Emergency Hotfix (Skip Tests)

```bash
gh workflow run deploy.yml \
  --ref main \
  -f environment=production \
  -f deploy_type=hotfix \
  -f skip_tests=true \
  -f run_migrations=false
```

### Monitor Workflow

```bash
# Watch latest workflow run
gh run watch

# List recent runs
gh run list --workflow=deploy.yml --limit 5

# View specific run
gh run view <run-id>
```

---

## Emergency Rollback

If deployment fails or introduces critical issues:

### Via Rollback Workflow (Recommended)

1. Go to [GitHub Actions](https://github.com/neighborhood-lab/care-commons/actions)
2. Click **"Emergency Rollback"** workflow
3. Click **"Run workflow"**
4. Fill in parameters:
   - **Environment**: `production` or `preview`
   - **Deployment ID**: Get from Vercel dashboard (see below)
   - **Reason**: Brief description of issue
5. Click **"Run workflow"**

### Finding Deployment ID

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select Care Commons project
3. Click **"Deployments"** tab
4. Find last working deployment
5. Copy deployment ID (URL segment or shown in details)

### Via GitHub CLI

```bash
gh workflow run rollback.yml \
  -f environment=production \
  -f deployment_id=<deployment-id> \
  -f reason="Critical bug causing data loss"
```

### Via Vercel Dashboard (Alternative)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select Care Commons project
3. Click **"Deployments"** tab
4. Find last working deployment
5. Click **"..."** menu → **"Promote to Production"**

---

## Troubleshooting

### Deployment Fails with "DATABASE_URL not set"

**Symptoms**:
- Workflow fails during database verification step
- Error message: "DATABASE_URL secret is not set"

**Diagnosis**:
```bash
# List all secrets
gh secret list

# Check if DATABASE_URL exists
gh secret list | grep DATABASE_URL
```

**Resolution**:
1. Go to GitHub → Settings → Secrets and variables → Actions
2. Check if `DATABASE_URL` (production) or `PREVIEW_DATABASE_URL` (preview) exists
3. If missing, add the secret:
   ```bash
   gh secret set DATABASE_URL
   # Paste the database URL when prompted
   ```
4. Re-run the deployment

**Prevention**:
- Run environment audit script before deployment:
  ```bash
  ./scripts/audit-env-config.sh
  ```

### Health Check Fails After Deployment

**Symptoms**:
- Deployment completes successfully
- Health endpoint returns 500 or times out
- Application not accessible

**Diagnosis**:
```bash
# Check Vercel function logs
vercel logs care-commons --prod

# Test database connectivity directly
psql $DATABASE_URL -c "SELECT 1"

# Check environment variables in Vercel
vercel env ls --environment production
```

**Resolution**:

1. **Database Connection Issue**:
   ```bash
   # Verify database is accessible
   psql $DATABASE_URL -c "SELECT version();"

   # Check for connection pooling limits
   # Check Neon dashboard for connection count
   ```

2. **Environment Variable Issue**:
   ```bash
   # List Vercel environment variables
   vercel env ls

   # Pull latest environment config
   vercel env pull
   ```

3. **Function Error**:
   - Review Vercel function logs for stack traces
   - Check for unhandled promise rejections
   - Verify all dependencies are installed

4. **If issue persists**:
   - Consider rollback
   - Contact database administrator

### Migration Fails

**Symptoms**:
- Deployment fails during "Run Database Migrations" step
- Error in migration script
- Database schema incompatible

**Diagnosis**:
```bash
# Check migration logs in GitHub Actions
# Review migration file syntax
cat packages/core/migrations/<migration-file>.ts

# Test migration locally
npm run db:migrate
```

**Resolution**:

1. **Syntax Error in Migration**:
   - Fix syntax error in migration file
   - Commit fix
   - Re-run deployment

2. **Migration Already Applied**:
   - Check migration history in database
   - Update migration timestamp if needed

3. **Incompatible Schema Change**:
   - May require manual database intervention
   - Contact database administrator
   - Consider creating compensating migration

4. **Database Lock**:
   - Check for long-running queries
   - Wait for lock to release
   - Re-run deployment

### Tests Failing

**Symptoms**:
- Deployment fails during "Run tests" step
- Test suite errors

**Diagnosis**:
```bash
# Run tests locally
npm run test

# Run with verbose output
npm run test -- --verbose
```

**Resolution**:

1. **Fix test failures locally**
2. Commit fixes
3. Re-run deployment
4. If urgent, use hotfix mode (skip tests) but create follow-up issue to fix tests

### Workflow Not Triggering

**Symptoms**:
- Click "Run workflow" but nothing happens
- No workflow run appears in Actions tab

**Diagnosis**:
```bash
# Check workflow syntax
gh workflow view deploy.yml

# List recent workflow runs
gh run list --workflow=deploy.yml

# Check repository permissions
gh api repos/neighborhood-lab/care-commons/collaborators/<username>/permission
```

**Resolution**:
1. Verify you have write permissions on repository
2. Check GitHub Actions quota/limits
3. Verify workflow file syntax is valid
4. Try triggering via CLI instead

---

## Best Practices

### Pre-Deployment

1. **Always check current state**:
   ```bash
   # Check what's currently deployed
   vercel ls --prod

   # Review recent commits
   git log -5 --oneline
   ```

2. **Test in preview first**:
   - Deploy to preview environment
   - Verify functionality
   - Then promote to production

3. **Communicate with team**:
   - Notify in Slack/Discord
   - Document reason for manual deployment
   - Update team on progress

### During Deployment

1. **Monitor actively**:
   - Watch logs in real-time
   - Don't navigate away during deployment
   - Keep Vercel dashboard open

2. **Have rollback plan ready**:
   - Know last working deployment ID
   - Keep rollback workflow bookmarked
   - Be prepared to execute rollback

### Post-Deployment

1. **Verify thoroughly**:
   - Don't just check health endpoint
   - Test critical user flows
   - Monitor error rates

2. **Document**:
   - Note deployment time
   - Document any issues encountered
   - Update team on completion

3. **Monitor**:
   - Watch error logs for 15-30 minutes
   - Check performance metrics
   - Be ready to rollback if issues arise

---

## Support Contacts

- **Deployment Issues**: ops@carecommons.org
- **Database Issues**: dba@carecommons.org
- **Emergency (production down)**: emergency@carecommons.org
- **Security Issues**: security@carecommons.org

---

## Related Documentation

- [Main Deployment Guide](../DEPLOYMENT.md)
- [Database Migration Guide](../DATABASE_MIGRATIONS.md)
- [Rollback Procedures](./ROLLBACK.md)
- [Monitoring & Alerts](./MONITORING.md)

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2025-11-05 | Claude | Initial creation as part of repository hardening |
