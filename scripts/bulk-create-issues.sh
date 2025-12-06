#!/bin/bash
# Bulk issue creation script with rate limit handling
# GitHub REST API allows 5000 requests/hour for authenticated users
# Secondary rate limit: ~80 requests/minute for content-creating endpoints

set -euo pipefail

REPO_OWNER="neighborhood-lab"
REPO_NAME="folk-care"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable not set"
  exit 1
fi

API_BASE="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME"

# Rate limit settings - GitHub secondary rate limits are ~80/minute for mutations
# We'll be conservative: 60 requests/minute = 1 per second
DELAY_BETWEEN_REQUESTS=1.0
BATCH_SIZE=30
DELAY_BETWEEN_BATCHES=5

# Counters
ISSUES_CREATED=0
ISSUES_FAILED=0
START_TIME=$(date +%s)

log() {
  echo "[$(date '+%H:%M:%S')] $1"
}

check_rate_limit() {
  local response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/rate_limit")
  local remaining=$(echo "$response" | jq -r '.resources.core.remaining')
  local reset=$(echo "$response" | jq -r '.resources.core.reset')
  local reset_time=$(date -r "$reset" '+%H:%M:%S' 2>/dev/null || date -d "@$reset" '+%H:%M:%S' 2>/dev/null || echo "unknown")

  log "Rate limit: $remaining remaining, resets at $reset_time"

  if [ "$remaining" -lt 100 ]; then
    log "WARNING: Low rate limit. Waiting for reset..."
    local wait_time=$((reset - $(date +%s) + 5))
    if [ "$wait_time" -gt 0 ]; then
      sleep "$wait_time"
    fi
  fi
}

create_issue() {
  local title="$1"
  local body="$2"
  local labels="${3:-}"

  local labels_json="[]"
  if [ -n "$labels" ]; then
    labels_json=$(echo "$labels" | jq -R 'split(",") | map(gsub("^\\s+|\\s+$";""))')
  fi

  local payload=$(jq -n \
    --arg title "$title" \
    --arg body "$body" \
    --argjson labels "$labels_json" \
    '{title: $title, body: $body, labels: $labels}')

  local response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "$API_BASE/issues" \
    -d "$payload")

  local http_code=$(echo "$response" | tail -n1)
  local body_response=$(echo "$response" | sed '$d')

  if [ "$http_code" = "201" ]; then
    local issue_num=$(echo "$body_response" | jq -r '.number')
    log "✓ #$issue_num: $title"
    ISSUES_CREATED=$((ISSUES_CREATED + 1))
    return 0
  elif [ "$http_code" = "403" ] || [ "$http_code" = "429" ]; then
    # Rate limited - wait and retry
    log "⚠ Rate limited. Waiting 60s..."
    sleep 60
    check_rate_limit
    # Retry once
    response=$(curl -s -w "\n%{http_code}" -X POST \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      "$API_BASE/issues" \
      -d "$payload")
    http_code=$(echo "$response" | tail -n1)
    body_response=$(echo "$response" | sed '$d')

    if [ "$http_code" = "201" ]; then
      local issue_num=$(echo "$body_response" | jq -r '.number')
      log "✓ #$issue_num: $title (after retry)"
      ISSUES_CREATED=$((ISSUES_CREATED + 1))
      return 0
    fi
  fi

  log "✗ Failed ($http_code): $title"
  log "  Error: $(echo "$body_response" | jq -r '.message // .errors // "unknown"')"
  ISSUES_FAILED=$((ISSUES_FAILED + 1))
  return 1
}

process_issues_file() {
  local file="$1"
  local count=0
  local batch_count=0

  log "Starting bulk issue creation from $file"
  check_rate_limit

  while IFS=$'\t' read -r title body labels; do
    # Skip empty lines and comments
    [[ -z "$title" || "$title" =~ ^# ]] && continue

    create_issue "$title" "$body" "$labels" || true

    count=$((count + 1))
    batch_count=$((batch_count + 1))

    # Progress update every 10 issues
    if [ $((count % 10)) -eq 0 ]; then
      local elapsed=$(($(date +%s) - START_TIME))
      local rate=$(echo "scale=2; $ISSUES_CREATED / ($elapsed / 60)" | bc 2>/dev/null || echo "N/A")
      log "Progress: $ISSUES_CREATED created, $ISSUES_FAILED failed (${rate}/min)"
    fi

    # Batch delay
    if [ "$batch_count" -ge "$BATCH_SIZE" ]; then
      log "Batch complete. Pausing ${DELAY_BETWEEN_BATCHES}s..."
      sleep "$DELAY_BETWEEN_BATCHES"
      check_rate_limit
      batch_count=0
    else
      sleep "$DELAY_BETWEEN_REQUESTS"
    fi

  done < "$file"

  local total_time=$(($(date +%s) - START_TIME))
  log "======================================"
  log "Complete! Created: $ISSUES_CREATED, Failed: $ISSUES_FAILED"
  log "Total time: ${total_time}s"
}

# Main
if [ $# -lt 1 ]; then
  echo "Usage: $0 <issues-file.tsv>"
  echo ""
  echo "File format (TSV - tab separated):"
  echo "  title<TAB>body<TAB>labels"
  echo ""
  echo "Example:"
  echo "  Add offline sync\tImplement offline-first sync\tenhancement,mobile"
  exit 1
fi

process_issues_file "$1"
