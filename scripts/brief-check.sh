#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure we're using the correct Node.js version via NVM
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  source "$NVM_DIR/nvm.sh"
  if [ -f .nvmrc ]; then
    nvm use
  else
    nvm use 22 2>/dev/null || nvm install 22
  fi
fi

# Verify Node.js version
NODE_VERSION=$(node --version | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 22 ]; then
  echo -e "${RED}❌ Error: Node.js 22.x or higher is required. Current version: $(node --version)${NC}"
  echo "   Please run: nvm install 22 && nvm use 22"
  exit 1
fi

echo -e "${GREEN}✅ Using Node.js $(node --version)${NC}"
echo ""
echo -e "${BLUE}🔍 Pre-commit Validation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Track overall timing
OVERALL_START=$(date +%s)

# Function to run check with timing and error capture
run_check() {
  local name=$1
  local emoji=$2
  local command=$3

  echo -e "${YELLOW}▶ $emoji $name${NC}"
  local step_start=$(date +%s)

  if eval "$command" > /tmp/check-output.log 2>&1; then
    local step_end=$(date +%s)
    local duration=$((step_end - step_start))
    echo -e "${GREEN}✅ $name passed${NC} (${duration}s)"
    echo ""
    return 0
  else
    local step_end=$(date +%s)
    local duration=$((step_end - step_start))
    echo -e "${RED}❌ $name failed${NC} (${duration}s)"
    echo ""
    echo -e "${RED}Error output:${NC}"
    cat /tmp/check-output.log
    echo ""
    return 1
  fi
}

# Track failures
FAILED_CHECKS=()

# Clear turbo cache before running checks
echo -e "${YELLOW}▶ 🧹 Clearing turbo cache${NC}"
npx turbo daemon clean > /dev/null 2>&1 || true
rm -rf .turbo node_modules/.cache > /dev/null 2>&1 || true
echo ""

# Run checks (always force to ensure fresh results)
# Limit concurrency to avoid resource contention with vitest
run_check "Lint" "🔍" "npx turbo run lint --force" || FAILED_CHECKS+=("Lint")
run_check "TypeCheck" "🔎" "npx turbo run typecheck --force" || FAILED_CHECKS+=("TypeCheck")
run_check "Tests" "🧪" "npx turbo run test --force --concurrency=4" || FAILED_CHECKS+=("Tests")

# Calculate total duration
OVERALL_END=$(date +%s)
TOTAL_DURATION=$((OVERALL_END - OVERALL_START))

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Report results
if [ ${#FAILED_CHECKS[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed${NC} (total: ${TOTAL_DURATION}s)"
  echo ""
  exit 0
else
  echo -e "${RED}❌ ${#FAILED_CHECKS[@]} check(s) failed${NC} (total: ${TOTAL_DURATION}s)"
  echo ""
  echo -e "${RED}Failed checks:${NC}"
  for check in "${FAILED_CHECKS[@]}"; do
    echo "  • $check"
  done
  echo ""
  exit 1
fi
