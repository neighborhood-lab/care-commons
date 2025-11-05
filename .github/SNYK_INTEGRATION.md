# Snyk Integration Policy

## Current Configuration

**Security scanning is handled exclusively via the Snyk<->GitHub integration, NOT via CLI.**

### What This Means

- ✅ **DO**: Use Snyk GitHub App for security scanning
- ✅ **DO**: Review Snyk alerts in the GitHub Security tab
- ❌ **DO NOT**: Add `snyk test` or `snyk code test` commands to workflows
- ❌ **DO NOT**: Add Snyk CLI steps to CI/CD pipelines
- ❌ **DO NOT**: Add `SNYK_TOKEN` to GitHub secrets for CLI usage

### Why This Approach

1. **No API Limits**: GitHub integration doesn't count against Snyk's code test limits
2. **Better Integration**: Security alerts appear natively in GitHub's Security tab
3. **Automatic Updates**: Snyk scans run automatically on PRs and commits
4. **Centralized Management**: All security findings in one place

### Historical Context

Previously, we encountered "code test limit reached" errors when running Snyk CLI commands in GitHub Actions workflows. This was resolved by:

1. Removing `.snyk` configuration file
2. Removing `snyk test` and `snyk code test` from all workflows
3. Relying solely on the Snyk<->GitHub App integration
4. Removing Snyk CLI references from documentation

### Changes Made (November 2025)

- **Removed**: `.snyk` configuration file
- **Removed**: Snyk badge from README
- **Removed**: Snyk CLI instructions from ENVIRONMENT_SETUP.md
- **Updated**: Security workflow documentation to reference GitHub integration only
- **Commit**: `9886a49 - remove snyk cli references and configuration`

### For Future Maintainers

If you're considering adding Snyk CLI commands back:

1. **Don't do it** - The GitHub integration is better
2. If you must, ensure you have an appropriate Snyk plan with sufficient API limits
3. Remember this caused issues in the past and was intentionally removed

### Resources

- [Snyk GitHub Integration Docs](https://docs.snyk.io/integrations/git-repository-scm-integrations/github-integration)
- [GitHub Security Tab](https://github.com/neighborhood-lab/care-commons/security)
