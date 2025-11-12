#!/bin/bash
# ════════════════════════════════════════════════════════════════
# Vercel + Neon Deployment Setup Script
# ════════════════════════════════════════════════════════════════
# This script helps you set up Care Commons for Vercel + Neon deployment
#
# Prerequisites:
# - Node.js 22.x installed
# - npm 10.9.4+ installed
# - Vercel account created
# - Neon account created

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════"
echo " Care Commons - Vercel + Neon Setup"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
  npm install -g vercel@latest
fi
echo -e "${GREEN}✅ Vercel CLI installed${NC}"

# Check if neon CLI is installed
if ! command -v neon &> /dev/null; then
  echo -e "${YELLOW}⚠️  Neon CLI not found. Installing...${NC}"
  npm install -g @neondatabase/cli
fi
echo -e "${GREEN}✅ Neon CLI installed${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Step 1: Neon Database Setup"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "First, let's set up your Neon database."
echo ""
read -p "Have you already created a Neon project? (y/n): " NEON_EXISTS

if [ "$NEON_EXISTS" != "y" ]; then
  echo ""
  echo "Logging into Neon..."
  neon auth
  
  echo ""
  echo "Creating Neon project..."
  read -p "Enter project name (e.g., care-commons-prod): " NEON_PROJECT_NAME
  neon projects create --name "$NEON_PROJECT_NAME"
  
  echo ""
  echo -e "${GREEN}✅ Neon project created${NC}"
  echo "Note: Save your project ID from the output above"
fi

echo ""
read -p "Enter your Neon project ID: " NEON_PROJECT_ID

echo ""
echo "Fetching Neon connection strings..."
echo "You'll need TWO connection strings:"
echo "1. POOLED connection (for serverless functions)"
echo "2. DIRECT connection (for migrations)"
echo ""

# Get connection strings
POOLED_URL=$(neon connection-string "$NEON_PROJECT_ID" --pooled)
DIRECT_URL=$(neon connection-string "$NEON_PROJECT_ID")

echo -e "${GREEN}✅ Connection strings retrieved${NC}"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo " Step 2: Vercel Project Setup"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "Logging into Vercel..."
vercel login

echo ""
echo "Linking Vercel project..."
vercel link

echo ""
echo -e "${GREEN}✅ Vercel project linked${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Step 3: Generate Secrets"
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
echo " Step 4: Configure Vercel Environment Variables"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "Setting production environment variables..."

# Set environment variables
echo "$POOLED_URL" | vercel env add DATABASE_URL production
echo "$DIRECT_URL" | vercel env add DATABASE_URL_UNPOOLED production
echo "$JWT_SECRET" | vercel env add JWT_SECRET production
echo "$JWT_REFRESH_SECRET" | vercel env add JWT_REFRESH_SECRET production
echo "$SESSION_SECRET" | vercel env add SESSION_SECRET production
echo "$ENCRYPTION_KEY" | vercel env add ENCRYPTION_KEY production

echo ""
read -p "Do you want to set preview environment variables too? (y/n): " SET_PREVIEW

if [ "$SET_PREVIEW" == "y" ]; then
  echo "Setting preview environment variables..."
  echo "$POOLED_URL" | vercel env add DATABASE_URL preview
  echo "$DIRECT_URL" | vercel env add DATABASE_URL_UNPOOLED preview
  echo "$JWT_SECRET" | vercel env add JWT_SECRET preview
  echo "$JWT_REFRESH_SECRET" | vercel env add JWT_REFRESH_SECRET preview
  echo "$SESSION_SECRET" | vercel env add SESSION_SECRET preview
  echo "$ENCRYPTION_KEY" | vercel env add ENCRYPTION_KEY preview
fi

echo ""
echo -e "${GREEN}✅ Environment variables configured${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Step 5: Run Database Migrations"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "Running database migrations..."
export DATABASE_URL="$DIRECT_URL"
npm run db:migrate

echo ""
echo -e "${GREEN}✅ Migrations completed${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Step 6: Seed Demo Data (Optional)"
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
echo " Step 7: Test Deployment"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "Building project..."
npm run build

echo ""
read -p "Deploy to Vercel now? (y/n): " DEPLOY_NOW

if [ "$DEPLOY_NOW" == "y" ]; then
  echo "Deploying to Vercel..."
  vercel deploy --prod
  
  echo ""
  echo -e "${GREEN}✅ Deployment complete!${NC}"
  echo ""
  echo "Visit your deployment URL to verify"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Setup Complete! 🎉"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Visit your Vercel deployment URL"
echo "2. Test the health endpoint: https://your-app.vercel.app/health"
echo "3. Log in with demo credentials"
echo "4. Configure GitHub Actions for automatic deployments"
echo ""
echo "GitHub Secrets to add:"
echo "- VERCEL_TOKEN (get from: vercel token)"
echo "- VERCEL_ORG_ID (in .vercel/project.json)"
echo "- VERCEL_PROJECT_ID (in .vercel/project.json)"
echo "- DATABASE_URL (Neon pooled connection)"
echo "- PREVIEW_DATABASE_URL (Neon preview pooled connection)"
echo ""
echo "Documentation: /docs/DEPLOYMENT_SETUP_COMPLETE.md"
echo ""
