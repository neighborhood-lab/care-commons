# Scripts Directory

## GitHub API Helper (SINGLE ENTRY POINT)

**IMPORTANT**: `scripts/github-api.sh` is our **ONLY** GitHub interaction script.

- ✅ **DO**: Add new commands to this file when needed
- ❌ **DON'T**: Create `gh-issue.sh`, `gh-pr.sh`, or other separate GitHub scripts
- ✅ **REASON**: Centralized maintenance, consistent patterns, single source of truth

Use `scripts/github-api.sh` instead of `gh` CLI to avoid GraphQL rate limits.

### Setup

```bash
export GITHUB_TOKEN="your_token_here"
```

### Usage

**Create an issue:**
```bash
./scripts/github-api.sh issue-create "Title" "Body content" "label1,label2"
```

**Create a pull request:**
```bash
./scripts/github-api.sh pr-create "PR Title" "PR body" "feature/branch" "develop"
```

**List issues:**
```bash
./scripts/github-api.sh issue-list open
./scripts/github-api.sh issue-list closed
./scripts/github-api.sh issue-list all
```

**List PRs:**
```bash
./scripts/github-api.sh pr-list open
```

### Why Use This Instead of `gh` CLI?

- `gh` CLI uses GraphQL API (limited for new accounts, rate limits)
- This script uses REST API (5,000 calls/hour, no new-account restrictions)
- Works with `tove-bot` and any GitHub account
- No external CLI tool dependencies (just curl + jq)

### Examples

```bash
# Create issue with HUMAN label
./scripts/github-api.sh issue-create \
  "Fix authentication bug" \
  "Users can't log in on mobile" \
  "bug,HUMAN"

# Create PR from feature branch
./scripts/github-api.sh pr-create \
  "Add mobile EVV support" \
  "Implements offline-first EVV for mobile app" \
  "feature/mobile-evv" \
  "develop"
```
