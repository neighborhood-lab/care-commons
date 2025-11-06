#!/bin/bash

# deploy-github-pages.sh
# Builds the showcase and copies it to the root for GitHub Pages deployment
# GitHub Pages is configured to deploy from the develop branch root directory

set -e

echo "🏗️  Building showcase..."
cd "$(dirname "$0")/../showcase"
npm run build

echo "📦 Copying showcase to root for GitHub Pages..."
cd ..
cp -r showcase/dist/* .

echo "✅ GitHub Pages deployment files ready!"
echo "   - index.html and assets/ are now in the root"
echo "   - Commit and push to the develop branch to deploy"
echo ""
echo "Next steps:"
echo "  git add index.html assets/ .nojekyll"
echo "  git commit -m 'deploy: update GitHub Pages showcase'"
echo "  git push origin develop"
