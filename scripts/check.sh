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

# Check if ncu is installed
if ! command -v ncu &> /dev/null; then
  echo "❌ Error: ncu (npm-check-updates) not found"
  echo "   Please run: npm install -g npm-check-updates"
  exit 1
fi

echo "🧹 Cleaning up..."
find . -type f -name "package-lock.json" -exec rm -f {} + 2>/dev/null || true
find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true

echo "📦 Updating dependencies..."
ncu -u --packageFile '**/package.json' --timeout 60000 --reject 'npm,@care-commons/*'

echo "🔧 Regenerating lockfile..."
npm install --package-lock-only --ignore-scripts

echo "📥 Installing dependencies..."
npm install --prefer-offline --no-audit

echo "📊 Checking for outdated packages..."
npm outdated || echo "ℹ️  Some packages may be outdated"

echo "🗄️  Setting up database..."
npm run db:nuke
npm run db:migrate
npm run db:seed
npm run db:seed:demo

echo "🏗️  Building project..."
npx turbo run build

echo "🔍 Running linting..."
npx turbo run lint

echo "🔎 Running type checks..."
npx turbo run typecheck

echo "🧪 Running tests with coverage..."
npx turbo run test:coverage

echo "✅ All checks completed successfully!"
