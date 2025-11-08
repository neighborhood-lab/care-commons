#!/bin/bash

# Establish performance baselines for Care Commons

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
RESULTS_DIR="tests/load/results"

mkdir -p "${RESULTS_DIR}"

echo "========================================="
echo "Care Commons Performance Baseline Test"
echo "========================================="
echo "Base URL: ${BASE_URL}"
echo "Date: $(date)"
echo ""

# Test 1: Authentication endpoints
echo "Test 1: Authentication Load (10 concurrent users)"
k6 run --out json="${RESULTS_DIR}/auth-load.json" \
  tests/load/scenarios/auth-login.js

# Test 2: EVV check-in/check-out
echo "Test 2: EVV Check-in Load (100 peak concurrent)"
k6 run --out json="${RESULTS_DIR}/evv-load.json" \
  tests/load/scenarios/evv-check-in.js

# Test 3: API endpoints
echo "Test 3: API Endpoints Load (50 concurrent)"
k6 run --out json="${RESULTS_DIR}/api-load.json" \
  tests/load/scenarios/api-endpoints.js

# Test 4: Database stress
echo "Test 4: Database Stress Test"
k6 run --out json="${RESULTS_DIR}/db-load.json" \
  tests/load/scenarios/database-stress.js

# Generate HTML report
echo "Generating HTML report..."
node scripts/generate-load-report.js "${RESULTS_DIR}"

echo ""
echo "========================================="
echo "Performance Baseline Test Complete"
echo "Results saved to: ${RESULTS_DIR}"
echo "========================================="
