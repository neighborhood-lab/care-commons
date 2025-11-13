#!/bin/bash
# ════════════════════════════════════════════════════════════════
# Cloudflare + Supabase Deployment Setup Script
# ════════════════════════════════════════════════════════════════
# This script helps you set up Care Commons for Cloudflare + Supabase deployment
#
# Prerequisites:
# - Node.js 22.x installed
# - npm 10.9.4+ installed
# - Cloudflare account created
# - Supabase account created

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════"
echo " Care Commons - Cloudflare + Supabase Setup"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" != "22" ]; then
  echo -e "${RED}❌ Node.js 22.x required. Current: $(node --version)${NC}"
  echo "Install with: nvm install 22 && nvm use 22"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check npm version
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm ${NPM_VERSION}${NC}"

# Check if wrangler CLI is installed
if ! command -v wrangler &> /dev/null; then
  echo -e "${YELLOW}⚠️  Wrangler CLI not found. Installing...${NC}"
  npm install -g wrangler@latest
fi
echo -e "${GREEN}✅ Wrangler CLI installed${NC}"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"
  npm install -g supabase
fi
echo -e "${GREEN}✅ Supabase CLI installed${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Step 1: Supabase Database Setup"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "Setting up Supabase project..."
echo ""

# Supabase project details
SUPABASE_PROJECT_REF="aoxifllwcujpinwfaxmu"
SUPABASE_PASSWORD="-Q\$gsyPD788qv!S"

echo -e "${BLUE}Your Supabase project:${NC}"
echo "Project Ref: $SUPABASE_PROJECT_REF"
echo "Dashboard: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF"
echo ""

# Build connection strings
SUPABASE_DIRECT="postgres://postgres:${SUPABASE_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"
SUPABASE_POOLER="postgres://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

echo -e "${GREEN}✅ Supabase connection strings configured${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Step 2: Cloudflare Setup"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "Logging into Cloudflare..."
wrangler login

echo ""
CLOUDFLARE_ACCOUNT_ID=$(wrangler whoami | grep "Account ID" | awk '{print $3}')
echo -e "${GREEN}✅ Cloudflare Account ID: $CLOUDFLARE_ACCOUNT_ID${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Step 3: Create Hyperdrive Configuration"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo -e "${YELLOW}⚠️  CRITICAL: Hyperdrive is required for Postgres from Workers${NC}"
echo ""
echo "Creating Hyperdrive configuration..."
echo "This will create a connection pool for your Supabase database"
echo ""

# Note: Special characters need escaping in the command line
HYPERDRIVE_CONNECTION="postgres://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

echo "Running: wrangler hyperdrive create care-commons-db"
HYPERDRIVE_OUTPUT=$(wrangler hyperdrive create care-commons-db --connection-string="$HYPERDRIVE_CONNECTION" 2>&1)

# Extract Hyperdrive ID from output
HYPERDRIVE_ID=$(echo "$HYPERDRIVE_OUTPUT" | grep -oE 'id = "[^"]*"' | cut -d'"' -f2)

if [ -z "$HYPERDRIVE_ID" ]; then
  echo -e "${RED}❌ Failed to create Hyperdrive${NC}"
  echo "Output: $HYPERDRIVE_OUTPUT"
  echo ""
  echo "You may need to create it manually:"
  echo "wrangler hyperdrive create care-commons-db \\"
  echo "  --connection-string=\"$HYPERDRIVE_CONNECTION\""
  exit 1
fi

echo -e "${GREEN}✅ Hyperdrive created${NC}"
echo "Hyperdrive ID: $HYPERDRIVE_ID"

echo ""
echo "Updating wrangler.toml with Hyperdrive ID..."
# Update wrangler.toml
sed -i.bak "s/# id = \"REPLACE_WITH_YOUR_HYPERDRIVE_ID\"/id = \"$HYPERDRIVE_ID\"/" wrangler.toml
sed -i.bak "s/# \[\[hyperdrive\]\]/[[hyperdrive]]/" wrangler.toml
sed -i.bak "s/# binding = \"HYPERDRIVE\"/binding = \"HYPERDRIVE\"/" wrangler.toml

echo -e "${GREEN}✅ wrangler.toml updated${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Step 4: Generate Secrets"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "Generating secure secrets..."

JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

echo -e "${GREEN}✅ Secrets generated${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Step 5: Set Cloudflare Worker Secrets"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "Setting Worker secrets..."

# Set secrets
echo "$JWT_SECRET" | wrangler secret put JWT_SECRET
echo "$JWT_REFRESH_SECRET" | wrangler secret put JWT_REFRESH_SECRET
echo "$SESSION_SECRET" | wrangler secret put SESSION_SECRET
echo "$ENCRYPTION_KEY" | wrangler secret put ENCRYPTION_KEY

echo ""
echo -e "${BLUE}Get your Supabase API keys:${NC}"
echo "1. Go to: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/settings/api"
echo "2. Copy 'anon public' key"
echo ""
read -p "Paste your Supabase ANON_KEY: " SUPABASE_ANON_KEY
echo "$SUPABASE_ANON_KEY" | wrangler secret put SUPABASE_ANON_KEY

echo ""
echo "3. Copy 'service_role' key (keep this secret!)"
read -s -p "Paste your Supabase SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY
echo ""
echo "$SUPABASE_SERVICE_ROLE_KEY" | wrangler secret put SUPABASE_SERVICE_ROLE_KEY

SUPABASE_URL="https://${SUPABASE_PROJECT_REF}.supabase.co"
echo "$SUPABASE_URL" | wrangler secret put SUPABASE_URL

echo ""
echo -e "${GREEN}✅ Worker secrets configured${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Step 6: Run Database Migrations"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "Running database migrations..."
export DATABASE_URL="$SUPABASE_DIRECT"
npm run db:migrate

echo ""
echo -e "${GREEN}✅ Migrations completed${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Step 7: Seed Demo Data (Optional)"
echo "════════════════════════════════════════════════════════════════"
echo ""

read -p "Do you want to seed demo data? (y/n): " SEED_DATA

if [ "$SEED_DATA" == "y" ]; then
  echo "Seeding demo data..."
  npm run db:seed:demo
  echo -e "${GREEN}✅ Demo data seeded${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Step 8: Deploy to Cloudflare"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "Building project..."
npm run build

echo ""
read -p "Deploy Workers now? (y/n): " DEPLOY_WORKERS

if [ "$DEPLOY_WORKERS" == "y" ]; then
  echo "Deploying Cloudflare Workers..."
  wrangler deploy --env production
  
  echo ""
  echo -e "${GREEN}✅ Workers deployed!${NC}"
fi

echo ""
read -p "Deploy Pages now? (y/n): " DEPLOY_PAGES

if [ "$DEPLOY_PAGES" == "y" ]; then
  echo "Creating Pages project..."
  wrangler pages project create care-commons-web || echo "Project may already exist"
  
  echo ""
  echo "Deploying Cloudflare Pages..."
  wrangler pages deploy public --project-name=care-commons-web --branch=main
  
  echo ""
  echo -e "${GREEN}✅ Pages deployed!${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Setup Complete! 🎉"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Your Cloudflare + Supabase deployment is ready!"
echo ""
echo "Key Information:"
echo "─────────────────────────────────────────────────────────────"
echo "Supabase Project: $SUPABASE_PROJECT_REF"
echo "Supabase Dashboard: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF"
echo "Cloudflare Account: $CLOUDFLARE_ACCOUNT_ID"
echo "Hyperdrive ID: $HYPERDRIVE_ID"
echo ""
echo "Next steps:"
echo "1. Test Workers: https://care-commons-api.your-subdomain.workers.dev/health"
echo "2. Test Pages: https://care-commons-web.pages.dev"
echo "3. Configure custom domain (optional)"
echo "4. Set up GitHub Actions for automatic deployments"
echo ""
echo "GitHub Secrets to add:"
echo "─────────────────────────────────────────────────────────────"
echo "CLOUDFLARE_API_TOKEN - Get from Cloudflare Dashboard"
echo "CLOUDFLARE_ACCOUNT_ID - $CLOUDFLARE_ACCOUNT_ID"
echo "SUPABASE_ACCESS_TOKEN - Get from Supabase Dashboard"
echo "SUPABASE_PROJECT_ID - $SUPABASE_PROJECT_REF"
echo "SUPABASE_DB_PASSWORD - $SUPABASE_PASSWORD"
echo "SUPABASE_DATABASE_URL - $SUPABASE_POOLER"
echo "SUPABASE_ANON_KEY - $SUPABASE_ANON_KEY"
echo "SUPABASE_SERVICE_ROLE_KEY - (already set)"
echo ""
echo "Documentation: /docs/DEPLOYMENT_SETUP_COMPLETE.md"
echo ""
