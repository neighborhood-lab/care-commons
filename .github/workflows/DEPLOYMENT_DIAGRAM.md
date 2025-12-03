# Deployment Flow Diagram

**Vercel Hobby Plan Configuration:**
- **Production** environment ← `main` branch (pushes only)
- **Preview** environment ← `develop` branch (pushes only)
- **Development** environment ← local only (not in GitHub workflows)
- **Note:** Pull requests do NOT trigger deployments

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Workflow Triggers                     │
└─────────────────────────────────────────────────────────────────┘

FEATURE BRANCH WORKFLOW:
┌────────────────┐
│ feature/new    │
│    branch      │
└────────┬───────┘
         │
         │ git push origin feature/new
         │
         ▼
    ┌─────────┐
    │ GitHub  │ → ❌ NO Deployment
    │ Actions │ → ✅ CI Checks (lint, test, build)
    └─────────┘


PULL REQUEST WORKFLOW (to develop only):
┌────────────────┐
│ feature/new    │
│    branch      │
└────────┬───────┘
         │
         │ gh pr create --base develop
         │
         ▼
    ┌─────────┐
    │   PR    │ → ❌ NO Deployment
    │  Open   │ → ✅ CI Checks (lint, test, build)
    └────┬────┘
         │
         │ Review & Approve
         │
         ▼
    ┌─────────┐
    │ Merge   │
    │   to    │
    │ develop │
    └────┬────┘
         │
         ▼


PREVIEW DEPLOYMENT WORKFLOW (develop branch):
┌────────────────┐
│    develop     │ ← Merge from feature branch
│    branch      │
└────────┬───────┘
         │
         │ Automatic trigger on push
         │
         ▼
    ┌─────────────────┐
    │ Deploy Preview  │ → ✅ Run migrations
    │      Job        │ → ✅ Deploy to Vercel Preview
    └────────┬────────┘ → ✅ Health check
             │
             ▼
    ┌──────────────────────────┐
    │  Preview Environment     │
    │ (Vercel Preview Env)     │
    │ preview-xyz.vercel.app   │
    └──────────────────────────┘


PRODUCTION DEPLOYMENT WORKFLOW:
┌────────────────┐
│    develop     │
│    branch      │
└────────┬───────┘
         │
         │ Merge to main (direct or via PR)
         │
         ▼
┌────────────────┐
│      main      │ ← Merge from develop
│     branch     │
└────────┬───────┘
         │
         │ Automatic trigger on push
         │
         ▼
    ┌──────────────────┐
    │ Deploy Production│ → ✅ Run migrations
    │       Job        │ → ✅ Deploy to Vercel Production
    └────────┬─────────┘ → ✅ Health check
             │
             ▼
    ┌──────────────────────────┐
    │ Production Environment   │
    │ (Vercel Production Env)  │
    │   folkcare.app       │
    └──────────────────────────┘
```

## Decision Tree

```
┌─────────────────────────────────────────────────┐
│        What happens when I push code?           │
└─────────────────────────────────────────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │ Which branch?    │
            └──────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
    ┌────────┐  ┌─────────┐  ┌──────────┐
    │  main  │  │ develop │  │ feature/*│
    └────┬───┘  └────┬────┘  └────┬─────┘
         │           │            │
         ▼           ▼            ▼
    ┌─────────┐ ┌─────────┐ ┌──────────┐
    │Production│ │ Preview │ │ NO Deploy│
    │  Deploy  │ │  Deploy │ │ CI Only  │
    │ (Vercel) │ │ (Vercel)│ │          │
    └──────────┘ └─────────┘ └──────────┘
```

## Branch Protection Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                    Branch Protection Rules                    │
└──────────────────────────────────────────────────────────────┘

main branch (Production):
├── ✅ Require pull request before merging
├── ✅ Require approvals (1-2 reviewers)
├── ✅ Require status checks to pass
│   ├── lint
│   ├── typecheck
│   ├── test
│   └── build
├── ✅ Require branches to be up to date
├── ✅ Do not allow bypassing the above settings
├── ✅ Restrict who can push (admins only)
└── 🚀 Deploys to Vercel Production

develop branch (Preview):
├── ✅ Require pull request before merging
├── ✅ Require approvals (1 reviewer)
├── ✅ Require status checks to pass
│   ├── lint
│   ├── typecheck
│   ├── test
│   └── build
├── ⚠️  Allow merge queue (faster iteration)
└── 🚀 Deploys to Vercel Preview

feature/* branches:
└── ⚠️  No protection needed (temporary branches)
```

## Deployment Matrix

```
┌────────────────────────────────────────────────────────────────────┐
│                     Deployment Trigger Matrix                       │
└────────────────────────────────────────────────────────────────────┘

Event Type          │ main   │ develop │ feature/* │ Vercel Environment
────────────────────┼────────┼─────────┼───────────┼───────────────────
Push                │   ✅   │   ✅    │    ❌     │ Production/Preview/None
────────────────────┼────────┼─────────┼───────────┼───────────────────
Pull Request        │   ❌   │   ❌    │    ❌     │ None (CI only)
────────────────────┼────────┼─────────┼───────────┼───────────────────
Manual Workflow     │   ✅   │   ❌    │    ❌     │ Production only
────────────────────┴────────┴─────────┴───────────┴───────────────────

Legend:
  ✅ = Deployment happens
  ❌ = No deployment (CI only)

Notes:
  - Vercel Hobby Plan supports Production and Preview environments only
  - develop branch uses Vercel Preview environment (not a separate staging)
  - **Pull requests do NOT trigger deployments** - only pushes to main/develop
  - PRs to main are not configured (merge develop to main directly)
  - Use CI checks to validate PRs before merging
```

## Common Workflows

### 1. New Feature Development

```
Developer                    GitHub                     Vercel
─────────                    ──────                     ──────

1. Create feature branch
   git checkout -b 
   feature/new-ui
                │
                │
2. Make changes │
   git commit   │
                │
                │
3. Push         │──────────▶ CI Checks
    git push     │            ├─ Lint    ✅
                 │            ├─ Test    ✅
                 │            └─ Build   ✅
                 │                │
                 │                │
4. Create PR to │                │
   develop      │──────────▶ CI Checks Only
                 │            ├─ Lint    ✅
                 │            ├─ Test    ✅
                 │            └─ Build   ✅
                 │            (NO Deployment)
                 │                │
5. Review & OK  │                │
                 │                │
                 │                │
6. Merge to     │                │
   develop      │──────────▶ Preview Deploy ─────▶ preview.vercel.app
                 │            + Migrations
                 │            + Health check
```

### 2. Production Release

```
Developer                    GitHub                     Vercel
─────────                    ──────                     ──────

1. Create PR:
   develop → main
                │
                │──────────▶ Preview Deploy ──────▶ preview-xyz.vercel.app
                │            + CI Checks
                │                │
                │                │
2. QA Testing   │                │
   on preview   │                │
                │                │
                │                │
3. Approve PR   │                │
                │                │
                │                │
4. Merge to main│──────────▶ Prod Deploy ───────▶ app.com
                │            + Migrations
                │            + Health check
                │            + Monitoring
```

### 3. Hotfix

```
Developer                    GitHub                     Vercel
─────────                    ──────                     ──────

1. Create hotfix
   from main
   git checkout -b
   hotfix/bug
                │
                │
2. Fix bug      │
   git commit   │
                │
                │
3. Push & PR    │──────────▶ Preview Deploy ──────▶ preview-fix.vercel.app
   to main      │            + CI Checks
                │                │
                │                │
4. Fast review  │                │
                │                │
                │                │
5. Merge to main│──────────▶ Prod Deploy ───────▶ app.com
                │            (Immediate)
                │                │
                │                │
6. Backport to  │                │
   develop      │──────────▶ Preview Deploy ─────▶ preview.vercel.app
```

## Environment URLs

```
┌──────────────────────────────────────────────────────┐
│              Deployment Environments                  │
│              (Vercel Hobby Plan)                      │
└──────────────────────────────────────────────────────┘

Production (Vercel Production Environment):
  URL: https://folk.care
  Branch: main
  Database: Production (Neon)
  Trigger: Push to main

Preview (Vercel Preview Environment):
  URL: https://folkcare-preview.vercel.app
  Branch: develop
  Database: Preview (Neon)
  Trigger: Push to develop
  Note: Persistent preview environment

Development (Local Only):
  URL: http://localhost:3000
  Branch: Any (local)
  Database: Local PostgreSQL or development DB
  Trigger: vercel dev (local command)
  Note: Not deployed to Vercel, linked to local machine
```

## Quick Reference

```bash
# Feature branch - NO deployment
git checkout -b feature/my-feature
git push origin feature/my-feature
# Result: CI checks only ✅

# PR to develop - NO deployment
gh pr create --base develop
# Result: CI checks only (NO deployment) ✅

# After merge - Preview deployment
# Result: Automatic preview deployment ✅

# Merge develop to main - Production deployment  
git checkout main
git merge develop
git push origin main
# Result: Automatic production deployment ✅

# Manual deployment (production only)
gh workflow run deploy.yml
# Result: Deploy to production ✅
```

---

**Key Takeaway:** 
- Vercel Hobby Plan supports **Production** and **Preview** environments only
- `main` branch → Vercel Production environment (pushes only)
- `develop` branch → Vercel Preview environment (pushes only)
- **Pull requests do NOT trigger deployments** - only CI checks run
- Local development → Not deployed to Vercel (use `vercel dev` locally)
- Feature branches never auto-deploy
