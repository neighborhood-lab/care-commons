#!/bin/bash

# ════════════════════════════════════════════════════════════════
# Care Commons - Vercel + Neon Deployment Setup Script
# ════════════════════════════════════════════════════════════════
# This script sets up a complete deployment environment on Vercel
# with Neon PostgreSQL database for Care Commons.
#
# Requirements:
# - Vercel CLI installed (npm install -g vercel)
# - Neon CLI installed (npm install -g neonctl)
# - Git repository initialized
# - Node.js 22.x installed
#
# Usage:
#   ./scripts/setup-vercel-deployment.sh [environment]
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
echo -e "${BLUE} Care Commons - Vercel + Neon Deployment Setup${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 1: Verify Prerequisites
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}🔍 Verifying prerequisites...${NC}"

if ! command -v vercel &> /dev/null; then
  echo -e "${RED}❌ Vercel CLI not found${NC}"
  echo -e "${YELLOW}Install with: npm install -g vercel${NC}"
  exit 1
fi

if ! command -v neonctl &> /dev/null; then
  echo -e "${RED}❌ Neon CLI not found${NC}"
  echo -e "${YELLOW}Install with: npm install -g neonctl${NC}"
  exit 1
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
# Step 2: Setup Neon Database
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}📦 Setting up Neon database...${NC}"
echo -e "${YELLOW}You'll need to create a Neon project and database.${NC}"
echo -e "${YELLOW}Visit: https://console.neon.tech${NC}"
echo ""
echo -e "Press Enter after you've created your Neon project..."
read -r

echo ""
echo -e "Enter your Neon project ID (found in project settings):"
read -r NEON_PROJECT_ID

echo -e "Enter your database name (default: care_commons_$ENVIRONMENT):"
read -r DB_NAME
DB_NAME="${DB_NAME:-care_commons_$ENVIRONMENT}"

echo ""
echo -e "${YELLOW}Creating Neon branch: $ENVIRONMENT${NC}"
neonctl branches create --project-id "$NEON_PROJECT_ID" --name "$ENVIRONMENT" || true

echo -e "${GREEN}✅ Neon database configured${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 3: Get Database Connection String
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}🔗 Getting database connection string...${NC}"
echo ""
echo -e "Enter your Neon database connection string:"
echo -e "${YELLOW}Format: postgresql://user:password@host/database?sslmode=require${NC}"
read -r -s DATABASE_URL

echo ""
echo -e "${GREEN}✅ Database connection string saved${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 4: Initialize Vercel Project
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}🚀 Initializing Vercel project...${NC}"

if [ ! -f ".vercel/project.json" ]; then
  echo -e "${YELLOW}Linking to Vercel project...${NC}"
  vercel link
else
  echo -e "${GREEN}✅ Already linked to Vercel project${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
# Step 5: Configure Vercel Environment Variables
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}⚙️  Configuring Vercel environment variables...${NC}"

VERCEL_ENV="preview"
if [ "$ENVIRONMENT" == "production" ]; then
  VERCEL_ENV="production"
fi

echo -e "${YELLOW}Setting DATABASE_URL...${NC}"
echo "$DATABASE_URL" | vercel env add DATABASE_URL "$VERCEL_ENV"

# Generate secrets
echo -e "${YELLOW}Generating JWT secrets...${NC}"
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

echo "$JWT_SECRET" | vercel env add JWT_SECRET "$VERCEL_ENV"
echo "$JWT_REFRESH_SECRET" | vercel env add JWT_REFRESH_SECRET "$VERCEL_ENV"
echo "$SESSION_SECRET" | vercel env add SESSION_SECRET "$VERCEL_ENV"
echo "$ENCRYPTION_KEY" | vercel env add ENCRYPTION_KEY "$VERCEL_ENV"

# Set environment
echo "production" | vercel env add NODE_ENV "$VERCEL_ENV"
echo "$ENVIRONMENT" | vercel env add ENVIRONMENT "$VERCEL_ENV"

echo -e "${GREEN}✅ Environment variables configured${NC}"
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
# Step 7: Build and Deploy
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}🏗️  Building application...${NC}"

npm run build

echo -e "${GREEN}✅ Build complete${NC}"
echo ""

echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"

if [ "$ENVIRONMENT" == "production" ]; then
  DEPLOYMENT_URL=$(vercel deploy --prod)
else
  DEPLOYMENT_URL=$(vercel deploy)
fi

echo -e "${GREEN}✅ Deployment complete${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 8: Verify Deployment
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}🔍 Verifying deployment...${NC}"

sleep 10  # Wait for deployment to stabilize

if curl -f -s "$DEPLOYMENT_URL/health" > /tmp/health-check.json; then
  echo -e "${GREEN}✅ Health check passed${NC}"
  echo ""
  echo "Health check response:"
  cat /tmp/health-check.json | jq '.' || cat /tmp/health-check.json
else
  echo -e "${YELLOW}⚠️  Health check failed (may require authentication)${NC}"
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
echo -e "${BLUE}Platform:${NC} Vercel + Neon"
echo -e "${BLUE}URL:${NC} $DEPLOYMENT_URL"
echo -e "${BLUE}Health Check:${NC} $DEPLOYMENT_URL/health"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Set up GitHub Actions secrets for CI/CD"
echo -e "2. Configure custom domain (if needed)"
echo -e "3. Set up monitoring and alerts"
echo -e "4. Review security settings"
echo ""
echo -e "${YELLOW}GitHub Secrets Needed:${NC}"
echo -e "- VERCEL_TOKEN: Your Vercel API token"
echo -e "- VERCEL_ORG_ID: Your Vercel organization ID"
echo -e "- VERCEL_PROJECT_ID: Your Vercel project ID"
echo -e "- DATABASE_URL: $ENVIRONMENT database connection string"
if [ "$ENVIRONMENT" == "preview" ]; then
  echo -e "- PREVIEW_DATABASE_URL: Preview database connection string"
fi
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
