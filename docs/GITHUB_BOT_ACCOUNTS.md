# GitHub Bot Account Management

## Overview

This document explains how GitHub bot accounts work, their API rate limits, and the "zombie PR" issue caused by GraphQL API restrictions.

## Current Bot Accounts

We have three GitHub accounts configured:

| Account   | Type    | Purpose                              |
|-----------|---------|--------------------------------------|
| bedwards  | User    | Primary development account          |
| tove-bot  | Bot     | Automated workflows, secondary dev   |
| gaute-bot | Bot     | Limited automation (REST API only)   |

## Rate Limits (as of 2025-12-07)

Run `./scripts/check-github-rate-limits.sh` to check current limits:

```
Account      | GraphQL Limit   | GraphQL Used   | REST Limit   | REST Used
-------------|-----------------|----------------|--------------|----------
bedwards     | 5,000/hour      | 6              | 5,000/hour   | 30
tove-bot     | 5,000/hour      | 13             | 5,000/hour   | 30
gaute-bot    | 0/hour          | 0              | 60/hour      | 30
```

### Key Findings

1. **bedwards** - Full access to both GraphQL and REST APIs
2. **tove-bot** - Full access to both APIs (limits increased after regular use)
3. **gaute-bot** - **NO GraphQL access**, severely limited REST access

## The "Zombie PR" Issue

### What Are Zombie PRs?

Zombie PRs are pull requests that:
- Exist in GitHub's API database (can be queried via REST API)
- Return HTTP 404 on the web interface
- Cannot be viewed by any user (including the creator)
- Cannot be closed or deleted through normal means

### Root Cause

**GitHub CLI (`gh`) requires GraphQL API access.** When a bot account with zero GraphQL access uses `gh pr create`, GitHub's behavior is:

1. The GraphQL mutation fails due to rate limit (0/hour)
2. GitHub partially creates the PR in the database
3. The PR exists in API but lacks proper visibility/permission metadata
4. Result: PR is inaccessible to all users

### Example Zombie PRs

Created by gaute-bot using `gh pr create`:
- PR #973 - Exists in API, 404 on web
- PR #980 - Exists in API, 404 on web
- PR #988 - Exists in API, 404 on web

### Verification

```bash
# Switch to gaute-bot
gh auth switch --user gaute-bot

# PR exists in API
gh api repos/neighborhood-lab/folk-care/pulls/973
# Returns: {"number": 973, "state": "open", ...}

# But web returns 404
gh pr view 973
# Error: HTTP 404: Not Found
```

## How Bot Rate Limits Work

### New Bot Accounts

When a GitHub bot account is first created:
- **GraphQL API**: 0 requests/hour (completely blocked)
- **REST API**: 60 requests/hour (minimal access)

### Increasing Limits

GitHub increases bot account limits based on **demonstrated legitimate activity**:

1. **Make regular commits** - Push code changes over time
2. **Use REST API** - Make API calls for legitimate operations
3. **Wait** - Limits increase gradually (days to weeks)

### tove-bot vs gaute-bot Timeline

Both accounts were created at the same time, but:
- **tove-bot** was used extensively → limits increased to 5,000/hour
- **gaute-bot** had minimal activity → limits remained at 0/60 per hour

## Best Practices

### 1. Account Selection

| Task | Recommended Account | Why |
|------|---------------------|-----|
| `gh pr create` | bedwards or tove-bot | Requires GraphQL |
| `gh issue create` | bedwards or tove-bot | Requires GraphQL |
| REST API scripts | Any account | REST works for all |
| Manual work | bedwards | Primary account |

### 2. For gaute-bot

Until GraphQL limits are increased:

**DO:**
- ✅ Use `scripts/github-api.sh` (REST API wrapper)
- ✅ Make regular commits to increase trust
- ✅ Use REST API for issues, PRs, comments

**DON'T:**
- ❌ Use `gh pr create` (creates zombie PRs)
- ❌ Use `gh issue create` (creates zombie issues)
- ❌ Use any `gh` CLI commands requiring GraphQL

### 3. API Choice

**GitHub CLI (`gh`):**
- Uses GraphQL API primarily
- More features, better UX
- Requires GraphQL quota
- Creates zombie entities when quota is 0

**REST API (`scripts/github-api.sh`):**
- Uses REST API exclusively
- Works with minimal quota (60/hour)
- More verbose, requires JSON parsing
- Reliable even with limited access

## Monitoring Rate Limits

### Check Current Limits

```bash
# All accounts
./scripts/check-github-rate-limits.sh

# Specific account
gh auth switch --user tove-bot
gh api rate_limit --jq '.resources'
```

### Check Remaining Quota

```bash
gh api rate_limit --jq '{
  graphql_remaining: .resources.graphql.remaining,
  graphql_reset: (.resources.graphql.reset | strftime("%Y-%m-%d %H:%M:%S")),
  rest_remaining: .resources.core.remaining,
  rest_reset: (.resources.core.reset | strftime("%Y-%m-%d %H:%M:%S"))
}'
```

## Recovering from Zombie PRs

### If You Create Zombie PRs

1. **Stop using `gh` CLI** with that account immediately
2. **Switch to REST API** for all operations
3. **Use a different account** (bedwards or tove-bot) for PR creation
4. **Wait for rate limits to increase** through regular activity

### Cleaning Up Zombie PRs

Zombie PRs require GitHub Support intervention. They cannot be cleaned up through normal API/CLI operations.

**Temporary workaround:**
- Document zombie PR numbers (e.g., #973, #980, #988)
- Ignore 404 errors when those numbers are referenced
- Continue with new PRs using proper account

## Increasing gaute-bot's Limits

To increase gaute-bot's GraphQL access:

1. **Regular commits** - Use gaute-bot for automated commits
2. **REST API usage** - Make legitimate API calls via `scripts/github-api.sh`
3. **Time** - Wait several days to weeks for GitHub to increase limits
4. **Patience** - GitHub evaluates bot activity patterns over time

## References

- GitHub API Rate Limiting: https://docs.github.com/en/rest/rate-limit
- GraphQL Rate Limits: https://docs.github.com/en/graphql/overview/rate-limits-and-node-limits
- Bot Account Best Practices: https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app
