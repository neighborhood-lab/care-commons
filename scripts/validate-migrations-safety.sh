#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ENVIRONMENT=${1:-"preview"}

echo -e "${BLUE}🔍 Pre-Deployment Migration Safety Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment: $ENVIRONMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Track issues
WARNINGS=()
ERRORS=()

# 1. Check if DATABASE_URL is set
echo -e "${YELLOW}▶ Checking database configuration...${NC}"
if [ -z "$DATABASE_URL" ]; then
  ERRORS+=("DATABASE_URL environment variable is not set")
  echo -e "${RED}❌ DATABASE_URL not set${NC}"
else
  echo -e "${GREEN}✅ DATABASE_URL is configured${NC}"
fi
echo ""

# 2. Verify migration files exist
echo -e "${YELLOW}▶ Checking for pending migrations...${NC}"
MIGRATION_DIR="packages/core/migrations"

if [ ! -d "$MIGRATION_DIR" ]; then
  ERRORS+=("Migration directory not found: $MIGRATION_DIR")
  echo -e "${RED}❌ Migration directory not found${NC}"
else
  MIGRATION_COUNT=$(ls -1 "$MIGRATION_DIR"/*.ts 2>/dev/null | wc -l | xargs)
  echo -e "${GREEN}✅ Found $MIGRATION_COUNT migration files${NC}"
fi
echo ""

# 3. Check for dangerous migration patterns
echo -e "${YELLOW}▶ Scanning migrations for dangerous operations...${NC}"

DANGEROUS_PATTERNS=(
  "DROP TABLE"
  "DROP COLUMN"
  "DROP DATABASE"
  "TRUNCATE"
  "ALTER TABLE.*DROP"
)

RECENT_MIGRATIONS=$(find "$MIGRATION_DIR" -name "*.ts" -mtime -7 2>/dev/null || true)

if [ -z "$RECENT_MIGRATIONS" ]; then
  echo -e "${BLUE}ℹ️  No migrations modified in the last 7 days${NC}"
else
  for pattern in "${DANGEROUS_PATTERNS[@]}"; do
    if grep -iE "$pattern" $RECENT_MIGRATIONS > /dev/null 2>&1; then
      WARNINGS+=("Found potentially dangerous operation: $pattern")
      echo -e "${YELLOW}⚠️  Found: $pattern${NC}"
    fi
  done
  
  if [ ${#WARNINGS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ No dangerous operations detected${NC}"
  fi
fi
echo ""

# 4. Verify migration file naming convention
echo -e "${YELLOW}▶ Validating migration file naming...${NC}"
INVALID_NAMES=()

for file in "$MIGRATION_DIR"/*.ts; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    # Check if filename matches pattern: YYYYMMDDHHMMSS_description.ts
    if ! [[ "$filename" =~ ^[0-9]{14}_[a-z0-9_-]+\.ts$ ]]; then
      INVALID_NAMES+=("$filename")
    fi
  fi
done

if [ ${#INVALID_NAMES[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ All migration files follow naming convention${NC}"
else
  for name in "${INVALID_NAMES[@]}"; do
    WARNINGS+=("Invalid migration filename: $name")
    echo -e "${YELLOW}⚠️  Invalid name: $name${NC}"
  done
fi
echo ""

# 5. Production-specific checks
if [ "$ENVIRONMENT" = "production" ]; then
  echo -e "${YELLOW}▶ Running production-specific safety checks...${NC}"
  
  # Check if this is a hotfix/emergency deployment
  if [ "$SKIP_MIGRATION_SAFETY" = "true" ]; then
    WARNINGS+=("Migration safety checks skipped (SKIP_MIGRATION_SAFETY=true)")
    echo -e "${YELLOW}⚠️  Safety checks SKIPPED - emergency deployment mode${NC}"
  else
    echo -e "${GREEN}✅ Full safety checks enabled${NC}"
  fi
  
  # Remind about backup
  echo ""
  echo -e "${BLUE}ℹ️  PRODUCTION DEPLOYMENT REMINDER:${NC}"
  echo "   1. Database backup should be taken before migrations"
  echo "   2. Migrations should be tested in preview environment first"
  echo "   3. Have rollback plan ready if issues occur"
  echo ""
fi

# Report results
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo -e "${RED}❌ CRITICAL ERRORS - Cannot proceed with deployment:${NC}"
  for error in "${ERRORS[@]}"; do
    echo "  • $error"
  done
  echo ""
  exit 1
fi

if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo -e "${YELLOW}⚠️  ${#WARNINGS[@]} Warning(s) detected:${NC}"
  for warning in "${WARNINGS[@]}"; do
    echo "  • $warning"
  done
  echo ""
  echo -e "${YELLOW}⚠️  Please review warnings before proceeding${NC}"
  echo ""
  
  # In production, warnings should be acknowledged
  if [ "$ENVIRONMENT" = "production" ] && [ "$ACKNOWLEDGE_WARNINGS" != "true" ]; then
    echo -e "${RED}❌ Production deployment requires ACKNOWLEDGE_WARNINGS=true${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✅ Migration safety checks passed${NC}"
echo ""
exit 0
