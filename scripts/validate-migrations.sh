#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🗄️  Database Migration Validation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

MIGRATIONS_DIR="packages/core/migrations"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo -e "${YELLOW}⚠️  No migrations directory found at $MIGRATIONS_DIR${NC}"
  echo "Creating migrations directory..."
  mkdir -p "$MIGRATIONS_DIR"
  exit 0
fi

# Check for uncommitted migrations
echo "▶ Checking for uncommitted migration files..."
UNCOMMITTED=$(git status --porcelain "$MIGRATIONS_DIR/" 2>/dev/null | wc -l || echo "0")

if [ "$UNCOMMITTED" -gt 0 ]; then
  echo -e "${RED}❌ Uncommitted migration files detected${NC}"
  echo ""
  git status "$MIGRATIONS_DIR/"
  echo ""
  echo "Please commit or stash migration files before proceeding"
  exit 1
fi

echo -e "${GREEN}✅ No uncommitted migrations${NC}"
echo ""

# Validate migration file naming
echo "▶ Validating migration file names..."
INVALID_FILES=()

for file in "$MIGRATIONS_DIR"/*.ts; do
  # Skip if no .ts files exist
  if [ ! -e "$file" ]; then
    echo -e "${GREEN}✅ No migration files to validate${NC}"
    break
  fi

  filename=$(basename "$file")

  # Check format: 14-digit-timestamp_description.ts
  if [[ ! "$filename" =~ ^[0-9]{14}_.+\.ts$ ]]; then
    INVALID_FILES+=("$filename")
  fi
done

if [ ${#INVALID_FILES[@]} -gt 0 ]; then
  echo -e "${RED}❌ Invalid migration filenames detected${NC}"
  echo ""
  for file in "${INVALID_FILES[@]}"; do
    echo "  • $file"
  done
  echo ""
  echo "Expected format: 14-digit-timestamp_description.ts"
  echo "Example: 20240101120000_add_users_table.ts"
  exit 1
fi

echo -e "${GREEN}✅ All migration filenames are valid${NC}"
echo ""

# Check for migration syntax errors
echo "▶ Checking migration syntax..."

# Check if there are any TypeScript files to check
if ls "$MIGRATIONS_DIR"/*.ts >/dev/null 2>&1; then
  # Use tsc to check syntax without emitting files
  if npx tsc --noEmit "$MIGRATIONS_DIR"/*.ts 2>&1 | tee /tmp/tsc-migration-check.log; then
    echo -e "${GREEN}✅ Migration syntax is valid${NC}"
  else
    echo -e "${RED}❌ Migration syntax errors detected${NC}"
    cat /tmp/tsc-migration-check.log
    exit 1
  fi
else
  echo -e "${GREEN}✅ No migrations to validate${NC}"
fi

echo ""

# Validate migration structure (must have up and down exports)
echo "▶ Validating migration structure..."
MISSING_FUNCTIONS=()

for file in "$MIGRATIONS_DIR"/*.ts; do
  # Skip if no .ts files exist
  if [ ! -e "$file" ]; then
    break
  fi

  filename=$(basename "$file")
  content=$(cat "$file")

  # Check for up function
  if ! echo "$content" | grep -q "export.*function up"; then
    MISSING_FUNCTIONS+=("$filename: missing 'up' function")
  fi

  # Check for down function
  if ! echo "$content" | grep -q "export.*function down"; then
    MISSING_FUNCTIONS+=("$filename: missing 'down' function")
  fi
done

if [ ${#MISSING_FUNCTIONS[@]} -gt 0 ]; then
  echo -e "${RED}❌ Migration structure errors detected${NC}"
  echo ""
  for error in "${MISSING_FUNCTIONS[@]}"; do
    echo "  • $error"
  done
  echo ""
  echo "All migrations must export both 'up' and 'down' functions"
  exit 1
fi

echo -e "${GREEN}✅ All migrations have required up/down functions${NC}"
echo ""

# Check for sequential timestamps
echo "▶ Checking migration timestamp ordering..."

timestamps=()
for file in "$MIGRATIONS_DIR"/*.ts; do
  # Skip if no .ts files exist
  if [ ! -e "$file" ]; then
    break
  fi

  filename=$(basename "$file")
  timestamp=$(echo "$filename" | grep -oE '^[0-9]{14}')

  if [ -n "$timestamp" ]; then
    timestamps+=("$timestamp")
  fi
done

# Sort timestamps
if [ ${#timestamps[@]} -gt 1 ]; then
  sorted_timestamps=($(printf '%s\n' "${timestamps[@]}" | sort))

  # Check if original order matches sorted order
  NON_SEQUENTIAL=false
  for i in "${!timestamps[@]}"; do
    if [ "${timestamps[$i]}" != "${sorted_timestamps[$i]}" ]; then
      NON_SEQUENTIAL=true
      break
    fi
  done

  if [ "$NON_SEQUENTIAL" = true ]; then
    echo -e "${YELLOW}⚠️  Migration timestamps are not in sequential order${NC}"
    echo "This may cause issues when running migrations"
  else
    echo -e "${GREEN}✅ Migration timestamps are sequential${NC}"
  fi
else
  echo -e "${GREEN}✅ Only one or no migrations found${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Migration validation completed successfully${NC}"
echo ""
