#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
REQUIRED_NODE_VERSION="22"
CURRENT_NODE_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')

if [ "$CURRENT_NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
  echo -e "${RED}❌ Node.js ${REQUIRED_NODE_VERSION}.x or higher is required. Current: v${CURRENT_NODE_VERSION}${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Using Node.js v$(node --version)${NC}"
echo ""

echo -e "${BLUE}🔍 Full Validation (No Cache)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

total_checks=7
failed_checks=0
start_time=$(date +%s)

echo -e "${YELLOW}▶ ⚠️  Running fresh checks without cache${NC}"
echo ""

# 0. Clean install
echo -e "${YELLOW}▶ 🧹 Clean install (npm ci)${NC}"
ci_start=$(date +%s)
if npm ci > /tmp/npm-ci.log 2>&1; then
  ci_end=$(date +%s)
  echo -e "${GREEN}✅ npm ci completed${NC} ($((ci_end - ci_start))s)"
else
  ci_end=$(date +%s)
  echo -e "${RED}❌ npm ci failed${NC} ($((ci_end - ci_start))s)"
  echo ""
  echo -e "${RED}Error output:${NC}"
  tail -50 /tmp/npm-ci.log
  failed_checks=$((failed_checks + 1))
fi
echo ""

# 1. Lint
echo -e "${YELLOW}▶ 🔍 Lint${NC}"
lint_start=$(date +%s)
if npx turbo run lint --force 2>&1 | tee /tmp/lint.log | tail -20; then
  lint_end=$(date +%s)
  echo -e "${GREEN}✅ Lint passed${NC} ($((lint_end - lint_start))s)"
else
  lint_end=$(date +%s)
  echo -e "${RED}❌ Lint failed${NC} ($((lint_end - lint_start))s)"
  echo ""
  echo -e "${RED}Error output:${NC}"
  tail -50 /tmp/lint.log
  failed_checks=$((failed_checks + 1))
fi
echo ""

# 2. TypeCheck
echo -e "${YELLOW}▶ 🔍 TypeCheck${NC}"
typecheck_start=$(date +%s)
if npx turbo run typecheck --force 2>&1 | tee /tmp/typecheck.log | tail -20; then
  typecheck_end=$(date +%s)
  echo -e "${GREEN}✅ TypeCheck passed${NC} ($((typecheck_end - typecheck_start))s)"
else
  typecheck_end=$(date +%s)
  echo -e "${RED}❌ TypeCheck failed${NC} ($((typecheck_end - typecheck_start))s)"
  echo ""
  echo -e "${RED}Error output:${NC}"
  tail -50 /tmp/typecheck.log
  failed_checks=$((failed_checks + 1))
fi
echo ""

# 3. Tests
echo -e "${YELLOW}▶ 🧪 Tests${NC}"
test_start=$(date +%s)
if npx turbo run test --force 2>&1 | tee /tmp/test.log | tail -20; then
  test_end=$(date +%s)
  echo -e "${GREEN}✅ Tests passed${NC} ($((test_end - test_start))s)"
else
  test_end=$(date +%s)
  echo -e "${RED}❌ Tests failed${NC} ($((test_end - test_start))s)"
  echo ""
  echo -e "${RED}Error output:${NC}"
  tail -50 /tmp/test.log
  failed_checks=$((failed_checks + 1))
fi
echo ""

# 4. Build
echo -e "${YELLOW}▶ 🏗️  Build${NC}"
build_start=$(date +%s)
if npx turbo run build --force 2>&1 | tee /tmp/build.log | tail -20; then
  build_end=$(date +%s)
  echo -e "${GREEN}✅ Build passed${NC} ($((build_end - build_start))s)"
else
  build_end=$(date +%s)
  echo -e "${RED}❌ Build failed${NC} ($((build_end - build_start))s)"
  echo ""
  echo -e "${RED}Error output:${NC}"
  tail -50 /tmp/build.log
  failed_checks=$((failed_checks + 1))
fi
echo ""

# 5. Database setup
echo -e "${YELLOW}▶ 🗄️  Database: nuke, migrate, seed${NC}"
db_start=$(date +%s)
db_failed=0

# Nuke
if npm run db:nuke > /tmp/db-nuke.log 2>&1; then
  echo -e "${GREEN}  ✓ Database nuked${NC}"
else
  echo -e "${RED}  ✗ Database nuke failed${NC}"
  tail -20 /tmp/db-nuke.log
  db_failed=1
fi

# Migrate
if [ $db_failed -eq 0 ]; then
  if npm run db:migrate > /tmp/db-migrate.log 2>&1; then
    echo -e "${GREEN}  ✓ Migrations applied${NC}"
  else
    echo -e "${RED}  ✗ Migration failed${NC}"
    tail -20 /tmp/db-migrate.log
    db_failed=1
  fi
fi

# Seed base
if [ $db_failed -eq 0 ]; then
  if npm run db:seed > /tmp/db-seed.log 2>&1; then
    echo -e "${GREEN}  ✓ Base seed completed${NC}"
  else
    echo -e "${RED}  ✗ Base seed failed${NC}"
    tail -20 /tmp/db-seed.log
    db_failed=1
  fi
fi

db_end=$(date +%s)
if [ $db_failed -eq 0 ]; then
  echo -e "${GREEN}✅ Database setup passed${NC} ($((db_end - db_start))s)"
else
  echo -e "${RED}❌ Database setup failed${NC} ($((db_end - db_start))s)"
  failed_checks=$((failed_checks + 1))
fi
echo ""

# 6. Demo data seed
echo -e "${YELLOW}▶ 🌱 Demo data: db:seed:demo${NC}"
demo_start=$(date +%s)
if npm run db:seed:demo > /tmp/db-seed-demo.log 2>&1; then
  demo_end=$(date +%s)
  echo -e "${GREEN}✅ Demo seed completed${NC} ($((demo_end - demo_start))s)"
else
  demo_end=$(date +%s)
  echo -e "${RED}❌ Demo seed failed${NC} ($((demo_end - demo_start))s)"
  echo ""
  echo -e "${RED}Error output:${NC}"
  tail -50 /tmp/db-seed-demo.log
  failed_checks=$((failed_checks + 1))
fi
echo ""

# Summary
end_time=$(date +%s)
total_time=$((end_time - start_time))

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $failed_checks -eq 0 ]; then
  echo -e "${GREEN}✅ All $total_checks check(s) passed${NC} (total: ${total_time}s)"
  echo ""
  exit 0
else
  echo -e "${RED}❌ $failed_checks check(s) failed${NC} (total: ${total_time}s)"
  echo ""
  exit 1
fi
