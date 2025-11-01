#!/bin/bash
set -e

echo "🧹 Cleaning up..."
find . -type f -name "package-lock.json" -exec rm -f {} + 2>/dev/null || true
find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true

echo "📦 Updating dependencies..."
ncu -u --packageFile '**/package.json' --timeout 60000 || echo "⚠️  Dependency update had issues, continuing..."

echo "📥 Installing dependencies..."
npm install --prefer-offline --no-audit

echo "📊 Checking for outdated packages..."
npm outdated || echo "ℹ️  Some packages may be outdated"

echo "🗄️  Setting up database..."
npm run db:nuke
npm run db:migrate
npm run db:seed

echo "🏗️  Building project..."
npm run build

echo "🔍 Running linting..."
npm run lint

echo "🔎 Running type checks..."
npm run typecheck

echo "🧪 Running tests..."
npm test

echo "🔒 Running security scan..."
./scripts/snyk-scan-all.sh || echo "⚠️  Security scan completed with warnings"

echo "✅ All checks completed successfully!"
