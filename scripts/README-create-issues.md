# GitHub Issue Batch Creator

This tool creates GitHub issues in batches from `issues-backlog.json` with rate limiting to avoid API limits.

## Features

- **Rate Limited**: Waits 10 seconds between issues (configurable)
- **Resumable**: Saves progress, can be interrupted and resumed
- **Dry Run**: Preview what will be created without actually creating
- **Error Handling**: Continues on errors, tracks failed issues

## Usage

### Prerequisites

```bash
# Set GitHub token
export GITHUB_TOKEN=ghp_your_token_here

# Or source secrets
source .secrets.txt
```

### Create Issues (Production)

```bash
# Default: 10 second delay between issues
npx tsx scripts/create-issues.ts

# Custom delay (5 seconds)
npx tsx scripts/create-issues.ts --delay=5000
```

### Dry Run (Preview Only)

```bash
# See what would be created without creating
npx tsx scripts/create-issues.ts --dry-run
```

### Resume After Interruption

The script automatically resumes from where it left off. Just run the same command again:

```bash
npx tsx scripts/create-issues.ts
```

Progress is saved in `scripts/.issues-progress.json`.

### Run in Background

```bash
# Run in background, log to file
npx tsx scripts/create-issues.ts > issue-creation.log 2>&1 &

# Check progress
tail -f issue-creation.log

# Or use screen/tmux for longer sessions
screen -S issues
npx tsx scripts/create-issues.ts
# Ctrl+A, D to detach
# screen -r issues to reattach
```

## Files

- **issues-backlog.json**: Issue definitions (100 prioritized issues)
- **create-issues.ts**: Background worker script
- **.issues-progress.json**: Progress tracking (auto-created, gitignored)

## Progress Tracking

The script saves progress after each issue:

```json
{
  "created": [0, 1, 2, ...],
  "failed": [5, 12],
  "lastIndex": 15,
  "totalCreated": 14,
  "totalFailed": 2,
  "startedAt": "2025-12-03T19:00:00.000Z",
  "lastUpdatedAt": "2025-12-03T19:30:00.000Z"
}
```

## Rate Limits

GitHub API limits:
- **Authenticated**: 5,000 requests/hour
- **Creating issues**: ~1 request per issue

At 10 second delay:
- **6 issues/minute**
- **360 issues/hour**
- **100 issues**: ~17 minutes

Safe and well within rate limits.

## Error Handling

If an issue fails:
1. Error is logged
2. Issue index added to `failed` array
3. Script continues to next issue
4. Final summary shows failed issues

## Cleanup

To start fresh:

```bash
rm scripts/.issues-progress.json
```

## Example Output

```
🚀 Folk Care Issue Creator

📊 Backlog: 100 total issues
✅ Created: 45
❌ Failed: 1
⏭️  Remaining: 54

[46/100] P2 - Feature: Client Search with Filters
✅ Created issue #551: [P2] Feature: Client Search with Filters
⏳ Waiting 10000ms before next issue...

[47/100] P2 - Feature: Caregiver Search with Availability Filter
✅ Created issue #552: [P2] Feature: Caregiver Search with Availability Filter
⏳ Waiting 10000ms before next issue...
...
```

## Tips

1. **Test first**: Always run `--dry-run` before creating
2. **Use background**: For 100 issues, run in background or screen/tmux
3. **Monitor progress**: `tail -f` the log or check `.issues-progress.json`
4. **Interrupt safely**: Ctrl+C saves progress, resume anytime
5. **Check GitHub**: Verify issues are created correctly before continuing

## Troubleshooting

### "Requires authentication"

```bash
# Verify token is set
echo $GITHUB_TOKEN

# Or source secrets again
source .secrets.txt
```

### "Rate limit exceeded"

Wait an hour or adjust delay:

```bash
npx tsx scripts/create-issues.ts --delay=30000  # 30 seconds
```

### Failed issues

Check logs for error messages. Common issues:
- Invalid label names
- Malformed JSON
- Network errors

Fix the issue in `issues-backlog.json` and resume.
