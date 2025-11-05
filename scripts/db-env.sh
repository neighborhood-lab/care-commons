#!/bin/bash

# ══════════════════════════════════════════════════════════════════════════════
# Database Environment Wrapper Script
# ══════════════════════════════════════════════════════════════════════════════
# 
# This script runs database operations against different environments by loading
# the appropriate .env file before executing the database command.
# 
# Usage:
#   ./scripts/db-env.sh <command> [--env=<environment>]
#
# Commands:
#   nuke          Drop all tables and extensions
#   migrate       Run all migrations
#   seed          Seed minimal operational data
#   seed:demo     Seed demo data
#   reset         Nuke + Migrate + Seed
#   reset:demo    Nuke + Migrate + Seed + Seed:demo
#
# Environments:
#   --env=local      Use .env (default)
#   --env=preview    Use .env.preview
#   --env=production Use .env.production
#
# Examples:
#   ./scripts/db-env.sh migrate                    # Run against local dev (default)
#   ./scripts/db-env.sh migrate --env=preview      # Run against preview/staging
#   ./scripts/db-env.sh reset:demo --env=preview   # Full reset with demo data on preview
#   ./scripts/db-env.sh nuke --env=production      # Nuke production (be careful!)
# ══════════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
COMMAND=""
ENV_FILE=".env"
ENV_NAME="local"

for arg in "$@"; do
  case $arg in
    --env=*)
      ENV_ARG="${arg#*=}"
      case $ENV_ARG in
        local|dev|development)
          ENV_FILE=".env"
          ENV_NAME="local"
          ;;
        preview|staging)
          ENV_FILE=".env.preview"
          ENV_NAME="preview"
          ;;
        production|prod)
          ENV_FILE=".env.production"
          ENV_NAME="production"
          ;;
        *)
          echo -e "${RED}❌ Unknown environment: $ENV_ARG${NC}"
          echo "Valid environments: local, preview, production"
          exit 1
          ;;
      esac
      ;;
    *)
      COMMAND="$arg"
      ;;
  esac
done

# Validate command
if [ -z "$COMMAND" ]; then
  echo -e "${RED}❌ No command specified${NC}"
  echo ""
  echo "Usage: ./scripts/db-env.sh <command> [--env=<environment>]"
  echo ""
  echo "Commands:"
  echo "  nuke          Drop all tables and extensions"
  echo "  migrate       Run all migrations"
  echo "  seed          Seed minimal operational data"
  echo "  seed:demo     Seed demo data"
  echo "  reset         Nuke + Migrate + Seed"
  echo "  reset:demo    Nuke + Migrate + Seed + Seed:demo"
  echo ""
  echo "Environments:"
  echo "  --env=local      Use .env (default)"
  echo "  --env=preview    Use .env.preview"
  echo "  --env=production Use .env.production"
  exit 1
fi

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
  echo ""
  echo "Please create $ENV_FILE with your database credentials."
  echo "See .env.example for reference."
  exit 1
fi

# Warning for production
if [ "$ENV_NAME" = "production" ]; then
  echo -e "${RED}⚠️  WARNING: You are about to run against PRODUCTION database!${NC}"
  echo -e "${YELLOW}Environment: $ENV_NAME${NC}"
  echo -e "${YELLOW}Env File: $ENV_FILE${NC}"
  echo -e "${YELLOW}Command: $COMMAND${NC}"
  echo ""
  echo -n "Type 'YES' to confirm: "
  read -r confirmation
  if [ "$confirmation" != "YES" ]; then
    echo -e "${GREEN}✅ Operation cancelled${NC}"
    exit 0
  fi
  echo ""
fi

# Show what we're doing
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🗄️  Database Operation${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Environment: $ENV_NAME${NC}"
echo -e "${GREEN}Env File: $ENV_FILE${NC}"
echo -e "${GREEN}Command: $COMMAND${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo ""

# Export environment variables from the selected env file
# Handle both simple KEY=value and KEY="value with spaces" formats
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ $key =~ ^[[:space:]]*# ]] && continue
  [[ -z "$key" ]] && continue
  
  # Remove leading/trailing whitespace
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)
  
  # Remove quotes if present
  value="${value%\"}"
  value="${value#\"}"
  
  # Export the variable
  export "$key=$value"
done < "$ENV_FILE"

# Verify DATABASE_URL is set (critical for remote databases)
if [ -n "$DATABASE_URL" ]; then
  echo -e "${GREEN}✓ DATABASE_URL loaded from $ENV_FILE${NC}"
  echo -e "${GREEN}  Database: $(echo $DATABASE_URL | sed 's/postgresql:\/\/[^@]*@/postgresql:\/\/***:***@/')${NC}"
else
  echo -e "${YELLOW}⚠️  No DATABASE_URL found - using local database config${NC}"
fi
echo ""

# Execute the command
case $COMMAND in
  nuke)
    cd packages/core && npm run db:nuke
    ;;
  migrate)
    cd packages/core && npm run db:migrate
    ;;
  seed)
    cd packages/core && npm run db:seed
    ;;
  seed:demo)
    cd packages/core && npm run db:seed:demo
    ;;
  reset)
    cd packages/core && npm run db:nuke && npm run db:migrate && npm run db:seed
    ;;
  reset:demo)
    cd packages/core && npm run db:nuke && npm run db:migrate && npm run db:seed && npm run db:seed:demo
    ;;
  *)
    echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
    echo ""
    echo "Valid commands: nuke, migrate, seed, seed:demo, reset, reset:demo"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}✅ Database operation completed successfully!${NC}"
