#!/bin/bash
set -e

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
  echo "❌ Error: SNYK_TOKEN not set. Please set it in .env or export it."
  exit 1
fi

echo "🔒 Running Snyk dependency scan..."
npx snyk test \
  --org=neighborhood-lab \
  --all-projects \
  --sarif \
  --sarif-file-output=".snyk/snyk-dependency.sarif"

echo "🔒 Running Snyk code scan..."
npx snyk code test \
  --org=neighborhood-lab \
  --sarif \
  --sarif-file-output=".snyk/snyk-code.sarif"

echo "✅ Security scans completed successfully!"
