#!/bin/bash

# Ensure we're using the correct Node.js version via NVM
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  source "$NVM_DIR/nvm.sh"
  if [ -f .nvmrc ]; then
    nvm use
  else
    nvm use 22 2>/dev/null || nvm install 22
  fi
fi

mkdir -p .snyk

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

# Define scan types
scan_types=("" "code")

for scan_type in "${scan_types[@]}"; do
  scan_name=${scan_type:-dependency}
  echo "${scan_name} scan"
  if ! npx snyk ${scan_type} test \
    --org=neighborhood-lab \
    --all-projects \
    --include-ignores \
    --sarif \
    --sarif-file-output=".snyk/snyk-${scan_name}.sarif"; then
    echo "⚠️ ${scan_type}scan found issues"
    EXIT_CODE=1
  fi
done

# Exit with error if any scans found issues
if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "⚠️  Security issues found. Check SARIF files for details."
fi

exit $EXIT_CODE
