#!/bin/bash
# GitHub REST API helper script
# Avoids GraphQL rate limits by using REST API directly

set -euo pipefail

REPO_OWNER="neighborhood-lab"
REPO_NAME="folk-care"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable not set"
  exit 1
fi

API_BASE="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME"

usage() {
  cat << USAGE
Usage: $0 <command> [options]

Commands:
  issue-create <title> <body> [labels]   Create an issue
  issue-comment <issue_num> <body>       Add comment to an issue
  pr-create <title> <body> <head> <base> Create a pull request
  issue-list [state]                     List issues (open/closed/all)
  pr-list [state]                        List pull requests
  workflow-runs-list [count]             List recent workflow runs (default: 5)

Examples:
  # Create issue
  $0 issue-create "Fix bug" "Bug description" "bug,HUMAN"

  # Comment on issue
  $0 issue-comment 123 "This is a comment"

  # Create PR
  $0 pr-create "Add feature" "PR body" "feature/branch" "develop"

  # List open issues
  $0 issue-list open
USAGE
  exit 1
}

api_call() {
  local method="$1"
  local endpoint="$2"
  local data="${3:-}"
  
  if [ -n "$data" ]; then
    curl -s -X "$method" \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      "$API_BASE$endpoint" \
      -d "$data"
  else
    curl -s -X "$method" \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      "$API_BASE$endpoint"
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

  local response=$(api_call POST "/issues" "$payload")
  local issue_url=$(echo "$response" | jq -r '.html_url')

  if [ "$issue_url" != "null" ]; then
    echo "✓ Issue created: $issue_url"
    echo "$response" | jq -r '.number'
  else
    echo "✗ Failed to create issue"
    echo "$response" | jq -r '.message // .errors'
    exit 1
  fi
}

comment_issue() {
  local issue_num="$1"
  local body="$2"

  local payload=$(jq -n \
    --arg body "$body" \
    '{body: $body}')

  local response=$(api_call POST "/issues/$issue_num/comments" "$payload")
  local comment_url=$(echo "$response" | jq -r '.html_url')

  if [ "$comment_url" != "null" ]; then
    echo "✓ Comment added: $comment_url"
  else
    echo "✗ Failed to add comment"
    echo "$response" | jq -r '.message // .errors'
    exit 1
  fi
}

create_pr() {
  local title="$1"
  local body="$2"
  local head="$3"
  local base="$4"
  
  local payload=$(jq -n \
    --arg title "$title" \
    --arg body "$body" \
    --arg head "$head" \
    --arg base "$base" \
    '{title: $title, body: $body, head: $head, base: $base}')
  
  local response=$(api_call POST "/pulls" "$payload")
  local pr_url=$(echo "$response" | jq -r '.html_url')
  
  if [ "$pr_url" != "null" ]; then
    echo "✓ PR created: $pr_url"
    echo "$response" | jq -r '.number'
  else
    echo "✗ Failed to create PR"
    echo "$response" | jq -r '.message // .errors'
    exit 1
  fi
}

list_issues() {
  local state="${1:-open}"
  api_call GET "/issues?state=$state" | jq -r '.[] | "#\(.number) \(.title)"'
}

list_prs() {
  local state="${1:-open}"
  api_call GET "/pulls?state=$state" | jq -r '.[] | "#\(.number) \(.title)"'
}

list_workflow_runs() {
  local count="${1:-5}"
  api_call GET "/actions/runs?per_page=$count" | jq -r '.workflow_runs[] |
    "\(.id)\t\(.name)\t\(.status)\t\(.conclusion // "in_progress")\t\(.head_sha[0:7])\t\(.created_at)\t\(.html_url)"' |
    while IFS=$'\t' read -r id name status conclusion sha created url; do
      local status_icon="⏳"
      if [ "$conclusion" = "success" ]; then
        status_icon="✅"
      elif [ "$conclusion" = "failure" ]; then
        status_icon="❌"
      elif [ "$conclusion" = "cancelled" ]; then
        status_icon="🚫"
      fi
      echo "$status_icon $name ($sha) - $status/$conclusion - $created"
      echo "   $url"
    done
}

# Main command dispatcher
case "${1:-}" in
  issue-create)
    [ $# -lt 3 ] && usage
    create_issue "$2" "$3" "${4:-}"
    ;;
  issue-comment)
    [ $# -lt 3 ] && usage
    comment_issue "$2" "$3"
    ;;
  pr-create)
    [ $# -lt 5 ] && usage
    create_pr "$2" "$3" "$4" "$5"
    ;;
  issue-list)
    list_issues "${2:-open}"
    ;;
  pr-list)
    list_prs "${2:-open}"
    ;;
  workflow-runs-list)
    list_workflow_runs "${2:-5}"
    ;;
  *)
    usage
    ;;
esac
