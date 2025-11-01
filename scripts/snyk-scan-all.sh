#!/bin/bash

mkdir -p .sarif

# Source environment variables if .env exists (for local use)
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Check if SNYK_TOKEN is set
if [ -z "$SNYK_TOKEN" ]; then
  echo "Error: SNYK_TOKEN not set. Please set it in .env or export it."
  exit 1
fi

# Track if any scans failed
EXIT_CODE=0

# Define projects from your monorepo
projects=(
  "@care-commons/platform:."
  "@care-commons/app:packages/app"
  "@care-commons/core:packages/core"
  "@care-commons/web:packages/web"
  "@care-commons/billing-invoicing:verticals/billing-invoicing"
  "@care-commons/care-plans-tasks:verticals/care-plans-tasks"
  "@care-commons/caregiver-staff:verticals/caregiver-staff"
  "@care-commons/client-demographics:verticals/client-demographics"
  "@care-commons/payroll-processing:verticals/payroll-processing"
  "@care-commons/scheduling-visits:verticals/scheduling-visits"
  "@care-commons/shift-matching:verticals/shift-matching"
  "@care-commons/time-tracking-evv:verticals/time-tracking-evv"
)

# Define scan types
scan_types=("" "code")

echo "Starting Snyk scans for all projects..."

for project_entry in "${projects[@]}"; do
  IFS=':' read -r project_name project_path <<< "$project_entry"
  
  echo ""
  echo "======================================"
  echo "Scanning: $project_name"
  echo "Path: $project_path"
  echo "======================================"
  
  for scan_type in "${scan_types[@]}"; do
    if [ -z "$scan_type" ]; then
      # Dependency scan
      echo "Running dependency scan..."
      safe_name=$(echo "$project_name" | sed 's/@//g' | sed 's/\//-/g')
      if ! npx snyk test \
        --org=neighborhood-lab \
        --project-name="$project_name" \
        --file="$project_path/package.json" \
        --include-ignores \
        --report \
        --sarif \
        --sarif-file-output=".sarif/snyk-deps-${safe_name}.sarif"; then
        echo "⚠️  Dependency scan found issues for $project_name"
        EXIT_CODE=1
      fi
    else
      # Code scan
      echo "Running code scan..."
      safe_name=$(echo "$project_name" | sed 's/@//g' | sed 's/\//-/g')
      if ! npx snyk code test "$project_path" \
        --org=neighborhood-lab \
        --project-name="$project_name" \
        --include-ignores \
        --report \
        --sarif \
        --sarif-file-output=".sarif/snyk-code-${safe_name}.sarif"; then
        echo "⚠️  Code scan found issues for $project_name"
        EXIT_CODE=1
      fi
    fi
  done
done

echo ""
echo "======================================"
echo "All scans completed!"
echo "SARIF files generated in current directory"
echo "======================================"

# Exit with error if any scans found issues
if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "⚠️  Security issues found. Check SARIF files for details."
fi

exit $EXIT_CODE
