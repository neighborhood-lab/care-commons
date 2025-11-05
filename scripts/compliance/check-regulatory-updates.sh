#!/bin/bash
#
# Check for Regulatory Updates
#
# This script monitors official state sources for potential regulatory changes.
# Run weekly via cron to stay informed of policy updates.
#
# Usage:
#   ./scripts/compliance/check-regulatory-updates.sh [STATE_CODE]
#
# Examples:
#   ./scripts/compliance/check-regulatory-updates.sh TX
#   ./scripts/compliance/check-regulatory-updates.sh FL
#   ./scripts/compliance/check-regulatory-updates.sh     # Check all states
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# State to check (optional)
STATE_CODE="${1:-ALL}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Regulatory Update Checker${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if state documentation exists
check_state_exists() {
  local state_lower=$(echo "$1" | tr '[:upper:]' '[:lower:]')
  local state_dir=""
  
  case "$state_lower" in
    tx) state_dir="texas" ;;
    fl) state_dir="florida" ;;
    oh) state_dir="ohio" ;;
    pa) state_dir="pennsylvania" ;;
    ga) state_dir="georgia" ;;
    nc) state_dir="north-carolina" ;;
    az) state_dir="arizona" ;;
    *) return 1 ;;
  esac
  
  if [ -d "docs/compliance/$state_dir" ]; then
    echo "$state_dir"
    return 0
  else
    return 1
  fi
}

# Function to check last update date
check_last_update() {
  local state_dir="$1"
  local req_file="docs/compliance/$state_dir/REQUIREMENTS.md"
  
  if [ -f "$req_file" ]; then
    # Extract last updated date from REQUIREMENTS.md
    local last_update=$(grep "^**Last Updated**:" "$req_file" | sed 's/.*: //' | tr -d '\r')
    
    if [ -n "$last_update" ]; then
      # Calculate days since last update
      local last_epoch=$(date -j -f "%Y-%m-%d" "$last_update" "+%s" 2>/dev/null || echo "0")
      local now_epoch=$(date "+%s")
      local days_diff=$(( (now_epoch - last_epoch) / 86400 ))
      
      echo -e "${YELLOW}State:${NC} $state_dir"
      echo -e "${YELLOW}Last Updated:${NC} $last_update ($days_diff days ago)"
      
      # Warning if over 90 days
      if [ $days_diff -gt 90 ]; then
        echo -e "${RED}⚠️  WARNING: Documentation over 90 days old - review recommended${NC}"
      else
        echo -e "${GREEN}✓ Documentation current${NC}"
      fi
      
      echo ""
    fi
  fi
}

# Function to check for recent git changes
check_git_changes() {
  local state_dir="$1"
  
  # Check git log for changes in last 90 days
  local recent_changes=$(git log --since="90 days ago" --oneline -- "docs/compliance/$state_dir" 2>/dev/null | wc -l | tr -d ' ')
  
  if [ "$recent_changes" -gt 0 ]; then
    echo -e "${GREEN}✓ $recent_changes update(s) in last 90 days${NC}"
    echo ""
    echo "Recent changes:"
    git log --since="90 days ago" --oneline --pretty=format:"  %C(yellow)%h%Creset - %s %C(green)(%cr)%Creset" -- "docs/compliance/$state_dir"
    echo ""
  else
    echo -e "${YELLOW}ℹ  No updates in last 90 days${NC}"
  fi
  
  echo ""
}

# Function to display monitoring sources
display_monitoring_sources() {
  local state_dir="$1"
  local changelog="docs/compliance/$state_dir/CHANGELOG.md"
  
  if [ -f "$changelog" ]; then
    echo "Monitoring Sources (from CHANGELOG.md):"
    echo ""
    
    # Extract monitoring sources section
    sed -n '/## Monitoring for Changes/,/##/p' "$changelog" | grep -E '^\- \*\*|^### ' | head -10 || echo "  (No monitoring sources documented)"
    
    echo ""
  fi
}

# Main logic
if [ "$STATE_CODE" = "ALL" ]; then
  echo "Checking all documented states..."
  echo ""
  
  for state_dir in docs/compliance/*/; do
    # Skip template directory
    if [[ "$state_dir" == *"_template"* ]]; then
      continue
    fi
    
    state_name=$(basename "$state_dir")
    
    echo -e "${BLUE}==== $state_name ====${NC}"
    check_last_update "$state_name"
    check_git_changes "$state_name"
    echo ""
  done
else
  # Check specific state
  state_dir=$(check_state_exists "$STATE_CODE")
  
  if [ $? -eq 0 ]; then
    echo -e "${BLUE}==== $state_dir ====${NC}"
    echo ""
    check_last_update "$state_dir"
    check_git_changes "$state_dir"
    display_monitoring_sources "$state_dir"
  else
    echo -e "${RED}Error: State '$STATE_CODE' not found or not documented yet${NC}"
    echo ""
    echo "Available states:"
    for dir in docs/compliance/*/; do
      if [[ "$dir" != *"_template"* ]]; then
        basename "$dir"
      fi
    done
    exit 1
  fi
fi

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Recommendations:${NC}"
echo ""
echo "1. Review state websites weekly for policy updates"
echo "2. Update REQUIREMENTS.md if regulations change"
echo "3. Document changes in CHANGELOG.md with citations"
echo "4. Update validators and tests as needed"
echo "5. Set up Google Alerts for regulatory changes"
echo ""
echo -e "${YELLOW}Next Review: $(date -v+7d +%Y-%m-%d)${NC}"
echo ""

exit 0
