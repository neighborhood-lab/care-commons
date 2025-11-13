#!/bin/bash

# ════════════════════════════════════════════════════════════════
# Care Commons - Cloudflare + Supabase Deployment Setup Script
# ════════════════════════════════════════════════════════════════
# This script sets up a complete deployment environment on Cloudflare
# with Supabase PostgreSQL database for Care Commons.
#
# Requirements:
# - Wrangler CLI installed (npm install -g wrangler)
# - Supabase CLI installed (npm install -g supabase)
# - Git repository initialized
# - Node.js 22.x installed
# - Cloudflare account with Workers enabled
#
# Usage:
#   ./scripts/setup-cloudflare-deployment.sh [environment]
#
# Arguments:
#   environment: preview or production (default: preview)
#
# ════════════════════════════════════════════════════════════════

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT="${1:-preview}"

if [ "$ENVIRONMENT" != "preview" ] && [ "$ENVIRONMENT" != "production" ]; then
  echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
  echo -e "${YELLOW}Usage: $0 [preview|production]${NC}"
  exit 1
fi

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} Care Commons - Cloudflare + Supabase Deployment Setup${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 1: Verify Prerequisites
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}🔍 Verifying prerequisites...${NC}"

if ! command -v wrangler &> /dev/null; then
  echo -e "${RED}❌ Wrangler CLI not found${NC}"
  echo -e "${YELLOW}Install with: npm install -g wrangler${NC}"
  exit 1
fi

if ! command -v supabase &> /dev/null; then
  echo -e "${YELLOW}⚠️  Supabase CLI not found (optional but recommended)${NC}"
  echo -e "${YELLOW}Install with: npm install -g supabase${NC}"
fi

if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js not found${NC}"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  echo -e "${RED}❌ Node.js 22.x or higher required (found: $(node -v))${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Prerequisites verified${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 2: Authenticate with Cloudflare
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}🔐 Authenticating with Cloudflare...${NC}"

if ! wrangler whoami &> /dev/null; then
  echo -e "${YELLOW}Please log in to Cloudflare:${NC}"
  wrangler login
else
  echo -e "${GREEN}✅ Already authenticated with Cloudflare${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
# Step 3: Setup Supabase Database
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}📦 Setting up Supabase database...${NC}"
echo -e "${YELLOW}You'll need to create a Supabase project.${NC}"
echo -e "${YELLOW}Visit: https://supabase.com/dashboard${NC}"
echo ""
echo -e "Press Enter after you've created your Supabase project..."
read -r

echo ""
echo -e "Enter your Supabase project reference ID (found in project settings):"
read -r SUPABASE_PROJECT_REF

echo -e "Enter your Supabase database password:"
read -r -s SUPABASE_DB_PASSWORD

echo ""

# Construct Supabase connection string (pooler)
SUPABASE_HOST="aws-0-us-east-1.pooler.supabase.com"
SUPABASE_PORT="6543"
SUPABASE_DB="postgres"
DATABASE_URL="postgresql://postgres.$SUPABASE_PROJECT_REF:$SUPABASE_DB_PASSWORD@$SUPABASE_HOST:$SUPABASE_PORT/$SUPABASE_DB?pgbouncer=true"

echo -e "${GREEN}✅ Supabase configured${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 4: Create Hyperdrive Configuration (CRITICAL)
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}⚡ Creating Hyperdrive configuration...${NC}"
echo -e "${YELLOW}Hyperdrive provides connection pooling for Postgres${NC}"

HYPERDRIVE_NAME="care-commons-db-$ENVIRONMENT"

echo -e "${YELLOW}Creating Hyperdrive: $HYPERDRIVE_NAME${NC}"

# Escape special characters for command line
ESCAPED_DB_URL=$(echo "$DATABASE_URL" | sed 's/\$/\\$/g' | sed 's/!/\\!/g')

HYPERDRIVE_OUTPUT=$(wrangler hyperdrive create "$HYPERDRIVE_NAME" \
  --connection-string="$ESCAPED_DB_URL" 2>&1 || true)

if echo "$HYPERDRIVE_OUTPUT" | grep -q "id"; then
  HYPERDRIVE_ID=$(echo "$HYPERDRIVE_OUTPUT" | grep "id" | awk '{print $NF}' | tr -d '"')
  echo -e "${GREEN}✅ Hyperdrive created: $HYPERDRIVE_ID${NC}"
  
  echo ""
  echo -e "${YELLOW}Add this to your wrangler.toml:${NC}"
  echo ""
  echo "[[hyperdrive]]"
  echo "binding = \"HYPERDRIVE\""
  echo "id = \"$HYPERDRIVE_ID\""
  echo ""
else
  echo -e "${YELLOW}⚠️  Hyperdrive may already exist or creation failed${NC}"
  echo -e "${YELLOW}List existing Hyperdrives: wrangler hyperdrive list${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
# Step 5: Configure Cloudflare Secrets
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}🔐 Configuring Cloudflare secrets...${NC}"

WRANGLER_ENV="preview"
if [ "$ENVIRONMENT" == "production" ]; then
  WRANGLER_ENV="production"
fi

# Set DATABASE_URL
echo -e "${YELLOW}Setting DATABASE_URL secret...${NC}"
echo "$DATABASE_URL" | wrangler secret put DATABASE_URL --env "$WRANGLER_ENV"

# Generate and set authentication secrets
echo -e "${YELLOW}Generating JWT secrets...${NC}"
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

echo "$JWT_SECRET" | wrangler secret put JWT_SECRET --env "$WRANGLER_ENV"
echo "$JWT_REFRESH_SECRET" | wrangler secret put JWT_REFRESH_SECRET --env "$WRANGLER_ENV"
echo "$SESSION_SECRET" | wrangler secret put SESSION_SECRET --env "$WRANGLER_ENV"
echo "$ENCRYPTION_KEY" | wrangler secret put ENCRYPTION_KEY --env "$WRANGLER_ENV"

# Set Supabase keys
echo -e "${YELLOW}Enter your Supabase project URL (e.g., https://xxxxx.supabase.co):${NC}"
read -r SUPABASE_URL

echo -e "${YELLOW}Enter your Supabase anon key (from API settings):${NC}"
read -r SUPABASE_ANON_KEY

echo "$SUPABASE_URL" | wrangler secret put SUPABASE_URL --env "$WRANGLER_ENV"
echo "$SUPABASE_ANON_KEY" | wrangler secret put SUPABASE_ANON_KEY --env "$WRANGLER_ENV"

echo -e "${GREEN}✅ Secrets configured${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 6: Run Database Migrations
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}🗄️  Running database migrations...${NC}"

export DATABASE_URL
npm run db:migrate

echo -e "${GREEN}✅ Migrations complete${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 7: Build Application
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}🏗️  Building application...${NC}"

npm run build

echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 8: Deploy Workers
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}🚀 Deploying Cloudflare Workers...${NC}"

wrangler deploy --env "$WRANGLER_ENV"

echo -e "${GREEN}✅ Workers deployed${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 9: Deploy Pages (Frontend)
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}🌐 Deploying Cloudflare Pages...${NC}"

wrangler pages deploy packages/web/dist \
  --project-name="care-commons-web" \
  --branch="$WRANGLER_ENV"

echo -e "${GREEN}✅ Pages deployed${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 10: Verify Deployment
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}🔍 Verifying deployment...${NC}"

WORKER_URL="https://care-commons-api"
if [ "$ENVIRONMENT" != "production" ]; then
  WORKER_URL="$WORKER_URL-$ENVIRONMENT"
fi
WORKER_URL="$WORKER_URL.your-subdomain.workers.dev"

echo -e "${YELLOW}Worker URL (update with your actual subdomain): $WORKER_URL${NC}"
echo ""

sleep 15  # Wait for propagation

echo -e "${YELLOW}Attempting health check...${NC}"
if curl -f -s "$WORKER_URL/health" > /tmp/health-check.json 2>/dev/null; then
  echo -e "${GREEN}✅ Health check passed${NC}"
  echo ""
  echo "Health check response:"
  cat /tmp/health-check.json | jq '.' || cat /tmp/health-check.json
else
  echo -e "${YELLOW}⚠️  Health check failed (may require authentication or URL correction)${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
# Summary
# ════════════════════════════════════════════════════════════════
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Environment:${NC} $ENVIRONMENT"
echo -e "${BLUE}Platform:${NC} Cloudflare Workers + Supabase"
echo -e "${BLUE}Workers URL:${NC} (Check wrangler dashboard)"
echo -e "${BLUE}Pages URL:${NC} (Check Cloudflare Pages dashboard)"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Update wrangler.toml with Hyperdrive ID"
echo -e "2. Configure custom domain (optional)"
echo -e "3. Set up GitHub Actions secrets for CI/CD"
echo -e "4. Set up monitoring and alerts"
echo -e "5. Review security settings"
echo ""
echo -e "${YELLOW}GitHub Secrets Needed:${NC}"
echo -e "- CLOUDFLARE_API_TOKEN: Your Cloudflare API token"
echo -e "- CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID"
echo -e "- SUPABASE_DATABASE_URL: $ENVIRONMENT database connection string"
if [ "$ENVIRONMENT" == "preview" ]; then
  echo -e "- SUPABASE_DATABASE_URL_PREVIEW: Preview database connection string"
fi
echo -e "- SUPABASE_ACCESS_TOKEN: Supabase access token (optional)"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "- List secrets: wrangler secret list --env $WRANGLER_ENV"
echo -e "- View logs: wrangler tail --env $WRANGLER_ENV"
echo -e "- List Hyperdrives: wrangler hyperdrive list"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
