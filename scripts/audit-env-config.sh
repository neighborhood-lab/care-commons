#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Environment Configuration Audit${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Required variables for production
REQUIRED_PROD=(
  "DATABASE_URL"
  "VERCEL_TOKEN"
  "VERCEL_ORG_ID"
  "VERCEL_PROJECT_ID"
)

# Required variables for preview
REQUIRED_PREVIEW=(
  "PREVIEW_DATABASE_URL"
)

# Optional but recommended
OPTIONAL=(
  "CORS_ORIGIN"
  "LOG_LEVEL"
  "CODECOV_TOKEN"
  "JWT_SECRET"
  "ENCRYPTION_KEY"
)

# Function to check GitHub secret
check_github_secret() {
  local secret_name=$1

  # Use GitHub CLI if available
  if command -v gh &> /dev/null; then
    # Check if authenticated
    if ! gh auth status &> /dev/null; then
      echo -e "${YELLOW}⚠️  $secret_name (gh CLI not authenticated)${NC}"
      return 2
    fi

    if gh secret list 2>/dev/null | grep -q "^$secret_name"; then
      echo -e "${GREEN}✅ $secret_name${NC}"
      return 0
    else
      echo -e "${RED}❌ $secret_name (MISSING)${NC}"
      return 1
    fi
  else
    echo -e "${YELLOW}⚠️  $secret_name (gh CLI not installed, cannot verify)${NC}"
    return 2
  fi
}

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
  echo -e "${YELLOW}⚠️  GitHub CLI (gh) is not installed${NC}"
  echo "Install it to verify secrets: https://cli.github.com/"
  echo ""
  echo "For manual verification:"
  echo "  GitHub → Settings → Secrets and variables → Actions"
  echo ""
  exit 0
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
  echo -e "${YELLOW}⚠️  GitHub CLI is not authenticated${NC}"
  echo "Run: gh auth login"
  echo ""
  echo "For manual verification:"
  echo "  GitHub → Settings → Secrets and variables → Actions"
  echo ""
  exit 0
fi

# Check production secrets
echo -e "${YELLOW}Production Secrets (GitHub):${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
missing_prod=0
cannot_verify_prod=0

for secret in "${REQUIRED_PROD[@]}"; do
  check_github_secret "$secret"
  result=$?
  if [ $result -eq 1 ]; then
    ((missing_prod++))
  elif [ $result -eq 2 ]; then
    ((cannot_verify_prod++))
  fi
done
echo ""

# Check preview secrets
echo -e "${YELLOW}Preview Secrets (GitHub):${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
missing_preview=0
cannot_verify_preview=0

for secret in "${REQUIRED_PREVIEW[@]}"; do
  check_github_secret "$secret"
  result=$?
  if [ $result -eq 1 ]; then
    ((missing_preview++))
  elif [ $result -eq 2 ]; then
    ((cannot_verify_preview++))
  fi
done
echo ""

# Check optional secrets
echo -e "${YELLOW}Optional Secrets:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for secret in "${OPTIONAL[@]}"; do
  check_github_secret "$secret" || true
done
echo ""

# Check Vercel environment variables (if vercel CLI is available)
if command -v vercel &> /dev/null; then
  echo -e "${YELLOW}Vercel Environment Variables:${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Try to list environment variables
  if vercel env ls 2>/dev/null | grep -q "DATABASE_URL"; then
    echo -e "${GREEN}✅ DATABASE_URL configured in Vercel${NC}"
  else
    echo -e "${YELLOW}⚠️  DATABASE_URL may not be configured in Vercel${NC}"
  fi

  echo ""
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}Summary:${NC}"
echo ""

if [ $cannot_verify_prod -gt 0 ] || [ $cannot_verify_preview -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Could not verify some secrets (gh CLI unavailable or not authenticated)${NC}"
  echo ""
  echo "To verify manually:"
  echo "  1. Go to: GitHub → Settings → Secrets and variables → Actions"
  echo "  2. Verify all required secrets are present"
  echo ""
elif [ $missing_prod -eq 0 ] && [ $missing_preview -eq 0 ]; then
  echo -e "${GREEN}✅ All required secrets configured${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Missing secrets:${NC}"
  echo "  • Production: $missing_prod missing"
  echo "  • Preview: $missing_preview missing"
  echo ""
  echo "To add secrets:"
  echo "  GitHub → Settings → Secrets and variables → Actions → New repository secret"
  echo ""
  echo "Or via CLI:"
  echo "  gh secret set SECRET_NAME"
  echo ""
  exit 1
fi
