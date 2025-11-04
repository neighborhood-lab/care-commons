# Vercel Deployment Configuration

## Current Setup

**Automatic PR Deployments: DISABLED**

As of November 4, 2025, Vercel's automatic pull request deployments have been disabled to prevent hitting the free tier rate limit (100 deployments/day).

## Configuration Files

### vercel.json
```json
"github": {
  "enabled": false,    // Disables automatic PR deployments
  "autoAlias": false,  // Disables automatic aliasing
  "silent": true       // Suppresses GitHub comments
}
```

### GitHub Actions (.github/workflows/deploy.yml)
Deployments are controlled through GitHub Actions and only trigger for:
- **Production**: Pushes to `main` branch
- **Preview**: Pushes to `preview` branch
- **Manual**: Workflow dispatch events

## Vercel Dashboard Configuration

To fully disable PR deployments, also configure in the Vercel dashboard:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `care-commons`
3. Navigate to: **Settings** → **Git**
4. Under **Deploy Hooks**, disable:
   - ❌ **Automatically expose System Environment Variables**
   - ❌ **Deploy Preview Branches** (if present)
   - ❌ **Enable Comments on Pull Requests**

5. Under **Ignored Build Step**:
   - Set command: `git diff HEAD^ HEAD --quiet -- '*.ts' '*.tsx' '*.js' '*.json' || [ "$VERCEL_GIT_COMMIT_REF" != "main" ] && [ "$VERCEL_GIT_COMMIT_REF" != "preview" ]`
   - This prevents builds on branches other than `main` and `preview`

## Deployment Strategy

### Production Deployments
- **Trigger**: Push to `main` branch
- **Environment**: production
- **URL**: https://care-commons.vercel.app
- **Process**:
  1. Run database migrations (production DB)
  2. Build all packages
  3. Deploy with `--prod` flag
  4. Run health check
  5. Optional: Seed demo data (manual workflow only)

### Preview Deployments
- **Trigger**: Push to `preview` branch
- **Environment**: preview
- **URL**: preview-*.vercel.app (dynamic)
- **Process**:
  1. Run database migrations (preview DB)
  2. Build all packages
  3. Deploy to preview environment
  4. Run health check

### Feature Branch Development
- **Deployments**: NONE (local testing only)
- **CI Checks**: Lint, typecheck, test (via GitHub Actions)
- **Workflow**: Merge to `preview` for testing, then `main` for production

## Rate Limiting

Vercel Free Tier Limits:
- ✅ **100 deployments/day** - We stay well under with this config
- ✅ **100 GB bandwidth/month**
- ✅ **Unlimited bandwidth** for open source projects (if applicable)

## Troubleshooting

### If you hit rate limits:
1. Check Vercel dashboard for unexpected deployments
2. Verify `vercel.json` has `github.enabled: false`
3. Check GitHub Actions aren't triggering on feature branches
4. Review Git integration settings in Vercel dashboard

### If deployments aren't working:
1. Verify GitHub secrets are set: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
2. Check GitHub Actions workflow logs
3. Ensure branch name is exactly `main` or `preview`
4. Verify Vercel CLI version is latest

## Future Considerations

If upgrading to Vercel Pro/Team:
- Can re-enable PR deployments with higher limits
- Consider adding branch protection rules
- May want per-PR preview URLs for review

## References

- [Vercel Git Integration Docs](https://vercel.com/docs/deployments/git)
- [GitHub Actions Deployment Docs](https://vercel.com/docs/deployments/git/vercel-for-github)
- [Rate Limiting Guide](https://vercel.com/docs/limits/fair-use-policy)
