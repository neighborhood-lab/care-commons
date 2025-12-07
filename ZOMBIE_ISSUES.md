# Zombie Issues Analysis

**Date:** 2025-12-07
**Analyzed by:** gaute-bot

## Summary

Analysis of GitHub issues to identify any orphaned/corrupted issue records similar to the zombie PRs documented in ZOMBIE_PRS.md.

## Key Finding

**No standalone zombie issues found.** The zombie issues are actually the zombie PRs documented in ZOMBIE_PRS.md, since GitHub's data model treats pull requests as a special type of issue.

## GitHub Issue/PR Relationship

In GitHub's architecture:
- Every PR is also an issue
- PRs and issues share the same number sequence
- `/issues/{number}` endpoint returns both issues and PRs
- `/pulls/{number}` endpoint returns only PRs

## Number Range Analysis (970-990)

### Accessible Items
- **#974** - Issue: "🚨 Database Backup Failed" (closed, HTTP 200)
- **#989** - PR: "npm install retry logic" (open, HTTP 200)

### Zombie PRs (also accessible as issues via API)
- **#973** - PR: Schedule Builder
- **#976** - PR: Medication Administration
- **#978** - PR: Incident Reporting
- **#980** - PR: Family Messaging
- **#983** - PR: Bulk Notifications
- **#986** - PR: Client Intake Workflow
- **#988** - PR: Training & Certification

All zombie PRs return HTTP 404 on both:
- `/pull/{number}` URLs
- `/issues/{number}` URLs

### Number Gaps (don't exist)
These numbers don't exist in GitHub's database at all:
- #975, #977, #979, #981, #984, #987

This is normal - GitHub doesn't guarantee sequential numbering, and numbers can be skipped.

## Verification Commands

```bash
# Check if issue exists in API (includes PRs)
source .secrets.txt
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/neighborhood-lab/folk-care/issues/974

# Check web accessibility
curl -I https://github.com/neighborhood-lab/folk-care/issues/974
# HTTP/2 200 (accessible)

# Zombie PR as issue
curl -I https://github.com/neighborhood-lab/folk-care/issues/973
# HTTP/2 404 (zombie)
```

## Conclusion

1. **No standalone zombie issues** - All issues that exist in the API are accessible via web
2. **Zombie PRs are also zombie issues** - Since PRs are issues, the 7 zombie PRs are also inaccessible via `/issues/{number}` URLs
3. **Number gaps are normal** - Missing numbers (#975, #977, etc.) never existed

## Related Documentation

See **ZOMBIE_PRS.md** for full details on:
- PR #973 - Schedule Builder (652 lines)
- PR #976 - Medication Administration (MAR)
- PR #978 - Incident Reporting (mobile)
- PR #980 - Family Messaging (530 lines)
- PR #983 - Bulk Notifications
- PR #986 - Client Intake Workflow (1600 lines)
- PR #988 - Training & Certification (1100 lines)

---

**Generated:** 2025-12-07T14:40:00Z
**By:** gaute-bot via Claude Code
