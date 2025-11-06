#!/bin/bash
set -e

# Automated Deployment Loop
# Monitors develop branch, deploys to preview and production when safe
# Verifies deployments and backports changes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

POLL_INTERVAL=${POLL_INTERVAL:-60} # Check every 60 seconds
PRODUCTION_URL="https://care-commons.vercel.app"

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_section() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Track state
LAST_DEVELOP_SHA=""
LAST_PREVIEW_SHA=""
LAST_PRODUCTION_SHA=""

get_branch_sha() {
  local branch=$1
  git fetch origin "$branch" --quiet 2>/dev/null || true
  git rev-parse "origin/$branch" 2>/dev/null || echo "unknown"
}

wait_for_github_actions() {
  local branch=$1
  local sha=$2
  
  log_info "Waiting for GitHub Actions to complete on $branch @ $sha"
  
  local max_wait=1800 # 30 minutes
  local elapsed=0
  
  while [ $elapsed -lt $max_wait ]; do
    # Get workflow runs for this commit
    local status=$(gh run list --branch "$branch" --commit "$sha" --limit 1 --json status,conclusion --jq '.[0]')
    
    if [ -z "$status" ] || [ "$status" = "null" ]; then
      log_warning "No workflow runs found yet for $sha on $branch, waiting..."
      sleep 10
      elapsed=$((elapsed + 10))
      continue
    fi
    
    local run_status=$(echo "$status" | jq -r '.status')
    local run_conclusion=$(echo "$status" | jq -r '.conclusion')
    
    if [ "$run_status" = "completed" ]; then
      if [ "$run_conclusion" = "success" ]; then
        log_success "All GitHub Actions passed on $branch @ $sha"
        return 0
      else
        log_error "GitHub Actions failed on $branch @ $sha (conclusion: $run_conclusion)"
        return 1
      fi
    fi
    
    log_info "GitHub Actions status: $run_status, waiting..."
    sleep 15
    elapsed=$((elapsed + 15))
  done
  
  log_error "Timeout waiting for GitHub Actions on $branch"
  return 1
}

deploy_to_preview() {
  local develop_sha=$1
  
  log_section "Deploying develop to preview"
  
  # Checkout preview branch
  git fetch origin preview --quiet
  git checkout preview --quiet
  
  # Merge develop into preview
  log_info "Merging develop ($develop_sha) into preview"
  if git merge "origin/develop" --no-edit --quiet; then
    log_success "Merged develop into preview"
  else
    log_error "Failed to merge develop into preview"
    git merge --abort 2>/dev/null || true
    git checkout develop --quiet
    return 1
  fi
  
  # Push to trigger deployment
  log_info "Pushing to preview branch to trigger deployment"
  if git push origin preview --quiet; then
    log_success "Pushed to preview branch"
  else
    log_error "Failed to push to preview"
    git checkout develop --quiet
    return 1
  fi
  
  # Wait for GitHub Actions
  local preview_sha=$(git rev-parse HEAD)
  if ! wait_for_github_actions "preview" "$preview_sha"; then
    log_error "Preview deployment failed CI checks"
    git checkout develop --quiet
    return 1
  fi
  
  log_success "Preview deployment initiated successfully"
  git checkout develop --quiet
  return 0
}

deploy_to_production() {
  local preview_sha=$1
  
  log_section "Deploying preview to production"
  
  # Checkout production branch
  git fetch origin production --quiet
  git checkout production --quiet
  
  # Merge preview into production
  log_info "Merging preview ($preview_sha) into production"
  if git merge "origin/preview" --no-edit --quiet; then
    log_success "Merged preview into production"
  else
    log_error "Failed to merge preview into production"
    git merge --abort 2>/dev/null || true
    git checkout develop --quiet
    return 1
  fi
  
  # Push to trigger deployment
  log_info "Pushing to production branch to trigger deployment"
  if git push origin production --quiet; then
    log_success "Pushed to production branch"
  else
    log_error "Failed to push to production"
    git checkout develop --quiet
    return 1
  fi
  
  # Wait for GitHub Actions
  local production_sha=$(git rev-parse HEAD)
  if ! wait_for_github_actions "production" "$production_sha"; then
    log_error "Production deployment failed CI checks"
    git checkout develop --quiet
    return 1
  fi
  
  log_success "Production deployment initiated successfully"
  git checkout develop --quiet
  return 0
}

verify_production_deployment() {
  log_section "Verifying Production Deployment"
  
  # Wait for deployment to stabilize
  log_info "Waiting 30 seconds for deployment to stabilize..."
  sleep 30
  
  # Run validation script
  if ./scripts/validate-deployment.sh "$PRODUCTION_URL" "production"; then
    log_success "Production deployment verification passed"
    return 0
  else
    log_warning "Production deployment verification had issues"
    log_warning "Manual verification may be required"
    # Don't fail - validation script handles reporting
    return 0
  fi
}

backport_changes() {
  log_section "Backporting changes to develop"
  
  git fetch --all --quiet
  git checkout develop --quiet
  
  # Check if preview or production have commits not in develop
  local preview_sha=$(get_branch_sha "preview")
  local production_sha=$(get_branch_sha "production")
  local develop_sha=$(get_branch_sha "develop")
  
  local needs_backport=false
  
  # Check if preview has commits not in develop
  if git merge-base --is-ancestor "$preview_sha" "$develop_sha" 2>/dev/null; then
    log_info "Preview is already in develop"
  else
    log_info "Preview has changes not in develop, backporting..."
    if git merge "origin/preview" --no-edit --quiet; then
      log_success "Backported preview changes to develop"
      needs_backport=true
    else
      log_error "Failed to backport preview changes (merge conflict)"
      git merge --abort 2>/dev/null || true
    fi
  fi
  
  # Check if production has commits not in develop
  if git merge-base --is-ancestor "$production_sha" "$develop_sha" 2>/dev/null; then
    log_info "Production is already in develop"
  else
    log_info "Production has changes not in develop, backporting..."
    if git merge "origin/production" --no-edit --quiet; then
      log_success "Backported production changes to develop"
      needs_backport=true
    else
      log_error "Failed to backport production changes (merge conflict)"
      git merge --abort 2>/dev/null || true
    fi
  fi
  
  # Push backported changes
  if [ "$needs_backport" = true ]; then
    log_info "Pushing backported changes to develop"
    if git push origin develop --quiet; then
      log_success "Backported changes pushed to develop"
    else
      log_error "Failed to push backported changes"
    fi
  fi
}

create_fix_pr_if_needed() {
  local issue_description=$1
  
  log_section "Creating Fix PR"
  
  # Generate unique branch name
  local timestamp=$(date +%s)
  local branch_name="feature/auto-fix-deployment-issue-${timestamp}"
  
  log_info "Creating feature branch: $branch_name"
  git checkout -b "$branch_name" develop
  
  # Create a placeholder file to document the issue
  local issue_file="docs/deployment-issues/issue-${timestamp}.md"
  mkdir -p "docs/deployment-issues"
  
  cat > "$issue_file" <<EOF
# Deployment Issue - $(date -u '+%Y-%m-%d %H:%M:%S UTC')

## Issue Description
$issue_description

## Detection
Automated deployment loop detected this issue and could not resolve it automatically.

## Required Action
Manual investigation and fix required. See logs above for details.

## Context
- Branch: develop
- Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
- Automated by: deployment loop script

EOF
  
  git add "$issue_file"
  git commit -m "Document deployment issue requiring manual fix

Issue: $issue_description

Detected by automated deployment loop at $(date -u '+%Y-%m-%d %H:%M:%S UTC').
Requires manual investigation and resolution."
  
  git push origin "$branch_name"
  
  # Create PR
  log_info "Creating pull request for manual review"
  gh pr create \
    --title "Fix: Deployment issue detected - $(date '+%Y-%m-%d %H:%M')" \
    --body "$(cat <<'EOF'
## Summary
Automated deployment loop detected an issue that requires manual intervention.

## Issue Details
See attached documentation file for details.

## Required Actions
1. Review the deployment logs and issue documentation
2. Investigate the root cause
3. Implement a fix
4. Update tests to prevent regression
5. Merge this PR once resolved

## Auto-generated
This PR was automatically created by the deployment monitoring system.
EOF
)" \
    --base develop \
    --head "$branch_name"
  
  log_success "Created PR for manual review: $branch_name"
  git checkout develop
}

# Main monitoring loop
main() {
  log_section "Starting Automated Deployment Loop"
  log_info "Monitoring develop branch for changes"
  log_info "Poll interval: ${POLL_INTERVAL}s"
  log_info "Production URL: $PRODUCTION_URL"
  
  # Ensure we're on develop
  git checkout develop --quiet
  
  # Initialize state
  LAST_DEVELOP_SHA=$(get_branch_sha "develop")
  LAST_PREVIEW_SHA=$(get_branch_sha "preview")
  LAST_PRODUCTION_SHA=$(get_branch_sha "production")
  
  log_info "Initial state:"
  log_info "  develop:    $LAST_DEVELOP_SHA"
  log_info "  preview:    $LAST_PREVIEW_SHA"
  log_info "  production: $LAST_PRODUCTION_SHA"
  
  local iteration=0
  
  while true; do
    iteration=$((iteration + 1))
    log_section "Iteration $iteration - $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Fetch latest changes
    git fetch --all --quiet
    
    # Check if develop has new commits
    local current_develop_sha=$(get_branch_sha "develop")
    
    if [ "$current_develop_sha" != "$LAST_DEVELOP_SHA" ]; then
      log_success "New commits detected on develop: $LAST_DEVELOP_SHA -> $current_develop_sha"
      
      # Wait for GitHub Actions on develop
      if wait_for_github_actions "develop" "$current_develop_sha"; then
        log_success "Develop branch CI passed, ready to deploy"
        
        # Deploy to preview
        if deploy_to_preview "$current_develop_sha"; then
          log_success "Preview deployment completed"
          LAST_PREVIEW_SHA=$(get_branch_sha "preview")
          
          # Small delay before production deployment
          log_info "Waiting 30 seconds before production deployment..."
          sleep 30
          
          # Deploy to production
          if deploy_to_production "$LAST_PREVIEW_SHA"; then
            log_success "Production deployment completed"
            LAST_PRODUCTION_SHA=$(get_branch_sha "production")
            
            # Verify production
            verify_production_deployment
            
            # Backport changes
            backport_changes
            
            # Update state
            LAST_DEVELOP_SHA=$(get_branch_sha "develop")
          else
            log_error "Production deployment failed"
            create_fix_pr_if_needed "Production deployment failed - see logs"
          fi
        else
          log_error "Preview deployment failed"
          create_fix_pr_if_needed "Preview deployment failed - see logs"
        fi
      else
        log_error "Develop branch CI failed, not deploying"
        log_warning "Waiting for fixes to be merged to develop..."
      fi
    else
      log_info "No new commits on develop (current: $current_develop_sha)"
    fi
    
    # Check for open PRs
    local open_pr_count=$(gh pr list --state open --base develop --json number --jq 'length')
    if [ "$open_pr_count" -gt 0 ]; then
      log_info "Open PRs targeting develop: $open_pr_count"
      gh pr list --state open --base develop --json number,title,author --jq '.[] | "  #\(.number): \(.title) (@\(.author.login))"'
    fi
    
    # Sleep before next iteration
    log_info "Sleeping for ${POLL_INTERVAL}s..."
    sleep "$POLL_INTERVAL"
  done
}

# Cleanup handler
cleanup() {
  log_warning "Received interrupt signal, cleaning up..."
  git checkout develop --quiet 2>/dev/null || true
  log_info "Cleanup complete"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Start the loop
main
