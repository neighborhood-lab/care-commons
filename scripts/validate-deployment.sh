#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DEPLOYMENT_URL=$1
ENVIRONMENT=${2:-"preview"}

if [ -z "$DEPLOYMENT_URL" ]; then
  echo -e "${RED}❌ Error: Deployment URL is required${NC}"
  echo "Usage: $0 <deployment-url> [environment]"
  exit 1
fi

echo -e "${BLUE}🔍 Validating Deployment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "URL: $DEPLOYMENT_URL"
echo "Environment: $ENVIRONMENT"
echo ""
if [ "$ENVIRONMENT" = "preview" ]; then
  echo -e "${YELLOW}⚠️  Preview environment is behind OAuth - limited validation only${NC}"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Track failures
FAILED_CHECKS=()

# Function to run check with retry
run_check() {
  local name=$1
  local endpoint=$2
  local max_attempts=${3:-3}
  
  echo -e "${YELLOW}▶ Checking: $name${NC}"
  
  for attempt in $(seq 1 $max_attempts); do
    if curl -f -s -m 10 "${DEPLOYMENT_URL}${endpoint}" > /tmp/check-output.txt 2>&1; then
      echo -e "${GREEN}✅ $name - OK${NC}"
      if [ -s /tmp/check-output.txt ]; then
        echo "   Response preview: $(cat /tmp/check-output.txt | head -c 100)..."
      fi
      echo ""
      return 0
    fi
    
    if [ $attempt -lt $max_attempts ]; then
      echo -e "${YELLOW}⚠️  Attempt $attempt/$max_attempts failed, retrying in 5s...${NC}"
      sleep 5
    fi
  done
  
  echo -e "${RED}❌ $name - FAILED after $max_attempts attempts${NC}"
  echo "   Error: $(cat /tmp/check-output.txt 2>/dev/null || echo 'No response')"
  echo ""
  FAILED_CHECKS+=("$name")
  return 1
}

# Wait for deployment to stabilize
echo -e "${BLUE}⏳ Waiting 15 seconds for deployment to stabilize...${NC}"
sleep 15
echo ""

# Critical Checks (based on November 2025 deployment lessons)
echo -e "${BLUE}Running Critical Health Checks${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$ENVIRONMENT" = "production" ]; then
  # Production checks - full validation (no OAuth)
  echo -e "${GREEN}Production environment - running full validation${NC}"
  echo ""
  
  # 1. Health endpoint (database connection) - CRITICAL
  run_check "Health Endpoint (Database)" "/health" 5 || true
  
  # 2. API root (ESM import resolution check)
  run_check "API Root (ESM Resolution)" "/api" 3 || true
  
  # 3. Frontend root (SPA routing check)
  run_check "Frontend Root (SPA Bundle)" "/" 3 || true
  
  # 4. Verify static assets are being served (check for HTML in response)
  echo -e "${YELLOW}▶ Checking: Static Assets Serving${NC}"
  if curl -s -m 10 "$DEPLOYMENT_URL/" | grep -q "<script"; then
    echo -e "${GREEN}✅ Static Assets Serving - OK${NC}"
    echo "   Vite build artifacts detected in HTML"
  else
    echo -e "${RED}❌ Static Assets Serving - FAILED${NC}"
    FAILED_CHECKS+=("Static Assets")
  fi
  echo ""
  
else
  # Preview checks - limited (OAuth protected)
  echo -e "${YELLOW}Preview environment - OAuth protected, basic validation only${NC}"
  echo ""
  
  # Just verify deployment exists and responds (will get OAuth redirect)
  echo -e "${YELLOW}▶ Checking: Deployment Reachability${NC}"
  if curl -s -m 10 -I "$DEPLOYMENT_URL" | grep -q "HTTP"; then
    echo -e "${GREEN}✅ Deployment is reachable${NC}"
    echo "   Note: OAuth protection is active (expected for preview)"
  else
    echo -e "${RED}❌ Deployment is not reachable${NC}"
    FAILED_CHECKS+=("Deployment Reachability")
  fi
  echo ""
  
  echo -e "${BLUE}ℹ️  Preview deployments require OAuth authentication${NC}"
  echo "   Manual verification required for full health check"
  echo "   - Visit: $DEPLOYMENT_URL"
  echo "   - Authenticate with GitHub"
  echo "   - Verify: Health endpoint, login flow, navigation"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Report results
if [ ${#FAILED_CHECKS[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ All deployment checks passed!${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}❌ ${#FAILED_CHECKS[@]} check(s) failed:${NC}"
  for check in "${FAILED_CHECKS[@]}"; do
    echo "  • $check"
  done
  echo ""
  echo -e "${YELLOW}⚠️  Deployment may have issues - manual verification recommended${NC}"
  echo ""
  exit 1
fi
