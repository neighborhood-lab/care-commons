# Deployment Flow Diagram

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


PULL REQUEST WORKFLOW (to main or develop):
┌────────────────┐
│ feature/new    │
│    branch      │
└────────┬───────┘
         │
         │ gh pr create --base develop
         │
         ▼
    ┌─────────┐
    │   PR    │ → ✅ Preview Deployment
    │  Open   │ → ✅ CI Checks
    └────┬────┘ → ✅ PR Comment with URL
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


STAGING DEPLOYMENT WORKFLOW:
┌────────────────┐
│    develop     │ ← Merge from feature branch
│    branch      │
└────────┬───────┘
         │
         │ Automatic trigger on push
         │
         ▼
    ┌─────────────────┐
    │ Deploy Staging  │ → ✅ Run migrations
    │      Job        │ → ✅ Deploy to Vercel
    └────────┬────────┘ → ✅ Health check
             │
             ▼
    ┌──────────────────┐
    │  Staging Server  │
    │ (staging.app.com)│
    └──────────────────┘


PRODUCTION DEPLOYMENT WORKFLOW:
┌────────────────┐
│    develop     │
│    branch      │
└────────┬───────┘
         │
         │ gh pr create --base main
         │
         ▼
    ┌─────────┐
    │   PR    │ → ✅ Preview Deployment
    │ develop │ → ✅ CI Checks
    │ → main  │ → ✅ Review required
    └────┬────┘
         │
         │ Merge to main
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
    │       Job        │ → ✅ Deploy to Vercel
    └────────┬─────────┘ → ✅ Health check
             │
             ▼
    ┌──────────────────┐
    │ Production Server│
    │   (app.com)      │
    └──────────────────┘
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
    │Production│ │ Staging │ │ NO Deploy│
    │  Deploy  │ │  Deploy │ │ CI Only  │
    └──────────┘ └─────────┘ └──────────┘
```

## Branch Protection Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                    Branch Protection Rules                    │
└──────────────────────────────────────────────────────────────┘

main branch:
├── ✅ Require pull request before merging
├── ✅ Require approvals (1-2 reviewers)
├── ✅ Require status checks to pass
│   ├── lint
│   ├── typecheck
│   ├── test
│   └── build
├── ✅ Require branches to be up to date
├── ✅ Do not allow bypassing the above settings
└── ✅ Restrict who can push (admins only)

develop branch:
├── ✅ Require pull request before merging
├── ✅ Require approvals (1 reviewer)
├── ✅ Require status checks to pass
│   ├── lint
│   ├── typecheck
│   ├── test
│   └── build
└── ⚠️  Allow merge queue (faster iteration)

feature/* branches:
└── ⚠️  No protection needed (temporary branches)
```

## Deployment Matrix

```
┌────────────────────────────────────────────────────────────────────┐
│                     Deployment Trigger Matrix                       │
└────────────────────────────────────────────────────────────────────┘

Event Type          │ main   │ develop │ feature/* │ Result
────────────────────┼────────┼─────────┼───────────┼───────────────────
Push                │   ✅   │   ✅    │    ❌     │ Prod/Staging/None
────────────────────┼────────┼─────────┼───────────┼───────────────────
PR Created          │   ✅   │   ✅    │    ❌     │ Preview/Preview/None
────────────────────┼────────┼─────────┼───────────┼───────────────────
PR to main          │   -    │   ✅    │    ✅     │ Preview
────────────────────┼────────┼─────────┼───────────┼───────────────────
PR to develop       │   ❌   │    -    │    ✅     │ Preview
────────────────────┼────────┼─────────┼───────────┼───────────────────
PR to feature       │   ❌   │   ❌    │    ❌     │ None
────────────────────┼────────┼─────────┼───────────┼───────────────────
Manual Workflow     │   ✅   │   ✅    │    ✅     │ User Choice
────────────────────┴────────┴─────────┴───────────┴───────────────────

Legend:
  ✅ = Deployment happens
  ❌ = No deployment (CI only)
  - = N/A (can't PR to self)
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
   develop      │──────────▶ Preview Deploy ──────▶ preview-abc.vercel.app
                │            + CI Checks
                │                │
                │                │
5. Review & OK  │                │
                │                │
                │                │
6. Merge to     │                │
   develop      │──────────▶ Staging Deploy ─────▶ staging.app.com
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
   develop      │──────────▶ Staging Deploy ─────▶ staging.app.com
```

## Environment URLs

```
┌──────────────────────────────────────────────────────┐
│              Deployment Environments                  │
└──────────────────────────────────────────────────────┘

Production:
  URL: https://care-commons.vercel.app
  Branch: main
  Database: Production (Neon)
  Trigger: Push to main

Staging:
  URL: https://care-commons-staging.vercel.app  
  Branch: develop
  Database: Staging (Neon)
  Trigger: Push to develop

Preview:
  URL: https://care-commons-<pr-hash>.vercel.app
  Branch: Any (via PR)
  Database: Staging (Neon)
  Trigger: PR to main or develop
  Lifecycle: Deleted when PR closes
```

## Quick Reference

```bash
# Feature branch - NO deployment
git checkout -b feature/my-feature
git push origin feature/my-feature
# Result: CI checks only ✅

# PR to develop - Preview + Staging deployment
gh pr create --base develop
# Result: Preview deployment ✅

# After merge - Staging deployment
# Result: Automatic staging deployment ✅

# PR to main - Preview + Production deployment  
gh pr create --base main
# Result: Preview deployment ✅

# After merge - Production deployment
# Result: Automatic production deployment ✅

# Manual deployment
gh workflow run deploy.yml -f environment=staging
# Result: Deploy to chosen environment ✅
```

---

**Key Takeaway:** Feature branches never auto-deploy. Only `main` (production) and `develop` (staging) trigger deployments on push.
