#!/bin/bash
# Mobile Package Verification Script
# Run this after npm install to verify everything is working

set -e

echo "🔍 Verifying Care Commons Mobile Installation..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v)
if [[ "$NODE_VERSION" == v22.* ]]; then
    echo -e "${GREEN}✅ Node.js $NODE_VERSION (Required: 22.x)${NC}"
else
    echo -e "${RED}❌ Node.js $NODE_VERSION (Required: 22.x)${NC}"
    exit 1
fi
echo ""

# Check npm packages are installed
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules exists${NC}"
else
    echo -e "${RED}❌ node_modules not found. Run: npm install${NC}"
    exit 1
fi

if [ -d "node_modules/expo" ]; then
    echo -e "${GREEN}✅ Expo installed${NC}"
else
    echo -e "${RED}❌ Expo not found${NC}"
    exit 1
fi

if [ -d "node_modules/@react-navigation/native" ]; then
    echo -e "${GREEN}✅ React Navigation installed${NC}"
else
    echo -e "${RED}❌ React Navigation not found${NC}"
    exit 1
fi

if [ -d "node_modules/@nozbe/watermelondb" ]; then
    echo -e "${GREEN}✅ WatermelonDB installed${NC}"
else
    echo -e "${RED}❌ WatermelonDB not found${NC}"
    exit 1
fi
echo ""

# Check if shared-components is built
echo "🔧 Checking shared-components..."
if [ -d "../shared-components/dist" ]; then
    echo -e "${GREEN}✅ Shared components built${NC}"
else
    echo -e "${YELLOW}⚠️  Shared components not built. Run: cd ../shared-components && npm run build${NC}"
fi
echo ""

# Verify key files exist
echo "📄 Checking mobile app structure..."
FILES=(
    "src/services/api-client.ts"
    "src/services/auth.ts"
    "src/services/location.ts"
    "src/navigation/RootNavigator.tsx"
    "src/screens/auth/LoginScreen.tsx"
    "src/screens/visits/TodayVisitsScreen.tsx"
    "src/database/schema.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
    fi
done
echo ""

# Check TypeScript configuration
echo "⚙️  Checking TypeScript configuration..."
if [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✅ tsconfig.json exists${NC}"
else
    echo -e "${RED}❌ tsconfig.json missing${NC}"
    exit 1
fi
echo ""

# Run lint
echo "🔍 Running linter..."
if npm run lint > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${YELLOW}⚠️  Linting has warnings (check manually)${NC}"
fi
echo ""

# Check Expo configuration
echo "📱 Checking Expo configuration..."
if [ -f "app.json" ]; then
    echo -e "${GREEN}✅ app.json exists${NC}"
else
    echo -e "${RED}❌ app.json missing${NC}"
    exit 1
fi
echo ""

echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Mobile package verification complete!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "🚀 Next steps:"
echo "   1. Start Expo dev server:  npm run dev"
echo "   2. Run iOS simulator:      npm run ios"
echo "   3. Run Android emulator:   npm run android"
echo ""
echo "📖 Documentation:"
echo "   - MOBILE_FOUNDATION_SUMMARY.md - Architecture details"
echo "   - NEXT_STEPS.md - Implementation guide"
echo ""
echo "🎯 Ready to build for caregivers! 🏥📱"
