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

echo "🧹 Clearing turbo cache..."
npx turbo daemon clean
rm -rf .turbo node_modules/.cache

echo "🧹 Clean install..."
npm ci

echo "🔍 Running linting..."
npx turbo run lint --force

echo "🔎 Running type checks..."
npx turbo run typecheck --force

echo "🧪 Running tests with coverage..."
npx turbo run test:coverage --force --concurrency=4

echo "🏗️  Building project..."
npx turbo run build --force

echo "🗄️  Setting up database with comprehensive demo data..."
npm run db:nuke
npm run db:migrate
npm run db:seed
npm run db:seed:demo

echo "✅ All checks completed successfully!"
