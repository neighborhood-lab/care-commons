#!/bin/bash
# =============================================================================
# Folk Care CLI - Unified command-line interface
# =============================================================================
# Single entrypoint for all CLI operations: discord, github, etc.
#
# Agent Configuration:
#   Each agent has its own secrets directory:
#   - bedwards (Brian Leader Bot): .secrets.txt (root)
#   - tove-bot (Tove Bot): .secrets/tove-bot/.secrets.txt
#
# Usage:
#   ./scripts/cli.sh <command> [subcommand] [args...]
#   ./scripts/cli.sh --agent tove-bot <command> [subcommand] [args...]
#
# Examples:
#   ./scripts/cli.sh discord send "Hello world"
#   ./scripts/cli.sh discord read 10
#   ./scripts/cli.sh github issue-list
#   ./scripts/cli.sh github pr-create "Title" "Body" "branch" "develop"
#   ./scripts/cli.sh --agent tove-bot discord send "Message from Tove"
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default agent is bedwards (Brian Leader Bot)
AGENT="bedwards"

# =============================================================================
# Configuration
# =============================================================================

REPO_OWNER="neighborhood-lab"
REPO_NAME="folk-care"
DISCORD_GUILD_ID="1435354154490134611"
DISCORD_CHANNEL_ID="1443596956256571434"

# =============================================================================
# Argument Parsing
# =============================================================================

# Check for --agent flag
if [[ "${1:-}" == "--agent" ]]; then
  AGENT="${2:-}"
  shift 2
  if [[ -z "$AGENT" ]]; then
    echo "Error: --agent requires an agent name (bedwards, tove-bot)"
    exit 1
  fi
fi

# =============================================================================
# Secrets Loading
# =============================================================================

load_secrets() {
  local secrets_file

  case "$AGENT" in
    bedwards)
      secrets_file="$ROOT_DIR/.secrets.txt"
      ;;
    tove-bot)
      secrets_file="$ROOT_DIR/.secrets/tove-bot/.secrets.txt"
      ;;
    *)
      echo "Error: Unknown agent '$AGENT'. Valid agents: bedwards, tove-bot"
      exit 1
      ;;
  esac

  if [[ ! -f "$secrets_file" ]]; then
    echo "Error: Secrets file not found: $secrets_file"
    echo ""
    echo "Create the secrets file with:"
    echo "  GITHUB_TOKEN=ghp_..."
    echo "  DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/..."
    echo "  DISCORD_BOT_TOKEN=... (optional, for bot features)"
    exit 1
  fi

  # Source the secrets file
  set -a
  source "$secrets_file"
  set +a

  # Validate required secrets based on command
  case "${1:-}" in
    discord)
      if [[ -z "${DISCORD_WEBHOOK_URL:-}" ]]; then
        echo "Error: DISCORD_WEBHOOK_URL not set in $secrets_file"
        exit 1
      fi
      ;;
    github)
      if [[ -z "${GITHUB_TOKEN:-}" ]]; then
        echo "Error: GITHUB_TOKEN not set in $secrets_file"
        exit 1
      fi
      ;;
  esac
}

# =============================================================================
# Discord Commands (using webhook - no bot token needed)
# =============================================================================

discord_send() {
  local message="$1"
  local agent_name

  case "$AGENT" in
    bedwards) agent_name="Brian Leader Bot" ;;
    tove-bot) agent_name="Tove Bot" ;;
    *) agent_name="$AGENT" ;;
  esac

  # Format message with agent name if not already prefixed
  if [[ ! "$message" =~ ^"##" ]] && [[ ! "$message" =~ ^"**" ]]; then
    message="**[$agent_name]** $message"
  fi

  local payload
  payload=$(jq -n --arg content "$message" '{content: $content}')

  local response
  response=$(curl -s -w "\n%{http_code}" -X POST "$DISCORD_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$payload")

  local http_code
  http_code=$(echo "$response" | tail -1)

  if [[ "$http_code" == "204" ]] || [[ "$http_code" == "200" ]]; then
    echo "✅ Message sent to Discord"
  else
    echo "❌ Failed to send message (HTTP $http_code)"
    echo "$response" | head -n -1
    exit 1
  fi
}

discord_usage() {
  cat << 'USAGE'
Discord Commands:
  send <message>     Send a message to dev-team channel (via webhook)

Examples:
  ./scripts/cli.sh discord send "Deployment complete!"
  ./scripts/cli.sh discord send "## Status Update\n\nAll tests passing."
  ./scripts/cli.sh --agent tove-bot discord send "Hello from Tove!"

Note: Uses webhooks (secure, no bot token exposure). For reading messages,
use the Discord web/app interface.
USAGE
}

discord_cmd() {
  local subcmd="${1:-}"
  shift || true

  case "$subcmd" in
    send)
      [[ -z "${1:-}" ]] && { echo "Error: Message required"; discord_usage; exit 1; }
      discord_send "$1"
      ;;
    *)
      discord_usage
      [[ -n "$subcmd" ]] && exit 1
      ;;
  esac
}

# =============================================================================
# GitHub Commands (using REST API)
# =============================================================================

GITHUB_API_BASE="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME"

github_api() {
  local method="$1"
  local endpoint="$2"
  local data="${3:-}"

  if [[ -n "$data" ]]; then
    curl -s -X "$method" \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      "$GITHUB_API_BASE$endpoint" \
      -d "$data"
  else
    curl -s -X "$method" \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      "$GITHUB_API_BASE$endpoint"
  fi
}

github_issue_create() {
  local title="$1"
  local body="$2"
  local labels="${3:-}"

  local labels_json="[]"
  if [[ -n "$labels" ]]; then
    labels_json=$(echo "$labels" | jq -R 'split(",") | map(gsub("^\\s+|\\s+$";""))')
  fi

  local payload
  payload=$(jq -n \
    --arg title "$title" \
    --arg body "$body" \
    --argjson labels "$labels_json" \
    '{title: $title, body: $body, labels: $labels}')

  local response
  response=$(github_api POST "/issues" "$payload")
  local issue_url
  issue_url=$(echo "$response" | jq -r '.html_url')

  if [[ "$issue_url" != "null" ]]; then
    echo "✅ Issue created: $issue_url"
    echo "$response" | jq -r '.number'
  else
    echo "❌ Failed to create issue"
    echo "$response" | jq -r '.message // .errors'
    exit 1
  fi
}

github_issue_comment() {
  local issue_num="$1"
  local body="$2"

  local payload
  payload=$(jq -n --arg body "$body" '{body: $body}')

  local response
  response=$(github_api POST "/issues/$issue_num/comments" "$payload")
  local comment_url
  comment_url=$(echo "$response" | jq -r '.html_url')

  if [[ "$comment_url" != "null" ]]; then
    echo "✅ Comment added: $comment_url"
  else
    echo "❌ Failed to add comment"
    echo "$response" | jq -r '.message // .errors'
    exit 1
  fi
}

github_pr_create() {
  local title="$1"
  local body="$2"
  local head="$3"
  local base="$4"

  local payload
  payload=$(jq -n \
    --arg title "$title" \
    --arg body "$body" \
    --arg head "$head" \
    --arg base "$base" \
    '{title: $title, body: $body, head: $head, base: $base}')

  local response
  response=$(github_api POST "/pulls" "$payload")
  local pr_url
  pr_url=$(echo "$response" | jq -r '.html_url')

  if [[ "$pr_url" != "null" ]]; then
    echo "✅ PR created: $pr_url"
    echo "$response" | jq -r '.number'
  else
    echo "❌ Failed to create PR"
    echo "$response" | jq -r '.message // .errors'
    exit 1
  fi
}

github_pr_merge() {
  local pr_num="$1"
  local method="${2:-squash}"
  local title="${3:-}"

  if [[ -z "$title" ]]; then
    local pr_data
    pr_data=$(github_api GET "/pulls/$pr_num")
    title=$(echo "$pr_data" | jq -r '.title')
  fi

  local payload
  payload=$(jq -n \
    --arg title "$title" \
    --arg method "$method" \
    '{commit_title: $title, merge_method: $method}')

  local response
  response=$(github_api PUT "/pulls/$pr_num/merge" "$payload")
  local merged
  merged=$(echo "$response" | jq -r '.merged')

  if [[ "$merged" == "true" ]]; then
    local sha
    sha=$(echo "$response" | jq -r '.sha')
    echo "✅ PR #$pr_num merged successfully"
    echo "  Commit: $sha"
  else
    echo "❌ Failed to merge PR #$pr_num"
    echo "$response" | jq -r '.message // .errors'
    exit 1
  fi
}

github_issue_list() {
  local state="${1:-open}"
  github_api GET "/issues?state=$state" | jq -r '.[] | "#\(.number) \(.title)"'
}

github_pr_list() {
  local state="${1:-open}"
  github_api GET "/pulls?state=$state" | jq -r '.[] | "#\(.number) \(.title)"'
}

github_workflow_list() {
  local count="${1:-5}"
  github_api GET "/actions/runs?per_page=$count" | jq -r '.workflow_runs[] |
    "\(.id)\t\(.name)\t\(.status)\t\(.conclusion // "in_progress")\t\(.head_sha[0:7])\t\(.created_at)\t\(.html_url)"' |
    while IFS=$'\t' read -r id name status conclusion sha created url; do
      local status_icon="⏳"
      if [[ "$conclusion" == "success" ]]; then
        status_icon="✅"
      elif [[ "$conclusion" == "failure" ]]; then
        status_icon="❌"
      elif [[ "$conclusion" == "cancelled" ]]; then
        status_icon="🚫"
      fi
      echo "$status_icon $name ($sha) - $status/$conclusion - $created"
      echo "   $url"
    done
}

github_usage() {
  cat << 'USAGE'
GitHub Commands:
  issue-create <title> <body> [labels]    Create an issue
  issue-comment <num> <body>              Comment on an issue
  issue-list [state]                      List issues (open/closed/all)
  pr-create <title> <body> <head> <base>  Create a pull request
  pr-merge <num> [method] [title]         Merge a PR (squash/merge/rebase)
  pr-list [state]                         List pull requests
  workflow-list [count]                   List recent workflow runs

Examples:
  ./scripts/cli.sh github issue-list open
  ./scripts/cli.sh github issue-create "Fix bug" "Description" "bug"
  ./scripts/cli.sh github pr-create "Add feature" "Body" "feature/x" "develop"
  ./scripts/cli.sh github pr-merge 123 squash
USAGE
}

github_cmd() {
  local subcmd="${1:-}"
  shift || true

  case "$subcmd" in
    issue-create)
      [[ $# -lt 2 ]] && { echo "Error: title and body required"; github_usage; exit 1; }
      github_issue_create "$1" "$2" "${3:-}"
      ;;
    issue-comment)
      [[ $# -lt 2 ]] && { echo "Error: issue number and body required"; github_usage; exit 1; }
      github_issue_comment "$1" "$2"
      ;;
    issue-list)
      github_issue_list "${1:-open}"
      ;;
    pr-create)
      [[ $# -lt 4 ]] && { echo "Error: title, body, head, base required"; github_usage; exit 1; }
      github_pr_create "$1" "$2" "$3" "$4"
      ;;
    pr-merge)
      [[ $# -lt 1 ]] && { echo "Error: PR number required"; github_usage; exit 1; }
      github_pr_merge "$1" "${2:-squash}" "${3:-}"
      ;;
    pr-list)
      github_pr_list "${1:-open}"
      ;;
    workflow-list)
      github_workflow_list "${1:-5}"
      ;;
    *)
      github_usage
      [[ -n "$subcmd" ]] && exit 1
      ;;
  esac
}

# =============================================================================
# Main Usage
# =============================================================================

usage() {
  cat << 'USAGE'
Folk Care CLI - Unified command-line interface

Usage:
  ./scripts/cli.sh [--agent <name>] <command> [subcommand] [args...]

Global Options:
  --agent <name>    Use secrets for specified agent (bedwards, tove-bot)
                    Default: bedwards (Brian Leader Bot)

Commands:
  discord           Discord operations (send messages via webhook)
  github            GitHub operations (issues, PRs, workflows)
  help              Show this help message

Agent Configuration:
  Each agent has its own secrets file:
  - bedwards (Brian Leader Bot): .secrets.txt
  - tove-bot (Tove Bot): .secrets/tove-bot/.secrets.txt

Examples:
  ./scripts/cli.sh discord send "Hello world"
  ./scripts/cli.sh github issue-list
  ./scripts/cli.sh --agent tove-bot discord send "Hello from Tove!"

For command-specific help:
  ./scripts/cli.sh discord
  ./scripts/cli.sh github
USAGE
}

# =============================================================================
# Main Entry Point
# =============================================================================

main() {
  local cmd="${1:-}"
  shift || true

  case "$cmd" in
    discord)
      load_secrets discord
      discord_cmd "$@"
      ;;
    github)
      load_secrets github
      github_cmd "$@"
      ;;
    help|--help|-h|"")
      usage
      ;;
    *)
      echo "Error: Unknown command '$cmd'"
      usage
      exit 1
      ;;
  esac
}

main "$@"
