#!/bin/bash

# Generate HTML report from k6 load test results
# Usage: ./generate-report.sh [scenario-name]

set -e

SCENARIO=${1:-"mixed-workload"}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULTS_DIR="reports"
SCENARIO_FILE="scenarios/${SCENARIO}.ts"

# Ensure reports directory exists
mkdir -p "$RESULTS_DIR"

echo "Running load test: $SCENARIO"
echo "Timestamp: $TIMESTAMP"
echo "================================"

# Check if BASE_URL is set
if [ -z "$BASE_URL" ]; then
  echo "Warning: BASE_URL not set. Using default: http://localhost:3000"
  export BASE_URL="http://localhost:3000"
fi

# Run k6 test with JSON output
k6 run \
  --out json="${RESULTS_DIR}/results-${SCENARIO}-${TIMESTAMP}.json" \
  --summary-export="${RESULTS_DIR}/summary-${SCENARIO}-${TIMESTAMP}.json" \
  "$SCENARIO_FILE"

echo ""
echo "================================"
echo "Test completed!"
echo "Results saved to: ${RESULTS_DIR}/results-${SCENARIO}-${TIMESTAMP}.json"
echo "Summary saved to: ${RESULTS_DIR}/summary-${SCENARIO}-${TIMESTAMP}.json"
echo ""

# Create symlinks to latest results
ln -sf "results-${SCENARIO}-${TIMESTAMP}.json" "${RESULTS_DIR}/latest-results.json"
ln -sf "summary-${SCENARIO}-${TIMESTAMP}.json" "${RESULTS_DIR}/latest-summary.json"

echo "Latest results symlink: ${RESULTS_DIR}/latest-results.json"
echo "Latest summary symlink: ${RESULTS_DIR}/latest-summary.json"
echo ""

# Optional: Convert to HTML if k6-html-reporter is installed
if command -v k6-html-reporter &> /dev/null; then
  echo "Generating HTML report..."
  k6-html-reporter "${RESULTS_DIR}/results-${SCENARIO}-${TIMESTAMP}.json" \
    --output "${RESULTS_DIR}/report-${SCENARIO}-${TIMESTAMP}.html"

  ln -sf "report-${SCENARIO}-${TIMESTAMP}.html" "${RESULTS_DIR}/latest.html"

  echo "HTML report generated: ${RESULTS_DIR}/report-${SCENARIO}-${TIMESTAMP}.html"
  echo "Latest report symlink: ${RESULTS_DIR}/latest.html"
else
  echo "Note: k6-html-reporter not found. Install with: npm install -g k6-html-reporter"
  echo "For now, you can analyze the JSON results manually."
fi

echo ""
echo "To view summary:"
echo "  cat ${RESULTS_DIR}/latest-summary.json | jq ."
echo ""
