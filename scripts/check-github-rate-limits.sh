#!/bin/bash
#
# Check GitHub API Rate Limits
#
# This script checks the rate limits for all configured GitHub accounts.
# Requires: gh CLI with authenticated accounts
#
# Usage:
#   ./scripts/check-github-rate-limits.sh
#
# Output: Table showing GraphQL and REST API limits for each account

set -euo pipefail

ACCOUNTS=("bedwards" "tove-bot" "gaute-bot")

echo "GitHub API Rate Limits Report"
echo "============================="
echo ""
echo "Generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

# Print table header
printf "%-12s | %-15s | %-14s | %-12s | %-11s\n" \
  "Account" "GraphQL Limit" "GraphQL Used" "REST Limit" "REST Used"
printf "%-12s-+-%-15s-+-%-14s-+-%-12s-+-%-11s\n" \
  "------------" "---------------" "--------------" "------------" "-----------"

# Check each account
for account in "${ACCOUNTS[@]}"; do
  # Switch to account
  if ! gh auth switch --user "$account" &>/dev/null; then
    printf "%-12s | %-15s | %-14s | %-12s | %-11s\n" \
      "$account" "NOT CONFIGURED" "-" "-" "-"
    continue
  fi

  # Get rate limits
  rate_data=$(gh api rate_limit 2>/dev/null || echo "{}")

  # Extract limits
  graphql_limit=$(echo "$rate_data" | jq -r '.resources.graphql.limit // "N/A"')
  graphql_used=$(echo "$rate_data" | jq -r '.resources.graphql.used // "N/A"')
  rest_limit=$(echo "$rate_data" | jq -r '.resources.core.limit // "N/A"')
  rest_used=$(echo "$rate_data" | jq -r '.resources.core.used // "N/A"')

  # Format limits with /hour
  if [ "$graphql_limit" != "N/A" ]; then
    graphql_limit="${graphql_limit}/hour"
  fi
  if [ "$rest_limit" != "N/A" ]; then
    rest_limit="${rest_limit}/hour"
  fi

  # Print row
  printf "%-12s | %-15s | %-14s | %-12s | %-11s\n" \
    "$account" "$graphql_limit" "$graphql_used" "$rest_limit" "$rest_used"
done

# Switch back to bedwards
gh auth switch --user bedwards &>/dev/null || true

echo ""
echo "Notes:"
echo "------"
echo "- GraphQL API is used by 'gh' CLI (gh pr create, gh issue create, etc.)"
echo "- REST API is used by scripts/github-api.sh and direct API calls"
echo "- Accounts with 0/hour GraphQL limit CANNOT use 'gh' CLI commands"
echo "- New bot accounts start with limited access until they demonstrate activity"
echo "- Rate limits reset every hour"
echo ""
echo "Recommendations:"
echo "----------------"
echo "1. Use tove-bot or bedwards for all 'gh' CLI operations"
echo "2. Use scripts/github-api.sh (REST) when possible to conserve GraphQL quota"
echo "3. For gaute-bot: Use REST API only until GraphQL limits are increased"
echo "4. To increase bot limits: Make regular commits and API calls over time"
echo ""
