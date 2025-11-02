# Deployment Workflow Guide

This document explains when and how deployments happen in the Care Commons project.

**Note:** This project uses **Vercel Hobby Plan** with two environments:
- **Production** (Vercel production environment) ← `main` branch
- **Preview** (Vercel preview environment) ← `develop` branch
- **Development** (local only) ← not deployed to Vercel

## Deployment Triggers

### ✅ What Triggers Deployments

| Event | Branch | Deployment Type | Vercel Environment |
|-------|--------|----------------|-------------|
| Push to `main` | `main` | **Production** | Production |
| Push to `develop` | `develop` | **Preview** | Preview |
| Manual workflow dispatch | Any | **Production** | Production |

### ❌ What Does NOT Trigger Deployments

| Event | Why |
|-------|-----|
| Push to feature branches | Feature branches are not deployment targets |
| Pull requests (any branch) | PRs do not trigger deployments - only merges/pushes to main or develop |
| Push to any branch except `main` or `develop` | Only main/develop are deployment branches |

## Workflow Behavior

### Feature Branch Workflow

```bash
# Working on a feature branch
git checkout -b feature/new-feature

# Push to feature branch
git push origin feature/new-feature

# ❌ NO deployment happens
# ✅ CI checks run (lint, test, build)
```

**Result:** No deployment. Only CI checks run.

### Pull Request to develop

```bash
# Create PR from feature branch to develop
gh pr create --base develop --head feature/new-feature

# ❌ NO deployment happens
# ✅ CI checks run (lint, test, build)
```

**Result:** No deployment - PRs do not trigger deployments

### Merge to develop (Preview Deployment)

```bash
# Merge PR to develop
gh pr merge <pr-number> --squash

# ✅ Push to develop triggers preview deployment
# ✅ Database migrations run
# ✅ Health check performed
```

**Result:** Preview deployment at Vercel preview environment URL

### Merge to main (Production Deployment)

```bash
# Merge PR to main
gh pr merge <pr-number> --squash

# ✅ Push to main triggers production deployment
# ✅ Database migrations run
# ✅ Health check performed
# ✅ Production deployed
```

**Result:** Production deployment at configured production URL

### Manual Deployment

```bash
# Trigger via GitHub UI or gh CLI
gh workflow run deploy.yml -f environment=staging

# ✅ Deploys to chosen environment
# ✅ Can be run on any branch
# ✅ Useful for hotfixes or emergency deployments
```

**Result:** Deployment to specified environment (production or staging)

## Job Conditions

### Build Job

**Runs on:**
- ✅ All push events to `main` or `develop`
- ✅ All PRs to `main` or `develop`
- ✅ Manual workflow dispatch

**Purpose:**
- Builds all packages
- Runs tests
- Creates artifacts for deployment jobs

### Deploy Preview Job

**Runs when:**
```yaml
if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
```

**Conditions:**
- ✅ Only on pushes to `develop` branch
- ❌ NOT on pull requests
- ❌ NOT on feature branches

**Purpose:**
- Deploy preview environment when code is merged to develop
- Run database migrations
- Health check verification
- Test changes before promoting to production

### Deploy Production Job

**Runs when:**
```yaml
if: |
  (github.event_name == 'push' && github.ref == 'refs/heads/main') ||
  (github.event_name == 'workflow_dispatch')
```

**Conditions:**
- ✅ Push to `main` branch
- ✅ Manual workflow dispatch
- ❌ NOT on pull requests
- ❌ NOT on feature branches

**Purpose:**
- Deploy latest `main` code to production
- Run database migrations
- Health check verification
- Optional: Seed demo data (manual dispatch only)

## Common Scenarios

### Scenario 1: Working on a Feature

```bash
# 1. Create feature branch
git checkout -b feature/add-reporting

# 2. Make changes and commit
git commit -m "add reporting feature"

# 3. Push to feature branch
git push origin feature/add-reporting

# Result: ❌ No deployment
#         ✅ No PR = no preview deployment
```

### Scenario 2: Opening a PR to develop

```bash
# 1. Create PR
gh pr create --base develop --head feature/add-reporting

# Result: ❌ No deployment
#         ✅ CI checks run (lint, test, build)
#         ✅ Can review code before merging
```

### Scenario 3: Merging PR to develop

```bash
# 1. Merge PR
gh pr merge <pr-number> --squash

# Result: ✅ Preview deployment triggered (on develop branch)
#         ✅ Database migrations run
#         ✅ Available at preview URL
```

### Scenario 4: Promoting develop to main (Production)

```bash
# 1. Create PR from develop to main (or merge directly)
git checkout main
git merge develop
git push origin main

# Result: ✅ Production deployment triggered
#         ✅ Database migrations run
#         ✅ Available at production URL
```

### Scenario 5: Hotfix to Production

```bash
# 1. Create hotfix branch from main
git checkout -b hotfix/critical-bug main

# 2. Fix and commit
git commit -m "fix critical security issue"

# 3. Push and create PR to main
git push origin hotfix/critical-bug
gh pr create --base main --head hotfix/critical-bug

# Result: ✅ Preview deployment created for review

# 4. After approval, merge to main
gh pr merge <pr-number> --squash

# Result: ✅ Production deployment triggered immediately
```

### Scenario 6: Emergency Manual Deployment

```bash
# If urgent deployment needed without going through PR process
gh workflow run deploy.yml -f environment=production

# Result: ✅ Immediate deployment to production
#         ⚠️  Should be used rarely and with caution
```

## Environment Protection

### Production Environment

**Protection rules recommended:**
- ✅ Require reviewers (1-2 people)
- ✅ Restrict to `main` branch only
- ✅ Require status checks to pass
- ✅ Enable deployment protection rules

**Set in GitHub:**
Settings → Environments → production → Add protection rules

### Preview Environment

**Protection rules recommended:**
- ✅ Restrict to `develop` branch and PRs to develop
- ✅ Require status checks to pass
- ⚠️  Reviewers optional (faster iteration)
- ✅ Used for testing before production

### Development Environment

**Local only:**
- ⚠️  Not deployed to Vercel
- ✅ Linked to local machine via `vercel dev`
- ✅ Uses local database or development database

## Verification

### Check Deployment Trigger

Before pushing, verify what will happen:

```bash
# Current branch
git branch --show-current

# If on main → Production deployment
# If on develop → Preview deployment  
# If on feature/* → No deployment
```

### Monitor Deployments

```bash
# Watch GitHub Actions
gh run list --workflow=deploy.yml

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

## Troubleshooting

### Deployment didn't trigger

**Check:**
1. Are you on `main` or `develop` branch?
2. Did you push the changes?
3. Is the workflow file correct?
4. Check GitHub Actions tab for errors

### Unexpected deployment

**Check:**
1. Which branch triggered it?
2. Was it a push or PR?
3. Review workflow conditions

### Want to prevent deployment

**Options:**
1. Work on feature branch (no auto-deploy)
2. Use `[skip ci]` in commit message (skips all workflows)
3. Don't merge to `main`/`develop` yet

## Best Practices

1. **Never push directly to `main`**
   - Always use PRs
   - Get code review
   - Test in preview deployment first

2. **Test in preview before production**
   - Merge to `develop` first
   - Verify in preview environment
   - Then merge to `main`

3. **Use feature branches**
   - Keep `main` and `develop` protected
   - Work on feature/* branches
   - Merge via PRs only

4. **Review preview deployments**
   - Test functionality in preview
   - Check for errors
   - Verify database migrations

5. **Monitor production deployments**
   - Watch health checks
   - Monitor error logs
   - Have rollback plan ready

## Summary

| Branch Type | Push | PR Created | PR Merged | Vercel Environment |
|------------|------|------------|-----------|------------|
| `feature/*` | ❌ No | ❌ No | - | None |
| `develop` | ✅ Preview | ❌ No | ✅ Preview | Preview |
| `main` | ✅ Production | ❌ No | ✅ Production | Production |

**Key Principles:** 
- Only `main` (production) and `develop` (preview) branches trigger automatic deployments on push
- **Pull requests do NOT trigger deployments** - only actual merges/pushes to main or develop
- Feature branches never auto-deploy
- PRs are only accepted to `develop`, not `main`

---

**Last Updated:** November 2024
