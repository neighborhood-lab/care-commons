#!/bin/bash
set -e

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
