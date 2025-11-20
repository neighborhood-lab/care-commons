#!/bin/bash
# Audit all API endpoints for authentication requirements

BASE_URL="${1:-https://care-commons.vercel.app}"

echo "🔒 Auditing API endpoints for authentication..."
echo "Base URL: $BASE_URL"
echo ""

# Test function
test_endpoint() {
  local method=$1
  local path=$2
  local expected=$3
  local description=$4
  
  local status=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$path")
  
  if [ "$status" = "$expected" ]; then
    echo "✅ $method $path → $status (expected $expected) - $description"
  else
    echo "❌ $method $path → $status (expected $expected) - $description"
  fi
}

echo "📋 Testing Core Endpoints..."
test_endpoint GET /health 200 "Health check (public)"
test_endpoint GET /api/health 200 "API health check (public)"

echo ""
echo "🔐 Testing Authentication Endpoints..."
test_endpoint POST /api/auth/login 400 "Login endpoint (bad request without body)"
test_endpoint POST /api/auth/logout 401 "Logout requires auth"
test_endpoint GET /api/auth/me 401 "Current user requires auth"

echo ""
echo "👤 Testing User Endpoints..."
test_endpoint GET /api/users 401 "List users requires auth"
test_endpoint GET /api/users/123 401 "Get user requires auth"
test_endpoint POST /api/users 401 "Create user requires auth"

echo ""
echo "👥 Testing Client Endpoints (PHI - CRITICAL)..."
test_endpoint GET /api/clients 401 "List clients requires auth"
test_endpoint GET /api/clients/123 401 "Get client requires auth"
test_endpoint POST /api/clients 401 "Create client requires auth"
test_endpoint PUT /api/clients/123 401 "Update client requires auth"
test_endpoint DELETE /api/clients/123 401 "Delete client requires auth"

echo ""
echo "👨‍⚕️ Testing Caregiver Endpoints..."
test_endpoint GET /api/caregivers 401 "List caregivers requires auth"
test_endpoint GET /api/caregivers/123 401 "Get caregiver requires auth"
test_endpoint POST /api/caregivers 401 "Create caregiver requires auth"

echo ""
echo "🏥 Testing Visit Endpoints..."
test_endpoint GET /api/visits 401 "List visits requires auth"
test_endpoint GET /api/visits/123 401 "Get visit requires auth"
test_endpoint POST /api/visits 401 "Create visit requires auth"

echo ""
echo "⏰ Testing EVV Endpoints..."
test_endpoint GET /api/evv/records 401 "List EVV records requires auth"
test_endpoint POST /api/evv/clock-in 401 "Clock in requires auth"
test_endpoint POST /api/evv/clock-out 401 "Clock out requires auth"

echo ""
echo "💰 Testing Billing Endpoints..."
test_endpoint GET /api/billing/invoices 401 "List invoices requires auth"
test_endpoint GET /api/payroll/periods 401 "List payroll periods requires auth"

echo ""
echo "📊 Testing Analytics Endpoints..."
test_endpoint GET /api/analytics/admin 401 "Admin analytics requires auth"
test_endpoint GET /api/analytics/coordinator 401 "Coordinator analytics requires auth"

echo ""
echo "🏢 Testing Organization Endpoints..."
test_endpoint GET /api/organizations 401 "List organizations requires auth"
test_endpoint POST /api/organizations 401 "Create organization requires auth"

echo ""
echo "🔍 Testing Search Endpoints..."
test_endpoint GET /api/search 401 "Search requires auth"

echo ""
echo "📱 Testing Mobile Endpoints..."
test_endpoint POST /api/mobile/sync 401 "Mobile sync requires auth"
test_endpoint GET /api/mobile/offline-data 401 "Offline data requires auth"

echo ""
echo "🔔 Testing Push Notification Endpoints..."
test_endpoint POST /api/push-notifications/register 401 "Register device requires auth"

echo ""
echo "✨ Audit complete!"
