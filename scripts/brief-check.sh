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

# Verify Node.js version
NODE_VERSION=$(node --version | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 22 ]; then
  echo "❌ Error: Node.js 22.x or higher is required. Current version: $(node --version)"
  echo "   Please run: nvm install 22 && nvm use 22"
  exit 1
fi

echo "✅ Using Node.js $(node --version)"
echo ""
echo "🚀 Running brief checks (build, lint, typecheck, test with coverage)..."
echo ""

# Run in parallel for speed
echo "📦 Building all packages..."
npm run build

echo "🔍 Running linters..."
npm run lint

echo "🔎 Running type checks..."
npm run typecheck

echo "🧪 Running tests with coverage..."
npm run test:coverage

echo ""
echo "✅ All brief checks passed!"
