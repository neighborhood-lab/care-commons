#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔒 Security Vulnerability Scan${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if npm is available
if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ npm not found${NC}"
  exit 1
fi

# Run npm audit for production dependencies only
echo "▶ Checking for known vulnerabilities in production dependencies..."
echo ""

# Capture audit output
AUDIT_OUTPUT=$(mktemp)

if npm audit --audit-level=moderate --production --json > "$AUDIT_OUTPUT" 2>&1; then
  echo -e "${GREEN}✅ No moderate/high/critical vulnerabilities found in production dependencies${NC}"
  AUDIT_SUCCESS=true
else
  AUDIT_SUCCESS=false
fi

# Parse and display vulnerabilities
if [ "$AUDIT_SUCCESS" = false ]; then
  # Check if jq is available for better formatting
  if command -v jq &> /dev/null; then
    VULNERABILITIES=$(jq -r '.metadata.vulnerabilities | to_entries | map("\(.key): \(.value)") | join(", ")' "$AUDIT_OUTPUT" 2>/dev/null || echo "unknown")
    echo -e "${RED}❌ Vulnerabilities detected:${NC}"
    echo "$VULNERABILITIES"
  else
    echo -e "${RED}❌ Vulnerabilities detected${NC}"
    cat "$AUDIT_OUTPUT"
  fi

  echo ""
  echo -e "${YELLOW}Remediation steps:${NC}"
  echo "1. Review the vulnerabilities: npm audit"
  echo "2. Try automatic fixes: npm audit fix"
  echo "3. For breaking changes: npm audit fix --force (use with caution)"
  echo "4. Manually update packages if needed"
  echo ""

  # Show fix command
  npm audit --production 2>&1 | head -20

  rm -f "$AUDIT_OUTPUT"
  exit 1
fi

rm -f "$AUDIT_OUTPUT"

# Check for outdated critical packages
echo ""
echo "▶ Checking for severely outdated packages..."
echo ""

# Get outdated packages
OUTDATED_OUTPUT=$(mktemp)
npm outdated --json > "$OUTDATED_OUTPUT" 2>/dev/null || true

if [ -s "$OUTDATED_OUTPUT" ] && command -v jq &> /dev/null; then
  # Check if any packages are more than 2 major versions behind
  CRITICAL_OUTDATED=$(jq -r 'to_entries | map(select(.value.current as $c | .value.latest as $l | ($l | split(".")[0] | tonumber) - ($c | split(".")[0] | tonumber) >= 2)) | map(.key) | join(", ")' "$OUTDATED_OUTPUT" 2>/dev/null || echo "")

  if [ -n "$CRITICAL_OUTDATED" ] && [ "$CRITICAL_OUTDATED" != "null" ]; then
    echo -e "${YELLOW}⚠️  Critically outdated packages (2+ major versions behind):${NC}"
    echo "$CRITICAL_OUTDATED"
    echo ""
    echo "Consider updating these packages: npm update"
  else
    echo -e "${GREEN}✅ No critically outdated packages${NC}"
  fi
else
  echo -e "${GREEN}✅ All packages are up to date${NC}"
fi

rm -f "$OUTDATED_OUTPUT"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Security scan completed successfully${NC}"
echo ""
