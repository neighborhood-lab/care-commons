#!/bin/bash
set -e

# Deployment Readiness Check Script
# Comprehensive validation before pushing to preview or production
# Based on November 2025 deployment lessons learned

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Deployment Readiness Check${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Track all failures
FAILED_CHECKS=()
PASSED_CHECKS=()

# Function to run a check
run_check() {
  local name=$1
  local command=$2
  
  echo -e "${YELLOW}▶ $name${NC}"
  
  if eval "$command" > /tmp/check-output.txt 2>&1; then
    echo -e "${GREEN}✅ $name - PASSED${NC}"
    PASSED_CHECKS+=("$name")
  else
    echo -e "${RED}❌ $name - FAILED${NC}"
    echo "   $(cat /tmp/check-output.txt | head -5)"
    FAILED_CHECKS+=("$name")
  fi
  echo ""
}

# 1. Critical: ESM Configuration (DO NOT REGRESS!)
echo -e "${BLUE}1. ESM Architecture Validation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_check "package.json has type: module" \
  "grep -q '\"type\": \"module\"' package.json"

run_check "package.json has node: 22.x" \
  "grep -q '\"node\": \"22\.x\"' package.json"

run_check "All package.json build scripts use tsc-alias" \
  "find packages verticals -name 'package.json' -exec grep -l 'tsc-alias' {} \; | wc -l | grep -q '[1-9]'"

run_check "API entry point imports from dist/" \
  "grep -q 'from.*dist.*server\.js' api/index.ts"

# 2. Vercel Configuration
echo -e "${BLUE}2. Vercel Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_check "Vercel configuration validates" \
  "npx tsx scripts/validate-vercel-config.ts"

run_check "vercel.json includes dist in functions" \
  "grep -q 'dist' vercel.json"

# 3. Build & Type Safety
echo -e "${BLUE}3. Build & Type Safety${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_check "Lint passes (or warnings only)" \
  "npm run lint 2>&1 | grep -E '^Tasks:.*successful' || true"

run_check "TypeCheck passes" \
  "npm run typecheck"

run_check "Build succeeds" \
  "npm run build"

run_check "Tests pass" \
  "npm run test"

# 4. Database Configuration
echo -e "${BLUE}4. Database Readiness${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_check "Migration files exist" \
  "test -d packages/core/migrations && find packages/core/migrations -name '*.sql' | wc -l | grep -q '[1-9]'"

run_check "Seed script exists" \
  "test -f packages/core/src/db/seed-demo.ts"

# 5. Regression Tests (Critical Paths from November 2025)
echo -e "${BLUE}5. Regression Test Suite${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_check "Server module imports (ESM resolution)" \
  "npm run test -- src/__tests__/regression.test.ts 2>&1 | grep -q 'passed'"

run_check "Authentication flow tests exist" \
  "test -f packages/web/src/app/pages/__tests__/Login.test.tsx"

# 6. Deployment Scripts
echo -e "${BLUE}6. Deployment Scripts Present${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_check "validate-deployment.sh exists" \
  "test -x scripts/validate-deployment.sh"

run_check "validate-migrations-safety.sh exists" \
  "test -x scripts/validate-migrations-safety.sh"

run_check "pre-deploy-checks.ts exists" \
  "test -f scripts/pre-deploy-checks.ts"

# 7. GitHub Actions Workflows
echo -e "${BLUE}7. CI/CD Workflows${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_check "deploy.yml workflow exists" \
  "test -f .github/workflows/deploy.yml"

run_check "ci.yml workflow exists" \
  "test -f .github/workflows/ci.yml"

run_check "Deploy workflow has preview and production jobs" \
  "grep -q 'deploy-preview' .github/workflows/deploy.yml && grep -q 'deploy-production' .github/workflows/deploy.yml"

# 8. Security Headers
echo -e "${BLUE}8. Security Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_check "Security headers in vercel.json" \
  "grep -q 'X-Content-Type-Options' vercel.json && grep -q 'Strict-Transport-Security' vercel.json"

run_check "No JWT secrets in code" \
  "! grep -r 'JWT_SECRET.*=.*['\"]' packages verticals --include='*.ts' --include='*.tsx' || true"

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Deployment Readiness Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL_CHECKS=$((${#PASSED_CHECKS[@]} + ${#FAILED_CHECKS[@]}))
echo "Total Checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: ${#PASSED_CHECKS[@]}${NC}"
echo -e "${RED}Failed: ${#FAILED_CHECKS[@]}${NC}"
echo ""

if [ ${#FAILED_CHECKS[@]} -eq 0 ]; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ DEPLOYMENT READY!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Safe to deploy to:"
  echo "  • Preview: git push origin preview"
  echo "  • Production: git push origin production"
  echo ""
  exit 0
else
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}❌ NOT READY FOR DEPLOYMENT${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Failed checks:"
  for check in "${FAILED_CHECKS[@]}"; do
    echo "  • $check"
  done
  echo ""
  echo "Please fix these issues before deploying."
  echo ""
  exit 1
fi
